const mongoose = require("mongoose");

const UserProfileSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, unique: true },

        stats: {
            attempts: { type: Number, default: 0 },
            bestScore: { type: Number, default: 0 },
            avgScore: { type: Number, default: 0 },
            bestNormalized: { type: Number, default: 0 },
            avgTrust: { type: Number, default: 0 },
        },

        badges: [String],

        progression: [
            {
                finalScore: Number,
                normalizedScore: Number,
                trustScore: Number,
                difficulty: String,
                createdAt: Date,
            },
        ],
    },
    { timestamps: true }
);

const UserProfileModel = mongoose.model("UserProfile", UserProfileSchema);

const SimpleDB = require('../utils/SimpleDB');
const UserProfileMock = new SimpleDB('user_profiles');

module.exports = new Proxy(UserProfileModel, {
    get: function (target, prop) {
        if (global.USE_MOCK_DB) {
            if (prop === 'find') return (query) => UserProfileMock.find(query);
            if (prop === 'findOne') return (query) => UserProfileMock.findOne(query);
            if (prop === 'findById') return (id) => UserProfileMock.findById(id);
            if (prop === 'create') return (doc) => UserProfileMock.create(doc);
            if (prop === 'findOneAndUpdate') return (query, update, opts) => UserProfileMock.findOne(query).then(async doc => {
                if (doc) {
                    const updated = { ...doc, ...(update.$set || {}) }; // simplistic support
                    if (update.$inc) {
                        for (let k in update.$inc) {
                            const parts = k.split('.');
                            if (parts.length === 2) {
                                if (!updated[parts[0]]) updated[parts[0]] = {};
                                updated[parts[0]][parts[1]] = (updated[parts[0]][parts[1]] || 0) + update.$inc[k];
                            } else {
                                updated[k] = (updated[k] || 0) + update.$inc[k];
                            }
                        }
                    }
                    if (update.$push) {
                        for (let k in update.$push) {
                            if (Array.isArray(updated[k])) {
                                updated[k].push(update.$push[k]);
                            } else {
                                updated[k] = [update.$push[k]];
                            }
                        }
                    }
                    const index = UserProfileMock.data.findIndex(i => i._id === doc._id);
                    if (index !== -1) {
                        UserProfileMock.data[index] = updated;
                        UserProfileMock.saveFile();
                        return updated;
                    }
                } else if (opts?.upsert) {
                    const created = await UserProfileMock.create({ ...query, ...(update.$set || {}) });
                    return created;
                }
                return null;
            });
        }
        return target[prop];
    },
    construct: function (target, [doc]) {
        if (global.USE_MOCK_DB) {
            const instance = { ...doc };
            instance.save = async function () {
                const saved = await UserProfileMock.create(this);
                Object.assign(this, saved);
                return this;
            };
            return instance;
        }
        return new target(doc);
    }
});
