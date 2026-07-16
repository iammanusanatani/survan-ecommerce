// ── ATTACH USER EMAIL TO ORDER ──
    // (override placeOrder to tag email)
    function saveEmailConfig() {
      const cfg = {
        pubkey: document.getElementById('ejs-pubkey').value.trim(),
        service: document.getElementById('ejs-service').value.trim(),
        template: document.getElementById('ejs-template').value.trim(),
        toEmail: document.getElementById('ejs-to-email').value.trim()
      };
      if (!cfg.pubkey || !cfg.service || !cfg.template || !cfg.toEmail) { showToast('Fill all EmailJS fields'); return; }
      localStorage.setItem('survan_ejs', JSON.stringify(cfg));
      document.getElementById('ejs-status').innerHTML = '<span style="color:var(--neon)">✓ Saved!</span>';
      showToast('Email config saved!');
    }

    function loadEmailConfig() {
      const cfg = JSON.parse(localStorage.getItem('survan_ejs') || '{}');
      if (cfg.pubkey) document.getElementById('ejs-pubkey').value = cfg.pubkey;
      if (cfg.service) document.getElementById('ejs-service').value = cfg.service;
      if (cfg.template) document.getElementById('ejs-template').value = cfg.template;
      if (cfg.toEmail) document.getElementById('ejs-to-email').value = cfg.toEmail;
      if (cfg.pubkey) document.getElementById('ejs-status').innerHTML = '<span style="color:var(--neon)">✓ Configured</span>';
    }

    async function sendEmailNotification(order) {
      const cfg = JSON.parse(localStorage.getItem('survan_ejs') || '{}');
      if (!cfg.pubkey || !cfg.service || !cfg.template) { return; }
      try {
        emailjs.init(cfg.pubkey);
        const itemsText = order.items.map(i => `${i.name} (Size:${i.size} x${i.qty}) = Rs.${(i.price * i.qty).toLocaleString()}`).join('\n');
        await emailjs.send(cfg.service, cfg.template, {
          to_email: cfg.toEmail,
          order_id: order.id,
          customer_name: order.name,
          customer_email: order.email,
          customer_phone: order.phone,
          order_items: itemsText,
          order_total: 'Rs.' + order.total.toLocaleString(),
          payment_method: order.payment,
          address: order.address,
          order_date: order.date + ' ' + order.time
        });
        console.log('Email sent!');
      } catch (e) { console.log('EmailJS error:', e); }
    }

    // ════ ORDERS ════
    async function renderOrders() {
      const el = document.getElementById('orders-list');
      if (!currentUser) {
        el.innerHTML = `<div style="text-align:center;padding:4rem 2rem"><div style="font-family:var(--fd);font-size:3.5rem;font-weight:900;color:#1a1a1a;text-transform:uppercase">Login Required</div><p style="color:var(--gray);margin:1rem 0 2rem">Orders dekhne ke liye login karein.</p><button class="btn-primary" onclick="openAuth('login')">Login </button></div>`;
        return;
      }
      el.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--gray)">Loading orders...</div>`;

      let userOrders = [];
      try {
        const token = localStorage.getItem('survan_token');
        if (token) {
          const res = await fetch(`${API}/orders/my`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (res.ok) {
            const backendOrders = await res.json();
            // Sirf backend se orders lo — fresh aur sirf is user ke
            userOrders = backendOrders.map(o => ({
              id: o.orderId,
              date: new Date(o.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }),
              time: new Date(o.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
              createdAt: o.createdAt,
              items: o.items, sub: o.sub, ship: o.ship, discount: o.discount,
              total: o.total, payment: o.payment, status: o.status,
              address: o.address, name: o.name, phone: o.phone, email: o.email,
              userEmail: o.userEmail, _id: o._id
            }));
          }
        }
      } catch (e) { console.log('Orders fetch error:', e); }

      if (!userOrders.length) {
        el.innerHTML = `<div style="text-align:center;padding:4rem 2rem"><div style="font-family:var(--fd);font-size:3.5rem;font-weight:900;color:#1a1a1a;text-transform:uppercase">No Orders Yet</div><p style="color:var(--gray);margin:1rem 0 2rem">Your order history will appear here after you shop.</p><button class="btn-primary" onclick="showPage('shop')">Shop Now →</button></div>`;
        return;
      }
      el.innerHTML = userOrders.map((o, i) => {
        const scls = { 'Processing': 's-processing', 'Shipped': 's-shipped', 'Delivered': 's-delivered', 'Cancelled': 's-cancelled', 'Returned': 's-returned' };
        const RETURN_WINDOW_DAYS = 5;
        const steps = ['Placed', 'Processing', 'Packed', 'Shipped', 'Delivered'];
        const stepIdx = o.status === 'Cancelled' ? -1 : ({ 'Processing': 1, 'Packed': 2, 'Shipped': 3, 'Delivered': 4, 'Returned': 4 }[o.status] || 1);
        const isCancelled = o.status === 'Cancelled';
        const isReturned = o.status === 'Returned';
        const daysSincePlaced = (Date.now() - new Date(o.createdAt).getTime()) / 86400000;
        const withinReturnWindow = daysSincePlaced <= RETURN_WINDOW_DAYS;
        return `<div class="order-card">
      <div class="order-card-top">
        <div><div class="order-id">#${o.id}</div><div class="order-date">${o.date} · ${o.time || ''}</div></div>
        <div><div class="order-emojis">${o.items.map(x => x.emoji).slice(0, 4).join('')}</div><div class="order-count">${o.items.reduce((s, x) => s + x.qty, 0)} item(s) · ${o.payment}</div></div>
        <div class="order-total">Rs.${o.total.toLocaleString()}</div>
        <span class="order-status ${scls[o.status] || 's-processing'}">${o.status}</span>
      </div>
      <div class="order-expand" id="exp-${i}">
        <div class="track-steps">
          ${isCancelled ? `
            <div class="track-step">
              <div class="track-dot done">✓</div>
              <div class="track-label done">Placed</div>
            </div>
            <div class="track-step">
              <div class="track-dot" style="background:#ef4444;border-color:#ef4444;color:#fff">✕</div>
              <div class="track-label" style="color:#ef4444">Cancelled</div>
            </div>
          ` : isReturned ? `
            ${steps.map(s => `
            <div class="track-step">
              <div class="track-dot done">✓</div>
              <div class="track-label done">${s}</div>
            </div>`).join('')}
            <div class="track-step">
              <div class="track-dot" style="background:#a855f7;border-color:#a855f7;color:#fff">↩</div>
              <div class="track-label" style="color:#a855f7">Returned</div>
            </div>
          ` : steps.map((s, si) => `
            <div class="track-step">
              <div class="track-dot ${si < stepIdx ? 'done' : si === stepIdx ? 'current' : ''}">${si < stepIdx ? '✓' : si + 1}</div>
              <div class="track-label ${si <= stepIdx ? 'done' : ''}">${s}</div>
            </div>`).join('')}
        </div>
        <div style="display:flex;flex-direction:column;gap:.6rem">
          ${o.items.map(item => `<div style="display:flex;align-items:center;gap:1rem;background:var(--dark3);padding:.7rem 1rem;border-radius:4px">
            <div style="width:48px;height:48px;border-radius:4px;overflow:hidden;flex-shrink:0;background:var(--dark4)">${item.img ? `<img src="${item.img}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover">` : `<span style="font-size:1.5rem;display:flex;align-items:center;justify-content:center;height:100%">${item.emoji}</span>`}</div>
            <div><div style="font-family:var(--fd);font-weight:700;font-size:.95rem;text-transform:uppercase">${item.name}</div><div style="font-size:.75rem;color:var(--gray)">Size: ${item.size} · Qty: ${item.qty}</div></div>
            <span style="margin-left:auto;font-family:var(--fd);font-weight:900;color:var(--neon)">Rs.${(item.price * item.qty).toLocaleString()}</span>
          </div>`).join('')}
        </div>
        <div style="margin-top:1rem;font-size:.83rem;color:var(--gray)">Shipping to: <strong style="color:var(--light)">${o.address}</strong> · ${o.phone || ''}</div>
      </div>
      <div style="margin-top:1rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">
        ${o.status === 'Processing' ? `<button onclick="cancelOrder('${o.id}', '${o._id || ''}')" style="background:none;border:1px solid #ef444466;color:#ef4444;cursor:pointer;font-family:var(--fd);font-size:.8rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:.4rem .9rem;border-radius:4px;transition:all .2s" onmouseover="this.style.background='#ef444422'" onmouseout="this.style.background='none'">✕ Cancel Order</button>` :
          isReturned ? `<span style="font-size:.78rem;color:#a855f7;font-family:var(--fd);font-weight:700">Item Returned</span>` :
          o.status === 'Delivered' && withinReturnWindow ? `
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <button onclick="openReturnModal('${o.id}')" style="background:none;border:1px solid #3b82f666;color:#3b82f6;cursor:pointer;font-family:var(--fd);font-size:.78rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:.4rem .9rem;border-radius:4px;transition:all .2s" onmouseover="this.style.background='#3b82f622'" onmouseout="this.style.background='none'">↩ Return</button>
            <button onclick="openExchangeModal('${o.id}')" style="background:none;border:1px solid #f59e0b66;color:#f59e0b;cursor:pointer;font-family:var(--fd);font-size:.78rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:.4rem .9rem;border-radius:4px;transition:all .2s" onmouseover="this.style.background='#f59e0b22'" onmouseout="this.style.background='none'">⇄ Exchange</button>
          </div>` :
          o.status === 'Delivered' ? `<span style="font-size:.75rem;color:var(--gray);font-family:var(--fd)">Return window expired (5 days)</span>` :
          `<span></span>`}
        <button onclick="toggleExpand(${i})" style="background:none;border:none;color:var(--gray);cursor:pointer;font-family:var(--fd);font-size:.85rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;transition:color .2s" onmouseover="this.style.color='var(--neon)'" onmouseout="this.style.color='var(--gray)'" id="exp-btn-${i}">View Details ↓</button>
      </div>
    </div>`;
      }).join('');
    }

    async function trackOrder() {
      const oid = document.getElementById('track-input').value.trim().toUpperCase().replace(/^#/, '');
      const result = document.getElementById('track-result');
      if (!oid) { showToast('Order ID likhein'); return; }

      result.style.display = 'block';
      result.innerHTML = `<div style="color:var(--gray);font-size:.9rem">Searching...</div>`;

      try {
        const res = await fetch(`${API}/orders/track/${oid}`);
        const data = await res.json();

        if (!res.ok) {
          result.innerHTML = `<div style="color:var(--neon2);font-size:.9rem">Order nahi mila — ID check karein</div>`;
          return;
        }

        const steps = ['Placed', 'Processing', 'Packed', 'Shipped', 'Delivered'];
        const isCancelledOrder = data.status === 'Cancelled';
        const stepIdx = isCancelledOrder ? -1 : ({ 'Processing': 1, 'Packed': 2, 'Shipped': 3, 'Delivered': 4 }[data.status] || 1);
        const scls = { 'Processing': '#f59e0b', 'Shipped': '#3b82f6', 'Delivered': '#10b981', 'Cancelled': '#ef4444' };
        const color = scls[data.status] || '#f59e0b';
        const date = new Date(data.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });

        const stepsHtml = isCancelledOrder ? `
          <div class="track-step">
            <div class="track-dot done">✓</div>
            <div class="track-label done">Placed</div>
          </div>
          <div class="track-step">
            <div class="track-dot" style="background:#ef4444;border-color:#ef4444;color:#fff">✕</div>
            <div class="track-label" style="color:#ef4444;font-weight:700">Cancelled</div>
          </div>
        ` : steps.map((s, si) => `
          <div class="track-step">
            <div class="track-dot ${si < stepIdx ? 'done' : si === stepIdx ? 'current' : ''}">${si < stepIdx ? '✓' : si + 1}</div>
            <div class="track-label ${si <= stepIdx ? 'done' : ''}">${s}</div>
          </div>`).join('');

        result.innerHTML = `
          <div style="border-top:1px solid var(--dark3);padding-top:1.2rem">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;margin-bottom:1.2rem">
              <div>
                <div style="font-family:var(--fd);font-weight:900;font-size:1rem">#${data.orderId}</div>
                <div style="font-size:.78rem;color:var(--gray)">${date} · Rs.${data.total?.toLocaleString()}</div>
              </div>
              <span style="background:${color}22;color:${color};padding:.3rem .8rem;border-radius:20px;font-size:.8rem;font-weight:700;border:1px solid ${color}44">${data.status}</span>
            </div>
            <div class="track-steps" style="margin-bottom:1.2rem">
              ${stepsHtml}
            </div>
            <div style="font-size:.82rem;color:var(--gray)">
              ${data.items?.length ? `🛍️ ${data.items.length} item(s)` : ''}
            </div>
          </div>`;
      } catch {
        result.innerHTML = `<div style="color:var(--neon2);font-size:.9rem">Server se connect nahi ho saka</div>`;
      }
    }

    async function cancelOrder(orderId, mongoId) {
      if (!confirm('Kya aap yeh order cancel karna chahte hain?')) return;
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/orders/${orderId}/cancel`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) { showToast('' + data.message); return; }
        showToast('Order cancel ho gaya!');

        // Admin ko WhatsApp notification
        const waNum = localStorage.getItem('survan_wa');
        if (waNum) {
          const msg = `*ORDER CANCELLED — SURVAN*

*Order ID:* ${orderId}
*Customer:* ${currentUser?.fname} ${currentUser?.lname || ''}
*Email:* ${currentUser?.email}

Customer ne apna order cancel kar diya hai.`;
          window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank');
        }

        renderOrders();
      } catch {
        showToast('Server se connect nahi ho saka');
      }
    }

    function toggleExpand(i) {
      const el = document.getElementById('exp-' + i);
      const btn = document.getElementById('exp-btn-' + i);
      el.classList.toggle('open');
      btn.textContent = el.classList.contains('open') ? 'Hide Details ↑' : 'View Details ↓';
    }

    // ══════════════════════════════════════
    // RETURN / EXCHANGE / REVIEW FUNCTIONS
    // ══════════════════════════════════════

    let selectedRating = 0;

    function closeModal(id) {
      document.getElementById(id).style.display = 'none';
    }

    // ── RETURN ──
    function openReturnModal(orderId) {
      document.getElementById('return-order-id').value = 'Order: #' + orderId;
      document.getElementById('return-order-id').dataset.id = orderId;
      document.getElementById('return-reason').value = '';
      document.getElementById('return-details').value = '';
      document.getElementById('return-modal').style.display = 'flex';
    }

    async function submitReturn() {
      const orderId = document.getElementById('return-order-id').dataset.id;
      const reason = document.getElementById('return-reason').value;
      const details = document.getElementById('return-details').value;
      if (!reason) { showToast('Reason select karein'); return; }
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/returns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({
            orderId, type: 'Return',
            reason: reason + (details ? ' — ' + details : ''),
            userName: currentUser?.fname + ' ' + (currentUser?.lname || '')
          })
        });
        if (!res.ok) { const d = await res.json(); showToast('' + d.message); return; }
        closeModal('return-modal');
        showToast('Return request submit ho gaya! Admin review karega.');
        // WhatsApp admin notification
        const waNum = localStorage.getItem('survan_wa');
        if (waNum) {
          const msg = `*RETURN REQUEST — SURVAN*

Order: #${orderId}
Customer: ${currentUser?.fname}
Reason: ${reason}
${details ? 'Details: ' + details : ''}`;
          window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank');
        }
      } catch { showToast('Server se connect nahi ho saka'); }
    }

    // ── EXCHANGE ──
    function openExchangeModal(orderId) {
      document.getElementById('exchange-order-id').value = 'Order: #' + orderId;
      document.getElementById('exchange-order-id').dataset.id = orderId;
      document.getElementById('exchange-reason').value = '';
      document.getElementById('exchange-details').value = '';
      document.getElementById('exchange-modal').style.display = 'flex';
    }

    async function submitExchange() {
      const orderId = document.getElementById('exchange-order-id').dataset.id;
      const reason = document.getElementById('exchange-reason').value;
      const details = document.getElementById('exchange-details').value;
      if (!reason) { showToast('Reason select karein'); return; }
      if (!details) { showToast('Kya chahiye woh batayein'); return; }
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/returns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({
            orderId, type: 'Exchange',
            reason, exchangeDetails: details,
            userName: currentUser?.fname + ' ' + (currentUser?.lname || '')
          })
        });
        if (!res.ok) { const d = await res.json(); showToast('' + d.message); return; }
        closeModal('exchange-modal');
        showToast('Exchange request submit ho gaya! Admin review karega.');
        const waNum = localStorage.getItem('survan_wa');
        if (waNum) {
          const msg = `*EXCHANGE REQUEST — SURVAN*

Order: #${orderId}
Customer: ${currentUser?.fname}
Reason: ${reason}
Chahiye: ${details}`;
          window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank');
        }
      } catch { showToast('Server se connect nahi ho saka'); }
    }