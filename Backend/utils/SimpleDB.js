const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SimpleDB {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.filePath = path.join(__dirname, '..', 'data', `${collectionName}.json`);
        this.data = [];
        this.load();
    }

    load() {
        try {
            if (!fs.existsSync(path.dirname(this.filePath))) {
                fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
            }
            if (fs.existsSync(this.filePath)) {
                this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
            } else {
                this.data = [];
                this.saveFile();
            }
        } catch (err) {
            console.error(`Error loading DB ${this.collectionName}:`, err);
            this.data = [];
        }
    }

    saveFile() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
        } catch (err) {
            console.error(`Error saving DB ${this.collectionName}:`, err);
        }
    }

    // Mongoose-like static methods
    find(query = {}) {
        this.load();
        let results = this.data.filter(item => this._matches(item, query));
        return this._wrapCursor(results);
    }

    findOne(query = {}) {
        this.load();
        const item = this.data.find(item => this._matches(item, query));
        const wrapped = item ? this._wrapInstance(item) : null;
        // make it chainable
        return this._wrapCursor(wrapped ? [wrapped] : [], true);
    }

    async findById(id) {
        this.load();
        // Handle MongoDB ObjectId or String ID
        const targetId = id.toString();
        const item = this.data.find(i => i._id.toString() === targetId || i.id === targetId);
        return item ? this._wrapInstance(item) : null;
    }

    async create(doc) {
        const newItem = {
            _id: uuidv4(),
            ...doc,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.data.push(newItem);
        this.saveFile();
        return this._wrapInstance(newItem);
    }

    async findByIdAndUpdate(id, update, options) {
        this.load();
        const targetId = id.toString();
        const index = this.data.findIndex(i => i._id.toString() === targetId || i.id === targetId);

        if (index !== -1) {
            // Apply updates
            const newItem = { ...this.data[index], ...update, updatedAt: new Date() };
            this.data[index] = newItem;
            this.saveFile();

            // Return new or old based on options (mocking {new: true})
            return options && options.new ? this._wrapInstance(newItem) : this._wrapInstance(this.data[index]);
        }
        return null;
    }

    async exists(query) {
        return !!(await this.findOne(query));
    }

    async countDocuments(query = {}) {
        this.load();
        return this.data.filter(item => this._matches(item, query)).length;
    }

    // Helper to wrap results in a chainable object (for sort, limit, populate)
    _wrapCursor(results, isSingle = false) {
        const cursor = {
            results: results,
            sort: (criteria) => {
                const key = Object.keys(criteria)[0];
                const dir = criteria[key];
                cursor.results.sort((a, b) => {
                    const valA = a[key] instanceof Date ? a[key].getTime() : a[key];
                    const valB = b[key] instanceof Date ? b[key].getTime() : b[key];

                    if (valA < valB) return dir === 1 ? -1 : 1;
                    if (valA > valB) return dir === 1 ? 1 : -1;
                    return 0;
                });
                return cursor;
            },
            limit: (n) => {
                cursor.results = cursor.results.slice(0, n);
                return cursor;
            },
            select: (fields) => {
                // Mock NO-OP for select
                return cursor;
            },
            populate: (populateField, select) => {
                // Basic populate implementation
                cursor.results = cursor.results.map(doc => {
                    const populatedDoc = { ...doc };
                    const refId = doc[populateField];

                    if (refId) {
                        // Guess collection name based on populateField
                        let collectionName = 'users'; // default
                        if (populateField === 'comments') collectionName = 'comments';
                        if (populateField === 'bubble') collectionName = 'bubbles';
                        if (populateField === 'author') collectionName = 'users';

                        const dbPath = path.join(__dirname, '..', 'data', `${collectionName}.json`);
                        if (fs.existsSync(dbPath)) {
                            const refData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                            const found = refData.find(r => r._id === refId || r._id === refId.toString());
                            if (found) {
                                populatedDoc[populateField] = found;
                            }
                        }
                    }
                    return populatedDoc;
                });
                return cursor;
            },
            lean: () => isSingle ? (cursor.results[0] || null) : cursor.results,
            then: (resolve, reject) => Promise.resolve(isSingle ? (cursor.results[0] || null) : cursor.results).then(resolve, reject),
            // Iterate
            map: (fn) => cursor.results.map(fn)
        };
        return cursor;
    }

    _wrapInstance(item) {
        // Add save() method
        item.save = async () => {
            const index = this.data.findIndex(i => i._id === item._id);
            if (index !== -1) {
                this.data[index] = { ...item, updatedAt: new Date() };
                this.saveFile();
            }
            return item;
        };
        item.populate = async (pathField) => {
            // Single doc populate
            const refId = item[pathField];
            if (refId) {
                let collectionName = 'users'; // Simple heuristic
                if (pathField === 'bubble') collectionName = 'bubbles';
                if (pathField === 'author') collectionName = 'users';

                const dbPath = path.join(__dirname, '..', 'data', `${collectionName}.json`);
                if (fs.existsSync(dbPath)) {
                    const refData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                    const found = refData.find(r => r._id === refId || r._id === refId.toString());
                    if (found) item[pathField] = found;
                }
            }
            return item;
        };
        return item;
    }

    _matches(item, query) {
        for (let key in query) {
            const val = item[key];
            const criterion = query[key];

            // 1. Operator Queries
            if (criterion && typeof criterion === 'object' && !Array.isArray(criterion)) {
                // $in
                if (criterion.$in && Array.isArray(criterion.$in)) {
                    if (!criterion.$in.includes(val)) return false;
                }
                // $gt / $gte
                if (criterion.$gt) {
                    const itemDate = new Date(val).getTime();
                    const queryDate = new Date(criterion.$gt).getTime();
                    if (!(itemDate > queryDate)) return false;
                }
                // $ne
                if (criterion.$ne) {
                    if (val === criterion.$ne) return false;
                }
            }
            // 2. Direct Match
            else {
                if (val !== criterion) return false;
            }
        }
        return true;
    }
}

module.exports = SimpleDB;
