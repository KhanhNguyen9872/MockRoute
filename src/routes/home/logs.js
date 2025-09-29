const express = require("express");
const {
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
} = require("../../controllers/logsController");

const router = express.Router();

// Ignore logs management (must be before dynamic :id routes)
router.get("/logs/ignore", listIgnore);
router.get("/logs/ignore/create", getCreateIgnore);
router.post("/logs/ignore/create", postCreateIgnore);
router.get("/logs/ignore/:id", getIgnoreById);
router.get("/logs/ignore/:id/edit", getEditIgnore);
router.post("/logs/ignore/:id/edit", postEditIgnore);
router.post("/logs/ignore/:id/delete", deleteIgnore);

// List logs with filtering and server-side pagination (sorted newest first)
router.get("/logs", listLogs);
router.post("/logs/clear", clearAllLogs);
router.get("/logs/:id", getLogById);
router.post("/logs/:id/delete", deleteLog);

module.exports = router;
