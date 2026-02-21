import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { createBubble } from "../services/api";

export const BubbleCreator = ({ originPost, onClose }) => {
    const [topic, setTopic] = useState("");
    const [content, setContent] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createBubble({
                topicLabel: topic,
                originPostContent: originPost.content, // Using origin post content as base
                description: content,
                category: 'general'
            });
            onClose();
            // Optional: Trigger a refresh of the feed or redirect to the new bubble
            // alert("Bubble created successfully!");
        } catch (error) {
            console.error("Failed to create bubble", error);
            alert("Failed to create bubble");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1b1f23] border border-zinc-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h3 className="font-bold text-white"><i className="fa-solid fa-comments mr-2"></i> Start a Thinking Bubble</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition"><i className="fa-solid fa-xmark"></i></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Origin Post Preview */}
                    <div className="bg-zinc-900/50 p-3 rounded border-l-2 border-indigo-500 text-sm text-zinc-400 italic">
                        <i className="fa-solid fa-quote-left mr-2 opacity-50"></i>
                        {originPost.content.substring(0, 100)}...
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Topic Label</label>
                        <input
                            type="text"
                            className="w-full bg-black border border-zinc-700 rounded p-2 text-white focus:border-indigo-500 focus:outline-none"
                            placeholder="e.g., The Ethics of AI in Hiring"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            required
                        />
                        <p className="text-[10px] text-zinc-600 mt-1">This will be the root topic for the discussion tree.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Your Structured Response</label>
                        <textarea
                            className="w-full h-32 bg-black border border-zinc-700 rounded p-2 text-white focus:border-indigo-500 focus:outline-none resize-none"
                            placeholder="Construct a logical argument..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-white text-sm">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-sm transition shadow-lg shadow-indigo-500/20">
                            Launch Bubble
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Enhanced Bubble Node with Repyling \u0026 Mind Map Visuals
export const BubbleNode = ({ node, bubbleId, depth = 0, enableReflection = false, onReplySuccess }) => {
    const isUserNode = node.author === "You" || node.isUser; // Check ownership
    const [expanded, setExpanded] = useState(true);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setIsSubmitting(true);

        try {
            const { createPost } = await import("../services/api");
            await createPost({
                content: replyContent,
                bubbleId: bubbleId, // Passed from parent or tree
                parentPostId: node.postId || node.id, // Support both real and mock
                postType: 'bubble',
                visibility: 'public'
            });

            setIsReplying(false);
            setReplyContent("");
            // Refresh tree if callback provided
            onReplySuccess && onReplySuccess();
        } catch (error) {
            console.error("Reply failed", error);
            alert("Failed to post reply.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`relative ${depth > 0 ? "ml-8" : ""} mb-6`}>
            {/* Thread Line: improved visual connection */}
            {depth > 0 && (
                <div className="absolute -left-4 top-0 bottom-0 w-px bg-zinc-800" />
            )}

            {/* Node Card */}
            <div className={`p-4 rounded-xl border relative transition-all group ${isUserNode
                ? "bg-indigo-900/10 border-indigo-500/30 ring-1 ring-indigo-500/20"
                : depth === 0 ? "bg-zinc-900/50 border-zinc-700 shadow-md" : "bg-black/40 border-zinc-800 hover:border-zinc-700"
                }`}>

                {/* Connector Curve to Parent */}
                {depth > 0 && (
                    <div className="absolute -left-4 top-6 w-4 h-px bg-zinc-800" />
                )}

                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${isUserNode
                            ? "bg-indigo-600 text-white"
                            : "bg-gradient-to-tr from-zinc-700 to-zinc-600 text-zinc-300 border border-zinc-600"
                            }`}>
                            {Array.isArray(node.authorPic) ? <img src={node.authorPic} className="w-full h-full rounded-full" /> :
                                (isUserNode ? <i className="fa-solid fa-user"></i> : (node.author ? node.author[0] : '?'))}
                        </div>

                        {/* Meta */}
                        <div>
                            <span className={`font-bold text-sm ${isUserNode ? "text-indigo-300" : "text-zinc-200"}`}>
                                {node.author}
                            </span>
                            <span className="text-xs text-zinc-500 ml-2 font-mono">
                                {node.timestamp ? formatDistanceToNow(new Date(node.timestamp)) : 'just now'} ago
                            </span>
                        </div>
                    </div>

                    {/* Expand/Collapse Toggle if children exist */}
                    {node.children && node.children.length > 0 && (
                        <button onClick={() => setExpanded(!expanded)} className="text-zinc-500 hover:text-white text-xs">
                            <i className={`fa-solid fa-chevron-${expanded ? 'down' : 'right'}`}></i>
                        </button>
                    )}
                </div>

                {/* Content */}
                <p className="text-zinc-300 text-sm leading-relaxed mb-3 font-serif tracking-wide">
                    {node.content}
                </p>

                {/* Actions Bar */}
                <div className="flex gap-4 text-xs text-zinc-500 border-t border-zinc-800/50 pt-2 mt-2 items-center">
                    <button
                        onClick={() => setIsReplying(!isReplying)}
                        className={`flex items-center gap-1 transition-colors ${isReplying ? 'text-indigo-400' : 'hover:text-indigo-400'}`}
                    >
                        <i className="fa-solid fa-reply"></i> Reply
                    </button>

                    <button className="hover:text-green-400 flex items-center gap-1">
                        <i className="fa-solid fa-arrow-up"></i> {node.upvotes || 0}
                    </button>

                    {/* Depth Indicator */}
                    <span className="ml-auto text-[10px] text-zinc-700 font-mono">
                        L{depth}
                    </span>
                </div>

                {/* Reply Form */}
                {isReplying && (
                    <div className="mt-3 pt-3 border-t border-indigo-500/20 animate-fade-in-down">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full bg-black/50 border border-zinc-700 rounded p-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none h-20 mb-2 font-serif"
                            placeholder={`Reply to ${node.author}...`}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsReplying(false)}
                                className="px-3 py-1 text-xs text-zinc-500 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReply}
                                disabled={isSubmitting || !replyContent.trim()}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded flex items-center gap-1"
                            >
                                {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                                Post Reply
                            </button>
                        </div>
                    </div>
                )}

                {/* 💡 Reflection Mode (User Dashboard Feature) */}
                {enableReflection && isUserNode && (
                    <div className="mt-4 pt-3 border-t border-indigo-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <i className="fa-solid fa-lightbulb text-yellow-400 text-xs"></i>
                            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Reflection Mode</span>
                        </div>
                        <p className="text-xs text-zinc-400 mb-2 italic">"What would you improve in your argument now?"</p>
                        <textarea
                            className="w-full bg-black/40 border border-indigo-500/20 rounded p-2 text-xs text-white focus:border-indigo-500 focus:outline-none resize-none h-16"
                            placeholder="Add a private reflection note..."
                        ></textarea>
                    </div>
                )}
            </div>

            {/* Recursive Children */}
            {expanded && node.children && node.children.length > 0 && (
                <div className="mt-4 relative">
                    {/* Vertical line connector for children group */}
                    <div className="absolute left-[-1rem] top-0 bottom-0 w-px bg-zinc-800/50"></div>
                    {node.children.map(child => (
                        <BubbleNode
                            key={child.id || child._id}
                            node={child}
                            bubbleId={bubbleId}
                            depth={depth + 1}
                            enableReflection={enableReflection}
                            onReplySuccess={onReplySuccess}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const BubbleTree = ({ bubble }) => {
    return (
        <div className="animate-fade-in p-4">
            <div className="mb-6 pb-6 border-b border-zinc-800">
                <h3 className="text-indigo-400 font-bold uppercase text-xs tracking-wider mb-2">
                    <i className="fa-solid fa-comments"></i> Post Bubble: {bubble.topic}
                </h3>
                <h1 className="text-xl font-bold text-white mb-2">{bubble.originPost.title}</h1>
                <p className="text-zinc-400 text-sm italic">Started by {bubble.originPost.author} • {formatDistanceToNow(bubble.originPost.timestamp)} ago</p>
            </div>

            <BubbleNode node={bubble.rootNode} bubbleId={bubble._id || bubble.id} />
        </div>
    );
};
