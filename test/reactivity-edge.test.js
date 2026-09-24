import test from "node:test";
import assert from "node:assert/strict";
import { computed, effect, state } from "rivet";

test("RIVET-EFFECT-004 conditional dependencies are removed after rerun", () => {
    const useLeft = state(true);
    const left = state(1);
    const right = state(10);
    const seen = [];
    const dispose = effect(() => seen.push(useLeft.value ? left.value : right.value));

    useLeft.value = false;
    left.value = 2;
    right.value = 11;

    assert.deepEqual(seen, [1, 10, 11]);
    dispose();
});

test("RIVET-COMPUTED-004 computed chains invalidate transitively", () => {
    const value = state(2);
    const doubled = computed(() => value.value * 2);
    const label = computed(() => `v:${doubled.value}`);
    const seen = [];
    const dispose = effect(() => seen.push(label.value));

    value.value = 5;

    assert.deepEqual(seen, ["v:4", "v:10"]);
    dispose();
});

test("RIVET-EFFECT-005 writes to unrelated state are allowed", () => {
    const input = state(2);
    const output = state(0);
    const dispose = effect(() => {
        output.value = input.value * 3;
    });

    assert.equal(output.value, 6);
    input.value = 4;
    assert.equal(output.value, 12);
    dispose();
});

test("RIVET-EFFECT-006 self-triggering effects report a reactive cycle", () => {
    const count = state(0);
    assert.throws(() => effect(() => count.value++), /Reactive cycle detected/);
});

test("RIVET-COMPUTED-005 self-referential computed values report a reactive cycle", () => {
    let loop;
    loop = computed(() => loop.value);
    assert.throws(() => loop.value, /Reactive cycle detected/);
});
