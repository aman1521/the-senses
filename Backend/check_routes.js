const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir);

files.forEach(file => {
    if (!file.endsWith('.js')) return;
    const routePath = path.join(routesDir, file);
    try {
        require(routePath);
        console.log(`[OK] ${file}`);
    } catch (e) {
        if (e.toString().includes("requires a middleware function")) {
            console.error(`[FAIL] ${file} - MIDDLWARE ERROR: ${e.message}`);
        } else {
            console.error(`[FAIL] ${file} - ${e.toString()}`);
        }
    }
});
