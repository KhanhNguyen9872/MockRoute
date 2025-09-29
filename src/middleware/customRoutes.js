const fs = require("fs");
const path = require("path");
const axios = require("axios");
const mime = require("mime-types");
const { readRoutes } = require("../services/routeConfigService");
const { getAdminBase } = require("../services/settingsService");
const { appendLog } = require("../services/logService");
const { isIgnoredPath } = require("../services/ignoreLogService");

async function handleProxy(resConf, req, res) {
  const url = resConf.proxyUrl;
  const method = (resConf.proxyMethod || "GET").toUpperCase();
  const headers = resConf.proxyHeaders || {};
  const body = ["POST", "PUT", "PATCH", "DELETE"].includes(method)
    ? req.body
    : undefined;
  const response = await axios({
    url,
    method,
    headers,
    data: body,
    responseType: "arraybuffer",
  });
  // mirror status and headers selectively
  res.status(response.status);
  const contentType =
    response.headers["content-type"] || "application/octet-stream";
  res.set("Content-Type", contentType);
  return res.send(Buffer.from(response.data));
}

function customRoutesMiddleware(req, res, next) {
  // skip admin area (dynamic base)
  const base = "/" + getAdminBase();
  if (req.path === base || req.path.startsWith(base + "/")) return next();
  const routes = readRoutes();
  const method = req.method.toUpperCase();
  const found = routes.find((r) => {
    if (Number(r.status) !== 1) return false;
    if ((r.method || "GET").toUpperCase() !== method) return false;
    const matcher = r.matcher || "fixed";
    if (matcher === "fixed") return r.path === req.path;
    // url matching: req.path starts with r.path + '/' or equals r.path
    if (matcher === "prefix") {
      return (
        req.path === r.path ||
        req.path.startsWith(r.path.endsWith("/") ? r.path : r.path + "/")
      );
    }
    return false;
  });
  if (!found) return next();

  const type = found.responseType || "text";
  const conf = found.response || {};

  (async () => {
    try {
      const ignorePath = "/.well-known/appspecific/com.chrome.devtools.json";
      const shouldLog = req.path !== ignorePath && !isIgnoredPath(req.path);
      if (shouldLog) {
        appendLog({
          method,
          path: req.path,
          matcher: found.matcher || "fixed",
          routePath: found.path,
          headers: req.headers,
          ip: req.ip,
          query: req.query,
          body: req.body,
        });
      }
      if (type === "text") {
        return res.type("text/plain").send(conf.text || "");
      }
      if (type === "json") {
        return res.json(conf.json || {});
      }
      if (type === "file" || type === "image") {
        const filePath = path.isAbsolute(conf.filePath)
          ? conf.filePath
          : path.join(process.cwd(), conf.filePath);
        if (!fs.existsSync(filePath))
          return res.status(404).send("File not found");
        const ct =
          mime.lookup(filePath) ||
          (type === "image" ? "image/png" : "application/octet-stream");
        res.type(ct);
        return fs.createReadStream(filePath).pipe(res);
      }
      if (type === "video" || type === "audio") {
        const filePath = path.isAbsolute(conf.filePath)
          ? conf.filePath
          : path.join(process.cwd(), conf.filePath);
        if (!fs.existsSync(filePath))
          return res.status(404).send("Media not found");
        const ct =
          mime.lookup(filePath) ||
          (type === "video" ? "video/mp4" : "audio/mpeg");
        res.type(ct);
        return fs.createReadStream(filePath).pipe(res);
      }
      if (type === "proxy") {
        return await handleProxy(conf, req, res);
      }
      return res.status(400).send("Unsupported response type");
    } catch (err) {
      return res.status(500).send("Custom route error");
    }
  })();
}

module.exports = { customRoutesMiddleware };
