"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = void 0;
exports.energyBand = energyBand;
exports.regulatorDrift = regulatorDrift;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
exports.clamp = clamp;
function energyBand(energy) {
    if (energy < 35)
        return "LOW";
    if (energy > 70)
        return "HIGH";
    return "MED";
}
// Managed boredom regulator: nudge toward MED.
// - If HIGH: add obligations that drain energy + micro-costs.
// - If LOW: offer stabilizers that lift the floor but cap the ceiling (antidepressants).
function regulatorDrift(energy) {
    // Passive decay toward 55
    const target = 55;
    const delta = (target - energy) * 0.12;
    return delta;
}
