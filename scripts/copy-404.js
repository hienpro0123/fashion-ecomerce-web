const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const source = path.join(distDir, 'index.html');
const target = path.join(distDir, '404.html');

fs.copyFileSync(source, target);
console.log('Copied dist/index.html to dist/404.html');
