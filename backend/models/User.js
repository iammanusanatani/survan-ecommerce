const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  lname: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  addresses: { type: Array, default: [] },
  wishlist: { type: [String], default: [] },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  dob: { type: String, default: '' },
gender: { type: String, default: '' },
  resetPasswordTokenHash: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
});

module.exports = mongoose.model('User', userSchema);