const mongoose = require('mongoose');

const marketUpdateSchema = new mongoose.Schema({
    title: { type: String, required: true },
    summary: { type: String, required: true },
    content: String,

    // Who is this for?
    targetProfileTypes: [{ type: String, index: true }], // e.g. ['marketing-manager', 'software-engineer']
    targetCategories: [{ type: String, index: true }], // e.g. ['Technology', 'Business']

    type: {
        type: String,
        enum: ['tool_launch', 'industry_trend', 'news', 'research'],
        default: 'news'
    },

    source: String, // e.g. "TechCrunch"
    url: String,
    imageUrl: String,

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MarketUpdate', marketUpdateSchema);
