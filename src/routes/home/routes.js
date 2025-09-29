const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const {
  listRoutes,
  getCreate,
  getView,
  postCreate,
  getEdit,
  postEdit,
  postDelete,
} = require("../../controllers/routesController");

const router = express.Router();

// Multer setup for single-file uploads to ./private
const uploadDir = path.join(process.cwd(), "private");
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch {}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "");
    const rand = crypto.randomBytes(16).toString("hex"); // 32 chars
    cb(null, rand + ext);
  },
});
const upload = multer({ storage });

router.get("/routes", listRoutes);
router.get("/routes/create", getCreate);
router.get("/routes/:id", getView);
router.post("/routes/create", upload.single("uploadFile"), postCreate);
router.get("/routes/:id/edit", getEdit);
router.post("/routes/:id/edit", upload.single("uploadFile"), postEdit);
router.post("/routes/:id/delete", postDelete);

module.exports = router;
