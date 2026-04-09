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
app.use(express.json());
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

        const freePrompt = `Short-form video expert. Analyze viral potential. Return JSON: 'score' (0-100), 'hookStrength' (0-10), 'retention' (0-100), 'tips' (3 strings).`;
        const proPrompt = `Elite video analyst for TikTok/Reels/Shorts. Apply platform algorithm rules (hook, retention, engagement). Return JSON: 'score', 'hookStrength', 'retention', 'tips' (5 specific), 'insight' (1 powerful sentence).`;

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

        const freePrompt = `Viral copywriter. 4 hooks & 2 captions. Return JSON: 'hooks' (array), 'captions' (array).`;
        const proPrompt = `Elite strategist. 6 hooks (Pattern Interrupt, Curiosity, Identity, Social Proof, Provocation, Transformation) & 3 captions (TikTok, Reels, Shorts). Return JSON: 'hooks' (6 strings with [Framework]), 'captions' (3 strings with [Platform]).`;

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

        const systemPrompt = `You are an elite short-form copywriter. Generate exactly 5 unique caption variations for the topic: "${topic}". 
        Each variation MUST follow these specific tones/styles:
        1. [HYPED] - High energy, extreme emojis, curiosity-driven.
        2. [SERIOUS] - Professional, authority-based, legacy feel, NO emojis.
        3. [SHORT] - Maximum 2 sentences, punchy, high-impact.
        4. [EDUCATIONAL] - Value-first, formatted with bullet points or steps.
        5. [STORYTIME] - First-person perspective, "I" statements, relatable.
        
        Return JSON object with a 'captions' array of 5 strings.`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Topic: ${topic}` }
            ],
            max_tokens: 1000
        });

        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (e) {
        console.error('Captions Error:', e.message);
        res.status(500).json({ error: 'Failed to generate captions.' });
    }
});

// Endpoint 2.6: Hashtag Generator
app.post('/api/generate-tags', async (req, res) => {
    try {
        const { topic, isPro } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const freePrompt = `Short-form SEO expert. Generate 3 categories of hashtags for topic: "${topic}". 
        1. Viral (Trending) - 5 tags.
        2. Hyper-Niche (Targeted) - 5 tags.
        3. AI Recommended - 5 tags.
        Return JSON: { "viral": [], "niche": [], "recommended": [] }`;

        const proPrompt = `Elite virality strategist. Generate 3 depth-first categories of hashtags for topic: "${topic}". 
        1. Viral Momentum (Max reach) - 8 tags.
        2. Hyper-Niche SEO (Targeted) - 8 tags.
        3. AI Power Picks (Elite combinations) - 8 tags.
        Return JSON: { "viral": [], "niche": [], "recommended": [] }`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: `Topic: ${topic}` }
            ],
            max_tokens: 600
        });

        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (e) {
        console.error('Tags Error:', e.message);
        res.status(500).json({ error: 'Failed to generate hashtags.' });
    }
});

// Endpoint 3: Script Rewriter
app.post('/api/rewrite', async (req, res) => {
    try {
        const { script, isPro } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const freePrompt = `Viral scriptwriter. Rewrite the user's script into a high-engagement short-form video script. Structure: [Hook], [Context], [Value], [CTA]. Make it punchy and genuine.`;
        const proPrompt = `Elite short-form director. Rewrite using high-retention architecture:
        1. [THE HOOK]: Visual + Verbal pattern interrupt (0-2s).
        2. [TENSION]: Identify the problem/need (2-5s).
        3. [VALUE]: The unique solution or "aha" moment.
        4. [RETENTION BRIDGE]: High-speed pacing for mid-video drop-off.
        5. [LOOP CTA]: A call to action designed to loop the viewer.
        Add [CAPTION SUGGESTION] and [ELITE FILMING TIP] at the end. Make it feel rich and professional.`;

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
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';
        const niche = persona?.niche || 'general';
        const tone = persona?.tone || 50;
        let toneDesc = tone < 30 ? 'Soft, empathetic, and deeply relatable.' : tone > 70 ? 'High-energy, aggressive, and brutally direct.' : 'Balanced, professional, and clear.';

        const freePrompt = `Growth consultant. Niche: ${niche}, Tone: ${toneDesc}. Actionable algorithm advice. Concise.`;
        const proPrompt = `Elite advisor ($10k/mo level). Niche: ${niche}, Tone: ${toneDesc}. Reference TikTok/Reels/Shorts mechanics (retention, shares, velocity). Under 5 sentences.`;

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: message }
            ],
            max_tokens: 300
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

        const freePrompt = `Trend analyst. Identify 3-5 trending formats for ${niche}. Return JSON: 'trends' (array of objects with 'title', 'desc', 'rep' where rep is 1-5 rating).`;
        const proPrompt = `Elite trend strategist. Identify 6 trends for ${niche}. Include momentum, platform, concept, and psychology. Return JSON: 'trends' (array of objects with 'title', 'desc', 'rep' where rep is 1-5 rating).`;

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
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'ViralReels Pro',
                        description: 'Unlimited AI Uses & Premium Video AI'
                    },
                    unit_amount: 999, // $9.99
                    recurring: { interval: 'month' },
                },
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${FRONTEND_URL}/?checkout=success`,
            cancel_url: `${FRONTEND_URL}/?checkout=canceled`,
        });

        res.json({ url: session.url });
    } catch (e) {
        console.error("Stripe Checkout Error:", e.message);
        res.status(500).json({ error: "Failed to initialize checkout." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 ViralReels AI Backend running on port ${PORT}`);
    console.log(`🔐 AI Connected: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
});
