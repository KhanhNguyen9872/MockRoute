const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? path.join('/tmp', 'mockroute-data') : path.join(process.cwd(), 'data'));
const ROUTES_FILE = path.join(DATA_DIR, "routes.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ROUTES_FILE))
    fs.writeFileSync(ROUTES_FILE, JSON.stringify({ routes: [] }, null, 2));
}

function readRoutes() {
  ensureDataFile();
  const raw = fs.readFileSync(ROUTES_FILE, "utf8");
  const json = JSON.parse(raw || '{"routes":[]}');
  const routes = Array.isArray(json.routes) ? json.routes : [];
  // migrate: ensure every route has an id
  let mutated = false;
  const withIds = routes.map((r) => {
    let changed = false;
    let next = r;
    if (!next.id) {
      changed = true;
      next = { id: randomUUID(), ...next };
    }
    if (!next.matcher) {
      changed = true;
      next = { ...next, matcher: "fixed" };
    }
    if (typeof next.status === "undefined") {
      changed = true;
      next = { ...next, status: 1 };
    }
    if (changed) mutated = true;
    return next;
  });
  if (mutated) writeRoutes(withIds);
  return withIds;
}

function writeRoutes(routes) {
  ensureDataFile();
  fs.writeFileSync(ROUTES_FILE, JSON.stringify({ routes }, null, 2));
}

function addRoute(route) {
  const routes = readRoutes();
  const id = route.id || randomUUID();
  const withId = {
    id,
    status: typeof route.status === "number" ? route.status : 1,
    ...route,
  };
  // avoid duplicate path+method
  const exists = routes.some(
    (r) =>
      (r.method || "GET") === (route.method || "GET") && r.path === route.path
  );
  if (exists) {
    const updated = routes.map((r) =>
      (r.method || "GET") === (route.method || "GET") && r.path === route.path
        ? withId
        : r
    );
    writeRoutes(updated);
    return withId;
  }
  routes.push(withId);
  writeRoutes(routes);
  return withId;
}

function getRouteById(id) {
  const routes = readRoutes();
  return routes.find((r) => r.id === id) || null;
}

function updateRoute(id, partial) {
  const routes = readRoutes();
  const idx = routes.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  routes[idx] = {
    ...routes[idx],
    ...partial,
    id,
    status:
      typeof (partial.status ?? routes[idx].status) === "number"
        ? partial.status ?? routes[idx].status
        : routes[idx].status,
  };
  writeRoutes(routes);
  return routes[idx];
}

function deleteRoute(id) {
  const routes = readRoutes();
  const next = routes.filter((r) => r.id !== id);
  writeRoutes(next);
  return routes.length !== next.length;
}

module.exports = {
  readRoutes,
  writeRoutes,
  addRoute,
  getRouteById,
  updateRoute,
  deleteRoute,
};
