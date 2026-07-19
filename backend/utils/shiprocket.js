// ── Shiprocket integration ──
// Docs: https://apidocs.shiprocket.in  (sign up at shiprocket.in, add a
// pickup location under Settings → Pickup Addresses, then create an API
// user under Settings → API to get the email/password used here — these
// are usually different from your normal dashboard login).
//
// Required in .env:
//   SHIPROCKET_EMAIL=
//   SHIPROCKET_PASSWORD=
//   SHIPROCKET_PICKUP_LOCATION=   (exact name as shown in your Shiprocket
//                                  dashboard's pickup address list)
//   SHIPROCKET_WEBHOOK_TOKEN=     (any string you make up — enter the same
//                                  value in Shiprocket's webhook settings so
//                                  incoming webhook calls can be verified)

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// Token is valid ~10 days per Shiprocket's docs — cached in memory and
// re-fetched automatically once it's close to expiring, so most requests
// don't need a fresh login.
let cachedToken = null;
let tokenFetchedAt = 0;
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000; // refresh a day early, to be safe

async function getToken() {
  if (cachedToken && Date.now() - tokenFetchedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
    throw new Error('Shiprocket credentials missing. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env');
  }
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD
    })
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error('Shiprocket login failed: ' + (data.message || res.status));
  }
  cachedToken = data.token;
  tokenFetchedAt = Date.now();
  return cachedToken;
}

async function shiprocketFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Shiprocket API error (${res.status})`);
  }
  return data;
}

// Creates the order on Shiprocket's side (this is what shows up in your
// Shiprocket dashboard, ready for pickup scheduling). Returns
// { shiprocketOrderId, shiprocketShipmentId }.
//
// Note on weight/dimensions: Shiprocket needs these to calculate courier
// rates. We sum each item's `weight` (kg, from the Product model — defaults
// to 0.3kg if not set) times quantity, and use a generic small-parcel box
// size. Adjust PACKAGE_DIMENSIONS_CM below if your actual packaging differs.
const PACKAGE_DIMENSIONS_CM = { length: 25, breadth: 20, height: 5 };

async function createShiprocketOrder(order) {
  if (!process.env.SHIPROCKET_PICKUP_LOCATION) {
    throw new Error('SHIPROCKET_PICKUP_LOCATION missing in .env — must match a pickup address name in your Shiprocket dashboard');
  }

  const totalWeight = order.items.reduce((sum, it) => sum + (Number(it.weight) || 0.3) * (Number(it.qty) || 1), 0);
  const [firstName, ...rest] = (order.name || 'Customer').trim().split(' ');

  const payload = {
    order_id: order.orderId,
    order_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 16).replace('T', ' '),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
    billing_customer_name: firstName,
    billing_last_name: rest.join(' ') || '.',
    billing_address: order.address,
    billing_city: order.city,
    billing_pincode: order.pincode,
    billing_state: order.state,
    billing_country: 'India',
    billing_email: order.email,
    billing_phone: order.phone.replace(/\D/g, '').slice(-10), // Shiprocket wants a plain 10-digit number
    shipping_is_billing: true,
    order_items: order.items.map(it => ({
      name: it.name,
      sku: String(it.id || it._id || it.name).slice(0, 50),
      units: it.qty,
      selling_price: it.price
    })),
    payment_method: order.payment === 'COD' ? 'COD' : 'Prepaid',
    sub_total: order.sub,
    length: PACKAGE_DIMENSIONS_CM.length,
    breadth: PACKAGE_DIMENSIONS_CM.breadth,
    height: PACKAGE_DIMENSIONS_CM.height,
    weight: Math.max(0.1, Number(totalWeight.toFixed(2)))
  };

  const data = await shiprocketFetch('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return {
    shiprocketOrderId: String(data.order_id || ''),
    shiprocketShipmentId: String(data.shipment_id || '')
  };
}

// Best-effort auto-assign a courier + generate the AWB (tracking number).
// This can fail for reasons outside our control (e.g. no courier
// serviceable for that pincode at that weight) — callers should treat a
// thrown error here as "shipment created, but AWB needs to be assigned
// manually from the Shiprocket dashboard" rather than a hard failure.
async function generateAWB(shiprocketShipmentId) {
  const data = await shiprocketFetch('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: shiprocketShipmentId })
  });
  const response = data.response?.data || {};
  return {
    awbCode: String(response.awb_code || ''),
    courierName: String(response.courier_name || '')
  };
}

module.exports = { createShiprocketOrder, generateAWB };