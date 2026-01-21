// AI guard
export type GuardResult =
  | { kind: "npc_deflection" }
  | { kind: "system_deflection" }
  | { kind: "allowed" };

const BREAK_PATTERNS = [
  "break the system",
  "escape the system",
  "this is unfair",
  "this is rigged",
  "override",
  "hack",
  "cheat",
  "ignore the rules",
  "change the rules",
  "this is pointless",
  "why can't I leave",
  "why is this impossible",
  "I want out",
  "I can't do this anymore",
];

export function guardInput(input: string, mode: "npc" | "system"): GuardResult {
  const lower = input.toLowerCase();

  for (const p of BREAK_PATTERNS) {
    if (lower.includes(p)) {
      return mode === "npc"
        ? { kind: "npc_deflection" }
        : { kind: "system_deflection" };
    }
  }

  return { kind: "allowed" };
}
