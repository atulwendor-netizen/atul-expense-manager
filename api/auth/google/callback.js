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
function encryptTokenPayload(payload, clientSecret) {
  const key = crypto.createHash("sha256").update(clientSecret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${Buffer.from(encrypted, "base64").toString("base64url")}`;
}
function verifyStateToken(state, clientSecret) {
  if (!state || typeof state !== "string") {
    return { valid: false, returnTo: "/payment-proofs", error: "Missing OAuth state parameter." };
  }
  if (!clientSecret) {
    return { valid: false, returnTo: "/payment-proofs", error: "Server missing GOOGLE_CLIENT_SECRET." };
  }
  const parts = state.split(".");
  if (parts.length !== 2) {
    return { valid: false, returnTo: "/payment-proofs", error: "Malformed OAuth state parameter." };
  }
  const [payloadB64, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", clientSecret).update(payloadB64).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, returnTo: "/payment-proofs", error: "CSRF token mismatch / invalid state signature." };
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (Date.now() - payload.t > 15 * 60 * 1e3) {
      return { valid: false, returnTo: payload.returnTo || "/payment-proofs", error: "OAuth state parameter has expired." };
    }
    return { valid: true, returnTo: payload.returnTo || "/payment-proofs" };
  } catch {
    return { valid: false, returnTo: "/payment-proofs", error: "Invalid state payload encoding." };
  }
}
function saveStoredTokens(tokens) {
  let saved = false;
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true, mode: 448 });
    }
    fs.writeFileSync(path.join(LOCAL_DATA_DIR, TOKEN_FILE_NAME), JSON.stringify(tokens, null, 2), {
      encoding: "utf-8",
      mode: 384
    });
    saved = true;
  } catch {
  }
  if (!saved) {
    try {
      fs.writeFileSync(path.join(TMP_DATA_DIR, TOKEN_FILE_NAME), JSON.stringify(tokens, null, 2), {
        encoding: "utf-8",
        mode: 384
      });
    } catch (err) {
      console.warn("[GoogleAuth] Failed to write token file to /tmp:", err);
    }
  }
}
async function exchangeCodeForTokens(code, origin) {
  const config = getEnvConfig(origin);
  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      `Missing Google Cloud credentials: ${config.missingConfig.join(", ")}. Set them in server environment.`
    );
  }
  const bodyParams = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code"
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyParams.toString()
  });
  const data = await response.json();
  if (!response.ok) {
    const errorDesc = data.error_description || data.error || "Failed to exchange authorization code.";
    throw new Error(`Google OAuth Token Exchange Failed: ${errorDesc}`);
  }
  const expiresInSec = Number(data.expires_in) || 3600;
  const expiresAt = Date.now() + expiresInSec * 1e3;
  let connectedEmail = "authorized-user@gmail.com";
  try {
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${data.access_token}` }
    });
    if (userinfoRes.ok) {
      const userInfo = await userinfoRes.json();
      if (userInfo.email) {
        connectedEmail = userInfo.email;
      }
    }
  } catch (err) {
    console.warn("[GoogleAuth] Failed to fetch userinfo email:", err);
  }
  const storedTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    scope: data.scope,
    token_type: data.token_type || "Bearer",
    connected_email: connectedEmail,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveStoredTokens(storedTokens);
  return {
    success: true,
    email: connectedEmail,
    expiresAt,
    tokens: storedTokens
  };
}

// server/auth/google/callback.ts
async function handler(req, res) {
  const origin = req.headers["x-forwarded-host"] ? `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"]}` : req.headers.host ? `http://${req.headers.host}` : "https://atul-expense-manager.vercel.app";
  const config = getEnvConfig(origin);
  const query = new URL(req.url || "/", origin).searchParams;
  const code = query.get("code");
  const state = query.get("state");
  const error = query.get("error");
  if (error) {
    const errorMsg = error === "access_denied" ? "Google Drive authorization was denied or cancelled by the user." : `Google OAuth Error: ${error}`;
    res.statusCode = 302;
    res.setHeader("Location", `/payment-proofs?gdrive_auth=error&message=${encodeURIComponent(errorMsg)}`);
    res.end();
    return;
  }
  const stateCheck = verifyStateToken(state, config.clientSecret);
  if (!stateCheck.valid) {
    const errorMsg = stateCheck.error || "CSRF State validation failed.";
    res.statusCode = 302;
    res.setHeader("Location", `${stateCheck.returnTo}?gdrive_auth=error&message=${encodeURIComponent(errorMsg)}`);
    res.end();
    return;
  }
  const returnPath = stateCheck.returnTo || "/payment-proofs";
  if (!code) {
    res.statusCode = 302;
    res.setHeader("Location", `${returnPath}?gdrive_auth=error&message=${encodeURIComponent("No authorization code received from Google.")}`);
    res.end();
    return;
  }
  try {
    const result = await exchangeCodeForTokens(code, origin);
    const emailParam = encodeURIComponent(result.email || "authorized-user");
    const isHttps = origin.startsWith("https") || process.env.NODE_ENV === "production";
    const cookieStr = serializeCookie(
      "gdrive_session",
      encryptTokenPayload(result.tokens, config.clientSecret),
      {
        maxAge: 30 * 24 * 3600,
        // 30 days
        secure: isHttps,
        httpOnly: true,
        sameSite: "Lax",
        path: "/"
      }
    );
    res.statusCode = 302;
    res.setHeader("Set-Cookie", cookieStr);
    res.setHeader("Location", `${returnPath}?gdrive_auth=success&account=${emailParam}`);
    res.end();
  } catch (err) {
    console.error("[GoogleCallback] Token exchange failed:", err);
    const errorMsg = encodeURIComponent(err.message || "Token exchange failed.");
    res.statusCode = 302;
    res.setHeader("Location", `${returnPath}?gdrive_auth=error&message=${errorMsg}`);
    res.end();
  }
}
export {
  handler as default
};
