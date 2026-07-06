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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Return', returnSchema);