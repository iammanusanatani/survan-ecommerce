const router = require("express").Router();
const Product = require("../models/Product");
const authMiddleware = require("../middleware/auth");
const { isAdmin } = require("../middleware/auth");
const { isNonEmptyString, isFiniteNumber, sanitizeText, requireValidId } = require("../middleware/validate");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SORT_MAP = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 }
};

// Get products (public). Two modes:
//  - No query params at all: returns the full plain array, exactly like
//    before — this keeps the admin panel, homepage, and cart/detail lookups
//    (which all expect one big array) working unchanged.
//  - Any of q/category/sort/page/limit given: returns a paginated,
//    filtered, sorted result shaped as { products, total, page, totalPages, limit }.
router.get("/", async (req, res) => {
  try {
    const { q, category, sort, page, limit } = req.query;
    const hasQueryParams = q !== undefined || category !== undefined || sort !== undefined || page !== undefined || limit !== undefined;

    const filter = {};
    if (category && category !== "All") filter.category = category;
    if (q && String(q).trim()) {
      const regex = new RegExp(escapeRegex(String(q).trim()), "i");
      filter.$or = [{ name: regex }, { category: regex }, { description: regex }];
    }

    const sortSpec = SORT_MAP[sort] || null;

    if (!hasQueryParams) {
      const products = await Product.find();
      return res.json(products);
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(60, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    let query = Product.find(filter);
    query = sortSpec ? query.sort(sortSpec) : query.sort({ createdAt: -1 });

    const [products, total] = await Promise.all([
      query.skip(skip).limit(limitNum),
      Product.countDocuments(filter)
    ]);

    res.json({
      products,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      limit: limitNum
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function validateProductBody(body, { partial = false } = {}) {
  const errors = [];
  const clean = {};

  if (!partial || body.name !== undefined) {
    if (!isNonEmptyString(body.name, { min: 2, max: 100 })) errors.push("name must be 2-100 characters");
    else clean.name = sanitizeText(body.name);
  }
  if (!partial || body.price !== undefined) {
    if (!isFiniteNumber(body.price, { min: 0, max: 10000000 })) errors.push("price must be a positive number");
    else clean.price = body.price;
  }
  if (body.originalPrice !== undefined && body.originalPrice !== null && body.originalPrice !== "") {
    if (!isFiniteNumber(body.originalPrice, { min: 0, max: 10000000 })) errors.push("originalPrice must be a positive number");
    else clean.originalPrice = body.originalPrice;
  }
  if (!partial || body.category !== undefined) {
    if (!isNonEmptyString(body.category, { min: 2, max: 50 })) errors.push("category must be 2-50 characters");
    else clean.category = sanitizeText(body.category);
  }
  if (body.stock !== undefined) {
    if (!isFiniteNumber(body.stock, { min: 0, max: 1000000 })) errors.push("stock must be a non-negative number");
    else clean.stock = body.stock;
  }
  if (body.description !== undefined) {
    if (typeof body.description !== "string" || body.description.length > 3000) errors.push("description too long");
    else clean.description = sanitizeText(body.description);
  }
  if (body.sizes !== undefined) {
    if (!Array.isArray(body.sizes) || body.sizes.some(s => typeof s !== "string")) errors.push("sizes must be an array of strings");
    else clean.sizes = body.sizes.map(s => sanitizeText(s)).filter(Boolean);
  }
  if (body.emoji !== undefined) clean.emoji = sanitizeText(String(body.emoji)).slice(0, 10);
  if (body.badge !== undefined) clean.badge = sanitizeText(String(body.badge)).slice(0, 30);
  if (body.badgeType !== undefined) clean.badgeType = sanitizeText(String(body.badgeType)).slice(0, 30);
  if (body.img !== undefined) clean.img = typeof body.img === "string" ? body.img.trim().slice(0, 2000) : "";
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) errors.push("images must be an array");
    else clean.images = body.images.filter(x => typeof x === "string").map(x => x.trim().slice(0, 2000));
  }

  return { errors, clean };
}

// Add product (admin)
router.post("/", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { errors, clean } = validateProductBody(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(", ") });
    const product = await Product.create(clean);
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update product (admin)
router.put("/:id", authMiddleware, isAdmin, requireValidId(), async (req, res) => {
  try {
    const { errors, clean } = validateProductBody(req.body, { partial: true });
    if (errors.length) return res.status(400).json({ message: errors.join(", ") });
    const product = await Product.findByIdAndUpdate(req.params.id, clean, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete product (admin)
router.delete("/:id", authMiddleware, isAdmin, requireValidId(), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
