// Distress mode
export type DistressEvent = {
  month: number;
  input: string;
  source: "npc" | "system";
};