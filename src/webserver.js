import express from "express";
import QRCode from "qrcode";
import { getQr } from "./qrstore.js";

export function createWebServer({ port = 3000 } = {}) {
  const app = express();

  app.use(express.static("public"));

  app.get("/", (req, res) => {
    res.send(`
      <h1>WhatsApp Auto reply Bot</h1>
      <p>Visit <a href="/qr">/qr</a> to scan your QR code.</p>
    `);
  });

  app.get("/qr", async (req, res) => {
    const qrString = getQr();

    if (!qrString) {
      return res.send("<h3>No QR available. Refresh in a few seconds.</h3>");
    }

    const dataUrl = await QRCode.toDataURL(qrString);

    res.send(`
      <html>
        <body style="text-align:center;">
          <h1>Scan QR to Login</h1>
          <img src="${dataUrl}" width="300"/>
        </body>
      </html>
    `);
  });

  function start() {
    app.listen(port, () => {
      console.log(`[WEB] Server running at http://localhost:${port}`);
    });
  }

  return { start };
}
