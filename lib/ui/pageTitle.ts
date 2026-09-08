export function pageTitle(...parts: string[]): string {
  return [...parts.filter((part) => part.length > 0), "Stormglass"].join(" · ");
}