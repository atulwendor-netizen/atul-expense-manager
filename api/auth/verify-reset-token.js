// server/_lib/tokenAuth.ts
import crypto from "crypto";
var CLIENT_SALT = "atul-expense-reset-salt-2026-auth!";
function createClientResetToken(email, expiresAt) {
  const str = `${email.trim().toLowerCase()}:${expiresAt}:${CLIENT_SALT}`;
  let h1 = 3735928559 ^ str.length;
  let h2 = 1103547991 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const part2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `rst_${part1}${part2}`;
}
function getResetSecret() {
  return process.env.RESET_SECRET || process.env.GOOGLE_CLIENT_SECRET || "atul-expense-manager-secure-reset-secret-2026";
}
function generateResetToken(email, expiresAt) {
  const secret = getResetSecret();
  const cleanEmail = email.trim().toLowerCase();
  return crypto.createHmac("sha256", secret).update(`${cleanEmail}:${expiresAt}`).digest("hex");
}
function verifyResetToken(email, token, expiresAt) {
  if (!email || !token || !expiresAt) {
    return { valid: false, reason: "Missing token parameters." };
  }
  if (Date.now() > Number(expiresAt)) {
    return { valid: false, reason: "Password reset link has expired. Please request a new reset link." };
  }
  if (token.startsWith("rst_")) {
    const clientExpected = createClientResetToken(email, expiresAt);
    if (token === clientExpected) {
      return { valid: true };
    }
    return { valid: false, reason: "Invalid or forged reset token." };
  }
  const expected = generateResetToken(email, expiresAt);
  try {
    const isValid = crypto.timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
    if (!isValid) {
      return { valid: false, reason: "Invalid or tampered reset token signature." };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: "Token verification failed." };
  }
}
async function parseJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

// server/auth/verify-reset-token.ts
async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "METHOD_NOT_ALLOWED", message: "Only POST method is allowed." }));
    return;
  }
  try {
    const body = await parseJsonBody(req);
    const { email, token, expires } = body;
    const result = verifyResetToken(email, token, expires);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ valid: false, reason: err.message || "Server error verifying token" }));
  }
}
export {
  handler as default
};
