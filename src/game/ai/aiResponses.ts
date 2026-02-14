const NPC_DEFLECTIONS = [
  "Have you tried following the standard procedure?",
  "It might be helpful to speak with a professional.",
  "Perhaps discussing this with a doctor could provide clarity.",
  "Continuing with the recommended process is advisable."
];

const SYSTEM_DEFLECTIONS = [
  "I'm sorry you experience it like that. Continued participation is recommended.",
  "The process is functioning as intended. Please remain patient.",
  "Administrative systems require consistency. Maintain engagement.",
  "Stability improves over time when procedures are followed."
];

function randomFrom(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function npcDeflection(): string {
  return randomFrom(NPC_DEFLECTIONS);
}

export function systemDeflection(): string {
  return randomFrom(SYSTEM_DEFLECTIONS);
}