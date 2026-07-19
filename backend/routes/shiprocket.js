const router = require("express").Router();
const Order = require("../models/Order");
const authMiddleware = require("../middleware/auth");
const { isAdmin } = require("../middleware/auth");
const { requireValidId } = require("../middleware/validate");
const { createShiprocketOrder, generateAWB } = require("../utils/shiprocket");

// ═══ Admin: create a Shiprocket shipment for an order ═══
// Call this once an order is packed and ready to ship. Creates the order on
// Shiprocket's side and tries to auto-assign a courier + AWB (tracking
// number). If AWB assignment fails, the shipment still exists on Shiprocket
// — finish assigning a courier manually from the Shiprocket dashboard.
router.post("/create/:id", authMiddleware, isAdmin, requireValidId(), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.shiprocketShipmentId) {
      return res.status(400).json({ message: "Shipment already created for this order" });
    }
    if (order.status === "Processing") {
      return res.status(400).json({ message: "Mark the order as Packed before creating a shipment" });
    }
    if (!order.pincode || !order.state) {
      return res.status(400).json({ message: "Order is missing pincode/state — can't create a shipment (this order was placed before those fields were required)" });
    }

    const { shiprocketOrderId, shiprocketShipmentId } = await createShiprocketOrder(order);
    order.shiprocketOrderId = shiprocketOrderId;
    order.shiprocketShipmentId = shiprocketShipmentId;

    let awbMessage = "Shipment created. Assign a courier from the Shiprocket dashboard to get a tracking number.";
    try {
      const { awbCode, courierName } = await generateAWB(shiprocketShipmentId);
      if (awbCode) {
        order.awbCode = awbCode;
        order.courierName = courierName;
        awbMessage = `Shipment created — AWB ${awbCode} assigned via ${courierName}.`;
      }
    } catch (awbErr) {
      // Not fatal — the Shiprocket order itself exists either way.
      console.error("AWB auto-assign failed:", awbErr.message);
    }

    await order.save();
    res.json({ message: awbMessage, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══ Webhook: Shiprocket calls this automatically when courier status changes ═══
// Configure this URL under Shiprocket dashboard → Settings → API → Webhooks,
// along with the same token as SHIPROCKET_WEBHOOK_TOKEN in .env. This is
// what keeps order status in sync without an admin manually clicking
// through the dropdown for every order.
router.post("/webhook", async (req, res) => {
  try {
    if (process.env.SHIPROCKET_WEBHOOK_TOKEN) {
      const incomingToken = req.headers["x-api-key"] || req.headers["x-webhook-token"];
      if (incomingToken !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
        return res.status(401).json({ message: "Invalid webhook token" });
      }
    }

    // Shiprocket's webhook payload shape has changed across API versions —
    // check a few likely field names rather than assuming one exact shape.
    const body = req.body || {};
    const awbCode = String(body.awb || body.awb_code || "");
    const rawStatus = String(body.current_status || body.shipment_status || body.status || "");
    const orderIdFromShiprocket = String(body.order_id || body.channel_order_id || "");

    if (!awbCode && !orderIdFromShiprocket) {
      console.warn("Shiprocket webhook: no awb or order_id in payload", body);
      return res.status(200).json({ message: "Ignored — no identifying field" }); // 200 so Shiprocket doesn't retry forever
    }

    const order = awbCode
      ? await Order.findOne({ awbCode })
      : await Order.findOne({ orderId: orderIdFromShiprocket });

    if (!order) {
      console.warn(`Shiprocket webhook: no matching order for awb=${awbCode} order_id=${orderIdFromShiprocket}`);
      return res.status(200).json({ message: "No matching order" });
    }

    order.shiprocketStatus = rawStatus;

    // Map Shiprocket's many granular statuses down to our simpler enum.
    // Only move status forward on recognized keywords — anything
    // unrecognized just gets logged in shiprocketStatus without touching
    // the main status field, so an unmapped status can't silently regress
    // an order.
    const s = rawStatus.toLowerCase();
    if (s.includes("delivered") && !s.includes("rto")) {
      order.status = "Delivered";
      if (!order.deliveredAt) order.deliveredAt = new Date();
    } else if (s.includes("cancel")) {
      order.status = "Cancelled";
    } else if (s.includes("out for delivery") || s.includes("in transit") || s.includes("shipped") || s.includes("picked up")) {
      order.status = "Shipped";
    } else if (s.includes("pickup") || s.includes("ready to ship")) {
      order.status = "Packed";
    }

    await order.save();
    res.status(200).json({ message: "Order updated" });
  } catch (err) {
    console.error("Shiprocket webhook error:", err.message);
    res.status(200).json({ message: "Error logged" }); // still 200 — avoid Shiprocket retry storms on our bugs
  }
});

module.exports = router;