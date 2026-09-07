import { expect, test } from "vitest";
import { formatIslandCode, parseIslandCode } from "./normalize";

test("parses hyphenated codes", () => {
  expect(parseIslandCode("6980-2761-9936")).toBe("6980-2761-9936");
});

test("parses digits with spaces or no hyphens", () => {
  expect(parseIslandCode("698027619936")).toBe("6980-2761-9936");
  expect(parseIslandCode("6980 2761 9936")).toBe("6980-2761-9936");
});

test("rejects invalid shapes", () => {
  expect(parseIslandCode("")).toBeNull();
  expect(parseIslandCode("abc")).toBeNull();
  expect(parseIslandCode("6980-2761")).toBeNull();
  expect(parseIslandCode("6980-2761-993")).toBeNull();
});

test("format is identity for canonical codes", () => {
  expect(formatIslandCode("6980-2761-9936")).toBe("6980-2761-9936");
});
