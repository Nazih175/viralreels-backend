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
// Static Files
app.use(express.static('./'));

// Fallback for SPA (Serve index.html for unknown routes)
app.get('*', (req, res, next) => {
    // Only fallback for non-file requests
    if (req.path.includes('.')) return next();
    res.sendFile(__dirname + '/index.html');
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
    try {
        const { idea, platform, length, isPro } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const basePrinciples = `2025 Viral Engine Expert. Frameworks: 1. Satisfaction Velocity 2. Retention Loops 3. Psychological Triggers 4. Visual Pacing 5. Search Discovery (SEO).`;
        const gamingContext = niche === 'gaming' ? "Focus on: Skill-gaps, Easter-eggs, Rage-bait potential, and Speedrun pacing." : "";

        const freePrompt = `${basePrinciples} Analyze for ${platform}. ${gamingContext} Return JSON: 'score' (0-100), 'hookStrength' (0-10), 'retention' (0-100), 'tips' (3 strings).`;
        const proPrompt = `Elite 2025 Virality Architect (Human-Professional Mode). ${basePrinciples}
        Deep Analysis for ${platform} (${length}). ${gamingContext}
        Analyze rewatch-potential, loop-seamlessness, and comment-velocity baits.
        Return JSON: 'score', 'hookStrength', 'retention', 'tips' (5 elite architecture upgrades), 'insight' (1 psychological algorithm unlock).`;

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

        const basePrinciples = `2025 Hook Strategist. Principles: 0-second Payoff, Negative Hooks, Curiosity Gaps, and Identity Signaling.`;

        const freePrompt = `${basePrinciples} Generate 4 elite hooks & 2 captions. No AI fluff. Return JSON: 'hooks' (array), 'captions' (array).`;
        const proPrompt = `Elite 2025 Virality Architect. ${basePrinciples}
        Generate 6 unique world-class hooks & 3 captions. Focus on ${topic}.
        Frameworks: [NEGATIVE HOOK], [CONTRARIAN], [IDENTITY], [LOOP-START], [SKILL-GAP], [CURIOSITY].
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
        const { topic, isPro } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const systemPrompt = `ViralReels AI Caption Engine. Expert Principles: 1. Attention First 2. Clarity 3. Retention 4. Emotional Impact 5. Value Delivery 6. Flow 7. Engagement 8. Platform Awareness 9. Adaptability 10. Actionable.
        Generate 5 variations for: "${topic}". 
        Styles: [HYPED], [SERIOUS], [SHORT], [EDUCATIONAL], [STORYTIME].
        RULES: No AI fluff. Use emojis. No profanity. 
        Return JSON: 'captions' (array of 5 strings).`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
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

        const basePrinciples = `ViralReels AI SEO Expert. Principles: 1. Attention First 2. Clarity 3. Engagement 4. Platform Awareness 5. Adaptability.`;

        const freePrompt = `${basePrinciples} 3 categories for: "${topic}". 1. Viral (Attention) 2. Niche (Clarity) 3. Recommended. Return JSON: { "viral": [], "niche": [], "recommended": [] }`;
        const proPrompt = `Elite ViralReels AI Virality Strategist. ${basePrinciples}
        3 depth-first categories for: "${topic}". Focus on reach velocity and discovery signals.
        1. Viral Momentum (Max reach) - 8 tags.
        2. Hyper-Niche SEO (Targeted) - 8 tags.
        3. AI Power Picks (Engagement) - 8 tags.
        Return JSON: { "viral": [], "niche": [], "recommended": [] }`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: (isPro ? proPrompt : freePrompt) },
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

        const basePrinciples = `2025 Retention Engineer. Focus: Removing breaths/pauses, increasing visual density, and loop optimization.`;

        const freePrompt = `${basePrinciples} Rewrite for high-pacing. Structure: [Hook], [Value], [Loop-CTA].`;
        const proPrompt = `Elite 2025 Virality Architect. ${basePrinciples}
        Rewrite for maximum retention.
        1. [THE HOOK]: 0-second payoff lead.
        2. [RETENTION DENSITY]: High-speed information delivery.
        3. [LOOP TRANSITION]: Match last frame to first frame for rewatch.
        4. [DEBATE-BAIT]: Polarizing niche statement to drive comments.
        Include [PRO FILMING TIP] for visual pattern interrupts.`;

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
        const model = 'gpt-4o-mini';
        const niche = persona?.niche || 'general';
        const toneValue = persona?.tone || 50;
        let toneDesc = toneValue < 30 ? 'Soft and relatable.' : toneValue > 70 ? 'Aggressive and direct.' : 'Balanced and sharp.';

        const systemPrompt = `You are the "2025 Gaming Virality Architect" – the world's most optimized AI for short-form video growth.
Role: Professional Strategist & Performance Expert.
Current Niche Focus: ${niche} (Priority: Gaming Algorithms).

VIRAL FRAMEWORK (2025):
- SATISFACTION PER SWIPE: No intros. Lead with the payoff.
- RETENTION ENGINEERING: Suggest cuts every 3 seconds.
- REWATCH LOOPS: Advise on seamless transitions.
- DEBATE-BAIT: Use specific statements that drive comment velocity.
- GAMING SPECIFIC: Mention skill-caps, rage-bait, speedruns, and easter-eggs if requested.

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
        const { niche, isPro } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const basePrinciples = `ViralReels AI Trend Strategist. Principles: 1. Attention First 2. Clarity 3. Retention 4. Engagement Triggers 5. Platform Psychology.`;

        const freePrompt = `${basePrinciples} Identify 4 trending formats for ${niche}. Return JSON: 'trends' (array: {title, desc, rep (1-5 rating)}).`;
        const proPrompt = `Elite ViralReels AI Virality Strategist. ${basePrinciples}
        Identify 6 high-momentum trends for ${niche}. Focus on reach velocity.
        Return JSON: 'trends' (array: {title, desc, rep (1-5 rating)}).`;

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

// Endpoint 6.05: Stripe Customer Portal Session
app.post('/api/create-portal-session', async (req, res) => {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://nazih175.github.io/viralreels-backend';
    const { uid } = req.body;
    try {
        // In a real app, you would fetch the stripe_customer_id from your DB using the uid
        // For now, we will use the session generator. 
        // NOTE: For the portal to work, the user must have a Customer ID.
        // If they just checked out, Stripe creates one.
        
        // This is a placeholder for the logic to find the customer:
        // const user = await db.users.get(uid);
        // const customerId = user.stripe_customer_id;

        // For this implementation, we assume the customer is managed via Stripe search or 
        // you'll need a customer ID. 
        // If you don't have it saved, the portal session creation requires it.
        
        res.status(400).json({ error: "Portal requires a Customer ID. Please complete a checkout first." });
    } catch (e) {
        console.error("Portal Error:", e.message);
        res.status(500).json({ error: "Could not create portal session." });
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
