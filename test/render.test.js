import test from "node:test";
import assert from "node:assert/strict";
import { html, render } from "rivet";
import { withDom } from "./helpers/dom.js";

test("RIVET-DOM-001 static templates render normal DOM structure", () => withDom(() => {
    const fragment = render(html`<section><h1>Rivet</h1><p>ordinary HTML</p></section>`);
    assert.equal(fragment.querySelector("h1").textContent, "Rivet");
    assert.equal(fragment.querySelector("p").textContent, "ordinary HTML");
}));

test("RIVET-DOM-002 interpolated strings are text, not executable markup", () => withDom(() => {
    const fragment = render(html`<p>${"<strong>safe</strong>"}</p>`);
    assert.equal(fragment.querySelector("p").textContent, "<strong>safe</strong>");
    assert.equal(fragment.querySelector("strong"), null);
}));

test("RIVET-DOM-003 nullish and boolean text interpolations are empty", () => withDom(() => {
    const fragment = render(html`<p>A${null}B${undefined}C${true}D${false}E</p>`);
    assert.equal(fragment.querySelector("p").textContent, "ABCDE");
}));

test("RIVET-DOM-004 native nodes can be interpolated as one-time values", () => withDom((document) => {
    const strong = document.createElement("strong");
    strong.textContent = "native";
    const fragment = render(html`<p>${strong}</p>`);
    assert.equal(fragment.querySelector("strong"), strong);
}));
