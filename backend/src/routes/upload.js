import { Router } from "express";
import auth from "../middleware/auth.js";
import { uploadMemory } from "../middleware/uploadMemory.js";
import { cloudinary } from "../services/cloudinary.js";

const router = Router();

function maxImagesByRole(role) {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return 20;
  if (r === "seller_pro" || r === "pro") return 12;
  return 6;
}

function uploadBufferToCloudinary(buffer, opts = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "h2h_thailand/items",
        resource_type: "image",
        ...opts,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/**
 * POST /api/upload/images
 * form-data: images (multiple)
 * return: { ok, files:[{ url, publicId, thumbUrl, previewUrl, ... }] }
 */
router.post("/images", auth, uploadMemory.array("images", 20), async (req, res, next) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ ok: false, message: "Cloudinary not configured" });
    }

    const max = maxImagesByRole(req.user?.role);
    const incoming = req.files || [];

    if (incoming.length > max) {
      return res.status(400).json({
        ok: false,
        message: `แพ็กเกจของคุณอัปโหลดได้สูงสุด ${max} รูป`,
      });
    }

    if (!incoming.length) return res.json({ ok: true, files: [] });

    const results = await Promise.all(
      incoming.map(async (f) => {
        const r = await uploadBufferToCloudinary(f.buffer, {
          transformation: [{ quality: "auto", fetch_format: "auto" }],
          eager: [
            // ✅ thumb 320x320
            {
              width: 320,
              height: 320,
              crop: "fill",
              gravity: "auto",
              quality: "auto",
              fetch_format: "auto",
            },
            // ✅ preview 640x640
            {
              width: 640,
              height: 640,
              crop: "fill",
              gravity: "auto",
              quality: "auto",
              fetch_format: "auto",
            },
          ],
        });

        const eager = Array.isArray(r.eager) ? r.eager.map((x) => x.secure_url) : [];

        return {
          url: r.secure_url,
          publicId: r.public_id,
          thumbUrl: eager[0] || null,
          previewUrl: eager[1] || null,
          width: r.width,
          height: r.height,
          bytes: r.bytes,
          format: r.format,
        };
      })
    );

    return res.json({ ok: true, files: results });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/upload/images/:publicId
 */
router.delete("/images/:publicId", auth, async (req, res, next) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId || "");
    if (!publicId) return res.status(400).json({ ok: false, message: "missing publicId" });

    const r = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return res.json({ ok: true, result: r.result, publicId });
  } catch (err) {
    next(err);
  }
});

export default router;
