const express = require("express");
const {
  getSettingsPage,
  postSettings,
} = require("../../controllers/settingsController");

const router = express.Router();

router.get("/settings", getSettingsPage);
router.post("/settings", postSettings);

module.exports = router;
