import mongoose from "mongoose";
import { OrderModel } from "../models/OrderModel.js";
import { ItemModel } from "../models/ItemModel.js";

function getOrderModel() {
    return OrderModel(mongoose.connection);
}
function getItemModel() {
    return ItemModel(mongoose.connection);
}

export async function getStats(req, res) {
    try {
        // userId from auth middleware
        const userId = req.user._id || req.user.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const Order = getOrderModel();
        const Item = getItemModel();

        // 1. Sell Income (Sales) -> Seller = Me, Status = pending/confirmed/completed
        const sales = await Order.aggregate([
            {
                $match: {
                    sellerId: userId,
                    status: { $in: ["pending", "confirmed", "completed"] },
                    // paymentStatus: "paid", // Commented out to show all volume including pending
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]);

        // 2. Buy Expense (Purchases) -> Buyer = Me, Status = pending/confirmed/completed
        const purchases = await Order.aggregate([
            {
                $match: {
                    buyerId: userId,
                    status: { $in: ["pending", "confirmed", "completed"] },
                    // paymentStatus: "paid",
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]);

        // 3. Last 7 Days Chart Data
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Include today
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const recentOrders = await Order.find({
            $or: [{ buyerId: userId }, { sellerId: userId }],
            createdAt: { $gte: sevenDaysAgo },
            status: { $in: ["pending", "confirmed", "completed"] }, // Relaxed as per request
            isDeleted: false
        }).lean();

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const chartMap = new Map();

        // Initialize last 7 days (including today)
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
            const dayName = days[d.getDay()];
            chartMap.set(dateStr, { name: dayName, date: dateStr, income: 0, expense: 0 });
        }

        recentOrders.forEach(o => {
            const d = o.createdAt.toISOString().split('T')[0];
            if (chartMap.has(d)) {
                const entry = chartMap.get(d);
                if (String(o.sellerId) === String(userId)) {
                    entry.income += o.amount;
                }
                if (String(o.buyerId) === String(userId)) {
                    entry.expense += o.amount;
                }
            }
        });

        // Convert Map to array and reverse to show oldest -> newest
        const chartData = Array.from(chartMap.values()).reverse();

        // 3. Items Stats
        const activeItems = await Item.countDocuments({ sellerId: userId, status: "active", isDeleted: false });
        const soldItems = await Item.countDocuments({ sellerId: userId, status: "sold", isDeleted: false });
        const draftItems = await Item.countDocuments({ sellerId: userId, status: "draft", isDeleted: false });

        // 4. Recent Transactions (Last 5)
        const recentTransactions = await Order.find({
            $or: [{ buyerId: userId }, { sellerId: userId }],
            isDeleted: false
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        return res.json({
            revenue: sales[0]?.total || 0,
            salesCount: sales[0]?.count || 0,
            expenses: purchases[0]?.total || 0,
            purchasesCount: purchases[0]?.count || 0,
            chartData, // ✅ Real data
            items: {
                active: activeItems,
                sold: soldItems,
                draft: draftItems,
            },
            recentTransactions,
        });

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        return res.status(500).json({ message: "Failed to load stats", error: err.message });
    }
}
