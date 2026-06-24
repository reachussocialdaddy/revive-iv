const { Client, Environment } = require('square');
const crypto = require('crypto');
const { Resend } = require('resend');

module.exports = async (req, res) => {
    // Handle CORS (preflight request)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        if (!process.env.SQUARE_ACCESS_TOKEN) {
            console.error('Missing SQUARE_ACCESS_TOKEN environment variable');
            return res.status(500).json({ error: 'Server configuration error: Missing Square Token. Did you add it to Vercel and redeploy?' });
        }

        // Initialize Square Client inside the handler to catch initialization errors
        const client = new Client({
            environment: Environment.Production,
            accessToken: process.env.SQUARE_ACCESS_TOKEN,
        });

        const { sourceId, amount, currency, customerInfo } = req.body;

        if (!sourceId || !amount) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Generate an idempotency key to prevent double charging
        const idempotencyKey = crypto.randomUUID();

        // Create the payment
        const response = await client.paymentsApi.createPayment({
            sourceId,
            idempotencyKey,
            amountMoney: {
                // Square SDK expects BigInt for the amount
                amount: BigInt(Math.round(amount * 100)), 
                currency: currency || 'USD',
            },
        });

        // DISPATCH EMAILS
        if (process.env.RESEND_API_KEY && customerInfo) {
            const resend = new Resend(process.env.RESEND_API_KEY);
            
            const cartItemsHtml = customerInfo.cart && customerInfo.cart.length > 0 
                ? customerInfo.cart.map(item => `<li>${item.name} - $${item.price.toFixed(2)}</li>`).join('') 
                : '<li>No items (Custom Booking)</li>';
            
            const emailHtml = `
                <h2>New Booking & Deposit Received</h2>
                <p><strong>Name:</strong> ${customerInfo.fname} ${customerInfo.lname}</p>
                <p><strong>Email:</strong> ${customerInfo.email}</p>
                <p><strong>Phone:</strong> ${customerInfo.phone}</p>
                <p><strong>Date & Time:</strong> ${customerInfo.date} at ${customerInfo.timeslot}</p>
                <p><strong>Location:</strong> ${customerInfo.street}, ${customerInfo.city} ${customerInfo.zip}</p>
                <p><strong>Instructions:</strong> ${customerInfo.instructions || 'None'}</p>
                <p><strong>Deposit Paid:</strong> $${amount.toFixed(2)}</p>
                <h3>Cart Items:</h3>
                <ul>${cartItemsHtml}</ul>
            `;

            try {
                // Send to Clinic
                await resend.emails.send({
                    from: 'Revive IV <onboarding@resend.dev>',
                    to: ['info@reviveiv.io'],
                    subject: 'New Booking & Payment Received',
                    html: emailHtml
                });
                
                // Send Receipt to Customer
                await resend.emails.send({
                    from: 'Revive IV <onboarding@resend.dev>',
                    to: [customerInfo.email],
                    subject: 'Your Booking Confirmation - Revive IV',
                    html: `<h2>Your Booking is Confirmed!</h2>
                    <p>Hi ${customerInfo.fname},</p>
                    <p>Thank you for booking with Revive IV Hydration. We have successfully received your 20% advance deposit of $${amount.toFixed(2)}.</p>
                    <p>Our concierge will contact you shortly to confirm the final details for your appointment on <strong>${customerInfo.date} at ${customerInfo.timeslot}</strong>.</p>
                    <p>We look forward to seeing you!</p>`
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }
        }

        // Send success response
        res.status(200).json({ 
            success: true, 
            paymentId: response.result.payment.id 
        });

    } catch (error) {
        console.error('Square Payment Error:', error);
        
        let errorMessage = 'Payment processing failed';
        if (error.errors && error.errors.length > 0) {
            errorMessage = error.errors[0].detail;
        }
        
        res.status(500).json({ success: false, error: errorMessage });
    }
};
