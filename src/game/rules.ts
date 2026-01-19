export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function energyBand(energy: number): "LOW" | "MED" | "HIGH" {
  if (energy < 35) return "LOW";
  if (energy > 70) return "HIGH";
  return "MED";
}

// Managed boredom regulator: nudge toward MED.
// - If HIGH: add obligations that drain energy + micro-costs.
// - If LOW: offer stabilizers that lift the floor but cap the ceiling (antidepressants).
export function regulatorDrift(energy: number): number {
  // Passive decay toward 55
  const target = 55;
  const delta = (target - energy) * 0.12;
  return delta;
}
