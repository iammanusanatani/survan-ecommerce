const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  originalPrice: Number,
  category: String,
  emoji: String,
  sizes: [String],
  badge: String,
  badgeType: String,
  description: String,
  stock: { type: Number, default: 100 },
  img: { type: String, default: '' },
  images: { type: Array, default: [] },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);