const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: String,
  userEmail: String,
  name: String,
  phone: String,
  email: String,
  address: String,
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  instructions: { type: String, default: '' }, // optional, e.g. "Leave at doorstep"
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
  // Set automatically the moment admin changes status to 'Delivered' —
  // this is the actual delivery date shown to customers, separate from
  // createdAt (order placement date, which is what the 5-day return
  // window is measured from).
  deliveredAt: { type: Date, default: null },

  // ── Shiprocket ──
  shiprocketOrderId: { type: String, default: '' },
  shiprocketShipmentId: { type: String, default: '' },
  awbCode: { type: String, default: '' },       // tracking number
  courierName: { type: String, default: '' },
  shiprocketStatus: { type: String, default: '' }, // raw status string from Shiprocket, kept as-is for reference

  // Full timeline log — every status change (placed, packed, shipped,
  // delivered, etc.) gets its own timestamped entry here, so the customer
  // sees the complete history (like Flipkart's tracking screen) instead of
  // just the current status.
  statusHistory: [{
    status: String,      // e.g. 'Processing', 'Shipped', 'Delivered'
    note: String,        // human-readable line, e.g. 'Your order has been placed'
    courierName: String, // filled in for shipping-related entries, if known
    awbCode: String,
    at: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);