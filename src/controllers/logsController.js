const {
  readLogs,
  clearLogs,
  deleteLogById,
} = require("../services/logService");
const { getSettings } = require("../services/settingsService");
const {
  readRules: readIgnoreRules,
  addRule: addIgnoreRule,
  getRule: getIgnoreRule,
  updateRule: updateIgnoreRule,
  deleteRule: deleteIgnoreRule,
} = require("../services/ignoreLogService");

function listLogs(req, res) {
  const all = readLogs();
  const s = getSettings();
  const q = (req.query.q || "").toString().trim().toLowerCase();
  const method = (req.query.method || "").toString().toUpperCase();
  const matcher = (req.query.matcher || "").toString().toLowerCase();
  const pageSize = Math.max(
    1,
    Math.min(100, parseInt(req.query.pageSize || "20", 10) || 20)
  );
  const page = Math.max(1, parseInt(req.query.page || "1", 10) || 1);
  let filtered = all;
  if (method)
    filtered = filtered.filter(
      (l) => (l.method || "").toUpperCase() === method
    );
  if (matcher)
    filtered = filtered.filter(
      (l) => (l.matcher || "").toLowerCase() === matcher
    );
  if (q) {
    filtered = filtered.filter((l) => {
      const text = [
        l.path,
        l.routePath,
        l.ip,
        JSON.stringify(l.query || {}),
        JSON.stringify(l.body || {}),
        JSON.stringify(l.headers || {}),
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }
  filtered = filtered
    .slice()
    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);
  res.render("logs", {
    title: "Logs",
    user: req.user,
    logs: pageItems,
    baseUrl: req.baseUrl,
    timezoneOffset: s.timezoneOffset || 0,
    q: req.query.q || "",
    method,
    matcher,
    page: safePage,
    pageSize,
    total,
    totalPages,
  });
}

function clearAllLogs(req, res) {
  clearLogs();
  return res.redirect(req.baseUrl + "/logs");
}
function getLogById(req, res) {
  const all = readLogs();
  const item = all.find((l) => l.id === req.params.id);
  if (!item) return res.redirect(req.baseUrl + "/logs");
  const s = getSettings();
  return res.render("logs-view", {
    title: "Log detail",
    user: req.user,
    log: item,
    baseUrl: req.baseUrl,
    timezoneOffset: s.timezoneOffset || 0,
  });
}
function deleteLog(req, res) {
  deleteLogById(req.params.id);
  return res.redirect(req.baseUrl + "/logs");
}

function listIgnore(req, res) {
  const rules = readIgnoreRules();
  return res.render("logs-ignore", {
    title: "Ignore logs",
    user: req.user,
    baseUrl: req.baseUrl,
    rules,
  });
}
function getCreateIgnore(req, res) {
  return res.render("logs-ignore-create", {
    title: "Add ignore rule",
    user: req.user,
    baseUrl: req.baseUrl,
  });
}
function postCreateIgnore(req, res) {
  const body = req.body || {};
  let p = String(body.path || "").trim();
  if (!p.startsWith("/")) p = "/" + p;
  addIgnoreRule({
    matcher: body.matcher === "prefix" ? "prefix" : "fixed",
    path: p,
    note: body.note || "",
    status: Number(body.status) === 1 ? 1 : 0,
  });
  return res.redirect(req.baseUrl + "/logs/ignore");
}
function getIgnoreById(req, res) {
  const rule = getIgnoreRule(req.params.id);
  if (!rule) return res.redirect(req.baseUrl + "/logs/ignore");
  return res.render("logs-ignore-view", {
    title: "Ignore rule",
    user: req.user,
    baseUrl: req.baseUrl,
    rule,
  });
}
function getEditIgnore(req, res) {
  const rule = getIgnoreRule(req.params.id);
  if (!rule) return res.redirect(req.baseUrl + "/logs/ignore");
  return res.render("logs-ignore-edit", {
    title: "Edit ignore rule",
    user: req.user,
    baseUrl: req.baseUrl,
    rule,
  });
}
function postEditIgnore(req, res) {
  const body = req.body || {};
  let p = String(body.path || "").trim();
  if (!p.startsWith("/")) p = "/" + p;
  updateIgnoreRule(req.params.id, {
    matcher: body.matcher === "prefix" ? "prefix" : "fixed",
    path: p,
    note: body.note || "",
    status: Number(body.status) === 1 ? 1 : 0,
  });
  return res.redirect(req.baseUrl + "/logs/ignore");
}
function deleteIgnore(req, res) {
  deleteIgnoreRule(req.params.id);
  return res.redirect(req.baseUrl + "/logs/ignore");
}

module.exports = {
  listLogs,
  clearAllLogs,
  getLogById,
  deleteLog,
  listIgnore,
  getCreateIgnore,
  postCreateIgnore,
  getIgnoreById,
  getEditIgnore,
  postEditIgnore,
  deleteIgnore,
};
