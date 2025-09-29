const {
  readRoutes,
  addRoute,
  getRouteById,
  updateRoute,
  deleteRoute,
} = require("../services/routeConfigService");
const { getAdminBase } = require("../services/settingsService");
const fs = require("fs");
const path = require("path");

function listRoutes(req, res) {
  const routes = readRoutes();
  routes.forEach((r) => {
    if (!r.id) r.id = "no-id";
  });
  const saved = req.query.saved === "1";
  const deleted = req.query.deleted === "1";
  res.render("routes", {
    title: "Routes",
    user: req.user,
    routes,
    baseUrl: req.baseUrl,
    saved,
    deleted,
  });
}

function getCreate(req, res) {
  res.render("routes-create", {
    title: "Create new route",
    user: req.user,
    baseUrl: req.baseUrl,
  });
}

function getView(req, res) {
  const route = getRouteById(req.params.id);
  if (!route) return res.redirect(req.baseUrl + "/routes");
  res.render("routes-view", {
    title: "Route",
    user: req.user,
    route,
    baseUrl: req.baseUrl,
  });
}

function postCreate(req, res) {
  const body = req.body || {};
  const route = {
    method: (body.method || "GET").toUpperCase(),
    path: String(body.path || "").trim(),
    responseType: body.responseType || "text",
    matcher: body.matcher === "prefix" ? "prefix" : "fixed",
    status: Number(body.status) === 1 ? 1 : 0,
    response: {},
  };
  if (!route.path.startsWith("/")) route.path = "/" + route.path;
  const adminBase = "/" + getAdminBase();
  const existing = readRoutes();
  const conflictAdmin =
    route.path === adminBase || route.path.startsWith(adminBase + "/");
  const conflictRoute = existing.some(
    (r) =>
      (r.method || "GET").toUpperCase() === route.method &&
      r.path === route.path
  );
  if (conflictAdmin || conflictRoute) {
    return res
      .status(400)
      .render("routes-create", {
        title: "Create new route",
        user: req.user,
        error: "Path conflicts with existing route or admin pages.",
        baseUrl: req.baseUrl,
        form: { ...body },
      });
  }
  if (route.responseType === "text") route.response.text = body.text || "";
  if (route.responseType === "json") {
    try {
      route.response.json = JSON.parse(body.json || "{}");
    } catch (e) {
      return res
        .status(400)
        .render("routes-create", {
          title: "Create new route",
          user: req.user,
          baseUrl: req.baseUrl,
          error: "Invalid JSON format.",
          form: { ...body },
        });
    }
  }
  if (["file", "video", "audio", "image"].includes(route.responseType)) {
    // prefer uploaded file if present
    if (req.file && req.file.path) {
      // store relative path from project root
      const rel = req.file.path
        .replace(process.cwd() + require("path").sep, "")
        .replace(/\\/g, "/");
      // validate mimetype against responseType
      const mt = req.file.mimetype || "";
      const isOk =
        route.responseType === "file" ||
        (route.responseType === "image" && mt.startsWith("image/")) ||
        (route.responseType === "video" && mt.startsWith("video/")) ||
        (route.responseType === "audio" && mt.startsWith("audio/"));
      if (!isOk) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
        return res
          .status(400)
          .render("routes-create", {
            title: "Create new route",
            user: req.user,
            baseUrl: req.baseUrl,
            error: "Uploaded file type does not match selected response type.",
            form: { ...body },
          });
      }
      route.response.filePath = rel;
    } else {
      const manual = (body.filePath || "").toString().trim();
      if (manual) {
        if (path.isAbsolute(manual)) {
          return res.status(400).render("routes-create", { title: "Create new route", user: req.user, baseUrl: req.baseUrl, error: "Only relative paths under private/ or public/ are allowed.", form: { ...body } });
        }
        const norm = manual.replace(/\\\\/g, "/");
        if (!(norm.startsWith("private/") || norm.startsWith("public/"))) {
          return res.status(400).render("routes-create", { title: "Create new route", user: req.user, baseUrl: req.baseUrl, error: "Path must start with private/ or public/.", form: { ...body } });
        }
        route.response.filePath = norm;
      } else {
        route.response.filePath = "";
      }
    }
  }
  if (route.responseType === "proxy") {
    route.response.proxyUrl = body.proxyUrl || "";
    route.response.proxyMethod = (body.proxyMethod || "GET").toUpperCase();
    try {
      route.response.proxyHeaders = JSON.parse(body.proxyHeaders || "{}");
    } catch (e) {
      return res
        .status(400)
        .render("routes-create", {
          title: "Create new route",
          user: req.user,
          baseUrl: req.baseUrl,
          error: "Invalid Proxy Headers JSON.",
          form: { ...body },
        });
    }
    route.response.proxyStreaming = body.proxyStreaming ? true : false;
  }
  addRoute(route);
  return res.redirect(req.baseUrl + "/routes?saved=1");
}

function getEdit(req, res) {
  const route = getRouteById(req.params.id);
  if (!route) return res.redirect(req.baseUrl + "/routes");
  res.render("routes-edit", {
    title: "Edit route",
    user: req.user,
    route,
    baseUrl: req.baseUrl,
  });
}

function postEdit(req, res) {
  const body = req.body || {};
  const patch = {
    method: (body.method || "GET").toUpperCase(),
    path: String(body.path || "").trim(),
    responseType: body.responseType || "text",
    matcher: body.matcher === "prefix" ? "prefix" : "fixed",
    status: Number(body.status) === 1 ? 1 : 0,
    response: {},
  };
  if (!patch.path.startsWith("/")) patch.path = "/" + patch.path;
  const adminBase = "/" + getAdminBase();
  const existing = readRoutes();
  const conflictAdmin =
    patch.path === adminBase || patch.path.startsWith(adminBase + "/");
  const conflictRoute = existing.some(
    (r) =>
      r.id !== req.params.id &&
      (r.method || "GET").toUpperCase() === patch.method &&
      r.path === patch.path
  );
  if (conflictAdmin || conflictRoute) {
    const original = getRouteById(req.params.id);
    const route = { ...(original || {}), ...patch, id: req.params.id };
    return res
      .status(400)
      .render("routes-edit", {
        title: "Edit route",
        user: req.user,
        route,
        error: "Path conflicts with existing route or admin pages.",
        baseUrl: req.baseUrl,
      });
  }
  if (patch.responseType === "text") patch.response.text = body.text || "";
  if (patch.responseType === "json") {
    try {
      patch.response.json = JSON.parse(body.json || "{}");
    } catch (e) {
      const original = getRouteById(req.params.id);
      const route = { ...(original || {}), ...patch, id: req.params.id };
      return res
        .status(400)
        .render("routes-edit", {
          title: "Edit route",
          user: req.user,
          route,
          error: "Invalid JSON format.",
          baseUrl: req.baseUrl,
          rawJson: body.json,
        });
    }
  }
  if (["file", "video", "audio", "image"].includes(patch.responseType)) {
    if (req.file && req.file.path) {
      const rel = req.file.path
        .replace(process.cwd() + require("path").sep, "")
        .replace(/\\/g, "/");
      const mt = req.file.mimetype || "";
      const isOk =
        patch.responseType === "file" ||
        (patch.responseType === "image" && mt.startsWith("image/")) ||
        (patch.responseType === "video" && mt.startsWith("video/")) ||
        (patch.responseType === "audio" && mt.startsWith("audio/"));
      if (!isOk) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
        const original = getRouteById(req.params.id);
        const route = { ...(original || {}), ...patch, id: req.params.id };
        return res
          .status(400)
          .render("routes-edit", {
            title: "Edit route",
            user: req.user,
            route,
            error: "Uploaded file type does not match selected response type.",
            baseUrl: req.baseUrl,
          });
      }
      // delete old file if existed and path is under private
      const current = getRouteById(req.params.id);
      const oldPath = current && current.response && current.response.filePath;
      if (oldPath && oldPath.startsWith("private/")) {
        try {
          fs.unlinkSync(path.join(process.cwd(), oldPath));
        } catch {}
      }
      patch.response.filePath = rel;
    } else {
      const manual = (body.filePath || "").toString().trim();
      if (manual) {
        if (path.isAbsolute(manual)) {
          const original = getRouteById(req.params.id);
          const route = { ...(original || {}), ...patch, id: req.params.id };
          return res.status(400).render("routes-edit", { title: "Edit route", user: req.user, route, error: "Only relative paths under private/ or public/ are allowed.", baseUrl: req.baseUrl });
        }
        const norm = manual.replace(/\\\\/g, "/");
        if (!(norm.startsWith("private/") || norm.startsWith("public/"))) {
          const original = getRouteById(req.params.id);
          const route = { ...(original || {}), ...patch, id: req.params.id };
          return res.status(400).render("routes-edit", { title: "Edit route", user: req.user, route, error: "Path must start with private/ or public/.", baseUrl: req.baseUrl });
        }
        patch.response.filePath = norm;
      } else {
        patch.response.filePath = "";
      }
    }
  }
  if (patch.responseType === "proxy") {
    patch.response.proxyUrl = body.proxyUrl || "";
    patch.response.proxyMethod = (body.proxyMethod || "GET").toUpperCase();
    try {
      patch.response.proxyHeaders = JSON.parse(body.proxyHeaders || "{}");
    } catch (e) {
      const original = getRouteById(req.params.id);
      const route = { ...(original || {}), ...patch, id: req.params.id };
      return res
        .status(400)
        .render("routes-edit", {
          title: "Edit route",
          user: req.user,
          route,
          error: "Invalid Proxy Headers JSON.",
          baseUrl: req.baseUrl,
          rawProxyHeaders: body.proxyHeaders,
        });
    }
    patch.response.proxyStreaming = body.proxyStreaming ? true : false;
  }
  updateRoute(req.params.id, patch);
  return res.redirect(req.baseUrl + "/routes?saved=1");
}

function postDelete(req, res) {
  const existing = getRouteById(req.params.id);
  if (
    existing &&
    existing.response &&
    existing.response.filePath &&
    existing.response.filePath.startsWith("private/")
  ) {
    try {
      fs.unlinkSync(path.join(process.cwd(), existing.response.filePath));
    } catch {}
  }
  deleteRoute(req.params.id);
  return res.redirect(req.baseUrl + "/routes?deleted=1");
}

module.exports = {
  listRoutes,
  getCreate,
  getView,
  postCreate,
  getEdit,
  postEdit,
  postDelete,
};
