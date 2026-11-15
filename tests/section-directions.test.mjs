import { test } from "node:test";
import assert from "node:assert/strict";
import { forbidsErasures, setNoErasures } from "../src/lib/auto-review.ts";

test("the no-erasure option preserves other directions and stays compatible with checking", () => {
  const enabled = setNoErasures("Circle the answer", true);
  assert.equal(enabled, "Circle the answer. No erasures.");
  assert.equal(forbidsErasures(enabled), true);
  assert.equal(setNoErasures(enabled, true), enabled);
  assert.equal(setNoErasures(enabled, false), "Circle the answer.");
  assert.equal(forbidsErasures(setNoErasures(enabled, false)), false);
});

test("removes recognized rules without removing unrelated text", () => {
  assert.equal(setNoErasures("No erasures allowed. Use pencil; erasures are not allowed! Work neatly.", false), "Use pencil; Work neatly.");
  assert.equal(setNoErasures("No erasures required.", false), "No erasures required.");
  assert.equal(setNoErasures("", true), "No erasures.");
});
