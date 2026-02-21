import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';

const ProfileDropdown = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        { label: 'View Profile', icon: 'fa-regular fa-user', path: `/profile/${user.username || 'me'}` },
        { label: 'Edit Profile', icon: 'fa-solid fa-pen-to-square', action: () => navigate(`/profile/${user.username || 'me'}?edit=true`) },
        { label: 'My Ranking', icon: 'fa-solid fa-trophy', path: '/ranking/me' },
        { label: 'Posts & Activity', icon: 'fa-solid fa-layer-group', path: `/profile/${user.username || 'me'}?tab=activity` },
        { label: 'My Companies', icon: 'fa-solid fa-building', path: '/companies' },
        { divider: true },
        { label: 'Settings & Privacy', icon: 'fa-solid fa-gear', path: '/settings' },
        { label: 'Help Center', icon: 'fa-regular fa-circle-question', path: '/help' },
        { label: 'Language', icon: 'fa-solid fa-globe', path: '/language' }, // Placeholder
        { divider: true },
        { label: 'Sign Out', icon: 'fa-solid fa-right-from-bracket', action: onLogout, color: 'text-red-400' }
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-3 border-l border-white/10 hover:opacity-80 transition-opacity focus:outline-none"
            >
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-white leading-tight">{user.name}</div>
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{user.title || 'Member'}</div>
                </div>
                <UserAvatar name={user.name} size={36} />
                <i className={`fa-solid fa-chevron-down text-xs text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-64 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-white/5">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{user.username}</p>
                        <Link
                            to={`/profile/${user.username || 'me'}`}
                            className="mt-3 block w-full py-1.5 text-center text-xs font-bold text-indigo-400 border border-indigo-500/30 rounded-full hover:bg-indigo-500/10 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            View Profile
                        </Link>
                    </div>

                    <div className="p-2 space-y-1">
                        {[
                            { label: 'Edit Profile', icon: 'fa-solid fa-pen-to-square', path: `/profile/me` }, // Redirects to profile which has edit button
                            { label: 'My Ranking', icon: 'fa-solid fa-trophy', path: '/ranking/me' },
                            { label: 'My Companies', icon: 'fa-solid fa-building', path: '/companies' },
                            { type: 'divider' },
                            { label: 'Settings & Privacy', icon: 'fa-solid fa-gear', path: '/settings' },
                            { label: 'Help Center', icon: 'fa-regular fa-circle-question', path: '/help' },
                            { type: 'divider' },
                            { label: 'Sign Out', icon: 'fa-solid fa-right-from-bracket', action: onLogout, color: 'text-red-400 hover:text-red-300' }
                        ].map((item, idx) => {
                            if (item.type === 'divider') return <div key={idx} className="h-px bg-white/5 my-1 mx-2" />;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setIsOpen(false);
                                        if (item.action) item.action();
                                        else if (item.path) navigate(item.path);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-white/5 transition-colors text-left group ${item.color || 'text-zinc-300 hover:text-white'}`}
                                >
                                    <span className="w-5 text-center text-zinc-500 group-hover:text-white transition-colors opacity-70">
                                        <i className={item.icon}></i>
                                    </span>
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="px-4 py-3 bg-white/5 text-[10px] text-zinc-600 text-center border-t border-black/20">
                        The Senses © 2026
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
