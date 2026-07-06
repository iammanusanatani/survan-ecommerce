const fs = require('fs');
const raw = fs.readFileSync('.env', 'utf8');
const lines = raw.split(/\r\n|\n|\r/);
lines.forEach((line, i) => {
  if (line.toUpperCase().includes('ADMIN_PASS') || line.toUpperCase().includes('ADMIN_EMAIL')) {
    console.log(`Line ${i + 1}: ${JSON.stringify(line)}`);
  }
});
console.log('Total lines in file:', lines.length);