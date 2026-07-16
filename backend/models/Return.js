const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: String,
  type: { type: String, enum: ['Return', 'Exchange'], required: true },
  reason: { type: String, required: true },
  exchangeDetails: String, // Exchange ke liye — kaunsa size/product chahiye
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  adminNote: String,
  stockRestored: { type: Boolean, default: false },

  // Snapshotted from the order at request time — so the admin list can show
  // payment method/amount without a separate lookup, and so a refund can
  // still be issued correctly even if the order is edited/deleted later.
  paymentMethod: { type: String, default: '' },
  orderTotal: { type: Number, default: 0 },

  // Refund tracking — only meaningful for online (Razorpay) payments.
  // COD orders never collected money through the gateway, so there's
  // nothing to refund through Razorpay for them.
  refundStatus: {
    type: String,
    enum: ['Not Applicable', 'Pending', 'Processed', 'Failed'],
    default: 'Not Applicable'
  },
  refundId: { type: String, default: '' },
  refundAmount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Return', returnSchema);