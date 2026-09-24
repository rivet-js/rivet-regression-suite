import test from "node:test";
import assert from "node:assert/strict";
import { html, render } from "rivet";
import { withDom } from "./helpers/dom.js";

test("SEC-001 interpolated untrusted strings stay text", () => withDom(() => {
    const payload = '<img src=x onerror="alert(1)">';
    const fragment = render(html`<p>${payload}</p>`);
    const p = fragment.childNodes[0];
    assert.equal(p.textContent, payload);
    assert.equal(p.childNodes[0].nodeType, 3);
}));

test("SEC-002 unsafe HTML property sinks remain rejected", () => withDom(() => {
    assert.throws(() => render(html`<div .innerHTML=${"<b>unsafe</b>"}></div>`), /unsafe HTML sink/);
    assert.throws(() => render(html`<iframe .srcdoc=${"<script>bad()</script>"}></iframe>`), /unsafe HTML sink/);
}));
