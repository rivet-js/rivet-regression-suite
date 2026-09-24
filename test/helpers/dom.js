function escapeText(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

class TestNode extends EventTarget {
    constructor(nodeType) {
        super();
        this.nodeType = nodeType;
        this.parentNode = null;
        this.childNodes = [];
    }

    get firstChild() {
        return this.childNodes[0] ?? null;
    }

    get firstElementChild() {
        return this.childNodes.find((node) => node.nodeType === 1) ?? null;
    }

    append(...nodes) {
        for (const input of nodes) {
            const node = typeof input === "string" ? new TestText(input) : input;
            if (node.parentNode) node.parentNode.removeChild(node);
            node.parentNode = this;
            this.childNodes.push(node);
        }
    }

    appendChild(node) {
        this.append(node);
        return node;
    }

    insertBefore(node, reference) {
        if (node.parentNode) node.parentNode.removeChild(node);
        const index = reference === null ? -1 : this.childNodes.indexOf(reference);
        if (reference !== null && index === -1) throw new Error("Reference node is not a child");
        node.parentNode = this;
        if (reference === null) this.childNodes.push(node);
        else this.childNodes.splice(index, 0, node);
        return node;
    }

    removeChild(node) {
        const index = this.childNodes.indexOf(node);
        if (index === -1) throw new Error("Node is not a child");
        this.childNodes.splice(index, 1);
        node.parentNode = null;
        return node;
    }

    replaceChildren(...nodes) {
        for (const child of this.childNodes) child.parentNode = null;
        this.childNodes = [];
        this.append(...nodes);
    }

    replaceWith(...nodes) {
        const parent = this.parentNode;
        if (!parent) return;
        for (const node of nodes) parent.insertBefore(node, this);
        parent.removeChild(this);
    }

    cloneNode(deep = false) {
        const clone = new TestNode(this.nodeType);
        if (deep) {
            for (const child of this.childNodes) clone.append(child.cloneNode(true));
        }
        return clone;
    }

    get textContent() {
        return this.childNodes.map((child) => child.textContent).join("");
    }

    set textContent(value) {
        this.replaceChildren(new TestText(String(value)));
    }

    querySelector(selector) {
        for (const child of this.childNodes) {
            if (child.nodeType === 1 && child.matches(selector)) return child;
            const match = child.querySelector?.(selector);
            if (match) return match;
        }
        return null;
    }
}

export class TestText extends TestNode {
    constructor(data = "") {
        super(3);
        this.data = String(data);
    }

    cloneNode() {
        return new TestText(this.data);
    }

    get textContent() {
        return this.data;
    }

    set textContent(value) {
        this.data = String(value);
    }

    get outerHTML() {
        return escapeText(this.data);
    }
}

export class TestDocumentFragment extends TestNode {
    constructor() {
        super(11);
    }

    cloneNode(deep = false) {
        const clone = new TestDocumentFragment();
        if (deep) {
            for (const child of this.childNodes) clone.append(child.cloneNode(true));
        }
        return clone;
    }

    get outerHTML() {
        return this.childNodes.map((child) => child.outerHTML).join("");
    }
}

export class TestElement extends TestNode {
    constructor(tagName) {
        super(1);
        this.tagName = String(tagName).toUpperCase();
        this._attributes = new Map();
    }

    get attributes() {
        return [...this._attributes].map(([name, value]) => ({ name, value }));
    }

    setAttribute(name, value) {
        this._attributes.set(String(name), String(value));
    }

    getAttribute(name) {
        return this._attributes.get(String(name)) ?? null;
    }

    hasAttribute(name) {
        return this._attributes.has(String(name));
    }

    removeAttribute(name) {
        this._attributes.delete(String(name));
    }

    matches(selector) {
        if (selector.startsWith("#")) return this.getAttribute("id") === selector.slice(1);
        if (selector.startsWith(".")) {
            return (this.getAttribute("class") ?? "").split(/\s+/).includes(selector.slice(1));
        }
        return this.tagName.toLowerCase() === selector.toLowerCase();
    }

    cloneNode(deep = false) {
        const clone = new TestElement(this.tagName);
        for (const [name, value] of this._attributes) clone.setAttribute(name, value);
        for (const key of ["value", "checked", "disabled", "selected"]) {
            if (Object.hasOwn(this, key)) clone[key] = this[key];
        }
        if (deep) {
            for (const child of this.childNodes) clone.append(child.cloneNode(true));
        }
        return clone;
    }

    get outerHTML() {
        const attrs = [...this._attributes]
            .map(([name, value]) => value === "" ? ` ${name}` : ` ${name}="${String(value).replaceAll('"', '&quot;')}"`)
            .join("");
        return `<${this.tagName.toLowerCase()}${attrs}>${this.childNodes.map((child) => child.outerHTML).join("")}</${this.tagName.toLowerCase()}>`;
    }
}

class TestTemplateElement extends TestElement {
    constructor(document) {
        super("template");
        this.ownerDocument = document;
        this.content = new TestDocumentFragment();
    }

    set innerHTML(markup) {
        this.content = parseFragment(String(markup), this.ownerDocument);
    }

    get innerHTML() {
        return this.content.outerHTML;
    }
}

function parseAttributes(source, element) {
    const attributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let match;
    while ((match = attributePattern.exec(source))) {
        const [, name, doubleQuoted, singleQuoted, unquoted] = match;
        const value = doubleQuoted ?? singleQuoted ?? unquoted ?? "";
        element.setAttribute(name, value);
    }
}

function parseFragment(markup, document) {
    const root = new TestDocumentFragment();
    const stack = [root];
    const tokenPattern = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|[^<]+|</g;
    const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
    let match;

    while ((match = tokenPattern.exec(markup))) {
        const token = match[0];
        if (!token) continue;
        if (token.startsWith("<!--")) continue;

        if (token.startsWith("</")) {
            const tag = token.slice(2, -1).trim().toLowerCase();
            if (stack.length === 1 || stack.at(-1).tagName.toLowerCase() !== tag) {
                throw new Error(`Mismatched closing tag: ${tag}`);
            }
            stack.pop();
            continue;
        }

        if (token.startsWith("<")) {
            const selfClosing = token.endsWith("/>");
            const body = token.slice(1, selfClosing ? -2 : -1).trim();
            const separator = body.search(/\s/);
            const tag = (separator === -1 ? body : body.slice(0, separator)).toLowerCase();
            const attrSource = separator === -1 ? "" : body.slice(separator + 1);
            const element = document.createElement(tag);
            parseAttributes(attrSource, element);
            stack.at(-1).append(element);
            if (!selfClosing && !voidTags.has(tag)) stack.push(element);
            continue;
        }

        stack.at(-1).append(document.createTextNode(token));
    }

    if (stack.length !== 1) throw new Error("Unclosed HTML tag in test template");
    return root;
}

export class TestDocument extends EventTarget {
    constructor() {
        super();
        this.body = new TestElement("body");
    }

    querySelector(selector) {
        if (this.body.matches(selector)) return this.body;
        return this.body.querySelector(selector);
    }

    createElement(tagName) {
        if (String(tagName).toLowerCase() === "template") return new TestTemplateElement(this);
        return new TestElement(tagName);
    }

    createTextNode(data) {
        return new TestText(data);
    }

    createDocumentFragment() {
        return new TestDocumentFragment();
    }
}

export function createDom() {
    return { document: new TestDocument() };
}

export function withDom(fn) {
    const previousDocument = globalThis.document;
    const { document } = createDom();
    globalThis.document = document;

    const restore = () => {
        if (previousDocument === undefined) delete globalThis.document;
        else globalThis.document = previousDocument;
    };

    try {
        const result = fn(document);
        if (result && typeof result.then === "function") return result.finally(restore);
        restore();
        return result;
    } catch (error) {
        restore();
        throw error;
    }
}
