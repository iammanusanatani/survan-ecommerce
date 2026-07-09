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

    // Scroll top button
    window.addEventListener('scroll', () => {
      const btn = document.getElementById('scroll-top');
      if (window.scrollY > 400) btn.classList.add('show');
      else btn.classList.remove('show');
    });



