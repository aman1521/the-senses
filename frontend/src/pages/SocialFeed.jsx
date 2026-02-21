import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import '../styles/SocialFeed.css';
import CommentSection from '../components/CommentSection';

const SocialFeed = () => {
    const [posts, setPosts] = useState([]);
    const [trendingBubbles, setTrendingBubbles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('feed'); // feed, trending, bubbles
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [showCreateBubble, setShowCreateBubble] = useState(false);
    const [expandedComments, setExpandedComments] = useState({});

    // Post creation state
    const [newPost, setNewPost] = useState({
        content: '',
        category: 'general',
        tags: '',
        visibility: 'public',
    });
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaUrl, setMediaUrl] = useState('');
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // Bubble creation state
    const [newBubble, setNewBubble] = useState({
        topicLabel: '',
        description: '',
        originPostContent: '',
        category: 'general',
        tags: '',
    });

    useEffect(() => {
        fetchFeed();
        fetchTrendingBubbles();
    }, []);

    const fetchFeed = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/bubbles/feed`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setPosts(response.data.data.posts);
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendingBubbles = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/bubbles/trending`);
            setTrendingBubbles(response.data.data.bubbles);
        } catch (error) {
            console.error('Error fetching trending bubbles:', error);
        }
    };

    const toggleComments = (postId) => {
        setExpandedComments((prev) => ({
            ...prev,
            [postId]: !prev[postId],
        }));
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingMedia(true);
        const formData = new FormData();
        formData.append('media', file);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            setMediaUrl(response.data.url);
        } catch (error) {
            console.error('Upload Error:', error);
            alert('Failed to upload media. Check file size and type.');
        } finally {
            setUploadingMedia(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            let mediaUrls = mediaUrl ? [mediaUrl] : [];
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/bubbles/posts`,
                {
                    ...newPost,
                    media: mediaUrls,
                    tags: newPost.tags ? newPost.tags.split(',').map((t) => t.trim()) : [],
                },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                }
            );

            setPosts([response.data.data, ...posts]);
            setNewPost({ content: '', category: 'general', tags: '', visibility: 'public' });
            setMediaFile(null);
            setMediaUrl('');
            setShowCreatePost(false);
        } catch (error) {
            console.error('Error creating post:', error);
            alert(error.response?.data?.message || 'Failed to create post');
        }
    };

    const handleCreateBubble = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/bubbles`,
                {
                    ...newBubble,
                    tags: newBubble.tags ? newBubble.tags.split(',').map((t) => t.trim()) : [],
                },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                }
            );

            setTrendingBubbles([response.data.data, ...trendingBubbles]);
            setNewBubble({
                topicLabel: '',
                description: '',
                originPostContent: '',
                category: 'general',
                tags: '',
            });
            setShowCreateBubble(false);
        } catch (error) {
            console.error('Error creating bubble:', error);
            alert(error.response?.data?.message || 'Failed to create bubble');
        }
    };

    const handleLikePost = async (postId) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/bubbles/posts/${postId}/like`,
                {},
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                }
            );

            // Update local state
            setPosts(
                posts.map((post) =>
                    post._id === postId
                        ? {
                            ...post,
                            engagement: { ...post.engagement, likes: response.data.data.likeCount },
                            isLiked: response.data.data.liked,
                        }
                        : post
                )
            );
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleSharePost = async (postId) => {
        const shareNote = prompt('Add a note to your share (optional):');
        if (shareNote === null) return; // Cancelled

        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/bubbles/posts/${postId}/share`,
                { shareNote, visibility: 'public' },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                }
            );

            alert('Post shared successfully!');
            fetchFeed(); // Refresh to show the shared post
        } catch (error) {
            console.error('Error sharing post:', error);
            alert('Failed to share post');
        }
    };

    const renderPost = (post) => (
        <div key={post._id} className="post-card">
            {/* Post Header */}
            <div className="post-header">
                <img
                    src={post.author?.profilePicture || '/default-avatar.png'}
                    alt={post.author?.name}
                    className="post-avatar"
                />
                <div className="post-author-info">
                    <div className="post-author-name">
                        {post.author?.name}
                        {post.author?.verified && (
                            <i className="fas fa-check-circle verified-icon"></i>
                        )}
                    </div>
                    <div className="post-meta">
                        @{post.author?.username} · {formatDistanceToNow(new Date(post.createdAt))} ago
                        {post.author?.globalThinkingScore > 0 && (
                            <span className="thinking-score">
                                <i className="fas fa-brain"></i> {post.author.globalThinkingScore}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Shared Post Indicator */}
            {post.postType === 'share' && post.sharedFrom && (
                <div className="shared-indicator">
                    <i className="fas fa-retweet"></i> Shared
                </div>
            )}

            {/* Post Content */}
            <div className="post-content">
                <p>{post.content}</p>

                {/* Media rendering */}
                {post.media && post.media.length > 0 && (
                    <div className="post-media" style={{ marginTop: '10px' }}>
                        {post.media.map((url, idx) => {
                            if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null || url.includes('image/upload')) {
                                return <img key={idx} src={url} alt="post media" style={{ maxWidth: '100%', borderRadius: '12px' }} />;
                            } else if (url.match(/\.(mp4|webm|mov)$/i) != null || url.includes('video/upload')) {
                                return <video key={idx} src={url} controls style={{ maxWidth: '100%', borderRadius: '12px' }} />;
                            }
                            return <a key={idx} href={url} target="_blank" rel="noopener noreferrer">Attachment</a>;
                        })}
                    </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="post-tags">
                        {post.tags.map((tag, idx) => (
                            <span key={idx} className="post-tag">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Category Badge */}
                {post.category && post.category !== 'general' && (
                    <span className="category-badge">{post.category}</span>
                )}
            </div>

            {/* Shared/Quoted Post Preview */}
            {post.sharedFrom && (
                <div className="quoted-post">
                    <div className="quoted-post-header">
                        <img
                            src={post.sharedFrom.author?.profilePicture || '/default-avatar.png'}
                            alt={post.sharedFrom.author?.name}
                            className="quoted-avatar"
                        />
                        <span className="quoted-author">@{post.sharedFrom.author?.username}</span>
                    </div>
                    <p className="quoted-content">{post.sharedFrom.content}</p>
                </div>
            )}

            {/* Post Actions */}
            <div className="post-actions">
                <button
                    className={`action-btn ${post.isLiked ? 'liked' : ''}`}
                    onClick={() => handleLikePost(post._id)}
                >
                    <i className={`${post.isLiked ? 'fas' : 'far'} fa-heart`}></i>
                    {post.engagement?.likes || 0}
                </button>
                <button className="action-btn" onClick={() => toggleComments(post._id)}>
                    <i className="far fa-comment"></i>
                    {post.engagement?.comments || 0}
                </button>
                <button className="action-btn" onClick={() => handleSharePost(post._id)}>
                    <i className="fas fa-share"></i>
                    {post.engagement?.shares || 0}
                </button>
                <button className="action-btn">
                    <i className="far fa-eye"></i>
                    {post.engagement?.views || 0}
                </button>
            </div>

            {/* Comment Section */}
            {expandedComments[post._id] && (
                <CommentSection
                    postId={post._id}
                    onCommentAdded={() => {
                        setPosts(
                            posts.map((p) =>
                                p._id === post._id
                                    ? {
                                        ...p,
                                        engagement: {
                                            ...p.engagement,
                                            comments: (p.engagement?.comments || 0) + 1,
                                        },
                                    }
                                    : p
                            )
                        );
                    }}
                />
            )}
        </div>
    );

    const renderBubbleCard = (bubble) => (
        <div key={bubble._id} className="bubble-card">
            <div className="bubble-header">
                <i className="fas fa-comments bubble-icon"></i>
                <h3>{bubble.topicLabel}</h3>
                {bubble.isFeatured && <span className="featured-badge">Featured</span>}
            </div>

            {bubble.description && <p className="bubble-description">{bubble.description}</p>}

            <div className="bubble-stats">
                <span>
                    <i className="fas fa-users"></i> {bubble.participantCount} participants
                </span>
                <span>
                    <i className="fas fa-comment-dots"></i> {bubble.postCount} posts
                </span>
                <span>
                    <i className="fas fa-fire"></i> {bubble.trendingScore} trending
                </span>
            </div>

            {bubble.tags && bubble.tags.length > 0 && (
                <div className="bubble-tags">
                    {bubble.tags.map((tag, idx) => (
                        <span key={idx} className="bubble-tag">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <button className="join-bubble-btn">
                <i className="fas fa-sign-in-alt"></i> Join Discussion
            </button>
        </div>
    );

    return (
        <div className="social-feed-page">
            {/* Header */}
            <div className="feed-header">
                <h1>
                    <i className="fas fa-newspaper"></i> Social Feed
                </h1>
                <div className="header-actions">
                    <button className="create-btn" onClick={() => setShowCreatePost(true)}>
                        <i className="fas fa-plus"></i> Create Post
                    </button>
                    <button className="create-btn bubble" onClick={() => setShowCreateBubble(true)}>
                        <i className="fas fa-comments"></i> Start Bubble
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="feed-tabs">
                <button
                    className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('feed')}
                >
                    <i className="fas fa-stream"></i> Feed
                </button>
                <button
                    className={`tab-btn ${activeTab === 'trending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trending')}
                >
                    <i className="fas fa-fire"></i> Trending Bubbles
                </button>
            </div>

            {/* Content */}
            <div className="feed-content">
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading...</p>
                    </div>
                ) : activeTab === 'feed' ? (
                    <div className="posts-container">
                        {posts.length > 0 ? (
                            posts.map(renderPost)
                        ) : (
                            <div className="empty-state">
                                <i className="fas fa-inbox"></i>
                                <p>No posts yet. Be the first to share!</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bubbles-container">
                        {trendingBubbles.length > 0 ? (
                            trendingBubbles.map(renderBubbleCard)
                        ) : (
                            <div className="empty-state">
                                <i className="fas fa-comments"></i>
                                <p>No trending bubbles yet. Start one!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Post Modal */}
            {showCreatePost && (
                <div className="modal-overlay" onClick={() => setShowCreatePost(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <i className="fas fa-edit"></i> Create Post
                            </h2>
                            <button className="close-btn" onClick={() => setShowCreatePost(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleCreatePost} className="create-post-form">
                            <textarea
                                placeholder="What's on your mind?"
                                value={newPost.content}
                                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                required
                                minLength={10}
                                maxLength={5000}
                            ></textarea>

                            <div className="form-row">
                                <select
                                    value={newPost.category}
                                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                                >
                                    <option value="general">General</option>
                                    <option value="career">Career</option>
                                    <option value="learning">Learning</option>
                                    <option value="ai">AI</option>
                                    <option value="technology">Technology</option>
                                    <option value="philosophy">Philosophy</option>
                                    <option value="other">Other</option>
                                </select>

                                <select
                                    value={newPost.visibility}
                                    onChange={(e) => setNewPost({ ...newPost, visibility: e.target.value })}
                                >
                                    <option value="public">Public</option>
                                    <option value="connections">Connections Only</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>

                            <input
                                type="text"
                                placeholder="Tags (comma-separated)"
                                value={newPost.tags}
                                onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                            />

                            <div className="media-upload-section" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '5px', fontSize: '14px' }}>
                                    <i className="fas fa-image"></i> Add Media
                                    <input type="file" onChange={handleFileUpload} accept="image/*,video/*" style={{ display: 'none' }} />
                                </label>
                                {uploadingMedia && <span className="spinner" style={{ width: '20px', height: '20px' }}></span>}
                                {mediaUrl && <span style={{ color: 'green', fontSize: '12px' }}><i className="fas fa-check-circle"></i> Uploaded!</span>}
                            </div>

                            <button type="submit" className="submit-btn" disabled={uploadingMedia}>
                                <i className="fas fa-paper-plane"></i> Post
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Bubble Modal */}
            {showCreateBubble && (
                <div className="modal-overlay" onClick={() => setShowCreateBubble(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <i className="fas fa-comments"></i> Start a Thinking Bubble
                            </h2>
                            <button className="close-btn" onClick={() => setShowCreateBubble(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleCreateBubble} className="create-bubble-form">
                            <input
                                type="text"
                                placeholder="Bubble Topic (e.g., The Ethics of AI in Hiring)"
                                value={newBubble.topicLabel}
                                onChange={(e) => setNewBubble({ ...newBubble, topicLabel: e.target.value })}
                                required
                                minLength={5}
                                maxLength={200}
                            />

                            <textarea
                                placeholder="Description (optional)"
                                value={newBubble.description}
                                onChange={(e) => setNewBubble({ ...newBubble, description: e.target.value })}
                                maxLength={500}
                            ></textarea>

                            <textarea
                                placeholder="Your opening argument/thought..."
                                value={newBubble.originPostContent}
                                onChange={(e) =>
                                    setNewBubble({ ...newBubble, originPostContent: e.target.value })
                                }
                                required
                                minLength={10}
                                maxLength={5000}
                            ></textarea>

                            <div className="form-row">
                                <select
                                    value={newBubble.category}
                                    onChange={(e) => setNewBubble({ ...newBubble, category: e.target.value })}
                                >
                                    <option value="general">General</option>
                                    <option value="career">Career</option>
                                    <option value="learning">Learning</option>
                                    <option value="ai">AI</option>
                                    <option value="technology">Technology</option>
                                    <option value="philosophy">Philosophy</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <input
                                type="text"
                                placeholder="Tags (comma-separated)"
                                value={newBubble.tags}
                                onChange={(e) => setNewBubble({ ...newBubble, tags: e.target.value })}
                            />

                            <button type="submit" className="submit-btn">
                                <i className="fas fa-rocket"></i> Launch Bubble
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialFeed;
