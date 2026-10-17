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
function extractCleanFolderId(input) {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }
  const clean = trimmed.split(/[?#]/)[0].replace(/\/+$/, "");
  const lastPart = clean.split("/").pop() || "";
  if (/^[a-zA-Z0-9_-]{10,}$/.test(lastPart)) {
    return lastPart;
  }
  return trimmed;
}
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
function encryptTokenPayload(payload, clientSecret) {
  const key = crypto.createHash("sha256").update(clientSecret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${Buffer.from(encrypted, "base64").toString("base64url")}`;
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
async function getValidAccessToken(origin, req) {
  const config = getEnvConfig(origin);
  let stored = null;
  if (req?.headers?.cookie && config.clientSecret) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.gdrive_session) {
      stored = decryptTokenPayload(cookies.gdrive_session, config.clientSecret);
    }
  }
  if (!stored || !stored.access_token) {
    stored = getStoredTokens();
  }
  if (!stored || !stored.access_token) {
    throw new Error("NO_TOKEN: Google Drive is not connected. Please authorize Google Drive first.");
  }
  if (Date.now() < stored.expires_at - 6e4) {
    return {
      accessToken: stored.access_token,
      email: stored.connected_email
    };
  }
  if (!stored.refresh_token) {
    clearStoredTokens();
    throw new Error(
      'EXPIRED_NO_REFRESH: Google Drive session expired. Please click "Authorize Drive" to reconnect.'
    );
  }
  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      `Cannot refresh Google Drive token: Missing ${config.missingConfig.join(", ")} in server environment.`
    );
  }
  const bodyParams = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: stored.refresh_token,
    grant_type: "refresh_token"
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyParams.toString()
  });
  const data = await response.json();
  if (!response.ok) {
    if (data.error === "invalid_grant") {
      clearStoredTokens();
      throw new Error(
        "REVOKED: Google Drive authorization was revoked or expired. Please authorize Google Drive again."
      );
    }
    throw new Error(`Token Refresh Failed: ${data.error_description || data.error}`);
  }
  const expiresInSec = Number(data.expires_in) || 3600;
  const updatedTokens = {
    ...stored,
    access_token: data.access_token,
    refresh_token: data.refresh_token || stored.refresh_token,
    expires_at: Date.now() + expiresInSec * 1e3,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveStoredTokens(updatedTokens);
  let updatedCookie;
  if (config.clientSecret) {
    const isHttps = origin ? origin.startsWith("https") : process.env.NODE_ENV === "production";
    updatedCookie = serializeCookie(
      "gdrive_session",
      encryptTokenPayload(updatedTokens, config.clientSecret),
      {
        maxAge: 30 * 24 * 3600,
        secure: isHttps
      }
    );
  }
  return {
    accessToken: updatedTokens.access_token,
    email: updatedTokens.connected_email,
    updatedCookie
  };
}
async function listFolderFiles(folderIdInput, origin, req) {
  const cleanFolderId = extractCleanFolderId(folderIdInput);
  if (!cleanFolderId) {
    return {
      success: false,
      folderId: "",
      files: [],
      errorMessage: "Invalid Google Drive folder ID format."
    };
  }
  const { accessToken, email, updatedCookie } = await getValidAccessToken(origin, req);
  const query = encodeURIComponent(`'${cleanFolderId}' in parents and trashed = false`);
  const fields = encodeURIComponent(
    "files(id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, modifiedTime)"
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });
  if (response.ok) {
    const data = await response.json();
    const files = (data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType || "application/octet-stream",
      size: Number(f.size) || 0,
      webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
      thumbnailLink: f.thumbnailLink,
      modifiedTime: f.modifiedTime,
      virtualFolder: "Imported Drive Folder"
    }));
    return {
      success: true,
      folderId: cleanFolderId,
      files,
      connectedEmail: email,
      updatedCookie
    };
  }
  const errorData = await response.json().catch(() => ({}));
  const googleMsg = errorData.error?.message || response.statusText;
  if (response.status === 404) {
    return {
      success: false,
      folderId: cleanFolderId,
      files: [],
      connectedEmail: email,
      updatedCookie,
      errorMessage: `Folder not found (404) or connected account "${email}" lacks access. Please verify folder ID and share Viewer access with ${email}.`
    };
  }
  if (response.status === 403) {
    return {
      success: false,
      folderId: cleanFolderId,
      files: [],
      connectedEmail: email,
      updatedCookie,
      errorMessage: `Access Denied (403): Connected account "${email}" does not have permission to view folder "${cleanFolderId}". Please share the folder with ${email} in Google Drive.`
    };
  }
  if (response.status === 401) {
    return {
      success: false,
      folderId: cleanFolderId,
      files: [],
      connectedEmail: email,
      updatedCookie,
      errorMessage: `Google Drive authorization is invalid or expired (401). Please click "Authorize Drive" to re-authenticate.`
    };
  }
  return {
    success: false,
    folderId: cleanFolderId,
    files: [],
    connectedEmail: email,
    updatedCookie,
    errorMessage: `Google Drive API error (${response.status}): ${googleMsg}`
  };
}

// server/drive/files.ts
async function handler(req, res) {
  const origin = req.headers["x-forwarded-host"] ? `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"]}` : req.headers.host ? `http://${req.headers.host}` : "https://atul-expense-manager.vercel.app";
  const query = new URL(req.url || "/", origin).searchParams;
  const rawFolderId = query.get("folderId");
  if (!rawFolderId) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "MISSING_PARAM", message: 'Missing "folderId" query parameter.' }));
    return;
  }
  const cleanFolderId = extractCleanFolderId(rawFolderId);
  try {
    const result = await listFolderFiles(cleanFolderId, origin, req);
    if (result.updatedCookie) {
      res.setHeader("Set-Cookie", result.updatedCookie);
    }
    if (result.success) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    } else {
      const is403 = result.errorMessage?.includes("403") || result.errorMessage?.includes("Access Denied");
      const is404 = result.errorMessage?.includes("404") || result.errorMessage?.includes("not found");
      const is401 = result.errorMessage?.includes("401") || result.errorMessage?.includes("invalid") || result.errorMessage?.includes("NO_TOKEN");
      res.statusCode = is401 ? 401 : is403 ? 403 : is404 ? 404 : 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    }
  } catch (err) {
    const msg = err.message || "Server error while accessing Google Drive.";
    const isUnauth = msg.includes("NO_TOKEN") || msg.includes("EXPIRED") || msg.includes("REVOKED");
    res.statusCode = isUnauth ? 401 : 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        folderId: cleanFolderId,
        files: [],
        errorMessage: msg
      })
    );
  }
}
export {
  handler as default
};
