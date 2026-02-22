import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationsDropdown from './NotificationsDropdown';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    // Don't show navbar on the Test page to keep focus
    if (location.pathname === '/test') return null;

    const userName = localStorage.getItem("userName");
    const userId = localStorage.getItem("userId");

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    // Construct user object for dropdown
    const user = {
        name: userName,
        id: userId,
        username: userName ? userName.toLowerCase().replace(/\s+/g, '') : 'me', // Fallback username logic
        title: localStorage.getItem("userProfileType") || "Member",
        headline: localStorage.getItem("userHeadline") // If we stored this
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-gray-400 flex items-center justify-center font-bold text-black group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">
                        S
                    </div>
                    <span className="font-bold text-lg tracking-wide text-white">THE SENSES</span>
                </Link>

                {/* Search */}
                <form onSubmit={handleSearch} className="hidden md:flex items-center bg-white/10 rounded-full px-4 py-1.5 border border-white/10 focus-within:bg-white/20 transition-all">
                    <i className="fa-solid fa-search text-white/50 text-sm"></i>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none text-white text-sm focus:outline-none ml-2 w-32 focus:w-48 transition-all"
                    />
                </form>

                {/* Nav Links */}
                <div className="hidden lg:flex items-center gap-6">
                    <NavLink to="/dashboard" label="Dashboard" icon={<i className="fa-solid fa-chart-line"></i>} active={location.pathname === '/dashboard'} />
                    <NavLink to="/methodology" label="Science" icon={<i className="fa-solid fa-flask"></i>} active={location.pathname === '/methodology'} />
                    <NavLink to="/profile-selection" label="Assessment" icon={<i className="fa-solid fa-clipboard-check"></i>} active={location.pathname === '/profile-selection'} />
                    <NavLink to="/leaderboard" label="Leaderboard" icon={<i className="fa-solid fa-trophy"></i>} active={location.pathname === '/leaderboard'} />
                    <NavLink to="/duel" label="Arena" icon={<i className="fa-solid fa-swords"></i>} active={location.pathname === '/duel'} />
                    <NavLink to="/ai-battle" label="AI Battle" icon={<i className="fa-solid fa-robot"></i>} active={location.pathname === '/ai-battle'} />
                    <NavLink to="/messages" label="Messages" icon={<i className="fa-solid fa-comment-dots"></i>} active={location.pathname === '/messages'} />
                </div>

                {/* User Profile / Login */}
                <div className="flex items-center gap-4">
                    {userId ? (
                        <div className="flex items-center gap-3">
                            <NotificationsDropdown userId={userId} />
                            <ProfileDropdown user={user} onLogout={handleLogout} />
                        </div>
                    ) : (
                        <Link to="/login">
                            <button className="px-5 py-2 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors">
                                Connect
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ to, label, icon, active }) => (
    <Link
        to={to}
        className={`flex items-center gap-2 text-sm font-medium transition-colors ${active ? 'text-white' : 'text-white/60 hover:text-white'
            }`}
    >
        <span className="opacity-80">{icon}</span>
        {label}
    </Link>
);

export default Navbar;
