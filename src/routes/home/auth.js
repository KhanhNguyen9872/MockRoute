const express = require("express");
const {
  redirectRoot,
  getLogin,
  postLogin,
  getLogout,
} = require("../../controllers/authController");

const router = express.Router();

// Redirect base to login
router.get("/", redirectRoot);
router.get("/login", getLogin);
router.post("/login", postLogin);
router.get("/logout", getLogout);

module.exports = router;
