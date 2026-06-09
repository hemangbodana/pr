require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { initDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Razorpay Instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret'
});

// Email Transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

let db;

// Initialize Database
initDb().then(database => {
    db = database;
    console.log('Database initialized');
}).catch(err => {
    console.error('Database initialization failed', err);
});

// --- Routes ---

// 1. Create Order
app.post('/api/donations/order', async (req, res) => {
    try {
        const { amount, donorInfo, cause } = req.body;

        if (!amount || amount < 1) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        // Store pending donation in DB
        await db.run(`
            INSERT INTO donations (order_id, amount, currency, status, donor_name, donor_email, donor_phone, donor_pan, cause)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [order.id, amount, 'INR', 'pending', donorInfo.fullName, donorInfo.email, donorInfo.phone, donorInfo.pan, cause]);

        res.json({ order });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        // If it's a Razorpay error, send the description
        const errorMessage = error.error ? error.error.description : 'Internal Server Error';
        res.status(error.statusCode || 500).json({ 
            message: errorMessage,
            details: error.error || null
        });
    }
});

// 2. Verify Payment
app.post('/api/donations/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_secret')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment verified
            await db.run(`
                UPDATE donations 
                SET status = 'completed', payment_id = ?, signature = ?
                WHERE order_id = ?
            `, [razorpay_payment_id, razorpay_signature, razorpay_order_id]);

            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
    }
});

// 3. Contact Form Submission
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        
        // Save to Database
        await db.run(`
            INSERT INTO contacts (name, email, phone, subject, message)
            VALUES (?, ?, ?, ?, ?)
        `, [name, email, phone, subject, message]);

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.RECEIVER_EMAIL,
            subject: `New Contact Form Submission: ${subject}`,
            text: `
                New message from your website:
                
                Name: ${name}
                Email: ${email}
                Phone: ${phone}
                Subject: ${subject}
                
                Message:
                ${message}
            `
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.RECEIVER_EMAIL) {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully');
        } else {
            console.warn('Email configuration missing. Skipping email send.');
        }

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error saving contact or sending email:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 4. Get All Donations (for Admin - simple version)
app.get('/api/admin/donations', async (req, res) => {
    try {
        const donations = await db.all('SELECT * FROM donations ORDER BY created_at DESC');
        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching donations' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
