const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  value: { type: Number, required: true }, // percent (0-100) or flat Rs amount, depending on type
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null }, // caps percent-based discounts; null = no cap
  usageLimit: { type: Number, default: null }, // null = unlimited total uses
  usedCount: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', couponSchema);
