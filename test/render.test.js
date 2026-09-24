import test from "node:test";
import assert from "node:assert/strict";
import { html, key, mount, onCleanup, render, state } from "rivet";
import { withDom } from "./helpers/dom.js";
import { Counter } from "../fixtures/counter.mjs";

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

test("RIVET-DOM-010 CP20 Counter fixture works end to end", () => withDom(() => {
    const fragment = render(Counter());
    const button = fragment.querySelector("button");
    const dynamicNode = button.childNodes.find((node) => node.nodeType === 3 && node.textContent === "0");

    assert.match(button.textContent, /Count:\s*0/);
    button.dispatchEvent(new Event("click"));
    assert.match(button.textContent, /Count:\s*1/);
    assert.equal(button.childNodes.includes(dynamicNode), true);
}));

test("RIVET-DOM-011 nested templates interpolate as DOM", () => withDom(() => {
    const fragment = render(html`<p>${html`<strong>nested</strong>`}</p>`);
    assert.equal(fragment.firstElementChild.outerHTML, "<p><strong>nested</strong></p>");
}));

test("RIVET-DOM-012 reactive DOM regions replace nodes", () => withDom((document) => {
    const node = document.createElement("span");
    node.textContent = "one";
    const current = state(node);
    const fragment = render(html`<div>${current}</div>`);
    const div = fragment.firstElementChild;
    assert.equal(div.outerHTML, "<div><span>one</span></div>");
    current.value = html`<em>two</em>`;
    assert.equal(div.outerHTML, "<div><em>two</em></div>");
}));

test("RIVET-CLEANUP-001 replaced subtrees release reactive bindings", () => withDom(() => {
    const inner = state(1);
    let reads = 0;
    const current = state(html`<span>${() => { reads++; return inner.value; }}</span>`);
    const fragment = render(html`<div>${current}</div>`);
    assert.equal(reads, 1);
    current.value = html`<em>done</em>`;
    inner.value = 2;
    assert.equal(reads, 1);
}));

test("RIVET-CLEANUP-002 replaced subtrees release event listeners", () => withDom(() => {
    let clicks = 0;
    const current = state(html`<button onclick=${() => clicks++}>old</button>`);
    const fragment = render(html`<div>${current}</div>`);
    const oldButton = fragment.querySelector("button");
    current.value = html`<span>new</span>`;
    oldButton.dispatchEvent(new Event("click"));
    assert.equal(clicks, 0);
}));


test("RIVET-MOUNT-001 mount targets an element and cleans up on unmount", () => withDom((document) => {
    const host = document.createElement("main");
    const value = state("one");
    const unmount = mount(host, html`<p>${value}</p>`);
    assert.equal(host.textContent, "one");
    unmount();
    value.value = "two";
    assert.equal(host.textContent, "");
}));

test("RIVET-MOUNT-002 mount accepts a CSS selector", () => withDom((document) => {
    const host = document.createElement("div");
    host.setAttribute("id", "app");
    document.body.append(host);
    mount("#app", html`<span>ok</span>`);
    assert.equal(host.textContent, "ok");
}));

test("RIVET-COMPONENT-001 ordinary functions returning html compose as components", () => withDom(() => {
    function Label() { return html`<strong>Rivet</strong>`; }
    const fragment = render(html`<p>Hello ${Label()}</p>`);
    assert.equal(fragment.firstElementChild.outerHTML, "<p>Hello <strong>Rivet</strong></p>");
}));

test("RIVET-COMPONENT-002 props are plain JavaScript objects", () => withDom(() => {
    function Greeting({ name }) { return html`<p>Hello ${name}</p>`; }
    const name = state("Rivet");
    const fragment = render(Greeting({ name }));
    assert.equal(fragment.firstElementChild.textContent, "Hello Rivet");
    name.value = "Web";
    assert.equal(fragment.firstElementChild.textContent, "Hello Web");
}));

test("RIVET-COMPONENT-003 children compose through an ordinary props field", () => withDom(() => {
    function Panel({ children }) { return html`<section>${children}</section>`; }
    function Label() { return html`<strong>child</strong>`; }
    const fragment = render(Panel({ children: Label() }));
    assert.equal(fragment.firstElementChild.outerHTML, "<section><strong>child</strong></section>");
}));

test("RIVET-COMPONENT-004 reactive children replace their DOM region", () => withDom(() => {
    function Panel({ children }) { return html`<section>${children}</section>`; }
    const children = state(html`<span>one</span>`);
    const fragment = render(Panel({ children }));
    children.value = html`<em>two</em>`;
    assert.equal(fragment.firstElementChild.outerHTML, "<section><em>two</em></section>");
}));

test("RIVET-COMPONENT-005 onCleanup releases component-owned resources", () => withDom((document) => {
    const released = [];
    function Resource() {
        return html`${onCleanup(() => released.push("done"))}<p>resource</p>`;
    }
    const host = document.createElement("main");
    const unmount = mount(host, Resource());
    assert.deepEqual(released, []);
    unmount();
    assert.deepEqual(released, ["done"]);
}));

test("RIVET-COMPONENT-006 ref callbacks expose native nodes and clear on disposal", () => withDom((document) => {
    const seen = [];
    const host = document.createElement("main");
    const unmount = mount(host, html`<button ref=${(node) => seen.push(node)}>ref</button>`);
    assert.equal(seen[0], host.querySelector("button"));
    unmount();
    assert.equal(seen.at(-1), null);
}));

test("RIVET-COMPONENT-007 mounted reactive props stop updating after unmount", () => withDom((document) => {
    function Greeting({ name }) { return html`<p>Hello ${name}</p>`; }
    const name = state("Rivet");
    const host = document.createElement("main");
    const unmount = mount(host, Greeting({ name }));
    const paragraph = host.querySelector("p");
    unmount();
    name.value = "after";
    assert.equal(paragraph.textContent, "Hello Rivet");
    assert.equal(host.textContent, "");
}));

test("RIVET-COMPONENT-008 reactive child replacement disposes child resources", () => withDom(() => {
    const released = [];
    const child = state(html`${onCleanup(() => released.push("child"))}<span>one</span>`);
    const fragment = render(html`<section>${child}</section>`);
    child.value = html`<em>two</em>`;
    assert.deepEqual(released, ["child"]);
    assert.equal(fragment.firstElementChild.textContent, "two");
}));

test("RIVET-COMPONENT-009 unmount removes component event listeners", () => withDom((document) => {
    let clicks = 0;
    const host = document.createElement("main");
    const unmount = mount(host, html`<button onclick=${() => clicks++}>go</button>`);
    const button = host.querySelector("button");
    unmount();
    button.dispatchEvent(new Event("click"));
    assert.equal(clicks, 0);
}));

test("RIVET-DOM-013 arrays from ordinary map calls render as sibling DOM", () => withDom(() => {
    const items = ["a", "b", "c"];
    const fragment = render(html`<ul>${items.map((item) => html`<li>${item}</li>`)}</ul>`);
    assert.equal(fragment.firstElementChild.outerHTML, "<ul><li>a</li><li>b</li><li>c</li></ul>");
}));

test("RIVET-DOM-014 reactive expressions can replace mapped arrays", () => withDom(() => {
    const items = state([1, 2]);
    const fragment = render(html`<div>${() => items.value.map((item) => html`<span>${item}</span>`)}</div>`);
    items.value = [3];
    assert.equal(fragment.firstElementChild.outerHTML, "<div><span>3</span></div>");
}));

test("RIVET-DOM-015 keyed lists preserve node identity when reordered", () => withDom(() => {
    const rows = state([key("a", html`<li>A</li>`), key("b", html`<li>B</li>`)]);
    const fragment = render(html`<ul>${rows}</ul>`);
    const list = fragment.firstElementChild;
    const [a, b] = list.childNodes.filter((node) => node.nodeType === 1);
    rows.value = [key("b", html`<li>B2</li>`), key("a", html`<li>A2</li>`)];
    assert.deepEqual(list.childNodes.filter((node) => node.nodeType === 1), [b, a]);
}));

test("RIVET-DOM-016 keyed lists reject duplicate keys", () => withDom(() => {
    const rows = state([key("a", html`<li>A</li>`)]);
    render(html`<ul>${rows}</ul>`);
    assert.throws(() => {
        rows.value = [key("a", html`<li>A</li>`), key("a", html`<li>duplicate</li>`)];
    }, /Duplicate key/);
}));
