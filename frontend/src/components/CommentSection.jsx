import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import '../styles/CommentSection.css';

const Comment = ({ comment, allComments, postId, onCommentAdded }) => {
    const [replying, setReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Find children of this comment
    const children = allComments.filter(c => c.parentComment === comment._id);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setSubmitting(true);
        try {
            const backendUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";
            const response = await axios.post(
                `${backendUrl}/api/v1/comment`,
                { postId, content: replyContent, parentCommentId: comment._id },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setReplyContent('');
            setReplying(false);
            if (onCommentAdded) onCommentAdded(response.data.comment);
        } catch (error) {
            console.error('Error posting reply:', error);
            alert('Failed to post reply');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="comment-item-wrapper">
            <div className="comment-item">
                <img
                    src={comment.user?.profilePicture || '/default-avatar.png'}
                    alt={comment.user?.name}
                    className="comment-avatar"
                />
                <div className="comment-content-wrapper">
                    <div className="comment-content">
                        <div className="comment-author">
                            <span className="comment-name">
                                {comment.user?.name}
                                {comment.user?.verified && <i className="fas fa-check-circle verified-icon"></i>}
                            </span>
                            <span className="comment-time">
                                {formatDistanceToNow(new Date(comment.createdAt))} ago
                            </span>
                        </div>
                        <p className="comment-text">{comment.content}</p>
                    </div>
                    <div className="comment-actions">
                        <button onClick={() => setReplying(!replying)} className="reply-btn">
                            <i className="fas fa-reply"></i> Reply
                        </button>
                    </div>
                </div>
            </div>

            {replying && (
                <form onSubmit={handleReply} className="comment-input-form reply-form">
                    <input
                        type="text"
                        placeholder={`Reply to ${comment.user?.name}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        disabled={submitting}
                        autoFocus
                    />
                    <button type="submit" disabled={submitting || !replyContent.trim()}>
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
            )}

            {children.length > 0 && (
                <div className="comment-replies">
                    {children.map(child => (
                        <Comment
                            key={child._id}
                            comment={child}
                            allComments={allComments}
                            postId={postId}
                            onCommentAdded={onCommentAdded}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CommentSection = ({ postId, onCommentAdded }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            const backendUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";
            const response = await axios.get(`${backendUrl}/api/v1/comments/${postId}`);
            setComments(response.data.comments || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const backendUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";
            const response = await axios.post(
                `${backendUrl}/api/v1/comment`,
                { postId, content: newComment },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            setComments([...comments, response.data.comment]);
            setNewComment('');
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChildCommentAdded = (newChildComment) => {
        if (newChildComment) {
            setComments([...comments, newChildComment]);
        } else {
            fetchComments();
        }
        if (onCommentAdded) onCommentAdded();
    };

    // Extract only top-level comments to start the recursion
    const topLevelComments = comments.filter(c => !c.parentComment);

    return (
        <div className="comment-section">
            <h4 className="comment-header">Comments</h4>

            <form onSubmit={handleSubmit} className="comment-input-form">
                <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={submitting}
                />
                <button type="submit" disabled={submitting || !newComment.trim()}>
                    <i className="fas fa-paper-plane"></i>
                </button>
            </form>

            {loading ? (
                <div className="comment-loading">Loading comments...</div>
            ) : topLevelComments.length > 0 ? (
                <div className="comment-list">
                    {topLevelComments.map((comment) => (
                        <Comment
                            key={comment._id}
                            comment={comment}
                            allComments={comments}
                            postId={postId}
                            onCommentAdded={handleChildCommentAdded}
                        />
                    ))}
                </div>
            ) : (
                <div className="no-comments">No comments yet. Start the conversation!</div>
            )}
        </div>
    );
};

export default CommentSection;
