const router = require("express").Router();
const Review = require("../models/Review");
const authMiddleware = require("../middleware/auth");
const { isAdmin } = require("../middleware/auth");
const { isNonEmptyString, sanitizeText, requireValidId } = require("../middleware/validate");

// Submit review
router.post("/", authMiddleware, async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a whole number between 1 and 5" });
    }
    if (!isNonEmptyString(req.body.comment, { min: 3, max: 1000 })) {
      return res.status(400).json({ message: "Comment must be 3-1000 characters" });
    }
    if (req.body.productId === undefined || req.body.productId === null || req.body.productId === "") {
      return res.status(400).json({ message: "productId is required" });
    }

    const existing = await Review.findOne({ productId: req.body.productId, userEmail: req.user.email });
    if (existing) return res.status(400).json({ message: "Aap pehle hi review de chuke hain" });

    const review = await Review.create({
      productId: req.body.productId,
      productName: sanitizeText(String(req.body.productName || "")).slice(0, 200),
      userEmail: req.user.email,
      userName: sanitizeText(String(req.body.userName || "")).slice(0, 100),
      orderId: sanitizeText(String(req.body.orderId || "")).slice(0, 30),
      rating,
      comment: sanitizeText(req.body.comment)
    });
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get reviews for a product (public)
router.get("/product/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId, approved: true }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// All reviews (admin)
router.get("/all", authMiddleware, isAdmin, async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve/reject review (admin)
router.patch("/:id", authMiddleware, isAdmin, requireValidId(), async (req, res) => {
  try {
    if (typeof req.body.approved !== "boolean") {
      return res.status(400).json({ message: "approved must be true or false" });
    }
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { approved: req.body.approved },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete review (admin)
router.delete("/:id", authMiddleware, isAdmin, requireValidId(), async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Review delete ho gaya" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
