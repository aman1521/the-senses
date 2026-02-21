import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { io } from 'socket.io-client';

const NotificationsDropdown = ({ userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;

        fetchNotifications();

        // Real-Time Socket.IO Connection
        const backendUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const socket = io(backendUrl, { withCredentials: true });

        socket.on('connect', () => {
            console.log('🔔 Notifications WebSocket Connected');
            socket.emit('join', userId);
        });

        socket.on('new_notification', (newNotif) => {
            console.log('🔔 New Notification Received:', newNotif.title);
            setNotifications(prev => [newNotif, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);
        });

        // Fallback polling every 5 minutes just in case
        const interval = setInterval(fetchNotifications, 300000);

        return () => {
            socket.disconnect();
            clearInterval(interval);
        };
    }, [userId]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const backendUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";
            const res = await fetch(`${backendUrl}/api/v1/notifications`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.count);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
    };

    const markAsRead = async () => {
        if (unreadCount === 0) return;

        try {
            const token = localStorage.getItem("token");
            await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || ""}/api/v1/notifications/read-all`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (e) {
            console.error("Failed to mark read", e);
        }
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            markAsRead();
        }
    };

    return (
        <div className="relative">
            <button
                onClick={toggleOpen}
                className="relative p-2 text-zinc-400 hover:text-white transition-colors"
            >
                <span className="text-xl"><i className="fa-solid fa-bell"></i></span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up origin-top-right">
                        <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <h3 className="font-bold text-sm text-white">Notifications</h3>
                            <button onClick={markAsRead} className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer">
                                <i className="fa-solid fa-check-double mr-1"></i> Mark all read
                            </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500 text-sm">
                                    No notifications yet.
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif._id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-indigo-500/5' : ''}`}>
                                        <div className="flex gap-3">
                                            <div className="mt-1">
                                                {getIconForType(notif.type)}
                                            </div>
                                            <div>
                                                <div className="text-sm text-white font-medium mb-1">{notif.title}</div>
                                                <p className="text-xs text-zinc-400 leading-relaxed mb-2">{notif.message}</p>
                                                <div className="text-[10px] text-zinc-600">
                                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const getIconForType = (type) => {
    switch (type) {
        case 'achievement': return <i className="fa-solid fa-trophy"></i>;
        case 'market_update': return <i className="fa-solid fa-newspaper"></i>;
        case 'social_like': return <i className="fa-solid fa-heart"></i>;
        case 'challenge': return <i className="fa-solid fa-swords"></i>;
        default: return <i className="fa-solid fa-bullhorn"></i>;
    }
};

export default NotificationsDropdown;
