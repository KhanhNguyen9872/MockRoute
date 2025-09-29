const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const authRouter = require("./home/auth");
const dashboardRouter = require("./home/dashboard");
const routesRouter = require("./home/routes");
const logsRouter = require("./home/logs");
const settingsRouter = require("./home/settings");
const router = express.Router();

router.use("/", authRouter);
router.use(authMiddleware);
router.use("/", dashboardRouter);
router.use("/", routesRouter);
router.use("/", logsRouter);
router.use("/", settingsRouter);

module.exports = router;
