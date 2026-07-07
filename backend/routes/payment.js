const router = require('express').Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const { isValidEmail, isValidPhone, isNonEmptyString, sanitizeText } = require('../middleware/validate');
const { sendOrderEmails } = require('../utils/mailer');
const { decrementStock, checkStockAvailable } = require('../utils/stock');
const { validateAndComputeDiscount, incrementCouponUsage } = require('../utils/coupon');

// ── Razorpay client ──
// Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env (get these from
// https://dashboard.razorpay.com/app/keys — use Test Mode keys while developing).
let razorpay = null;
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpay;
}

// ── Optional auth ──
// Checkout is allowed for guests in this store, so we don't hard-require a
// token here — but if one is sent, we use it to attach the order to the user.
function optionalAuth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // invalid/expired token on a guest-allowed route — just proceed as guest
      req.user = null;
    }
  }
  next();
}

// ═══ 1. Create a Razorpay order (called when user selects Card/Online payment) ═══
router.post('/create-order', optionalAuth, async (req, res) => {
  try {
    const { amount, items, promoCode, sub } = req.body;

    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'A valid numeric amount is required' });
    }
    if (amount > 1000000) {
      return res.status(400).json({ message: 'Amount exceeds allowed limit' });
    }

    if (Array.isArray(items) && items.length) {
      const stockProblems = await checkStockAvailable(items);
      if (stockProblems.length) {
        const detail = stockProblems.map(p => `${p.name} (only ${p.available} left, requested ${p.requested})`).join(', ');
        return res.status(400).json({ message: `Not enough stock: ${detail}` });
      }
    }

    // Check the coupon is still valid *before* charging the customer — the
    // final amount itself is still trusted from the client here (same as
    // before), but we don't want to take payment against a code that's
    // expired, disabled, or over its usage limit.
    if (promoCode && typeof sub === 'number') {
      const result = await validateAndComputeDiscount(promoCode, sub);
      if (!result.valid) return res.status(400).json({ message: result.message });
    }

    const client = getRazorpay();
    const razorpayOrder = await client.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise (smallest currency unit)
      currency: 'INR',
      receipt: 'rcpt_' + Date.now(),
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err.message);
    res.status(500).json({ message: 'Could not initiate payment. Please try again.' });
  }
});

// ═══ 2. Verify payment signature + create the Order (called after checkout success) ═══
router.post('/verify', optionalAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderData) {
      return res.status(400).json({ message: 'Missing payment verification data' });
    }
    if (!orderData.items || !Array.isArray(orderData.items) || !orderData.items.length) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    if (!isNonEmptyString(orderData.name, { min: 2, max: 100 })) {
      return res.status(400).json({ message: 'Invalid name in order' });
    }
    if (!isValidPhone(orderData.phone)) {
      return res.status(400).json({ message: 'Invalid phone number in order' });
    }
    if (!isValidEmail(orderData.email)) {
      return res.status(400).json({ message: 'Invalid email in order' });
    }
    if (!isNonEmptyString(orderData.address, { min: 5, max: 500 })) {
      return res.status(400).json({ message: 'Invalid address in order' });
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Payment verification is not configured on the server' });
    }

    // Verify the signature Razorpay sent back — this is what proves the
    // payment is genuine and wasn't tampered with on the client.
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Signature mismatch.' });
    }

    // Prevent replaying the same payment into two orders
    const alreadyUsed = await Order.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (alreadyUsed) {
      return res.status(409).json({ message: 'This payment has already been recorded', order: alreadyUsed });
    }

    const order = await Order.create({
      orderId: sanitizeText(String(orderData.orderId || '')).slice(0, 30),
      name: sanitizeText(orderData.name),
      phone: orderData.phone.trim(),
      email: orderData.email.trim().toLowerCase(),
      address: sanitizeText(orderData.address),
      items: orderData.items,
      sub: orderData.sub,
      ship: orderData.ship,
      discount: orderData.discount || 0,
      total: orderData.total,
      payment: 'Razorpay',
      paymentStatus: 'Paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      userEmail: req.user ? req.user.email : orderData.email.trim().toLowerCase()
    });

    res.json({ message: 'Payment verified successfully', order });
    sendOrderEmails(order).catch(err => console.error('sendOrderEmails failed:', err.message));
    decrementStock(order.items).catch(err => console.error('decrementStock failed:', err.message));
    if (orderData.promoCode) incrementCouponUsage(orderData.promoCode).catch(err => console.error('incrementCouponUsage failed:', err.message));
  } catch (err) {
    console.error('Razorpay verify error:', err.message);
    res.status(500).json({ message: 'Payment verification failed. If money was deducted, it will be auto-refunded within 5-7 days.' });
  }
});

// ═══ 3. Webhook (server-to-server, from Razorpay Dashboard > Webhooks) ═══
// This is a safety net independent of the browser — it fires even if the
// customer closes the tab right after paying. Configure the same URL +
// secret in your Razorpay Dashboard. Requires the raw request body, which
// is wired up specially in server.js (before express.json()).
function webhookHandler(req, res) {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.warn('RAZORPAY_WEBHOOK_SECRET not set — ignoring webhook call');
      return res.status(200).json({ status: 'ignored' });
    }

    const signature = req.headers['x-razorpay-signature'];
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body) // raw Buffer
      .digest('hex');

    if (signature !== expected) {
      console.warn('Razorpay webhook: invalid signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString('utf8'));

    if (event.event === 'payment.captured') {
      console.log('Webhook: payment captured —', event.payload?.payment?.entity?.order_id);
    } else if (event.event === 'payment.failed') {
      console.log('Webhook: payment failed —', event.payload?.payment?.entity?.order_id);
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    res.status(500).json({ message: 'Webhook processing error' });
  }
}

module.exports = { router, webhookHandler };
