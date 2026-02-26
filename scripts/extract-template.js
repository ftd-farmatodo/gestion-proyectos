const fs = require('fs');
const path = process.argv[2];
if (!path) process.exit(1);
let c = fs.readFileSync(path, 'utf8');
// Remove _END_ and everything until })
c = c.replace(/\s*_END_[\s\S]*?\n\s*\}\)/, '\n})');
fs.writeFileSync(path, c);
console.log('Cleaned', path);
