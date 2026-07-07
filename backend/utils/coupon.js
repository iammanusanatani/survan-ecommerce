const Coupon = require('../models/Coupon');

// Looks up a coupon and computes the real discount server-side. Used by the
// public /validate endpoint AND by order creation itself — the checkout
// flow must never trust a discount amount sent by the client, only a code,
// which gets independently priced here.
async function validateAndComputeDiscount(code, subtotal) {
  if (!code) return { valid: false, message: 'No coupon code provided' };
  if (typeof subtotal !== 'number' || subtotal < 0) return { valid: false, message: 'Invalid order subtotal' };

  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  if (!coupon) return { valid: false, message: 'Invalid coupon code' };
  if (!coupon.enabled) return { valid: false, message: 'This coupon is no longer active' };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, message: 'This coupon has expired' };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'This coupon has reached its usage limit' };
  }
  if (subtotal < coupon.minOrderValue) {
    return { valid: false, message: `Minimum order of Rs. ${coupon.minOrderValue.toLocaleString('en-IN')} required for this coupon` };
  }

  let discount = coupon.type === 'percent'
    ? Math.round(subtotal * (coupon.value / 100))
    : coupon.value;
  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.max(0, Math.min(discount, subtotal)); // never negative, never more than the order itself

  return { valid: true, discount, coupon };
}

async function incrementCouponUsage(code) {
  if (!code) return;
  try {
    await Coupon.findOneAndUpdate(
      { code: String(code).trim().toUpperCase() },
      { $inc: { usedCount: 1 } }
    );
  } catch (err) {
    console.error('incrementCouponUsage failed:', err.message);
  }
}

module.exports = { validateAndComputeDiscount, incrementCouponUsage };
