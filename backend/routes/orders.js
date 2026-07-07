const router = require("express").Router();
const Order = require("../models/Order");
const authMiddleware = require("../middleware/auth");
const { isAdmin } = require("../middleware/auth");
const { isValidEmail, isValidPhone, isNonEmptyString, sanitizeText, requireValidId } = require("../middleware/validate");
const { sendOrderEmails } = require("../utils/mailer");
const { decrementStock, restoreStock, checkStockAvailable } = require("../utils/stock");
const { validateAndComputeDiscount, incrementCouponUsage } = require("../utils/coupon");

const ORDER_ID_RE = /^[A-Za-z0-9-]{5,30}$/;
const STATUS_VALUES = ["Processing", "Packed", "Shipped", "Delivered", "Cancelled"];

function validateOrderBody(body) {
  const errors = [];
  if (!isNonEmptyString(body.name, { min: 2, max: 100 })) errors.push("name is required (2-100 characters)");
  if (!isValidPhone(body.phone)) errors.push("a valid phone number is required");
  if (!isValidEmail(body.email)) errors.push("a valid email is required");
  if (!isNonEmptyString(body.address, { min: 5, max: 500 })) errors.push("address is required (5-500 characters)");
  if (!Array.isArray(body.items) || !body.items.length) errors.push("order must contain at least one item");
  else {
    const badItem = body.items.some(it =>
      !it || typeof it !== "object" ||
      !isNonEmptyString(String(it.name || ""), { min: 1, max: 200 }) ||
      typeof it.qty !== "number" || it.qty <= 0 || it.qty > 1000 ||
      typeof it.price !== "number" || it.price < 0
    );
    if (badItem) errors.push("one or more items are invalid");
  }
  if (typeof body.sub !== "number" || body.sub < 0) errors.push("invalid subtotal");
  if (typeof body.ship !== "number" || body.ship < 0) errors.push("invalid shipping amount");
  if (!isNonEmptyString(body.payment, { min: 2, max: 20 })) errors.push("payment method is required");
  return errors;
}

// Place order (logged in user) — used for COD / Easypaisa / JazzCash.
// Online card payments go through /api/payment/create-order + /api/payment/verify instead,
// so the order is only created after the payment is actually confirmed.
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.body.payment === "RAZORPAY" || req.body.razorpayPaymentId) {
      return res.status(400).json({ message: "Online payments must go through /api/payment/verify" });
    }
    const errors = validateOrderBody(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(", ") });

    const stockProblems = await checkStockAvailable(req.body.items);
    if (stockProblems.length) {
      const detail = stockProblems.map(p => `${p.name} (only ${p.available} left, requested ${p.requested})`).join(", ");
      return res.status(400).json({ message: `Not enough stock: ${detail}` });
    }

    // The discount is never trusted from the client — only a coupon *code*
    // is, and the actual discount is priced here from the real coupon record.
    // Without this, anyone could open devtools and set an arbitrary discount.
    let discount = 0;
    const promoCode = req.body.promoCode ? String(req.body.promoCode).trim() : "";
    if (promoCode) {
      const result = await validateAndComputeDiscount(promoCode, req.body.sub);
      if (!result.valid) return res.status(400).json({ message: result.message });
      discount = result.discount;
    }
    const total = Math.max(0, req.body.sub + req.body.ship - discount);

    const order = await Order.create({
      orderId: sanitizeText(String(req.body.orderId || "")).slice(0, 30),
      name: sanitizeText(req.body.name),
      phone: req.body.phone.trim(),
      email: req.body.email.trim().toLowerCase(),
      address: sanitizeText(req.body.address),
      items: req.body.items,
      sub: req.body.sub,
      ship: req.body.ship,
      discount,
      total,
      payment: sanitizeText(req.body.payment).slice(0, 20),
      userEmail: req.user.email,
      paymentStatus: "Pending"
    });
    res.json(order);
    sendOrderEmails(order).catch(err => console.error("sendOrderEmails failed:", err.message));
    decrementStock(order.items).catch(err => console.error("decrementStock failed:", err.message));
    if (promoCode) incrementCouponUsage(promoCode).catch(err => console.error("incrementCouponUsage failed:", err.message));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// My orders (customer)
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.user.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Track order by ID (public - bina login ke)
router.get("/track/:orderId", async (req, res) => {
  try {
    if (!ORDER_ID_RE.test(req.params.orderId)) {
      return res.status(400).json({ message: "Invalid order id format" });
    }
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ message: "Order nahi mila" });
    res.json({
      orderId: order.orderId,
      status: order.status,
      items: order.items,
      total: order.total,
      createdAt: order.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// All orders (admin only)
router.get("/all", authMiddleware, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order status (admin only)
router.patch("/:id/status", authMiddleware, isAdmin, requireValidId(), async (req, res) => {
  try {
    if (!STATUS_VALUES.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const wasCancelled = order.status === "Cancelled";
    const willBeCancelled = req.body.status === "Cancelled";

    order.status = req.body.status;

    if (!wasCancelled && willBeCancelled && !order.stockRestored) {
      await restoreStock(order.items);
      order.stockRestored = true;
    } else if (wasCancelled && !willBeCancelled && order.stockRestored) {
      // Order was cancelled and is now being reactivated — take the stock back out again.
      await decrementStock(order.items);
      order.stockRestored = false;
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel order (customer - sirf Processing status mein)
router.patch("/:orderId/cancel", authMiddleware, async (req, res) => {
  try {
    if (!ORDER_ID_RE.test(req.params.orderId)) {
      return res.status(400).json({ message: "Invalid order id format" });
    }
    const order = await Order.findOne({ orderId: req.params.orderId, userEmail: req.user.email });
    if (!order) return res.status(404).json({ message: "Order nahi mila" });
    if (order.status !== "Processing") return res.status(400).json({ message: "Yeh order ab cancel nahi ho sakta" });
    order.status = "Cancelled";
    if (!order.stockRestored) {
      await restoreStock(order.items);
      order.stockRestored = true;
    }
    await order.save();
    res.json({ message: "Order cancel ho gaya", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
