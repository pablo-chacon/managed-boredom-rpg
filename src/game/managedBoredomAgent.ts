import { guardInput } from "./ai/aiGuard";
import { npcDeflection, systemDeflection } from "./ai/aiResponses";
import { callLLM } from "./ai/callLLM";


async function respondWithAI(
  userInput: string,
  context: string,
  mode: "npc" | "system"
): Promise<string> {
  const guard = guardInput(userInput, mode);

  if (guard.kind === "npc_deflection") {
    return npcDeflection();
  }

  if (guard.kind === "system_deflection") {
    return systemDeflection();
  }

  // AI speaks freely
  return callLLM({
    systemPrompt: context,
    userMessage: userInput,
  });
}
