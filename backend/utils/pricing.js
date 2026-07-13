const Product = require('../models/Product');
const { isValidObjectId } = require('../middleware/validate');

// Flat shipping rule used across checkout: free above Rs. 3000, else Rs. 200.
// Kept in one place so the server's idea of shipping always matches what
// the frontend shows, instead of trusting a `ship` value from the client.
function computeShipping(sub) {
  return sub >= 3000 ? 0 : 200;
}

// Re-prices every cart item from the database instead of trusting whatever
// price the client sent — this is what actually stops someone from editing
// the price in devtools before checkout. Only real, DB-backed products
// (valid ObjectId) can be verified this way; the built-in demo catalog
// items have no DB record to check against, so their client-sent price is
// used as-is for those. Throws on the first invalid item (bad qty/price,
// or a product that no longer exists) so the caller can turn it into a
// clean 400 instead of silently pricing an order wrong.
async function priceItemsFromDB(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error('Order must contain at least one item');
  }

  const priced = [];
  for (const it of items) {
    const label = it?.name || 'item';
    const qty = Number(it?.qty);
    if (!Number.isFinite(qty) || qty <= 0 || qty > 1000) {
      throw new Error(`Invalid quantity for "${label}"`);
    }

    const id = String(it?.id || it?._id || '');
    if (isValidObjectId(id)) {
      const product = await Product.findById(id);
      if (!product) throw new Error(`"${label}" is no longer available`);
      priced.push({ ...it, id, name: product.name, price: product.price, qty });
    } else {
      // Demo/static catalog item — not tracked in the DB, can't be re-priced.
      const price = Number(it?.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error(`Invalid price for "${label}"`);
      }
      priced.push({ ...it, price, qty });
    }
  }
  return priced;
}

function computeSubtotal(pricedItems) {
  return pricedItems.reduce((s, it) => s + it.price * it.qty, 0);
}

module.exports = { priceItemsFromDB, computeSubtotal, computeShipping };