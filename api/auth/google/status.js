// server/_lib/googleAuth.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
var SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/userinfo.email"
].join(" ");
var LOCAL_DATA_DIR = path.resolve(process.cwd(), ".data");
var TMP_DATA_DIR = "/tmp";
var TOKEN_FILE_NAME = "google_drive_tokens.json";
function getEnvConfig(reqOrigin) {
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  let redirectUri = (process.env.GOOGLE_REDIRECT_URI || "").trim();
  if (!redirectUri) {
    const origin = reqOrigin || process.env.APP_ORIGIN || "https://atul-expense-manager.vercel.app";
    redirectUri = `${origin}/api/auth/google/callback`;
  }
  if (reqOrigin && (reqOrigin.includes("localhost") || reqOrigin.includes("127.0.0.1"))) {
    if (process.env.GOOGLE_REDIRECT_URI_LOCAL) {
      redirectUri = process.env.GOOGLE_REDIRECT_URI_LOCAL.trim();
    }
  }
  const missing = [];
  if (!clientId) missing.push("GOOGLE_CLIENT_ID");
  if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET");
  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured: missing.length === 0,
    missingConfig: missing
  };
}
function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      try {
        list[name] = decodeURIComponent(val);
      } catch {
        list[name] = val;
      }
    }
  });
  return list;
}
function decryptTokenPayload(tokenStr, clientSecret) {
  if (!tokenStr || !clientSecret) return null;
  try {
    const parts = tokenStr.split(".");
    if (parts.length !== 3) return null;
    const [ivB64, authTagB64, dataB64] = parts;
    const key = crypto.createHash("sha256").update(clientSecret).digest();
    const iv = Buffer.from(ivB64, "base64url");
    const authTag = Buffer.from(authTagB64, "base64url");
    const encrypted = Buffer.from(dataB64, "base64url");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, void 0, "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}
function getStoredTokens() {
  const tryPaths = [
    path.join(LOCAL_DATA_DIR, TOKEN_FILE_NAME),
    path.join(TMP_DATA_DIR, TOKEN_FILE_NAME)
  ];
  for (const p of tryPaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        if (raw.trim()) {
          return JSON.parse(raw);
        }
      }
    } catch {
    }
  }
  return null;
}

// server/auth/google/status.ts
async function handler(req, res) {
  try {
    const origin = req.headers["x-forwarded-host"] ? `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"]}` : req.headers.host ? `http://${req.headers.host}` : "https://atul-expense-manager.vercel.app";
    const config = getEnvConfig(origin);
    let tokens = null;
    if (req.headers?.cookie && config.clientSecret) {
      const cookies = parseCookies(req.headers.cookie);
      if (cookies.gdrive_session) {
        tokens = decryptTokenPayload(cookies.gdrive_session, config.clientSecret);
      }
    }
    if (!tokens || !tokens.access_token) {
      tokens = getStoredTokens();
    }
    const isConnected = Boolean(tokens && tokens.access_token);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        isConnected,
        connectedEmail: tokens?.connected_email,
        expiresAt: tokens?.expires_at,
        scope: tokens?.scope,
        isConfigured: config.isConfigured,
        missingConfig: config.missingConfig,
        redirectUri: config.redirectUri,
        clientIdMasked: config.clientId ? `${config.clientId.substring(0, 12)}...` : void 0
      })
    );
  } catch (err) {
    console.error("[API status error]:", err);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        isConnected: false,
        isConfigured: false,
        missingConfig: ["SERVER_EXCEPTION"],
        redirectUri: "https://atul-expense-manager.vercel.app/api/auth/google/callback",
        error: err.message
      })
    );
  }
}
export {
  handler as default
};
