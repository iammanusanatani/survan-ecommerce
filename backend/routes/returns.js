const router = require("express").Router();
const Return = require("../models/Return");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/auth");
const { isAdmin } = require("../middleware/auth");
const { isNonEmptyString, sanitizeText, requireValidId } = require("../middleware/validate");
const { restoreStock } = require("../utils/stock");

const ORDER_ID_RE = /^[A-Za-z0-9-]{5,30}$/;
const TYPE_VALUES = ["Return", "Exchange"];
const STATUS_VALUES = ["Pending", "Approved", "Rejected"];

// Submit return/exchange request
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (!ORDER_ID_RE.test(req.body.orderId || "")) {
      return res.status(400).json({ message: "Invalid order id" });
    }
    if (!TYPE_VALUES.includes(req.body.type)) {
      return res.status(400).json({ message: "type must be Return or Exchange" });
    }
    if (!isNonEmptyString(req.body.reason, { min: 5, max: 500 })) {
      return res.status(400).json({ message: "Please provide a reason (5-500 characters)" });
    }
    if (req.body.exchangeDetails !== undefined && typeof req.body.exchangeDetails !== "string") {
      return res.status(400).json({ message: "Invalid exchange details" });
    }

    const request = await Return.create({
      orderId: req.body.orderId,
      userEmail: req.user.email,
      userName: sanitizeText(String(req.body.userName || "")).slice(0, 100),
      type: req.body.type,
      reason: sanitizeText(req.body.reason),
      exchangeDetails: sanitizeText(String(req.body.exchangeDetails || "")).slice(0, 500)
    });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// My requests
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const requests = await Return.find({ userEmail: req.user.email }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// All requests (admin)
router.get("/all", authMiddleware, isAdmin, async (req, res) => {
  try {
    const requests = await Return.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update status (admin)
router.patch("/:id", authMiddleware, isAdmin, requireValidId(), async (req, res) => {
  try {
    if (!STATUS_VALUES.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const request = await Return.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = req.body.status;
    request.adminNote = sanitizeText(String(req.body.adminNote || "")).slice(0, 500);

    // Only plain Returns restock automatically — an Exchange swaps for a
    // different item/size that isn't captured in a structured way here,
    // so the admin should adjust stock for the new item manually.
    if (req.body.status === "Approved" && request.type === "Return" && !request.stockRestored) {
      const order = await Order.findOne({ orderId: request.orderId });
      if (order) {
        await restoreStock(order.items);
        request.stockRestored = true;
      } else {
        console.warn(`Return approved for unknown orderId ${request.orderId} — stock not restored.`);
      }
    }

    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
