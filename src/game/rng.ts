// xorshift32: tiny, deterministic, good enough for a demo.
export class RNG {
  private x: number;
  constructor(seed: number) {
    this.x = seed >>> 0;
    if (this.x === 0) this.x = 0x9e3779b9;
  }
  nextU32(): number {
    let x = this.x;
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    this.x = x;
    return x;
  }
  nextFloat(): number {
    return this.nextU32() / 0xffffffff;
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.nextFloat() * arr.length)];
  }
  weightedPick<T extends { weight: number }>(arr: T[]): T {
    const total = arr.reduce((s, a) => s + a.weight, 0);
    let r = this.nextFloat() * total;
    for (const a of arr) {
      r -= a.weight;
      if (r <= 0) return a;
    }
    return arr[arr.length - 1];
  }
}
