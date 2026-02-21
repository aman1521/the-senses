import React, { useState, useEffect } from 'react';
import { updateProfile } from '../services/api';
import UserAvatar from '../components/UserAvatar';

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('account');
    const [user, setUser] = useState({
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        headline: localStorage.getItem('userHeadline') || '',
        notificationSettings: {
            emailNotifications: true,
            testReminders: true,
            achievementAlerts: true
        }
    });

    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleSave = async (updatedData = {}) => {
        setIsSaving(true);
        try {
            // Merge current state with updates
            const fullUpdate = { ...user, ...updatedData };

            // In a real app, we'd persist to backend here
            await updateProfile(fullUpdate);

            // Update localStorage for immediate reflection
            if (updatedData.name) localStorage.setItem('userName', updatedData.name);
            if (updatedData.headline) localStorage.setItem('userHeadline', updatedData.headline);
            if (fullUpdate.headline) localStorage.setItem('userHeadline', fullUpdate.headline); // Ensure fallback uses full state if not passed explicitly

            setSuccessMsg('Settings updated successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
            setUser(fullUpdate);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'account', label: 'Account', icon: 'fa-solid fa-user-shield' },
        { id: 'notifications', label: 'Notifications', icon: 'fa-solid fa-bell' },
        { id: 'privacy', label: 'Privacy & Data', icon: 'fa-solid fa-lock' },
        { id: 'display', label: 'Display & Language', icon: 'fa-solid fa-palette' },
        { id: 'subscription', label: 'Membership', icon: 'fa-solid fa-crown' }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-12 font-sans pt-24">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 flex items-end justify-between border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Settings & Control</h1>
                        <p className="text-zinc-500 mt-2">Manage your cognitive profile and preferences.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium text-left ${activeTab === tab.id
                                    ? 'bg-white/10 text-white shadow-lg shadow-white/5 border border-white/10'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                    }`}
                            >
                                <i className={`${tab.icon} w-5 text-center`}></i>
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* Content Area */}
                    <div className="md:col-span-3">
                        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 min-h-[500px] relative overflow-hidden">

                            {/* Success Message Toast */}
                            {successMsg && (
                                <div className="absolute top-4 right-4 z-50 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm flex items-center gap-2 animate-fade-in-up">
                                    <i className="fa-solid fa-check-circle"></i> {successMsg}
                                </div>
                            )}

                            {activeTab === 'account' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">Account Information</h2>
                                        <p className="text-sm text-zinc-500">Update your personal details and public persona.</p>
                                    </div>

                                    <div className="space-y-6 max-w-lg">
                                        <div className="flex items-center gap-6 mb-8">
                                            <div className="relative">
                                                <UserAvatar name={user.name} size={64} className="w-16 h-16 text-xl bg-indigo-600 ring-4 ring-black" />
                                                <div className="absolute -bottom-1 -right-1 bg-zinc-800 p-1 rounded-full border border-black">
                                                    <i className="fa-solid fa-camera text-[10px] text-white"></i>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white max-w-[200px] truncate">{user.name}</h3>
                                                <button className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 font-medium">Upload New Photo</button>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs uppercase text-zinc-500 font-bold mb-2 tracking-wider">Full Name</label>
                                            <input
                                                type="text"
                                                value={user.name}
                                                onChange={(e) => setUser({ ...user, name: e.target.value })}
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors placeholder-zinc-700"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs uppercase text-zinc-500 font-bold mb-2 tracking-wider">Email Address</label>
                                            <input
                                                type="text"
                                                value={user.email}
                                                disabled
                                                className="w-full bg-[#111] border border-white/5 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs uppercase text-zinc-500 font-bold mb-2 tracking-wider">Professional Headline</label>
                                            <input
                                                type="text"
                                                value={user.headline}
                                                onChange={(e) => setUser({ ...user, headline: e.target.value })}
                                                placeholder="e.g. Cognitive Architect"
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors placeholder-zinc-700"
                                            />
                                        </div>

                                        <div className="pt-6 border-t border-white/5 flex justify-end">
                                            <button
                                                onClick={() => handleSave()}
                                                disabled={isSaving}
                                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {isSaving && <i className="fa-solid fa-circle-notch fa-spin"></i>}
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">Notification Preferences</h2>
                                        <p className="text-sm text-zinc-500">Control which alerts you receive.</p>
                                    </div>

                                    <div className="space-y-4 max-w-2xl">
                                        {[
                                            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive weekly digests and major updates via email.' },
                                            { key: 'testReminders', label: 'Test Reminders', desc: 'Get notified when you are eligible for a cognitive re-test.' },
                                            { key: 'achievementAlerts', label: 'Achievement Alerts', desc: 'In-app notifications when you unlock badges or ranks.' }
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-white/5 rounded-xl hover:border-white/10 transition-colors group">
                                                <div>
                                                    <div className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">{item.label}</div>
                                                    <div className="text-xs text-zinc-500 mt-1">{item.desc}</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newVal = !user.notificationSettings?.[item.key];
                                                        const newSettings = { ...user.notificationSettings, [item.key]: newVal };
                                                        setUser({ ...user, notificationSettings: newSettings });
                                                        handleSave({ notificationSettings: newSettings });
                                                    }}
                                                    className={`relative w-11 h-6 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${user.notificationSettings?.[item.key] ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                                                >
                                                    <span className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${user.notificationSettings?.[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'privacy' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">Privacy & Data</h2>
                                        <p className="text-sm text-zinc-500">Manage your visibility and data retention.</p>
                                    </div>
                                    <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-xl space-y-4">
                                        <div>
                                            <h4 className="text-red-400 font-bold flex items-center gap-2">
                                                <i className="fa-solid fa-triangle-exclamation"></i> Danger Zone
                                            </h4>
                                            <p className="text-sm text-zinc-400 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                                        </div>
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 rounded-lg text-sm transition-colors font-medium"
                                        >
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'display' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">Display & Experience</h2>
                                        <p className="text-sm text-zinc-500">Customize how The Senses looks and feels.</p>
                                    </div>

                                    <div className="md:col-span-2 space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            {['Dark Matrix', 'Midnight Blue'].map((theme, i) => (
                                                <div key={i} className={`border p-4 rounded-xl cursor-not-allowed opacity-70 ${i === 0 ? 'border-indigo-500 bg-[#0a0a0a]' : 'border-white/10 bg-[#111]'}`}>
                                                    <div className="h-20 bg-gradient-to-br from-zinc-800 to-black rounded-lg mb-3 border border-white/5"></div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-white">{theme}</span>
                                                        {i === 0 && <i className="fa-solid fa-circle-check text-indigo-500"></i>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-zinc-500">* Additional themes available for Elite members.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                                            <div>
                                                <div className="font-bold text-sm text-white">Reduced Motion</div>
                                                <div className="text-xs text-zinc-500 mt-1">Minimize animations for a static experience.</div>
                                            </div>
                                            <button className="w-12 h-6 bg-zinc-700 rounded-full relative">
                                                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"></div>
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                                            <div>
                                                <div className="font-bold text-sm text-white">Language</div>
                                                <div className="text-xs text-zinc-500 mt-1">Select your preferred interface language.</div>
                                            </div>
                                            <select className="bg-black border border-white/10 text-white text-sm rounded-lg p-2 outline-none focus:border-indigo-500">
                                                <option>English (US)</option>
                                                <option>Spanish (ES)</option>
                                                <option>French (FR)</option>
                                                <option>Japanese (JP)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'subscription' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">Membership Status</h2>
                                        <p className="text-sm text-zinc-500">Manage your subscription and billing.</p>
                                    </div>

                                    <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-white/10 rounded-xl p-8 relative overflow-hidden">
                                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div>
                                                <div className="text-xs font-mono uppercase text-indigo-400 mb-2 tracking-wider">Current Plan</div>
                                                <h3 className="text-3xl font-bold text-white">Free Thinker</h3>
                                                <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                                                    <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Basic Cognitive Analysis</li>
                                                    <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Global Leaderboard Access</li>
                                                    <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Limited Daily Duels</li>
                                                </ul>
                                            </div>
                                            <button className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-indigo-50 text-sm shadow-xl shadow-white/5">
                                                Upgrade to Elite
                                            </button>
                                        </div>
                                        {/* Decorative bg */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        <h4 className="font-bold text-white mb-4">Billing History</h4>
                                        <div className="text-sm text-zinc-500 italic">No previous transactions found.</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Delete Account Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={() => {
                    alert("Account deletion request submitted. Support will contact you shortly.");
                    setShowDeleteModal(false);
                }}
            />
        </div>
    );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-[#111] border border-red-500/30 rounded-xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(220,38,38,0.2)] text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-3xl text-red-500">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 className="text-2xl font-bold text-white">Delete Account?</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    This action is permanent. All your cognitive data, rankings, and certificates will be erased from the network.
                </p>
                <div className="flex flex-col gap-3 mt-6">
                    <button onClick={onConfirm} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors">
                        Yes, Delete My Data
                    </button>
                    <button onClick={onClose} className="w-full py-3 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-medium rounded-lg transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
