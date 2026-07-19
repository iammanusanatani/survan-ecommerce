const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ── Fail fast on missing required config instead of running half-broken ──
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`❌ Missing required .env variable(s): ${missing.join(', ')}`);
  console.error('   Copy .env.example to .env and fill these in before starting the server.');
  process.exit(1);
}
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️  RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — online card payments will fail until these are added to .env. COD still works.');
}
if (!process.env.BREVO_API_KEY) {
  console.warn('⚠️  BREVO_API_KEY not set — order confirmation emails will be skipped until this is added to .env.');
}
if (!process.env.WHATSAPP_NUMBER) {
  console.warn('⚠️  WHATSAPP_NUMBER not set — the "message us" WhatsApp popup will stay hidden until this is added to .env.');
}
if (!process.env.FRONTEND_URL) {
  console.warn('⚠️  FRONTEND_URL not set — password reset emails will contain broken links until this is added to .env.');
}

const paymentRoutes = require('./routes/payment');

const app = express();
app.use(cors());

// Razorpay webhook needs the RAW request body to verify its signature, so it
// must be registered before express.json() and matched here directly.
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), paymentRoutes.webhookHandler);

app.use(express.json({ limit: '2mb' }));

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', paymentRoutes.router);
app.use('/api/config', require('./routes/config'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/shiprocket', require('./routes/shiprocket'));

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Survan Backend is Running 🚀"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// Global error handler — catches malformed JSON bodies and any error an
// earlier middleware/route passed to next(err), so clients only ever see a
// clean message instead of a raw stack trace.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});