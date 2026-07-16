const router = require('express').Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const { isValidEmail, isValidPhone, isNonEmptyString, sanitizeText } = require('../middleware/validate');
const { sendOrderEmails } = require('../utils/mailer');
const { decrementStock, checkStockAvailable } = require('../utils/stock');
const { validateAndComputeDiscount, incrementCouponUsage } = require('../utils/coupon');
const { priceItemsFromDB, computeSubtotal, computeShipping } = require('../utils/pricing');
const { getRazorpay } = require('../utils/razorpay');

// ── Auth required ──
// Guest checkout is intentionally disabled — every order (COD or online)
// must be tied to a logged-in account, so a valid token is mandatory here,
// same as the regular /api/orders route.
const authMiddleware = require('../middleware/auth');

// ═══ 1. Create a Razorpay order (called when user selects Card/Online payment) ═══
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { items, promoCode } = req.body;

    // The amount is never trusted from the client — it's rebuilt here from
    // real product prices, so editing `amount`/prices in devtools can no
    // longer get you a Razorpay order for less than the cart is worth.
    let pricedItems;
    try {
      pricedItems = await priceItemsFromDB(items);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const stockProblems = await checkStockAvailable(pricedItems);
    if (stockProblems.length) {
      const detail = stockProblems.map(p => `${p.name} (only ${p.available} left, requested ${p.requested})`).join(', ');
      return res.status(400).json({ message: `Not enough stock: ${detail}` });
    }

    const sub = computeSubtotal(pricedItems);
    const ship = computeShipping(sub);

    let discount = 0;
    if (promoCode) {
      const result = await validateAndComputeDiscount(promoCode, sub);
      if (!result.valid) return res.status(400).json({ message: result.message });
      discount = result.discount;
    }

    const total = Math.max(0, sub + ship - discount);
    if (total <= 0) {
      return res.status(400).json({ message: 'Order total must be greater than zero' });
    }
    if (total > 1000000) {
      return res.status(400).json({ message: 'Amount exceeds allowed limit' });
    }

    const client = getRazorpay();
    const razorpayOrder = await client.orders.create({
      amount: Math.round(total * 100), // Razorpay expects paise (smallest currency unit)
      currency: 'INR',
      receipt: 'rcpt_' + Date.now(),
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      // Sent back so the frontend can show the real total if it ever
      // drifts from what the client thought it was (e.g. stale cart price).
      sub, ship, discount, total
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err.message);
    res.status(500).json({ message: 'Could not initiate payment. Please try again.' });
  }
});

// ═══ 2. Verify payment signature + create the Order (called after checkout success) ═══
router.post('/verify', authMiddleware, async (req, res) => {
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

    // Recompute the order total the exact same way create-order did — never
    // trust orderData.sub/ship/discount/total from the client. This is what
    // stops someone from paying for a cheap item via create-order and then
    // recording a fake, more expensive order here.
    let pricedItems, sub, ship, discount, total;
    try {
      pricedItems = await priceItemsFromDB(orderData.items);
      sub = computeSubtotal(pricedItems);
      ship = computeShipping(sub);
      discount = 0;
      if (orderData.promoCode) {
        const result = await validateAndComputeDiscount(orderData.promoCode, sub);
        if (!result.valid) return res.status(400).json({ message: result.message });
        discount = result.discount;
      }
      total = Math.max(0, sub + ship - discount);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    // Cross-check our recomputed total against what was actually captured
    // by Razorpay for this order — this closes the loop with create-order
    // rebuilding the amount server-side, so a mismatched/tampered order
    // can never be recorded as "Paid" even if someone bypasses the frontend.
    const client = getRazorpay();
    const razorpayOrderInfo = await client.orders.fetch(razorpay_order_id);
    const expectedPaise = Math.round(total * 100);
    if (razorpayOrderInfo.amount !== expectedPaise) {
      console.error(`Payment amount mismatch: Razorpay order ${razorpay_order_id} was for ${razorpayOrderInfo.amount} paise, recomputed order total is ${expectedPaise} paise.`);
      return res.status(400).json({ message: 'Order total does not match the amount paid. Please contact support.' });
    }

    const order = await Order.create({
      orderId: sanitizeText(String(orderData.orderId || '')).slice(0, 30),
      name: sanitizeText(orderData.name),
      phone: orderData.phone.trim(),
      email: orderData.email.trim().toLowerCase(),
      address: sanitizeText(orderData.address),
      items: pricedItems,
      sub,
      ship,
      discount,
      total,
      payment: 'Razorpay',
      paymentStatus: 'Paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      userEmail: req.user.email
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