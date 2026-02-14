import { guardInput } from "./ai/aiGuard";
import { SYSTEM_PROMPT, buildToneDirective } from "./ai/aiPrompts";
import { npcDeflection, systemDeflection } from "./ai/aiResponses";
import { callLLM } from "./ai/callLLM";
import { GameState, Economy } from "./state";

/*
  Case Manager Tone Types
*/
type Tone = "neutral" | "supportive" | "helpful" | "worried";

type CaseManagerMode = "live" | "deterministic";


interface LastEvent {
  id: string;
  label: string;
  energyDelta: number;
  cost: number;
}


interface CaseManagerParams {
  state: GameState;
  economy: Economy;
  lastAction: string;
  lastEvent?: LastEvent;
  userInput?: string;
  rng: { nextFloat(): number };
  mode?: CaseManagerMode;
}

/*
  Event categorization (lightweight, non-invasive)
*/
function categorizeEvent(
  event?: LastEvent
):
  | "police"
  | "hr"
  | "welfare"
  | "health"
  | "admin"
  | "none" {

  if (!event) return "none";

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
function buildEventDirective(
  category: ReturnType<typeof categorizeEvent>
): string {

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
function deriveTone(
  state: GameState,
  economy: Economy,
  rng: { nextFloat(): number }
): Tone {

  const energyNorm = state.energy / 100;

  const survival = economy.living.monthlyCost;
  const cashNorm = Math.max(
    0,
    Math.min(1, state.cash / (survival * 3))
  );


  const dependencyIndex =
    (state.onWelfare ? 0.4 : 0) +
    (state.unemployedMonths > 2 ? 0.2 : 0) +
    (1 - energyNorm) * 0.2 +
    (cashNorm < 0.3 ? 0.2 : 0);


  const stabilityIndex =
    (state.jobId ? 0.4 : 0) +
    energyNorm * 0.3 +
    cashNorm * 0.3;


  let neutral =
    stabilityIndex * 0.7 +
    (1 - dependencyIndex) * 0.3;


  let worried =
    dependencyIndex * 0.8 +
    (energyNorm < 0.2 ? 0.2 : 0);


  let supportive =
    (state.applicationsThisMonth > 0 ? 0.3 : 0) +
    (energyNorm > 0.4 ? 0.2 : 0);


  let helpful =
    (!state.hasPassport &&
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


  if (r < neutral) return "neutral";
  if (r < neutral + worried) return "worried";
  if (r < neutral + worried + supportive) return "supportive";
  return "helpful";
}

/*
  Deterministic narration with event framing
*/
function deterministicNarration(
  tone: Tone,
  state: GameState,
  lastEvent?: LastEvent
): string {

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
function buildContextBlock(
  state: GameState,
  economy: Economy,
  lastAction: string,
  lastEvent?: LastEvent
): string {

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
export async function managedBoredomAgent(
  params: CaseManagerParams
): Promise<string> {

  const {
    state,
    economy,
    lastAction,
    lastEvent,
    userInput = "",
    rng,
    mode = "deterministic"
  } = params;


  const tone = deriveTone(state, economy, rng);


  if (mode === "deterministic") {
    return deterministicNarration(tone, state, lastEvent);
  }

  // Live AI mode
  const guard = guardInput(userInput, "system");


  if (guard.kind === "npc_deflection") {
    return npcDeflection();
  }


  if (guard.kind === "system_deflection") {
    return systemDeflection();
  }


  const contextualStateBlock = buildContextBlock(
    state,
    economy,
    lastAction,
    lastEvent
  );


  const eventCategory = categorizeEvent(lastEvent);
  const eventDirective = buildEventDirective(eventCategory);


  const systemPrompt =
    SYSTEM_PROMPT +
    buildToneDirective(tone) +
    eventDirective +
    contextualStateBlock;


  return callLLM({
    systemPrompt,
    userMessage: userInput || "Provide administrative commentary.",
  });
}
