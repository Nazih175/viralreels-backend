const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

// 1. Hooks Tool
content = content.replace("const inputStr = document.getElementById('customHookInput').value.trim();\n        const btn = e.target.querySelector('button[type=\"submit\"]');", "const inputStr = document.getElementById('customHookInput').value.trim();\n        const btn = e.target.querySelector('button[type=\"submit\"]');\n\n        if (!inputStr) { showToast(\"Please enter a topic first!\"); return; }");

// 2. Captions Tool
content = content.replace("const topic = document.getElementById('dedCapInput').value.trim();\n        const style = document.getElementById('dedCapStyle').value;\n        const btn = document.getElementById('dedCapBtn');", "const topic = document.getElementById('dedCapInput').value.trim();\n        const style = document.getElementById('dedCapStyle').value;\n        const btn = document.getElementById('dedCapBtn');\n\n        if (!topic) { showToast(\"Please enter a topic first!\"); return; }");

// 3. Tags Tool
content = content.replace("const topic = document.getElementById('dedTagsInput').value.trim();\n        const btn = e.target.querySelector('button[type=\"submit\"]');", "const topic = document.getElementById('dedTagsInput').value.trim();\n        const btn = e.target.querySelector('button[type=\"submit\"]');\n\n        if (!topic) { showToast(\"Please enter a topic first!\"); return; }");

// 4. Trend Scout Tool
content = content.replace("const topic = document.getElementById('dedTrendInput').value.trim();\n        const platform = document.getElementById('dedTrendPlatform').value;\n        const btn = document.getElementById('dedTrendBtn');", "const topic = document.getElementById('dedTrendInput').value.trim();\n        const platform = document.getElementById('dedTrendPlatform').value;\n        const btn = document.getElementById('dedTrendBtn');\n\n        if (!topic) { showToast(\"Please enter a topic first!\"); return; }");

// 5. Rewrite Tool
content = content.replace("const val = document.getElementById('rewriteInput').value.trim();\n        const btn = e.target.querySelector('button[type=\"submit\"]');", "const val = document.getElementById('rewriteInput').value.trim();\n        const btn = e.target.querySelector('button[type=\"submit\"]');\n\n        if (!val) { showToast(\"Please enter a script to rewrite!\"); return; }");

fs.writeFileSync('app.js', content, 'utf8');
console.log('App.js patched successfully!');
