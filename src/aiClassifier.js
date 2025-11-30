import { runLLM } from "./llm.js";

// Define the possible categories clearly
const CATEGORIES = [
  "good_morning",
  "good_night",
  "greeting",
  "casual_chat",
  "thanks",
  "complaint",
  "other"
];

export async function classifyMessageContent({ text, image } = {}) {
  if (!text && !image) {
    return { category: "other", confidence: 0, reason: "no inputs" };
  }

  // Build user content array for multimodal message
  const userContent = [];

  if (text && text.trim()) {
    userContent.push({
      type: "text",
      text: `WhatsApp message text: """${text.trim()}"""`
    });
  }

  if (image) {
    // Build a data URL from the mimetype + base64
    const dataUrl = `data:${image.mimetype};base64,${image.base64}`;

    userContent.push({
      type: "image_url",
      image_url: {
        url: dataUrl
      }
    });
  }

  const systemPrompt = `
You are a classifier for WhatsApp messages that may contain text, images, or both.

Look at:
- The text content (if provided)
- The image (if provided, it may contain text like "Good Morning" or "Good Night" or just a decorative scene)

Classify the overall *intent* of the message into exactly ONE of:

- "good_morning": any morning greeting, including images with "Good Morning", morning quotes, sunrise, etc.
- "good_night": any night greeting, including images with "Good Night", moon, stars, etc.
- "greeting": hello/hi/hey style message that is not clearly morning/night.
- "casual_chat": general friendly talk, jokes, life updates.
- "thanks": any kind of gratitude/thank you.
- "complaint": dissatisfaction, problem, or negative feedback.
- "other": anything that does not fit above.

Return ONLY a valid JSON object:
{
  "category": "...",
  "confidence": <number between 0 and 1>,
  "reason": "<short explanation>"
}
`;

  const rawResponse = await runLLM({
    messages: [
      {
        role: "system",
        content: [
          { type: "text", text: "You output only valid JSON, no extra text." },
          { type: "text", text: systemPrompt }
        ]
      },
      {
        role: "user",
        content: userContent
      }
    ],
    tools: []
  });

  const response = rawResponse?.content?.trim() || "{}";

  try {
    const parsed = JSON.parse(response);
    // Basic safety: ensure category is in our list
    if (!CATEGORIES.includes(parsed.category)) {
      parsed.category = "other";
    }
    if (typeof parsed.confidence !== "number") {
      parsed.confidence = 0.5;
    }
    if (typeof parsed.reason !== "string") {
      parsed.reason = "no reason provided";
    }
    return parsed;
  } catch (err) {
    console.error("[AI] Failed to parse classifier JSON:", err, response);
    return { category: "other", confidence: 0.0, reason: "parse_error" };
  }
}
