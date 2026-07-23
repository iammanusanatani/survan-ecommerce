// ════ WHATSAPP NOTIFICATIONS ════
    function saveWAConfig() {
      const num = document.getElementById('wa-number').value.trim().replace(/[^0-9]/g, '');
      if (!num || num.length < 10) { showToast('Enter valid WhatsApp number'); return; }
      localStorage.setItem('survan_wa', num);
      document.getElementById('wa-status').innerHTML = '<span style="color:var(--neon)">✓ Saved!</span>';
      showToast('WhatsApp number saved!');
    }

    function loadWAConfig() {
      const num = localStorage.getItem('survan_wa') || '';
      if (num) document.getElementById('wa-number').value = num;
      if (num) document.getElementById('wa-status').innerHTML = '<span style="color:var(--neon)">✓ Configured</span>';
    }

    function showWAPopup(order) {
      const waNum = SITE_CONFIG.whatsappNumber || localStorage.getItem('survan_wa');
      const itemsText = order.items.map(i => `• ${i.name} (${i.size}) x${i.qty}`).join('\n');
      const msg = `*NEW ORDER — SURVAN*\n\n*Order ID:* ${order.id}\n*Customer:* ${order.name}\n*Phone:* ${order.phone}\n*Address:* ${order.address}\n\n*Items:*\n${itemsText}\n\n*Total:* Rs.${order.total.toLocaleString()}\n*Payment:* ${order.payment}\n*Date:* ${order.date} ${order.time}`;
      document.getElementById('wa-order-info').innerHTML = `<strong style="color:var(--white)">#${order.id}</strong> — Rs.${order.total.toLocaleString()}<br>${order.name} · ${order.phone}<br>${order.address}`;
      if (waNum) {
        document.getElementById('wa-link').href = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
        document.getElementById('wa-link').style.display = 'block';
      } else {
        document.getElementById('wa-link').style.display = 'none';
      }
      document.getElementById('wa-popup').style.display = 'flex';
    }

    function closeWAPopup() {
      document.getElementById('wa-popup').style.display = 'none';
      showPage('success');
    }

    // ════ UTILS ════
    function updateBadges() {
      // Cart only lives in memory + the database now — this pushes
      // whatever changed to the backend (no-ops for guests, who simply
      // don't have anywhere to persist a cart until they log in).
      syncCartToBackend();
      const cartCount = cart.reduce((s, c) => s + c.qty, 0);
      document.getElementById('cart-count').textContent = cartCount;
      document.getElementById('wish-count').textContent = wishlist.length;
      const bCart = document.getElementById('bnav-cart-count');
      if (bCart) bCart.textContent = cartCount;
      // Menu drawer badges
      const mCart = document.getElementById('menu-cart-count');
      const mWish = document.getElementById('menu-wish-count');
      if (mCart) mCart.textContent = cartCount;
      if (mWish) mWish.textContent = wishlist.length;
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
    }

    function subscribeNewsletter() {
      const e = document.getElementById('nl-email').value.trim();
      if (!e || !e.includes('@')) { showToast('Enter a valid email'); return; }
      document.getElementById('nl-email').value = '';
      showToast('Subscribed! Welcome to the SURVAN fam.');
    }

    // ════ ORDER TIMELINE ════
    // Renders a Flipkart-style vertical tracking timeline from an order's
    // statusHistory array. Consecutive entries with the same status are
    // grouped under one heading (matching how "Order Confirmed" groups
    // several sub-events together on Flipkart's own tracking screen).
    function renderOrderTimeline(history) {
      if (!history || !history.length) return `<div style="color:var(--gray);font-size:.82rem">Tracking history abhi available nahi hai.</div>`;

      const sorted = [...history].sort((a, b) => new Date(a.at) - new Date(b.at));
      const groups = [];
      sorted.forEach(entry => {
        const last = groups[groups.length - 1];
        if (last && last.status === entry.status) last.entries.push(entry);
        else groups.push({ status: entry.status, entries: [entry] });
      });

      const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });
      const fmtTime = d => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

      return `<div style="position:relative;padding-left:1.6rem">
        <div style="position:absolute;left:5px;top:8px;bottom:8px;width:2px;background:var(--dark3)"></div>
        ${groups.map((g, gi) => `
          <div style="position:relative;margin-bottom:${gi === groups.length - 1 ? '0' : '1.4rem'}">
            <div style="position:absolute;left:-1.6rem;top:2px;width:12px;height:12px;border-radius:50%;background:var(--neon)"></div>
            <div style="font-weight:700;color:var(--white);font-size:.95rem">${g.status} <span style="color:var(--gray);font-weight:400;font-size:.78rem;margin-left:.4rem">${fmtDate(g.entries[0].at)}</span></div>
            ${g.entries.map(e => `
              <div style="margin-top:.5rem">
                ${e.courierName && e.awbCode ? `<div style="color:var(--white);font-size:.85rem;font-weight:600">${e.courierName} - ${e.awbCode}</div>` : ''}
                <div style="color:var(--white);font-size:.85rem">${e.note}</div>
                <div style="color:var(--gray);font-size:.75rem">${fmtDate(e.at)} - ${fmtTime(e.at)}</div>
              </div>`).join('')}
          </div>`).join('')}
      </div>`;
    }

    // Scroll top button
    window.addEventListener('scroll', () => {
      const btn = document.getElementById('scroll-top');
      if (window.scrollY > 400) btn.classList.add('show');
      else btn.classList.remove('show');
    });