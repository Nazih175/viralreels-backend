const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Lucide replaces <i> tags with <svg>, so btn.querySelector('i') returns null after icons render
// Fix: use 'i, svg' selector to safely catch both the original <i> and Lucide's <svg>
const before = code.length;

code = code.split("btn.querySelector('i').classList.add('hidden')").join("(btn.querySelector('i, svg'))?.classList.add('hidden')");
code = code.split("btn.querySelector('i').classList.remove('hidden')").join("(btn.querySelector('i, svg'))?.classList.remove('hidden')");

// Also handle any remaining direct .classList access
const remaining = (code.match(/querySelector\('i'\)\.classList/g) || []).length;
if (remaining > 0) {
    code = code.split("querySelector('i').classList").join("querySelector('i, svg')?.classList");
}

fs.writeFileSync('app.js', code, 'utf8');
console.log('Fixed. File size delta:', code.length - before, 'chars. Remaining broken refs:', remaining);
