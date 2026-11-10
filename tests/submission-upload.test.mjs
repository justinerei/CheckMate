import { test } from "node:test";
import assert from "node:assert/strict";
import { imageFormat, validPageCount, validPageNumber, privatePhotoPath, pagesComplete } from "../src/lib/submission-upload.ts";

test("accepts only complete JPEG and PNG signatures", () => {
  assert.equal(imageFormat(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), "jpg");
  assert.equal(imageFormat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "png");
  assert.equal(imageFormat(Uint8Array.from([0xff, 0xd8])), null);
  assert.equal(imageFormat(new TextEncoder().encode("<svg onload=alert(1)>")), null);
});

test("validates page limits and page numbers", () => {
  assert.equal(validPageCount("2"), 2);
  for (const value of ["0", "11", "1.5", "", "2abc"]) assert.equal(validPageCount(value), null);
  assert.equal(validPageNumber("2", 3), 2);
  assert.equal(validPageNumber("4", 3), null);
});

test("rejects path traversal and only accepts generated private filenames", () => {
  assert.equal(privatePhotoPath("../secret.png"), false);
  assert.equal(privatePhotoPath("01234567-89ab-4def-8123-0123456789ab.jpg"), true);
  assert.equal(privatePhotoPath("01234567-89ab-4def-8123-0123456789ab.svg"), false);
});

test("only confirms a complete set of numbered pages", () => {
  assert.equal(pagesComplete(3, [3, 1, 2]), true);
  assert.equal(pagesComplete(3, [1, 3]), false);
  assert.equal(pagesComplete(3, [1, 2, 2]), false);
  assert.equal(pagesComplete(null, []), false);
});
