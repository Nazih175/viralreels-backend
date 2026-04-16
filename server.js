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
app.post('/api/analyze', async (req, res) => {
    console.log(`[ViralReels Backend] POST /api/analyze - Idea: "${req.body.idea?.substring(0, 30)}..."`);
    try {
        const { idea, platform, length, isPro, niche = 'general' } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';
        
        // Timeout protection for the AI call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const basePrinciples = `2026 Viral Engine Expert. Frameworks: Satisfaction Velocity, Retention Loops, Psychological Triggers.`;
        const gamingContext = niche === 'gaming' ? "Focus on: Skill-gaps, Easter-eggs, Rage-bait potential, and Speedrun pacing." : "";

        const freePrompt = `${basePrinciples} Analyze for ${platform}. ${gamingContext} Return JSON: 'score' (0-100), 'hookStrength' (0-10), 'retention' (0-100), 'tips' (3 unique strings).`;
        const proPrompt = `Elite 2026 Virality Architect. ${basePrinciples}
        Deep Analysis for ${platform} (${length}). ${gamingContext}
        MANDATE: Prioritize creative variance. Never repeat phrases.
        Return JSON: 'score', 'hookStrength', 'retention', 'tips' (5 distinct architecture upgrades), 'insight' (1 unique psychological algorithm unlock).`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: `Platform: ${platform}. Length: ${length}. Idea: ${idea}` }
            ],
            max_tokens: 500
        }, { signal: controller.signal });
        
        clearTimeout(timeoutId);
        console.log(`[ViralReels Backend] Analysis Complete for idea: ${idea?.substring(0,20)}`);
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

        const basePrinciples = `2026 Hook Strategist. Principles: 0-second Payoff, Negative Hooks, Curiosity Gaps. Niche: ${niche}.`;
        const varietyRules = `MANDATE: High variance. Avoid common AI patterns. Focus on high-retention patterns.`;

        const freePrompt = `${basePrinciples} ${varietyRules} Generate 4 elite hooks & 2 captions. JSON: 'hooks' (array), 'captions' (array).`;
        const proPrompt = `Elite 2026 Virality Architect. ${basePrinciples} ${varietyRules}
        Generate 6 unique world-class hooks & 3 captions. Focus on ${topic}.
        Frameworks: [NEGATIVE HOOK], [CONTRARIAN], [IDENTITY], [LOOP-START], [SKILL-GAP], [CURIOSITY]. Ensure each is fundamentally different.
        Return JSON: 'hooks' (6 unique strings with [Framework] prefix), 'captions' (3 unique strings with [Platform] prefix).`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: `Topic: ${topic}` }
            ],
            max_tokens: 800
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
        const { topic, isPro, niche = 'general' } = req.body;
        const model = 'gpt-4o-mini';

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: `ViralReels AI Caption Engine. Niche: ${niche}. Styles: [HYPED], [SERIOUS], [SHORT], [EDUCATIONAL], [STORYTIME]. MANDATE: High creativity, variety, and unique emojis. JSON: 'captions' (array of 5 unique strings).` },
                { role: 'user', content: `Topic: ${topic}` }
            ],
            max_tokens: 500
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
                { role: 'system', content: `ViralReels AI SEO Expert. Niche: ${niche}. 3 Categories: Viral (8 tags), Niche (8 tags), Recommended (8 tags). MANDATE: Mix high-volume and long-tail tags. JSON: { "viral": [], "niche": [], "recommended": [] }` },
                { role: 'user', content: `Topic: ${topic}` }
            ],
            max_tokens: 400
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
        const { script, isPro } = req.body;
        const model = 'gpt-4o-mini';

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: `ViralReels AI Script Rewriter. Pacing-focused. Structure: [Hook], [Value], [Loop-CTA]. Include [PRO TIP].` },
                { role: 'user', content: script }
            ],
            max_tokens: 800
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

// Endpoint 5: Trends Radar
app.post('/api/trends', async (req, res) => {
    try {
        const { concept, isPro } = req.body;
        const model = 'gpt-4o-mini';
        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: `ViralReels AI Analyzer. Principles: Hook-Velocity, Retention-Nodes, Visual-Density. Return JSON: { "data_points": [ { "label": "", "value": 0 } ], "verdict": "", "recommendation": "" }` },
                { role: 'user', content: `Concept: ${concept}` }
            ],
            max_tokens: 400
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
});
