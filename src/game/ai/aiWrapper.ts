import { guardInput } from "./aiGuard";
import { npcDeflection, systemDeflection } from "./aiResponses";
import { DistressEvent } from "../distress";
import { GameState, Economy } from "../state";
import { managedBoredomAgent } from "../managedBoredomAgent";
import { RNG } from "../rng";


export type AIMode = "npc" | "system";


export async function respondWithAI(
  input: string,
  mode: AIMode,
  state: GameState,
  economy: Economy,
  rng: RNG,
  opts?: {
    caseManagerMode?: "live" | "deterministic";
    lastEvent?: {
      id: string;
      label: string;
      energyDelta: number;
      cost: number;
    };
  }
): Promise<{ text: string; state: GameState }> {

  const guard = guardInput(input, mode);

  if (guard.kind !== "allowed") {
    const event: DistressEvent = {
      month: state.month,
      input,
      source: mode,
    };

    return {
      text:
        guard.kind === "npc_deflection"
          ? npcDeflection()
          : systemDeflection(),
      state: {
        ...state,
        distressLog: [...state.distressLog, event],
      },
    };
  }

  // Delegate to Case Manager core
  const text = await managedBoredomAgent({
    state,
    economy,
    lastAction: "player_input",
    lastEvent: opts?.lastEvent,
    userInput: input,
    rng,
    mode: opts?.caseManagerMode ?? "live",
  });

  return { text, state };
}
