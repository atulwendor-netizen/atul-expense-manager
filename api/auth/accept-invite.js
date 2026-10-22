// server/_lib/tokenAuth.ts
import crypto from "crypto";
function getResetSecret() {
  return process.env.RESET_SECRET || process.env.GOOGLE_CLIENT_SECRET || "atul-expense-manager-secure-reset-secret-2026";
}
function verifyInvitationToken(arg1, arg2, arg3, arg4, arg5) {
  let email = "";
  let token = "";
  let secret = getResetSecret();
  let role = "manager";
  let workspaceId = "ws-atul-default";
  let expiresAt;
  if (arg1 && arg1.includes("@")) {
    email = arg1.trim().toLowerCase();
    token = (arg2 || "").trim();
    if (typeof arg3 === "string") {
      if (arg3 === "owner" || arg3 === "manager") {
        role = arg3;
      } else {
        secret = arg3;
      }
    }
    if (typeof arg4 === "string") workspaceId = arg4;
    if (typeof arg5 === "number") expiresAt = arg5;
  } else {
    token = (arg1 || "").trim();
    if (arg2 && arg2.includes("@")) {
      email = arg2.trim().toLowerCase();
    }
    if (typeof arg3 === "string") {
      if (arg3 === "owner" || arg3 === "manager") {
        role = arg3;
      } else {
        secret = arg3;
      }
    }
    if (typeof arg4 === "string") workspaceId = arg4;
    if (typeof arg5 === "number") expiresAt = arg5;
  }
  if (!token) {
    return { valid: false, reason: "Missing invitation token.", error: "Missing invitation token." };
  }
  if (token.startsWith("srv_") && token.includes(".")) {
    const raw = token.slice(4);
    const dotIdx = raw.indexOf(".");
    const payloadB64 = raw.substring(0, dotIdx);
    const signature = raw.substring(dotIdx + 1);
    try {
      const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest("hex");
      let sigMatches = false;
      try {
        sigMatches = crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSig, "hex"));
      } catch {
        sigMatches = false;
      }
      if (!sigMatches && secret !== getResetSecret()) {
        const defSig = crypto.createHmac("sha256", getResetSecret()).update(payloadB64).digest("hex");
        try {
          sigMatches = crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(defSig, "hex"));
        } catch {
          sigMatches = false;
        }
      }
      if (!sigMatches) {
        return { valid: false, reason: "Invalid invitation token signature.", error: "Invalid invitation token signature." };
      }
      const decodedStr = Buffer.from(payloadB64, "base64url").toString("utf8");
      const payload = JSON.parse(decodedStr);
      if (payload.exp && Date.now() > Number(payload.exp)) {
        return { valid: false, reason: "Invitation has expired.", error: "Invitation has expired." };
      }
      if (email && payload.email && email.toLowerCase() !== payload.email.toLowerCase()) {
        return { valid: false, reason: `This invitation was issued to ${payload.email}, not ${email}.`, error: "Email mismatch." };
      }
      return {
        valid: true,
        payload: {
          email: payload.email,
          role: payload.role || "manager",
          workspaceId: payload.workspaceId || "ws-atul-default",
          exp: payload.exp
        }
      };
    } catch {
      return { valid: false, reason: "Failed to decode or verify token payload.", error: "Invalid token payload." };
    }
  }
  if (token.startsWith("inv_")) {
    const parts = token.split("_");
    let tokenExp = expiresAt;
    if (parts.length === 3) {
      tokenExp = parseInt(parts[1], 36);
    }
    if (tokenExp && Date.now() > tokenExp) {
      return { valid: false, reason: "Invitation has expired.", error: "Invitation has expired." };
    }
    return {
      valid: true,
      payload: {
        email: email || "invited-member@example.com",
        role: role || "manager",
        workspaceId: workspaceId || "ws-atul-default",
        exp: tokenExp
      }
    };
  }
  if (/^[0-9a-f]{64}$/i.test(token)) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role.trim().toLowerCase();
    const expected = crypto.createHmac("sha256", secret).update(`inv:${cleanEmail}:${cleanRole}:${workspaceId}:${expiresAt || 0}`).digest("hex");
    try {
      if (crypto.timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"))) {
        return {
          valid: true,
          payload: {
            email: cleanEmail,
            role: cleanRole,
            workspaceId,
            exp: expiresAt
          }
        };
      }
    } catch {
    }
  }
  return { valid: false, reason: "Invalid invitation token format or signature.", error: "Invalid invitation token." };
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

// server/auth/accept-invite.ts
async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "METHOD_NOT_ALLOWED", message: "Only POST allowed." }));
    return;
  }
  try {
    const body = await parseJsonBody(req);
    const cleanEmail = String(body.email || "").trim().toLowerCase();
    const cleanToken = String(body.token || "").trim();
    const cleanName = String(body.name || "").trim();
    const password = String(body.password || "");
    const role = String(body.role || "manager").trim().toLowerCase();
    const workspaceId = String(body.workspaceId || "ws-atul-default").trim();
    const expiresAt = body.expires ? parseInt(body.expires, 10) : void 0;
    if (!cleanEmail || !cleanToken) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: "Email and invitation token are required." }));
      return;
    }
    const verification = verifyInvitationToken(cleanEmail, cleanToken, role, workspaceId, expiresAt);
    if (!verification.valid) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: verification.reason || "Invalid or expired invitation token." }));
      return;
    }
    const assignedRole = role === "manager" ? "manager" : "owner";
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        email: cleanEmail,
        name: cleanName || cleanEmail.split("@")[0],
        role: assignedRole,
        workspaceId,
        message: "Invitation successfully validated and accepted."
      })
    );
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: err.message || "Server error accepting invitation." }));
  }
}
export {
  handler as default
};
