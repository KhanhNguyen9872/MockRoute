const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function getAesKeyIv() {
  const keyRaw = process.env.AES_SECRET || "";
  // Expect 32-byte key; allow hex or base64 or plain string padded/truncated
  let key;
  if (/^[0-9a-fA-F]{64}$/.test(keyRaw)) {
    key = Buffer.from(keyRaw, "hex");
  } else if (
    /^[A-Za-z0-9+/=]+$/.test(keyRaw) &&
    Buffer.from(keyRaw, "base64").length === 32
  ) {
    key = Buffer.from(keyRaw, "base64");
  } else {
    const buf = Buffer.alloc(32);
    Buffer.from(String(keyRaw)).copy(buf);
    key = buf;
  }
  const iv = crypto.createHash("sha256").update(key).digest().subarray(0, 16);
  return { key, iv };
}

function sign(payload, options = {}) {
  const secret = process.env.JWT_SECRET || "secret";
  const token = jwt.sign(payload, secret, { expiresIn: "2h", ...options });
  const { key, iv } = getAesKeyIv();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]).toString("base64");
  return encrypted;
}

function verify(encryptedToken) {
  const { key, iv } = getAesKeyIv();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(String(encryptedToken), "base64")),
    decipher.final(),
  ]).toString("utf8");
  const secret = process.env.JWT_SECRET || "secret";
  return jwt.verify(decrypted, secret);
}

module.exports = { sign, verify };
