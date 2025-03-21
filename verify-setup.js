const fs = require('fs');
const path = require('path');

const requiredFiles = [
    'middleware/authMiddleware.js',
    'routes/authRoutes.js',
    'index.js',
    '.env',
    'package.json'
];

console.log("🔍 Verifying required files...");
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists.`);
    } else {
        console.log(`❌ ${file} is MISSING!`);
    }
});
console.log("✔ Verification complete!");
