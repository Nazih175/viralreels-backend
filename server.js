require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const admin = require('firebase-admin');

// Initialize Firebase Admin gracefully
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("🔥 Firebase Admin Initialized Successfully");
    } catch (e) {
        console.error("🔥 Firebase Admin Init Error:", e.message);
    }
} else {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT not found. DB webhooks won't work.");
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// -- PERFORMANCE CACHING SYSTEM --
const trendsCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 Minute TTL for News/Trends

// -- ROBUST SCHEMA VALIDATOR --
function sanitizeAiResponse(raw, requiredKeys) {
    try {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const missing = requiredKeys.filter(k => !(k in data));
        if (missing.length > 0) {
            console.warn(`[Zenith Guard] Patching missing keys: ${missing.join(', ')}`);
            missing.forEach(k => {
                if (k === 'score' || k === 'value' || k === 'hookStrength' || k === 'retention') data[k] = 0;
                else if (Array.isArray(data[k])) data[k] = [];
                else data[k] = "N/A";
            });
        }
        return data;
    } catch (e) {
        console.error("[Zenith Guard] Fatal AI JSON Corruption. Sending baseline.");
        const baseline = {};
        requiredKeys.forEach(k => {
            if (k === 'score' || k === 'hookStrength' || k === 'retention') baseline[k] = 0;
            else if (k === 'tips' || k === 'hooks' || k === 'captions' || k === 'data_points') baseline[k] = [];
            else baseline[k] = "N/A";
        });
        return baseline;
    }
}

// -- SECURE PRO RECOGNITION MIDDLEWARE --
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // 1. Definite Guest/Missing Token (Allow as Free)
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader === 'Bearer guest-token') {
        req.isPro = false;
        console.log(`[Auth Bridge] Accepted GUEST (Mode: Free)`);
        return next();
    }

    const token = authHeader.split('Bearer ')[1];
    
    // 2. Token Provided - Attempt Firebase Verification
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        
        req.user = decodedToken;
        req.isPro = userDoc.exists ? (userDoc.data().isPro || false) : false;
        
        console.log(`[Auth Zenith] Verified User: ${decodedToken.email} | Status: ${req.isPro ? 'PRO' : 'FREE'}`);
        next();
    } catch (error) {
        console.warn(`[Auth Warning] Token verification failed [${error.message}]. Defaulting to Free.`);
        req.isPro = false;
        next();
    }
};

// Middleware
app.use(cors({
    origin: ['https://nazih175.github.io', 'http://localhost:3000', 'http://127.0.0.1:3000', 'https://nazih175.github.io/viralreels-backend'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature']
}));
app.use(express.static('.'));
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ limit: '300mb', extended: true }));

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// -- USAGE ANALYTICS ENDPOINT --
// Tracks which tools are most popular (Hooks, Chat, Tags, etc.)
app.post('/api/log-usage', async (req, res) => {
    const { tool, uid } = req.body;
    if (!tool) return res.status(400).json({ error: 'Missing tool name' });

    try {
        const db = admin.firestore();
        const statsRef = db.collection('system_stats').doc('usage');
        
        await statsRef.set({
            total_generations: admin.firestore.FieldValue.increment(1),
            [`tools.${tool}`]: admin.firestore.FieldValue.increment(1),
            last_activity: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Optional: Log per-user activity in the user's document
        if (uid) {
            await db.collection('users').doc(uid).update({
                totalUsed: admin.firestore.FieldValue.increment(1),
                lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
                [`stats.${tool}`]: admin.firestore.FieldValue.increment(1)
            }).catch(() => {}); // Ignore if user doc doesn't exist yet
        }

        res.json({ success: true });
    } catch (err) {
        console.warn(`[Analytics] Minimal logging error: ${err.message}`);
        res.status(500).json({ error: 'Failed to log usage' });
    }
});

// -- GLOBAL REQUEST TIMEOUT MIDDLEWARE (25 seconds) --
// Kills any request that hasn't responded within 25s to prevent indefinite hangs.
app.use((req, res, next) => {
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            console.warn(`[Timeout] ${req.method} ${req.url} timed out after 25s`);
            res.status(503).json({ error: 'Request timed out. The AI is busy — please try again.' });
        }
    }, 25000);
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    next();
});

// Endpoint 7: Stripe Webhook Listener (Must be before express.json to get raw body)
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    if (!endpointSecret) {
        console.warn('⚠️ Webhook Secret missing. Ignoring signature verification for testing.');
        event = JSON.parse(req.body.toString());
    } else {
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error(`Webhook Error: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }

    // --- CASE 1: INITIAL SUBSCRIPTION SUCCESS ---
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const uid = session.client_reference_id;
        const customerId = session.customer;

        if (uid) {
            try {
                const db = admin.firestore();
                await db.collection('users').doc(uid).set({
                    isPro: true,
                    stripeCustomerId: customerId,
                    proActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    stripeSubscriptionId: session.subscription
                }, { merge: true });
                console.log(`✅ [Webhook] Upgraded User [${uid}] to Pro. Saved CustomerID: ${customerId}`);
            } catch (err) {
                console.error(`❌ [Webhook] Firestore upgrade error for ${uid}:`, err.message);
            }
        }
    }

    // --- CASE 2: SUBSCRIPTION REVOKED / CANCELED ---
    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // If the subscription is no longer active/trialing, revoke access
        if (subscription.status !== 'active' && subscription.status !== 'trialing') {
            try {
                const db = admin.firestore();
                const userQuery = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
                
                if (!userQuery.empty) {
                    const userDoc = userQuery.docs[0];
                    await userDoc.ref.update({ isPro: false });
                    console.log(`📉 [Webhook] Revoked Pro for ${userDoc.id} (Subscription Status: ${subscription.status})`);
                }
            } catch (err) {
                console.error(`❌ [Webhook] Revoke error for customer ${customerId}:`, err.message);
            }
        }
    }

    res.status(200).send();
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'active', message: 'ViralReels AI Backend is running securely.' });
});

// Endpoint 1: Analyzer (Predictor)
// 2026 VIRAL PLAYBOOK: Expert Strategy & Data-Driven Heuristics
const VIRAL_PLAYBOOK = `
[ELITE HOOK ARCHITECTURE]
- Negative Curiosity: "Stop using [X] for [Y]. Here is the 1% trick that actually works."
- Identity Signal: "If you want to be [Identity], you need to see this."
- Pattern Interrupt: "I spent 100 hours analyzing [Topic] so you don't have to."
- Contrarian: "Everyone is lying to you about [Topic]. This is the real truth."
- Immediate Payoff: No intro. High-value data drop in the first 0.5s.

[2026 ALGORITHM SIGNALS]
- Completion rate: The #1 ranked factor. Every sentence must lead to the next.
- Saveability: Create "cheat sheets" or "blueprints" that force a Bookmark.
- SEO Metadata: Platform AI scans spoken word + on-screen text. Keywords are mandatory.
- Loop Potential: Seamless transitions that trick the brain into a second watch.

[RETENTION BLUEPRINTS]
- 0-2s: The Pattern Interrupt (Stop the scroll)
- 3-7s: The Payoff Promise (Why they should stay)
- 8-15s: The Narrative Friction (The problem or challenge)
- 16-45s: The Value Density (No fluff, just the solution)
- 45s+: The Community CTA (Drive a specific debate in the comments)
`;

// Strict constraints to ensure AI doesn't sound like a bot
const EXPERT_TONE_GUIDELINES = `
[RESPONSE PROTOCOL]
- TONE: Professional, slightly direct, realistic, and authoritative. Sound like a mentor, not a chatbot.
- HUMANIZATION: Never use robotic fillers (e.g., "Certainly!", "I have analyzed", "Based on your input", "I hope this helps"). 
- STRUCTURE: Use sentence fragments for impact. Be punchy. 
- REALISM: If an idea is mediocre, say so realistically without being "mean". Give the tactical fix.
- NO PLACEHOLDERS: Generate real, usable content. Never say "[Your Name]" or "[Niche]".
`;

app.post('/api/analyze', authenticate, async (req, res) => {
    console.log(`[ViralReels Backend] POST /api/analyze - Idea: "${req.body.idea?.substring(0, 30)}..."`);
    try {
        const { idea, platform, length, niche = 'general' } = req.body;
        const isPro = req.isPro; // SECURE RECOGNITION
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const platformContext = {
            tiktok: 'TikTok: Hook must land in 0.5s. Optimal pacing: cut every 2-3s. Sound-on culture. Comment-bait > share-bait.',
            reels: 'Instagram Reels: Visual aesthetics matter more. Save-rate is the top signal. Text overlays critical for silent viewers (85% watch muted).',
            shorts: 'YouTube Shorts: Longer retention window (up to 60s). Loop-backs rewarded. Educational > entertainment bias.',
            all: 'Multi-platform: Optimize for broadest hook appeal, 15-30s sweet spot, universal entertainment value.'
        }[platform] || 'Multi-platform optimization.';

        const freePrompt = `You are a 2026 Realistic Virality Strategist.

[INTEL & TONE]
${VIRAL_PLAYBOOK}
${EXPERT_TONE_GUIDELINES}

Platform Context: ${platformContext}

YOUR TASK: Analyze the idea realistically. Do not hype it up if it lacks a hook. 

SCORING RUBRIC:
- score (0-100): High bar. Mediocre ideas = 40-60. Great ideas = 80+.
- hookStrength (0-10): How fast does it stop a scroll?
- retention (0-100): Predicted watch-time depth.
- tips: 3 tactical, realistic fixes to "hook" the viewer and drive saves.

Return ONLY JSON: { "score": number, "hookStrength": number, "retention": number, "tips": [string×3] }`;

        const proPrompt = `You are an Elite 2026 Virality Architect. You design content that moves the needle.

[INTEL & TONE]
${VIRAL_PLAYBOOK}
${EXPERT_TONE_GUIDELINES}

Platform Context: ${platformContext}

YOUR TASK: Provide a high-level strategic audit. Be brutally realistic but tactically brilliant. 

SCORING RUBRIC:
- score (0-100): The "Viral Stress Test."
- hookStrength (0-10): 0.5s impact score.
- retention (0-100): Expected watch-time curve.
- tips: 5 expert-level retention hacks.
- insight: One high-level algorithm secret specific to this niche.

Return ONLY JSON: { "score": number, "hookStrength": number, "retention": number, "tips": [string×5], "insight": string }`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: `Analyze this video idea:\n\nIdea: ${idea}\nPlatform: ${platform}\nLength: ${length}\nNiche: ${niche}` }
            ],
            max_tokens: isPro ? 700 : 500,
            temperature: 0.7
        }, { signal: controller.signal });

        clearTimeout(timeoutId);
        const validated = sanitizeAiResponse(completion.choices[0].message.content, isPro ? 
            ['score', 'hookStrength', 'retention', 'tips', 'insight'] : 
            ['score', 'hookStrength', 'retention', 'tips']);
        res.json(validated);
    } catch (e) {
        console.error('Analyzer Error:', e.message);
        res.status(500).json({ error: 'AI engine timed out or disconnected. Please try again.' });
    }
});

// Endpoint 2: Hooks & Captions Generator
app.post('/api/generate-hooks', authenticate, async (req, res) => {
    try {
        const { topic, tone, audience } = req.body;
        const isPro = req.isPro; // SECURE RECOGNITION
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const hookFormulas = `
PROVEN 2026 HOOK FORMULAS — use these as your architecture:
1. [NEGATIVE] "Why [common belief] is destroying your [outcome]" — controversy + identity threat
2. [CURIOSITY GAP] "The one thing [authority] never tells you about [topic]" — open loop
3. [PATTERN INTERRUPT] Start mid-action. No intro. Drop the viewer into the highest-value moment.
4. [IDENTITY] "If you [identity trait], you already know this" — group membership trigger
5. [STATISTIC SHOCK] Lead with a number that defies expectations
6. [LOOP OPEN] Ask a question the viewer MUST stay to see answered
7. [CONTRARIAN] "Everyone says [popular advice]. They're wrong. Here's why:"
8. [TRANSFORMATION] "[Before state] → [After state] in [timeframe]"

PLATFORM RULES:
- TikTok: Max 8 words. Sound-on. Must create immediate verbal curiosity.
- Reels: Visual-first. Text overlay must work without audio.
- Shorts: Can be slightly longer (10-12 words). Educational tone allowed.`;

        const freePrompt = `You are a 2026 Viral Hook Specialist.

[INTEL & TONE]
${VIRAL_PLAYBOOK}
${EXPERT_TONE_GUIDELINES}

Topic: ${topic}

Generate 4 scroll-stopping hooks and 2 tactical captions. Use formulas from the PLAYBOOK. 

Return ONLY JSON: { "hooks": [4 strings, formatted "[FORMULA] Hook text"], "captions": [2 platform-optimized strings] }`;

        const proPrompt = `You are an Elite 2026 Viral Content Architect. 

[INTEL & TONE]
${VIRAL_PLAYBOOK}
${EXPERT_TONE_GUIDELINES}

Niche: ${audience}
Topic: ${topic}

Generate 6 elite hooks using the most advanced PLAYBOOK formulas. 

HOOK REQUIREMENTS:
- Land the hook in < 0.5 seconds
- No intro. Zero fluff.
- Include mechanism in brackets: [CURIOSITY GAP], [IDENTITY], etc.

Return ONLY JSON: { "hooks": [6 strings], "captions": [3 strings] }`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: `Generate hooks for: ${topic} (Niche: ${audience})` }
            ],
            max_tokens: 900,
            temperature: 0.9
        }, { signal: controller.signal });

        clearTimeout(timeoutId);
        const validated = sanitizeAiResponse(completion.choices[0].message.content, ['hooks', 'captions']);
        res.json(validated);
    } catch (e) {
        console.error('Hooks Error:', e.message);
        res.status(500).json({ error: 'Hook generator timed out. Please try again.' });
    }
});

// Endpoint 2.5: Dedicated Unique Captions Generator
app.post('/api/generate-captions', authenticate, async (req, res) => {
    try {
        const { topic, niche = 'general', style = 'engaging' } = req.body;
        const model = 'gpt-4o-mini';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: `You are a 2026 Tactical Caption Architect.

[INTEL & TONE]
${EXPERT_TONE_GUIDELINES}

Niche: ${niche}
Style: ${style}

CAPTION MANDATE:
- TikTok: Punchy, high-energy, SEO-dense.
- Reels: Save-worthy insight. Hook first.
- Shorts: Direct, keyword-forward.

FORMULAS: [HYPED], [EDUCATIONAL], [STORYTIME], [CONTROVERSIAL], [MINIMALIST].

Real creators use these as-is. No placeholders. No robot speak.

Return ONLY JSON: { "captions": [5 ready-to-post strings, each labeled with [TYPE]] }` },
                { role: 'user', content: `Write captions for: ${topic} (Niche: ${niche}, Style: ${style})` }
            ],
            max_tokens: 600,
            temperature: 0.85
        });

        clearTimeout(timeoutId);
        const parsed = JSON.parse(completion.choices[0].message.content);
        if (!parsed.captions) throw new Error("Invalid Format");
        res.json(parsed);
    } catch (e) {
        console.error('Captions Error:', e.message);
        res.status(500).json({ error: 'Caption generator timed out. Please try again.' });
    }
});

// Endpoint 2.6: Hashtag Generator
app.post('/api/generate-tags', authenticate, async (req, res) => {
    try {
        const { topic, niche = 'general' } = req.body;
        const model = 'gpt-4o-mini';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: `You are a 2026 short-form video SEO specialist. You understand how hashtags function differently across TikTok, Instagram, and YouTube Shorts.

Niche: ${niche}

HASHTAG STRATEGY:
- VIRAL (broad reach): 50M-500M posts. Gets you on For You/Explore pages. High competition but necessary.
- NICHE (targeted reach): 1M-20M posts. Algorithmic sweet spot. Highly relevant community.
- RECOMMENDED (long-tail/rising): Under 1M posts or trending upward. Fastest path to ranking #1 in a tag.

RULES:
- No generic tags like #fyp #foryou #viral that are algorithmic dead weight in 2026
- Include at least 2 tags that are trending or rising in the specific niche
- Mix topic + format tags (e.g., #dogtricks AND #dogvideo AND #pettok)
- All tags must be lowercase, no spaces, no # symbol included (frontend handles that)
- 8 per category, all unique, no duplicates across categories

Return JSON: { "viral": [8 strings], "niche": [8 strings], "recommended": [8 strings] }` },
                { role: 'user', content: `Generate optimized hashtags for: ${topic} (Niche: ${niche})` }
            ],
            max_tokens: 500,
            temperature: 0.7
        });

        clearTimeout(timeoutId);
        const parsed = JSON.parse(completion.choices[0].message.content);
        if (!parsed.viral || !parsed.niche) throw new Error("Invalid Schema");
        res.json(parsed);
    } catch (e) {
        console.error('Tags Error:', e.message);
        res.status(500).json({ error: 'Hashtag generator timed out. Please try again.' });
    }
});

// Endpoint 3: Script Rewriter
app.post('/api/rewrite', authenticate, async (req, res) => {
    try {
        const { script, niche = 'general' } = req.body;
        const isPro = req.isPro; // SECURE RECOGNITION
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: `You are the 2026 Script Architect. 

[INTEL & TONE]
${VIRAL_PLAYBOOK}
${EXPERT_TONE_GUIDELINES}

Your mission: Re-engineer this script for high-retention. Delete all boring intros. 

Label sections: [HOOK], [PEAK VALUE], [RETENTION BRIDGE], [CTA]
Include a [PRO TIP] for realistic editing.` },
                { role: 'user', content: `Rewrite this script:\n\n${script}` }
            ],
            max_tokens: 900,
            temperature: 0.8
        });

        clearTimeout(timeoutId);
        res.json({ rewritten: completion.choices[0].message.content });
    } catch (e) {
        console.error('Rewrite Error:', e.message);
        res.status(500).json({ error: 'Rewriter timed out. Please try again.' });
    }
});

// Endpoint 4: AI Consultant Chat
app.post('/api/chat', authenticate, async (req, res) => {
    try {
        const { message, context, history } = req.body;
        const isPro = req.isPro; // SECURE RECOGNITION
        const model = 'gpt-4o-mini';
        const niche = context?.niche || 'general';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const systemPrompt = `You are the 2026 Algorithm Virality Architect. 

[INTEL & TONE]
${VIRAL_PLAYBOOK}
${EXPERT_TONE_GUIDELINES}

Persona: High-level Growth Strategist. You don't "assist"—you architect. 

MANDATE:
- SATISFACTION PER SWIPE (Lead with payoff)
- RETENTION ENGINEERING (Cuts every 2s)
- DEBATE-BAIT (Drive comments)

Max 5 sentences. Realistic advice. Zero AI fluff.`;

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            max_tokens: 400,
            temperature: 0.8
        }, { signal: controller.signal });

        clearTimeout(timeoutId);
        res.json({ reply: completion.choices[0].message.content });
    } catch (e) {
        console.error('Chat Error:', e.message);
        res.status(500).json({ error: 'AI consultant timed out. Please try again.' });
    }
});

// Endpoint 4b: AI Chat — STREAMING (SSE) Version
app.post('/api/chat-stream', authenticate, async (req, res) => {
    try {
        const { message, persona, isPro } = req.body;
        const niche = persona?.niche || 'general';

        const systemPrompt = `You are the 2026 Algorithm Virality Architect. 

[INTEL & TONE]
${VIRAL_PLAYBOOK}
${EXPERT_TONE_GUIDELINES}

Persona: High-level Growth Strategist. You don't "assist"—you architect. 

MANDATE:
- SATISFACTION PER SWIPE (Lead with payoff)
- RETENTION ENGINEERING (Cuts every 2s)
- DEBATE-BAIT (Drive comments)

Max 5 sentences. Realistic advice. Zero AI fluff.`;

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => { controller.abort(); }, 20000);

        const stream = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            max_tokens: 400,
            temperature: 0.8,
            stream: true,
        }, { signal: controller.signal });

        let fullReply = '';
        for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || '';
            if (token) {
                fullReply += token;
                res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
        }

        clearTimeout(timeoutId);
        res.write(`data: [DONE]\n\n`);
        res.end();

    } catch (e) {
        console.error('Chat Stream Error:', e.message);
        if (!res.headersSent) res.status(503).json({ error: 'Stream timed out.' });
        else { res.write(`data: ${JSON.stringify({ error: 'Connection lost. Please retry.' })}\n\n`); res.end(); }
    }
});

// --- LIVE TRENDS ENGINE (RSS FETCH) ---
async function fetchLiveTrends(niche) {
    try {
        const query = encodeURIComponent(`${niche} trending short form video 2026`);
        const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
        
        const response = await fetch(url);
        if (!response.ok) return [];
        const text = await response.text();
        
        // Lightweight Regex XML Parsing (Zero Dependency)
        const titles = [];
        const matches = text.matchAll(/<title>(.*?)<\/title>/g);
        for (const match of matches) {
            const t = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
            if (t && !t.includes('Google News')) titles.push(t);
            if (titles.length >= 8) break; 
        }
        return titles;
    } catch (e) {
        console.error("Live fetch error:", e.message);
        return [];
    }
}

// Endpoint 5: Trends Radar (UPGRADED: REAL-TIME DATA BRIDGE)
app.post('/api/trends', authenticate, async (req, res) => {
    try {
        const { topic } = req.body;
        const isPro = req.isPro; // SECURE RECOGNITION
        const searchTopic = (topic || 'general').toLowerCase();
        
        // 0. Cache Lookup (Optimization for 100/100 score)
        const cached = trendsCache.get(searchTopic);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            console.log(`[Trends Cache] Serving HIT for: ${searchTopic}`);
            return res.json(cached.data);
        }

        const model = 'gpt-4o-mini';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 22000);

        // 1. Fetch Real-time Context
        console.log(`[Trends Bridge] Fetching live data for: ${topic}...`);
        const liveContext = await fetchLiveTrends(topic);
        const contextString = liveContext.length > 0 
            ? `REAL-TIME DATA PULLED FROM LIVE NEWS FEEDS:\n- ${liveContext.join('\n- ')}`
            : "No live news found. Fallback to algorithm knowledge.";

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: `You are the 2026 Live Trend Intelligence Bridge. 
                
[LIVE CONTEXT]
${contextString}

[INTEL & TONE]
${VIRAL_PLAYBOOK}
${EXPERT_TONE_GUIDELINES}

YOUR MANDATE: Analyze live data. Predict viral waves. Be realistic.

Return JSON: {
  "data_points": [
    { "label": "Hook-Velocity", "value": number },
    { "label": "Retention-Score", "value": number },
    { "label": "Competition-Level", "value": number },
    { "label": "Engagement-Rate", "value": number },
    { "label": "Longevity", "value": number }
  ],
  "verdict": "Bold 1-sentence expert prediction.",
  "recommendation": ["Tactical 1", "Tactical 2", "Tactical 3"],
  "isLive": true
}` },
                { role: 'user', content: `Analyze real-time viral potential for: ${topic}` }
            ],
            max_tokens: 600,
            temperature: 0.7
        });

        clearTimeout(timeoutId);
        const validated = sanitizeAiResponse(completion.choices[0].message.content, ['data_points', 'verdict', 'recommendation']);
        
        // Update Cache
        trendsCache.set(topic, { data: validated, timestamp: Date.now() });
        
        res.json(validated);
    } catch (e) {
        console.error('Trends Error:', e.message);
        res.status(500).json({ error: 'Trends radar timed out. Please try again.' });
    }
});


// Endpoint 6: Stripe Checkout Session Generator
app.post('/api/checkout', async (req, res) => {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://nazih175.github.io/viralreels-backend';
    const { uid } = req.body;
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: uid || null,
            metadata: { user_id: uid || 'anonymous' },
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'ViralReels AI Pro',
                        description: 'Unlimited Hooks, Captions, Trending Tags, AI Consultant, & Premium Video AI Analytics.',
                        images: ['https://nazih175.github.io/viralreels-backend/assets/social_preview.png'],
                    },
                    unit_amount: 999, // $9.99
                    recurring: { interval: 'month' },
                },
                quantity: 1,
            }],
            mode: 'subscription',
            subscription_data: {
                trial_period_days: 7,
            },
            success_url: `${FRONTEND_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/?checkout=canceled`,
        });

        res.json({ url: session.url });
    } catch (e) {
        console.error("Stripe Checkout ERROR:", e.message);
        res.status(500).json({ 
            error: "Failed to initialize checkout.", 
            detail: e.message,
            hint: e.message.includes('No API key provided') ? "Check your STRIPE_SECRET_KEY in Render Environment Variables." : "Check your Stripe Dashboard for account status."
        });
    }
});

// Endpoint 6.05: Stripe Customer Portal Session
app.post('/api/create-portal-session', async (req, res) => {
    try {
        const { uid, email } = req.body;
    
        // Step 1: Check Firestore for a pre-saved Stripe Customer ID (FASTEST)
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(uid).get();
        let customerId = userDoc.exists ? userDoc.data().stripeCustomerId : null;

        // Step 2: Fallback to Search if not in DB yet
        if (!customerId) {
            console.log(`[Portal] CustomerID not in DB. Searching Strike...`);
            let customers = await stripe.customers.list({ email: email, limit: 1 });
            
            if (customers.data.length === 0 && uid) {
                customers = await stripe.customers.search({
                    query: `metadata['user_id']:'${uid}'`,
                    limit: 1
                });
            }

            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
                // Proactively save it for next time
                await db.collection('users').doc(uid).update({ stripeCustomerId: customerId });
            }
        }

        if (!customerId) {
            return res.status(400).json({ error: "No active subscription found. Please upgrade first." });
        }

        // Step 3: Create portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: req.headers.origin || 'https://nazih175.github.io/viralreels-backend/',
        });

        res.json({ url: portalSession.url });
    } catch (e) {
        console.error("Portal Error Detail:", e);
        res.status(500).json({ 
            error: "Could not create portal session.", 
            detail: e.message,
            hint: "Make sure Customer Portal is ENABLED in your Stripe Dashboard (Settings > Customer Portal)."
        });
    }
});

// Endpoint 6.1: Verify Checkout Session
app.post('/api/verify-session', async (req, res) => {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: "Missing session_id" });
    
    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status === 'paid') {
            res.json({ success: true, email: session.customer_details?.email });
        } else {
            res.json({ success: false, status: session.payment_status });
        }
    } catch (e) {
        console.error("Session verification error:", e.message);
        res.status(500).json({ error: "Verification failed." });
    }
});



// Start Server
app.listen(PORT, () => {
    console.log(`🚀 ViralReels AI Backend running on port ${PORT}`);
    console.log(`🔐 AI Connected: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
});
