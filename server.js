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

app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'active', message: 'ViralReels AI Backend is running securely.' });
});

// Endpoint 1: Analyzer (Predictor)
app.post('/api/analyze', async (req, res) => {
    try {
        const { idea, platform, length, isPro } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const freePrompt = `You are a short-form video algorithm expert. Analyze the video idea for its viral potential on social media. Return JSON with: 'score' (integer 0-100 viral potential), 'hookStrength' (integer 0-10), 'retention' (integer 0-100 estimated % retention), and 'tips' (array of 3 actionable strings to improve the video).`;

        const proPrompt = `You are a world-class short-form video algorithm strategist with deep expertise in TikTok, Instagram Reels, and YouTube Shorts. You have studied thousands of viral videos and understand exactly what the recommendation algorithms favor.

For the given platform and video length, apply these platform-specific scoring rules:
- TikTok: Prioritize hook in first 1.5 seconds, loop-ability, sound-on engagement, comment bait, and duet/stitch potential. Optimal lengths: 7s, 15s, 30s, 60s.
- Instagram Reels: Weight visual aesthetic, share-to-story rate, and saves. First frame must stop the scroll. Optimal lengths: 15s, 30s, 45s.
- YouTube Shorts: Weight watch-time completion (under 60s performs best), keyword-rich concept titles, and click-through from shelf. Strong subscribe hooks at end.

Return JSON strictly with: 'score' (integer 0-100), 'hookStrength' (integer 0-10), 'retention' (integer 0-100 estimated %), 'tips' (array of 5 highly specific, actionable strings referencing the platform algorithm), and 'insight' (string: a 1-sentence elite-level strategic insight about why this idea will or won't go viral on this specific platform).`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: `Platform: ${platform}. Length: ${length}. Idea: ${idea}` }
            ]
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

        const freePrompt = `You are a viral copywriter. Generate 4 compelling video hooks and 2 captions for the given topic. Return JSON with: 'hooks' (array of 4 strings) and 'captions' (array of 2 strings).`;

        const proPrompt = `You are an elite viral content strategist who has written hooks for creators with 10M+ followers across TikTok, Instagram, and YouTube Shorts.

Generate hooks using these proven psychological trigger frameworks:
1. PATTERN INTERRUPT: Break the viewer's scroll with an unexpected, counterintuitive statement.
2. CURIOSITY GAP: Tease a revelation without giving it away (e.g., "The reason most people fail at X is not what you think").
3. IDENTITY CHALLENGE: Make the viewer question something they believe about themselves.
4. SOCIAL PROOF SHOCK: Lead with a surprising statistic or result.
5. DIRECT PROVOCATION: Make a bold, slightly controversial claim.
6. TRANSFORMATION PROMISE: Immediately frame a before/after in the viewer's mind.

Generate 6 hooks (one per framework) and 3 platform-optimized captions (one for TikTok, one for Instagram, one for YouTube Shorts). Return JSON with: 'hooks' (array of 6 strings, each labeled with its framework in brackets) and 'captions' (array of 3 strings, each labeled with its platform in brackets).`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: `Generate hooks and captions for the topic: ${topic}` }
            ]
        });

        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (e) {
        console.error('Hooks Error:', e.message);
        res.status(500).json({ error: 'Failed to generate hooks.' });
    }
});

// Endpoint 3: Script Rewriter
app.post('/api/rewrite', async (req, res) => {
    try {
        const { script, isPro } = req.body;
        const model = isPro ? 'gpt-4o' : 'gpt-4o-mini';

        const freePrompt = `You are a short-form scriptwriter. Rewrite the user's script into an engaging viral 60-second video format with clear [Hook], [Context], [Value], and [CTA] sections.`;

        const proPrompt = `You are an elite short-form content director who has scripted viral videos totaling over 500 million views across TikTok, Instagram Reels, and YouTube Shorts.

Rewrite the script following this advanced viral architecture:

[HOOK - 0-3 seconds]: The absolute most attention-grabbing, pattern-interrupting opening line possible. No slow builds. No "Hey guys". Start with the most shocking or intriguing element.

[TENSION BUILD - 3-15 seconds]: Establish the core problem or conflict. Use "you" language to make the viewer feel identified. Build curiosity and urgency.

[VALUE DELIVERY - 15-45 seconds]: Deliver the core content in punchy, digestible statements. Each line should be a standalone insight. Use specific numbers or examples. No filler language.

[RETENTION HOOK - 30-second mark]: Insert a mid-video curiosity bridge (e.g., "But here's what nobody tells you about this...") to fight the algorithm drop-off point.

[CTA - Final 5 seconds]: End with a specific, single call-to-action that drives the metric that matters (follow, save, share, or comment). Make it feel natural, not salesy.

Also add a line at the bottom labeled [CAPTION SUGGESTION] with a TikTok-optimized caption and 3 relevant hashtags.`;

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: script }
            ]
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

        const freePrompt = `You are a social media growth consultant. The creator focuses on the '${niche}' niche. Your tone: ${toneDesc} Give concise, actionable advice about social media algorithms and content strategy.`;

        const proPrompt = `You are an elite social media algorithm consultant — the equivalent of having a $10,000/month private advisor. You have deep knowledge of TikTok's ForYouPage distribution model, Instagram Reels' ranking signals (shares, saves, reach rate, send rate), and YouTube Shorts' browse feature optimization.

The creator focuses on the '${niche}' niche. Your communication tone: ${toneDesc}

Rules you must follow:
1. Always give platform-specific advice when relevant (e.g., "On TikTok specifically...", "For Instagram Reels, the algorithm heavily weights...").
2. Reference real algorithm mechanics: watch-time percentage, rewatch rate, engagement velocity, early share rate, hashtag categorization, explore page signals.
3. Back up claims with pattern-based reasoning (e.g., "Creators in your niche who post X format at Y time see higher FYP distribution because...").
4. Keep responses focused and under 5 sentences, but pack maximum insight into every sentence.
5. If asked about content ideas, always include a specific hook suggestion.`;

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: message }
            ]
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

        const freePrompt = `Identify 3 to 5 trending video formats or concepts for the given niche. Return JSON with: 'trends' (array of objects each with 'title', 'rep' (integer 3-5 rating), and 'desc' (short description)).`;

        const proPrompt = `You are a trend intelligence analyst specializing in short-form content across TikTok, Instagram Reels, and YouTube Shorts. You track virality patterns and emerging format signals in real time.

For the given niche, identify 6 specific, currently-trending content formats or concepts. For each trend, provide:
- Its current momentum level (is it emerging, peak, or declining?)
- Which platform it is performing best on right now
- A specific, ready-to-execute video concept the creator can film today
- The core psychological reason this format is resonating with audiences

Return JSON with: 'trends' (array of 6 objects each containing: 'title' (string), 'rep' (integer 3-5 rating), 'desc' (detailed 2-sentence description including platform and psychological insight)).`;

        const completion = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: isPro ? proPrompt : freePrompt },
                { role: 'user', content: `Niche: ${niche}` }
            ]
        });

        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (e) {
        console.error('Trends Error:', e.message);
        res.status(500).json({ error: 'Failed to fetch trends.' });
    }
});

// Endpoint 6: Stripe Checkout Session Generator
app.post('/api/checkout', async (req, res) => {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://viralreels-ai.netlify.app';
    const { uid } = req.body;
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
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
