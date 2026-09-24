import test from "node:test";
import assert from "node:assert/strict";
import { computed, effect, state } from "rivet";

test("RIVET-COMPUTED-001 computed values are lazy and cached", () => {
    const count = state(2);
    let runs = 0;
    const doubled = computed(() => {
        runs++;
        return count.value * 2;
    });

    assert.equal(runs, 0);
    assert.equal(doubled.value, 4);
    assert.equal(doubled.value, 4);
    assert.equal(runs, 1);
    count.value = 3;
    assert.equal(runs, 1);
    assert.equal(doubled.value, 6);
    assert.equal(runs, 2);
});

test("RIVET-COMPUTED-002 effects react through computed values", () => {
    const count = state(2);
    const doubled = computed(() => count.value * 2);
    const seen = [];
    const dispose = effect(() => seen.push(doubled.value));

    count.value = 4;

    assert.deepEqual(seen, [4, 8]);
    dispose();
});

test("RIVET-COMPUTED-003 computed errors propagate and can recover", () => {
    const ready = state(false);
    const value = computed(() => {
        if (!ready.value) throw new Error("not ready");
        return 42;
    });

    assert.throws(() => value.value, /not ready/);
    ready.value = true;
    assert.equal(value.value, 42);
});
