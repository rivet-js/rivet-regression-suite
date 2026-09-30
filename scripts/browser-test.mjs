import { readFile, readdir, mkdtemp, rm } from "node:fs/promises";
import { spawn, execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const suiteRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const rivetRoot = resolve(suiteRoot, "../rivet");
const srcRoot = resolve(rivetRoot, "src");

async function collectJs(dir) {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) out.push(...await collectJs(full));
        else if (entry.isFile() && entry.name.endsWith(".js")) out.push(full);
    }
    return out;
}

const files = await collectJs(srcRoot);
const sources = {};
const deps = {};
const importPattern = /\b(?:from\s*|import\s*)["'](\.{1,2}\/[^"']+)["']/g;
for (const file of files) {
    const key = relative(srcRoot, file).split("\\").join("/");
    const source = await readFile(file, "utf8");
    sources[key] = source;
    deps[key] = [];
    for (const match of source.matchAll(importPattern)) {
        const target = posix.normalize(posix.join(posix.dirname(key), match[1]));
        deps[key].push([match[1], target]);
    }
}

const order = [];
const visiting = new Set();
const visited = new Set();
function visit(key) {
    if (visited.has(key)) return;
    if (visiting.has(key)) throw new Error(`Unexpected module cycle at ${key}`);
    visiting.add(key);
    for (const [, target] of deps[key] ?? []) visit(target);
    visiting.delete(key);
    visited.add(key);
    order.push(key);
}
visit("index.js");

const moduleUrls = {};
for (const key of order) {
    let source = sources[key];
    for (const [specifier, target] of deps[key]) {
        source = source.split('"' + specifier + '"').join('"' + moduleUrls[target] + '"');
        source = source.split("'" + specifier + "'").join("'" + moduleUrls[target] + "'");
    }
    moduleUrls[key] = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}
const bootstrap = `<script>globalThis.__rivetEntry = ${JSON.stringify(moduleUrls["index.js"])};<\/script>`;
const fixture = await readFile(resolve(suiteRoot, "browser/certification.html"), "utf8");
const html = fixture.replace('<script type="module">', `${bootstrap}\n<script type="module">`);

function waitForDevTools(child) {
    return new Promise((resolveWs, reject) => {
        let stderr = "";
        const timer = setTimeout(() => reject(new Error(`Chromium did not expose DevTools\n${stderr.slice(-2000)}`)), 10000);
        child.stderr.on("data", (chunk) => {
            stderr += chunk;
            const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
            if (match) { clearTimeout(timer); resolveWs(match[1]); }
        });
        child.on("error", reject);
        child.on("exit", (code) => { if (code !== null && code !== 0) reject(new Error(`Chromium exited early (${code})`)); });
    });
}

function cdpClient(wsUrl) {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    const ready = new Promise((resolveReady, reject) => {
        ws.addEventListener("open", resolveReady, { once: true });
        ws.addEventListener("error", reject, { once: true });
    });
    ws.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (!message.id || !pending.has(message.id)) return;
        const waiter = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) waiter.reject(new Error(message.error.message));
        else waiter.resolve(message.result);
    });
    return {
        async send(method, params = {}) {
            await ready;
            const commandId = ++id;
            return new Promise((resolveCommand, reject) => {
                pending.set(commandId, { resolve: resolveCommand, reject });
                ws.send(JSON.stringify({ id: commandId, method, params }));
            });
        },
        close() { ws.close(); }
    };
}

const profile = await mkdtemp(join(tmpdir(), "rivet-chromium-"));
const chromium = process.env.CHROMIUM || "/usr/bin/chromium";
const browserVersion = execFileSync(chromium, ["--version"], { encoding: "utf8" }).trim();
const child = spawn(chromium, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"
], { stdio: ["ignore", "ignore", "pipe"] });

try {
    const browserWs = await waitForDevTools(child);
    const browserHttp = browserWs.replace(/^ws:/, "http:").replace(/\/devtools\/browser\/.*$/, "");
    const targets = await fetch(`${browserHttp}/json/list`).then((response) => response.json());
    const target = targets.find((entry) => entry.type === "page");
    if (!target) throw new Error("Chromium did not expose a page target");
    const cdp = cdpClient(target.webSocketDebuggerUrl);
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    const tree = await cdp.send("Page.getFrameTree");
    await cdp.send("Page.setDocumentContent", { frameId: tree.frameTree.frame.id, html });

    const deadline = Date.now() + 15000;
    let state = "running";
    let error = "";
    while (Date.now() < deadline) {
        const result = await cdp.send("Runtime.evaluate", {
            expression: '({state: document.body?.dataset.rivetBrowser || "loading", error: document.body?.dataset.error || ""})',
            returnByValue: true
        });
        state = result.result.value.state;
        error = result.result.value.error;
        if (state === "pass" || state === "fail") break;
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
    }
    cdp.close();
    if (state !== "pass") throw new Error(`Browser certification ${state}${error ? `: ${error}` : ""}`);
    console.log(`Rivet browser certification: PASS (${browserVersion})`);
} finally {
    child.kill("SIGKILL");
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 150));
    try { await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch {}
}
