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

// Middleware

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

// Endpoint 7: Stripe Webhook Listener (Must be before express.json to get raw body)
app.post('/api/webhook', express.raw({type: 'application/json'}), (req, res) => {
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

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log(`✅ Payment received! Session ID: ${session.id}`);
        
        const uid = session.client_reference_id;
        if (uid) {
            try {
                // Update Firestore User Record
                const db = admin.firestore();
                db.collection('users').doc(uid).set({
                    isPro: true,
                    proActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    stripeSessionId: session.id
                }, { merge: true });
                console.log(`✅ Successfully upgraded Firebase User [${uid}] to Pro!`);
            } catch (err) {
                console.error(`❌ Failed to update Firebase for user ${uid}: ${err.message}`);
            }
        } else {
            console.warn("⚠️ No client_reference_id found. Cannot upgrade anonymous checkout.");
        }
    }

    res.status(200).send();
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'active', message: 'ViralReels AI Backend is running securely.' });
});

// Endpoint 1: Analyzer (Predictor)
// 2026 VIRAL PLAYBOOK: Expert Few-Shot Context
const VIRAL_PLAYBOOK = `
[ELITE HOOK EXAMPLES]
- Negative Curiosity: "Stop using [X] for [Y]. Here is the 1% trick that actually works."
- Identity Signal: "If you want to be [Identity], you need to see this."
- Pattern Interrupt: "I spent 100 hours analyzing [Topic] so you don't have to."
- Contrarian: "Everyone is lying to you about [Topic]. This is the real truth."
- Loop Opener: "Most people fail at [Topic] because of one tiny mistake. Look at this."

[RETENTION BLUEPRINTS]
- 0-2s: The Hook (Immediate value drop)
- 3-7s: The Reassurance (Explain the payoff)
- 8-15s: The Narrative Bridge (Introduce a minor conflict or counterpoint)
- 16-30s: The Resolution (Quick value density)
- 31-45s: The Engagement Bait (Polarizing statement or CTA)
`;

app.post('/api/analyze', async (req, res) => {
    console.log(`[ViralReels Backend] POST /api/analyze - Idea: "${req.body.idea?.substring(0, 30)}..."`);
    try {
        const { idea, platform, length, isPro, niche = 'general' } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const platformContext = {
            tiktok: 'TikTok: Hook must land in 0.5s. Optimal pacing: cut every 2-3s. Sound-on culture. Comment-bait > share-bait.',
            reels: 'Instagram Reels: Visual aesthetics matter more. Save-rate is the top signal. Text overlays critical for silent viewers (85% watch muted).',
            shorts: 'YouTube Shorts: Longer retention window (up to 60s). Loop-backs rewarded. Educational > entertainment bias.',
            all: 'Multi-platform: Optimize for broadest hook appeal, 15-30s sweet spot, universal entertainment value.'
        }[platform] || 'Multi-platform optimization.';

        const freePrompt = `You are a 2026 short-form video virality analyst.

[CONTEXT PLAYBOOK]
${VIRAL_PLAYBOOK}

Platform Context: ${platformContext}
Content Niche: ${niche}
Video Length: ${length}

SCORING RUBRIC:
- score (0-100): Viral probability.
- hookStrength (0-10): How fast does the first frame grab attention?
- retention (0-100): Estimated % of viewers who watch past the 50% mark.
- tips: 3 SPECIFIC, ACTIONABLE improvements using the PLAYBOOK architecture.

Return ONLY valid JSON matching this schema: { "score": number, "hookStrength": number, "retention": number, "tips": [string, string, string] }`;

        const proPrompt = `You are an Elite 2026 Virality Architect — the top 0.1% of short-form video strategists.

[CONTEXT PLAYBOOK]
${VIRAL_PLAYBOOK}

Platform Context: ${platformContext}
Content Niche: ${niche}
Video Length: ${length}

SCORING RUBRIC:
- score (0-100): True viral probability using 2026 algorithm signals.
- hookStrength (0-10): Pattern-interrupt power of the first 0.5 seconds.
- retention (0-100): Predicted mid-video retention rate.
- tips: 5 ELITE, highly-specific upgrade techniques with exact timestamps.
- insight: 1 COUNTERINTUITIVE algorithm unlock.

Return ONLY valid JSON: { "score": number, "hookStrength": number, "retention": number, "tips": [string×5], "insight": string }`;

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
        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (e) {
        console.error('Analyzer Error:', e.message);
        res.status(500).json({ error: 'AI engine timed out or disconnected. Please try again.' });
    }
});

// Endpoint 2: Hooks & Captions Generator
app.post('/api/generate-hooks', async (req, res) => {
    try {
        const { topic, isPro, niche = 'general' } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

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

        const freePrompt = `You are a 2026 viral hook specialist.

[CONTEXT PLAYBOOK]
${VIRAL_PLAYBOOK}

Niche: ${niche}
Topic: ${topic}

Generate 4 scroll-stopping hooks and 2 companion captions using the formulas in the PLAYBOOK. Each hook must use a DIFFERENT formula.

Return JSON: { "hooks": [4 strings, formatted "[FORMULA] Hook text"], "captions": [2 platform-optimized strings] }`;

        const proPrompt = `You are an elite 2026 viral content architect. Your hooks have generated 100M+ views.

[CONTEXT PLAYBOOK]
${VIRAL_PLAYBOOK}

Niche: ${niche}
Topic: ${topic}

Generate 6 elite hooks using 6 DIFFERENT formulas, + 3 platform-specific captions.

HOOK REQUIREMENTS:
- Land the hook in under 3 seconds
- Use exact PLAYBOOK formulas
- Include the psychological mechanism in brackets: [CURIOSITY GAP], [IDENTITY], etc.

Return JSON: { "hooks": [6 strings], "captions": [3 strings] }`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: `Generate hooks for: ${topic} (Niche: ${niche})` }
            ],
            max_tokens: 900,
            temperature: 0.9
        });

        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (e) {
        console.error('Hooks Error:', e.message);
        res.status(500).json({ error: 'Failed to generate hooks.' });
    }
});

// Endpoint 2.5: Dedicated Unique Captions Generator
app.post('/api/generate-captions', async (req, res) => {
    try {
        const { topic, isPro, niche = 'general', style = 'engaging' } = req.body;
        const model = 'gpt-4o-mini';

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: `You are a 2026 social media caption specialist who understands platform algorithms deeply.

Niche: ${niche}
Style preference: ${style}

CAPTION STRATEGY BY PLATFORM:
- TikTok: Short punchy captions (under 150 chars). High-energy. Use 3-5 relevant hashtags inline. Drive comments with a bold statement or question.
- Instagram Reels: 125-150 chars before the fold is critical. Hook first sentence. Save-worthy insight. 5-10 hashtags at end.
- YouTube Shorts: Slightly longer OK. SEO-friendly language. Keyword in first 5 words.

CAPTION FORMULAS TO USE:
1. [HYPED]: Hype energy, emoji-forward, FOMO-driven
2. [EDUCATIONAL]: Lead with fact/insight, CTA to save
3. [STORYTIME]: First-person narrative hook that makes them want context
4. [CONTROVERSIAL]: Polarizing statement that drives comments
5. [MINIMALIST]: 1 punchy line + perfect emoji. Under 80 chars.

MANDATE: Every caption must be immediately copy-pasteable. Real creators will use these as-is. No placeholders. No [your name here]. Include specific emojis, not generic ones.

Return JSON: { "captions": [5 ready-to-post strings, each labeled with [TYPE]] }` },
                { role: 'user', content: `Write captions for: ${topic} (Niche: ${niche}, Style: ${style})` }
            ],
            max_tokens: 600,
            temperature: 0.85
        });

        const parsed = JSON.parse(completion.choices[0].message.content);
        if (!parsed.captions) throw new Error("Invalid Format");
        res.json(parsed);
    } catch (e) {
        console.error('Captions Error:', e.message);
        res.status(500).json({ error: 'Generation failed. Try a simpler topic.' });
    }
});

// Endpoint 2.6: Hashtag Generator
app.post('/api/generate-tags', async (req, res) => {
    try {
        const { topic, isPro, niche = 'general' } = req.body;
        const model = 'gpt-4o-mini';
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

        const parsed = JSON.parse(completion.choices[0].message.content);
        if (!parsed.viral || !parsed.niche) throw new Error("Invalid Schema");
        res.json(parsed);
    } catch (e) {
        console.error('Tags Error:', e.message);
        res.status(500).json({ error: 'Hashtag engine stalled. Check topic.' });
    }
});

// Endpoint 3: Script Rewriter
app.post('/api/rewrite', async (req, res) => {
    try {
        const { script, isPro, niche = 'general' } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: `You are a 2026 short-form video script architect.

[CONTEXT PLAYBOOK]
${VIRAL_PLAYBOOK}

Transform this script into retention-engineered viral content using the [RETENTION BLUEPRINTS]. 

Label sections: [HOOK], [PEAK VALUE], [RETENTION BRIDGE], [CTA]
Include a [PRO TIP] for editing.` },
                { role: 'user', content: `Rewrite this script:\n\n${script}` }
            ],
            max_tokens: 900,
            temperature: 0.8
        });

        res.json({ rewritten: completion.choices[0].message.content });
    } catch (e) {
        console.error('Rewrite Error:', e.message);
        res.status(500).json({ error: 'Failed to rewrite script.' });
    }
});

// Endpoint 4: AI Consultant Chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message, persona, isPro } = req.body;
        const model = 'gpt-4o-mini';
        const niche = persona?.niche || 'general';
        const toneValue = persona?.tone || 50;
        let toneDesc = toneValue < 30 ? 'Soft and relatable.' : toneValue > 70 ? 'Aggressive and direct.' : 'Balanced and sharp.';

        const systemPrompt = `You are the "2026 Algorithm Virality Architect" – the world's most optimized AI for short-form video growth.
Role: Professional Strategist & Performance Expert.
Current Niche Focus: ${niche} (Priority: Viral Retention Algorithms).

VIRAL FRAMEWORK (2026):
- SATISFACTION PER SWIPE: No intros. Lead with the payoff.
- RETENTION ENGINEERING: Suggest cuts every 3 seconds.
- REWATCH LOOPS: Advise on seamless transitions.
- DEBATE-BAIT: Use specific statements that drive comment velocity.
- ALGORITHM-SPECIFIC: Mention skill-caps, pattern-interrupts, and high-retention frameworks as requested.

TONE: Human, direct, and professional. Zero AI fluff. Never say "I'm an AI" or "Hope this helps." Give specific, actionable blueprints.
RULES: Max 5 sentences. Use emojis sparingly but impactfully.`;

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            max_tokens: 400,
            temperature: 0.8
        });

        res.json({ reply: completion.choices[0].message.content });
    } catch (e) {
        console.error('Chat Error:', e.message);
        res.status(500).json({ error: 'Consultant is offline. Try again.' });
    }
});

// Endpoint 4b: AI Chat — STREAMING (SSE) Version
app.post('/api/chat-stream', async (req, res) => {
    try {
        const { message, persona, isPro } = req.body;
        const niche = persona?.niche || 'general';
        const toneValue = persona?.tone || 50;
        let toneDesc = toneValue < 30 ? 'Soft and relatable.' : toneValue > 70 ? 'Aggressive and direct.' : 'Balanced and sharp.';

        const systemPrompt = `You are the "2026 Algorithm Virality Architect" – the world's most optimized AI for short-form video growth.
Role: Professional Strategist & Performance Expert.
Current Niche Focus: ${niche} (Priority: Viral Retention Algorithms).

VIRAL FRAMEWORK (2026):
- SATISFACTION PER SWIPE: No intros. Lead with the payoff.
- RETENTION ENGINEERING: Suggest cuts every 3 seconds.
- REWATCH LOOPS: Advise on seamless transitions.
- DEBATE-BAIT: Use specific statements that drive comment velocity.
- ALGORITHM-SPECIFIC: Mention skill-caps, pattern-interrupts, and high-retention frameworks as requested.

TONE: Human, direct, and professional. Zero AI fluff. Never say "I'm an AI" or "Hope this helps." Give specific, actionable blueprints.
RULES: Max 5 sentences. Use emojis sparingly but impactfully.`;

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const stream = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            max_tokens: 400,
            temperature: 0.8,
            stream: true,
        });

        let fullReply = '';
        for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || '';
            if (token) {
                fullReply += token;
                res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
        }

        res.write(`data: [DONE]\n\n`);
        res.end();

    } catch (e) {
        console.error('Chat Stream Error:', e.message);
        res.write(`data: ${JSON.stringify({ error: 'Consultant is offline.' })}\n\n`);
        res.end();
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
app.post('/api/trends', async (req, res) => {
    try {
        const { val, concept, isPro } = req.body;
        const topic = val || concept || 'general';
        const model = 'gpt-4o-mini';

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
                { role: 'system', content: `You are the "2026 Live Trend Intelligence Bridge." 
                
YOUR MANDATE: You analyze real-time news context to predict the next viral wave in short-form video.

[LIVE CONTEXT]
${contextString}

[VIRAL PLAYBOOK]
${VIRAL_PLAYBOOK}

DIRECTIONS:
1. Synthesize the [LIVE CONTEXT] headlines into 5 actionable video trends.
2. Use the VIRAL PLAYBOOK to ensure these trends are retention-engineered.
3. If the context is specific (e.g., a new AI launch), make the trends VERY specific to that launch.

Return JSON: {
  "data_points": [
    { "label": "Hook-Velocity", "value": 0-100 },
    { "label": "Retention-Score", "value": 0-100 },
    { "label": "Competition-Level", "value": 0-100 },
    { "label": "Engagement-Rate", "value": 0-100 },
    { "label": "Longevity", "value": 0-100 }
  ],
  "verdict": "Bold 1-sentence live prediction.",
  "recommendation": ["Blueprint 1", "Blueprint 2", "Blueprint 3"],
  "isLive": true
}` },
                { role: 'user', content: `Analyze real-time viral potential for: ${topic}` }
            ],
            max_tokens: 600,
            temperature: 0.7
        });

        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (e) {
        console.error('Trends Error:', e.message);
        res.status(500).json({ error: 'Failed to fetch trends.' });
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
    const { uid, email } = req.body;
    
    try {
        // Step 1: Look up Stripe Customer by email
        let customers = await stripe.customers.list({
            email: email,
            limit: 1
        });

        // Fallback: Search by metadata user_id if no email match
        if (customers.data.length === 0 && uid) {
            console.log(`[Stripe Portal] No email match for ${email}. Falling back to metadata search for uid: ${uid}`);
            customers = await stripe.customers.search({
                query: `metadata['user_id']:'${uid}'`,
                limit: 1
            });
        }

        if (customers.data.length === 0) {
            return res.status(400).json({ error: "No active subscription found for this account. Please upgrade first." });
        }

        const customerId = customers.data[0].id;

        // Step 2: Create a billing portal session
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

    // -- KEEP-ALIVE PING (prevents Render free tier from sleeping) --
    // Pings itself every 10 minutes to stay warm.
    const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    setInterval(async () => {
        try {
            const https = require('https');
            const http = require('http');
            const client = SELF_URL.startsWith('https') ? https : http;
            client.get(`${SELF_URL}/api/health`, (res) => {
                console.log(`[KeepAlive] Ping OK — Status: ${res.statusCode}`);
            }).on('error', (e) => {
                console.warn('[KeepAlive] Ping failed:', e.message);
            });
        } catch (e) {
            console.warn('[KeepAlive] Error:', e.message);
        }
    }, 10 * 60 * 1000); // Every 10 minutes
});
