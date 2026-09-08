import { expect, test } from "vitest";
import { pageTitle } from "./pageTitle";

test("pageTitle joins parts with Stormglass as the last segment", () => {
  expect(pageTitle("Fight The Brainrot", "6980-2761-9936")).toBe(
    "Fight The Brainrot · 6980-2761-9936 · Stormglass",
  );
});

test("pageTitle with one part is still branded", () => {
  expect(pageTitle("Rankings")).toBe("Rankings · Stormglass");
});
