const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? path.join('/tmp', 'mockroute-data') : path.join(process.cwd(), 'data'));
const FILE = path.join(DATA_DIR, "ignore_logs.json");
const DEFAULT_IGNORE_PATH = "/.well-known/appspecific/com.chrome.devtools.json";
const DEFAULT_FAVICON_PATH = "/favicon.ico";

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) {
    const seed = {
      rules: [
        {
          id: randomUUID(),
          matcher: "fixed",
          path: DEFAULT_IGNORE_PATH,
          note: "Chrome devtools",
          status: 1,
        },
        {
          id: randomUUID(),
          matcher: "fixed",
          path: DEFAULT_FAVICON_PATH,
          note: "favicon",
          status: 1,
        },
      ],
    };
    fs.writeFileSync(FILE, JSON.stringify(seed, null, 2));
  }
}

function readRules() {
  ensure();
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const json = JSON.parse(raw || '{"rules":[]}');
    let rules = Array.isArray(json.rules) ? json.rules : [];
    // migrate
    let mutated = false;
    const withIds = rules.map((r) => {
      if (!r.id) {
        mutated = true;
        return {
          id: randomUUID(),
          matcher: r.matcher || "fixed",
          path: r.path || "/",
          note: r.note || "",
          status: typeof r.status === "number" ? r.status : 1,
        };
      }
      if (typeof r.status === "undefined") {
        mutated = true;
        return { ...r, status: 1 };
      }
      return r;
    });
    // ensure default rules exist
    const defaults = [
      { path: DEFAULT_IGNORE_PATH, note: "Chrome devtools" },
      { path: DEFAULT_FAVICON_PATH, note: "favicon" },
    ];
    defaults.forEach(def => {
      if (!withIds.some(r => r.path === def.path && r.matcher === 'fixed')) {
        withIds.unshift({ id: randomUUID(), matcher: 'fixed', path: def.path, note: def.note, status: 1 });
        mutated = true;
      }
    });
    if (mutated)
      fs.writeFileSync(FILE, JSON.stringify({ rules: withIds }, null, 2));
    return withIds;
  } catch {
    return [];
  }
}

function writeRules(rules) {
  ensure();
  fs.writeFileSync(FILE, JSON.stringify({ rules }, null, 2));
}

function addRule(rule) {
  const rules = readRules();
  const newRule = {
    id: randomUUID(),
    matcher: rule.matcher || "fixed",
    path: rule.path,
    note: rule.note || "",
    status: typeof rule.status === "number" ? rule.status : 1,
  };
  rules.push(newRule);
  writeRules(rules);
  return newRule;
}

function getRule(id) {
  return readRules().find((r) => r.id === id) || null;
}

function updateRule(id, patch) {
  const rules = readRules();
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rules[idx] = {
    ...rules[idx],
    matcher: patch.matcher || rules[idx].matcher,
    path: patch.path || rules[idx].path,
    note: patch.note ?? rules[idx].note,
    status:
      typeof (patch.status ?? rules[idx].status) === "number"
        ? patch.status ?? rules[idx].status
        : rules[idx].status,
  };
  writeRules(rules);
  return rules[idx];
}

function deleteRule(id) {
  const rules = readRules();
  const next = rules.filter((r) => r.id !== id);
  writeRules(next);
  return rules.length !== next.length;
}

function isIgnoredPath(reqPath) {
  const rules = readRules();
  return rules.some((r) => {
    if (Number(r.status) !== 1) return false;
    if (r.matcher === "fixed") return r.path === reqPath;
    if (r.matcher === "prefix")
      return (
        reqPath === r.path ||
        reqPath.startsWith(r.path.endsWith("/") ? r.path : r.path + "/")
      );
    return false;
  });
}

module.exports = {
  readRules,
  addRule,
  getRule,
  updateRule,
  deleteRule,
  isIgnoredPath,
};
