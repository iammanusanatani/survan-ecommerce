    // ════ WISHLIST ════
    // Pushes the current wishlist to the backend for the logged-in user, so
    // it stays consistent across devices instead of being stuck in this
    // browser's localStorage. Silently does nothing for guests.
    function syncWishlistToBackend() {
      const token = localStorage.getItem('survan_token');
      if (!token) return;
      fetch(`${API}/users/wishlist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ wishlist })
      }).catch(() => { });
    }

    function toggleWish(id, btn) {
      id = String(id);
      if (wishlist.map(String).includes(id)) {
        wishlist = wishlist.filter(x => String(x) !== id);
        if (btn) { btn.innerHTML = '<i data-lucide="heart" style="width:16px;height:16px"></i>'; btn.classList.remove('wishlisted'); }
        showToast('Removed from wishlist');
      } else {
        wishlist.push(id);
        if (btn) { btn.innerHTML = '<i data-lucide="heart" style="width:16px;height:16px;fill:currentColor"></i>'; btn.classList.add('wishlisted'); }
        showToast('Added to wishlist!');
      }
      localStorage.setItem('survan_wish', JSON.stringify(wishlist));
      syncWishlistToBackend();
      updateBadges();
    }

    function toggleWishDetail(id) {
      id = String(id);
      const btn = document.getElementById('detail-wish');
      toggleWish(id, null);
      if (wishlist.map(String).includes(id)) { btn.innerHTML = '<i data-lucide="heart" style="width:16px;height:16px;fill:currentColor"></i>'; btn.classList.add('active'); }
      else { btn.innerHTML = '<i data-lucide="heart" style="width:16px;height:16px"></i>'; btn.classList.remove('active'); }
    }

    function renderWishlist() {
      const el = document.getElementById('wishlist-products');
      const items = PRODUCTS.filter(p => wishlist.map(String).includes(String(p.id)));
      if (!items.length) {
        el.innerHTML = `<div style="text-align:center;padding:4rem 1rem;grid-column:1/-1"><div style="font-family:var(--fd);font-size:3.5rem;font-weight:900;color:#1a1a1a;text-transform:uppercase">Nothing Yet</div><p style="color:var(--gray);margin:1rem 0 2rem">Save items you love to your wishlist.</p><button class="btn-primary" onclick="showPage('shop')">Start Browsing</button></div>`;
        return;
      }
      el.innerHTML = items.map(p => productCard(p, 'wishlist')).join('');
    }

