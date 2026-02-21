// utils/auditLog.js

function audit(event, meta = {}) {
    console.log(
        JSON.stringify({
            event,
            meta,
            time: new Date(),
            env: process.env.NODE_ENV || 'development',
        })
    );
}

module.exports = { audit };
