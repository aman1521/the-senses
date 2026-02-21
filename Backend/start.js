require('dotenv').config();
const fs = require('fs');

const logFile = 'startup-error.txt';

function logError(msg) {
    console.error(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

// Clear log file
fs.writeFileSync(logFile, '=== Server Startup Log ===\n');

process.on('uncaughtException', (err) => {
    logError('❌ UNCAUGHT EXCEPTION:');
    logError(`Message: ${err.message}`);
    logError(`Stack: ${err.stack}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logError('❌ UNHANDLED REJECTION:');
    logError(JSON.stringify(reason, null, 2));
    process.exit(1);
});

try {
    logError('🔄 Loading server...');
    require('./server.js');
    logError('✅ Server loaded successfully');
} catch (e) {
    logError('❌ ERROR LOADING SERVER:');
    logError(`Message: ${e.message}`);
    logError(`Stack: ${e.stack}`);
    process.exit(1);
}
