import "dotenv/config.js";
import { createWhatsAppClient } from "./whatsappclient.js";
import { createWebServer } from "./webserver.js";

async function main() {
  // Start Express QR server
  const web = createWebServer({ port: process.env.PORT || 3000 });
  web.start();

  // Start WhatsApp client
  const wa = createWhatsAppClient();
  await wa.start();

  console.log("[APP] Bot + Web server started.");
}

main().catch((err) => {
  console.error("[APP] Fatal error:", err);
  process.exit(1);
});
