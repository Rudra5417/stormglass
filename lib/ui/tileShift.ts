export function tileShift(seed: string): { x: string; y: string } {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 33 + seed.charCodeAt(i)) >>> 0;
  return {
    x: `${(n % 28) - 8}%`,
    y: `${((n >> 4) % 22) - 6}%`,
  };
}