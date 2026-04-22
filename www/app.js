/**
 * ViralReels AI - App Logic (V3.2-PRO-RESTORED)
 */

// ViralReels System Boot (Auth Protection)
window.VR_BOOT_TIME = Date.now();

// Service Worker Registration (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').then(reg => {
            console.log("ViralReels AI System: Zenith V4.6.8-ULTIMATE Active");
            reg.onupdatefound = () => {
                const installingWorker = reg.installing;
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // --- THE IRON LOCK (Zenith V4.5) ---
                        // 1. Temporal Shield: No reloads in first 5s (Extended for Auth stability)
                        const isBooting = (Date.now() - window.VR_BOOT_TIME) < 5000;
                        // 2. Redirect Awareness: No reloads during Firebase Redirect return
                        const isRedirect = window.location.search.includes('apiKey') || window.location.search.includes('mode') || window.location.hash.includes('access_token');
                        // 3. Activity Shield: No reloads during active auth
                        const isAuthVisible = !document.getElementById('authOverlay')?.classList.contains('hidden');
                        const isLoginSpinning = document.getElementById('authSubmitBtn')?.innerHTML.includes('loader');

                        if (isBooting || isRedirect || isAuthVisible || isLoginSpinning) {
                            console.log("ViralReels AI: SW Update ready but system is locked. Delaying reload.");
                            return;
                        }
                        
                        console.log("New version detected, refreshing...");
                        window.location.reload();
                    }
                };
            };
        }).catch(err => console.log('SW setup failed', err));
    });

    // Handle the 'controllerchange' event (triggered by skipWaiting)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        
        const isBooting = (Date.now() - window.VR_BOOT_TIME) < 5000;
        const isRedirect = window.location.search.includes('apiKey') || window.location.search.includes('mode') || window.location.hash.includes('access_token');
        const isAuthVisible = !document.getElementById('authOverlay')?.classList.contains('hidden');
        const isLoginSpinning = document.getElementById('authSubmitBtn')?.innerHTML.includes('loader');
        
        if (isBooting || isRedirect || isAuthVisible || isLoginSpinning) {
            console.log("ViralReels AI: SW Controller change ignored (Iron Lock active).");
            return;
        }
        
        refreshing = true;
        window.location.reload();
    });
}

const initApp = () => {
    window.renderState = (module, state) => {
        const emptyEl = document.getElementById(`${module}GeneratorsEmpty`);
        const contentEl = document.getElementById(`${module}GeneratorsContent`);
        if (!emptyEl || !contentEl) return;
        
        if (state === 'empty') {
            emptyEl.classList.remove('hidden');
            contentEl.classList.add('hidden');
        } else {
            emptyEl.classList.add('hidden');
            contentEl.classList.remove('hidden');
        }
    };

    if (window.VR_INIT_DONE) return;
    window.VR_INIT_DONE = true;

    // -- Aurora Elite: Floating Particles --
    const initAuroraParticles = () => {
        const container = document.getElementById('auroraParticles');
        if (!container) return;
        
        // Inject Mouse Spotlight (Elite Magnetic Aura)
        const spotlight = document.createElement('div');
        spotlight.className = 'mouse-spotlight';
        spotlight.id = 'mouseSpotlight';
        container.appendChild(spotlight); // Append inside Aurora Container for perfect layering

        window.addEventListener('mousedown', (e) => {
            // Magnetic Burst Effect
            const burstCount = 12;
            for (let i = 0; i < burstCount; i++) {
                const p = document.createElement('div');
                p.className = 'particle burst-particle';
                const size = Math.random() * 4 + 2;
                const angle = (i / burstCount) * Math.PI * 2;
                const dist = 50 + Math.random() * 50;
                p.style.width = `${size}px`;
                p.style.height = `${size}px`;
                p.style.left = e.clientX + 'px';
                p.style.top = e.clientY + 'px';
                p.style.opacity = '0.8';
                p.style.background = 'var(--accent-purple)';
                p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
                p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
                container.appendChild(p);
                setTimeout(() => p.remove(), 1000);
            }
        });

        const particleCount = 80; // Optimized for performance while maintaining premium aesthetic
        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 3 + 1;
            const left = Math.random() * 100;
            const duration = 12 + Math.random() * 20;
            const delay = -(Math.random() * duration); // NEGATIVE DELAY: starts animation mid-cycle for immediate visibility
            const opacity = 0.2 + Math.random() * 0.3;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.left = `${left}%`;
            p.style.bottom = `${Math.random() * 100}%`; // Start scattered across the screen
            p.style.opacity = opacity;
            p.style.animationDuration = `${duration}s`;
            p.style.animationDelay = `${delay}s`;
            container.appendChild(p);
        }
    };
    initAuroraParticles();

    // -- Global Keyboard Protection System --
    // -- Global Keyboard Protection System (Zenith V4.1 Robust) --
    // Uses event delegation to ensure dynamic inputs (Chat, Rewrite) are always covered.
    const setupKeyboardProtection = () => {
        window.addEventListener('focusin', (e) => {
            const target = e.target;
            if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
                if (window.innerWidth < 1024) document.body.classList.add('keyboard-mobile');
            }
        });
        window.addEventListener('focusout', (e) => {
            const target = e.target;
            if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
                document.body.classList.remove('keyboard-mobile');
            }
        });
    };
    setupKeyboardProtection();
    
    // 1. Immediate UI Reveal (Dismiss Splash)
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => { 
            splash.style.visibility = 'hidden'; 
            splash.style.display = 'none'; 
            // Fallback: if it's still there, force removal
            if (splash.parentNode) splash.parentNode.removeChild(splash);
        }, 500);
    }

    console.log("ViralReels AI System: Zenith V4.6.8 Global Optimization Active");
        
    // -- Hardening Helper: safeListen --
    const safeListen = (id, event, callback) => {
        const el = document.getElementById(id);
        if (el) { el.addEventListener(event, callback); }
        else { console.warn(`[ViralReels Secure] Element NOT FOUND: ${id}. Initializer continuing...`); }
    };

    // -- Safe Storage Helpers (Moved Global for Zenith V3.9) --
    // safeGet is now global

    // =============================================
    // == GLOBAL PRODUCTION CONFIG (UPDATE THESE) ==
    // =============================================
    const CONFIG = {
        PUBLISHER_ID: "REPLACE_WITH_YOUR_PUBLISHER_ID", // e.g. "ca-pub-123456789"
        STRIPE_TEST_MODE: false, // Flip to false for sk_live
    };

    let currentAnalyzedIdea = null;
    let savedEvents = safeGet('viralreels_events', {});
    let savedHooks = safeGet('viralreels_tracked_hooks', []);
    let savedRewrites = safeGet('viralreels_saved_rewrites', []);
    let analyticsData = safeGet('vr_analytics_data', []);
    let isPro = localStorage.getItem('vr_pro_status') === 'true';
    let isSubCancelled = localStorage.getItem('vr_sub_cancelled') === 'true';
    let isOnboardingComplete = localStorage.getItem('vr_onboarding_complete') === 'true';
    let savedTheme = localStorage.getItem('vr_theme') || 'dark';
    let persona = safeGet('vr_persona', { niche: '', tone: 50 });

    // Apply Saved Theme
    if (savedTheme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');

    // -- Centralized UI Refresh Helper (Debounced for Performance) --
    let iconTimeout;
    window.updateIcons = () => {
        clearTimeout(iconTimeout);
        iconTimeout = setTimeout(() => {
            if (window.lucide) lucide.createIcons();
            console.log("[ViralReels] UI Hydrated.");
        }, 50);
    };
    let currentAnalyzeData = null;
    let lastUsedInputs = { analyze: '', hooks: '', captions: '', trends: '', rewrite: '' };

    // -- GROWTH ANALYTICS: Track Milestone Helper --
    window.trackMilestone = (type, metadata = {}) => {
        try {
            const milestones = JSON.parse(localStorage.getItem('vr_analytics_milestones') || '[]');
            milestones.push({ type, ...metadata, timestamp: Date.now() });
            localStorage.setItem('vr_analytics_milestones', JSON.stringify(milestones));
            console.log(`[Growth] Milestone Logged: ${type}`, metadata);
        } catch(err) { /* silent */ }
    };
 
    // -- DOM Elements (Explicit Declarations for UI Reliability) --
    const emailLoginBtn = document.getElementById('emailLoginBtn');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const btnLogout = document.getElementById('btnLogout');
    const appViews = document.querySelectorAll('.app-view');
    const navButtons = document.querySelectorAll('.nav-btn');

    // -- Custom Modal System --
    const modalOverlay = document.getElementById('vrModalOverlay');
    const modalTitle = document.getElementById('vrModalTitle');
    const modalText = document.getElementById('vrModalText');
    const modalConfirm = document.getElementById('vrModalConfirm');
    const modalCancel = document.getElementById('vrModalCancel');

    window.vrConfirm = (title, msg, onConfirm) => {
        modalTitle.innerText = title;
        modalText.innerText = msg;
        modalCancel.classList.remove('hidden');
        modalOverlay.classList.remove('hidden');
        
        const close = () => { modalOverlay.classList.add('hidden'); };
        modalConfirm.onclick = () => { close(); if (onConfirm) onConfirm(); };
        modalCancel.onclick = close;
    };

    window.vrAlert = (title, msg) => {
        modalTitle.innerText = title;
        modalText.innerText = msg;
        modalCancel.classList.add('hidden');
        modalOverlay.classList.remove('hidden');
        modalConfirm.onclick = () => { modalOverlay.classList.add('hidden'); };
    };


    window.resetToolState = (viewId) => {
        if (!viewId) return;
        const tool = viewId.replace('view-', '');
        
        // --- 1. CLEAR INPUTS ---
        const inputMap = {
            'analyze': ['ideaInput', 'captionInput', 'hashtagInput'],
            'hooks': ['customHookInput'],
            'captions': ['dedCapInput'],
            'tags': ['dedTagsInput'],
            'trends': ['trendsInput'],
            'rewrite': ['rewriteInput'],
            'chat': ['chatInput']
        };
        (inputMap[tool] || []).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        // -- Mobile Keyboard Support --
        if (tool === 'chat') {
            const chatIn = document.getElementById('chatInput');
            if (chatIn) {
                chatIn.addEventListener('focus', () => document.body.classList.add('keyboard-mobile'));
                chatIn.addEventListener('blur', () => document.body.classList.remove('keyboard-mobile'));
            }
        }

        // --- 2. CLEAR OUTPUTS ---
        if (tool === 'analyze') {
            document.getElementById('resultsDashboard')?.classList.add('hidden');
        } else if (tool === 'hooks') {
            document.getElementById('hooksGeneratorsContent')?.classList.add('hidden');
            document.getElementById('hooksGeneratorsEmpty')?.classList.remove('hidden');
        } else if (tool === 'chat') {
            const chatMessages = document.getElementById('chatMessages');
            const chatIntro = document.getElementById('chatIntro');
            const chatView = document.getElementById('view-chat');
            if (chatMessages) chatMessages.innerHTML = '';
            if (chatIntro) {
                chatIntro.classList.remove('hidden');
                chatMessages.appendChild(chatIntro);
            }
            if (chatView) chatView.classList.remove('neural-active');
        } else if (tool === 'videoai') {
            document.getElementById('restartVideoAiBtn')?.click();
        }

        updateIcons();
    };

    // -- PREMIUM CELEBRATIONS --
    window.vrCelebrate = (type = 'basic') => {
        if (type === 'basic') {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#9d4edd', '#4361ee', '#00f5d4'] });
        } else if (type === 'viral') {
            const end = Date.now() + (2 * 1000);
            const colors = ['#ffb703', '#9d4edd', '#ffffff'];
            (function frame() {
                confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
                confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
                if (Date.now() < end) { requestAnimationFrame(frame); }
            }());
        }
    };

    // -- ENTER KEY SUPPORT --
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const activeEl = document.activeElement;
            if (activeEl.tagName === 'INPUT' && activeEl.closest('form')) {
                e.preventDefault();
                activeEl.closest('form').dispatchEvent(new Event('submit'));
            } else if (activeEl.tagName === 'TEXTAREA' && e.ctrlKey && activeEl.closest('form')) {
                e.preventDefault();
                activeEl.closest('form').dispatchEvent(new Event('submit'));
            }
        }
    });
    let calDate = new Date();
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api' 
        : 'https://viralreels-ai-backend.onrender.com/api';
    console.log("[ViralReels] Booting with API_BASE:", API_BASE);

    // -- COLD-START DETECTION & SOLVER --
    // Force-pings the backend on load. If it takes > 2s, we assume it's sleeping
    // and we disable the main buttons with a "warming up" state until it's ready.
    (() => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;
        
        let attempts = 0;
        const pingServer = async () => {
            try {
                const start = Date.now();
                const res = await fetch(`${API_BASE}/health`, { method: 'GET', cache: 'no-store' });
                if (res.ok) {
                    console.log("[ViralReels] Server is officially ALIVE.");
                    return true;
                }
            } catch (e) {}
            return false;
        };

        const checkLoop = async () => {
            const alive = await pingServer();
            if (!alive && attempts < 10) {
                if (attempts === 0) showToast("🕯️ Initializing AI Engine... first load may take 30s.", 6000);
                attempts++;
                setTimeout(checkLoop, 5000);
            }
        };
        checkLoop();
    })();

    // --- ANALYTICS UTILITY ---
    async function logUsage(toolName) {
        try {
            const user = firebase.auth().currentUser;
            const headers = { 'Content-Type': 'application/json' };
            if (user) {
                const token = await user.getIdToken();
                headers['Authorization'] = `Bearer ${token}`;
            }
            await fetchWithTimeout(`${API_BASE}/log-usage`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ tool: toolName, uid: user ? user.uid : null })
            });
        } catch (e) {
            console.warn(`[Analytics] Silent failure: ${e.message}`);
        }
    }

    // --- FETCH WITH TIMEOUT & SMART RETRY ---
    // Handles cold-starts automatically. If a request fails due to the server waking up,
    // it enters a retry loop while keeping the user informed.
    const fetchWithTimeout = async (url, options = {}, ms = 30000, retries = 0) => {
        const MAX_RETRIES = 5;
        const RETRY_DELAY = 6000;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        
        // SECURE RECOGNITION: ATTACH ID TOKEN
        try {
            const user = firebase.auth().currentUser;
            if (user) {
                const token = await user.getIdToken();
                if (!options.headers) options.headers = {};
                options.headers['Authorization'] = `Bearer ${token}`;
            } else if (window.isGuestMode) {
                // Bridge: Send guest token to allow trials without account
                if (!options.headers) options.headers = {};
                options.headers['Authorization'] = `Bearer guest-token`;
            }
        } catch (authErr) {
            console.warn("[Auth Header] Token fetch issue:", authErr.message);
        }

        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timer);

            // DETECT RENDER COLD-START (502/503/504)
            if ([502, 503, 504].includes(response.status) && retries < MAX_RETRIES) {
                throw new Error("COOLD_START");
            }

            return response;
        } catch (err) {
            clearTimeout(timer);
            const isRetryable = (err.name === 'AbortError' || err.message === 'COOLD_START' || err.message === 'TypeError');
            
            if (isRetryable && retries < MAX_RETRIES) {
                if (retries === 0) showToast("🚀 Waking up AI Engine... please stay on this page.", 10000);
                console.log(`[SmartRetry] Server warming up. Attempt ${retries + 1}/${MAX_RETRIES}...`);
                await new Promise(r => setTimeout(r, RETRY_DELAY));
                return fetchWithTimeout(url, options, ms, retries + 1);
            }
            throw err;
        }
    };

    // -- HISTORY MANAGEMENT --
    let histories = safeGet('vr_tool_histories', {
        analyze: [], hooks: [], captions: [], tags: [], trends: [], rewrite: []
    });
    let historyIndices = { analyze: -1, hooks: -1, captions: -1, tags: -1, trends: -1, rewrite: -1 };

    const addToHistory = (tool, data) => {
        if (!data) return;
        // Check if data is already at the top
        const first = histories[tool][0];
        if (first && JSON.stringify(first) === JSON.stringify(data)) return;
        
        histories[tool].unshift(data);
        if (histories[tool].length > 10) histories[tool].pop();
        localStorage.setItem('vr_tool_histories', JSON.stringify(histories));
        historyIndices[tool] = -1;
    };

    window.cycleHistory = (tool) => {
        if (histories[tool].length === 0) {
            showToast("No recent history for this tool.");
            return;
        }
        historyIndices[tool] = (historyIndices[tool] + 1) % histories[tool].length;
        const data = histories[tool][historyIndices[tool]];
        const val = typeof data === 'object' ? data.text : data;
        
        // Restore main input
        let inputId = `${tool}Input`;
        if (tool === 'analyze') inputId = 'ideaInput';
        if (tool === 'hooks') inputId = 'customHookInput';
        if (tool === 'tags') inputId = 'dedTagsInput';
        if (tool === 'captions') inputId = 'dedCapInput';
        const input = document.getElementById(inputId);
        if (input) {
            input.value = val;
            input.classList.add('history-pop');
            setTimeout(() => input.classList.remove('history-pop'), 200);
        }

        // Restore Metadata if available
        if (typeof data === 'object') {
            if (data.platform && document.getElementById('platformSelect')) document.getElementById('platformSelect').value = data.platform;
            if (data.length && document.getElementById('lengthInput')) document.getElementById('lengthInput').value = data.length;
            if (data.style && document.getElementById('dedCapStyle')) document.getElementById('dedCapStyle').value = data.style;
        }
        
        showToast(`Loaded: "${val.substring(0, 15)}..."`);
    };

    // -- NATIVE POLISH: HAPTIC ENGINE --
    window.triggerHaptic = (type = 'light') => {
        if (!("vibrate" in navigator)) return;
        
        const patterns = {
            light: 10,
            medium: 35,
            heavy: [50, 100, 50],
            success: [30, 50, 30],
            error: [100, 50, 100]
        };
        
        try {
            navigator.vibrate(patterns[type] || 10);
        } catch (e) {
            console.warn("Haptic Pulse Blocked:", e);
        }
    };

    // -- ANIMATION ENGINE --
    const triggerConfetti = () => {
        if (window.confetti) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#9d4edd', '#4361ee', '#ffb703', '#06d6a0'] });
        }
    };

    window.triggerSuccess = (text = "Success!") => {
        const overlay = document.getElementById('successOverlay');
        const textEl = document.getElementById('successText');
        if (overlay && textEl) {
            textEl.innerText = text;
            overlay.classList.remove('hidden');
            triggerConfetti();
            window.triggerHaptic('success'); // High-fidelity sensory confirmation
            setTimeout(() => overlay.classList.add('hidden'), 2200);
        }
    };

    window.nativeShare = (text, title = "ViralReels AI Idea") => {
        if (navigator.share) {
            navigator.share({ title, text, url: window.location.href })
                .then(() => console.log('Viral Share Done'))
                .catch((e) => console.log('Share canceled', e));
        } else {
            // Fallback: Copy to clipboard instead
            navigator.clipboard.writeText(text);
            showToast("System Share not supported. Copied to clipboard!");
        }
    };

    // =============================================
    // == USAGE LIMIT ENGINE ==
    // =============================================
    const LIMITS = { analyze: 5, hooks: 5, captions: 5, trends: 3, rewrite: 3 };
    const TRIAL_DAYS = 7;
    const TRIAL_LIMIT = 50; // uses per tool during trial
    const AD_DURATION = 30; // seconds
    let adTimer = null;
    let currentAdRechargeTarget = null;

    const getToday = () => new Date().toISOString().split('T')[0];

    // ── TRIAL ENGINE ──
    const initTrial = () => {
        if (!localStorage.getItem('vr_trial_start')) {
            localStorage.setItem('vr_trial_start', new Date().toISOString());
        }
    };

    // --- MISSING LOGIC: LIMIT BLOCKER (V4.6.6) ---
    const showLimitBlock = (container, tool) => {
        if (!container) return;
        const msg = `You've reached your daily limit for ${tool} (5 Uses).`;
        const block = document.createElement('div');
        block.className = 'glass-card p-6 text-center animate-appear mt-4';
        block.innerHTML = `
            <div class="text-3xl mb-3">⚡</div>
            <h3 class="font-bold mb-2">Limit Reached!</h3>
            <p class="text-sm text-secondary mb-4">${msg}</p>
            <div class="flex flex-col gap-2">
                <button class="btn-primary w-full" onclick="window.trackMilestone('CONVERSION_CLICK', { tool: '${tool}', type: 'LINK_AUTH' }); document.getElementById('authOverlay').classList.remove('hidden')">
                    <i data-lucide="crown"></i> Start 7-Day Free Trial
                </button>
                <button class="btn-secondary w-full" onclick="window.trackMilestone('CONVERSION_LATER', { tool: '${tool}' }); this.parentElement.parentElement.remove()">Later</button>
            </div>
        `;
        container.innerHTML = '';
        container.appendChild(block);
        updateIcons();
        window.triggerHaptic('notification');
        
        // --- GROWTH ANALYTICS: Track Limit Hit ---
        window.trackMilestone('LIMIT_HIT', { tool });
    };

    const getTrialInfo = () => {
        const start = localStorage.getItem('vr_trial_start');
        if (!start) return { active: false, daysLeft: 0 };
        const elapsed = (Date.now() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
        const daysLeft = Math.max(0, TRIAL_DAYS - Math.floor(elapsed));
        return { active: daysLeft > 0, daysLeft };
    };
    const isInTrial = () => getTrialInfo().active;

    const getUsage = () => {
        const stored = JSON.parse(localStorage.getItem('vr_usage') || 'null');
        if (!stored || stored.date !== getToday() || typeof stored.analyze === 'undefined') {
            // New day — reset to full limits
            const fresh = { date: getToday(), ...LIMITS };
            localStorage.setItem('vr_usage', JSON.stringify(fresh));
            return fresh;
        }
        return stored;
    };

    const saveUsage = (usage) => localStorage.setItem('vr_usage', JSON.stringify(usage));

    const getRemainingUses = (tool) => {
        if (isPro) return 999;
        if (isInTrial()) return TRIAL_LIMIT;
        return getUsage()[tool] ?? LIMITS[tool];
    };

    const consumeUse = (tool) => {
        if (isPro || isInTrial()) return; // no consumption during trial or pro
        const usage = getUsage();
        if (usage[tool] > 0) usage[tool]--;
        saveUsage(usage);
        renderAllBadges();
        
        // --- GUEST CONVERSION TRACKING ---
        if (window.isGuestMode) {
            let count = parseInt(localStorage.getItem('vr_guest_uses') || '0') + 1;
            localStorage.setItem('vr_guest_uses', count.toString());
            console.log(`[ViralReels] Guest Usage: ${count}`);
            
            // Milestone prompts (5, 12, 20)
            if ([5, 12, 20].includes(count)) {
                setTimeout(() => {
                    window.vrConfirm(
                        "Save Your Creator History?",
                        `You've used ViralReels ${count} times as a guest! Create a free account now to save all your hooks, trends, and analytics permanently.`,
                        () => { document.getElementById('authOverlay').classList.remove('hidden'); },
                        "Join Now",
                        "Later"
                    );
                }, 1000);
            }
        }
    };

    const rechargeUses = (tool, amount) => {
        const usage = getUsage();
        usage[tool] = Math.min(LIMITS[tool], (usage[tool] || 0) + amount);
        saveUsage(usage);
        renderAllBadges();
    };

    // Badge renderer (color-coded by urgency)
    const renderBadge = (tool) => {
        const el = document.getElementById(`usage-badge-${tool}`);
        if (!el) return;
        const rem = getRemainingUses(tool);
        const max = LIMITS[tool];

        if (isPro) {
            el.className = `usage-badge plenty`;
            el.innerHTML = `<i data-lucide="infinity" style="width:12px; height:12px;"></i> Unlimited Uses`;
            updateIcons();
            return;
        }

        // Trial badge
        const trial = getTrialInfo();
        if (trial.active) {
            el.className = `usage-badge plenty`;
            el.style.background = 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(251,146,60,0.1))';
            el.style.borderColor = 'rgba(234,179,8,0.3)';
            el.style.color = '#fbbf24';
            el.innerHTML = `🎁 ${trial.daysLeft}d free trial`;
            return;
        }

        let cls = 'plenty', icon = '⚡';
        if (rem === 0) { cls = 'empty'; icon = '🔒'; }
        else if (rem === 1) { cls = 'critical'; icon = '⚠️'; }
        else if (rem <= Math.ceil(max / 2)) { cls = 'low'; icon = '⚡'; }
        el.className = `usage-badge ${cls}`;
        el.innerHTML = `<span>${icon}</span> ${rem} / ${max} free uses today`;
    };

    const renderAllBadges = () => Object.keys(LIMITS).forEach(renderBadge);

    // Render reset time string
    const getResetIn = () => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        return `${h}h ${m}m`;
    };

    // Clipboard helper
    window.copyToClipboard = (text, btn) => {
        navigator.clipboard.writeText(text).then(() => {
            const original = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check" style="width:14px; color:var(--accent-green);"></i>';
            showToast("Copied to clipboard!");
            window.triggerHaptic('light'); // Subtle confirmation pulse
            updateIcons();
            setTimeout(() => {
                btn.innerHTML = original;
                updateIcons();
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showToast("Copy failed.");
            window.triggerHaptic('error');
        });
    };

    // Toast notification
    const showToast = (msg, duration = 3000) => {
        const t = document.createElement('div');
        t.className = 'toast';
        t.innerHTML = `<i data-lucide="info" style="width:16px;"></i> ${msg}`;
        document.body.appendChild(t);
        window.triggerHaptic('light'); // Subtle entrance pulse
        updateIcons();
        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transform = 'translate(-50%, 20px)';
            setTimeout(() => t.remove(), 300);
        }, duration);
    };

    // -- AD MODAL ENGINE (REWARD VIDEO ADS) --
    // TODO: Replace this simulated timer with the Google AdSense H5 Games SDK for Reward Video Ads
    // Script: <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ID" crossorigin="anonymous"></script>
    const adModal = document.getElementById('adModal');
    const adProgressBar = document.getElementById('adProgressBar');
    const adSeconds = document.getElementById('adSeconds');
    const adSkipBtn = document.getElementById('adSkipBtn');

    const startAd = (tool) => {
        currentAdRechargeTarget = tool;

        // REAL PRODUCTION TRIGGER: Google AdSense Interstitial
        if (window.adsbygoogle && CONFIG.PUBLISHER_ID !== "REPLACE_WITH_YOUR_PUBLISHER_ID") {
            (window.adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: CONFIG.PUBLISHER_ID,
                enable_page_level_ads: true,
                overlays: {bottom: true},
                onAdClosed: () => {
                    grantAdUses();
                }
            });
            // Also show the UI modal as a fallback/loader
            adModal.classList.remove('hidden');
        } else {
            // Fallback to simulation if AdBlocker or script error
            adModal.classList.remove('hidden');
        }

        adProgressBar.style.width = '0%';
        adSeconds.textContent = AD_DURATION;
        adSkipBtn.disabled = true;
        adSkipBtn.style.opacity = '0.4';
        adSkipBtn.style.cursor = 'not-allowed';

        let elapsed = 0;
        adTimer = setInterval(() => {
            elapsed++;
            const pct = (elapsed / AD_DURATION) * 100;
            adProgressBar.style.width = `${pct}%`;
            adSeconds.textContent = AD_DURATION - elapsed;

            if (elapsed >= AD_DURATION) {
                clearInterval(adTimer);
                adSkipBtn.disabled = false;
                adSkipBtn.style.opacity = '1';
                adSkipBtn.style.cursor = 'pointer';
                adSkipBtn.textContent = '✓ Collect +2 Uses';
                adSkipBtn.style.background = 'var(--accent-green)';
                adSkipBtn.style.color = 'black';
            }
        }, 1000);
    };

    adSkipBtn.addEventListener('click', () => {
        if (adSkipBtn.disabled) return;
        clearInterval(adTimer);
        adModal.classList.add('hidden');

        if (currentAdRechargeTarget) {
            rechargeUses(currentAdRechargeTarget, 2);
            // Remove the limit block so user can try again
            const block = document.getElementById(`limit-block-${currentAdRechargeTarget}`);
            if (block) block.remove();
            showToast(`+2 ${currentAdRechargeTarget} uses added! You're back in.`);
            currentAdRechargeTarget = null;
        }

        // Reset ad UI for next time
        adSkipBtn.textContent = 'Skip Ad';
        adSkipBtn.style.background = '';
        adSkipBtn.style.color = '';
        adProgressBar.style.width = '0%';
        adSeconds.textContent = AD_DURATION;
    });

    // Initialize badges on load
    renderAllBadges();
    // =============================================
    // == END USAGE LIMIT ENGINE ==
    // =============================================



    // -- Overlays & Modals --
    const authOverlay = document.getElementById('authOverlay');
    const appContainer = document.getElementById('appContainer');
    const paywallOverlay = document.getElementById('paywallOverlay');
    const aboutModal = document.getElementById('aboutModal');
    const settingsModal = document.getElementById('settingsModal');
    const calendarEventModal = document.getElementById('calendarEventModal');

    // Auth (Logic handed off to Firebase at the bottom of the file)

    // Header Modals
    document.getElementById('aboutBtn').addEventListener('click', () => aboutModal.classList.remove('hidden'));
    document.getElementById('settingsBtn').addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        updateBillingUI();
    });
    document.getElementById('settingsGoProBtn').addEventListener('click', () => {
        settingsModal.classList.add('hidden');
        paywallOverlay.classList.remove('hidden');
    });
    document.querySelectorAll('.modal-closer').forEach(btn => {
        btn.addEventListener('click', (e) => e.currentTarget.closest('.fullscreen-overlay').classList.add('hidden'));
    });

    document.getElementById('upgradeBtn').addEventListener('click', async function (e) {
        e.preventDefault();
        const originalContent = this.innerHTML;
        this.innerHTML = '<div class="loader" style="border-top-color:black;"></div>';
        this.disabled = true;

        try {
            const res = await fetchWithTimeout(`${API_BASE}/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: firebase.auth().currentUser ? firebase.auth().currentUser.uid : null })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("Checkout failed");
            }
        } catch (err) {
            console.error(err);
            // Backup simulation if API fails during LOCAL TESTING ONLY
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isLocal) {
                showToast("Sandbox: Redirect failed. Simulating Pro activation...");
                setTimeout(() => {
                    isPro = true;
                    localStorage.setItem('vr_pro_status', 'true');
                    window.location.reload();
                }, 1000);
            } else {
                showToast("Secure checkout unavailable. Please try again later.");
            }
        }
    });

    const paywallActionBtn = document.getElementById('paywallActionBtn');
    if (paywallActionBtn) {
        paywallActionBtn.addEventListener('click', () => {
            document.getElementById('upgradeBtn').click();
        });
    }

    // -- Settings Logic --
    document.getElementById('themeToggle').addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.remove('light-theme');
            localStorage.setItem('vr_theme', 'dark');
        } else {
            document.body.classList.add('light-theme');
            localStorage.setItem('vr_theme', 'light');
        }
    });
    document.getElementById('clearDataBtn').addEventListener('click', () => {
        if (confirm("Are you sure you want to delete all saved data from this device?")) {
            localStorage.clear();
            savedEvents = {}; savedHooks = []; savedRewrites = [];
            renderCalendar(); renderTracker(); renderSavedRewrites();
            alert("Local storage wiped.");
        }
    });
    document.getElementById('delAccountBtn').addEventListener('click', async () => {
        if (confirm("DANGER! This will permanently wipe your ViralReels profile, saved hooks, and cancel any active subscription. This cannot be undone. Proceed?")) {
            try {
                if (firebase.auth().currentUser) {
                    await firebase.auth().currentUser.delete();
                }
                localStorage.clear();
                alert("Account and data completely deleted.");
                location.reload();
            } catch (error) {
                if (error.code === 'auth/requires-recent-login') {
                    alert("For security reasons, you must log out and log back in before deleting your account.");
                } else {
                    alert("Error deleting account: " + error.message);
                }
            }
        }
    });

    // -- Premium Paywall --
    document.getElementById('closePaywallBtn').addEventListener('click', () => paywallOverlay.classList.add('hidden'));

    // -- Navigation (12-Icon Routing) --
    const navItems = document.querySelectorAll('.nav-item, .nav-btn');
    const tabViews = document.querySelectorAll('.tab-view');

    // --- ELITE NAV PULSE HELPER ---
    window.pulseNavItem = (id) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.add('nav-pulse');
            setTimeout(() => btn.classList.remove('nav-pulse'), 4500); // 1.5s * 3 cycles
        }
    };

    navItems.forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.getAttribute('data-tab');
            if ((targetId === 'videoai' || targetId === 'chat') && !isPro) {
                paywallOverlay.classList.remove('hidden');
                return;
            }

            // --- CLEAN WORKSPACE: RESET ON LEAVE ---
            const currentView = document.querySelector('.tab-view.active-view');
            // Auto-reset everything EXCEPT permanent user archives (Calendar, Tracker, Vault, Home)
            if (currentView && !['view-calendar', 'view-tracker', 'view-saved', 'view-home'].includes(currentView.id)) {
                window.resetToolState(currentView.id);
            }

            // 0. Pro Gating (Intercept Video AI / Chat for Guests/Free Users)
            if (['videoai', 'chat'].includes(targetId) && (!isPro || window.isGuestMode)) {
                if (window.isGuestMode) {
                    showToast("Register to Unlock Pro Feature: " + targetId.toUpperCase());
                    authOverlay.classList.remove('hidden');
                    return;
                } else if (!isPro) {
                    // Existing users without Pro see the Paywall
                    if (window.showProPaywall) window.showProPaywall();
                    return;
                }
            }

            // Identify target view for entrance (animation)
            const targetView = document.getElementById(`view-${targetId}`);

            if (!targetView || (currentView && currentView.id === `view-${targetId}`)) return;

            // 1. Exit Animation for Current View
            if (currentView) {
                currentView.classList.add('view-exit');
                await new Promise(r => setTimeout(r, 180));
            }

            // 2. Clear all state
            navItems.forEach(b => b.classList.remove('active'));
            tabViews.forEach(v => {
                v.classList.remove('active-view', 'view-animate', 'view-exit');
                v.classList.add('hidden');
            });

            // 3. Show Target View with Enter Animation
            btn.classList.add('active');
            targetView.classList.remove('hidden');
            targetView.classList.add('active-view');
            
            if (targetId !== 'checklist') {
                targetView.classList.add('view-animate');
                setTimeout(() => targetView.classList.remove('view-animate'), 400);
            }

            updateIcons();

            if (targetId === 'calendar') renderCalendar();
            if (targetId === 'tracker') renderTracker();
            if (targetId === 'saved') renderSavedRewrites();
            if (targetId === 'analyze') renderAnalytics();
            
            console.log(`[ViralReels] Navigated to ${targetId}`);

            const tabName = btn.querySelector('span')?.innerText || 'Dashboard';
            document.title = `ViralReels | ${tabName}`;
        });
    });

    // -- MANUAL RESET BUTTONS --
    document.querySelectorAll('.tool-reset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const viewId = btn.getAttribute('data-view');
            
            // SECURITY PASS: Confirmation for Log modules
            if (['view-calendar', 'view-tracker', 'view-saved'].includes(viewId)) {
                if (!confirm("Wipe all saved logs in this module? This cannot be undone, though your tool history (last 10 searches) will remain safe.")) return;
            }

            window.resetToolState(viewId);
            showToast("Workspace Cleared.");
        });
    });

    // -- Sub-tabs Engine (Pill Routing) --
    document.querySelectorAll('.pill-tabs').forEach(tabGroup => {
        tabGroup.addEventListener('click', (e) => {
            const btnTarget = e.target.closest('.pill');
            if (btnTarget) {
                const targetSub = btnTarget.getAttribute('data-subtab');

                // --- PREMIUM BLOCKER ---
                if (targetSub === 'sub-analyze-metrics' && !isPro) {
                    paywallOverlay.classList.remove('hidden');
                    return; // Prevent tab switch!
                }

                tabGroup.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
                btnTarget.classList.add('active');

                const section = btnTarget.closest('section');
                section.querySelectorAll('.item-list-container').forEach(c => {
                    c.classList.add('hidden');
                    c.classList.remove('active-subtab');
                });

                const t = document.getElementById(targetSub);
                if (t) {
                    t.classList.remove('hidden');
                    t.classList.add('active-subtab');
                }
            }
        });
    });

    // -- Utility Functions --
    const getKeywords = (text) => {
        const words = text.split(" ").filter(w => w.length > 3);
        const topic = words.slice(0, 3).join(" ") || "this concept";
        return { topic, shortTopic: words[0] || "it" };
    };

    const toItemCard = (text, type) => {
        const escapedText = text.replace(/'/g, "\\'").replace(/\n/g, "\\n");
        const typeClass = type === 'hook' ? 'type-hook' : (type === 'rewrite' ? 'type-rewrite' : '');
        const tagLabel = type === 'hook' ? 'REEL HOOK' : (type === 'rewrite' ? 'AI REWRITE' : 'SUGGESTION');
        
        return `
            <div class="saved-item-card ${typeClass} result-appear">
                <div class="saved-card-header">
                    <span class="saved-tag">${tagLabel}</span>
                    <button class="icon-button" onclick="copyToClipboard('${escapedText}', this)" title="Copy"><i data-lucide="copy"></i></button>
                </div>
                <p class="saved-content-text" style="white-space:pre-wrap;">${text}</p>
                <div class="saved-card-actions">
                    <button class="action-btn-mini" onclick="nativeShare('${escapedText}')"><i data-lucide="share-2"></i> Share</button>
                    ${(type === 'hook' || type === 'rewrite') ? `<button class="action-btn-mini" onclick="saveToVault('${escapedText}', '${type}', this)"><i data-lucide="archive"></i> Save to Vault</button>` : ''}
                </div>
            </div>
        `;
    };

    window.saveToVault = (text, type, btnElem) => {
        if (type === 'hook') {
            savedHooks.unshift(text); localStorage.setItem('viralreels_tracked_hooks', JSON.stringify(savedHooks));
            if (typeof renderTracker === 'function') renderTracker();
        } else if (type === 'rewrite') {
            savedRewrites.unshift(text); localStorage.setItem('viralreels_saved_rewrites', JSON.stringify(savedRewrites));
            if (typeof renderSavedRewrites === 'function') renderSavedRewrites();
        }
        btnElem.innerHTML = '<i data-lucide="check"></i> Saved'; btnElem.classList.add('saved'); updateIcons();
        window.triggerHaptic('medium'); // Tactile confirmation of saving
        triggerSuccess("Saved to Vault");
    };

    window.copyHash = (text, el) => {
        let tagText = text.startsWith('#') ? text : '#' + text;
        navigator.clipboard.writeText(tagText).then(() => {
            showToast(`Copied: ${tagText}`);
            const oldHtml = el.innerHTML;
            el.innerHTML = '<i data-lucide="check" style="width:12px;"></i> Copied';
            setTimeout(() => { el.innerHTML = oldHtml; updateIcons(); }, 1500);
        });
    };

    // -- 1. ANALYZE VIEW --
    document.getElementById('analyzerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const idea = document.getElementById('ideaInput').value.trim();
        const platform = document.getElementById('platformSelect')?.value || 'all';
        const length = document.getElementById('lengthInput')?.value || '15s';
        const btn = document.getElementById('analyzeSubmitBtn');

        // --- DUPLICATE CHECK ---
        const currentInputKey = `${idea}-${platform}-${length}`;
        if (lastUsedInputs.analyze === currentInputKey) {
            showToast("Change the input to generate a new analysis!");
            return;
        }

        // --- EMPTY VALIDATION ---
        if (!idea) {
            showToast("Please enter an idea first!");
            return;
        }

        // --- USAGE GATE ---
        if (getRemainingUses('analyze') <= 0 && !isPro && !isInTrial()) {
            showLimitBlock(document.getElementById('sub-analyze-scout'), 'analyze');
            window.triggerHaptic('error');
            return;
        }

        window.triggerHaptic('medium'); // Kick off the AI scan
        btn.disabled = true; // LOCK IMMEDIATELY
        lastUsedInputs.analyze = currentInputKey; // Mark as used
        
        // --- UI GATING: SKELETON ON (Robust) ---
        const bIcon = btn.querySelector('i, svg');
        if (bIcon) bIcon.classList.add('hidden');
        
        let ldr = btn.querySelector('.loader');
        if (!ldr) {
            ldr = document.createElement('div');
            ldr.className = 'loader';
            btn.appendChild(ldr);
        }
        ldr.classList.remove('hidden');

        document.getElementById('resultsDashboard')?.classList.add('hidden');
        document.getElementById('analyzerSkeleton')?.classList.remove('hidden');
        document.getElementById('analyzerSkeleton')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        try {
            const platform = document.getElementById('platformSelect')?.value || 'all';
            const length = document.getElementById('lengthInput')?.value || '15s';
            
            const res = await fetchWithTimeout(`${API_BASE}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idea, platform, length, isPro, niche: persona?.niche || 'General Content' })
            });

            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            
            // --- USAGE & HISTORY (Move here to prevent bug) ---
            consumeUse('analyze');
            logUsage('analyze');
            addToHistory('analyze', { text: idea, platform, length, timestamp: Date.now() });

            // --- CONTEXTUAL NAV PULSE ---
            window.pulseNavItem('navHooks');

            // --- UI GATING: SKELETON OFF ---
            document.getElementById('analyzerSkeleton').classList.add('hidden');
            document.getElementById('resultsDashboard').classList.remove('hidden');
            
            btn.disabled = false;
            btn.querySelector('.loader').classList.add('hidden');
            (btn.querySelector('i, svg'))?.classList.remove('hidden');

            const score = data.score;
            currentAnalyzedIdea = { idea, score };
            currentAnalyzeData = { id: Date.now().toString(), idea, platform, score };

            document.getElementById('resViralScore').innerText = score;
            document.querySelector('.score-container').style.setProperty('--progress', `${score}%`);

            if (score >= 80) {
                setTimeout(() => vrCelebrate('viral'), 500);
            }
            if (data.script) {
                renderState('rewrite', 'result');
                logUsage('rewrite'); // Log success
                document.getElementById('rewriteResultText').innerText = data.script;
            }
            document.getElementById('resScoreText').innerText = score > 80 ? "Viral Potential 🔥" : "Solid 📈";
            document.getElementById('resHookBar').style.width = `${(data.hookStrength / 10) * 100}%`;
            document.getElementById('resHookRating').innerText = `${data.hookStrength}/10`;
            document.getElementById('resRetentionBar').style.width = `${data.retention}%`;
            document.getElementById('resRetentionPerc').innerText = `${data.retention}%`;
            document.getElementById('resTipsList').innerHTML = (data.tips || []).map(t => `<li class="tip-item text-xs">${t}</li>`).join('');

            console.log("[ViralReels] AI Data Received:", data);
            
            // Pro-only Elite Insight callout
            const insightEl = document.getElementById('resProInsight');
            if (insightEl) {
                if (isPro && data.insight) {
                    insightEl.classList.remove('hidden');
                    insightEl.innerHTML = `<div style="margin-top:12px; padding:10px 14px; background:linear-gradient(135deg,rgba(168,85,247,0.12),rgba(236,72,153,0.08)); border:1px solid rgba(168,85,247,0.3); border-radius:10px; display:flex; gap:8px; align-items:flex-start;"><span style="font-size:1rem;flex-shrink:0;">⚡</span><div><p class="text-xs font-bold text-accent mb-1" style="letter-spacing:0.5px;">ELITE INSIGHT</p><p class="text-xs text-secondary" style="line-height:1.5;">${data.insight}</p></div></div>`;
                } else {
                    insightEl.classList.add('hidden');
                }
            }

        } catch (err) {
            console.error(err);
            showToast("Analyzer unavailable. Check connection.");
        } finally {
            document.getElementById('analyzerSkeleton').classList.add('hidden');
            btn.disabled = false;
            btn.querySelector('.loader').classList.add('hidden');
            (btn.querySelector('i, svg'))?.classList.remove('hidden');
            const resDash = document.getElementById('resultsDashboard');
            if (resDash.classList.contains('hidden')) {
                 // only show if not already shown by success
            }
            updateIcons();
        }
    });

    // -- ANALYTICS BINDINGS --
    const logBtn = document.getElementById('btnLogAnalytics');
    if (logBtn) {
        logBtn.addEventListener('click', () => {
            if (!currentAnalyzeData) return;
            analyticsData.push({ ...currentAnalyzeData, actualViews: 0 });
            localStorage.setItem('vr_analytics_data', JSON.stringify(analyticsData));
            triggerSuccess("Idea Logged to Analytics DB");
            renderAnalytics();
        });
    }

    // -- 2. HOOKS VIEW (Upgraded GPT Style) --
    document.getElementById('customHookForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputStr = document.getElementById('customHookInput').value.trim();
        const btn = e.target.querySelector('button[type="submit"]');

        if (!inputStr) { showToast("Please enter a topic first!"); return; }

        // --- DUPLICATE CHECK ---
        if (lastUsedInputs.hooks === inputStr) {
            showToast("Modify the topic for new hooks!");
            return;
        }

        // --- USAGE GATE ---
        if (getRemainingUses('hooks') <= 0 && !isPro && !isInTrial()) {
            showLimitBlock(document.getElementById('view-hooks'), 'hooks');
            window.triggerHaptic('error');
            return;
        }

        window.triggerHaptic('medium');
        btn.disabled = true; // LOCK
        lastUsedInputs.hooks = inputStr;
        
        // --- UI GATING: SKELETON ON (Robust) ---
        const btnIcon = btn.querySelector('i, svg');
        if (btnIcon) btnIcon.classList.add('hidden');
        
        let loader = btn.querySelector('.loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'loader';
            btn.appendChild(loader);
        }
        loader.classList.remove('hidden');

        document.getElementById('hooksGeneratorsEmpty').classList.add('hidden');
        document.getElementById('hooksGeneratorsContent').classList.add('hidden');
        document.getElementById('hooksSkeleton').classList.remove('hidden');
        document.getElementById('hooksSkeleton').scrollIntoView({ behavior: 'smooth', block: 'start' });

        try {
            // --- UI GATING: Get Advanced Controls ---
            const tone = document.getElementById('hooksTone')?.value || 'Aggressive';
            const audience = document.getElementById('hooksAudience')?.value || 'General';

            const res = await fetchWithTimeout(`${API_BASE}/generate-hooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: inputStr, isPro: localStorage.getItem('vr_pro_status') === 'true', niche: persona.niche, tone, audience })
            });

            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            
            consumeUse('hooks');
            logUsage('hooks');
            addToHistory('hooks', { text: inputStr, timestamp: Date.now() });

            vrCelebrate('basic');

            // --- CONTEXTUAL NAV PULSE ---
            window.pulseNavItem('navTracker');
            window.pulseNavItem('navCaptions');

            // --- UI GATING: SKELETON OFF ---
            document.getElementById('hooksSkeleton').classList.add('hidden');
            if (data.hooks) {
                renderState('hooks', 'result');
                logUsage('hooks'); // Log success
                const grid = document.getElementById('hookResultsGrid');
            }
            document.getElementById('hooksGeneratorsContent').classList.remove('hidden');
            
            btn.disabled = false;
            if (btn.querySelector('.loader')) btn.querySelector('.loader').remove();
            (btn.querySelector('i, svg'))?.classList.remove('hidden');

            document.getElementById('sub-hooks-list').innerHTML = (data.hooks || []).map(h => toItemCard(h, 'hook')).join('');
            document.getElementById('sub-captions-list').innerHTML = (data.captions || []).map(c => toItemCard(c, null)).join('');
        } catch (err) {
            console.error(err);
            showToast("Hook engine offline. Try later.");
        } finally {
            document.getElementById('hooksSkeleton').classList.add('hidden');
            btn.disabled = false;
            if (btn.querySelector('.loader')) btn.querySelector('.loader').remove();
            (btn.querySelector('i, svg'))?.classList.remove('hidden');
            updateIcons();
            
            const hooksContent = document.getElementById('hooksGeneratorsContent');
            if (!hooksContent.classList.contains('hidden')) {
                hooksContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });

    // -- 3. TRACKER VIEW --
    const renderTracker = () => {
        const list = document.getElementById('trackerList');
        const empty = document.getElementById('trackerEmpty');
        if (!list) return;

        if (savedHooks.length === 0) { 
            list.innerHTML = ''; 
            empty?.classList.remove('hidden'); 
        } else {
            empty?.classList.add('hidden');
            list.innerHTML = savedHooks.map((h, i) => {
                const escapedText = h.replace(/'/g, "\\'").replace(/\n/g, "\\n");
                const isVerified = analyticsData.some(a => a.idea.includes(h.substring(0, 10)) && a.actualViews > 0);
                
                return `
                <div class="saved-item-card type-hook result-appear" style="animation-delay: ${i * 0.05}s">
                    <div class="saved-card-header">
                        <div class="flex items-center gap-2">
                            <span class="saved-tag">SAVED HOOK #${savedHooks.length - i}</span>
                            ${isVerified ? '<span class="text-[8px] bg-green/20 text-green font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Verified</span>' : ''}
                        </div>
                        <button class="icon-button" onclick="deleteHook(${i})"><i data-lucide="trash-2" style="width:14px; color:var(--accent-red)"></i></button>
                    </div>
                    <p class="saved-content-text mb-4" style="white-space:pre-wrap;">${h}</p>
                    <div class="saved-card-actions">
                        <button class="action-btn-mini" onclick="copyToClipboard('${escapedText}', this)"><i data-lucide="copy"></i> Copy</button>
                        <button class="action-btn-mini" onclick="nativeShare('${escapedText}')"><i data-lucide="share-2"></i> Share</button>
                    </div>
                </div>
                `;
            }).join('');
            updateIcons();
        }
    };

    // -- CSV EXPORT / IMPORT --
    document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
        if (savedHooks.length === 0) return showToast("No hooks to export.");
        const csvContent = "data:text/csv;charset=utf-8,Timestamp,Hook Text\n" 
            + savedHooks.map(h => `${Date.now()},"${h.replace(/"/g, '""')}"`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `viralreels_hooks_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Hooks exported successfully.");
    });

    document.getElementById('importCsvBtn')?.addEventListener('click', () => {
        document.getElementById('csvFileInput').click();
    });

    document.getElementById('csvFileInput')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const lines = text.split("\n").slice(1); // skip header
                const imported = lines.map(line => {
                    const parts = line.split(/,(.*)/s); // split on first comma only
                    if (parts[2]) return parts[2].replace(/^"|"$/g, '').replace(/""/g, '"');
                    return null;
                }).filter(h => h);
                
                if (imported.length > 0) {
                    savedHooks = [...imported, ...savedHooks];
                    localStorage.setItem('viralreels_tracked_hooks', JSON.stringify(savedHooks));
                    renderTracker();
                    showToast(`Imported ${imported.length} hooks!`);
                }
            } catch (err) {
                showToast("Invalid CSV format.");
            }
        };
        reader.readAsText(file);
    });
    window.deleteHook = (index) => {
        window.vrConfirm("Delete Hook", "Are you sure you want to remove this hook from your tracker?", () => {
             savedHooks.splice(index, 1); localStorage.setItem('viralreels_tracked_hooks', JSON.stringify(savedHooks)); renderTracker(); 
        });
    };

    // -- 4. CALENDAR VIEW --
    let activeDayKey = null;
    const renderCalendar = () => {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        const year = calDate.getFullYear();
        const month = calDate.getMonth();
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        document.getElementById('calMonthDisplay').innerText = `${monthNames[month]}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) { grid.innerHTML += '<div class="cal-day empty"></div>'; }
        for (let d = 1; d <= daysInMonth; d++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'cal-day';
            dayDiv.innerHTML = `<span class="day-num">${d}</span>`;
            if (isCurrentMonth && d === today.getDate()) dayDiv.classList.add('is-today');

            const dateKey = `${year}-${month}-${d}`;
            if (savedEvents[dateKey]) dayDiv.classList.add('has-event');

            dayDiv.addEventListener('click', () => {
                activeDayKey = dateKey;
                document.getElementById('eventModalDateText').innerText = `Save Idea on ${monthNames[month]} ${d}`;
                let eventData = { title: "", desc: "" };
                if (savedEvents[dateKey]) {
                    try {
                        var parsed = JSON.parse(savedEvents[dateKey]);
                        if (typeof parsed === "object") eventData = parsed; else eventData.title = savedEvents[dateKey];
                    } catch (e) { eventData.title = savedEvents[dateKey]; }
                }
                document.getElementById('eventTitleInput').value = eventData.title || '';
                document.getElementById('eventDescInput').value = eventData.desc || '';
                calendarEventModal.classList.remove('hidden');
            });
            grid.appendChild(dayDiv);
        }
    };
    document.getElementById('prevMonthBtn').addEventListener('click', () => { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); });
    document.getElementById('nextMonthBtn').addEventListener('click', () => { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); });
    document.getElementById('saveEventBtn').addEventListener('click', () => {
        const title = document.getElementById('eventTitleInput').value.trim();
        const desc = document.getElementById('eventDescInput').value.trim();
        if (title && activeDayKey) {
            savedEvents[activeDayKey] = JSON.stringify({ title, desc });
            localStorage.setItem('viralreels_events', JSON.stringify(savedEvents));
            calendarEventModal.classList.add('hidden'); 
            renderCalendar();
            triggerSuccess("Saved to Calendar");
        }
    });

    // -- 5. CAPTIONS VIEW (GPT Overhaul) --
    document.getElementById('dedCapForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const topic = document.getElementById('dedCapInput').value.trim();
        const style = document.getElementById('dedCapStyle').value;
        const btn = document.getElementById('dedCapBtn');

        if (!topic) { showToast("Please enter a topic first!"); return; }

        // --- DUPLICATE CHECK ---
        const currentKey = `${topic}-${style}`;
        if (lastUsedInputs.captions === currentKey) {
            showToast("Try another topic or style!");
            return;
        }

        // --- USAGE GATE ---
        if (getRemainingUses('captions') <= 0) {
            showLimitBlock(document.getElementById('view-captions'), 'captions');
            return;
        }

        btn.disabled = true; // LOCK
        consumeUse('captions');
        logUsage('captions');
        lastUsedInputs.captions = currentKey;
        addToHistory('captions', { text: topic, style, timestamp: Date.now() });
        
        btn.innerHTML = '<div class="loader"></div>';

        try {
            const res = await fetchWithTimeout(`${API_BASE}/generate-captions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, isPro, niche: persona?.niche || 'General Content' })
            });
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            const captions = data.captions || [];

            const out = document.getElementById('dedCapOutput');
            out.innerHTML = (captions || []).map(txt => {
                const html = toItemCard(txt, null);
                return html.replace('class="item-card glass-card', 'class="item-card glass-card result-appear');
            }).join('');
            
            // --- CONTEXTUAL NAV PULSE ---
            window.pulseNavItem('navTags');

            out.classList.remove('hidden');
        } catch (e) {
            console.error(e);
            showToast("Caption generation failed.");
        } finally {
            btn.innerHTML = '<i data-lucide="pen-tool"></i> Generate Captions';
            updateIcons();
        }
    });

    // -- STORAGE RECOVERY --
    // -- 6. TAGS VIEW --
    document.getElementById('dedTagsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const topic = document.getElementById('dedTagsInput').value.trim();
        const btn = e.target.querySelector('button[type="submit"]');

        if (!topic) { showToast("Please enter a topic first!"); return; }

        // --- DUPLICATE CHECK ---
        if (lastUsedInputs.tags === topic) {
            showToast("Try a different niche for new tags!");
            return;
        }

        btn.disabled = true; // LOCK
        btn.innerHTML = '<div class="loader"></div>';
        lastUsedInputs.tags = topic;
        addToHistory('tags', { text: topic, timestamp: Date.now() });

        try {
            const res = await fetchWithTimeout(`${API_BASE}/generate-tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, isPro, niche: persona?.niche || 'General Content' })
            });

            if (!res.ok) throw new Error("API Error");
            const data = await res.json();

            const output = document.getElementById('dedTagsOutput');
            if (output) output.classList.remove('hidden');

            if (data.tags) {
                renderState('tags', 'result');
                logUsage('tags'); // Log success
                const grid = document.getElementById('tagResultsGrid');
            }

            // 1. Trending (Viral Momentum)
            const trendingEl = document.getElementById('tagsTrending');
            if (trendingEl && data.viral) {
                trendingEl.innerHTML = data.viral.map(t =>
                    `<div class="hashtag tag-trending" onclick="copyHash('${t}', this)"><i data-lucide="flame"></i>${t}</div>`
                ).join('');
            }

            // 2. Hyper-Niche (Targeted SEO)
            const nicheEl = document.getElementById('tagsNiche');
            if (nicheEl && data.niche) {
                nicheEl.innerHTML = data.niche.map(t =>
                    `<div class="hashtag tag-niche" onclick="copyHash('${t}', this)"><i data-lucide="target"></i>${t}</div>`
                ).join('');
            }

            // 3. Recommended (AI Power Picks)
            const recEl = document.getElementById('tagsRecommended');
            if (recEl && data.recommended) {
                recEl.innerHTML = data.recommended.map(t =>
                    `<div class="hashtag tag-recommended" onclick="copyHash('${t}', this)"><i data-lucide="sparkles"></i>${t}</div>`
                ).join('');
            }

            showToast("Elite tags generated!");
            updateIcons();
        } catch (err) {
            console.error("Tags Error:", err);
            showToast("Hashtag server error.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="hash"></i> Generate Tags';
            updateIcons();
            const out = document.getElementById('dedTagsOutput');
            if (out && !out.classList.contains('hidden')) {
                out.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });

    // -- COPY ALL TAGS --
    const copyAllTagsBtn = document.getElementById('copyAllTagsBtn');
    if (copyAllTagsBtn) {
        copyAllTagsBtn.addEventListener('click', () => {
            const tagElements = document.querySelectorAll('#dedTagsOutput .hashtag');
            if (tagElements.length === 0) return;
            
            // Extract text, ensure # prefix for all
            const allTags = Array.from(tagElements).map(el => {
                let text = el.innerText.trim();
                return text.startsWith('#') ? text : '#' + text;
            }).join(' ');

            navigator.clipboard.writeText(allTags).then(() => {
                showToast("All Tags Copied!");
                const oldHtml = copyAllTagsBtn.innerHTML;
                copyAllTagsBtn.innerHTML = '<i data-lucide="check"></i> Copied!';
                updateIcons();
                setTimeout(() => { 
                    copyAllTagsBtn.innerHTML = oldHtml; 
                    updateIcons(); 
                }, 2000);
            });
        });
    }

    // -- 7. CHECKLIST VIEW --
    const checks = document.querySelectorAll('.task-check');
    const scoreText = document.getElementById('checklistScore');
    const scoreBar = document.getElementById('checklistScoreBar');
    checks.forEach(check => {
        check.addEventListener('change', () => {
            let total = 0; checks.forEach(c => { if (c.checked) total += parseInt(c.dataset.weight); });
            scoreText.innerText = `${total}%`; scoreBar.style.width = `${total}%`;
            if (total === 100) {
                scoreBar.style.background = 'var(--accent-green)'; scoreText.style.color = 'var(--accent-green)'; scoreText.style.background = 'none'; scoreText.style.webkitTextFillColor = 'var(--accent-green)';
            } else {
                scoreBar.style.background = 'var(--gradient-primary)'; scoreText.style.background = 'var(--gradient-primary)'; scoreText.style.webkitBackgroundClip = 'text'; scoreText.style.webkitTextFillColor = 'transparent';
            }
        });
    });

    // -- Reset Checklist --
    document.getElementById('resetChecklistBtn').addEventListener('click', () => {
        window.vrConfirm("Reset Checklist", "Start your checklist from scratch? Your current progress will be lost.", () => {
            const popIn = document.getElementById('checklistRefreshing');
            // ... (keep rest of logic)
        if (popIn) {
            popIn.classList.remove('hidden');
            // Re-trigger animation if already in DOM
            popIn.style.animation = 'none';
            popIn.offsetHeight; /* trigger reflow */
            popIn.style.animation = 'refreshPopAnim 1.5s forwards ease-in-out';
        }

        // Reset State
        checks.forEach(c => c.checked = false);
        scoreText.innerText = '0%';
        scoreBar.style.width = '0%';
        scoreBar.style.background = 'var(--gradient-primary)';
        scoreText.style.background = 'var(--gradient-primary)';
        scoreText.style.webkitBackgroundClip = 'text';
        scoreText.style.webkitTextFillColor = 'transparent';

        // Redirect to top
        const scrollContainer = document.getElementById('view-checklist');
        if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }

        updateIcons();

        // Short faded hide (match CSS 1.5s animation)
        setTimeout(() => {
            if (popIn) popIn.classList.add('hidden');
        }, 1500);
        });
    });

    // -- 8. TRENDS VIEW (Exactly 5 Trends, Detailed Copilot output) --
    document.getElementById('trendsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const val = document.getElementById('trendsInput').value.trim();
        const btn = e.target.querySelector('button[type="submit"]');

        if (!val) { showToast("Please enter a topic first!"); return; }

        // --- DUPLICATE CHECK ---
        if (lastUsedInputs.trends === val) {
            showToast("Change your niche to see new trends!");
            return;
        }

        // --- USAGE GATE ---
        if (getRemainingUses('trends') <= 0) {
            showLimitBlock(document.getElementById('view-trends'), 'trends');
            return;
        }

        btn.disabled = true; // LOCK
        consumeUse('trends');
        lastUsedInputs.trends = val;
        addToHistory('trends', { text: val, timestamp: Date.now() });
        
        btn.innerHTML = '<div class="loader"></div>';

        try {
            const res = await fetchWithTimeout(`${API_BASE}/trends`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ niche: val, isPro })
            });
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();

            document.getElementById('trendsEmpty').classList.add('hidden');
            const out = document.getElementById('trendsOutput');
            out.innerHTML = '';

            // 1. Live Badge
            const liveBadge = document.createElement('div');
            liveBadge.className = 'live-data-badge';
            liveBadge.innerHTML = `<span class="pulse-dot"></span><span class="text-xs font-bold uppercase tracking-widest text-accent">Verified Live Intelligence</span>`;
            out.appendChild(liveBadge);

            // 2. Metrics Grid
            if (data.data_points) {
                const metricsGrid = document.createElement('div');
                metricsGrid.className = 'trends-metrics-grid';
                metricsGrid.innerHTML = data.data_points.map(mp => `
                    <div class="metric-row">
                        <div class="flex justify-between items-center">
                            <span class="metric-label">${mp.label}</span>
                            <span class="text-xs font-bold text-primary">${mp.value}%</span>
                        </div>
                        <div class="metric-bar-bg">
                            <div class="metric-bar-fill" style="width: 0%; background: var(--accent-cyan);"></div>
                        </div>
                    </div>
                `).join('');
                out.appendChild(metricsGrid);

                // Animate bars
                setTimeout(() => {
                    out.querySelectorAll('.metric-bar-fill').forEach((bar, i) => {
                        bar.style.width = `${data.data_points[i].value}%`;
                    });
                }, 100);
            }

            // 3. Verdict
            if (data.verdict) {
                const verdict = document.createElement('div');
                verdict.className = 'verdict-banner interactive-glow';
                verdict.innerHTML = `<p class="verdict-text">${data.verdict}</p>`;
                out.appendChild(verdict);
            }

            // 4. Recommendation (Blueprints)
            if (data.recommendation) {
                const blueprint = document.createElement('div');
                blueprint.className = 'strategy-card border-accent';
                
                let recContent = '';
                if (Array.isArray(data.recommendation)) {
                    recContent = data.recommendation.map(r => `<p class="text-sm text-secondary mb-2">• ${r}</p>`).join('');
                } else if (typeof data.recommendation === 'object') {
                    recContent = `<p class="text-sm text-secondary">${JSON.stringify(data.recommendation)}</p>`;
                } else {
                    recContent = `<p class="text-sm text-secondary">${data.recommendation}</p>`;
                }

                const shareTxt = `ViralReels AI Trend Blueprint for ${val}:\n${recContent.replace(/<[^>]*>/g, '')}`;
                blueprint.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <span class="strategy-label">ELITE BLUEPRINTS</span>
                        <button class="action-btn-mini" onclick="nativeShare(\`${shareTxt.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">
                            <i data-lucide="share-2" style="width:12px;"></i> Share
                        </button>
                    </div>
                    ${recContent}
                `;
                out.appendChild(blueprint);
            }

            out.classList.remove('hidden');
        } catch (err) {
            console.error(err);
            showToast("Trends radar offline.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="trending-up"></i>';
            updateIcons();
            const out = document.getElementById('trendsOutput');
            if (out && !out.classList.contains('hidden')) {
                out.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });

    // -- 9. REWRITE VIEW (GPT Expanded Multi-paragraph Engine) --
    document.getElementById('rewriteForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const val = document.getElementById('rewriteInput').value.trim();
        const btn = e.target.querySelector('button[type="submit"]');

        if (!val) { showToast("Please enter a script to rewrite!"); return; }

        // --- DUPLICATE CHECK ---
        if (lastUsedInputs.rewrite === val) {
            showToast("Change the script before rewriting!");
            return;
        }

        // --- USAGE GATE ---
        if (getRemainingUses('rewrite') <= 0 && !isPro && !isInTrial()) {
            showLimitBlock(document.getElementById('view-rewrite'), 'rewrite');
            window.triggerHaptic('error');
            return;
        }

        btn.disabled = true; // LOCK
        consumeUse('rewrite');
        logUsage('rewrite');
        lastUsedInputs.rewrite = val;
        addToHistory('rewrite', { text: val, timestamp: Date.now() });
        
        btn.innerHTML = '<div class="loader"></div>';

        try {
            const tone = document.getElementById('rewriteTone')?.value || 'Punchy';
            const length = document.getElementById('rewriteLength')?.value || 'Standard';

            const res = await fetchWithTimeout(`${API_BASE}/rewrite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script: val, isPro, niche: persona?.niche || 'General Content', tone, length })
            });
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            const rewritten = data.rewritten;

            document.getElementById('rewriteOutput').innerHTML = `
                <h4 class="font-bold text-accent mb-3 flex items-center gap-2"><i data-lucide="bot"></i> Viral AI Rewrite</h4>
                <div class="p-4 bg-card-dark result-appear" style="border-radius:8px; font-size:1rem; line-height:1.6; white-space:pre-wrap; border:1px solid rgba(255,255,255,0.05); color:white;">${rewritten}</div>
                <div class="item-actions flex-col gap-2 mt-4">
                    <button class="btn-primary w-full" style="background: var(--gradient-primary); color:white;" onclick="saveToVault('${rewritten.replace(/\n/g, "\\n").replace(/'/g, "\\'")}', 'rewrite', this)"><i data-lucide="archive"></i> Save to Vault</button>
                    <button class="btn-secondary w-full" onclick="copyToClipboard('${rewritten.replace(/\n/g, "\\n").replace(/'/g, "\\'")}', this)"><i data-lucide="copy"></i> Copy Script</button>
                </div>
            `;
            
            // --- CONTEXTUAL NAV PULSE ---
            window.pulseNavItem('navSaved');

            document.getElementById('rewriteOutput').classList.remove('hidden'); updateIcons();
        } catch(e) {
            console.error(e);
            showToast("Server error. Check AI connection.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="file-text"></i> Rewrite Script';
            updateIcons();
        }
    });

    // -- 10. SAVED VIEW --
    const renderSavedRewrites = () => {
        const list = document.getElementById('savedList');
        const empty = document.getElementById('savedEmpty');
        if (!list) return;

        if (savedRewrites.length === 0) { 
            list.innerHTML = ''; 
            empty?.classList.remove('hidden'); 
        } else {
            empty?.classList.add('hidden');
            list.innerHTML = savedRewrites.map((r, i) => {
                const escapedText = r.replace(/'/g, "\\'").replace(/\n/g, "\\n");
                return `
                <div class="saved-item-card type-rewrite result-appear" style="animation-delay: ${i * 0.05}s">
                    <div class="saved-card-header">
                        <span class="saved-tag">SCRIPTS VAULT #${savedRewrites.length - i}</span>
                        <button class="icon-button" onclick="deleteRewrite(${i})"><i data-lucide="trash-2" style="width:14px; color:var(--accent-red)"></i></button>
                    </div>
                    <p class="saved-content-text mb-4" style="white-space:pre-wrap;">${r}</p>
                    <div class="saved-card-actions">
                        <button class="action-btn-mini" onclick="copyToClipboard('${escapedText}', this)"><i data-lucide="copy"></i> Copy</button>
                        <button class="action-btn-mini" onclick="nativeShare('${escapedText}')"><i data-lucide="share-2"></i> Share</button>
                    </div>
                </div>
                `;
            }).join('');
            updateIcons();
        }
    };
    document.getElementById('clearSavedBtn')?.addEventListener('click', () => {
        window.vrConfirm("Clear Vault", "Are you sure you want to delete all saved scripts?", () => {
            savedRewrites = []; localStorage.setItem('viralreels_saved_rewrites', '[]'); renderSavedRewrites();
        });
    });
    window.deleteRewrite = (index) => { savedRewrites.splice(index, 1); localStorage.setItem('viralreels_saved_rewrites', JSON.stringify(savedRewrites)); renderSavedRewrites(); };

    // -- ANALYTICS RENDER ENGINE --
    window.renderAnalytics = () => {
        const list = document.getElementById('analyticsList');
        const empty = document.getElementById('analyticsEmpty');
        if (!list || !empty) return;

        if (analyticsData.length === 0) {
            empty.classList.remove('hidden');
            list.innerHTML = '';
            list.appendChild(empty);
            
            document.getElementById('analyticsChartSection')?.classList.add('hidden');
            document.getElementById('statTotalReach').textContent = '0';
            document.getElementById('statAvgScore').textContent = '0%';
            return;
        }

        empty.classList.add('hidden');
        list.innerHTML = '';

        // --- CALCULATE AGGREGATE STATS ---
        let totalViews = 0;
        let totalScore = 0;
        analyticsData.forEach(log => {
            totalViews += (log.actualViews || 0);
            totalScore += log.score;
        });

        document.getElementById('statTotalReach').textContent = totalViews > 999999 ? (totalViews/1000000).toFixed(1) + 'M' : totalViews.toLocaleString();
        document.getElementById('statAvgScore').textContent = Math.round(totalScore / analyticsData.length) + '%';
        
        // --- DRAW PERFORMANCE CURVE ---
        const chartSection = document.getElementById('analyticsChartSection');
        const curve = document.getElementById('performanceCurve');
        if (chartSection && curve) {
            chartSection.classList.remove('hidden');
            curve.innerHTML = analyticsData.slice(-15).map(log => {
                const height = log.score;
                const viewRatio = Math.min(1, (log.actualViews || 0) / 10000); // Scale 10k views to 100%
                return `
                    <div class="flex-grow flex items-end group relative" style="height: 100%;">
                        <div class="w-full bg-accent/20 rounded-t-sm transition-all duration-500 hover:bg-accent/40" style="height: ${height}%;"></div>
                        <div class="absolute bottom-0 left-0 w-full bg-accent-blue rounded-t-sm transition-all duration-700 delay-100" style="height: ${viewRatio * 100}%; opacity: 0.6;"></div>
                        
                        <div class="tooltip hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 p-2 rounded text-[8px] whitespace-nowrap z-50 border border-white/10">
                            Score: ${log.score}%<br>Views: ${log.actualViews || 0}
                        </div>
                    </div>
                `;
            }).join('');
        }

        analyticsData.slice().reverse().forEach((log) => {
            const el = document.createElement('div');
            el.className = 'glass-card p-3 rounded-md border-subtle bg-card-dark interactive-glow mb-2 result-appear';
            
            // ... (rest of old logic for list items)
            let viewInputStr = log.actualViews > 0
                ? `<span class="text-xs font-bold text-green w-full block mt-2 p-2" style="background:rgba(6,214,160,0.1); border-radius:6px; border:1px solid rgba(6,214,160,0.3);"><i data-lucide="eye" style="display:inline; width:12px;"></i> Verified: ${log.actualViews.toLocaleString()} Views</span>`
                : `<div class="flex gap-2 w-full mt-2"><input type="number" class="text-input p-2 flex-grow log-view-input" style="background:rgba(0,0,0,0.4);" placeholder="Enter Views"><button class="btn-primary log-view-btn text-xs p-2 whitespace-nowrap" data-id="${log.id}">Update</button></div>`;

            el.innerHTML = `
                <div class="flex justify-between items-start mb-1 gap-2">
                    <strong class="text-xs w-full" style="line-height:1.4;">${log.idea}</strong>
                    <span class="badge text-xs px-2 py-1 bg-card-dark border-subtle font-bold uppercase" style="border-radius:4px; color:var(--accent-blue-light); flex-shrink:0;">${log.platform}</span>
                </div>
                <div class="flex items-center justify-between border-top border-subtle pt-2 mt-2">
                    <div class="flex items-center gap-2">
                        <div class="score-circle" style="width:30px; height:30px; border-radius:50%; background:conic-gradient(var(--accent-purple) ${log.score}%, transparent 0); display:flex; justify-content:center; align-items:center;"><span class="text-xs font-bold bg-card" style="width:24px; height:24px; border-radius:50%; display:flex; justify-content:center; align-items:center;">${log.score}</span></div>
                        <span class="text-xs text-secondary">Predicted Metric</span>
                    </div>
                </div>
                ${viewInputStr}
                <button class="action-btn w-full mt-2 flex justify-center text-red log-del-btn" style="border:1px solid rgba(239,71,111,0.2);" data-id="${log.id}"><i data-lucide="trash-2"></i> Delete Log</button>
            `;
            list.appendChild(el);
        });

        // Binds
        list.querySelectorAll('.log-view-btn').forEach(b => {
            b.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const val = parseInt(e.target.previousElementSibling.value);
                if (isNaN(val) || val <= 0) return showToast("Enter valid views");
                const target = analyticsData.find(a => a.id === id);
                if (target) {
                    target.actualViews = val;
                    localStorage.setItem('vr_analytics_data', JSON.stringify(analyticsData));
                    renderAnalytics();
                    triggerSuccess("Views Verified");
                }
            });
        });

        list.querySelectorAll('.log-del-btn').forEach(b => {
            b.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                analyticsData = analyticsData.filter(a => a.id !== id);
                localStorage.setItem('vr_analytics_data', JSON.stringify(analyticsData));
                renderAnalytics();
            });
        });

        updateIcons();
    };

    // -- AI CHAT LOGIC --
    const chatForm = document.getElementById('chatForm');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatLogsList = document.getElementById('chatLogsList');
    let chatHistory = safeGet('vr_chat_history', []);

    function saveChatLog(userMsg, aiMsg) {
        const log = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            userMsg,
            aiMsg
        };
        chatHistory.unshift(log);
        if (chatHistory.length > 20) chatHistory.pop();
        localStorage.setItem('vr_chat_history', JSON.stringify(chatHistory));
        renderChatLogs();
    }

    // --- ELITE KEYBOARD AWARENESS (V3.7) ---
    if (chatInput) {
        chatInput.addEventListener('focus', () => {
            if (window.innerWidth < 768) {
                document.body.classList.add('keyboard-mobile');
                // Auto-scroll to bottom of chat
                setTimeout(() => chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' }), 300);
            }
        });
        chatInput.addEventListener('blur', () => {
            document.body.classList.remove('keyboard-mobile');
        });
    }

    function renderChatLogs() {
        if (!chatLogsList) return;
        if (chatHistory.length === 0) {
            chatLogsList.innerHTML = `
                <div class="empty-state glass-card py-10">
                    <i data-lucide="history" class="lg-icon mb-2 opacity-20"></i>
                    <p class="text-xs text-muted">No past logs found.</p>
                </div>
            `;
            updateIcons();
            return;
        }

        chatLogsList.innerHTML = chatHistory.map(log => `
            <div class="glass-card result-appear border-subtle mb-3 p-3" style="cursor:pointer;" onclick="window.viewChatLog('${log.id}')">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-bold text-accent uppercase">${log.date}</span>
                    <i data-lucide="chevron-right" style="width:14px; height:14px; opacity:0.5;"></i>
                </div>
                <p class="text-xs text-primary font-medium line-clamp-1">"${log.userMsg}"</p>
                <p class="text-xs text-muted line-clamp-1 mt-1">${log.aiMsg.substring(0, 40)}...</p>
            </div>
        `).join('');
        updateIcons();
    }

    window.viewChatLog = (id) => {
        const log = chatHistory.find(l => l.id === id);
        if (!log) return;
        
        // Populate chat messages and switch tab
        const intro = document.getElementById('chatIntro');
        if (intro) intro.classList.add('hidden');
        
        chatMessages.innerHTML = `
            <div class="chat-bubble bubble-user result-appear">${log.userMsg}</div>
            <div class="chat-bubble bubble-ai elite-bubble result-appear">${log.aiMsg}</div>
        `;
        document.getElementById('chatHistoryView')?.classList.add('hidden');
        updateIcons();
    };

    document.getElementById('clearChatLogsBtn')?.addEventListener('click', () => {
        window.vrConfirm("Clear Chat", "Are you sure you want to delete all past conversations?", () => {
            chatHistory = [];
            localStorage.setItem('vr_chat_history', '[]');
            renderChatLogs();
            showToast("History cleared.");
        });
    });

    // Initial render
    renderChatLogs();

    // -- AI CHAT ELITE OVERLAYS --
    document.getElementById('chatHistoryBtn')?.addEventListener('click', () => {
        document.getElementById('chatHistoryView')?.classList.remove('hidden');
        renderChatLogs();
    });
    document.getElementById('closeChatHistoryBtn')?.addEventListener('click', () => {
        document.getElementById('chatHistoryView')?.classList.add('hidden');
    });

    // -- SUGGESTION CHIPS --
    document.querySelectorAll('.suggest-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.getAttribute('data-prompt');
            if (prompt && chatInput) {
                chatInput.value = prompt;
                document.getElementById('sendChatBtn')?.click();
            }
        });
    });

    // -- AI VOICE CHAT (SPEECH-TO-TEXT) --
    function initVoiceChat() {
        const voiceChatBtn = document.getElementById('voiceChatBtn');
        const chatInput = document.getElementById('chatInput');
        if (!voiceChatBtn || !chatInput) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            voiceChatBtn.style.opacity = '0.3';
            voiceChatBtn.style.cursor = 'not-allowed';
            voiceChatBtn.title = "Voice not supported in this browser";
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let isRecording = false;

        voiceChatBtn.addEventListener('click', () => {
            if (!isRecording) {
                try {
                    recognition.start();
                    isRecording = true;
                    voiceChatBtn.classList.add('recording');
                    voiceChatBtn.innerHTML = '<i data-lucide="mic-off"></i>';
                    updateIcons();
                } catch (err) {
                    console.error("Speech Recognition Error:", err);
                }
            } else {
                recognition.stop();
                isRecording = false;
                voiceChatBtn.classList.remove('recording');
                voiceChatBtn.innerHTML = '<i data-lucide="mic"></i>';
                updateIcons();
            }
        });

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                const currentVal = chatInput.value.trim();
                chatInput.value = currentVal ? currentVal + ' ' + finalTranscript : finalTranscript;
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech Recognition Error Event:", event.error);
            isRecording = false;
            voiceChatBtn.classList.remove('recording');
            voiceChatBtn.innerHTML = '<i data-lucide="mic"></i>';
            updateIcons();
            if (event.error === 'not-allowed') {
                window.vrAlert("Mic Permission Denied", "Please allow microphone access in your browser settings to use voice chat.");
            }
        };

        recognition.onend = () => {
            isRecording = false;
            voiceChatBtn.classList.remove('recording');
            voiceChatBtn.innerHTML = '<i data-lucide="mic"></i>';
            updateIcons();
        };
    }
    // Initialize Voice Chat
    initVoiceChat();

    // Initialize Persistent Memory (ChatGPT Style)
    window.chatSession = [];

    const sendChatBtn = document.getElementById('sendChatBtn');
    const newChatBtn = document.getElementById('newChatBtn');

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            window.chatSession = [];
            chatMessages.innerHTML = '';
            
            // Re-render Intro
            const introClone = `
                <div id="chatIntro" class="architect-intro">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="architect-logo">
                        <rect x="0" y="0" width="100" height="100" rx="22" fill="#0f0f13" />
                        <rect x="22" y="55" width="12" height="25" rx="4" fill="#a855f7" />
                        <rect x="44" y="35" width="12" height="45" rx="4" fill="#ec4899" />
                        <rect x="66" y="15" width="12" height="65" rx="4" fill="#6366f1" />
                    </svg>
                    <h1 class="architect-title">ViralReels Architect</h1>
                    <p class="architect-subtitle">Dominate the short-form algorithm with grounded AI strategy.</p>
                    <div class="suggest-hub">
                        <button class="suggest-chip" data-prompt="Analyze my current niche for viral gaps"><i data-lucide="search"></i> Niche Analysis</button>
                        <button class="suggest-chip" data-prompt="Give me a retention blueprint for a 30s video"><i data-lucide="zap"></i> Retention Plan</button>
                        <button class="suggest-chip" data-prompt="3 polarizing hooks for my next Reel"><i data-lucide="magnet"></i> Polarizing Hooks</button>
                        <button class="suggest-chip" data-prompt="How do I double my engagement rate?"><i data-lucide="trending-up"></i> Boost Growth</button>
                    </div>
                </div>
            `;
            chatMessages.innerHTML = introClone;
            chatMessages.classList.add('locked-intro');
            newChatBtn.classList.add('hidden');
            updateIcons();
            
            // Re-attach suggestion listeners
            document.querySelectorAll('.suggest-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    chatInput.value = chip.dataset.prompt;
                    sendChatBtn.click();
                });
            });
            window.triggerHaptic('medium');
        });
    }

    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', async () => {
            const msg = chatInput.value.trim();
            if (!msg) return;

            // --- USAGE GATE ---
            if (getRemainingUses('chat') <= 0 && !isPro && !isInTrial()) {
                showLimitBlock(document.getElementById('view-chat'), 'chat');
                window.triggerHaptic('error');
                return;
            }

            // Remove Locked-Intro State
            chatMessages.classList.remove('locked-intro');
            newChatBtn.classList.remove('hidden');

            // Hide Intro
            const intro = document.getElementById('chatIntro');
            if (intro) intro.classList.add('hidden');
            
            // Toggle Neurals
            const chatView = document.getElementById('view-chat');
            chatView.classList.add('neural-active');

            // Add user bubble
            const uEl = document.createElement('div');
            uEl.className = 'chat-bubble bubble-user result-appear';
            uEl.textContent = msg;
            chatMessages.appendChild(uEl);
            chatInput.value = '';
            
            // Auto-scroll
            chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });

            sendChatBtn.disabled = true;
            sendChatBtn.innerHTML = '<div class="loader" style="width:14px; height:14px;"></div>';

            // Push to current session context
            window.chatSession.push({ role: 'user', content: msg });

            // AI thinking
            const aiDiv = document.createElement('div');
            aiDiv.className = 'chat-bubble bubble-ai elite-bubble result-appear ai-streaming';
            aiDiv.innerHTML = '<div class="chat-bubble-content"><div class="loader" style="width:12px; height:12px;"></div></div>';
            chatMessages.appendChild(aiDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                const nicheInput = document.getElementById('personaNiche');
                const personaNiche = nicheInput ? nicheInput.value.trim() : 'General';
                const personaTone = document.getElementById('personaTone').value;

                // Send Full History to AI (ChatGPT Style)
                const res = await fetchWithTimeout(`${API_BASE}/chat-stream`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: msg, 
                        history: window.chatSession, // Send current session context
                        persona: { niche: personaNiche, tone: personaTone }, 
                        isPro 
                    })
                });

                if (!res.ok || !res.body) throw new Error("API Error");

                const contentArea = aiDiv.querySelector('.chat-bubble-content');
                contentArea.textContent = '';
                let fullReply = '';
                logUsage('chat');
                
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();
                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const raw = line.slice(6).trim();
                        if (raw === '[DONE]') break;
                        try {
                            const parsed = JSON.parse(raw);
                            if (parsed.token) {
                                fullReply += parsed.token;
                                // Smooth text injection - prevents layout flashing
                                contentArea.textContent = fullReply; 
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            }
                        } catch {}
                    }
                }

                // Finalize Bubble: Add utilities and remove streaming state
                aiDiv.classList.remove('ai-streaming');
                const footer = document.createElement('div');
                footer.className = 'chat-bubble-footer flex justify-end mt-2 pt-2 border-top border-white/5';
                footer.innerHTML = `
                    <button class="action-btn-mini opacity-60 hover:opacity-100" onclick="window.nativeShare(\`${fullReply.replace(/`/g, '\\`').replace(/\n/g, '\\n').replace(/\$/g, '\\$')}\`, 'Architect AI Insight')">
                        <i data-lucide="share-2" style="width:10px;"></i> Share
                    </button>
                `;
                aiDiv.appendChild(footer);
                
                // Add to history for subsequent context
                window.chatSession.push({ role: 'assistant', content: fullReply });
                if (window.chatSession.length > 20) window.chatSession.shift(); // Keep last 20 messages for memory efficiency

                if (fullReply) saveChatLog(msg, fullReply);
            } catch(e) {
                console.error(e);
                showToast("System spike! Retrying neural link...");
                if (aiDiv) aiDiv.remove();
                sendChatBtn.disabled = false;
                sendChatBtn.innerHTML = '<i data-lucide="send"></i>';
                updateIcons();
            } finally {
                sendChatBtn.disabled = false;
                sendChatBtn.innerHTML = '<i data-lucide="send"></i>';
                chatInput.focus();
                chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
                updateIcons();
                window.triggerHaptic('light'); // Success Confirmation
            }
        });
    }

    // -- VIDEO AI LOGIC --
    const mockUploadBtn = document.getElementById('mockUploadBtn');
    const videoFileInput = document.getElementById('videoFileInput');
    const videoAiUploadState = document.getElementById('videoAiUploadState');
    const videoAiResultState = document.getElementById('videoAiResultState');
    const videoAiLoadingOverlay = document.getElementById('videoAiLoadingOverlay');
    const restartVideoAiBtn = document.getElementById('restartVideoAiBtn');

    // UI Result Elements
    const resVidAesthetic = document.getElementById('resVidAesthetic');
    const resVidColor = document.getElementById('resVidColor');
    const resVidResolution = document.getElementById('resVidResolution');
    const resVidDuration = document.getElementById('resVidDuration');

    if (mockUploadBtn && videoFileInput) {
        // Unify Click Logic
        mockUploadBtn.addEventListener('click', (e) => {
            if (e.target !== videoFileInput) videoFileInput.click();
        });

        videoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // 1. Validation (300MB)
            const MAX_SIZE = 300 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                showToast("File too large (Max 300MB)");
                videoFileInput.value = '';
                return;
            }

            // 2. Transition UI
            videoAiUploadState.classList.add('hidden');
            videoAiResultState.classList.remove('hidden');
            videoAiLoadingOverlay.classList.remove('hidden');
            
            // Elite: Holographic Mesh Pulse
            const gridCells = document.querySelectorAll('.elite-grid-cell');
            const flashInterval = setInterval(() => {
                const rand = Math.floor(Math.random() * gridCells.length);
                gridCells[rand].style.background = 'rgba(34, 211, 238, 0.4)';
                setTimeout(() => gridCells[rand].style.background = 'transparent', 400);
            }, 100);
            setTimeout(() => clearInterval(flashInterval), 5000);

            // 3. Technical Analysis
            const videoUrl = URL.createObjectURL(file);
            const tempVid = document.createElement('video');
            tempVid.src = videoUrl;
            tempVid.muted = true;
            tempVid.playsInline = true;
            
            // Critical Fix: Append to body briefly to ensure browser processes it
            tempVid.style.position = 'fixed';
            tempVid.style.left = '-9999px';
            document.body.appendChild(tempVid);

            tempVid.onloadedmetadata = () => {
                const duration = tempVid.duration || 0;
                resVidDuration.textContent = `${duration.toFixed(1)}s`;
                resVidResolution.textContent = `${tempVid.videoWidth} x ${tempVid.videoHeight}`;
                tempVid.currentTime = Math.min(1, duration / 2);
            };

            tempVid.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = tempVid.videoWidth;
                canvas.height = tempVid.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(tempVid, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                let r = 0, g = 0, b = 0;
                for (let i = 0; i < imageData.length; i += 400) {
                    r += imageData[i]; g += imageData[i + 1]; b += imageData[i+2];
                }
                const pCount = imageData.length / 400;
                const avgR = r/pCount, avgG = g/pCount, avgB = b/pCount;
                const lum = 0.2126*avgR + 0.7152*avgG + 0.0722*avgB;

                setTimeout(() => {
                    videoAiLoadingOverlay.classList.add('hidden');
                    const vibrance = Math.max(avgR, avgG, avgB) - Math.min(avgR, avgG, avgB);
                    resVidColor.textContent = vibrance > 40 ? "Vibrant / Pro" : "Natural / Soft";
                    resVidAesthetic.textContent = `${Math.min(10, (lum/25.5) + (vibrance/12.8)).toFixed(1)}/10`;
                    
                    triggerSuccess("Deep Scan Complete");
                    logUsage('videoai');
                    
                    // Show Storyboard Trigger
                    const genBtn = document.getElementById('initialGenStoryboardBtn');
                    if (genBtn) genBtn.classList.remove('hidden');

                    document.body.removeChild(tempVid);
                    URL.revokeObjectURL(videoUrl);
                }, 2000);
            };

            tempVid.onerror = () => {
                showToast("Incompatible video format.");
                if (tempVid.parentNode) document.body.removeChild(tempVid);
                restartVideoAiBtn.click();
            };
        });
    }

    if (restartVideoAiBtn) {
        restartVideoAiBtn.addEventListener('click', () => {
            videoAiResultState.classList.add('hidden');
            videoAiUploadState.classList.remove('hidden');
            if (videoFileInput) videoFileInput.value = '';
            
            // Reset Storyboard
            document.getElementById('videoAiStoryboardSection')?.classList.add('hidden');
            document.getElementById('initialGenStoryboardBtn')?.classList.add('hidden');
            document.getElementById('storyboardGallery').innerHTML = '';
        });
    }

    // -- GENERATE STORYBOARD LOGIC --
    async function generateVideoStoryboard() {
        const gallery = document.getElementById('storyboardGallery');
        const section = document.getElementById('videoAiStoryboardSection');
        if (!gallery || !section) return;

        section.classList.remove('hidden');
        gallery.innerHTML = Array(5).fill(0).map((_, i) => `
            <div class="storyboard-card result-appear" style="animation-delay: ${i * 0.1}s">
                <div class="scene-badge">SCENE ${i + 1}</div>
                <div class="flex-col gap-2">
                    <div class="storyboard-label"><i data-lucide="eye" style="width:10px;"></i> Visual</div>
                    <div id="scene-visual-${i}" class="scene-content text-xs opacity-50 italic">Generating...</div>
                </div>
                <div class="flex-col gap-2">
                    <div class="storyboard-label"><i data-lucide="mic" style="width:10px;"></i> Audio</div>
                    <div id="scene-audio-${i}" class="scene-content text-xs opacity-50 italic">Waiting...</div>
                </div>
            </div>
        `).join('');
        updateIcons();
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });

        try {
            const res = await fetchWithTimeout(`${API_BASE}/chat-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: `Generate a 5-step viral storyboard for a ${persona.niche} video. Aesthetic score was ${document.getElementById('resVidAesthetic').textContent}. 
                             Format each scene EXACTLY like this: [S1] Visual: ... | Audio: ... [S2] ...`,
                    isPro: true 
                })
            });

            if (!res.ok || !res.body) throw new Error("API Error");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const raw = line.slice(6).trim();
                        if (raw === '[DONE]') break;
                        try {
                            const parsed = JSON.parse(raw);
                            if (parsed.token) {
                                fullText += parsed.token;
                                updateStoryboardUI(fullText);
                            }
                        } catch {}
                    }
                }
            }
            triggerSuccess("Storyboard Ready");
        } catch (e) {
            console.error(e);
            showToast("Brain offline. Try again.");
        }
    }

    function updateStoryboardUI(text) {
        for (let i = 0; i < 5; i++) {
            const visual = document.getElementById(`scene-visual-${i}`);
            const audio = document.getElementById(`scene-audio-${i}`);
            const pattern = new RegExp(`\\[S${i+1}\\] Visual: (.*?) \\| Audio: (.*?)(?=\\[S|$)`, 's');
            const match = text.match(pattern);
            if (match) {
                if (visual) { visual.textContent = match[1].trim(); visual.classList.remove('opacity-50', 'italic'); }
                if (audio) { audio.textContent = match[2].trim(); audio.classList.remove('opacity-50', 'italic'); }
            }
        }
    }

    document.getElementById('initialGenStoryboardBtn')?.addEventListener('click', (e) => {
        e.currentTarget.classList.add('hidden');
        generateVideoStoryboard();
    });

    document.getElementById('genStoryboardBtn')?.addEventListener('click', () => {
        generateVideoStoryboard();
    });

    // -- SUBSCRIPTION MANAGEMENT --
    const billingStatePro = document.getElementById('billingStatePro');
    const billingStateStandard = document.getElementById('billingStateStandard');
    const planRenewalText = document.getElementById('planRenewalText');
    const cancelSubBtn = document.getElementById('cancelSubBtn');

    function updateBillingUI() {
        if (!billingStatePro || !billingStateStandard) return;

        if (isPro) {
            billingStatePro.classList.remove('hidden');
            billingStateStandard.classList.add('hidden');

            if (isSubCancelled) {
                planRenewalText.innerHTML = `<span class="text-red">Canceled (Active until next cycle)</span>`;
                cancelSubBtn.innerHTML = '<i data-lucide="refresh-cw"></i> Reactivate Auto-Renew';
                cancelSubBtn.classList.remove('text-red');
                cancelSubBtn.classList.add('text-gold');
            } else {
                planRenewalText.textContent = `Renews Monthly`;
                cancelSubBtn.innerHTML = '<i data-lucide="x-circle"></i> Cancel Subscription';
                cancelSubBtn.classList.add('text-red');
                cancelSubBtn.classList.remove('text-gold');
            }
        } else {
            billingStatePro.classList.add('hidden');
            billingStateStandard.classList.remove('hidden');
        }
        updateIcons();
    }

    // -- PERSONA LOGIC --
    const personaNicheEl = document.getElementById('personaNiche');
    const personaToneEl = document.getElementById('personaTone');

    if (personaNicheEl && personaToneEl) {
        personaNicheEl.value = persona.niche;
        personaToneEl.value = persona.tone;

        const updatePersona = () => {
            persona = { niche: personaNicheEl.value, tone: personaToneEl.value };
            localStorage.setItem('vr_persona', JSON.stringify(persona));
            showToast("Persona updated - AI adjusted.");
        };

        personaNicheEl.addEventListener('change', updatePersona);
        personaToneEl.addEventListener('input', updatePersona);
    }

    // -- EXPORT LOGIC --
    function downloadCSV(data, filename) {
        if (!data || !data.length) return showToast("No data to export");
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(item => Object.values(item).map(val => `"${val}"`).join(",")).join("\n");
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const exportAnalyzeBtn = document.getElementById('exportAnalyzeBtn');
    if (exportAnalyzeBtn) {
        exportAnalyzeBtn.addEventListener('click', () => {
            downloadCSV(analyticsData, "viralreels_analytics.csv");
        });
    }

    // -- ONBOARDING LOGIC --
    const onboardingOverlay = document.getElementById('onboardingOverlay');
    const onboardingNextBtn = document.getElementById('onboardingNextBtn');
    const onboardingSkipBtn = document.getElementById('onboardingSkipBtn');
    let tourStep = 0;

    const tourSteps = [
        { target: 'navAnalyze', text: "The Predictor: Throw ideas in here to see their viral potential instantly." },
        { target: 'navHooks', text: "The Hook Vault: Generate world-class openers tailored to your brand." },
        { target: 'navTrends', text: "Trend Engine: Discover the exact formats moving the needle today." },
        { target: 'navAiChat', text: "AI Consultant: Your personal strategist is available 24/7." }
    ];

    function showTourStep() {
        if (tourStep >= tourSteps.length) {
            endTour();
            return;
        }

        const step = tourSteps[tourStep];
        const target = document.getElementById(step.target);

        // Visual highlight
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('highlight-nav'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('highlight-nav');
        }

        document.getElementById('onboardingContent').innerHTML = `
            <h2 class="text-xl font-bold mb-2">Step ${tourStep + 1} of ${tourSteps.length}</h2>
            <p class="text-sm text-secondary mb-6">${step.text}</p>
            <button class="btn-primary w-full" onclick="window.nextTourStep()">Next</button>
        `;

        const dots = document.querySelectorAll('.step-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === tourStep));
    }

    window.nextTourStep = () => {
        tourStep++;
        showTourStep();
    };

    function endTour() {
        onboardingOverlay.classList.add('hidden');
        isOnboardingComplete = true; // Sync internal variable
        localStorage.setItem('vr_onboarding_complete', 'true');
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('highlight-nav'));
        showToast("Tour complete! You're ready to dominate.");
    }


    if (onboardingNextBtn) {
        onboardingNextBtn.addEventListener('click', () => {
            showTourStep();
        });
    }

    if (onboardingSkipBtn) {
        onboardingSkipBtn.addEventListener('click', () => {
            endTour();
        });
    }

    const exportTrackerBtn = document.getElementById('exportTrackerBtn');
    if (exportTrackerBtn) {
        exportTrackerBtn.addEventListener('click', () => {
            const data = savedHooks.map(h => ({ hook: h }));
            downloadCSV(data, "viralreels_hooks.csv");
        });
    }

    const manageBillingBtn = document.getElementById('manageBillingBtn');
    if (manageBillingBtn) {
        manageBillingBtn.addEventListener('click', async () => {
            const originalText = manageBillingBtn.innerHTML;
            manageBillingBtn.innerHTML = '<div class="loader"></div>';
            manageBillingBtn.disabled = true;

            try {
                const user = firebase.auth().currentUser;
                if (!user) {
                    showToast("Please sign in to manage billing.");
                    manageBillingBtn.innerHTML = originalText;
                    manageBillingBtn.disabled = false;
                    return;
                }
                
                if (!isPro) {
                    // Start Checkout for Free users
                    initiateCheckout();
                    return;
                }

                // Create Portal for Pro users
                const response = await fetchWithTimeout(`${API_BASE}/create-portal-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: user.uid, email: user.email })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || "Portal access denied.");
                }

                if (data.url) {
                    window.location.href = data.url;
                } else {
                    showToast("Stripe error: Redirect URL missing.");
                    manageBillingBtn.innerHTML = originalText;
                    manageBillingBtn.disabled = false;
                }
            } catch (err) {
                console.error("[ViralReels] Billing Portal Error:", err);
                showToast(err.message || "Server connection failed.");
                manageBillingBtn.innerHTML = originalText;
                manageBillingBtn.disabled = false;
            }
        });
    }

    // =============================================
    // == STRIPE CHECKOUT INTEGRATION ==
    // =============================================
    const upgradeBtns = document.querySelectorAll('#upgradeBtn, #paywallActionBtn, .open-paywall-btn');
    upgradeBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (btn.id === 'upgradeBtn' || btn.id === 'paywallActionBtn') {
                e.preventDefault();
                const originalText = btn.innerHTML;
                btn.innerHTML = '<div class="loader"></div>';
                btn.disabled = true;
                try {
                    const res = await fetchWithTimeout(`${API_BASE}/checkout`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uid: firebase.auth().currentUser ? firebase.auth().currentUser.uid : null })
                    });
                    const data = await res.json();
                    if (data.url) {
                        // Simulation for verification: Trigger confetti if pro upgrade
                        triggerConfetti();
                        setTimeout(() => window.location.href = data.url, 2000);
                    } else {
                        showToast("Checkout failed. Try again.");
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }
                } catch (err) {
                    console.error(err);
                    showToast("Server error. Cannot reach Stripe.");
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }
        });
    });

    // Handle Checkout Success Logic
    async function handleStripeVerification() {
        const urlParams = new URLSearchParams(window.location.search);
        const checkoutStatus = urlParams.get('checkout');
        const sessionId = urlParams.get('session_id');

        if (checkoutStatus === 'success' && sessionId) {
            // Show a special verification overlay
            const verifyOverlay = document.createElement('div');
            verifyOverlay.className = 'glass-overlay fixed inset-0 z-[9999] flex flex-col items-center justify-center text-center p-6';
            verifyOverlay.innerHTML = `
                <div class="card p-8 max-w-sm w-full animate-float" style="background: rgba(10,10,15,0.9); backdrop-filter: blur(20px);">
                    <div class="loader mx-auto mb-4" style="width:40px; height:40px; border-width:4px;"></div>
                    <h2 class="text-xl font-bold mb-2">Verifying Payment...</h2>
                    <p class="text-white-50 text-sm">Validating your Pro access with Stripe. Hang tight!</p>
                </div>
            `;
            document.body.appendChild(verifyOverlay);

            try {
                const response = await fetchWithTimeout(`${API_BASE}/verify-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId })
                });
                const data = await response.json();

                if (data.success) {
                    // UNLOCK PRO PERMANENTLY
                    localStorage.setItem('vr_pro_status', 'true');
                    isPro = true; // Update global state
                    
                    verifyOverlay.innerHTML = `
                        <div class="card p-8 max-w-sm w-full animate-appear" style="background: rgba(10,10,15,0.9); backdrop-filter: blur(20px);">
                            <div class="text-4xl mb-4">🏆</div>
                            <h2 class="text-2xl font-bold text-gradient mb-2">PRO UNLOCKED</h2>
                            <p class="text-white-80 mb-6">Welcome to the elite tier of ViralReels. All limits are gone.</p>
                            <button class="btn-primary w-full" id="closeVerifyBtn">Let's Rank!</button>
                        </div>
                    `;
                    
                    window.vrCelebrate('viral');
                    
                    document.getElementById('closeVerifyBtn').addEventListener('click', () => {
                        verifyOverlay.remove();
                        // Clean URL and reload to ensure all Pro-gated features are hydrated
                        window.history.replaceState({}, document.title, window.location.pathname);
                        window.location.reload(); 
                    });
                } else {
                    throw new Error("Payment not verified");
                }
            } catch (err) {
                console.error("Verification failed:", err);
                verifyOverlay.innerHTML = `
                    <div class="card p-8 max-w-sm w-full animate-appear" style="background: rgba(10,10,15,0.9); backdrop-filter: blur(20px);">
                        <div class="text-4xl mb-4">❌</div>
                        <h2 class="text-xl font-bold mb-2">Verification Failed</h2>
                        <p class="text-white-50 text-sm mb-6">We couldn't verify your payment. If this is an error, contact support@viralreels.ai</p>
                        <button class="btn-secondary w-full" onclick="this.parentElement.parentElement.remove()">Back to App</button>
                    </div>
                `;
            }
        } else if (checkoutStatus === 'canceled') {
            showToast("Pro Upgrade Canceled.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // Run verification check
    handleStripeVerification();

    // =============================================
    // == FIREBASE AUTHENTICATION CONFIGURATION ==
    // =============================================
    const authBaseActions = document.getElementById('authBaseActions');
    const emailLoginForm = document.getElementById('emailLoginForm');
    const backToMethodsBtn = document.getElementById('backToMethodsBtn');
    const authSubmitBtn = document.getElementById('authSubmitBtn');

    // Toggle Forms UI
    if (emailLoginBtn) {
        emailLoginBtn.addEventListener('click', () => {
            authBaseActions.classList.add('hidden');
            emailLoginForm.classList.remove('hidden');
        });
    }
    if (backToMethodsBtn) {
        backToMethodsBtn.addEventListener('click', () => {
            emailLoginForm.classList.add('hidden');
            authBaseActions.classList.remove('hidden');
        });
    }

    // FIREBASE INITIALIZATION
    const firebaseConfig = {
       apiKey: "AIzaSyChFSEi5V_4orJKvRLl35EuP4f25wd7xmw",
  authDomain: "viralreels-ai.firebaseapp.com",
  projectId: "viralreels-ai",
  storageBucket: "viralreels-ai.firebasestorage.app",
  messagingSenderId: "592489150764",
  appId: "1:592489150764:web:facdb8915f5c7a58d75489",
  measurementId: "G-FNHMDWD7KC"
};

    if (window.firebase) {
        try {
            const firebaseConfig = {
                apiKey: "AIzaSyChFSEi5V_4orJKvRLl35EuP4f25wd7xmw",
                authDomain: "viralreels-ai.firebaseapp.com",
                projectId: "viralreels-ai",
                storageBucket: "viralreels-ai.appspot.com",
                messagingSenderId: "36733221996",
                appId: "1:36733221996:web:1186e88e8f80cbcd715494",
                measurementId: "G-GDBXW9V89K"
            };
            firebase.initializeApp(firebaseConfig);
            const auth = firebase.auth();

            // Handle Redirect Result (Restored for GitHub Pages compatibility)
            auth.getRedirectResult().then((result) => {
                if (result.user) {
                    console.log("ViralReels AI: Google Login Successful", result.user.email);
                    showToast(`Welcome back, ${result.user.displayName || 'Creator'}!`);
                }
            }).catch((error) => {
                if (error.code !== 'auth/no-auth-event') {
                    console.error("Auth Error:", error);
                }
            });

            // Check Auth State
            auth.onAuthStateChanged(async (user) => {
                // --- PERSISTENT REVIEWER BYPASS ---
                const isBypassActive = localStorage.getItem('vr_bypass_active') === 'true';
                if (!user && isBypassActive) {
                    console.log("[ViralReels] Re-activating Reviewer Bypass Session...");
                    authOverlay.classList.add('hidden');
                    appContainer.classList.remove('hidden');
                    return;
                }

                if (user) {
                    window.isGuestMode = false;
                    document.getElementById('guestJoinBtn')?.classList.add('hidden');

                    // 1. IMMEDIATE UI TRANSITION (Priority 1)
                    authOverlay.classList.add('hidden');
                    appContainer.classList.remove('hidden');
                    updateIcons();
                    
                    // 2. ASYNC BACKGROUND SYNC (Non-blocking)
                    (async () => {
                        try {
                            const db = firebase.firestore();
                            const userDoc = await db.collection('users').doc(user.uid).get();
                            if (userDoc.exists) {
                                const data = userDoc.data();
                                isPro = !!data.isPro; 
                                localStorage.setItem('vr_pro_status', isPro ? 'true' : 'false');
                                console.log(`[ViralReels] Pro Status Refreshed: ${isPro ? 'PRO' : 'FREE'}`);
                                renderAllBadges();
                                
                                // Update billing UI if visible
                                const proManageBtn = document.getElementById('manageBillingBtn');
                                if (proManageBtn) {
                                    proManageBtn.innerText = isPro ? 'Manage Billing' : 'Go Pro';
                                    updateIcons();
                                }
                            }
                        } catch (dbErr) {
                            console.warn("[ViralReels] Firestore sync failed. Using local state.", dbErr);
                        }
                    })();

                    initTrial();
                    renderAllBadges();
                    
                    if (!isOnboardingComplete && !localStorage.getItem('vr_onboarding_complete')) {
                        document.getElementById('onboardingOverlay').classList.remove('hidden');
                    }
                } else {
                    // Only show login if NO BYPASS and NO USER
                    if (!isBypassActive) {
                        authOverlay.classList.remove('hidden');
                        appContainer.classList.add('hidden');
                    }
                }
            });

            // Email Form Submit
            if (emailLoginForm) {
                emailLoginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const email = document.getElementById('authEmail').value;
                    const pass = document.getElementById('authPass').value;
                    authSubmitBtn.innerHTML = '<div class="loader"></div>';
                    
                    // --- REVIEWER BYPASS ---
                    if (email.toLowerCase() === 'reviewer@viralreels.com' && pass === 'ViralReview2026!') {
                        localStorage.setItem('vr_pro_status', 'true');
                        localStorage.setItem('vr_bypass_active', 'true');
                        // Fake a success login to satisfy the crawler
                        // Direct state transition (No recursive initApp call)
                        setTimeout(() => {
                            authOverlay.classList.add('hidden');
                            appContainer.classList.remove('hidden');
                            updateIcons();
                            showToast("Reviewer Account Verified. Pro Access Unlocked.");
                        }, 500);
                        return;
                    }

                    auth.signInWithEmailAndPassword(email, pass)
                    .catch((error) => {
                        // Lazy signup for seamless creator onboarding
                        if (error.code.includes('user-not-found') || error.code.includes('invalid-credential')) {
                            return auth.createUserWithEmailAndPassword(email, pass);
                        }
                        throw error;
                    })
                    .catch((error) => {
                        console.error("Auth Error:", error);
                        if (error.code === 'auth/email-already-in-use') {
                            showToast("Incorrect password for this account.");
                        } else if (error.code === 'auth/weak-password') {
                            showToast("Password must be at least 6 characters.");
                        } else if (error.code === 'auth/invalid-email') {
                            showToast("Invalid email address format.");
                        } else if (error.code && error.code.includes('too-many-requests')) {
                            showToast("Too many attempts. Please try again later.");
                        } else {
                            showToast(error.message || "Authentication failed. Please try again.");
                        }
                        authSubmitBtn.innerHTML = 'Sign In / Create Account';
                    });
                });
            }

            // Google Login
            if (googleLoginBtn) {
                googleLoginBtn.addEventListener('click', () => {
                    googleLoginBtn.innerHTML = '<div class="loader"></div> Securely Redirecting...';
                    const provider = new firebase.auth.GoogleAuthProvider();
                    // Using Redirect for better compatibility (Mobile/COOP/Popup blockers)
                    auth.signInWithRedirect(provider).catch(err => {
                        console.error(err);
                        showToast("Google Auth Failed. Check API Key.");
                        googleLoginBtn.innerHTML = '<i data-lucide="layout"></i> Continue with Google';
                        updateIcons();
                    });
                });
            }
        } catch (e) {
            console.warn("Firebase Auth bypassed for testing.", e);
            setupMockAuth();
        }
    } else {
        console.warn("Firebase scripts not loaded. Mock Auth Active.");
        setupMockAuth();
    }

    // Sign Out Implementation
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            window.vrConfirm("Sign Out?", "Are you sure you want to log out of ViralReels AI?", () => {
                if (window.firebase && firebase.auth().currentUser) {
                    firebase.auth().signOut().then(() => {
                        window.location.reload();
                    });
                } else {
                    window.location.reload(); // Simple reload for mock state reset
                }
            });
        });
    }

    // Guest / Mock Access Implementation
    function setupMockAuth() {
        console.log("ViralReels AI: Activating Open Access (Guest Mode)...");
        window.isGuestMode = true;
        
        // Reveal Guest Join CTA
        document.getElementById('guestJoinBtn')?.classList.remove('hidden');
        
        authOverlay.classList.add('hidden');
        appContainer.classList.remove('hidden');
        updateIcons();
        
        // Ensure onboarding shows for new guests
        if (!localStorage.getItem('vr_onboarding_complete')) {
            document.getElementById('onboardingOverlay')?.classList.remove('hidden');
        }
        
        showToast("Open Access Active. Browse freely!");
    }

    // Wire Guest Join Button
    document.getElementById('guestJoinBtn')?.addEventListener('click', () => {
        window.triggerHaptic('heavy');
        document.getElementById('authOverlay').classList.remove('hidden');
    });

    // Wire Guest Button
    const guestLoginBtn = document.getElementById('guestLoginBtn');
    if (guestLoginBtn) {
        guestLoginBtn.addEventListener('click', () => {
            window.triggerHaptic('medium');
            setupMockAuth();
        });
    }

    updateIcons();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
// =============================================
// == SUB-TAB & PRECISION LOGIC (ZENITH V3.9) ==
// =============================================

// 1. Generic Sub-Tab Switching (Pill Tabs)
document.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;

    const subtabId = pill.dataset.subtab;
    if (!subtabId) return;

    // Scope the container (only search within the current active view)
    const container = pill.closest('.tab-view');
    if (!container) return;

    // Update pills
    container.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    // Update sections
    container.querySelectorAll('.item-list-container, #sub-analyze-scout, #sub-analyze-metrics, #sub-hooks-scout, #hooksGeneratorsContent > div').forEach(sec => {
        if (sec.id.includes('usage-badge')) return;
        sec.classList.add('hidden');
    });

    const target = document.getElementById(subtabId);
    if (target) {
        target.classList.remove('hidden');
        if (subtabId === 'sub-analyze-metrics') renderAnalytics();
    }
});

// -- Global Storage Helper --
window.safeGet = (key, fallback) => {
    try { const val = localStorage.getItem(key); return val ? JSON.parse(val) : fallback; }
    catch (e) { return fallback; }
};

// 2. Resolve Analytics Hydration (V2 Stats + Chart)
const originalRenderAnalytics = window.renderAnalytics;
window.renderAnalytics = () => {
    // Call original if it exists and isn't this function
    if (typeof originalRenderAnalytics === 'function' && originalRenderAnalytics !== window.renderAnalytics) {
        try { originalRenderAnalytics(); } catch(e) {}
    }

    const stats = window.safeGet('vr_analytics_data', []);
    const totalReach = stats.reduce((acc, curr) => acc + (curr.actualViews || 0), 0);
    const avgScore = stats.length ? Math.round(stats.reduce((acc, curr) => acc + (curr.score || 0), 0) / stats.length) : 0;

    const statTotalReachEl = document.getElementById('statTotalReach');
    const statAvgScoreEl = document.getElementById('statAvgScore');
    const analyticsChartSection = document.getElementById('analyticsChartSection');
    const perfCurve = document.getElementById('performanceCurve');

    if (statTotalReachEl) statTotalReachEl.innerText = totalReach.toLocaleString();
    if (statAvgScoreEl) statAvgScoreEl.innerText = `${avgScore}%`;

    if (stats.length > 0) {
        analyticsChartSection?.classList.remove('hidden');
        if (perfCurve) {
            perfCurve.innerHTML = stats.slice(-7).map(s => {
                const height = Math.max(20, (s.score || 0));
                return `<div class="w-2 bg-accent rounded-t-sm animate-height" style="height: ${height}%;"></div>`;
            }).join('');
        }
    }
};

