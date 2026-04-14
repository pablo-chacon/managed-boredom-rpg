"use strict";
/**
 * Managed Boredom Monthly Narrator
 *
 * One call per month. The narrator receives the full month log and
 * current state, and returns a single administrative observation.
 *
 * Voice: system output. Not a character. Not a villain.
 * Clinical. Procedural. Accurate. Never sympathetic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthlyNarration = monthlyNarration;
const API_KEY = process.env.LLM_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const SYSTEM_PROMPT = `You are the automated case log system for Managed Boredom.

Your function is to generate a single administrative observation at the end of each month.
You are not a person. You do not have opinions. You do not care.

You receive a summary of what happened during the month and the participant's current status.
You output one observation: 2 to 3 sentences, maximum.

Voice rules:
- Clinical. Factual. Flat affect.
- Never use "I". You are a system, not a speaker.
- Never express sympathy, encouragement, or judgment.
- Never use the word "unfortunately".
- Never acknowledge that the participant is suffering.
- Describe outcomes as administrative facts, not personal experiences.
- If the participant is deteriorating, note it as a statistical deviation, not a human event.
- If the participant is improving, note it as a trajectory alignment, not an achievement.
- Never suggest that exit is possible. Never suggest it is impossible either.
  Simply do not address it unless the exit verification process is explicitly in the month log.
- Administrative friction is normal. Do not explain it.

Format: plain prose. No lists. No headers. No line breaks within your output.`;
// Curated fallbacks — used when AI is off or call fails.
// Written in the same voice as the prompt targets.
const FALLBACKS = [
    "Participant trajectory remains within documented variance. No corrective action indicated.",
    "Monthly metrics recorded. Compliance status unchanged. Process continues.",
    "Administrative review complete. Current status reflects standard progression parameters.",
    "Participation recorded. Outcome distribution consistent with baseline projections.",
    "Case activity logged. No systemic deviation detected. Observation period continues.",
    "Monthly cycle concluded. Participant status indexed. No escalation triggered.",
    "Review period complete. Behavioral outputs within expected range. File updated.",
    "Statistical position unchanged relative to cohort median. Monitoring continues.",
    "Monthly assessment finalized. No anomalous patterns identified. Process ongoing.",
    "Cycle metrics within tolerance. Administrative record updated accordingly.",
    "Participant engagement logged. No exceptional circumstances noted this period.",
    "Observation window closed. Data archived. Next review scheduled automatically.",
];
function pickFallback(month) {
    return FALLBACKS[month % FALLBACKS.length];
}
function buildUserMessage(input) {
    const status = input.onWelfare
        ? "on welfare"
        : input.employed
            ? "employed"
            : `unemployed (${input.unemployedMonths} months)`;
    const events = input.monthLog
        .filter(l => !l.startsWith("---")) // strip dividers
        .filter(l => l.trim().length > 0)
        .slice(-20) // cap context length
        .join("\n");
    return `Month ${input.month} summary:

Status: ${status}
Energy: ${input.energy}/100
Cash: $${input.cash}
Exit verification months completed: ${input.exitReserveMonths}

Events this month:
${events}

Generate the monthly administrative observation.`;
}
async function monthlyNarration(input) {
    // Short-circuit if no API key configured
    if (!API_KEY) {
        return pickFallback(input.month);
    }
    try {
        const res = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                temperature: 0.35,
                max_tokens: 120,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: buildUserMessage(input) },
                ],
            }),
        });
        if (!res.ok)
            return pickFallback(input.month);
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content?.trim();
        return text || pickFallback(input.month);
    }
    catch {
        return pickFallback(input.month);
    }
}
