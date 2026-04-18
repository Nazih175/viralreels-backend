const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');

const checks = [];

// 1. AI Chat Architect Intro
checks.push(['chatIntro element exists', html.includes('id="chatIntro"')]);
checks.push(['Suggestion chips present', html.includes('suggest-chip')]);
checks.push(['sendChatBtn in HTML', html.includes('sendChatBtn')]);
checks.push(['Chat history btn present', html.includes('chatHistoryBtn')]);
checks.push(['Neural active CSS class', css.includes('neural-active')]);
checks.push(['Elite bubble glassmorphism', css.includes('elite-bubble')]);

// 2. Video AI Neural Lab
checks.push(['Elite grid cells in HTML', html.includes('elite-grid-cell')]);
checks.push(['videoAiLoadingOverlay present', html.includes('videoAiLoadingOverlay')]);
checks.push(['restartVideoAiBtn present', html.includes('restartVideoAiBtn')]);

// 3. JS Logic wiring
checks.push(['sendChatBtn listener wired', js.includes('sendChatBtn')]);
checks.push(['suggest-chip listener wired', js.includes('suggest-chip')]);
checks.push(['Holographic grid flash logic', js.includes('elite-grid-cell')]);
checks.push(['Neural-active toggled in JS', js.includes('neural-active')]);
checks.push(['chatIntro hidden on submit', js.includes("intro.classList.add('hidden')")]);
checks.push(['resetToolState handles view-chat', js.includes("'view-chat'")]);
checks.push(['viewChatLog hides chatHistoryView', js.includes('chatHistoryView')]);

// 4. CSS Design System
checks.push(['Elite grid animation CSS', css.includes('elite-grid-cell')]);
checks.push(['neuralPulse keyframe', css.includes('neuralPulse')]);
checks.push(['architectFloat keyframe', css.includes('architectFloat')]);
checks.push(['Holographic scanner CSS', css.includes('holographic-scanner')]);

// 5. Core platform
checks.push(['API_BASE defined', js.includes('API_BASE')]);
checks.push(['Firebase auth init', js.includes('firebase.initializeApp')]);
checks.push(['Stripe checkout integration', js.includes('/checkout')]);
checks.push(['Service worker registered', html.includes('service-worker') || js.includes('serviceWorker')]);

// 6. SEO & Meta
checks.push(['Meta description present', html.includes('<meta name="description"')]);
checks.push(['Viewport meta tag', html.includes('name="viewport"')]);
checks.push(['Open Graph title', html.includes('og:title')]);

let passed = 0;
checks.forEach(([label, ok]) => {
  console.log((ok ? '✅' : '❌') + ' ' + label);
  if (ok) passed++;
});
console.log('');
console.log(`Score: ${passed}/${checks.length} checks passed`);
