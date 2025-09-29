const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? path.join('/tmp', 'mockroute-data') : path.join(process.cwd(), 'data'));
const LOG_FILE = path.join(DATA_DIR, "logs.json");

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LOG_FILE))
    fs.writeFileSync(LOG_FILE, JSON.stringify({ logs: [] }, null, 2));
}

function readLogs() {
  ensure();
  try {
    const raw = fs.readFileSync(LOG_FILE, "utf8");
    const json = JSON.parse(raw || '{"logs":[]}');
    return Array.isArray(json.logs) ? json.logs : [];
  } catch {
    return [];
  }
}

function appendLog(entry) {
  ensure();
  const logs = readLogs();
  logs.unshift({
    id: Date.now() + "-" + randomUUID(),
    time: new Date().toISOString(),
    ...entry,
  });
  let limit = 500;
  try {
    const { getSettings } = require("./settingsService");
    const s = getSettings();
    limit = Math.max(1, parseInt(s.logLimit || 500, 10) || 500);
  } catch {}
  const trimmed = logs.slice(0, limit);
  fs.writeFileSync(LOG_FILE, JSON.stringify({ logs: trimmed }, null, 2));
}

function clearLogs() {
  ensure();
  fs.writeFileSync(LOG_FILE, JSON.stringify({ logs: [] }, null, 2));
}

function deleteLogById(id) {
  ensure();
  const logs = readLogs();
  const next = logs.filter((l) => l.id !== id);
  fs.writeFileSync(LOG_FILE, JSON.stringify({ logs: next }, null, 2));
  return logs.length !== next.length;
}

module.exports = { readLogs, appendLog, clearLogs, deleteLogById };
