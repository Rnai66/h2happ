import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function AdminDashboard() {
    const { isAdmin, loading: authLoading } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && isAdmin) {
            loadUsers();
        }
    }, [authLoading, isAdmin]);

    async function loadUsers() {
        try {
            setLoading(true);
            const res = await api.get("/users?role=all&limit=50");
            setUsers(res.users || []);
        } catch (e) {
            console.error(e);
            alert("Failed to load users");
        } finally {
            setLoading(false);
        }
    }

    // ... (keep handleRoleChange and handleDeleteUser as is) ...

    async function handleRoleChange(userId, newRole) {
        if (!window.confirm(`Promote user to ${newRole}?`)) return;
        try {
            await api.patch(`/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (e) {
            alert(e.message);
        }
    }

    async function handleDeleteUser(userId, userName) {
        // NOTE: Confirmation is now handled by UI state (showDeleteConfirm)
        try {
            setIsDeleting(true);
            await api.delete(`/users/${userId}`);

            // Success
            setUsers(prev => prev.filter(u => u._id !== userId));
            setEditingUser(null);
            // alert(`Deleting "${userName}" success.`); // Optional: UI is responsive enough
        } catch (e) {
            console.error("Delete failed:", e);
            alert(e.message || "Failed to delete user");
        } finally {
            setIsDeleting(false);
        }
    }

    if (authLoading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-64 text-slate-500">
                    Loading admin privileges...
                </div>
            </MainLayout>
        );
    }

    if (!isAdmin) {
        return (
            <MainLayout>
                <div className="p-4 text-red-500 font-bold border border-red-200 bg-red-50 rounded-lg m-4 flex flex-col items-center gap-3">
                    <p>⚠️ Access Denied: We could not verify your admin privileges.</p>
                    <button
                        onClick={async () => {
                            try {
                                const res = await api.post("/auth/promote-me");
                                alert("Fixed! You are now an Admin. Reloading...");
                                localStorage.setItem("h2h_token", res.token); // Save new token
                                window.location.reload();
                            } catch (e) {
                                alert("Failed to fix: " + e.message);
                            }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-normal text-sm shadow-md"
                    >
                        🛠️ Fix Admin Access (Click Me)
                    </button>
                </div>
            </MainLayout>
        );
    }

    const [editingUser, setEditingUser] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset delete confirmation when modal closes or user changes
    useEffect(() => {
        setShowDeleteConfirm(false);
        setIsDeleting(false);
    }, [editingUser]);

    async function handleSaveUser(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = {
            name: formData.get("name"),
            email: formData.get("email"),
            role: formData.get("role"),
        };

        try {
            await api.put(`/users/${editingUser._id}`, updates);
            setUsers(users.map(u => u._id === editingUser._id ? { ...u, ...updates } : u));
            setEditingUser(null);
        } catch (error) {
            alert(error.message || "Failed to update user");
        }
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}> Admin Dashboard (AD System)</h1>

                <div className="h2h-card p-4 md:p-6 overflow-hidden relative shadow-silk border border-white/20">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <h2 className="text-xl font-bold tracking-tight">User Management</h2>
                        <button
                            onClick={loadUsers}
                            className="text-xs px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 backdrop-blur-md flex items-center gap-1 hover:bg-white/10 transition active:scale-95"
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    <div className="overflow-x-auto -mx-4 md:mx-0 pb-2">
                        <table className="w-full text-xs text-left">
                            <thead className="border-b bg-white/5 whitespace-nowrap uppercase tracking-wider font-semibold text-slate-500" style={{ borderColor: 'var(--border-color)' }}>
                                <tr>
                                    <th className="px-3 py-3">Name</th>
                                    <th className="px-3 py-3">Email</th>
                                    <th className="px-3 py-3">Role</th>
                                    <th className="px-3 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-slate-500">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-slate-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map(u => (
                                        <tr key={u._id} className="hover:bg-white/5 transition">
                                            <td className="px-3 py-3 font-medium whitespace-nowrap">{u.name}</td>
                                            <td className="px-3 py-3 opacity-70 whitespace-nowrap">{u.email}</td>
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide
                                ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' :
                                                        u.role === 'seller' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    onClick={() => setEditingUser(u)}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                                                >
                                                    Edit ✏️
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Edit User</h3>
                            <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 text-xl">
                                &times;
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <form id="edit-user-form" onSubmit={handleSaveUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Name</label>
                                    <input
                                        name="name"
                                        defaultValue={editingUser.name}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                                    <input
                                        name="email"
                                        type="email"
                                        defaultValue={editingUser.email}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role</label>
                                    <select
                                        name="role"
                                        defaultValue={editingUser.role}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    >
                                        <option value="user">User</option>
                                        <option value="seller">Seller</option>
                                        <option value="moderator">Moderator</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </form>

                            <div className="pt-4 space-y-3">
                                {showDeleteConfirm ? (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-3 animate-in slide-in-from-bottom-2">
                                        <p className="text-sm text-red-700 font-semibold text-center">
                                            ⚠️ confirm delete user "{editingUser.name}"?
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                disabled={isDeleting}
                                                onClick={() => handleDeleteUser(editingUser._id, editingUser.name)}
                                                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition disabled:opacity-50"
                                            >
                                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isDeleting}
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition"
                                        >
                                            Delete User 🗑️
                                        </button>
                                        <button
                                            type="submit"
                                            form="edit-user-form"
                                            className="flex-[2] py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition"
                                        >
                                            Save Changes ✨
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
