export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >>> 17;
    this.state ^= this.state << 5;
    return (this.state >>> 0) / 0xffffffff;
  }

  pick<T>(items: readonly T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[Math.min(idx, items.length - 1)];
  }

  weightedPick<T extends { weight: number }>(items: readonly T[]): T {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = this.next() * total;

    for (const item of items) {
      if (r < item.weight) return item;
      r -= item.weight;
    }

    return items[items.length - 1];
  }
}
