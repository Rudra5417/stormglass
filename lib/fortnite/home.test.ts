import { expect, test } from "vitest";
import { collectHomeCodes } from "./home";

test("collectHomeCodes unions ranking tops and newest, max 36", () => {
  const codes = collectHomeCodes(
    [
      ["a", "b", "c", "d", "e", "f", "g", "h", "extra"],
      ["a", "i"],
      ["j"],
    ],
    ["k", "l"],
  );
  expect(codes).toContain("a");
  expect(codes.length).toBeLessThanOrEqual(36);
  expect(codes.filter((c) => c === "a")).toHaveLength(1);
  expect(codes).not.toContain("extra"); // only top 8 per board
});
