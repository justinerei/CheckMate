import { test } from "node:test";
import assert from "node:assert/strict";
import { batchMascotState } from "../src/lib/mascot-context.ts";

test("batch mascot reflects reading, waiting and rate limits", () => {
  assert.equal(batchMascotState("reading"), "focused");
  assert.equal(batchMascotState("rate_limit"), "concerned");
  assert.equal(batchMascotState("queued"), "ready");
});
