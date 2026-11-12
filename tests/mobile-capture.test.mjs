import { test } from "node:test";
import assert from "node:assert/strict";
import { isMobileCaptureDevice } from "../src/lib/mobile-capture.ts";

test("camera capture is available on phones and tablets, not desktop laptops", () => {
  assert.equal(isMobileCaptureDevice("Mozilla Android Chrome", "Linux arm", 5), true);
  assert.equal(isMobileCaptureDevice("Mozilla iPhone Safari", "iPhone", 5), true);
  assert.equal(isMobileCaptureDevice("Mozilla Macintosh Safari", "MacIntel", 5), true);
  assert.equal(isMobileCaptureDevice("Mozilla Windows Chrome", "Win32", 10, false), false);
  assert.equal(isMobileCaptureDevice("Mozilla Macintosh Safari", "MacIntel", 0, false), false);
});
