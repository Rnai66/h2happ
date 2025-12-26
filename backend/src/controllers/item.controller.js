// backend/src/controllers/item.controller.js
import { Item } from "../models/Item.js";

export async function listItems(req, res, next) {
  try {
    const { q, page = 1, limit = 40, status } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 40, 1), 100);

    const filter = {};

    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }

    if (status) {
      filter.status = status; // ถ้ามี field นี้ใน schema จะ filter ได้เลย
    }

    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Item.countDocuments(filter),
    ]);

    return res.json({
      ok: true,
      items,
      page: pageNum,
      limit: limitNum,
      total,
    });
  } catch (err) {
    next(err);
  }
}

export async function createItem(req, res, next) {
  try {
    const { title, price, description, location, imageUrl, condition } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({
        ok: false,
        message: "กรุณากรอกชื่อสินค้าและราคา",
      });
    }

    const item = await Item.create({
      title,
      price,
      description,
      location,
      imageUrl,
      condition,
      // status จะ default = "active" จาก schema
    });

    return res.status(201).json({ ok: true, item });
  } catch (err) {
    next(err);
  }
}

// ✅ ใช้ในหน้าแสดงรายละเอียดสินค้า
export async function getItemById(req, res, next) {
  try {
    const { id } = req.params;

    const item = await Item.findById(id).lean();

    if (!item) {
      return res.status(404).json({
        ok: false,
        message: "Item not found",
      });
    }

    return res.json({ ok: true, item });
  } catch (err) {
    next(err);
  }
}
