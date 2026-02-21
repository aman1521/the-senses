import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import UserAvatar from "../components/UserAvatar";
import TierBadge from "../components/TierBadge";
import FeedItem from "../components/FeedItem";
import { BubbleCreator } from "../components/BubbleComponents";
import { getSocialFeed, createPost } from "../services/api";
import CreatePostModal from "../components/CreatePostModal";
import "./Home.css";

function Home() {
  const token = localStorage.getItem("token");

  // If not logged in, return the existing Landing Page
  if (!token) return <LandingPage />;

  return <FeedPage />;
}

// --- The "LinkedIn" Feed Experience ---
function FeedPage() {
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [quotingPost, setQuotingPost] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false); // Can be removed later if unused

  // Legacy state for simple post, might clean up later
  const [newPostContent, setNewPostContent] = useState("");
  const [postType, setPostType] = useState('insight');
  const [debateStance, setDebateStance] = useState('for');

  const user = {
    name: localStorage.getItem("userName") || "User",
    profileType: localStorage.getItem("userProfileType") || "Member",
    role: localStorage.getItem("userRole") || "user"
  };

  useEffect(() => {
    // Fetch User Stats for Profile Card
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/dashboard/stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setUserStats(data.stats);
        }
      } catch (e) {
        console.error("Failed to fetch user stats", e);
      }
    };
    fetchUserStats();

    // 1. Fetch Real Social Feed and Market Updates
    const fetchFeed = async () => {
      try {
        setLoading(true);
        // Fetch social feed from backend
        const socialRes = await getSocialFeed({ limit: 20 });
        const socialPosts = socialRes.data?.posts || [];

        // Format backend social posts to match FeedItem structure if needed
        const formattedSocialPosts = socialPosts.map(post => ({
          id: post._id,
          type: post.postType === 'bubble' ? 'bubble_start' : 'post',
          user: post.author?.name || post.author?.username || "Anonymous",
          role: post.author?.profession || "Member",
          content: post.content,
          likes: post.engagement?.likes || 0,
          comments: post.engagement?.comments || 0,
          timestamp: new Date(post.createdAt).getTime(),
          isLiked: post.isLiked,
          // map other fields
          postType: post.postType,
          debateStance: post.debateStance,
          depthScore: post.depthScore,
          intent: post.intent,
          domain: post.domain,
          author: post.author, // Pass full author for badges
          stats: post.postType === 'result' ? post.stats : null,
          isTrending: false // or calculate based on likes/views
        }));

        setFeedItems(formattedSocialPosts);
      } catch (e) {
        console.error("Feed Error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    try {
      setIsPosting(true);
      const res = await createPost({
        content: newPostContent,
        visibility: 'public',
        type: postType,
        debateStance: postType === 'debate' ? debateStance : null
      });

      if (res.data?.success) {
        setNewPostContent("");
        // Optimistically add to feed
        // API response might be normalized (res.data = post) or raw (res.data.post = post)
        const newPost = res.data.data || res.data.post || res.data;

        if (!newPost || !newPost._id) {
          console.error("Invalid post data", res.data);
          return;
        }
        setFeedItems(prev => [{
          id: newPost._id,
          type: 'post',
          author: {
            name: user.name,
            profession: user.profileType,
            // fallback for other fields
            stats: { percentile: 0 }
          },
          role: user.profileType, // or fetch detailed role
          content: newPost.content,
          likes: 0,
          comments: 0,
          timestamp: Date.now(),
          comments: 0,
          timestamp: Date.now(),
          isLiked: false,
          postType: newPost.postType,
          debateStance: newPost.debateStance,
          depthScore: newPost.depthScore
        }, ...prev]);
      }
    } catch (err) {
      console.error("Failed to create post", err);
      // alert("Failed to post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreatePost();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* --- LEFT SIDEBAR (Enhanced Profile Card) --- */}
        <div className="hidden md:block md:col-span-3 space-y-4">

          {/* Company Admin Logic */}
          {(user.role === 'company_admin' || user.role === 'admin') && (
            <div className="glass-panel p-4 border-l-4 border-indigo-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl group-hover:scale-110 transition-transform"><i className="fa-solid fa-building-user"></i></div>
              <h3 className="font-bold text-white mb-1 relative z-10">Company Access</h3>
              <p className="text-xs text-zinc-400 mb-4 relative z-10">Manage your organization's reputation and hiring pipeline.</p>
              <button onClick={() => navigate('/company')} className="w-full py-2 bg-indigo-600 rounded text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all relative z-10">
                Enter Portal <i className="fa-solid fa-arrow-right ml-1"></i>
              </button>
            </div>
          )}

          <div className="glass-panel sticky top-24">
            {/* Banner */}
            <div className="h-16 bg-gradient-to-r from-indigo-900 via-purple-900 to-black rounded-t-xl"></div>

            {/* Profile Info */}
            <div className="px-4 pb-4 -mt-8 text-center">
              <div className="inline-block p-1 bg-black rounded-full mb-3 ring-2 ring-black">
                <UserAvatar name={user.name} size={72} />
              </div>
              <h3 className="font-bold text-xl hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => navigate("/details")}>
                {user.name}
              </h3>
              <p className="text-zinc-400 text-sm mb-4 capitalize font-medium">{user.profileType.replace(/-/g, " ")}</p>

              {/* Stats Row */}
              {userStats && (
                <div className="grid grid-cols-3 gap-2 my-4 text-center">
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="text-lg font-bold text-indigo-400">{userStats.bestScore || 0}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Best</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="text-lg font-bold text-white">{userStats.totalTests || 0}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Tests</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="text-lg font-bold text-emerald-400">{userStats.currentTier || "N/A"}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Tier</div>
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 my-4"></div>

              <div className="flex justify-between text-sm text-zinc-400 mb-2 hover:bg-white/5 p-2 rounded cursor-pointer transition-colors">
                <span>Average Score</span>
                <span className="text-indigo-400 font-bold">{userStats?.averageScore || 0}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400 hover:bg-white/5 p-2 rounded cursor-pointer transition-colors">
                <span>Percentile</span>
                <span className="text-white font-bold">{userStats?.percentile || 0}%</span>
              </div>

              <div className="border-t border-white/10 my-4"></div>

              <div className="text-left">
                <div className="text-xs font-bold text-zinc-500 uppercase mb-2">Shortcuts</div>
                <Link to="/leaderboard" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white mb-2 p-1 rounded hover:bg-white/5">
                  <span><i className="fa-solid fa-trophy"></i></span> Leaderboard
                </Link>
                <Link to="/duel" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white mb-2 p-1 rounded hover:bg-white/5">
                  <span><i className="fa-solid fa-swords"></i></span> Duel Arena
                </Link>
                <Link to="/profile-selection" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white mb-2 p-1 rounded hover:bg-white/5">
                  <span><i className="fa-solid fa-clipboard-check"></i></span> Take Test
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* --- CENTER FEED --- */}
        <div className="col-span-12 md:col-span-6 space-y-4">

          {/* "Start a Post" Trigger */}
          <div className="glass-panel p-4 mb-4">
            <div className="flex gap-3">
              <UserAvatar name={user.name} size={48} />
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex-1 text-left px-5 py-3 bg-white/5 border border-white/10 rounded-full text-zinc-400 hover:bg-white/10 transition-all font-medium text-sm hover:border-white/20"
              >
                Start a cognitive thread...
              </button>
            </div>
            <div className="flex justify-between items-center px-4 mt-3 pt-3 border-t border-white/5">
              <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors">
                <i className="fa-regular fa-image text-blue-400"></i> Media
              </button>
              <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors">
                <i className="fa-solid fa-calendar-days text-amber-400"></i> Event
              </button>
              <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors">
                <i className="fa-solid fa-newspaper text-red-400"></i> Article
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 px-2 my-2">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></span>
            <span className="px-3 font-medium">Live Intelligence Feed</span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></span>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="glass-panel p-8 text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-zinc-500 animate-pulse">Synchronizing neural feed...</p>
            </div>
          )}

          {/* Feed Items */}
          {!loading && feedItems.map((item) => (
            <FeedItem key={item.id} item={item} onQuote={setQuotingPost} />
          ))}

        </div>

        {/* --- RIGHT SIDEBAR (Trending) --- */}
        <div className="hidden md:block md:col-span-3 space-y-4">
          <div className="glass-panel sticky top-24 p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white">The Senses News</h3>
              <span className="text-zinc-600 text-xs bg-white/5 px-2 py-1 rounded">LIVE</span>
            </div>

            <div className="space-y-6">
              <NewsItem headline="AI Proctoring now live" time="1d ago" readers="14,023 readers" rank={1} />
              <NewsItem headline="Global IQ averages rise" time="12h ago" readers="5,202 readers" rank={2} />
              <NewsItem headline="Top 5 Cognitive Biases" time="3h ago" readers="2,109 readers" rank={3} />
            </div>

            <button className="w-full mt-6 py-2 text-sm text-zinc-400 hover:text-white rounded hover:bg-white/5 transition-colors flex items-center justify-center gap-1">
              Show more <i className="fa-solid fa-chevron-down"></i>
            </button>
          </div>

          <div className="glass-panel sticky top-[400px] p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform"><i className="fa-solid fa-graduation-cap"></i></div>
            <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-bold">Recommended</div>

            <div className="mb-4">
              <h4 className="text-white font-bold text-lg leading-tight mb-2">Get Verified</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Stand out to recruiters. 70% of hiring managers prioritize cognitive verifications.
              </p>
            </div>

            <button
              onClick={() => navigate("/test")}
              className="w-full py-2 border border-indigo-500/50 text-indigo-300 rounded-lg hover:bg-indigo-500/10 text-sm font-bold transition-all shadow-lg hover:shadow-indigo-500/20"
            >
              Take Assessment
            </button>
          </div>

          <div className="text-center text-[10px] text-zinc-600 px-4 pt-4 leading-loose">
            <span className="hover:text-zinc-400 cursor-pointer mx-1">About</span>
            <span className="hover:text-zinc-400 cursor-pointer mx-1">Accessibility</span>
            <span className="hover:text-zinc-400 cursor-pointer mx-1">Help Center</span>
            <span className="hover:text-zinc-400 cursor-pointer mx-1">Privacy & Terms</span>
            <div className="mt-2 text-zinc-700">The Senses Corporation © 2026</div>
          </div>
        </div>

      </div>

      {quotingPost && (
        <BubbleCreator
          originPost={quotingPost}
          onClose={() => setQuotingPost(null)}
        />
      )}

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        user={user}
        onPostCreated={(newPost) => {
          setFeedItems(prev => [{
            id: newPost._id,
            type: 'post',
            author: {
              name: user.name,
              profession: user.profileType,
              verified: userStats?.verified, // Pass verified if available
              stats: { percentile: userStats?.percentile }
            },
            role: user.profileType,
            content: newPost.content,
            likes: 0,
            comments: 0,
            timestamp: Date.now(),
            isLiked: false,
            postType: newPost.postType,
            debateStance: newPost.debateStance,
            depthScore: newPost.depthScore,
            intent: newPost.intent, // Pass intent to FeedItem if needed
            domain: newPost.domain
          }, ...prev]);
        }}
      />
    </div>
  );
}



function NewsItem({ headline, time, readers, rank }) {
  return (
    <div className="cursor-pointer group flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors">
      <span className="text-zinc-600 font-bold text-sm mt-0.5">#{rank}</span>
      <div>
        <div className="text-sm font-medium text-zinc-200 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">{headline}</div>
        <div className="text-[10px] text-zinc-500 mt-1">{time} • <span className="text-zinc-600">{readers}</span></div>
      </div>
    </div>
  );
}

// --- Modified Landing Page (For Guests) - Updates to match user expectation ---
function LandingPage() {
  const canvasRef = useRef(null);
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 1247,
    totalTests: 3891,
    verifiedUsers: 423,
    eliteUsers: 187
  });

  useEffect(() => {
    // Fetch platform statistics for social proof
    const fetchPlatformStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/public/stats`);
        const data = await res.json();
        if (data.success && data.stats) {
          setPlatformStats(data.stats);
        }
      } catch (error) {
        console.log("Using default stats");
      }
    };
    fetchPlatformStats();

    // Neural Network Animation Background
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Nodes
    const nodes = [];
    const numNodes = 60;

    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";

      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();

        // Connections
        nodes.forEach(other => {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.lineWidth = 1 - (dist / 150);
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, []);

  return (
    <div className="home-container">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-30" />

      <div className="hero-content z-10">
        <div className="badge-pill mb-4 animate-fade-in-up">The Future of Cognitive Analytics</div>
        <h1 className="hero-title animate-fade-in-up delay-100">THE SENSES</h1>
        <p className="hero-subtitle animate-fade-in-up delay-200">
          The Senses turns thinking ability into social proof.
        </p>

        {/* Social Proof Badge */}
        <div className="flex items-center justify-center gap-6 mb-6 animate-fade-in-up delay-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <i className="fa-solid fa-users text-indigo-400"></i>
            <span className="text-white font-bold">{platformStats.totalUsers.toLocaleString()}+</span>
            <span className="text-zinc-400 text-sm">users tested</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <i className="fa-solid fa-certificate text-emerald-400"></i>
            <span className="text-white font-bold">{platformStats.verifiedUsers.toLocaleString()}+</span>
            <span className="text-zinc-400 text-sm">verified</span>
          </div>
        </div>

        <div className="cta-group animate-fade-in-up delay-300">
          <Link to="/login" className="btn-primary-large glow-effect">
            Connect / Login
          </Link>
          <Link to="/leaderboard" className="btn-secondary-large">
            Global Leaderboard
          </Link>
        </div>

        {/* ADDED: Explicit hint about the feed */}
        <p className="mt-6 text-sm text-zinc-500 animate-fade-in-up delay-500">
          <i className="fa-solid fa-unlock"></i> Log in to access the Professional Intelligence Feed
        </p>
      </div>

      <div className="features-grid z-10 animate-fade-in-up delay-500">
        <div className="feature-card">
          <div className="feature-icon"><i className="fa-solid fa-brain"></i></div>
          <h3>Adaptive Intelligence</h3>
          <p>Dynamic difficulty that scales with your cognitive output in real-time.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><i className="fa-solid fa-swords"></i></div>
          <h3>PvP Duels</h3>
          <p>Challenge other users to direct cognitive battles in the Arena.</p>
          <Link to="/duel" className="text-blue-400 text-sm mt-2 hover:underline">Enter Arena →</Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><i className="fa-solid fa-robot"></i></div>
          <h3>AI Benchmarks</h3>
          <p>Watch Titans like GPT-4 and Claude 3.5 clash in simulated environments.</p>
          <Link to="/ai-battle" className="text-purple-400 text-sm mt-2 hover:underline">Watch Simulation →</Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><i className="fa-solid fa-lock"></i></div>
          <h3>Verified Profiles</h3>
          <p>Build your reputation with our Trust Score anti-cheat verification system.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
