const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: String,
  userEmail: String,
  name: String,
  phone: String,
  email: String,
  address: String,
  items: Array,
  sub: Number,
  ship: Number,
  discount: Number,
  total: Number,
  payment: String,
  paymentStatus: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Paid', 'Failed']
  },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },
  status: { 
    type: String, 
    default: 'Processing',
    enum: ['Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned']
  },
  stockRestored: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);