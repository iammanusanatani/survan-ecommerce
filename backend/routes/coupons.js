const router = require('express').Router();
const Coupon = require('../models/Coupon');
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const { isNonEmptyString, isFiniteNumber, requireValidId } = require('../middleware/validate');
const { validateAndComputeDiscount } = require('../utils/coupon');

// Validate a coupon code at checkout (public — no login required, since
// guest checkout is allowed on this store).
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const result = await validateAndComputeDiscount(code, subtotal);
    if (!result.valid) {
      return res.status(400).json({ valid: false, message: result.message });
    }
    res.json({ valid: true, discount: result.discount, code: result.coupon.code });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function validateCouponBody(body, { partial = false } = {}) {
  const errors = [];
  const clean = {};

  if (!partial || body.code !== undefined) {
    if (!isNonEmptyString(body.code, { min: 3, max: 30 })) errors.push('code must be 3-30 characters');
    else clean.code = String(body.code).trim().toUpperCase();
  }
  if (!partial || body.type !== undefined) {
    if (!['percent', 'flat'].includes(body.type)) errors.push('type must be "percent" or "flat"');
    else clean.type = body.type;
  }
  if (!partial || body.value !== undefined) {
    const max = body.type === 'flat' ? 1000000 : 100;
    if (!isFiniteNumber(body.value, { min: 0.01, max })) errors.push(`value must be a positive number${body.type === 'percent' ? ' (0-100)' : ''}`);
    else clean.value = body.value;
  }
  if (body.minOrderValue !== undefined) {
    if (!isFiniteNumber(body.minOrderValue, { min: 0, max: 10000000 })) errors.push('minOrderValue must be a non-negative number');
    else clean.minOrderValue = body.minOrderValue;
  }
  if (body.maxDiscount !== undefined) {
    if (body.maxDiscount === null || body.maxDiscount === '') clean.maxDiscount = null;
    else if (!isFiniteNumber(body.maxDiscount, { min: 0, max: 10000000 })) errors.push('maxDiscount must be a non-negative number');
    else clean.maxDiscount = body.maxDiscount;
  }
  if (body.usageLimit !== undefined) {
    if (body.usageLimit === null || body.usageLimit === '') clean.usageLimit = null;
    else if (!Number.isInteger(body.usageLimit) || body.usageLimit < 1) errors.push('usageLimit must be a positive whole number');
    else clean.usageLimit = body.usageLimit;
  }
  if (body.expiresAt !== undefined) {
    if (body.expiresAt === null || body.expiresAt === '') clean.expiresAt = null;
    else {
      const d = new Date(body.expiresAt);
      if (isNaN(d.getTime())) errors.push('expiresAt must be a valid date');
      else clean.expiresAt = d;
    }
  }
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') errors.push('enabled must be true or false');
    else clean.enabled = body.enabled;
  }

  return { errors, clean };
}

// List all coupons (admin)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create coupon (admin)
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { errors, clean } = validateCouponBody(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(', ') });

    const exists = await Coupon.findOne({ code: clean.code });
    if (exists) return res.status(400).json({ message: 'A coupon with this code already exists' });

    const coupon = await Coupon.create(clean);
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update coupon (admin)
router.put('/:id', authMiddleware, isAdmin, requireValidId(), async (req, res) => {
  try {
    const { errors, clean } = validateCouponBody(req.body, { partial: true });
    if (errors.length) return res.status(400).json({ message: errors.join(', ') });

    if (clean.code) {
      const exists = await Coupon.findOne({ code: clean.code, _id: { $ne: req.params.id } });
      if (exists) return res.status(400).json({ message: 'A coupon with this code already exists' });
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, clean, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Enable/disable coupon (admin)
router.patch('/:id/toggle', authMiddleware, isAdmin, requireValidId(), async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    coupon.enabled = !coupon.enabled;
    await coupon.save();
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete coupon (admin)
router.delete('/:id', authMiddleware, isAdmin, requireValidId(), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
