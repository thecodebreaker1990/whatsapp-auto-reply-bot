import { runLLM } from "./llm.js";

export async function generateAutoReply({
  category,
  text = "",
  senderName = ""
}) {
  const safeText = text.trim();

  const prompt = `
You are an assistant helping me auto-reply to WhatsApp messages.

Message details:
- Category: "${category}"
- Sender name (may be empty): "${senderName}"
- Original message text : """${safeText}"""

Rules:
- Reply in a warm, friendly, natural tone.
- Use at most 2 sentences.
- You MAY use Maxmimum 1 to 3 emojis but don't overdo it.
- Match the vibe of the category:
  - good_morning: positive, energizing start of day.
  - good_night: calm, comforting, end of day.
  - greeting: friendly, open.
  - casual_chat: light, conversational.
  - thanks: appreciative.
  - complaint: empathetic and supportive.
  - other: neutral and polite.

Return ONLY the reply text. No quotes, no JSON, no explanation.
`;

  const rawResponse = await runLLM({
    messages: [
      {
        role: "system",
        content: "You are a friendly WhatsApp auto-reply assistant."
      },
      { role: "user", content: prompt }
    ],
    tools: []
  });

  const reply = rawResponse?.content?.trim() || "Thank you! 😊";

  return reply;
}
