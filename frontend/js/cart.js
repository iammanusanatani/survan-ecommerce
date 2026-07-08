    // ════ CART ════
    function addToCart(id, size) {
      const p = PRODUCTS.find(x => String(x.id) === String(id));
      if (Number(p.stock) === 0) { showToast('Sorry, this item is sold out'); return; }
      const key = id + ':' + (size || '');
      const ex = cart.find(c => c._key === key);
      if (ex) ex.qty++;
      else cart.push({ ...p, qty: 1, size: size || p.sizes[0], _key: key });
      updateBadges();
      showToast(p.emoji + ' Added to cart!');
    }

    function removeFromCart(key) {
      cart = cart.filter(c => c._key !== key);
      updateBadges();
      renderCart();
    }

    function changeQty(key, delta) {
      const item = cart.find(c => c._key === key);
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) removeFromCart(key);
      else renderCart();
      updateBadges();
    }

    function cartTotal() { return cart.reduce((s, c) => s + c.price * c.qty, 0); }

    function renderCart() {
      const el = document.getElementById('cart-content');
      if (!cart.length) {
        el.innerHTML = `<div class="empty-cart"><div class="empty-big">Empty</div><p style="color:var(--gray);margin:1rem 0 2rem">Your cart is empty. Let's fix that.</p><button class="btn-primary" onclick="showPage('shop')">Browse Collection </button></div>`;
        return;
      }
      const sub = cartTotal();
      const ship = sub >= 3000 ? 0 : 200;
      const pct = Math.min(100, Math.round(sub / 3000 * 100));
      el.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        ${cart.map(item => `
          <div class="cart-item">
            <div class="cart-thumb" style="font-size:0;overflow:hidden"><img src="${item.img || ''}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.textContent='${item.emoji}'"></div>
            <div style="flex:1">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-meta">Size: ${item.size} · ${item.cat}</div>
              <div class="cart-item-price">Rs.${item.price.toLocaleString()} each</div>
              <div class="cart-qty">
                <button class="qty-btn" onclick="changeQty('${item._key}',-1)">−</button>
                <span class="qty-val">${item.qty}</span>
                <button class="qty-btn" onclick="changeQty('${item._key}',+1)">+</button>
                <span style="margin-left:.5rem;color:var(--gray);font-size:.8rem">= Rs.${(item.price * item.qty).toLocaleString()}</span>
              </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart('${item._key}')">✕</button>
          </div>`).join('')}
      </div>
      <div class="cart-summary">
        <div class="summary-title">Summary</div>
        <div class="summary-row"><span>Items (${cart.reduce((s, c) => s + c.qty, 0)})</span><span>Rs.${sub.toLocaleString()}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${ship === 0 ? '<span style="color:var(--neon)">FREE ✓</span>' : 'Rs.' + ship}</span></div>
        ${sub < 3000 ? `<div style="margin-top:-.4rem;margin-bottom:.8rem">
          <div style="font-size:.74rem;color:var(--gray);margin-bottom:.4rem">Rs.${(3000 - sub).toLocaleString()} more for free delivery</div>
          <div class="free-del-bar"><div class="free-del-fill" style="width:${pct}%"></div></div>
        </div>`: ''}
        <div class="promo-row">
          <input type="text" id="promo-input" placeholder="Promo code (SURVAN10)">
          <button onclick="applyPromo()">Apply</button>
        </div>
        ${promoDiscount > 0 ? `<div class="summary-row" style="color:var(--neon2)"><span>Promo Discount</span><span>-Rs.${promoDiscount.toLocaleString()}</span></div>` : ''}
        <div class="summary-row total"><span>Total</span><span>Rs.${(sub + ship - promoDiscount).toLocaleString()}</span></div>
        <button class="btn-primary" style="width:100%;margin-top:1rem;font-size:1.1rem" onclick="showPage('checkout')">Checkout →</button>
        <button class="btn-outline" style="width:100%;margin-top:.7rem" onclick="showPage('shop')">Continue Shopping</button>
      </div>
    </div>`;
    }


    // ════ CHECKOUT ════
    function selectPM(type) {
      selectedPM = type;
      document.querySelectorAll('.pm-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('pm-' + type).classList.add('active');
      const det = document.getElementById('pm-detail');
      if (type === 'card') {
        det.innerHTML = `<div class="card-row"><span class="card-chip">VISA</span><span class="card-chip">Mastercard</span><span class="card-chip">UPI</span><span class="card-chip">NetBanking</span></div>
      <div class="pm-info">🔒 <strong style="color:var(--white)">Secure Online Payment</strong><br>You'll be redirected to Razorpay's secure checkout to complete your payment via Card, UPI, or NetBanking. Your card details are never seen or stored by us.</div>`;
      } else if (type === 'easypaisa') {
        det.innerHTML = `<div class="pm-info">📱 <strong style="color:var(--white)">Easypaisa</strong><br>Send payment to: <strong style="color:var(--neon)">0300-1234567</strong><br>Account Name: SURVAN Streetwear<br>Send your payment screenshot to WhatsApp <strong style="color:var(--neon)">+92 300 0000000</strong> after placing order.</div>`;
      } else if (type === 'jazzcash') {
        det.innerHTML = `<div class="pm-info">💚 <strong style="color:var(--white)">JazzCash</strong><br>Send payment to: <strong style="color:var(--neon)">0310-7654321</strong><br>Account Name: SURVAN Streetwear<br>Send your payment screenshot to WhatsApp <strong style="color:var(--neon)">+92 310 0000000</strong> after placing order.</div>`;
      } else {
        det.innerHTML = `<div class="pm-info">💵 <strong style="color:var(--white)">Cash on Delivery</strong><br>Pay when your order arrives at your door. Fast, safe, and hassle-free.<br><em>COD charges: Rs.50 (included in shipping)</em></div>`;
      }
    }

    function formatCard(input) {
      let v = input.value.replace(/\D/g, '').substring(0, 16);
      input.value = v.replace(/(.{4})/g, '$1 ').trim();
    }

    function renderCheckout() {
      const sub = cartTotal();
      const ship = sub >= 3000 ? 0 : 200;
      const total = sub + ship - promoDiscount;
      document.getElementById('co-sub').textContent = 'Rs.' + sub.toLocaleString();
      document.getElementById('co-ship').textContent = ship === 0 ? 'FREE' : 'Rs.' + ship;
      document.getElementById('co-total').textContent = 'Rs.' + total.toLocaleString();
      if (promoDiscount > 0) {
        document.getElementById('co-discount-row').style.display = 'flex';
        document.getElementById('co-discount').textContent = '-Rs.' + promoDiscount.toLocaleString();
      }
      document.getElementById('co-items').innerHTML = cart.map(item => `
    <div class="order-mini-item">
      <div class="mini-thumb">${item.emoji}</div>
      <div><div class="mini-name">${item.name}</div><div class="mini-meta">Size: ${item.size} · Qty: ${item.qty}</div></div>
      <div class="mini-price">Rs.${(item.price * item.qty).toLocaleString()}</div>
    </div>`).join('');
      selectPM('cod');
    }

    function placeOrder() {
      const fname = document.getElementById('fname').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const address = document.getElementById('address').value.trim();
      const city = document.getElementById('city').value.trim();
      const agree = document.getElementById('agree-terms').checked;
      if (!fname || !email || !phone || !address || !city) { showToast('Please fill all required fields'); return; }
      if (!agree) { showToast('Please agree to Terms & Conditions'); return; }
      if (!cart.length) { showToast('Your cart is empty!'); return; }

      const details = { fname, email, phone, address, city };

      // Online card/UPI payment → go through Razorpay's secure checkout.
      // The order is only created on the backend after payment is verified.
      if (selectedPM === 'card') {
        payWithRazorpay(details);
        return;
      }

      // COD / Easypaisa / JazzCash → same trusted flow as before.
      const sub = cartTotal();
      const ship = sub >= 3000 ? 0 : 200;
      const oid = 'SURVAN-' + Math.floor(1000 + Math.random() * 9000);
      const order = {
        id: oid,
        date: new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
        items: [...cart],
        sub: sub, ship: ship, discount: promoDiscount,
        total: sub + ship - promoDiscount,
        payment: selectedPM.toUpperCase(),
        status: 'Processing',
        address: `${address}, ${city}`,
        name: fname, phone: phone, email: email,
        userEmail: currentUser ? currentUser.email : email,
        isNew: true
      };

      // Backend mein bhi save karo
      const token = localStorage.getItem('survan_token');
      if (token) {
        fetch(`${API}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({
            orderId: oid, name: fname, phone, email,
            address: `${address}, ${city}`,
            items: [...cart], sub, ship,
            promoCode: appliedPromoCode || undefined,
            payment: selectedPM.toUpperCase()
          })
        }).catch(() => { });
      }

      finalizeOrderSuccess(order);
    }

    // Shared "order successful" tail — used by both COD/manual and Razorpay flows.
    function finalizeOrderSuccess(order) {
      orders.unshift(order);
      localStorage.setItem('survan_orders', JSON.stringify(orders));

      sendEmailNotification(order);
      showWAPopup(order);

      cart = []; promoDiscount = 0; appliedPromoCode = '';
      updateBadges();
      document.getElementById('success-oid').textContent = 'Order #' + order.id;
    }

