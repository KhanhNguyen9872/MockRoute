const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? path.join('/tmp', 'mockroute-data') : path.join(process.cwd(), 'data'));
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(
      SETTINGS_FILE,
      JSON.stringify(
        {
          adminBase: "home",
          redirectRoot: false,
          timezoneOffset: 0,
          logLimit: 500,
        },
        null,
        2
      )
    );
  }
}

function getSettings() {
  ensureFile();
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    const s = JSON.parse(raw || "{}");
    if (typeof s.redirectRoot === "undefined") s.redirectRoot = false;
    if (typeof s.timezoneOffset === "undefined") s.timezoneOffset = 0;
    if (typeof s.logLimit === "undefined") s.logLimit = 500;
    if (!s.adminBase) s.adminBase = "home";
    return s;
  } catch {
    return { adminBase: "home" };
  }
}

function getAdminBase() {
  const s = getSettings();
  return (s.adminBase || "home").trim() || "home";
}

function setAdminBase(adminBase) {
  ensureFile();
  const s = getSettings();
  s.adminBase = (adminBase || "home").trim() || "home";
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
  return s.adminBase;
}

function setRedirectRoot(redirect) {
  ensureFile();
  const s = getSettings();
  s.redirectRoot = !!redirect;
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
  return s.redirectRoot;
}

module.exports = { getAdminBase, setAdminBase, getSettings, setRedirectRoot };
function setTimezoneOffset(offsetHours) {
  ensureFile();
  const s = getSettings();
  let num = Number(offsetHours);
  if (!Number.isFinite(num)) {
    s.timezoneOffset = 0;
  } else {
    // allow half-hour increments; clamp to [-12, 12]
    num = Math.round(num * 2) / 2;
    if (num < -12) num = -12;
    if (num > 12) num = 12;
    s.timezoneOffset = num;
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
  return s.timezoneOffset;
}

module.exports.setTimezoneOffset = setTimezoneOffset;

function setLogLimit(limit) {
  ensureFile();
  const s = getSettings();
  const n = parseInt(limit, 10);
  s.logLimit = Number.isFinite(n) && n > 0 ? Math.min(n, 100000) : 500;
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
  return s.logLimit;
}

module.exports.setLogLimit = setLogLimit;
