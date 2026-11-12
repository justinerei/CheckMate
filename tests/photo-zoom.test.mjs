import { test } from "node:test";
import assert from "node:assert/strict";
import { pinchZoom, zoomOffset } from "../src/lib/photo-zoom.ts";

test("pinch in and out changes zoom in both directions within the allowed range", () => {
  assert.equal(pinchZoom(150, 100, 200), 300);
  assert.equal(pinchZoom(300, 100, 50), 150);
  assert.equal(pinchZoom(200, 100, 10), 100);
  assert.equal(pinchZoom(200, 100, 300), 400);
  assert.equal(pinchZoom(200, 0, 100), 200);
});

test("zoom keeps the point under the fingers in view", () => {
  assert.equal(zoomOffset(100, 100, 100, 200), 300);
  assert.equal(zoomOffset(300, 100, 200, 100), 100);
});
