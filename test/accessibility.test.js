import assert from "node:assert/strict";
import test from "node:test";
import { html, render, state } from "rivet";
import { withDom } from "./helpers/dom.js";

test("A11Y-001: semantic and ARIA attributes remain ordinary DOM", () => withDom(() => {
    const expanded = state(false);
    const fragment = render(html`<nav aria-label="Primary"><button aria-expanded=${() => expanded.value ? "true" : "false"}>Menu</button></nav>`);
    const nav = fragment.querySelector("nav");
    const button = fragment.querySelector("button");
    assert.equal(nav.getAttribute("aria-label"), "Primary");
    assert.equal(button.getAttribute("aria-expanded"), "false");
    expanded.value = true;
    assert.equal(button.getAttribute("aria-expanded"), "true");
}));
