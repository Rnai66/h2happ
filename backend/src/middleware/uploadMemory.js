// backend/src/middleware/uploadMemory.js
import multer from "multer";

function fileFilter(_req, file, cb) {
  const ok = ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype);
  if (!ok) return cb(new Error("Invalid file type"), false);
  cb(null, true);
}

export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB/รูป
});
