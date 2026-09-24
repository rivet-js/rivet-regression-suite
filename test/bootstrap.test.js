import test from "node:test";
import assert from "node:assert/strict";
import * as rivet from "rivet";

test("RIVET-PACKAGE-001 public package can be imported", () => {
    assert.ok(rivet);
    assert.equal(typeof rivet, "object");
});
