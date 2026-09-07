export type IslandCode = string;

const CANONICAL = /^(\d{4})-(\d{4})-(\d{4})$/;

export function parseIslandCode(input: string): IslandCode | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 12) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
}

export function formatIslandCode(code: IslandCode): string {
  const parsed = parseIslandCode(code);
  if (!parsed) {
    throw new Error(`Invalid island code: ${code}`);
  }
  return parsed;
}

export function looksLikeIslandCode(input: string): boolean {
  return parseIslandCode(input) !== null || CANONICAL.test(input.trim());
}
