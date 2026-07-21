const router = require("express").Router();
const Return = require("../models/Return");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/auth");
const { isAdmin } = require("../middleware/auth");
const { isNonEmptyString, sanitizeText, requireValidId } = require("../middleware/validate");
const { restoreStock } = require("../utils/stock");
const { getRazorpay } = require("../utils/razorpay");
const { pushHistory } = require("../utils/orderHistory");

const ORDER_ID_RE = /^[A-Za-z0-9-]{5,30}$/;
const TYPE_VALUES = ["Return", "Exchange"];
const STATUS_VALUES = ["Pending", "Approved", "Rejected"];
const RETURN_WINDOW_MS = 5 * 24 * 60 * 60 * 1000; // 5 days, counted from order placement

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

    // The order must belong to the person making the request — without this
    // check, anyone logged in could submit a return for someone else's
    // order id just by guessing/typing it.
    const order = await Order.findOne({ orderId: req.body.orderId, userEmail: req.user.email });
    if (!order) {
      return res.status(404).json({ message: "Order not found on your account" });
    }

    // Only delivered orders can be returned — nothing to return before the
    // item has actually arrived.
    if (order.status !== "Delivered") {
      return res.status(400).json({ message: "Only delivered orders can be returned or exchanged" });
    }

    // 5-day return window, counted from when the order was placed.
    const orderAgeMs = Date.now() - new Date(order.createdAt).getTime();
    if (orderAgeMs > RETURN_WINDOW_MS) {
      return res.status(400).json({ message: "Return window has expired — returns are only accepted within 5 days of placing the order" });
    }

    // Block duplicate requests — one open (Pending) or already-Approved
    // request per order is enough; repeated submissions would otherwise
    // restock/refund multiple times for the same order.
    const existing = await Return.findOne({ orderId: req.body.orderId, status: { $in: ["Pending", "Approved"] } });
    if (existing) {
      return res.status(400).json({ message: "A return/exchange request already exists for this order" });
    }

    const request = await Return.create({
      orderId: req.body.orderId,
      userEmail: req.user.email,
      userName: sanitizeText(String(req.body.userName || "")).slice(0, 100),
      type: req.body.type,
      reason: sanitizeText(req.body.reason),
      exchangeDetails: sanitizeText(String(req.body.exchangeDetails || "")).slice(0, 500),
      paymentMethod: order.payment,
      orderTotal: order.total
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

    if (req.body.status === "Approved" && request.type === "Return") {
      const order = await Order.findOne({ orderId: request.orderId });

      // Only plain Returns restock automatically — an Exchange swaps for a
      // different item/size that isn't captured in a structured way here,
      // so the admin should adjust stock for the new item manually.
      if (order && !request.stockRestored) {
        await restoreStock(order.items);
        request.stockRestored = true;
      } else if (!order) {
        console.warn(`Return approved for unknown orderId ${request.orderId} — stock not restored.`);
      }

      // Money-back only applies to orders actually paid online through
      // Razorpay. COD orders never had money collected through the
      // gateway, so there's nothing for Razorpay to refund — the admin
      // settles those directly with the customer (cash/bank transfer)
      // outside this app, and refundStatus stays "Not Applicable".
      if (order && order.payment !== "COD" && order.paymentStatus === "Paid" && order.razorpayPaymentId && request.refundStatus === "Not Applicable") {
        try {
          const client = getRazorpay();
          const refund = await client.payments.refund(order.razorpayPaymentId, {
            amount: Math.round(order.total * 100), // paise, full refund
            speed: "normal"
          });
          request.refundStatus = "Processed";
          request.refundId = refund.id;
          request.refundAmount = order.total;
        } catch (refundErr) {
          // Refund failing shouldn't silently look like it worked — record
          // it as Failed so the admin sees it and can retry/refund manually
          // from the Razorpay dashboard instead of the customer being stuck.
          console.error("Razorpay refund failed:", refundErr.message);
          request.refundStatus = "Failed";
        }
      }

      // Reflect the return on the order itself so order history doesn't
      // keep showing "Delivered" forever after the item actually came back.
      if (order) {
        order.status = "Returned";
        pushHistory(order, "Returned", "Your return has been approved and processed");
        await order.save();
      }
    }

    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;