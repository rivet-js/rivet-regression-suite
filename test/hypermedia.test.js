import assert from "node:assert/strict";
import test from "node:test";
import { request, RequestError } from "rivet";

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
