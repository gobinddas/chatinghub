const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// ── Your EXISTING authMiddleware — do NOT change that file ────────────────────
const authMiddleware = require("../middleware/authMiddleware");

const {
  getProfile,
  updateProfile,
  uploadAvatar,
} = require("../controllers/profileController");

// ─── Multer config ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads/avatars"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Images only"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
// IMPORTANT: /update and /avatar must come BEFORE /:userId
// otherwise Express matches "update" and "avatar" as a userId param
router.put("/update", authMiddleware, updateProfile);
router.post("/avatar", authMiddleware, upload.single("avatar"), uploadAvatar);
router.get("/:userId", authMiddleware, getProfile);

module.exports = router;
