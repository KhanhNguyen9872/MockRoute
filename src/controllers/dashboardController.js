const { readRoutes } = require("../services/routeConfigService");
const { readLogs } = require("../services/logService");

function getDashboard(req, res) {
  const routes = readRoutes();
  const logs = readLogs();
  const recentLogs = logs.slice(0, 5);
  res.render("dashboard", {
    title: "Dashboard",
    user: req.user,
    stats: { routesCount: routes.length, logsCount: logs.length },
    recentLogs,
    baseUrl: req.baseUrl,
  });
}

module.exports = { getDashboard };