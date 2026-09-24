import assert from "node:assert/strict";
import test from "node:test";
import { request, RequestError } from "rivet";
import { withDom } from "./helpers/dom.js";

async function withFetch(fake, fn) {
    const previous = globalThis.fetch;
    globalThis.fetch = fake;
    try { return await fn(); }
    finally { globalThis.fetch = previous; }
}

test("RIVET-HYPER-001 request exposes HTML and native Response", async () => {
    await withFetch(async () => new Response("<article>Rivet</article>"), async () => {
        const result = await request("/fragment");
        assert.equal(result.html, "<article>Rivet</article>");
        assert.equal(result.response.ok, true);
    });
});

test("RIVET-HYPER-002 non-ok responses throw a public RequestError", async () => {
    await withFetch(async () => new Response("invalid", { status: 400 }), async () => {
        await assert.rejects(() => request("/bad"), (error) => error instanceof RequestError && error.status === 400 && error.html === "invalid");
    });
});

test("RIVET-HYPER-003 request target/swap replaces server-driven fragments", async () => withDom(async (document) => {
    const previous = globalThis.fetch;
    globalThis.fetch = async () => new Response("<p>server</p>");
    try {
        const host = document.createElement("section");
        await request("/fragment", { target: host, swap: "inner" });
        assert.equal(host.outerHTML, "<section><p>server</p></section>");
    } finally { globalThis.fetch = previous; }
}));

test("RIVET-HYPER-004 request/swap lifecycle uses native CustomEvent hooks", async () => withDom(async (document) => {
    const host = document.createElement("div");
    const seen = [];
    for (const name of ["rivet:before-request", "rivet:after-request", "rivet:before-swap", "rivet:after-swap"]) {
        host.addEventListener(name, (event) => seen.push([name, event.detail]));
    }
    const previous = globalThis.fetch;
    globalThis.fetch = async () => new Response("<p>done</p>");
    try { await request("/fragment", { target: host }); }
    finally { globalThis.fetch = previous; }
    assert.deepEqual(seen.map(([name]) => name), ["rivet:before-request", "rivet:after-request", "rivet:before-swap", "rivet:after-swap"]);
    assert.equal(seen[0][1].url, "/fragment");
}));

test("RIVET-HYPER-005 failed requests emit request-error", async () => withDom(async (document) => {
    const host = document.createElement("div");
    let error;
    host.addEventListener("rivet:request-error", (event) => { error = event.detail.error; });
    const previous = globalThis.fetch;
    globalThis.fetch = async () => new Response("no", { status: 503 });
    try { await assert.rejects(() => request("/down", { target: host })); }
    finally { globalThis.fetch = previous; }
    assert.equal(error.status, 503);
}));

test("RIVET-HYPER-006 enhance maps declarative request attributes to the public engine", async () => withDom(async (document) => {
    const { enhance } = await import("rivet");
    const button = document.createElement("button");
    button.setAttribute("r-get", "/users");
    button.setAttribute("r-target", "#results");
    const results = document.createElement("div");
    results.setAttribute("id", "results");
    document.body.append(button, results);

    const previous = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
        assert.equal(url, "/users");
        assert.equal(options.method, "GET");
        return new Response("<p>Ada</p>");
    };
    try {
        const dispose = enhance(document);
        button.dispatchEvent(new Event("click"));
        await new Promise((resolve) => setTimeout(resolve, 0));
        assert.equal(results.outerHTML, '<div id="results"><p>Ada</p></div>');
        dispose();
    } finally { globalThis.fetch = previous; }
}));

test("RIVET-HYPER-007 enhanced forms preserve FormData submission semantics", async () => withDom(async (document) => {
    const { enhance } = await import("rivet");
    const form = document.createElement("form");
    form.setAttribute("r-post", "/save");
    document.body.append(form);
    const previousFetch = globalThis.fetch;
    const previousFormData = globalThis.FormData;
    const payload = { native: true };
    globalThis.FormData = class { constructor(value) { assert.equal(value, form); return payload; } };
    let options;
    globalThis.fetch = async (_url, next) => { options = next; return new Response(""); };
    try {
        enhance(document);
        const event = new Event("submit", { cancelable: true });
        form.dispatchEvent(event);
        await new Promise((resolve) => setTimeout(resolve, 0));
        assert.equal(event.defaultPrevented, true);
        assert.equal(options.body, payload);
    } finally {
        globalThis.fetch = previousFetch;
        globalThis.FormData = previousFormData;
    }
}));

test("RIVET-HYPER-008 r-trigger stays a small explicit event set", async () => withDom(async (document) => {
    const { enhance } = await import("rivet");
    const input = document.createElement("input");
    input.setAttribute("r-get", "/filter");
    input.setAttribute("r-trigger", "change");
    document.body.append(input);
    const previous = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response(""); };
    try {
        const stop = enhance(document);
        input.dispatchEvent(new Event("input"));
        input.dispatchEvent(new Event("change"));
        await new Promise((resolve) => setTimeout(resolve, 0));
        assert.equal(calls, 1);
        stop();
    } finally { globalThis.fetch = previous; }
}));

test("RIVET-HYPER-009 GET forms encode fields and do not send a body", async () => withDom(async (document) => {
    const { enhance } = await import("rivet");
    const form = document.createElement("form");
    form.setAttribute("r-get", "/search?scope=all");
    document.body.append(form);
    const previousFetch = globalThis.fetch;
    const previousFormData = globalThis.FormData;
    globalThis.FormData = class { entries() { return [["q", "rivet js"]][Symbol.iterator](); } };
    let seen;
    globalThis.fetch = async (url, options) => { seen = { url, options }; return new Response(""); };
    try {
        enhance(document);
        form.dispatchEvent(new Event("submit", { cancelable: true }));
        await new Promise((resolve) => setTimeout(resolve, 0));
        assert.equal(seen.url, "/search?scope=all&q=rivet+js");
        assert.equal("body" in seen.options, false);
    } finally {
        globalThis.fetch = previousFetch;
        globalThis.FormData = previousFormData;
    }
}));

test("RIVET-HYPER-010 re-enhancement does not double-bind existing nodes", async () => withDom(async (document) => {
    const { enhance } = await import("rivet");
    const button = document.createElement("button");
    button.setAttribute("r-get", "/once");
    document.body.append(button);
    const previous = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response(""); };
    try {
        const stopA = enhance(document);
        const stopB = enhance(document);
        button.dispatchEvent(new Event("click"));
        await new Promise((resolve) => setTimeout(resolve, 0));
        assert.equal(calls, 1);
        stopB();
        stopA();
    } finally { globalThis.fetch = previous; }
}));
