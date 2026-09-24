import test from "node:test";
import assert from "node:assert/strict";
import { html, render, state } from "rivet";
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

test("RIVET-DOM-005 state cells update targeted text bindings", () => withDom(() => {
    const count = state(0);
    const fragment = render(html`<p>Count: ${count}</p>`);
    const paragraph = fragment.querySelector("p");
    const dynamicNode = paragraph.childNodes[1];

    count.value = 3;
    assert.equal(paragraph.textContent, "Count: 3");
    assert.equal(paragraph.childNodes[1], dynamicNode);
}));

test("RIVET-DOM-006 reactive expression functions track their state reads", () => withDom(() => {
    const count = state(2);
    const fragment = render(html`<output>${() => count.value * 3}</output>`);

    assert.equal(fragment.querySelector("output").textContent, "6");
    count.value = 4;
    assert.equal(fragment.querySelector("output").textContent, "12");
}));

test("RIVET-DOM-007 attributes update and nullish values remove them", () => withDom(() => {
    const title = state("first");
    const fragment = render(html`<div title=${title}></div>`);
    const div = fragment.querySelector("div");

    title.value = "second";
    assert.equal(div.getAttribute("title"), "second");
    title.value = null;
    assert.equal(div.hasAttribute("title"), false);
}));

test("RIVET-DOM-008 boolean attributes use presence semantics", () => withDom(() => {
    const disabled = state(false);
    const fragment = render(html`<button disabled=${disabled}>Save</button>`);
    const button = fragment.querySelector("button");

    disabled.value = true;
    assert.equal(button.hasAttribute("disabled"), true);
    disabled.value = false;
    assert.equal(button.hasAttribute("disabled"), false);
}));

test("RIVET-DOM-009 dot bindings assign native DOM properties", () => withDom(() => {
    const value = state("A");
    const fragment = render(html`<input .value=${value}>`);
    const input = fragment.querySelector("input");

    assert.equal(input.value, "A");
    value.value = "B";
    assert.equal(input.value, "B");
}));

test("RIVET-EVENT-001 native click handlers can update reactive state", () => withDom(() => {
    const count = state(0);
    const fragment = render(html`<button onclick=${() => count.value++}>Count: ${count}</button>`);
    const button = fragment.querySelector("button");

    button.dispatchEvent(new Event("click"));
    assert.equal(button.textContent, "Count: 1");
}));

test("RIVET-EVENT-002 handler cells replace and remove native listeners", () => withDom(() => {
    const seen = [];
    const handler = state(() => seen.push("a"));
    const fragment = render(html`<button onclick=${handler}>Run</button>`);
    const button = fragment.querySelector("button");

    button.dispatchEvent(new Event("click"));
    handler.value = () => seen.push("b");
    button.dispatchEvent(new Event("click"));
    handler.value = null;
    button.dispatchEvent(new Event("click"));

    assert.deepEqual(seen, ["a", "b"]);
}));
