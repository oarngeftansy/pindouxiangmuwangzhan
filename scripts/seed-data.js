// This script copies the user's localStorage export into a static JSON file
// Run: node scripts/seed-data.js < data.json
// Or:  paste data into public/data/default-patterns.json manually

const fs = require('fs');
const path = require('path');

const input = fs.readFileSync(0, 'utf-8'); // read from stdin
const outPath = path.join(__dirname, '..', 'public', 'data', 'default-patterns.json');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, input);
console.log(`Written ${(input.length / 1024).toFixed(1)} KB to ${outPath}`);
