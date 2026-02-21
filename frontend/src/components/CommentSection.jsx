import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import '../styles/CommentSection.css';

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
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/comments/${postId}`);
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
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/comment`,
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
            ) : comments.length > 0 ? (
                <div className="comment-list">
                    {comments.map((comment) => (
                        <div key={comment._id} className="comment-item">
                            <img
                                src={comment.user?.profilePicture || '/default-avatar.png'}
                                alt={comment.user?.name}
                                className="comment-avatar"
                            />
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
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-comments">No comments yet. Start the conversation!</div>
            )}
        </div>
    );
};

export default CommentSection;
