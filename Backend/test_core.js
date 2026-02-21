try {
    const core = require('@thesenses/core');
    console.log('Core loaded successfully:', Object.keys(core));
} catch (error) {
    console.error('Failed to load core:', error);
}
