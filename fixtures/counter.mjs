import { html, state } from "rivet";

export function Counter() {
    const count = state(0);
    return html`<button type="button" onclick=${() => count.value++}>Count: ${count}</button>`;
}
