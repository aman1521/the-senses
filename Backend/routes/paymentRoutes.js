const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');
const IntelligenceResult = require('../models/IntelligenceResult');
const { auth } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// Initialize Stripe (Placeholder Key if not in env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const CERTIFICATE_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_123'; // 1000 INR / $15 USD

// @route   POST /api/payments/create-checkout-session
// @desc    Create a Stripe Checkout Session for Certificate
router.post('/create-checkout-session', auth(), async (req, res) => {
    try {
        const { resultId } = req.body;
        if (!resultId) return res.status(400).json({ error: "Result ID required" });

        const result = await IntelligenceResult.findById(resultId);
        if (!result) return res.status(404).json({ error: "Result not found" });

        // Ensure user owns result
        if (result.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Create Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Verified Cognitive Certificate`,
                            description: `Official Report for Score: ${result.finalScore} | Tier: ${result.rank.tier}`,
                            images: ['https://thesenses.ai/certificate-preview.png'], // Placeholder
                        },
                        unit_amount: 1500, // $15.00
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/result?session_id={CHECKOUT_SESSION_ID}&cert_success=true`,
            cancel_url: `${process.env.FRONTEND_URL}/result`,
            metadata: {
                userId: req.user._id.toString(),
                resultId: resultId,
                type: 'certificate'
            }
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// @route   GET /api/payments/certificate/:resultId
// @desc    Generate PDF Certificate (Protected, requires Payment check ideally, but for now just Auth)
router.get('/certificate/:resultId', auth(), async (req, res) => {
    try {
        const { resultId } = req.params;
        const result = await IntelligenceResult.findById(resultId);
        const user = await User.findById(result.userId);

        if (!result || !user) return res.status(404).json({ error: "Not found" });

        // Create PDF
        const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });

        // Pipe to response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Certificate_${user.name.replace(/\s/g, '_')}.pdf`);
        doc.pipe(res);

        // --- Design Certificate ---

        // Background (Dark)
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0a0a0a');

        // Border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#4338ca'); // Indigo

        // Header
        doc.fontSize(30).fillColor('#ffffff').text('THE SENSES', 0, 80, { align: 'center', characterSpacing: 5 });
        doc.fontSize(12).fillColor('#a1a1aa').text('VERIFIED COGNITIVE INTELLIGENCE REPORT', 0, 120, { align: 'center', letterSpacing: 2 });

        // Name
        doc.moveDown(2);
        doc.fontSize(40).fillColor('#ffffff').font('Helvetica-Bold').text(user.name, { align: 'center' });

        // Score Badge
        doc.moveDown(1);
        doc.fontSize(20).fillColor('#818cf8').text(`Score: ${result.finalScore}`, { align: 'center' });
        doc.fontSize(16).fillColor('#e4e4e7').text(`Top ${100 - result.rank.globalPercentile}% Globally • ${result.rank.tier} Tier`, { align: 'center' });

        // Integrity Date
        doc.moveDown(4);
        doc.fontSize(10).fillColor('#71717a').text(`Certificate ID: ${result._id} • Issued: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.text(`Integrity Status: VERIFIED (Trust Score: ${result.trustScore}%)`, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error("PDF Gen Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
