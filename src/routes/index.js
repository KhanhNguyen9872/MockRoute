const express = require("express");
// Root router kept minimal

const router = express.Router();

router.get("/", (req, res) => {
  res.status(404).type("text/plain").send("Not found");
});

module.exports = router;
