// AI-Wrapper
import { guardInput } from "./aiGuard";
import { npcDeflection, systemDeflection } from "./aiResponses";
import { DistressEvent } from "./distress";
import { GameState } from "./state";
import { callLLM } from "./callLLM";
import { SYSTEM_PROMPT, NPC_PROMPT } from "./aiPrompts";


export async function respondWithAI(
  input: string,
  mode: "npc" | "system",
  state: GameState
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

  const prompt =
    mode === "npc" ? NPC_PROMPT : SYSTEM_PROMPT;

  const text = await callLLM({
    systemPrompt: prompt,
    userMessage: input,
  });

  return { text, state };
}
export { callLLM };

