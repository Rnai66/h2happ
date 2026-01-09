import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export function useNotification() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated]);

    async function fetchNotifications() {
        try {
            setLoading(true);
            const res = await api.get("/notifications"); // endpoint created in backend
            setNotifications(res.notifications || []);
            setUnreadCount(res.unreadCount || 0);
        } catch (err) {
            console.error("Fetch notifications error", err);
        } finally {
            setLoading(false);
        }
    }

    async function markAsRead(id) {
        try {
            await api.patch(`/notifications/${id}/read`);
            // Update local state
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Mark read error", err);
        }
    }

    async function markAllRead() {
        try {
            await api.patch("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Mark all read error", err);
        }
    }

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                fetchNotifications,
                markAsRead,
                markAllRead,
                loading,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}
