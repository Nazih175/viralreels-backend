require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'active', message: 'ViralReels AI Backend is running securely.' });
});

// Endpoint 1: Analyzer (Predictor)
app.post('/api/analyze', async (req, res) => {
    try {
        const { idea, platform, length } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost efficient for V1
            response_format: { type: "json_object" },
            messages: [
                { 
                    role: "system", 
                    content: "You are an AI algorithm predictor. Analyze the video idea and return JSON strictly with: 'score' (integer 0-100), 'hookStrength' (integer 0-10), 'retention' (integer 0-100 percentage estimation), and 'tips' (array of 3 strings of highly actionable adjustment advice)." 
                },
                { 
                    role: "user", 
                    content: `Platform: ${platform}. Length: ${length}. Idea: ${idea}` 
                }
            ]
        });

        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (e) {
        console.error("Analyzer Error:", e.message);
        res.status(500).json({ error: "Failed to communicate with AI Engine." });
    }
});

// Endpoint 2: Hooks & Captions Generator
app.post('/api/generate-hooks', async (req, res) => {
    try {
        const { topic } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                { 
                    role: "system", 
                    content: "You are a master viral copywriter. Generate 4 viral video hooks and 2 SEO-optimized captions. Return JSON strictly with: 'hooks' (array of 4 strings) and 'captions' (array of 2 strings)." 
                },
                { 
                    role: "user", 
                    content: `Generate hooks and captions for the topic: ${topic}` 
                }
            ]
        });

        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (e) {
        console.error("Hooks Error:", e.message);
        res.status(500).json({ error: "Failed to generate hooks." });
    }
});

// Endpoint 3: Script Rewriter
app.post('/api/rewrite', async (req, res) => {
    try {
        const { script } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: "You are an elite short-form scriptwriter. Rewrite the user's boring script into a highly engaging, viral 60-second video script format with clear [Hook], [Context], [Value Proposition], and [CTA] sections." 
                },
                { 
                    role: "user", 
                    content: script 
                }
            ]
        });

        res.json({ rewritten: completion.choices[0].message.content });
    } catch (e) {
        console.error("Rewrite Error:", e.message);
        res.status(500).json({ error: "Failed to rewrite script." });
    }
});

// Endpoint 4: AI Consultant Chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message, persona } = req.body;
        const niche = persona?.niche || "general";
        const tone = persona?.tone || 50;
        let toneDesc = tone < 30 ? "Soft, empathetic, and relatable." : tone > 70 ? "Aggressive, high-energy, and direct." : "Balanced, professional, and clear.";

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `You are a social media viral consultant responding directly to a creator. The creator focuses on the '${niche}' niche. Your brand voice/tone must be: ${toneDesc} Answer the user's questions concisely (max 2-3 sentences) with actionable algorithm advice.` 
                },
                { 
                    role: "user", 
                    content: message 
                }
            ]
        });

        res.json({ reply: completion.choices[0].message.content });
    } catch (e) {
        console.error("Chat Error:", e.message);
        res.status(500).json({ error: "Consultant is offline. Disconnect or try again." });
    }
});

// Endpoint 5: Trends Radar
app.post('/api/trends', async (req, res) => {
    try {
        const { niche } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                { 
                    role: "system", 
                    content: "Identify 3 to 5 trending video formats/concepts for the given niche. Return JSON strictly with: 'trends' (array of objects, each containing 'title', 'rep' (integer 3-5 rating), and 'desc' (short description))." 
                },
                { 
                    role: "user", 
                    content: `Niche: ${niche}` 
                }
            ]
        });

        res.json(JSON.parse(completion.choices[0].message.content));
    } catch (e) {
        console.error("Trends Error:", e.message);
        res.status(500).json({ error: "Failed to fetch trends." });
    }
});

// Endpoint 6: Stripe Checkout Session Generator
app.post('/api/checkout', async (req, res) => {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://viralreels-ai.netlify.app';
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
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

// Endpoint 7: Stripe Webhook Listener
app.post('/api/webhook', (req, res) => {
    // Note: In production, use express.raw() to verify Stripe's cryptographic signature
    const event = req.body;
    
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log(`✅ Payment received! Session ID: ${session.id}`);
        // TODO: Database logic -> Update user's Supabase/Firebase record to PRO
    }

    res.status(200).send();
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 ViralReels AI Backend running on http://localhost:${PORT}`);
    console.log(`🔐 AI Connected: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
});
