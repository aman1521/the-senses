const fs = require('fs');
const path = require('path');
const specs = require('../config/swagger');

const outputPath = path.join(__dirname, '../docs/openapi.json');

try {
    fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));
    console.log(`✅ OpenAPI specification generated at: ${outputPath}`);
} catch (err) {
    console.error('❌ Failed to generate OpenAPI spec:', err);
    process.exit(1);
}
