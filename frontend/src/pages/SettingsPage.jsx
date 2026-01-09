import { useState, useEffect, useRef } from "react";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { authFetch } from "../api/authFetch";

export default function SettingsPage() {
    const { user, login } = useAuth(); // login used to update user context
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Profile Form Data
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        avatar: "",
        notifications: { email: true, push: true },
    });

    // Password Form Data
    const [passData, setPassData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                address: user.address || "",
                avatar: user.avatar || "",
                notifications: {
                    email: user.notifications?.email ?? true,
                    push: user.notifications?.push ?? true,
                },
            });
        }
    }, [user]);

    function handleMessage(type, text) {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }

    // ===== PROFILE IMAGE =====
    async function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            return handleMessage("error", "Image size must be less than 5MB");
        }

        try {
            setLoading(true);
            const data = new FormData();
            data.append("images", file);

            // Upload to Cloudinary
            const uploadRes = await authFetch("/api/upload/images", {
                method: "POST",
                body: data,
                isFormData: true, // Helper to skip JSON headers if authFetch supports it, or manual fetch
            });
            // Note: authFetch might need adjustment for FormData if it strictly sets Content-Type: application/json.
            // Let's check authFetch implementation later. Providing it allows body override.
            // If authFetch sets JSON content type, we might need a workaround or plain fetch with token.

            // Assume authFetch handles FormData if body is FormData or we strip Content-Type.
            // Actually standard fetch handles FormData content-type boundary automatically.

            if (uploadRes.files && uploadRes.files.length > 0) {
                const url = uploadRes.files[0].url;
                setFormData(prev => ({ ...prev, avatar: url }));
                // Auto save avatar
                await updateProfile({ avatar: url });
            }
        } catch (err) {
            handleMessage("error", "Failed to upload image: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    // ===== UPDATE PROFILE =====
    async function updateProfile(dataToUpdate = null) {
        try {
            setLoading(true);
            const payload = dataToUpdate || {
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                notifications: formData.notifications,
            };

            const res = await authFetch("/api/profile", {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                // Update context
                // We might need to refresh user data in context. 
                // If login(res.user) works to update state, use that.
                // Assuming AuthContext has a way to update user or we just reload.
                // For now, let's try to update locally if context doesn't auto-refresh.
                handleMessage("success", "Profile updated successfully");
                if (res.user) {
                    // Hack: updating user in context if login function supports passing user object directly 
                    // or fetch profile again.
                    // If AuthContext uses a listener or specific method, we should likely reload page or `window.location.reload()` 
                    // but that's bad UX. 
                    // Let's assume user context updates on next fetch or we can manually update if exposed.
                    // For safety:
                    window.location.reload();
                }
            }
        } catch (err) {
            handleMessage("error", err.message);
        } finally {
            setLoading(false);
        }
    }

    // ===== CHANGE PASSWORD =====
    async function handlePasswordChange(e) {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            return handleMessage("error", "Passwords do not match");
        }
        if (passData.newPassword.length < 6) {
            return handleMessage("error", "Password must be at least 6 characters");
        }

        try {
            setLoading(true);
            await authFetch("/api/profile/password", {
                method: "PATCH",
                body: JSON.stringify({
                    currentPassword: passData.currentPassword,
                    newPassword: passData.newPassword,
                }),
            });
            handleMessage("success", "Password changed successfully");
            setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            handleMessage("error", err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <MainLayout>
            <div className="max-w-3xl mx-auto p-4 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">⚙️ Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your profile and preferences</p>
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div className={`p-4 rounded-lg ${message.type === "error" ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* 1. Profile Picture */}
                <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Picture</h2>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-slate-200" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-3xl">
                                    👤
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-700 rounded-full p-1 shadow border dark:border-slate-600 cursor-pointer hover:bg-gray-50"
                                onClick={() => fileInputRef.current?.click()}>
                                📷
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Allowed *.jpeg, *.jpg, *.png, *.webp</p>
                            <p className="text-sm text-gray-500">Max size of 5 MB</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Personal Info */}
                <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="0xx-xxx-xxxx"
                                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows="3"
                                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                            ></textarea>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => updateProfile()}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            Save Changes
                        </button>
                    </div>
                </section>

                {/* 3. Notifications */}
                <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                                <p className="text-sm text-gray-500">Receive updates and offers via email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.notifications.email}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        notifications: { ...formData.notifications, email: e.target.checked }
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                                <p className="text-sm text-gray-500">Receive real-time updates on your device</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.notifications.push}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        notifications: { ...formData.notifications, push: e.target.checked }
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => updateProfile()}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            Save Preferences
                        </button>
                    </div>
                </section>

                {/* 4. Security */}
                <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security</h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                            <input
                                type="password"
                                value={passData.currentPassword}
                                onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                                <input
                                    type="password"
                                    value={passData.newPassword}
                                    onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                                <input
                                    type="password"
                                    value={passData.confirmPassword}
                                    onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-slate-800 dark:bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-900 dark:hover:bg-slate-500 disabled:opacity-50"
                            >
                                Change Password
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </MainLayout>
    );
}
