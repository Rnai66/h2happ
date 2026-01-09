import { useState, useRef, useEffect } from "react";
import { useNotification } from "../context/NotificationContext";
import { Link } from "react-router-dom";

export default function NotificationDropdown() {
    const { notifications, unreadCount, markAsRead, markAllRead, fetchNotifications } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (!isOpen) {
            fetchNotifications(); // 🔄 Refresh data
            if (unreadCount > 0) {
                markAllRead();
            }
        }
        setIsOpen(!isOpen);
    };

    const handleItemClick = (n) => {
        if (!n.isRead) markAsRead(n._id);
        setIsOpen(false);
    };

    const handleMarkAll = () => {
        markAllRead();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={handleToggle}
                className="relative p-2 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition"
            >
                <span className="text-xl">🔔</span>
                <span className={`absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 rounded-full ${unreadCount > 0 ? "bg-red-600" : "bg-slate-500"}`}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            การแจ้งเตื่อน
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAll}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                อ่านทั้งหมด
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                ไม่มีการแจ้งเตื่อน
                            </div>
                        ) : (
                            <ul>
                                {notifications.map((n) => (
                                    <li key={n._id} className={`border-b dark:border-slate-700 last:border-0 ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                        <Link
                                            to={n.link || "#"}
                                            onClick={() => handleItemClick(n)}
                                            className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                                        >
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {/* Icon based on type */}
                                                    {n.type === "CHAT" ? "💬" : n.type?.startsWith("ORDER") ? "📦" : "ℹ️"}
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {n.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                        {n.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        {new Date(n.createdAt).toLocaleDateString("th-TH", {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-900/50 px-4 py-2 text-center border-t dark:border-slate-700">
                        <Link
                            to="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="text-xs text-gray-500 hover:text-h2h-gold transition hidden"
                        >
                            ดูทั้งหมด (Coming Soon)
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
