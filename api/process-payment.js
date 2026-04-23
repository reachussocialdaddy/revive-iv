const { Client, Environment } = require('square');
const crypto = require('crypto');

// Initialize Square Client
// Note: Vercel functions use Environment Variables. 
const client = new Client({
    environment: Environment.Production,
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

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
        const { sourceId, amount, currency } = req.body;

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
                // Square expects amount in cents/lowest denomination. Convert from dollars.
                amount: Math.round(amount * 100), 
                currency: currency || 'USD',
            },
        });

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
