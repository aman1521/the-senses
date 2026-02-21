"use client";

import { useAuthStore } from "@/store/authStore";
import { logout as apiLogout } from "@/services/authService";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await apiLogout();
            logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed", error);
            // Even if API fails, clear local state
            logout();
            navigate("/login");
        }
    };

    return (
        <nav className="bg-black border-b border-zinc-800 p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold text-white tracking-tighter">
                    THE SENSES
                </Link>

                {isAuthenticated ? (
                    <div className="flex items-center gap-6">
                        <Link to="/test" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                            Test
                        </Link>
                        <Link to="/rank" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                            Rank
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-medium hover:bg-zinc-800 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <Link
                        to="/login"
                        className="px-4 py-2 rounded-lg bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors"
                    >
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
}
