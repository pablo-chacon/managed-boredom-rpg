"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managedBoredomAgent = managedBoredomAgent;
const aiGuard_1 = require("./ai/aiGuard");
const aiPrompts_1 = require("./ai/aiPrompts");
const aiResponses_1 = require("./ai/aiResponses");
const callLLM_1 = require("./ai/callLLM");
/*
  Event categorization (lightweight, non-invasive)
*/
function categorizeEvent(event) {
    if (!event)
        return "none";
    const id = event.id.toLowerCase();
    if (id.includes("police") || id.includes("confiscation") || id.includes("investigation"))
        return "police";
    if (id.includes("performance") || id.includes("grace") || id.includes("promotion") || id.includes("termination"))
        return "hr";
    if (id.includes("welfare") || id.includes("meeting") || id.includes("filing") || id.includes("application"))
        return "welfare";
    if (id.includes("doctor") || id.includes("health") || id.includes("seminar"))
        return "health";
    return "admin";
}
/*
  Event framing directive for LLM mode
*/
function buildEventDirective(category) {
    switch (category) {
        case "police":
            return `
Interpret this as a protective regulatory intervention.
Emphasize order and societal stability.
`;
        case "hr":
            return `
Interpret this as a performance alignment process.
Frame it as procedural and opportunity-based.
`;
        case "welfare":
            return `
Interpret this as structured assistance with compliance expectations.
Emphasize cooperation.
`;
        case "health":
            return `
Interpret this as institutional wellbeing support.
Frame it as preventive and stabilizing.
`;
        case "admin":
            return `
Interpret this as routine administrative variance.
Maintain bureaucratic neutrality.
`;
        default:
            return "";
    }
}
/*
  Pure mathematical tone derivation.
*/
function deriveTone(state, economy, rng) {
    const energyNorm = state.energy / 100;
    const survival = economy.living.monthlyCost;
    const cashNorm = Math.max(0, Math.min(1, state.cash / (survival * 3)));
    const dependencyIndex = (state.onWelfare ? 0.4 : 0) +
        (state.unemployedMonths > 2 ? 0.2 : 0) +
        (1 - energyNorm) * 0.2 +
        (cashNorm < 0.3 ? 0.2 : 0);
    const stabilityIndex = (state.jobId ? 0.4 : 0) +
        energyNorm * 0.3 +
        cashNorm * 0.3;
    let neutral = stabilityIndex * 0.7 +
        (1 - dependencyIndex) * 0.3;
    let worried = dependencyIndex * 0.8 +
        (energyNorm < 0.2 ? 0.2 : 0);
    let supportive = (state.applicationsThisMonth > 0 ? 0.3 : 0) +
        (energyNorm > 0.4 ? 0.2 : 0);
    let helpful = (!state.hasPassport &&
        state.passportMonthsLeft === 0 &&
        energyNorm > 0.6 &&
        cashNorm > 0.5)
        ? 0.2
        : 0;
    const total = neutral + worried + supportive + helpful || 1;
    neutral /= total;
    worried /= total;
    supportive /= total;
    helpful /= total;
    const r = rng.nextFloat();
    if (r < neutral)
        return "neutral";
    if (r < neutral + worried)
        return "worried";
    if (r < neutral + worried + supportive)
        return "supportive";
    return "helpful";
}
/*
  Deterministic narration with event framing
*/
function deterministicNarration(tone, state, lastEvent) {
    const category = categorizeEvent(lastEvent);
    let eventLine = "";
    if (lastEvent) {
        switch (category) {
            case "police":
                eventLine = `${lastEvent.label} has been processed under regulatory oversight.`;
                break;
            case "hr":
                eventLine = `${lastEvent.label} reflects performance evaluation activity.`;
                break;
            case "welfare":
                eventLine = `${lastEvent.label} is part of structured assistance.`;
                break;
            case "health":
                eventLine = `${lastEvent.label} relates to institutional wellbeing support.`;
                break;
            default:
                eventLine = `${lastEvent.label} has been recorded.`;
        }
    }
    switch (tone) {
        case "worried":
            return `${eventLine} We are concerned about your current trajectory. Continued engagement is strongly advised.`;
        case "supportive":
            return `${eventLine} Your efforts are acknowledged. Maintaining consistency is beneficial.`;
        case "helpful":
            return `${eventLine} Administrative actions are more effective when energy levels are stable. Plan accordingly.`;
        case "neutral":
        default:
            return `${eventLine} The process is functioning as intended. Continue following standard procedure.`;
    }
}
/*
  Live LLM context block
*/
function buildContextBlock(state, economy, lastAction, lastEvent) {
    return `
Context:

Month: ${state.month}
Energy: ${state.energy}
Cash: ${state.cash}
Employed: ${state.jobId ? "yes" : "no"}
On welfare: ${state.onWelfare ? "yes" : "no"}
Has passport: ${state.hasPassport ? "yes" : "no"}
Passport processing months left: ${state.passportMonthsLeft}
Recent action: ${lastAction}
Recent event: ${lastEvent ? lastEvent.label : "none"}

Respond in 2-4 sentences.
`;
}
/*
  Public Case Manager Entry Point
*/
async function managedBoredomAgent(params) {
    const { state, economy, lastAction, lastEvent, userInput = "", rng, mode = "deterministic" } = params;
    const tone = deriveTone(state, economy, rng);
    if (mode === "deterministic") {
        return deterministicNarration(tone, state, lastEvent);
    }
    // Live AI mode
    const guard = (0, aiGuard_1.guardInput)(userInput, "system");
    if (guard.kind === "npc_deflection") {
        return (0, aiResponses_1.npcDeflection)();
    }
    if (guard.kind === "system_deflection") {
        return (0, aiResponses_1.systemDeflection)();
    }
    const contextualStateBlock = buildContextBlock(state, economy, lastAction, lastEvent);
    const eventCategory = categorizeEvent(lastEvent);
    const eventDirective = buildEventDirective(eventCategory);
    const systemPrompt = aiPrompts_1.SYSTEM_PROMPT +
        (0, aiPrompts_1.buildToneDirective)(tone) +
        eventDirective +
        contextualStateBlock;
    return (0, callLLM_1.callLLM)({
        systemPrompt,
        userMessage: userInput || "Provide administrative commentary.",
    });
}
