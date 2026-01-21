// src/game/callLLM.ts

const API_KEY = process.env.LLM_API_KEY!;
const BASE_URL = "https://api.groq.com/openai/v1";

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function callLLM({
  systemPrompt,
  userMessage,
}: {
  systemPrompt: string;
  userMessage: string;
}): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    return "I'm sorry you experience it like that. Maybe you need to see a doctor.";
  }

  const json = (await res.json()) as GroqChatResponse;

  return (
    json.choices?.[0]?.message?.content ??
    "I'm sorry you experience it like that. Maybe you need to see a doctor."
  );
}
