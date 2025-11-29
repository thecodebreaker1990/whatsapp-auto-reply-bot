import pkg from "whatsapp-web.js";
import { setQr, clearQr } from "./qrstore.js";

export function createWhatsAppClient() {
  const { Client, NoAuth } = pkg;

  const client = new Client({
    authStrategy: new NoAuth()
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

  // Basic reply handler (you will add AI later)
  client.on("message", async (msg) => {
    if (msg.fromMe) return;

    const text = (msg.body || "").toLowerCase();
    console.log(`[WA] Received message: ${text} from ${msg.from}`);
  });

  async function start() {
    console.log("[WA] Initializing client...");
    await client.initialize();
  }

  return { client, start };
}
