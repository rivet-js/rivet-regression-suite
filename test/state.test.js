import test from "node:test";
import assert from "node:assert/strict";
import { state } from "rivet";

test("RIVET-STATE-001 state exposes .value reads and writes", () => {
    const count = state(0);
    assert.equal(count.value, 0);
    count.value++;
    assert.equal(count.value, 1);
    count.value = 10;
    assert.equal(count.value, 10);
});

test("RIVET-STATE-002 state stores object values by identity", () => {
    const first = { name: "Rivet" };
    const second = { name: "Rivet" };
    const cell = state(first);

    assert.equal(cell.value, first);
    cell.value = second;
    assert.equal(cell.value, second);
});

test("RIVET-STATE-003 state accepts repeated same-value assignments", () => {
    const cell = state(NaN);
    cell.value = NaN;
    assert.ok(Number.isNaN(cell.value));

    const object = {};
    cell.value = object;
    cell.value = object;
    assert.equal(cell.value, object);
});
