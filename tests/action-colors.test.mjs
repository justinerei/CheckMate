import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const token = name => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `Missing ${name} color token`);
  return match[1];
};
function luminance(hex) {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
test("action label colors stay readable on their default and hover backgrounds", () => {
  for (const role of ["primary", "secondary", "danger"]) {
    for (const suffix of ["", "-hover"]) {
      assert.ok(contrast(token(`action-${role}-text`), token(`action-${role}${suffix}`)) >= 4.5, `${role}${suffix} contrast below 4.5:1`);
    }
  }
});
