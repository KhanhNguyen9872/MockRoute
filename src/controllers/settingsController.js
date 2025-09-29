const {
  getAdminBase,
  getSettings,
  setAdminBase,
  setRedirectRoot,
  setTimezoneOffset,
  setLogLimit,
} = require("../services/settingsService");
const { readRoutes } = require("../services/routeConfigService");

function getSettingsPage(req, res) {
  const adminBase = getAdminBase();
  const s = getSettings();
  const saved = req.query.saved === "1";
  res.render("settings", {
    title: "Settings",
    user: req.user,
    adminBase,
    redirectRoot: s.redirectRoot,
    timezoneOffset: s.timezoneOffset || 0,
    logLimit: s.logLimit || 500,
    baseUrl: req.baseUrl,
    saved,
  });
}

function postSettings(req, res) {
  const name = (req.body && req.body.adminBase) || "";
  const redirectRoot = !!(req.body && req.body.redirectRoot);
  const tz = req.body && req.body.timezoneOffset;
  const logLimit = req.body && req.body.logLimit;
  const oldBase = getAdminBase();
  const valid = typeof name === "string" && /^[a-z0-9]+$/.test(name);
  if (!valid) {
    const s = getSettings();
    return res
      .status(400)
      .render("settings", {
        title: "Settings",
        user: req.user,
        adminBase: oldBase,
        redirectRoot: s.redirectRoot,
        timezoneOffset: s.timezoneOffset || 0,
        logLimit: s.logLimit || 500,
        baseUrl: req.baseUrl,
        error: "Admin base is required and must contain only a-z and 0-9.",
      });
  }
  const newAdminPath = "/" + name;
  const routes = readRoutes();
  const hasConflict = routes.some((r) => {
    const matcher = r.matcher || "fixed";
    const routePath = r.path || "";
    if (matcher === "fixed") return routePath === newAdminPath;
    const rp = routePath.endsWith("/") ? routePath.slice(0, -1) : routePath;
    const ap = newAdminPath.endsWith("/")
      ? newAdminPath.slice(0, -1)
      : newAdminPath;
    return ap === rp || ap.startsWith(rp + "/") || rp.startsWith(ap + "/");
  });
  if (hasConflict) {
    const s = getSettings();
    return res
      .status(400)
      .render("settings", {
        title: "Settings",
        user: req.user,
        adminBase: oldBase,
        redirectRoot: s.redirectRoot,
        timezoneOffset: s.timezoneOffset || 0,
        logLimit: s.logLimit || 500,
        baseUrl: req.baseUrl,
        error:
          "Admin base conflicts with existing custom routes. Choose another name.",
      });
  }
  const newBase = setAdminBase(name);
  setRedirectRoot(redirectRoot);
  if (typeof tz !== "undefined") setTimezoneOffset(tz);
  if (typeof logLimit !== "undefined") setLogLimit(logLimit);
  const target = "/" + newBase + "/settings";
  if (newBase !== oldBase) return res.redirect(target);
  return res.redirect(req.baseUrl + "/settings?saved=1");
}

module.exports = { getSettingsPage, postSettings };
