import pkg from "whatsapp-web.js";
import { setQr, clearQr } from "./qrstore.js";
import { classifyMessageContent } from "./aiClassifier.js";
import { generateAutoReply } from "./aiResponder.js";

export function createWhatsAppClient() {
  const { Client, LocalAuth } = pkg;

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
      headless: true
    }
  });

  client.on("qr", (qr) => {
    console.log("[WA] New QR generated");
    setQr(qr);
  });

  client.on("ready", () => {
    console.log("[WA] Client is ready!");
    clearQr();
  });

  client.on("authenticated", () => {
    console.log("[WA] Authenticated");
  });

  client.on("auth_failure", (msg) => {
    console.error("[WA] Auth failure", msg);
  });

  // Basic reply handler
  client.on("message", async (msg) => {
    try {
      if (msg.fromMe) return;

      const chat = await msg.getChat();
      if (chat.isGroup) {
        console.log("[WA] Message is from a group, ignoring.");
        return;
      }

      const text = (msg.body || "").toLowerCase();
      let image = null;

      // Only bother downloading if it's an image message with media
      if (msg.hasMedia && msg.type === "image") {
        const media = await msg.downloadMedia(); // returns MessageMedia
        if (media && media.data && media.mimetype) {
          image = {
            mimetype: media.mimetype,
            base64: media.data
          };
        }
      }
      // If message is completely empty and no image, do nothing
      if (!text && !image) return;

      // Get sender name for personalization
      let senderName = "";
      try {
        const contact = await msg.getContact();
        senderName =
          contact.pushname ||
          contact.verifiedName ||
          contact.name ||
          contact.number ||
          "";
      } catch (err) {
        console.error("[WA] Failed to get contact info:", err);
        senderName = msg.author || msg.from || "";
      }

      console.log(`[WA] Incoming message: ${text} from ${senderName}`);

      //   const lastTenChatMessages = await chat.fetchMessages({ limit: 10 });
      //   console.log(
      //     "[WA] Last 10 messages in chat:",
      //     lastTenChatMessages.map((m) => m.body)
      //   );

      const classification = await classifyMessageContent({ text, image });
      console.log("[AI] Classification:", classification);

      const { category, confidence } = classification;

      // If classification is too uncertain, treat as "other"
      const finalCategory = confidence < 0.4 ? "other" : category;

      // 2) DECIDE WHEN TO USE AI REPLY
      const availableAutoreplyCategories = [
        "good_morning",
        "good_night",
        "greeting",
        "thanks"
      ];
      if (availableAutoreplyCategories.includes(finalCategory)) {
        const replyText = await generateAutoReply({
          category: finalCategory,
          text,
          senderName
        });

        console.log("[AI] Auto-reply:", replyText);
        if (replyText) {
          await msg.reply(replyText);
        }
      }
    } catch (err) {
      console.error("[WA] Error handling message:", err);
    }
  });

  async function start() {
    console.log("[WA] Initializing client...");
    await client.initialize();
  }

  return { client, start };
}
