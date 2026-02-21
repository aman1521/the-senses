import { API } from './api';

export const getConversations = () =>
    API.get('/api/v1/messages/conversations');

export const getMessages = (conversationId) =>
    API.get(`/api/v1/messages/messages/${conversationId}`);

export const sendMessage = (data) =>
    API.post('/api/v1/messages/send', data);

export const markAsRead = (conversationId) =>
    API.put('/api/v1/messages/read', { conversationId });
