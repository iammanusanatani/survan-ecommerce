const Product = require('../models/Product');
const { isValidObjectId } = require('../middleware/validate');

// Checks whether enough stock exists for every real (DB-backed) item in the
// cart, without changing anything. Used before COD orders are created, so
// customers get a clear "out of stock" message instead of an order that
// silently can't be fulfilled. Returns a list of problem items (empty = OK).
async function checkStockAvailable(items) {
  const problems = [];
  for (const it of items || []) {
    const id = String(it.id || it._id || '');
    if (!isValidObjectId(id)) continue; // demo/non-DB items aren't stock-tracked
    const qty = Number(it.qty) || 0;
    if (qty <= 0) continue;
    const product = await Product.findById(id);
    if (!product) continue; // product removed — let the order proceed rather than block on a stale cart
    if (product.stock < qty) {
      problems.push({ name: product.name, available: product.stock, requested: qty });
    }
  }
  return problems;
}

// Reduces stock for each purchased item, atomically, so two simultaneous
// orders can never both succeed in overselling the same last unit.
// Items whose id isn't a real database product (e.g. the built-in demo
// catalog items) are skipped — there's nothing in the DB to decrement.
async function decrementStock(items) {
  for (const it of items || []) {
    const id = String(it.id || it._id || '');
    if (!isValidObjectId(id)) continue;
    const qty = Number(it.qty) || 0;
    if (qty <= 0) continue;

    const updated = await Product.findOneAndUpdate(
      { _id: id, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
      { new: true }
    );

    if (!updated) {
      // Not enough stock left (e.g. two people bought the last item at once).
      // The order/payment has already gone through, so we don't block it —
      // we just clamp stock to 0 and log it so the admin can restock.
      const product = await Product.findById(id);
      if (product && product.stock > 0) {
        console.warn(`⚠️  Oversold "${product.name}": had ${product.stock}, order needed ${qty}. Clamping stock to 0.`);
        product.stock = 0;
        await product.save();
      } else if (!product) {
        console.warn(`⚠️  Stock decrement skipped: product ${id} no longer exists.`);
      }
    }
  }
}

// Adds stock back for each item — used when an order is cancelled or a
// Return (not Exchange) is approved.
async function restoreStock(items) {
  for (const it of items || []) {
    const id = String(it.id || it._id || '');
    if (!isValidObjectId(id)) continue;
    const qty = Number(it.qty) || 0;
    if (qty <= 0) continue;
    await Product.findByIdAndUpdate(id, { $inc: { stock: qty } });
  }
}

module.exports = { decrementStock, restoreStock, checkStockAvailable };
