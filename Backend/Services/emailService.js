const nodemailer = require('nodemailer');

// Configure transporter
// In production, use environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    if (!process.env.SMTP_USER) {
        console.log("⚠️ SMTP_USER not set. Email simulation:");
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        // console.log(`Body: ${html}`);
        return;
    }

    try {
        await transporter.sendMail({
            from: '"The Senses" <no-reply@thesenses.ai>',
            to,
            subject,
            html
        });
        console.log(`📧 Email sent to ${to}`);
    } catch (error) {
        console.error("Email send failed:", error);
    }
};

const sendDuelInvitation = async (toEmail, challengerName, duelLink) => {
    const subject = `⚔️ You've been challenged by ${challengerName}!`;
    const html = `
        <div style="font-family: Arial, sans-serif; bg-color: #000; color: #fff; padding: 20px;">
            <h2>The Senses Arena</h2>
            <p><strong>${challengerName}</strong> has challenged you to a cognitive duel.</p>
            <p>Prove your intellect. Accept the challenge below:</p>
            <a href="${duelLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Accept Challenge</a>
            <p style="color: #888; font-size: 12px;">If you ignore this, you forfeit based on fear.</p>
        </div>
    `;
    await sendEmail(toEmail, subject, html);
};

const sendDuelResult = async (toEmail, winnerName, isYou) => {
    const subject = isYou ? "🏆 You Won the Duel!" : "💀 You Lost the Duel";
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Duel Result</h2>
            <p>${isYou ? "Congratulations! You proved your superiority." : `${winnerName} was faster and sharper this time.`}</p>
            <a href="${process.env.FRONTEND_URL}/duels" style="color: #4f46e5;">View Full Analysis</a>
        </div>
    `;
    await sendEmail(toEmail, subject, html);
};

module.exports = {
    sendDuelInvitation,
    sendDuelResult
};
