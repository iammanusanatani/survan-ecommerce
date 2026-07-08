const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { isValidEmail, isValidPhone, isNonEmptyString, sanitizeText } = require("../middleware/validate");
const { sendPasswordResetEmail } = require("../utils/mailer");

// Signup
router.post("/signup", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const fname = sanitizeText(req.body.fname);
    const lname = sanitizeText(req.body.lname || "");
    const phone = req.body.phone?.trim();

    if (!isNonEmptyString(fname, { min: 2, max: 50 })) {
      return res.status(400).json({ message: "Please enter a valid first name (2-50 characters)" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (typeof password !== "string" || password.length < 6 || password.length > 100) {
      return res.status(400).json({ message: "Password must be 6-100 characters" });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: "Please enter a valid phone number" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    // Admin accounts are never granted via public signup — only via the
    // createAdmin.js script (using ADMIN_EMAIL/ADMIN_PASS from .env) or by
    // an existing admin promoting a user directly in the database.
    const user = await User.create({ fname, lname, email, password: hashed, phone, isAdmin: false });
    const token = jwt.sign({ id: user._id, email, isAdmin: false }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { fname, lname, email, phone, isAdmin: false } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const password = req.body.password;
    const email = req.body.email?.trim().toLowerCase();
    if (!isValidEmail(email) || typeof password !== "string" || !password) {
      return res.status(400).json({ message: "Wrong email or password" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Wrong email or password" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong email or password" });
    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { fname: user.fname, lname: user.lname, email: user.email, phone: user.phone, isAdmin: user.isAdmin, wishlist: user.wishlist || [] } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change Password (logged in user)
router.post("/change-password", require("../middleware/auth"), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 100) {
      return res.status(400).json({ message: "Password 6-100 characters hona chahiye" });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.id, { password: hashed });
    res.json({ message: "Password update ho gaya" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Simple in-memory cooldown so the same email can't be spammed with reset
// emails repeatedly. Resets if the server restarts — fine for this site's
// scale; swap for a shared store (Redis etc.) if you ever run multiple
// server instances behind a load balancer.
const forgotPasswordCooldown = new Map();
const COOLDOWN_MS = 60 * 1000;

// Forgot password — request a reset link
router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // Always return the same generic message whether or not the account
    // exists, and whether or not we actually send anything — this prevents
    // someone from using this endpoint to check which emails are registered.
    const genericResponse = { message: "If an account exists for that email, a reset link has been sent." };

    const lastRequest = forgotPasswordCooldown.get(email);
    if (lastRequest && Date.now() - lastRequest < COOLDOWN_MS) {
      return res.json(genericResponse);
    }

    const user = await User.findOne({ email });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      user.resetPasswordTokenHash = tokenHash;
      user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await user.save();

      const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
      const resetLink = `${frontendUrl}/?resetToken=${rawToken}`;
      await sendPasswordResetEmail(user, resetLink);
    }

    forgotPasswordCooldown.set(email, Date.now());
    res.json(genericResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset password — consume the token from the emailed link
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (typeof token !== "string" || !token) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 100) {
      return res.status(400).json({ message: "Password must be 6-100 characters" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link. Please request a new one." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password has been reset. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
