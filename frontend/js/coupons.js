    async function applyPromo() {
      const code = document.getElementById('promo-input').value.trim().toUpperCase();
      if (!code) { showToast('Enter a promo code'); return; }
      try {
        const res = await fetch(`${API}/coupons/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, subtotal: cartTotal() })
        });
        const data = await res.json();
        if (!res.ok || !data.valid) {
          promoDiscount = 0;
          appliedPromoCode = '';
          showToast(data.message || 'Invalid promo code');
          renderCart();
          return;
        }
        promoDiscount = data.discount;
        appliedPromoCode = data.code;
        showToast(`🎉 Code applied! -Rs.${promoDiscount.toLocaleString()}`);
        renderCart();
      } catch (e) {
        showToast('Could not apply promo code. Please try again.');
      }
    }
