import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { authFetch } from "../api/authFetch";
import { useAuth } from "../context/AuthContext";
import { formatOrderNumber } from "../utils/formatOrderNumber";

const TABS = [
    { key: "users", label: "👥 Users" },
    { key: "orders", label: "📦 Orders" },
    { key: "items", label: "🛍️ Items" },
];

// Format date helper
function formatDate(dt) {
    if (!dt) return "-";
    return new Date(dt).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function TabButton({ active, children, onClick }) {
    return (
        <button
            onClick={onClick}
            className={[
                "px-4 py-2.5 text-sm font-medium rounded-full border whitespace-nowrap shadow-sm transition-colors",
                active
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700",
            ].join(" ")}
        >
            {children}
        </button>
    );
}

export default function AdminDashboard() {
    const nav = useNavigate();
    const { user } = useAuth();
    const [tab, setTab] = useState("users");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Data states
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [items, setItems] = useState([]);

    // Edit states
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    // Check if user is admin
    useEffect(() => {
        if (!user || user.role !== "admin") {
            nav("/");
        }
    }, [user, nav]);

    // Load data based on tab
    useEffect(() => {
        loadData();
    }, [tab]);

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            if (tab === "users") {
                const res = await authFetch("/api/admin/users");
                setUsers(res.users || []);
            } else if (tab === "orders") {
                const res = await authFetch("/api/admin/orders");
                setOrders(res.orders || []);
            } else if (tab === "items") {
                const res = await authFetch("/api/admin/items");
                setItems(res.items || []);
            }
        } catch (e) {
            setError(e.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    }

    // ===== USER ACTIONS =====
    async function handleUserRoleChange(userId, newRole) {
        try {
            await authFetch(`/api/admin/users/${userId}`, {
                method: "PUT",
                body: JSON.stringify({ role: newRole }),
            });
            loadData();
        } catch (e) {
            alert("Failed to update role: " + e.message);
        }
    }

    async function handleDeleteUser(userId) {
        if (!confirm("ยืนยันการลบผู้ใช้นี้?")) return;
        try {
            await authFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
            loadData();
        } catch (e) {
            alert("Failed to delete: " + e.message);
        }
    }

    // ===== ORDER ACTIONS =====
    async function handleOrderStatusChange(orderId, field, value) {
        try {
            await authFetch(`/api/admin/orders/${orderId}`, {
                method: "PUT",
                body: JSON.stringify({ [field]: value }),
            });
            loadData();
        } catch (e) {
            alert("Failed to update: " + e.message);
        }
    }

    async function handleDeleteOrder(orderId) {
        if (!confirm("ยืนยันการลบคำสั่งซื้อนี้?")) return;
        try {
            await authFetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
            loadData();
        } catch (e) {
            alert("Failed to delete: " + e.message);
        }
    }

    // ===== ITEM ACTIONS =====
    async function handleItemUpdate(itemId, field, value) {
        try {
            await authFetch(`/api/admin/items/${itemId}`, {
                method: "PUT",
                body: JSON.stringify({ [field]: value }),
            });
            loadData();
        } catch (e) {
            alert("Failed to update: " + e.message);
        }
    }

    async function handleDeleteItem(itemId) {
        if (!confirm("ยืนยันการลบสินค้านี้?")) return;
        try {
            await authFetch(`/api/admin/items/${itemId}`, { method: "DELETE" });
            loadData();
        } catch (e) {
            alert("Failed to delete: " + e.message);
        }
    }

    if (!user || user.role !== "admin") {
        return null;
    }

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto p-4 space-y-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🔒 Admin Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">จัดการผู้ใช้ คำสั่งซื้อ และสินค้า</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {TABS.map((t) => (
                        <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                            {t.label}
                        </TabButton>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
                )}

                {/* ===== USERS TAB ===== */}
                {!loading && tab === "users" && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Name</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Email</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Role</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">วันที่สร้าง</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} className="border-t border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{u.name}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleUserRoleChange(u._id, e.target.value)}
                                                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-xs"
                                            >
                                                <option value="user">User</option>
                                                <option value="seller">Seller</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(u.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDeleteUser(u._id)}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                                disabled={u._id === user._id}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="text-center py-8 text-gray-500">No users found</div>
                        )}
                    </div>
                )}

                {/* ===== ORDERS TAB ===== */}
                {!loading && tab === "orders" && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Order #</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Item</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Amount</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Status</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Payment</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">วันที่สร้าง</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o) => (
                                    <tr key={o._id} className="border-t border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">
                                            <div>{formatOrderNumber(o.orderNumber, "buyer")}</div>
                                            <div className="text-gray-400 dark:text-gray-500 scale-90 origin-left">{formatOrderNumber(o.orderNumber, "seller")}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{o.itemSnapshot?.title || "-"}</td>
                                        <td className="px-4 py-3 text-amber-600 dark:text-amber-400 font-medium">฿{Number(o.amount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={o.status}
                                                onChange={(e) => handleOrderStatusChange(o._id, "status", e.target.value)}
                                                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-xs"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={o.paymentStatus}
                                                onChange={(e) => handleOrderStatusChange(o._id, "paymentStatus", e.target.value)}
                                                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-xs"
                                            >
                                                <option value="unpaid">Unpaid</option>
                                                <option value="paid">Paid</option>
                                                <option value="refunded">Refunded</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(o.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDeleteOrder(o._id)}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {orders.length === 0 && (
                            <div className="text-center py-8 text-gray-500">No orders found</div>
                        )}
                    </div>
                )}

                {/* ===== ITEMS TAB ===== */}
                {!loading && tab === "items" && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Image</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Title</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Price</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Status</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">วันที่สร้าง</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item._id} className="border-t border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                                        <td className="px-4 py-3">
                                            {item.images?.[0] ? (
                                                <img src={item.images[0]} alt="" className="w-12 h-12 rounded object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded flex items-center justify-center">📦</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{item.title}</td>
                                        <td className="px-4 py-3 text-amber-600 dark:text-amber-400 font-medium">฿{Number(item.price || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={item.status}
                                                onChange={(e) => handleItemUpdate(item._id, "status", e.target.value)}
                                                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-xs"
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="active">Active</option>
                                                <option value="sold">Sold</option>
                                                <option value="hidden">Hidden</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(item.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDeleteItem(item._id)}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {items.length === 0 && (
                            <div className="text-center py-8 text-gray-500">No items found</div>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
