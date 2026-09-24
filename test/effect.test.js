import test from "node:test";
import assert from "node:assert/strict";
import { effect, state } from "rivet";

test("RIVET-EFFECT-001 effects run immediately and react to state", () => {
    const count = state(0);
    const seen = [];
    const dispose = effect(() => seen.push(count.value));

    count.value = 1;
    count.value = 2;

    assert.deepEqual(seen, [0, 1, 2]);
    dispose();
});

test("RIVET-EFFECT-002 effects update conditional dependencies", () => {
    const useLeft = state(true);
    const left = state("left");
    const right = state("right");
    const seen = [];
    const dispose = effect(() => {
        seen.push(useLeft.value ? left.value : right.value);
    });

    useLeft.value = false;
    left.value = "ignored";
    right.value = "updated";

    assert.deepEqual(seen, ["left", "right", "updated"]);
    dispose();
});

test("RIVET-EFFECT-003 disposal stops effects and runs cleanup", () => {
    const count = state(0);
    const events = [];
    const dispose = effect(() => {
        const value = count.value;
        events.push(`run:${value}`);
        return () => events.push(`cleanup:${value}`);
    });

    count.value = 1;
    dispose();
    count.value = 2;

    assert.deepEqual(events, ["run:0", "cleanup:0", "run:1", "cleanup:1"]);
});

test("RIVET-EFFECT-007 propagation is synchronous", () => {
    const count = state(0);
    let observed = -1;
    const dispose = effect(() => {
        observed = count.value;
    });

    count.value = 7;
    assert.equal(observed, 7);
    dispose();
});
