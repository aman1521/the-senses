import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import TierBadge from "./TierBadge";
import { likePost, sharePost } from "../services/api";

const FeedItem = ({ item, onQuote }) => {
    const [liked, setLiked] = useState(item.isLiked || false);
    const [likeCount, setLikeCount] = useState(item.likes);

    const toggleLike = async () => {
        // Optimistic UI update
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(c => newLiked ? c + 1 : c - 1);

        try {
            await likePost(item.id || item._id);
        } catch (error) {
            // Revert on failure
            setLiked(!newLiked);
            setLikeCount(c => !newLiked ? c + 1 : c - 1);
            console.error("Failed to like post", error);
        }
    };

    const timeAgo = formatDistanceToNow(item.timestamp, { addSuffix: true });

    return (
        <div className={`glass-panel p-4 animate-fade-in transition-all hover:border-white/10 ${item.isTrending ? 'border-l-2 border-l-indigo-500' : ''}`}>
            {/* Header */}
            <div className="flex gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-lg overflow-hidden ring-1 ring-white/10 relative">
                    {/* Avatar logic */}
                    {item.author?.profilePicture ? (
                        <img src={item.author.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-zinc-400">{item.author?.name?.[0] || '?'}</span>
                    )}

                    {/* Online/Verified Indicator */}
                    {item.author?.verified && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-black rounded-full" title="Verified Thinker"></div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white hover:text-indigo-400 cursor-pointer transition-colors text-[15px]">
                                    {item.author?.name || 'Anonymous'}
                                </span>

                                {/* Cultural Status Badges */}
                                {item.author?.stats?.percentile > 90 && (
                                    <span className="bg-amber-500/10 text-amber-300 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-wide" title="Top 10% Thinker">
                                        Top 10%
                                    </span>
                                )}

                                {/* Post Type Badge */}
                                {item.postType === 'debate' && (
                                    <span className="bg-red-500/10 text-red-400 text-[10px] px-1.5 py-0.5 rounded border border-red-500/20 font-bold uppercase tracking-wide">
                                        <i className="fa-solid fa-gavel mr-1"></i>Debate
                                    </span>
                                )}
                                {item.postType === 'insight' && (
                                    <span className="bg-purple-500/10 text-purple-300 text-[10px] px-1.5 py-0.5 rounded border border-purple-500/20 font-bold uppercase tracking-wide">
                                        <i className="fa-solid fa-lightbulb mr-1"></i>Insight
                                    </span>
                                )}
                            </div>

                            <div className="text-xs text-zinc-400 flex gap-2 items-center">
                                <span>{item.author?.profession || 'Member'}</span>
                                {item.author?.tier && <span className="text-zinc-600">•</span>}
                                {item.author?.tier && <span className="text-zinc-500">{item.author.tier}</span>}

                                {item.domain && (
                                    <>
                                        <span className="text-zinc-600">•</span>
                                        <span className="text-indigo-400 border border-indigo-500/20 px-1 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide">
                                            {item.domain}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Depth Score Indicator (The "Cognitive Depth" Feature) */}
                        {item.depthScore > 0 && (
                            <div className="flex flex-col items-end" title="AI-Verified Depth Score">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Depth</div>
                                <div className={`text-xs font-mono font-bold ${item.depthScore > 80 ? 'text-green-400' : item.depthScore > 50 ? 'text-blue-400' : 'text-zinc-400'}`}>
                                    {item.depthScore}/100
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mb-4 pl-1">
                {/* Debate Stance Banner */}
                {item.postType === 'debate' && item.debateStance && (
                    <div className={`mb-3 flex items-center gap-2 p-2 rounded-lg border ${item.debateStance === 'for' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <div className={`w-1 h-8 rounded-full ${item.debateStance === 'for' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Stance</div>
                            <div className={`text-sm font-bold ${item.debateStance === 'for' ? 'text-green-400' : 'text-red-400'}`}>
                                ARGUES {item.debateStance.toUpperCase()}
                            </div>
                        </div>
                    </div>
                )}

                {item.title && <h4 className="font-bold text-white mb-2 text-lg">{item.title}</h4>}
                <p className="text-sm text-zinc-300 mb-3 leading-relaxed whitespace-pre-wrap font-serif tracking-wide">{item.content}</p>

                {/* Legacy Result Card Support */}
                {item.type === 'result' && item.stats && (
                    <div className="bg-black/40 border border-white/5 rounded-lg p-4 flex items-center justify-between mt-3 group cursor-pointer hover:bg-black/60 transition-colors">
                        <div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Verified Score</div>
                            <div className="text-3xl font-bold text-white font-mono tracking-tight">{item.stats.score}</div>
                        </div>
                        <div className="scale-110 group-hover:scale-125 transition-transform">
                            <TierBadge badge={item.stats.tier} />
                        </div>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3 px-1">
                <div className="flex items-center gap-1">
                    <span className="bg-blue-500 rounded-full p-0.5"><i className="fa-solid fa-thumbs-up text-white text-[8px]"></i></span>
                    <span className="hover:text-blue-400 hover:underline cursor-pointer">{likeCount}</span>
                </div>
                <span className="hover:text-zinc-300 hover:underline cursor-pointer ml-auto">{item.comments} comments</span>
            </div>

            <div className="border-t border-white/5 mb-1"></div>

            {/* Actions */}
            <div className="flex justify-between pt-1">
                <FeedAction label="Like" icon={liked ? <i className="fa-solid fa-heart text-blue-400"></i> : <i className="fa-regular fa-thumbs-up"></i>} active={liked} onClick={toggleLike} />
                <FeedAction label="Comment" icon={<i className="fa-regular fa-comment"></i>} />
                <FeedAction
                    label="Quote"
                    icon={<i className="fa-solid fa-quote-right"></i>}
                    onClick={() => onQuote && onQuote(item)}
                />
                <FeedAction
                    label="Share"
                    icon={<i className="fa-solid fa-share"></i>}
                    onClick={async () => {
                        try {
                            if (window.confirm("Share this post to your feed?")) {
                                await sharePost(item.id || item._id, {});
                                alert("Shared successfully!");
                            }
                        } catch (e) {
                            console.error("Share failed", e);
                        }
                    }}
                />
            </div>
        </div>
    );
};

const FeedAction = ({ label, icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all hover:bg-white/5 ${active ? 'text-blue-400' : 'text-zinc-400 hover:text-zinc-200'}`}
    >
        <span className={active ? "animate-bounce-subtle" : ""}>{icon}</span> {label}
    </button>
);

export default FeedItem;
