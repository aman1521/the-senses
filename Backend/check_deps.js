const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = Object.keys(pkg.dependencies || {});
const failed = [];

deps.forEach(dep => {
    try {
        if (dep.startsWith('file:')) return; // Skip local file dependencies
        require(dep);
        console.log(`Loaded ${dep}`);
    } catch (e) {
        console.error(`Failed to load ${dep}:`, e.message);
        failed.push(dep);
    }
});

if (failed.length > 0) {
    console.log('Failed dependencies:', failed);
    process.exit(1);
} else {
    console.log('All dependencies loaded successfully');
}
