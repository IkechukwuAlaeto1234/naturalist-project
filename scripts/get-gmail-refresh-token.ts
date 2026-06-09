import http from "http";
import url from "url";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = 3001;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in your .env.local file.");
  process.exit(1);
}

// Create auth URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: "code",
  scope: "https://www.googleapis.com/auth/gmail.send",
  access_type: "offline",
  prompt: "consent"
}).toString();

const server = http.createServer(async (req, res) => {
  const reqUrl = url.parse(req.url || "", true);
  
  if (reqUrl.pathname === "/oauth2callback") {
    const code = reqUrl.query.code as string;
    
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end("<h1>Authentication Failed</h1><p>No code returned from Google.</p>");
      return;
    }

    try {
      // Exchange authorization code for tokens
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.refresh_token) {
        throw new Error(data.error_description || data.error || "Failed to retrieve refresh token");
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #10b981;">🎉 Authentication Successful!</h1>
            <p>You can close this tab and return to your terminal.</p>
          </body>
        </html>
      `);
      
      console.log("\n==================================================");
      console.log("🚀 SUCCESS! YOUR GMAIL REFRESH TOKEN IS:");
      console.log("==================================================");
      console.log(`\x1b[32m${data.refresh_token}\x1b[0m`);
      console.log("==================================================\n");
      console.log("👉 Add this line to your .env.local file:");
      console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}\n`);
      
      server.close(() => {
        process.exit(0);
      });
    } catch (err: any) {
      console.error("❌ Token exchange failed:", err.message);
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(`<h1>Token Exchange Failed</h1><p>${err.message}</p>`);
      process.exit(1);
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`\n🔑 Starting Google OAuth Server on port ${PORT}...`);
  console.log(`\n📢 IMPORTANT PRE-REQUISITE:`);
  console.log(`Go to Google Cloud Console -> Credentials`);
  console.log(`Edit your Web OAuth client ID and add this exact URL to "Authorized redirect URIs":`);
  console.log(`👉 \x1b[36m${REDIRECT_URI}\x1b[0m\n`);
  console.log(`Press Enter once you have added it to open the login screen in your browser...`);
  
  process.stdin.once("data", () => {
    console.log("Opening browser...");
    exec(`start "" "${authUrl}"`);
  });
});
