const router = require("express").Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { isAdmin } = require("../middleware/auth");
const { isValidPhone, sanitizeText, requireValidId } = require("../middleware/validate");

// All users (admin)
router.get("/", authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user (admin)
router.delete("/:id", authMiddleware, isAdmin, requireValidId(), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Addresses
router.put("/addresses", authMiddleware, async (req, res) => {
  try {
    if (!Array.isArray(req.body.addresses)) {
      return res.status(400).json({ message: "addresses must be an array" });
    }
    if (req.body.addresses.length > 20) {
      return res.status(400).json({ message: "Too many addresses (max 20)" });
    }
    const PINCODE_RE = /^[1-9][0-9]{5}$/;
    for (const a of req.body.addresses) {
      if (!a || typeof a !== "object") {
        return res.status(400).json({ message: "Invalid address entry" });
      }
      if (!a.name || !a.street || !a.city || !a.province || !a.postal) {
        return res.status(400).json({ message: "Each address needs a name, phone, street, city, state and pincode" });
      }
      if (!a.phone || !isValidPhone(a.phone)) {
        return res.status(400).json({ message: "A valid phone number is required for each address" });
      }
      if (!PINCODE_RE.test(String(a.postal).trim())) {
        return res.status(400).json({ message: "A valid 6-digit pincode is required for each address" });
      }
    }
    const clean = req.body.addresses.map(a => ({
      name: sanitizeText(String(a.name)).slice(0, 100),
      phone: a.phone ? String(a.phone).trim().slice(0, 20) : "",
      street: sanitizeText(String(a.street)).slice(0, 300),
      city: sanitizeText(String(a.city)).slice(0, 100),
      province: sanitizeText(String(a.province || "")).slice(0, 100),
      postal: sanitizeText(String(a.postal || "")).slice(0, 20),
      isDefault: !!a.isDefault
    }));

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { addresses: clean },
      { new: true }
    ).select("-password");
    res.json({ addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const update = {};
    if (req.body.fname !== undefined) {
      if (!req.body.fname || String(req.body.fname).trim().length < 2) {
        return res.status(400).json({ message: "First name must be at least 2 characters" });
      }
      update.fname = sanitizeText(String(req.body.fname)).slice(0, 50);
    }
    if (req.body.lname !== undefined) {
      if (!req.body.lname || String(req.body.lname).trim().length < 1) {
        return res.status(400).json({ message: "Last name is required" });
      }
      update.lname = sanitizeText(String(req.body.lname)).slice(0, 50);
    }
    if (req.body.phone !== undefined) {
      if (!req.body.phone || !isValidPhone(req.body.phone)) {
        return res.status(400).json({ message: "A valid phone number is required" });
      }
      update.phone = String(req.body.phone).trim().slice(0, 20);
    }
    if (req.body.dob !== undefined) {
      if (!req.body.dob) return res.status(400).json({ message: "Date of birth is required" });
      update.dob = sanitizeText(String(req.body.dob)).slice(0, 20);
    }
    if (req.body.gender !== undefined) {
      if (!req.body.gender) return res.status(400).json({ message: "Gender is required" });
      update.gender = sanitizeText(String(req.body.gender)).slice(0, 20);
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ fname: user.fname, lname: user.lname, email: user.email, phone: user.phone, dob: user.dob, gender: user.gender, isAdmin: user.isAdmin, addresses: user.addresses || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get wishlist (the logged-in user's own — this is what makes it consistent across devices)
router.get("/wishlist", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("wishlist");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ wishlist: user.wishlist || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Replace wishlist (called whenever the user adds/removes an item, and on login to merge)
router.put("/wishlist", authMiddleware, async (req, res) => {
  try {
    if (!Array.isArray(req.body.wishlist)) {
      return res.status(400).json({ message: "wishlist must be an array" });
    }
    if (req.body.wishlist.length > 500) {
      return res.status(400).json({ message: "Wishlist is too large (max 500 items)" });
    }
    const clean = [...new Set(req.body.wishlist.map(id => String(id).slice(0, 100)))];
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { wishlist: clean },
      { new: true }
    ).select("wishlist");
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get cart (the logged-in user's own — same idea as wishlist, consistent across devices/refreshes)
router.get("/cart", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("cart");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ cart: user.cart || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Replace cart (called whenever the user adds/removes/changes qty, and on login to merge)
router.put("/cart", authMiddleware, async (req, res) => {
  try {
    if (!Array.isArray(req.body.cart)) {
      return res.status(400).json({ message: "cart must be an array" });
    }
    if (req.body.cart.length > 200) {
      return res.status(400).json({ message: "Cart is too large (max 200 items)" });
    }
    for (const item of req.body.cart) {
      if (!item || typeof item !== "object" || !item.id) {
        return res.status(400).json({ message: "Each cart item needs a product id" });
      }
      const qty = Number(item.qty);
      if (!Number.isFinite(qty) || qty < 1 || qty > 99) {
        return res.status(400).json({ message: "Each cart item needs a valid quantity (1-99)" });
      }
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { cart: req.body.cart },
      { new: true }
    ).select("cart");
    res.json({ cart: user.cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;