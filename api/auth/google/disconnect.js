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
function serializeCookie(name, val, options = {}) {
  const opt = {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    ...options
  };
  let str = `${name}=${encodeURIComponent(val)}; Path=${opt.path}`;
  if (opt.maxAge !== void 0) {
    str += `; Max-Age=${Math.floor(opt.maxAge)}`;
  }
  if (opt.httpOnly) str += "; HttpOnly";
  if (opt.secure) str += "; Secure";
  if (opt.sameSite) str += `; SameSite=${opt.sameSite}`;
  return str;
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
function clearStoredTokens() {
  const paths = [
    path.join(LOCAL_DATA_DIR, TOKEN_FILE_NAME),
    path.join(TMP_DATA_DIR, TOKEN_FILE_NAME)
  ];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    } catch {
    }
  }
}
async function disconnectGoogle(origin, req) {
  const config = getEnvConfig(origin);
  let stored = null;
  if (req?.headers?.cookie && config.clientSecret) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.gdrive_session) {
      stored = decryptTokenPayload(cookies.gdrive_session, config.clientSecret);
    }
  }
  if (!stored) {
    stored = getStoredTokens();
  }
  if (stored?.access_token) {
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(stored.access_token)}`,
        { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
    } catch {
    }
  }
  clearStoredTokens();
  const clearCookie = serializeCookie("gdrive_session", "", { maxAge: 0 });
  return { success: true, clearCookie };
}

// server/auth/google/disconnect.ts
async function handler(req, res) {
  const userRole = req.headers["x-user-role"];
  if (userRole === "manager") {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "FORBIDDEN", message: "Audit role is read-only. Cannot disconnect Google Drive." }));
    return;
  }
  const origin = req.headers["x-forwarded-host"] ? `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"]}` : req.headers.host ? `http://${req.headers.host}` : "https://atul-expense-manager.vercel.app";
  try {
    const { success, clearCookie } = await disconnectGoogle(origin, req);
    res.statusCode = 200;
    res.setHeader("Set-Cookie", clearCookie);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success, message: "Google Drive disconnected and session purged." }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "DISCONNECT_FAILED", message: err.message }));
  }
}
export {
  handler as default
};
