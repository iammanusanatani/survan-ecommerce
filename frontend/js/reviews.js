    // ── REVIEW ──
    function openReviewModal(orderId, productId, productName) {
      document.getElementById('review-order-id').value = orderId;
      document.getElementById('review-product-id').value = productId;
      document.getElementById('review-product-name').textContent = productName;
      document.getElementById('review-comment').value = '';
      selectedRating = 0;
      resetStars();
      document.getElementById('review-modal').style.display = 'flex';
    }

    function setRating(n) {
      selectedRating = n;
      [1, 2, 3, 4, 5].forEach(i => {
        document.getElementById('star-' + i).textContent = i <= n ? '⭐' : '☆';
      });
    }

    function hoverRating(n) {
      [1, 2, 3, 4, 5].forEach(i => {
        document.getElementById('star-' + i).textContent = i <= n ? '⭐' : '☆';
      });
    }

    function resetStars() {
      [1, 2, 3, 4, 5].forEach(i => {
        document.getElementById('star-' + i).textContent = i <= selectedRating ? '⭐' : '☆';
      });
    }

    async function submitReview() {
      const productId = document.getElementById('review-product-id').value;
      const orderId = document.getElementById('review-order-id').value;
      const comment = document.getElementById('review-comment').value.trim();
      if (!selectedRating) { showToast('Rating de karein'); return; }
      if (!comment) { showToast('Review likhein'); return; }
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({
            productId, orderId,
            productName: document.getElementById('review-product-name').textContent,
            rating: selectedRating, comment,
            userName: currentUser?.fname + ' ' + (currentUser?.lname || '')
          })
        });
        const data = await res.json();
        if (!res.ok) { showToast('' + data.message); return; }
        closeModal('review-modal');
        showToast('Review submit ho gaya! Admin approve karne ke baad dikhe ga.');
      } catch { showToast('Server se connect nahi ho saka'); }
    }



    async function loadProductReviews(productId) {
      const el = document.getElementById('product-reviews-list');
      if (!el) return;
      try {
        const res = await fetch(`${API}/reviews/product/${productId}`);
        const reviews = await res.json();
        if (!reviews.length) {
          el.innerHTML = `<div style="color:var(--gray);text-align:center;padding:1.5rem;font-size:.88rem">Koi review nahi hai abhi — pehle review likhein!</div>`;
          return;
        }
        // Average rating
        const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
        el.innerHTML = `
          <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;background:var(--dark2);padding:1rem 1.2rem;border-radius:6px;border:1px solid var(--dark3)">
            <div style="font-family:var(--fd);font-size:2.5rem;font-weight:900;color:var(--neon)">${avg}</div>
            <div>
              <div style="font-size:1.2rem">${'⭐'.repeat(Math.round(avg))}${'☆'.repeat(5 - Math.round(avg))}</div>
              <div style="color:var(--gray);font-size:.8rem">${reviews.length} review${reviews.length > 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:.8rem">
            ${reviews.map(r => `
              <div style="background:var(--dark2);border:1px solid var(--dark3);border-radius:6px;padding:1rem 1.2rem">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;flex-wrap:wrap;gap:.4rem">
                  <div style="display:flex;align-items:center;gap:.6rem">
                    <div style="background:var(--neon);color:var(--dark);width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-weight:900;font-size:.85rem">${r.userName?.charAt(0) || 'U'}</div>
                    <span style="font-family:var(--fd);font-weight:700;font-size:.9rem">${r.userName}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:.5rem">
                    <span style="font-size:.9rem">${'⭐'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                    <span style="color:var(--gray);font-size:.75rem">${new Date(r.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <p style="color:var(--light);font-size:.85rem;line-height:1.6;font-style:italic">"${r.comment}"</p>
              </div>`).join('')}
          </div>`;
      } catch (e) {
        el.innerHTML = `<div style="color:var(--gray);text-align:center;padding:1rem;font-size:.85rem">Reviews load nahi ho sake</div>`;
      }
    }



