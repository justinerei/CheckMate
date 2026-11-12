import { test } from "node:test";
import assert from "node:assert/strict";
import { shortRetrySeconds } from "../src/lib/short-retry.ts";

test("only brief rate limits receive bounded automatic retries", () => {
  assert.equal(shortRetrySeconds(429, 3, 0), 3);
  assert.equal(shortRetrySeconds(429, 20, 1), 20);
  for (const [status, delay, attempts] of [[429, 21, 0], [429, 3, 2], [429, null, 0], [429, 0, 0], [429, 1.5, 0], [500, 3, 0]]) {
    assert.equal(shortRetrySeconds(status, delay, attempts), null);
  }
});
