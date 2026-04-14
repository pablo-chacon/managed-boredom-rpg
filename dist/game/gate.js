"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedFromStrings = seedFromStrings;
// Seed derivation must be deterministic and stable.
function seedFromStrings(parts) {
    let h = 2166136261 >>> 0; // FNV-1a
    for (const part of parts) {
        for (let i = 0; i < part.length; i++) {
            h ^= part.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
    }
    return h >>> 0;
}
