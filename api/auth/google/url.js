// server/_lib/googleAuth.ts
import path from "path";
import crypto from "crypto";
var SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/userinfo.email"
].join(" ");
var LOCAL_DATA_DIR = path.resolve(process.cwd(), ".data");
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
function generateStateToken(clientSecret, returnTo = "/payment-proofs") {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = JSON.stringify({ nonce, returnTo: returnTo || "/payment-proofs", t: Date.now() });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", clientSecret).update(payloadB64).digest("base64url");
  return {
    state: `${payloadB64}.${sig}`,
    nonce
  };
}
function generateAuthUrl(origin, state) {
  const config = getEnvConfig(origin);
  if (!config.clientId) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID. Please configure it in your environment or Vercel Environment Variables."
    );
  }
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    // Mandatory to receive refresh_token
    prompt: "consent",
    // Guarantees refresh_token on re-authorization
    include_granted_scopes: "true",
    state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// server/auth/google/url.ts
async function handler(req, res) {
  const userRole = req.headers["x-user-role"];
  if (userRole === "manager") {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "FORBIDDEN", message: "Audit role is read-only. Cannot modify Google Drive authorization." }));
    return;
  }
  const origin = req.headers["x-forwarded-host"] ? `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"]}` : req.headers.host ? `http://${req.headers.host}` : "https://atul-expense-manager.vercel.app";
  const config = getEnvConfig(origin);
  if (!config.isConfigured) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "CONFIG_MISSING",
        message: `Missing Google Cloud OAuth credentials: ${config.missingConfig.join(", ")}. Please configure them in server environment variables.`,
        missing: config.missingConfig,
        redirectUri: config.redirectUri
      })
    );
    return;
  }
  try {
    const query = new URL(req.url || "/", origin).searchParams;
    const returnTo = query.get("returnTo") || "/payment-proofs";
    const { state } = generateStateToken(config.clientSecret, returnTo);
    const url = generateAuthUrl(origin, state);
    if (query.get("redirect") === "true") {
      res.statusCode = 302;
      res.setHeader("Location", url);
      res.end();
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ url, redirectUri: config.redirectUri, isConfigured: true }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "SERVER_ERROR", message: err.message }));
  }
}
export {
  handler as default
};
