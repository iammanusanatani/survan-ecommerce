const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  productName: String,
  userEmail: { type: String, required: true },
  userName: String,
  orderId: String,
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);