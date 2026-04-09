/**
 * ViralReels AI - App Logic (V1 Usage Engine)
 */

// Service Worker Registration (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').then(reg => {
            reg.onupdatefound = () => {
                const installingWorker = reg.installing;
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available! Force reload.
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
        refreshing = true;
        window.location.reload();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("ViralReels AI System: V3.0 Global Optimization Active");
    // Premium Splash Screen Auto-Fade
    const splash = document.getElementById('splashScreen');
    if (splash) setTimeout(() => { splash.style.opacity = '0'; splash.style.visibility = 'hidden'; }, 1500);

    // Cookie Consent Logic
    const cookieBanner = document.getElementById('cookieBanner');
    if (cookieBanner && !localStorage.getItem('vr_cookies_accepted')) {
        setTimeout(() => cookieBanner.classList.remove('hidden'), 2000);
        document.getElementById('acceptCookiesBtn').addEventListener('click', () => {
            localStorage.setItem('vr_cookies_accepted', 'true');
            cookieBanner.classList.add('hidden');
        });
    }

    lucide.createIcons();

    // -- State & Storage --
    let currentAnalyzedIdea = null;
    let savedEvents = JSON.parse(localStorage.getItem('viralreels_events')) || {};
    let savedHooks = JSON.parse(localStorage.getItem('viralreels_tracked_hooks')) || [];
    let savedRewrites = JSON.parse(localStorage.getItem('viralreels_saved_rewrites')) || [];
    let analyticsData = JSON.parse(localStorage.getItem('vr_analytics_data')) || [];
    let isPro = localStorage.getItem('vr_pro_status') === 'true';
    let isSubCancelled = localStorage.getItem('vr_sub_cancelled') === 'true';
    let isOnboardingComplete = localStorage.getItem('vr_onboarding_complete') === 'true';
    let persona = JSON.parse(localStorage.getItem('vr_persona')) || { niche: 'tech', tone: 50 };
    let currentAnalyzeData = null;
    let lastUsedInputs = { analyze: '', hooks: '', captions: '', trends: '', rewrite: '' };
    let calDate = new Date();
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api' 
        : 'https://viralreels-ai.onrender.com/api';

    // -- HISTORY MANAGEMENT --
    let histories = JSON.parse(localStorage.getItem('vr_tool_histories')) || {
        analyze: [], hooks: [], captions: [], tags: [], trends: [], rewrite: []
    };
    let historyIndices = { analyze: -1, hooks: -1, captions: -1, tags: -1, trends: -1, rewrite: -1 };

    const addToHistory = (tool, val) => {
        if (!val || histories[tool][0] === val) return;
        histories[tool].unshift(val);
        if (histories[tool].length > 10) histories[tool].pop();
        localStorage.setItem('vr_tool_histories', JSON.stringify(histories));
        historyIndices[tool] = -1; // Reset cycle
    };

    window.cycleHistory = (tool) => {
        if (histories[tool].length === 0) {
            showToast("No recent history for this tool.");
            return;
        }
        historyIndices[tool] = (historyIndices[tool] + 1) % histories[tool].length;
        const val = histories[tool][historyIndices[tool]];
        
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
            showToast(`Loaded: "${val.substring(0, 15)}..."`);
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
            setTimeout(() => overlay.classList.add('hidden'), 2000);
        }
    };

    // =============================================
    // == USAGE LIMIT ENGINE ==
    // =============================================
    const LIMITS = { analyze: 5, hooks: 5, captions: 5, trends: 3, rewrite: 3 };
    const AD_DURATION = 30; // seconds
    let adTimer = null;
    let currentAdRechargeTarget = null; // which tool to recharge after ad

    const getToday = () => new Date().toISOString().split('T')[0];

    const getUsage = () => {
        const stored = JSON.parse(localStorage.getItem('vr_usage') || 'null');
        if (!stored || stored.date !== getToday()) {
            // New day — reset to full limits
            const fresh = { date: getToday(), ...LIMITS };
            localStorage.setItem('vr_usage', JSON.stringify(fresh));
            return fresh;
        }
        return stored;
    };

    const saveUsage = (usage) => localStorage.setItem('vr_usage', JSON.stringify(usage));

    const getRemainingUses = (tool) => isPro ? 999 : (getUsage()[tool] ?? LIMITS[tool]);

    const consumeUse = (tool) => {
        if (isPro) return;
        const usage = getUsage();
        if (usage[tool] > 0) usage[tool]--;
        saveUsage(usage);
        renderAllBadges();
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
            lucide.createIcons();
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

    // Show limit block inside a target container element
    const showLimitBlock = (containerEl, tool) => {
        const block = document.createElement('div');
        block.className = 'limit-block-card content-padding mb-6';
        block.id = `limit-block-${tool}`;
        block.innerHTML = `
            <div class="limit-icon"><i data-lucide="lock" style="width:22px; color:var(--text-danger);"></i></div>
            <h3 class="font-bold text-lg mb-1" style="color:var(--text-danger);">Daily Limit Reached</h3>
            <p class="text-secondary text-sm mb-1">You've used all <strong>${LIMITS[tool]}</strong> free ${tool} uses today.</p>
            <p class="text-xs text-muted">Resets in <strong style="color:var(--accent-gold);">${getResetIn()}</strong></p>
            <div class="limit-block-actions">
                <button class="btn-watch-ad watch-ad-btn" data-tool="${tool}">
                    <i data-lucide="play" style="width:16px;"></i> Watch a 30s Ad → Get +2 Uses
                </button>
                <button class="btn-primary w-full open-paywall-btn" style="background:var(--gradient-premium); color:black;">
                    <i data-lucide="crown" style="width:16px;"></i> Go Pro for Unlimited Access
                </button>
                <p class="text-xs text-muted" style="margin-top:4px;">⏰ Or wait for the automatic reset in ${getResetIn()}</p>
            </div>
        `;
        // Remove any existing block first
        const existing = containerEl.querySelector('.limit-block-card');
        if (existing) existing.remove();
        containerEl.prepend(block);
        lucide.createIcons();

        // Wire up buttons
        block.querySelector('.watch-ad-btn').addEventListener('click', () => startAd(tool));
        block.querySelector('.open-paywall-btn').addEventListener('click', () => {
            document.getElementById('paywallOverlay').classList.remove('hidden');
        });
    };

    // Clipboard helper
    window.copyToClipboard = (text, btn) => {
        navigator.clipboard.writeText(text).then(() => {
            const original = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check" style="width:14px; color:var(--accent-green);"></i>';
            showToast("Copied to clipboard!");
            lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = original;
                lucide.createIcons();
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showToast("Copy failed.");
        });
    };

    // Toast notification
    const showToast = (msg) => {
        const t = document.createElement('div');
        t.className = 'toast';
        t.innerHTML = `<i data-lucide="info" style="width:16px;"></i> ${msg}`;
        document.body.appendChild(t);
        lucide.createIcons();
        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transform = 'translate(-50%, 20px)';
            setTimeout(() => t.remove(), 300);
        }, 3000);
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
        adModal.classList.remove('hidden');
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
            const bodyData = firebase.auth().currentUser ? JSON.stringify({ uid: firebase.auth().currentUser.uid }) : JSON.stringify({});
            const res = await fetch(`${API_BASE}/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: bodyData
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("Checkout failed");
            }
        } catch (err) {
            console.error(err);
            showToast("Redirect failed. Using backup upgrade.");
            // Backup simulation if API fails during local testing
            setTimeout(() => {
                isPro = true;
                localStorage.setItem('vr_pro_status', 'true');
                window.location.reload();
            }, 1000);
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
        if (e.target.checked) document.body.classList.remove('light-theme');
        else document.body.classList.add('light-theme');
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
    const navItems = document.querySelectorAll('.nav-item');
    const tabViews = document.querySelectorAll('.tab-view');

    navItems.forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.getAttribute('data-tab');
            if ((targetId === 'videoai' || targetId === 'chat') && !isPro) {
                paywallOverlay.classList.remove('hidden');
                return;
            }

            // --- RESET ON LEAVE ---
            const activeView = document.querySelector('.active-view');
            if (activeView) {
                // Clear inputs
                activeView.querySelectorAll('input, textarea').forEach(i => i.value = '');
                // Hide specific dashboards/results
                activeView.querySelectorAll('.results-dashboard, #hooksGeneratorsContent, #dedTagsOutput, #dedCapOutput, #trendsOutput, #rewriteOutput').forEach(o => o.classList.add('hidden'));
                // Restore empty states where applicable
                activeView.querySelectorAll('#hooksGeneratorsEmpty, #trendsEmpty').forEach(e => e.classList.remove('hidden'));
                // Reset checklist specifically if leaving
                if (activeView.id === 'view-checklist') {
                    document.querySelectorAll('.task-check').forEach(c => c.checked = false);
                    const st = document.getElementById('checklistScore');
                    const sb = document.getElementById('checklistScoreBar');
                    if (st && sb) { st.innerText = '0%'; sb.style.width = '0%'; }
                }
            }

            // Identify current active view for exit animation
            const currentView = document.querySelector('.tab-view.active-view');
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

            lucide.createIcons();

            if (targetId === 'calendar') renderCalendar();
            if (targetId === 'tracker') renderTracker();
            if (targetId === 'saved') renderSavedRewrites();
            if (targetId === 'analyze') renderAnalytics();

            const tabName = btn.querySelector('span')?.innerText || 'Dashboard';
            document.title = `ViralReels | ${tabName}`;
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
        return `
            <div class="item-card">
                <p class="item-text" style="white-space:pre-wrap;">${text}</p>
                <div class="item-actions">
                    <button class="action-btn" onclick="copyToClipboard('${escapedText}', this)" title="Copy to Clipboard"><i data-lucide="copy"></i></button>
                    ${type ? `<button class="action-btn" onclick="saveToVault('${escapedText}', '${type}', this)"><i data-lucide="archive"></i></button>` : ''}
                </div>
            </div>
        `;
    };

    window.saveToVault = (text, type, btnElem) => {
        if (type === 'hook') {
            savedHooks.unshift(text); localStorage.setItem('viralreels_tracked_hooks', JSON.stringify(savedHooks));
        } else if (type === 'rewrite') {
            savedRewrites.unshift(text); localStorage.setItem('viralreels_saved_rewrites', JSON.stringify(savedRewrites));
        }
        btnElem.innerHTML = '<i data-lucide="check"></i> Saved'; btnElem.classList.add('saved'); lucide.createIcons();
        triggerSuccess("Saved to Vault");
    };

    window.copyHash = (text, el) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`Copied: ${text}`);
            const oldHtml = el.innerHTML;
            el.innerHTML = '<i data-lucide="check" style="width:12px;"></i> Copied';
            setTimeout(() => { el.innerHTML = oldHtml; lucide.createIcons(); }, 1500);
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

        // --- USAGE GATE ---
        if (getRemainingUses('analyze') <= 0) {
            showLimitBlock(document.getElementById('sub-analyze-scout'), 'analyze');
            return;
        }

        btn.disabled = true; // LOCK IMMEDIATELY
        consumeUse('analyze');
        lastUsedInputs.analyze = currentInputKey; // Mark as used
        addToHistory('analyze', idea);
        
        btn.querySelector('span').innerText = "Analyzing Context...";
        btn.querySelector('i').classList.add('hidden');
        btn.querySelector('.loader').classList.remove('hidden');
        document.getElementById('resultsDashboard').classList.add('hidden');

        try {
            const platform = document.getElementById('platformSelect')?.value || 'all';
            const length = document.getElementById('lengthInput')?.value || '15s';
            
            const res = await fetch(`${API_BASE}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idea, platform, length, isPro })
            });

            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            
            const score = data.score;
            currentAnalyzedIdea = { idea, score };
            currentAnalyzeData = { id: Date.now().toString(), idea, platform, score };

            document.getElementById('resViralScore').innerText = score;
            document.querySelector('.score-container').style.setProperty('--progress', `${score}%`);
            document.getElementById('resScoreText').innerText = score > 80 ? "Viral Potential 🔥" : "Solid 📈";
            document.getElementById('resHookBar').style.width = `${(data.hookStrength / 10) * 100}%`;
            document.getElementById('resHookRating').innerText = `${data.hookStrength}/10`;
            document.getElementById('resRetentionBar').style.width = `${data.retention}%`;
            document.getElementById('resRetentionPerc').innerText = `${data.retention}%`;
            document.getElementById('resTipsList').innerHTML = (data.tips || []).map(t => `<li class="tip-item text-xs">${t}</li>`).join('');

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
            btn.disabled = false;
            btn.innerHTML = '<span>Generate Analysis</span><i data-lucide="arrow-right"></i><div class="loader hidden"></div>';
            lucide.createIcons();
            const resDash = document.getElementById('resultsDashboard');
            resDash.classList.remove('hidden');
            resDash.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // -- ANALYTICS BINDINGS --
    const logBtn = document.getElementById('btnLogAnalytics');
    if (logBtn) {
        logBtn.addEventListener('click', () => {
            if (!currentAnalyzeData) return;
            analyticsData.push({ ...currentAnalyzeData, actualViews: 0 });
            localStorage.setItem('vr_analytics_data', JSON.stringify(analyticsData));
            alert("Idea logged to Analytics DB! Switch to the Analytics sub-tab to enter Real Views later.");
            renderAnalytics();
        });
    }

    // -- 2. HOOKS VIEW (Upgraded GPT Style) --
    document.getElementById('customHookForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputStr = document.getElementById('customHookInput').value.trim();
        const btn = e.target.querySelector('button');

        // --- DUPLICATE CHECK ---
        if (lastUsedInputs.hooks === inputStr) {
            showToast("Modify the topic for new hooks!");
            return;
        }

        // --- USAGE GATE ---
        if (getRemainingUses('hooks') <= 0) {
            showLimitBlock(document.getElementById('view-hooks'), 'hooks');
            return;
        }

        btn.disabled = true; // LOCK
        consumeUse('hooks');
        lastUsedInputs.hooks = inputStr;
        addToHistory('hooks', inputStr);
        
        btn.innerHTML = '<div class="loader"></div>';

        try {
            const res = await fetch(`${API_BASE}/generate-hooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: inputStr, isPro })
            });
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();

            document.getElementById('hooksGeneratorsEmpty').classList.add('hidden');
            document.getElementById('hooksGeneratorsContent').classList.remove('hidden');
            document.getElementById('sub-hooks-list').innerHTML = (data.hooks || []).map(h => toItemCard(h, 'hook')).join('');
            document.getElementById('sub-captions-list').innerHTML = (data.captions || []).map(c => toItemCard(c, null)).join('');
        } catch (err) {
            console.error(err);
            showToast("Hook engine offline. Try later.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="zap"></i> Generate Hooks';
            lucide.createIcons();
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
        if (savedHooks.length === 0) { list.innerHTML = ''; empty.classList.remove('hidden'); } else {
            empty.classList.add('hidden');
            list.innerHTML = savedHooks.map((h, i) => {
                const isVerified = analyticsData.some(a => a.idea.includes(h.substring(0, 10)) && a.actualViews > 0);
                return `
                <div class="item-card flex-col pr-2">
                    <div class="flex justify-between items-start mb-2">
                        <p class="item-text mb-0 w-full" style="font-size:0.85rem; white-space:pre-wrap;">${h}</p>
                        <button class="icon-button flex-shrink-0" onclick="deleteHook(${i})"><i data-lucide="trash-2" style="width:14px; color:var(--text-muted)"></i></button>
                    </div>
                    ${isVerified ? `
                    <div class="flex items-center gap-1 text-green font-bold uppercase" style="font-size:0.6rem; letter-spacing:1px; background:rgba(6,214,160,0.1); padding:4px 8px; border-radius:4px; width:fit-content;">
                        <i data-lucide="check-circle" style="width:10px;"></i> Verified Viral
                    </div>` : `
                    <div class="text-xs text-muted" style="font-size:0.65rem;">Unlinked to performance data</div>`}
                </div>
                `;
            }).join('');
            lucide.createIcons();
        }
    };
    window.deleteHook = (index) => { savedHooks.splice(index, 1); localStorage.setItem('viralreels_tracked_hooks', JSON.stringify(savedHooks)); renderTracker(); };

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
        document.getElementById('calMonthDisplay').innerText = `${monthNames[month]} ${year}`;

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
            calendarEventModal.classList.add('hidden'); renderCalendar();
        }
    });

    // -- 5. CAPTIONS VIEW (GPT Overhaul) --
    document.getElementById('dedCapForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const topic = document.getElementById('dedCapInput').value.trim();
        const style = document.getElementById('dedCapStyle').value;
        const btn = document.getElementById('dedCapBtn');

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
        lastUsedInputs.captions = currentKey;
        addToHistory('captions', topic);
        
        btn.innerHTML = '<div class="loader"></div>';

        try {
            const res = await fetch(`${API_BASE}/generate-captions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, isPro })
            });
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            const captions = data.captions || [];

            const out = document.getElementById('dedCapOutput');
            out.innerHTML = (captions || []).map(txt => {
                const html = toItemCard(txt, null);
                return html.replace('class="item-card glass-card', 'class="item-card glass-card result-appear');
            }).join('');
            out.classList.remove('hidden');
        } catch (e) {
            console.error(e);
            showToast("Caption generation failed.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="pen-tool"></i> Generate Captions';
            lucide.createIcons();
        }
    });

    // -- 6. TAGS VIEW --
    document.getElementById('dedTagsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const topic = document.getElementById('dedTagsInput').value.trim();
        const btn = e.target.querySelector('button');

        // --- DUPLICATE CHECK ---
        if (lastUsedInputs.tags === topic) {
            showToast("Try a different niche for new tags!");
            return;
        }

        btn.disabled = true; // LOCK
        btn.innerHTML = '<div class="loader"></div>';
        lastUsedInputs.tags = topic;
        addToHistory('tags', topic);

        try {
            const res = await fetch(`${API_BASE}/generate-tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, isPro })
            });

            if (!res.ok) throw new Error("API Error");
            const data = await res.json();

            const output = document.getElementById('dedTagsOutput');
            if (output) output.classList.remove('hidden');

            // 1. Trending (Viral Momentum)
            const trendingEl = document.getElementById('tagsTrending');
            if (trendingEl && data.viral) {
                trendingEl.innerHTML = data.viral.map(t =>
                    `<div class="hashtag tag-trending" onclick="copyHash('${t}', this)"><i data-lucide="fire"></i>${t}</div>`
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
            lucide.createIcons();
        } catch (err) {
            console.error("Tags Error:", err);
            showToast("Hashtag server error.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="hash"></i> Generate Tags';
            lucide.createIcons();
            const out = document.getElementById('dedTagsOutput');
            if (out && !out.classList.contains('hidden')) {
                out.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });

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
        if (!confirm("Start your checklist from scratch? Your current progress will be lost.")) return;
        
        const popIn = document.getElementById('checklistRefreshing');
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

        lucide.createIcons();

        // Short faded hide (match CSS 1.5s animation)
        setTimeout(() => {
            if (popIn) popIn.classList.add('hidden');
        }, 1500);
    });

    // -- 8. TRENDS VIEW (Exactly 5 Trends, Detailed Copilot output) --
    document.getElementById('trendsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const val = document.getElementById('trendsInput').value.trim();
        const btn = e.target.querySelector('button');

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
        addToHistory('trends', val);
        
        btn.innerHTML = '<div class="loader"></div>';

        try {
            const res = await fetch(`${API_BASE}/trends`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ niche: val, isPro })
            });
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();

            document.getElementById('trendsEmpty').classList.add('hidden');
            const out = document.getElementById('trendsOutput');
            out.innerHTML = (data.trends || []).map(t => {
                const stars = Array(5).fill('').map((_, i) => `<i data-lucide="star" class="${i >= t.rep ? 'empty' : ''}"></i>`).join('');
                return `
                <div class="trend-card border-subtle result-appear animate-fade-in-up">
                    <div class="flex justify-between items-start mb-2">
                        <strong class="text-md text-primary font-bold" style="padding-right: 1rem;">${t.title}</strong>
                        <div class="stars-container flex-shrink-0">${stars}</div>
                    </div>
                    <p class="text-sm text-secondary line-height-15">${t.desc}</p>
                </div>
                `;
            }).join('');
            out.classList.remove('hidden');
        } catch (err) {
            console.error(err);
            showToast("Trends radar offline.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="trending-up"></i>';
            lucide.createIcons();
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
        const btn = e.target.querySelector('button');

        // --- DUPLICATE CHECK ---
        if (lastUsedInputs.rewrite === val) {
            showToast("Change the script before rewriting!");
            return;
        }

        // --- USAGE GATE ---
        if (getRemainingUses('rewrite') <= 0) {
            showLimitBlock(document.getElementById('view-rewrite'), 'rewrite');
            return;
        }

        btn.disabled = true; // LOCK
        consumeUse('rewrite');
        lastUsedInputs.rewrite = val;
        addToHistory('rewrite', val);
        
        btn.innerHTML = '<div class="loader"></div> Processing logic...';

        try {
            const res = await fetch(`${API_BASE}/rewrite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script: val, isPro })
            });
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            const rewritten = data.rewritten;

            document.getElementById('rewriteOutput').innerHTML = `
                <h4 class="font-bold text-accent mb-3 flex items-center gap-2"><i data-lucide="bot"></i> Viral AI Rewrite</h4>
                <div class="p-4 bg-card-dark result-appear" style="border-radius:8px; font-size:0.9rem; line-height:1.6; white-space:pre-wrap; border:1px solid rgba(255,255,255,0.05);">${rewritten}</div>
                <div class="item-actions mt-4"><button class="action-btn" style="background: var(--gradient-primary); color:white;" onclick="saveToVault('${rewritten.replace(/\n/g, "\\n").replace(/'/g, "\\'")}', 'rewrite', this)"><i data-lucide="archive"></i> Save AI Template</button></div>
            `;
            document.getElementById('rewriteOutput').classList.remove('hidden'); lucide.createIcons();
        } catch(e) {
            console.error(e);
            showToast("Server error. Check AI connection.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="file-text"></i> Rewrite Script';
            lucide.createIcons();
        }
    });

    // -- 10. SAVED VIEW --
    const renderSavedRewrites = () => {
        const list = document.getElementById('savedList');
        const empty = document.getElementById('savedEmpty');
        if (savedRewrites.length === 0) { list.innerHTML = ''; empty.classList.remove('hidden'); } else {
            empty.classList.add('hidden');
            list.innerHTML = savedRewrites.map((r, i) => `
                <div class="item-card relative result-appear">
                    <div class="text-xs text-muted mb-3 font-bold uppercase"><i data-lucide="file-text" style="width:12px;display:inline"></i> Saved AI Rewrite ${i + 1}</div>
                    <p class="item-text text-sm" style="white-space:pre-wrap; line-height:1.5;">${r}</p>
                    <button class="icon-button absolute" style="top:12px; right:12px;" onclick="deleteRewrite(${i})"><i data-lucide="trash-2" style="width:14px; color:var(--text-muted)"></i></button>
                </div>
            `).join('');
            lucide.createIcons();
        }
    };
    window.deleteRewrite = (index) => { savedRewrites.splice(index, 1); localStorage.setItem('viralreels_saved_rewrites', JSON.stringify(savedRewrites)); renderSavedRewrites(); };

    // -- ANALYTICS RENDER ENGINE --
    const renderAnalytics = () => {
        const list = document.getElementById('analyticsList');
        const empty = document.getElementById('analyticsEmpty');
        if (!list || !empty) return;

        if (analyticsData.length === 0) {
            empty.classList.remove('hidden');
            list.innerHTML = '';
            list.appendChild(empty);
            return;
        }
        empty.classList.add('hidden');
        list.innerHTML = '';

        analyticsData.slice().reverse().forEach((log) => {
            const el = document.createElement('div');
            el.className = 'glass-card p-3 rounded-md border-subtle bg-card-dark interactive-glow mb-2 result-appear';

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
                if (isNaN(val) || val <= 0) return alert("Enter valid view count");
                const target = analyticsData.find(a => a.id === id);
                if (target) {
                    target.actualViews = val;
                    localStorage.setItem('vr_analytics_data', JSON.stringify(analyticsData));
                    renderAnalytics();
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

        lucide.createIcons();
    };

    // -- AI CHAT LOGIC --
    const chatForm = document.getElementById('chatForm');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatLogsList = document.getElementById('chatLogsList');
    let chatHistory = JSON.parse(localStorage.getItem('vr_chat_history') || '[]');

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

    function renderChatLogs() {
        if (!chatLogsList) return;
        if (chatHistory.length === 0) {
            chatLogsList.innerHTML = `
                <div class="empty-state glass-card py-10">
                    <i data-lucide="history" class="lg-icon mb-2 opacity-20"></i>
                    <p class="text-xs text-muted">No past logs found.</p>
                </div>
            `;
            lucide.createIcons();
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
        lucide.createIcons();
    }

    window.viewChatLog = (id) => {
        const log = chatHistory.find(l => l.id === id);
        if (!log) return;
        
        // Populate chat messages and switch tab
        chatMessages.innerHTML = `
            <div class="chat-bubble bubble-user result-appear">${log.userMsg}</div>
            <div class="chat-bubble bubble-ai result-appear">${log.aiMsg}</div>
        `;
        document.querySelector('[data-subtab="sub-chat-live"]').click();
        lucide.createIcons();
    };

    document.getElementById('clearChatLogsBtn')?.addEventListener('click', () => {
        if (confirm("Delete all past conversations?")) {
            chatHistory = [];
            localStorage.setItem('vr_chat_history', '[]');
            renderChatLogs();
            showToast("History cleared.");
        }
    });

    // Initial render
    renderChatLogs();

    if (chatForm) {
        const chatSubmit = chatForm.querySelector('button');
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = chatInput.value.trim();
            if (!msg) return;

            // Add user bubble
            const uEl = document.createElement('div');
            uEl.className = 'chat-bubble bubble-user result-appear';
            uEl.textContent = msg;
            chatMessages.appendChild(uEl);
            chatInput.value = '';
            chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });

            chatSubmit.disabled = true;
            chatSubmit.innerHTML = '<div class="loader"></div>';

            // AI thinking
            const aiDiv = document.createElement('div');
            aiDiv.className = 'chat-bubble bubble-ai result-appear';
            aiDiv.innerHTML = '<div class="loader" style="width:12px; height:12px;"></div>';
            chatMessages.appendChild(aiDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                const personaNiche = document.getElementById('personaNiche').options[document.getElementById('personaNiche').selectedIndex].text;
                const personaTone = document.getElementById('personaTone').value;

                const res = await fetch(`${API_BASE}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: msg, persona: { niche: personaNiche, tone: personaTone }, isPro })
                });
                if (!res.ok) throw new Error("API Error");
                const data = await res.json();
                
                aiDiv.textContent = data.reply || "Strategic advisor offline.";
                if (data.reply) saveChatLog(msg, data.reply);
            } catch(e) {
                console.error(e);
                aiDiv.textContent = "I'm offline right now. Check your server connection.";
            } finally {
                chatSubmit.disabled = false;
                chatSubmit.innerHTML = '<i data-lucide="send"></i>';
                chatInput.focus();
                chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
                lucide.createIcons();
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
        });
    }

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

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            const dateStr = futureDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

            if (isSubCancelled) {
                planRenewalText.innerHTML = `<span class="text-red">Expires on ${dateStr}</span>`;
                cancelSubBtn.innerHTML = '<i data-lucide="refresh-cw"></i> Reactivate Auto-Renew';
                cancelSubBtn.classList.remove('text-red');
                cancelSubBtn.classList.add('text-gold');
            } else {
                planRenewalText.textContent = `Renews on ${dateStr}`;
                cancelSubBtn.innerHTML = '<i data-lucide="x-circle"></i> Cancel Subscription';
                cancelSubBtn.classList.add('text-red');
                cancelSubBtn.classList.remove('text-gold');
            }
        } else {
            billingStatePro.classList.add('hidden');
            billingStateStandard.classList.remove('hidden');
        }
        lucide.createIcons();
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

    if (cancelSubBtn) {
        cancelSubBtn.addEventListener('click', () => {
            if (!isSubCancelled) {
                if (confirm("Are you sure you want to cancel? You will keep Pro access until the end of your billing cycle, but it will not renew.")) {
                    isSubCancelled = true;
                    localStorage.setItem('vr_sub_cancelled', 'true');
                    showToast("Cancellation confirmed. Renews off.");
                    updateBillingUI();
                }
            } else {
                isSubCancelled = false;
                localStorage.setItem('vr_sub_cancelled', 'false');
                showToast("Subscription reactivated!");
                updateBillingUI();
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
                    const bodyData = firebase.auth().currentUser ? JSON.stringify({ uid: firebase.auth().currentUser.uid }) : JSON.stringify({});
                    const res = await fetch(`${API_BASE}/checkout`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: bodyData
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

    if (window.firebase && window.firebase.auth) {
        try {
            firebase.initializeApp(firebaseConfig);
            const auth = firebase.auth();

            // Check Auth State
            auth.onAuthStateChanged((user) => {
                if (user) {
                    authOverlay.classList.add('hidden');
                    appContainer.classList.remove('hidden');
                    lucide.createIcons();
                    showToast("Logged in securely.");
                    if (!isOnboardingComplete) {
                        document.getElementById('onboardingOverlay').classList.remove('hidden');
                    }
                } else {
                    authOverlay.classList.remove('hidden');
                    appContainer.classList.add('hidden');
                }
            });

            // Email Form Submit
            if (emailLoginForm) {
                emailLoginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const email = document.getElementById('authEmail').value;
                    const pass = document.getElementById('authPass').value;
                    authSubmitBtn.innerHTML = '<div class="loader"></div>';
                    
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
                        showToast("Auth Error: Check API Key or try again.");
                        authSubmitBtn.innerHTML = 'Sign In / Create Account';
                    });
                });
            }

            // Google Login
            if (googleLoginBtn) {
                googleLoginBtn.addEventListener('click', () => {
                    googleLoginBtn.innerHTML = '<div class="loader"></div> Processing...';
                    const provider = new firebase.auth.GoogleAuthProvider();
                    auth.signInWithPopup(provider).catch(err => {
                        console.error(err);
                        showToast("Google Auth Failed. Check API Key.");
                        googleLoginBtn.innerHTML = '<i data-lucide="chrome"></i> Continue with Google';
                        lucide.createIcons();
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

    function setupMockAuth() {
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => {
                authOverlay.classList.add('hidden');
                appContainer.classList.remove('hidden');
                lucide.createIcons();
                if (!isOnboardingComplete) document.getElementById('onboardingOverlay').classList.remove('hidden');
            });
        }
        if (emailLoginForm) {
            emailLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                authOverlay.classList.add('hidden');
                appContainer.classList.remove('hidden');
                lucide.createIcons();
                if (!isOnboardingComplete) document.getElementById('onboardingOverlay').classList.remove('hidden');
            });
        }
    }
});
