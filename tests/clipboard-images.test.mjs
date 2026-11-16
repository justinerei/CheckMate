import { test } from "node:test";
import assert from "node:assert/strict";
import { clipboardImages } from "../src/lib/clipboard-images.ts";

test("collects pasted images without treating copied text as an upload", () => {
  const screenshot = new File(["image"], "screenshot.png", { type: "image/png" });
  const result = clipboardImages([
    { kind: "string", type: "text/plain", getAsFile: () => { throw new Error("text is not a file"); } },
    { kind: "file", type: "image/png", getAsFile: () => screenshot },
    { kind: "file", type: "image/jpeg", getAsFile: () => null },
    { kind: "file", type: "application/pdf", getAsFile: () => null },
  ]);
  assert.deepEqual(result, [screenshot]);
  assert.deepEqual(clipboardImages([]), []);
});
