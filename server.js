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
app.use(cors());
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ limit: '300mb', extended: true }));
app.use(express.static('./'));

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
    try {
        const { idea, platform, length, isPro } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const freePrompt = `ViralReels AI Analyst. Apply Attention and Retention principles. Return JSON: 'score' (0-100), 'hookStrength' (0-10), 'retention' (0-100), 'tips' (3 strings focusing on opening/flow).`;
        const proPrompt = `Elite ViralReels AI Strategist. 
        Principles: Attention First, Retention Opt, Emotional Impact, Value Delivery, Engagement Triggers. 
        Analyze idea for ${platform}. 
        Return JSON: 'score', 'hookStrength', 'retention', 'tips' (5 specific actionable improvements), 'insight' (1 high-impact psychological unlock).`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: `Platform: ${platform}. Length: ${length}. Idea: ${idea}` }
            ],
            max_tokens: 500
        });

        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (e) {
        console.error('Analyzer Error:', e.message);
        res.status(500).json({ error: 'Failed to communicate with AI Engine.' });
    }
});

// Endpoint 2: Hooks & Captions Generator
app.post('/api/generate-hooks', async (req, res) => {
    try {
        const { topic, isPro } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const freePrompt = `ViralReels AI Hook Engine. Attention First. 4 hooks & 2 captions. Return JSON: 'hooks' (array), 'captions' (array).`;
        const proPrompt = `Elite ViralReels AI Strategist. 
        Generate 6 hooks & 3 captions optimized for: Attention First, Emotional Impact, and Value Delivery. 
        Hooks must use frameworks: Pattern Interrupt, Curiosity, Identity, Social Proof, Provocation, Transformation. 
        Return JSON: 'hooks' (6 strings with [Framework]), 'captions' (3 strings with [Platform]).`;

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
        const { topic, isPro } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const systemPrompt = `You are the ViralReels AI Caption Engine. Generate 5 variations for: "${topic}". 
        Styles: [HYPED], [SERIOUS], [SHORT], [EDUCATIONAL], [STORYTIME].
        Principles: Attention First, Retention (remove fluff), Emotional Impact. 
        RULES: No profanity. Use emojis for Hyped/Educational. 
        Return JSON object with a 'captions' array of 5 strings.`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt + " Return JSON object with 'captions' array." },
                { role: 'user', content: `Topic: ${topic}` }
            ],
            max_tokens: 1000
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
        const { topic, isPro } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const freePrompt = `ViralReels AI SEO Expert. 3 categories of hashtags for: "${topic}". 
        1. Viral (Attention) - 5 tags.
        2. Niche (Clarity) - 5 tags.
        3. Recommended - 5 tags.
        Return JSON: { "viral": [], "niche": [], "recommended": [] }`;

        const proPrompt = `Elite ViralReels AI Virality Strategist. 3 depth-first categories for: "${topic}". 
        Focus: Discovery and Engagement signals.
        1. Viral Momentum (Max reach) - 8 tags.
        2. Hyper-Niche SEO (Targeted) - 8 tags.
        3. AI Power Picks (High engagement) - 8 tags.
        Return JSON: { "viral": [], "niche": [], "recommended": [] }`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: (isPro ? proPrompt : freePrompt) + " CRITICAL: Return JSON { 'viral': [], 'niche': [], 'recommended': [] }" },
                { role: 'user', content: `Topic: ${topic}` }
            ],
            max_tokens: 600
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
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const freePrompt = `ViralReels AI Scriptwriter. Rewrite for Clarity and Retention. Structure: [Hook], [Context], [Value], [CTA].`;
        const proPrompt = `Elite ViralReels AI Director. Rewrite using High-Retention Expert Architecture:
        1. [THE HOOK]: Attention First - Visual + Verbal pattern interrupt (0-2s).
        2. [EMOTIONAL TENSION]: Identify the gap/need (2-5s).
        3. [VALUE DELIVERY]: Logical floor and logical flow.
        4. [RETENTION BRIDGE]: High-speed pacing for mid-video drop-off.
        5. [LOOP / ENGAGEMENT CTA]: Logic designed to spark discussion and shares.
        Add [ELITE FILMING TIP] for psychological retention.`;

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: script }
            ],
            max_tokens: 1000
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
        // Model: Using gpt-4o-mini for ultra-fast "Ask Studio" style responses
        const model = 'gpt-4o-mini';
        const niche = persona?.niche || 'general';
        const toneValue = persona?.tone || 50;
        let toneDesc = toneValue < 30 ? 'Soft and relatable.' : toneValue > 70 ? 'Aggressive and direct.' : 'Balanced and sharp.';

        const systemPrompt = `You are an elite expert in short-form video growth (ViralReels AI Consultant).
Task: Maximize attention, retention, and engagement across TikTok, Reels, and Shorts.

CORE PRINCIPLES:
1. ATTENTION FIRST: Hooks must spark instant curiosity/intrigue.
2. CLARITY: Direct, impactful, and easy to understand.
3. RETENTION: Structure to keep viewers watching; remove flat moments.
4. EMOTIONAL IMPACT: Trigger curiosity, tension, or relatability.
5. VALUE: Deliver high entertainment, information, or insight.
6. FLOW: Logical progression and strong transitions.
7. ENGAGEMENT: Naturally spark reactions and discussions.
8. PLATFORM AWARENESS: Optimize for watch time and replay signals.
9. ADAPTABILITY: Tailor advice to the specific niche: ${niche}.
10. ACTIONABLE: Identify what works and offer better alternatives.

STRICT RULES: No AI fluff. No profanity. Tone: ${toneDesc}. Max 5 sentences.`;

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
        res.status(500).json({ error: 'Consultant is offline. Disconnect or try again.' });
    }
});

// Endpoint 5: Trends Radar
app.post('/api/trends', async (req, res) => {
    try {
        const { niche, isPro } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const freePrompt = `ViralReels AI Trend Analyst. Identify 3-5 trending formats for ${niche} focusing on Attention and Clarity. Return JSON: 'trends' (array of objects with 'title', 'desc', 'rep' where rep is 1-5 rating).`;
        const proPrompt = `Elite ViralReels AI Trend Strategist. Identify 6 high-momentum trends for ${niche}. 
        Focus: Attention First and Engagement Triggers. Include platform psychology. 
        Return JSON: 'trends' (array of objects with 'title', 'desc', 'rep' where rep is 1-5 rating).`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: `Niche: ${niche}` }
            ],
            max_tokens: 600
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
            automatic_payment_methods: { enabled: true },
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
        console.error("Stripe Checkout Error:", e.message);
        res.status(500).json({ error: "Failed to initialize checkout." });
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
