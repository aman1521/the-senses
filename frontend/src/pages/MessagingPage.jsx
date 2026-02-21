import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getConversations, getMessages, sendMessage, markAsRead } from '../services/messageService';
import UserAvatar from '../components/UserAvatar';

const MessagingPage = () => {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const messagesEndRef = useRef(null);
    const currentUserId = localStorage.getItem('userId');

    // Fetch conversations on mount
    useEffect(() => {
        loadConversations();
        // Poll for new messages every 10s (simple real-time fallback)
        const interval = setInterval(loadConversations, 10000);
        return () => clearInterval(interval);
    }, []);

    // Handle 'to' param for starting new chat
    useEffect(() => {
        const toUser = searchParams.get('to');
        const toName = searchParams.get('name');
        const toPic = searchParams.get('pic');

        if (toUser && conversations.length > 0) {
            // Check if conversation already exists
            const existing = conversations.find(c =>
                c.participants.includes(toUser) ||
                c.otherParticipants.some(p => p._id === toUser)
            );

            if (existing) {
                setActiveConvo(existing);
            } else if (toName) {
                // Create temp conversation object for UI
                setActiveConvo({
                    _id: null, // Indicates new
                    participants: [currentUserId, toUser],
                    otherParticipants: [{ _id: toUser, name: toName, profilePicture: toPic, verified: false }],
                    lastMessage: { content: '', sender: '', createdAt: null }
                });
            }
        } else if (toUser && toName && conversations.length === 0 && !loading) {
            // Handle case where specific chat requested but no conversations loaded yet (or empty list)
            setActiveConvo({
                _id: null, // Indicates new
                participants: [currentUserId, toUser],
                otherParticipants: [{ _id: toUser, name: toName, profilePicture: toPic, verified: false }],
                lastMessage: { content: '', sender: '', createdAt: null }
            });
        }
    }, [searchParams, conversations, loading]);

    // Load specific conversation if messages are open
    useEffect(() => {
        if (activeConvo && activeConvo._id) {
            loadMessages(activeConvo._id);
            // Poll for messages in active chat
            const interval = setInterval(() => loadMessages(activeConvo._id, true), 3000);
            return () => clearInterval(interval);
        } else {
            setMessages([]); // Clear messages for new/temp chat
        }
    }, [activeConvo]);

    const loadConversations = async () => {
        try {
            const res = await getConversations();
            if (res.data.success) {
                setConversations(res.data.conversations);
                // If first load and no active convo, maybe select first? 
                // Or if URL param 'to' exists, handle new chat creation (omitted for brevity but good to have)
                setLoading(false);
            }
        } catch (err) {
            console.error("Failed to load conversations", err);
            setLoading(false);
        }
    };

    const loadMessages = async (convoId, isPoll = false) => {
        try {
            const res = await getMessages(convoId);
            if (res.data.success) {
                setMessages(res.data.messages);
                if (!isPoll) scrollToBottom();

                // Mark as read if needed
                const unread = res.data.messages.some(m => !m.read && m.recipient === currentUserId);
                if (unread) {
                    await markAsRead(convoId);
                    // Update local conversation state too
                    setConversations(prev => prev.map(c =>
                        c._id === convoId ? { ...c, lastMessage: { ...c.lastMessage, read: true } } : c
                    ));
                }
            }
        } catch (err) {
            console.error("Failed to load messages", err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !activeConvo) return;

        const content = inputText;
        setInputText(''); // Optimistic clear

        // Optimistic update
        const optimisticMsg = {
            _id: 'temp-' + Date.now(),
            conversationId: activeConvo._id,
            sender: currentUserId,
            content: content,
            createdAt: new Date(),
            read: false
        };
        setMessages(prev => [...prev, optimisticMsg]);
        scrollToBottom();

        try {
            const recipient = activeConvo.otherParticipants[0]?._id;
            const res = await sendMessage({
                conversationId: activeConvo._id,
                recipientId: recipient,
                content
            });

            if (res.data.success) {
                // Replace temp message with real one or just reload
                loadMessages(activeConvo._id);
                loadConversations(); // Update list preview
            }
        } catch (err) {
            console.error("Send failed", err);
            // Revert on failure (could add error state to message)
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Helper to get formatted time
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getOtherUser = (convo) => convo.otherParticipants[0] || { name: 'Unknown', username: 'unknown' };

    return (
        <div className="min-h-screen bg-black text-white pt-20 px-4 md:px-8 pb-8 font-sans h-screen flex flex-col">
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                            <i className="fa-solid fa-satellite-dish text-indigo-500"></i> Encrypted Channels
                        </h1>
                        <p className="text-zinc-500 text-sm font-mono mt-1">SECURE_LINK // V1.0.4</p>
                    </div>
                </header>

                <div className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden flex shadow-2xl shadow-black/50">

                    {/* Sidebar / Conversation List */}
                    <div className={`w-full md:w-80 border-r border-white/10 flex flex-col ${activeConvo ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-white/10 bg-[#111]">
                            <div className="relative">
                                <i className="fa-solid fa-search absolute left-3 top-3 text-zinc-500 text-xs"></i>
                                <input
                                    type="text"
                                    placeholder="Search frequencies..."
                                    className="w-full bg-black border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-indigo-500 outline-none font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-8 text-center text-zinc-600 text-xs font-mono animate-pulse">Loading channels...</div>
                            ) : conversations.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <i className="fa-solid fa-inbox text-zinc-600"></i>
                                    </div>
                                    <p className="text-sm">No active channels.</p>
                                </div>
                            ) : (
                                conversations.map(convo => {
                                    const otherUser = getOtherUser(convo);
                                    const isUnread = !convo.lastMessage.read && convo.lastMessage.sender !== currentUserId;

                                    return (
                                        <div
                                            key={convo._id}
                                            onClick={() => setActiveConvo(convo)}
                                            className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors group ${activeConvo?._id === convo._id ? 'bg-white/5 border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent'}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="relative">
                                                    <UserAvatar name={otherUser.name} src={otherUser.profilePicture} className="w-10 h-10 rounded-lg bg-zinc-800" />
                                                    {otherUser.verified && <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-[8px] p-0.5 rounded-full border border-black"><i className="fa-solid fa-check text-white"></i></div>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <h4 className={`text-sm font-medium truncate ${isUnread ? 'text-white font-bold' : 'text-zinc-400 group-hover:text-white'}`}>
                                                            {otherUser.name}
                                                        </h4>
                                                        <span className="text-[10px] font-mono text-zinc-600 whitespace-nowrap">{convo.lastMessage.createdAt ? formatTime(convo.lastMessage.createdAt) : ''}</span>
                                                    </div>
                                                    <p className={`text-xs truncate ${isUnread ? 'text-indigo-400 font-medium' : 'text-zinc-600'}`}>
                                                        {convo.lastMessage.sender === currentUserId && <span className="text-zinc-500">You: </span>}
                                                        {convo.lastMessage.content || 'Start a conversation'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={`flex-1 flex flex-col bg-[#0a0a0a] ${!activeConvo ? 'hidden md:flex' : 'flex'}`}>
                        {activeConvo ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#111]/50 backdrop-blur-md sticky top-0 z-10">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setActiveConvo(null)} className="md:hidden text-zinc-400 hover:text-white">
                                            <i className="fa-solid fa-arrow-left"></i>
                                        </button>
                                        <UserAvatar name={getOtherUser(activeConvo).name} className="w-8 h-8 rounded text-xs bg-zinc-800" />
                                        <div>
                                            <h3 className="text-sm font-bold text-white">{getOtherUser(activeConvo).name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                <p className="text-[10px] text-zinc-500 font-mono uppercase">Online</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-zinc-500 hover:text-white transition-colors">
                                        <i className="fa-solid fa-ellipsis-vertical"></i>
                                    </button>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {messages.map((msg, idx) => {
                                        const isMe = msg.sender === currentUserId;
                                        const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender !== msg.sender);

                                        return (
                                            <div key={msg._id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                {!isMe && (
                                                    <div className="w-8 flex-shrink-0">
                                                        {showAvatar ? (
                                                            <UserAvatar name={getOtherUser(activeConvo).name} className="w-6 h-6 rounded text-[10px] bg-zinc-800" />
                                                        ) : <div className="w-6"></div>}
                                                    </div>
                                                )}

                                                <div className={`max-w-[70%] group relative`}>
                                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                                                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                                                        : 'bg-[#1a1a1a] text-zinc-300 border border-white/5 rounded-tl-sm'
                                                        }`}>
                                                        {msg.content}
                                                    </div>
                                                    <div className={`text-[9px] font-mono text-zinc-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute ${isMe ? 'right-0 top-full' : 'left-0 top-full'}`}>
                                                        {formatTime(msg.createdAt)}
                                                        {isMe && <span className="ml-1">{msg.read ? <i className="fa-solid fa-check-double text-indigo-400"></i> : <i className="fa-solid fa-check"></i>}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-4 border-t border-white/10 bg-[#111]">
                                    <form onSubmit={handleSend} className="flex gap-2 items-end">
                                        <div className="flex-1 bg-black border border-white/10 rounded-xl p-2 focus-within:border-indigo-500/50 transition-colors">
                                            <textarea
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSend(e);
                                                    }
                                                }}
                                                placeholder="Transmit secure data..."
                                                className="w-full bg-transparent text-sm text-white placeholder-zinc-700 outline-none resize-none max-h-32 custom-scrollbar"
                                                rows="1"
                                                style={{ minHeight: '24px' }}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!inputText.trim()}
                                            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                                        >
                                            <i className="fa-solid fa-paper-plane text-sm"></i>
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 bg-[#0c0c0c]">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                                    <i className="fa-solid fa-comments text-3xl opacity-50"></i>
                                </div>
                                <h3 className="text-white font-bold mb-2">Secure Channels</h3>
                                <p className="text-sm max-w-xs text-center">Select a personnel file to establish a secured communication link.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagingPage;
