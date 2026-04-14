"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RNG = void 0;
class RNG {
    constructor(seed) {
        this.state = seed >>> 0;
    }
    next() {
        this.state ^= this.state << 13;
        this.state ^= this.state >>> 17;
        this.state ^= this.state << 5;
        return (this.state >>> 0) / 0xffffffff;
    }
    // Alias for semantic clarity
    nextFloat() {
        return this.next();
    }
    pick(items) {
        const idx = Math.floor(this.next() * items.length);
        return items[Math.min(idx, items.length - 1)];
    }
    weightedPick(items) {
        const total = items.reduce((s, i) => s + i.weight, 0);
        let r = this.next() * total;
        for (const item of items) {
            if (r < item.weight)
                return item;
            r -= item.weight;
        }
        return items[items.length - 1];
    }
}
exports.RNG = RNG;
