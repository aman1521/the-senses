try {
    require('./server.js');
} catch (e) {
    console.error('FULL ERROR:', e);
    console.error('ERROR STACK:', e.stack);
    process.exit(1);
}
