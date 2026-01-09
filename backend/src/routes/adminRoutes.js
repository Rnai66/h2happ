import express from "express";
import mongoose from "mongoose";
import { OrderModel } from "../models/OrderModel.js";
import { ItemModel } from "../models/ItemModel.js";
import { User } from "../models/User.js";
import protect from "../middleware/auth.js";

const router = express.Router();

const conn = mongoose.connection;
const Order = OrderModel(conn);
const Item = ItemModel(conn);

// Admin middleware - check if user is admin
function adminOnly(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ ok: false, error: "forbidden", message: "Admin access required" });
    }
    next();
}

// ============= USERS =============

// GET /api/admin/users - List all users
router.get("/users", protect, adminOnly, async (req, res, next) => {
    try {
        const { page = 1, limit = 50, q, role } = req.query;
        const filter = {};

        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
            ];
        }
        if (role && ["user", "seller", "admin"].includes(role)) {
            filter.role = role;
        }

        const pageNum = Number(page) || 1;
        const limitNum = Math.min(Number(limit) || 50, 100);
        const skip = (pageNum - 1) * limitNum;

        const [users, total] = await Promise.all([
            User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            User.countDocuments(filter),
        ]);

        return res.json({ ok: true, page: pageNum, limit: limitNum, total, users });
    } catch (err) {
        next(err);
    }
});

// PUT /api/admin/users/:id - Update user
router.put("/users/:id", protect, adminOnly, async (req, res, next) => {
    try {
        const { name, email, role, phone } = req.body;
        const update = {};

        if (name) update.name = String(name).trim();
        if (email) update.email = String(email).trim().toLowerCase();
        if (role && ["user", "seller", "admin"].includes(role)) update.role = role;
        if (phone !== undefined) update.phone = phone;

        const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-passwordHash");
        if (!user) return res.status(404).json({ ok: false, error: "not_found" });

        return res.json({ ok: true, user });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/admin/users/:id - Delete user
router.delete("/users/:id", protect, adminOnly, async (req, res, next) => {
    try {
        if (String(req.params.id) === String(req.user.id)) {
            return res.status(400).json({ ok: false, error: "cannot_delete_self" });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ ok: false, error: "not_found" });

        return res.json({ ok: true, message: "User deleted" });
    } catch (err) {
        next(err);
    }
});

// ============= ORDERS =============

// GET /api/admin/orders - List all orders
router.get("/orders", protect, adminOnly, async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status, paymentStatus } = req.query;
        const filter = { isDeleted: false };

        if (status) filter.status = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        const pageNum = Number(page) || 1;
        const limitNum = Math.min(Number(limit) || 50, 100);
        const skip = (pageNum - 1) * limitNum;

        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            Order.countDocuments(filter),
        ]);

        return res.json({ ok: true, page: pageNum, limit: limitNum, total, orders });
    } catch (err) {
        next(err);
    }
});

// PUT /api/admin/orders/:id - Update order (admin can edit any field)
router.put("/orders/:id", protect, adminOnly, async (req, res, next) => {
    try {
        const { status, paymentStatus, amount } = req.body;
        const update = {};

        if (status) update.status = status;
        if (paymentStatus) update.paymentStatus = paymentStatus;
        if (amount !== undefined) update.amount = Number(amount);

        const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!order) return res.status(404).json({ ok: false, error: "not_found" });

        return res.json({ ok: true, order });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/admin/orders/:id - Hard delete order
router.delete("/orders/:id", protect, adminOnly, async (req, res, next) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ ok: false, error: "not_found" });

        return res.json({ ok: true, message: "Order deleted" });
    } catch (err) {
        next(err);
    }
});

// ============= ITEMS =============

// GET /api/admin/items - List all items
router.get("/items", protect, adminOnly, async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status, q } = req.query;
        const filter = { isDeleted: false };

        if (status) filter.status = status;
        if (q) {
            filter.title = { $regex: q, $options: "i" };
        }

        const pageNum = Number(page) || 1;
        const limitNum = Math.min(Number(limit) || 50, 100);
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            Item.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            Item.countDocuments(filter),
        ]);

        return res.json({ ok: true, page: pageNum, limit: limitNum, total, items });
    } catch (err) {
        next(err);
    }
});

// PUT /api/admin/items/:id - Update item
router.put("/items/:id", protect, adminOnly, async (req, res, next) => {
    try {
        const { title, price, status, description } = req.body;
        const update = {};

        if (title) update.title = String(title).trim();
        if (price !== undefined) update.price = Number(price);
        if (status) update.status = status;
        if (description !== undefined) update.description = description;

        const item = await Item.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!item) return res.status(404).json({ ok: false, error: "not_found" });

        return res.json({ ok: true, item });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/admin/items/:id - Hard delete item
router.delete("/items/:id", protect, adminOnly, async (req, res, next) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ ok: false, error: "not_found" });

        return res.json({ ok: true, message: "Item deleted" });
    } catch (err) {
        next(err);
    }
});

export default router;
