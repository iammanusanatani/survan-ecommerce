// Email is sent via Brevo's HTTP API (see below) — no SMTP library needed.

// Sends email via Brevo's REST API (https://api.brevo.com) over normal HTTPS
// instead of raw SMTP. Render's free tier blocks outbound SMTP ports
// (25/465/587) entirely, but regular HTTPS traffic like this is unaffected.
function isMailConfigured() {
  return !!process.env.BREVO_API_KEY;
}

// Parses "Name <email@example.com>" or a bare "email@example.com" into parts.
function parseSender(fromString) {
  const match = String(fromString || '').match(/^(.*)<(.+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, '') || 'SURVAN', email: match[2].trim() };
  }
  return { name: 'SURVAN', email: String(fromString || '').trim() };
}

async function sendMail({ to, subject, html, text }) {
  if (!isMailConfigured()) {
    console.warn('⚠️  Email not configured (BREVO_API_KEY missing) — skipping send to', to);
    return { skipped: true };
  }

  const sender = parseSender(process.env.EMAIL_FROM);
  if (!sender.email) {
    console.warn('⚠️  EMAIL_FROM not set — skipping send to', to);
    return { skipped: true };
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text
    })
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Brevo API error (${res.status}): ${errBody}`);
  }
  return res.json();
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRs(n) {
  return 'Rs. ' + Number(n || 0).toLocaleString('en-IN');
}

function itemsRowsHtml(items) {
  return (items || []).map(function (it) {
    return '<tr>' +
      '<td style="padding:8px;border-bottom:1px solid #eee">' + escapeHtml(it.name) + (it.size ? ' (' + escapeHtml(it.size) + ')' : '') + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">' + escapeHtml(it.qty) + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">' + formatRs((it.price || 0) * (it.qty || 1)) + '</td>' +
      '</tr>';
  }).join('');
}

function itemsTextLines(items) {
  return (items || []).map(function (it) {
    return '- ' + it.name + (it.size ? ' (' + it.size + ')' : '') + ' x' + it.qty + ' = ' + formatRs((it.price || 0) * (it.qty || 1));
  }).join('\n');
}

// ── Customer order-confirmation email ──
function buildCustomerEmail(order) {
  const subject = 'Your SURVAN order ' + order.orderId + ' is confirmed!';
  const html = [
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">',
    '<div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">',
    '<h1 style="margin:0;letter-spacing:2px">SURVAN</h1>',
    '</div>',
    '<div style="padding:24px;border:1px solid #eee;border-top:none">',
    '<h2 style="margin-top:0">Thank you, ' + escapeHtml(order.name) + '! \uD83C\uDF89</h2>',
    '<p>Your order has been placed successfully. Here are the details:</p>',
    '<p><strong>Order ID:</strong> ' + escapeHtml(order.orderId) + '<br>',
    '<strong>Payment method:</strong> ' + escapeHtml(order.payment) + '<br>',
    '<strong>Status:</strong> ' + escapeHtml(order.status || 'Processing') + '</p>',
    '<table style="width:100%;border-collapse:collapse;margin:16px 0">',
    '<thead><tr style="background:#f7f7f7">',
    '<th style="padding:8px;text-align:left">Item</th>',
    '<th style="padding:8px;text-align:center">Qty</th>',
    '<th style="padding:8px;text-align:right">Price</th>',
    '</tr></thead>',
    '<tbody>' + itemsRowsHtml(order.items) + '</tbody>',
    '</table>',
    '<table style="width:100%;margin-top:8px">',
    '<tr><td>Subtotal</td><td style="text-align:right">' + formatRs(order.sub) + '</td></tr>',
    '<tr><td>Shipping</td><td style="text-align:right">' + (order.ship ? formatRs(order.ship) : 'Free') + '</td></tr>',
    (order.discount ? '<tr><td>Discount</td><td style="text-align:right">-' + formatRs(order.discount) + '</td></tr>' : ''),
    '<tr style="font-weight:bold;font-size:1.1em"><td style="padding-top:8px">Total</td><td style="text-align:right;padding-top:8px">' + formatRs(order.total) + '</td></tr>',
    '</table>',
    '<p style="margin-top:20px"><strong>Delivery address:</strong><br>' + escapeHtml(order.address) + '</p>',
    '<p style="color:#777;font-size:.9em;margin-top:24px">We will notify you once your order ships. Thank you for shopping with SURVAN!</p>',
    '</div></div>'
  ].join('');
  const text = 'Thank you ' + order.name + '! Your order ' + order.orderId + ' is confirmed.\n\n' +
    'Items:\n' + itemsTextLines(order.items) + '\n\n' +
    'Total: ' + formatRs(order.total) + '\nPayment: ' + order.payment + '\nAddress: ' + order.address;
  return { subject, html, text };
}

// ── Admin new-order alert email ──
function buildAdminEmail(order) {
  const subject = '\uD83D\uDED2 New order ' + order.orderId + ' — ' + formatRs(order.total);
  const html = [
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">',
    '<h2>New order received</h2>',
    '<p><strong>Order ID:</strong> ' + escapeHtml(order.orderId) + '<br>',
    '<strong>Customer:</strong> ' + escapeHtml(order.name) + '<br>',
    '<strong>Phone:</strong> ' + escapeHtml(order.phone) + '<br>',
    '<strong>Email:</strong> ' + escapeHtml(order.email) + '<br>',
    '<strong>Address:</strong> ' + escapeHtml(order.address) + '<br>',
    '<strong>Payment:</strong> ' + escapeHtml(order.payment) + ' (' + escapeHtml(order.paymentStatus || 'Pending') + ')</p>',
    '<table style="width:100%;border-collapse:collapse;margin:16px 0">',
    '<thead><tr style="background:#f7f7f7">',
    '<th style="padding:8px;text-align:left">Item</th>',
    '<th style="padding:8px;text-align:center">Qty</th>',
    '<th style="padding:8px;text-align:right">Price</th>',
    '</tr></thead>',
    '<tbody>' + itemsRowsHtml(order.items) + '</tbody>',
    '</table>',
    '<p style="font-weight:bold;font-size:1.1em">Total: ' + formatRs(order.total) + '</p>',
    '</div>'
  ].join('');
  const text = 'New order ' + order.orderId + ' from ' + order.name + ' (' + order.phone + '). Total: ' + formatRs(order.total) + '. Address: ' + order.address;
  return { subject, html, text };
}

// Sends both emails (customer confirmation + admin alert). Failures are
// logged but never thrown — a broken mail server should never block or
// fail an order that already succeeded in the database.
async function sendOrderEmails(order) {
  const adminTo = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  const jobs = [];

  if (order.email) {
    const customerEmail = buildCustomerEmail(order);
    jobs.push(
      sendMail(Object.assign({ to: order.email }, customerEmail)).catch(function (err) {
        console.error('Failed to send customer confirmation email:', err.message);
      })
    );
  }
  if (adminTo) {
    const adminEmail = buildAdminEmail(order);
    jobs.push(
      sendMail(Object.assign({ to: adminTo }, adminEmail)).catch(function (err) {
        console.error('Failed to send admin notification email:', err.message);
      })
    );
  }

  await Promise.allSettled(jobs);
}

// ── Password reset email ──
function buildResetPasswordEmail(name, resetLink) {
  const subject = 'Reset your SURVAN password';
  const html = [
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">',
    '<div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">',
    '<h1 style="margin:0;letter-spacing:2px">SURVAN</h1>',
    '</div>',
    '<div style="padding:24px;border:1px solid #eee;border-top:none">',
    '<h2 style="margin-top:0">Hi ' + escapeHtml(name || 'there') + ',</h2>',
    '<p>We received a request to reset your SURVAN account password. Click the button below to choose a new one:</p>',
    '<p style="text-align:center;margin:28px 0">',
    '<a href="' + resetLink + '" style="background:#1a1a1a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:bold;display:inline-block">Reset Password</a>',
    '</p>',
    '<p style="color:#777;font-size:.9em">This link expires in 30 minutes. If you didn\'t request this, you can safely ignore this email — your password will not be changed.</p>',
    '<p style="color:#777;font-size:.85em;word-break:break-all">Or copy this link: ' + resetLink + '</p>',
    '</div></div>'
  ].join('');
  const text = 'Reset your SURVAN password using this link (expires in 30 minutes): ' + resetLink + '\n\nIf you did not request this, ignore this email.';
  return { subject, html, text };
}

async function sendPasswordResetEmail(user, resetLink) {
  const emailContent = buildResetPasswordEmail(user.fname, resetLink);
  return sendMail(Object.assign({ to: user.email }, emailContent)).catch(function (err) {
    console.error('Failed to send password reset email:', err.message);
  });
}

module.exports = { sendMail, sendOrderEmails, isMailConfigured, sendPasswordResetEmail };
