import { RNG } from "../rng";

const WORDS = [
  "professional",
  "experienced",
  "motivated",
  "structured",
  "reliable",
  "adaptable",
  "team-oriented",
  "detail-focused",
  "results-driven",
  "self-managed",
  "flexible",
  "dedicated",
  "organized",
  "responsible",
  "solution-focused",
  "efficient",
  "communicative",
  "task-oriented",
  "proactive",
  "compliant",
];

const SENTENCE_TEMPLATES = [
  "I am a {adj} individual with demonstrated ability to meet expectations.",
  "My background reflects a {adj} approach to assigned responsibilities.",
  "I consistently apply a {adj} mindset to professional obligations.",
  "Colleagues describe my work style as {adj} and dependable.",
  "I aim to contribute in a {adj} and structured manner.",
];

function pick<T>(rng: RNG, items: readonly T[]): T {
  const idx = Math.floor(rng.next() * items.length);
  return items[Math.min(idx, items.length - 1)];
}

export function generateCvLorem(
  rng: RNG,
  sentences: number = 3
): string[] {
  const lines: string[] = [];

  for (let i = 0; i < sentences; i++) {
    const template = pick(rng, SENTENCE_TEMPLATES);
    const adj = pick(rng, WORDS);
    lines.push(template.replace("{adj}", adj));
  }

  return lines;
}
