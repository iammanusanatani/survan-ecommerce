// Appends one entry to order.statusHistory. Doesn't save the order —
// callers already do order.save() (or Order.create()) right after, so this
// just mutates the in-memory array.
function pushHistory(order, status, note, extra = {}) {
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status,
    note,
    courierName: extra.courierName || '',
    awbCode: extra.awbCode || '',
    at: new Date()
  });
}

module.exports = { pushHistory };