import { useState, useEffect, useRef } from "react";
import { createPost, API } from "../services/api"; // Access axios directly for rewrite
import UserAvatar from "./UserAvatar";

const INTENTS = [
    { id: 'insight', label: 'Insight', icon: 'fa-lightbulb', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    { id: 'question', label: 'Question', icon: 'fa-question-circle', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { id: 'analysis', label: 'Strategic Analysis', icon: 'fa-chess-knight', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { id: 'debate_invitation', label: 'Debate Invitation', icon: 'fa-gavel', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    { id: 'data_claim', label: 'Data-Backed Claim', icon: 'fa-chart-line', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
];

const DOMAINS = [
    "AI Strategy", "Macroeconomics", "Neuroscience", "Quantum Computing",
    "Venture Capital", "Philosophy", "Systems Engineering", "Biotech"
];

const VISIBILITY_OPTIONS = [
    { id: 'public', label: 'Public - All Thinkers', icon: 'fa-globe' },
    { id: 'followers', label: 'Connections Only', icon: 'fa-user-group' },
    { id: 'elite', label: 'Elite Circle (Top 10%)', icon: 'fa-crown' }
];

const EMOJIS = ['👍', '🔥', '💡', '🤔', '📈', '🚀', '🧠', '🎓', '🤖', '✨', '📚', '⚖️'];

export default function CreatePostModal({ isOpen, onClose, user, onPostCreated }) {
    const [content, setContent] = useState("");
    const [intent, setIntent] = useState('insight');
    const [domain, setDomain] = useState("");
    const [visibility, setVisibility] = useState('public');
    const [isRewriting, setIsRewriting] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [depthScore, setDepthScore] = useState(30);
    const [showDomainDropdown, setShowDomainDropdown] = useState(false);

    // New Feature States
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);
    const [scheduledDate, setScheduledDate] = useState("");
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);

    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [content]);

    // Live Depth Simulator
    useEffect(() => {
        let score = Math.min(content.length / 5, 50);
        if (content.length > 200) score += 10;
        if (intent === 'analysis') score += 15;
        if (intent === 'debate_invitation') score += 10;
        setDepthScore(Math.floor(score + 30));
    }, [content, intent]);

    const handleRewrite = async () => {
        if (!content) return;
        setIsRewriting(true);
        try {
            const res = await API.post('/api/v1/ai-rewrite', { content, intent });
            if (res.data.success) {
                setContent(res.data.rewritten);
                setDepthScore(res.data.depthScore);
            }
        } catch (e) {
            console.error("Rewrite failed", e);
        } finally {
            setIsRewriting(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const addEmoji = (emoji) => {
        setContent(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handlePost = async () => {
        if (!content || !domain) return;
        setIsPosting(true);
        try {
            let postType = 'insight';
            if (intent === 'debate_invitation') postType = 'debate';
            if (intent === 'question') postType = 'question';
            if (intent === 'analysis') postType = 'insight';

            // Mock Media Upload - In prod, upload to S3 here
            let media = [];
            if (mediaFile) {
                media.push({
                    type: mediaFile.type.startsWith('image') ? 'image' : 'document',
                    url: mediaPreview, // Using local blob for demo
                    caption: mediaFile.name
                });
            }

            const res = await createPost({
                content,
                intent,
                domain,
                visibility,
                postType,
                tags: [domain],
                media,
                scheduledAt: scheduledDate || null
            });

            if (res.data.success) {
                onPostCreated && onPostCreated(res.data.data || res.data.post || res.data);
                onClose();
                setContent("");
                setDomain("");
                setMediaFile(null);
                setMediaPreview(null);
                setScheduledDate("");
            }
        } catch (e) {
            console.error("Post failed", e);
        } finally {
            setIsPosting(false);
        }
    };

    if (!isOpen) return null;

    const currentIntent = INTENTS.find(i => i.id === intent);
    const isReadyToPost = content.length >= 20 && domain;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0a0a0a] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className="p-4 border-b border-white/5 flex justify-between items-start">
                    <div className="flex gap-3">
                        <UserAvatar name={user.name} size={48} />
                        <div>
                            <h3 className="font-bold text-white text-lg">{user.name}</h3>
                            <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-white/5 px-2 py-1 rounded-full transition-colors border border-transparent hover:border-zinc-700">
                                <i className={`fa-solid ${VISIBILITY_OPTIONS.find(v => v.id === visibility).icon}`}></i>
                                {VISIBILITY_OPTIONS.find(v => v.id === visibility).label}
                            </button>
                        </div>
                    </div>

                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">

                    {/* Cognitive Intent Selector */}
                    <div className="mb-4">
                        <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2 block">Cognitive Intent</label>
                        <div className="flex flex-wrap gap-2">
                            {INTENTS.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setIntent(item.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${intent === item.id ? `${item.bg} ${item.border} ${item.color}` : 'border-white/5 text-zinc-500 hover:bg-white/5'}`}
                                >
                                    <i className={`fa-solid ${item.icon}`}></i> {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Share your ${currentIntent.label.toLowerCase()}... (min 20 chars)`}
                        className="w-full bg-transparent text-lg text-white placeholder-zinc-600 focus:outline-none resize-none min-h-[150px] font-serif tracking-wide leading-relaxed"
                    />

                    {/* Media Preview */}
                    {mediaPreview && (
                        <div className="relative mt-2 mb-4 w-fit group">
                            <img src={mediaPreview} alt="Upload preview" className="max-h-48 rounded-lg border border-white/10" />
                            <button
                                onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                                className="absolute top-2 right-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    )}

                    {/* Feature Bar */}
                    <div className="flex justify-between items-end mt-4 relative">
                        <div className="flex gap-2">
                            <button
                                onClick={handleRewrite}
                                disabled={isRewriting || !content}
                                className="px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {isRewriting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                                AI Rewrite
                            </button>

                            <div className="flex gap-1 relative">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                                    onChange={handleFileSelect}
                                />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-500 hover:text-zinc-300 rounded hover:bg-white/5" title="Add Media">
                                    <i className="fa-regular fa-image"></i>
                                </button>
                            </div>
                        </div>

                        {/* Depth Score */}
                        {content.length > 5 && (
                            <div className="text-right">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-0.5">Cognitive Depth</div>
                                <div className={`text-sm font-mono font-bold ${depthScore > 75 ? 'text-green-400' : depthScore > 50 ? 'text-blue-400' : 'text-amber-400'}`}>
                                    {depthScore}/100
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    {/* Validation Message */}
                    {!isReadyToPost && content.length > 0 && (
                        <div className="text-xs text-amber-500 mb-2 flex items-center gap-2 animate-pulse">
                            <i className="fa-solid fa-circle-info"></i>
                            {content.length < 20 ? "Minimum 20 characters required." : "Please select a Knowledge Domain."}
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 relative">
                            {/* Domain Selector (Customizable) */}
                            <div className="relative group">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium border transition-colors bg-zinc-900 border-zinc-700 focus-within:border-indigo-500 focus-within:text-white">
                                    <i className="fa-solid fa-tag text-zinc-500"></i>
                                    <input
                                        type="text"
                                        value={domain}
                                        onChange={(e) => {
                                            setDomain(e.target.value);
                                            setShowDomainDropdown(true);
                                        }}
                                        onFocus={() => setShowDomainDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowDomainDropdown(false), 200)}
                                        placeholder="Add Domain *"
                                        className="bg-transparent outline-none text-white w-24 placeholder-zinc-600 font-mono"
                                    />
                                </div>

                                {showDomainDropdown && (DOMAINS.filter(d => d.toLowerCase().includes(domain.toLowerCase())).length > 0) && (
                                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar">
                                        {DOMAINS.filter(d => d.toLowerCase().includes(domain.toLowerCase())).map(d => (
                                            <div
                                                key={d}
                                                onClick={() => { setDomain(d); setShowDomainDropdown(false); }}
                                                className="px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 cursor-pointer font-mono"
                                            >
                                                {d}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Schedule Toggle */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowScheduler(!showScheduler)}
                                    className={`w-8 h-8 rounded hover:bg-white/5 flex items-center justify-center transition-colors ${scheduledDate ? 'text-indigo-400' : 'text-zinc-500 hover:text-white'}`}
                                    title="Schedule Post"
                                >
                                    <i className="fa-regular fa-calendar-days"></i>
                                </button>

                                {showScheduler && (
                                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-20">
                                        <input
                                            type="datetime-local"
                                            className="bg-black text-white text-xs border border-white/10 rounded p-1"
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            value={scheduledDate}
                                            min={new Date().toISOString().slice(0, 16)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className={`text-xs font-mono transition-colors ${content.length < 20 ? 'text-red-500' : 'text-zinc-600'}`}>
                                {content.length} chars
                            </span>

                            <button
                                onClick={handlePost}
                                disabled={!isReadyToPost || isPosting}
                                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-lg flex items-center gap-2 ${!isReadyToPost ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 hover:scale-105'}`}
                            >
                                {isPosting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (
                                    <>
                                        {scheduledDate ? 'Schedule' : 'Post'}
                                        <i className={`fa-solid ${scheduledDate ? 'fa-clock' : 'fa-paper-plane'}`}></i>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
