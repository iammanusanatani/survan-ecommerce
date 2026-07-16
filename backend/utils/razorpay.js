const Razorpay = require('razorpay');

// ── Shared Razorpay client ──
// Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env (get these from
// https://dashboard.razorpay.com/app/keys). Used for both creating/verifying
// payments (payment.js) and issuing refunds (returns.js) so there's exactly
// one client instance instead of each route file building its own.
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

module.exports = { getRazorpay };