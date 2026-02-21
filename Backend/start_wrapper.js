const fs = require('fs');

try {
    require('dotenv').config();
    console.log('DotEnv loaded.');
} catch (e) {
    console.error('DotEnv failed:', e.message);
}

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    fs.writeFileSync('startup_error_wrapper.log', `Uncaught: ${err.stack}\n`);
    process.exit(1);
});

try {
    require('./server.js');
} catch (err) {
    console.error('REQUIRE ERROR:', err);
    fs.writeFileSync('startup_error_wrapper.log', `Require Error: ${err.stack}\n`);
    process.exit(1);
}
