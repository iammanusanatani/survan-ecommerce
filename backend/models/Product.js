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
  // Shiprocket needs a weight (kg) per shipment to calculate courier rates.
  // Default is a reasonable guess for a folded clothing item — edit per
  // product from the admin panel for accuracy (heavier items like jackets
  // should be set higher).
  weight: { type: Number, default: 0.3 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);