// ════ ADMIN ════
    const ADMIN_PASS_KEY = 'survan_admin_pass';
    const ADMIN_EMAIL = 'admin@survan.com';

    function isAdminSession() {
      return sessionStorage.getItem('survan_admin_auth') === '1';
    }

    function showAdmin() {
      showPage('admin');
      if (isAdminSession()) {
        showAdminDashboard();
      } else {
        // Admin session nahi hai — access denied dikhao
        document.getElementById('admin-login-screen').style.display = 'block';
        document.getElementById('admin-dashboard').style.display = 'none';
      }
    }

    function adminLogin() {
      // Yeh function ab use nahi hota — login form se hi admin login hoga
    }

    function adminLogout() {
      sessionStorage.removeItem('survan_admin_auth');
      currentUser = null;
      localStorage.removeItem('survan_user');
      document.getElementById('admin-dashboard').style.display = 'none';
      document.getElementById('admin-login-screen').style.display = 'block';
      updateNavUser();
      showPage('home');
      showToast('👋 Admin logout ho gaye');
    }

    async function showAdminDashboard() {
      document.getElementById('admin-login-screen').style.display = 'none';
      document.getElementById('admin-dashboard').style.display = 'block';
      loadEmailConfig();
      loadWAConfig();
      // Backend se saare orders fetch karo
      try {
        const token = localStorage.getItem('survan_token');
        if (token) {
          const res = await fetch(`${API}/orders/all`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (res.ok) {
            const backendOrders = await res.json();
            orders = backendOrders.map(o => ({
              id: o.orderId,
              date: new Date(o.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }),
              time: new Date(o.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
              items: o.items, sub: o.sub, ship: o.ship, discount: o.discount,
              total: o.total, payment: o.payment, status: o.status,
              address: o.address, name: o.name, phone: o.phone, email: o.email,
              userEmail: o.userEmail, _id: o._id, isNew: o.isNew || false
            }));
          }
        }
      } catch (e) { console.log('Admin orders fetch error:', e); }
      renderAdminStats();
      renderAdminTable(orders);
      loadAdminProducts();
      loadAdminCoupons();
      loadAdminReturns();
      loadAdminReviews();
      const hasNew = orders.some(o => o.isNew);
      document.getElementById('notif-indicator').style.display = hasNew ? 'flex' : 'none';
    }

    function renderAdminStats() {
      const total = orders.length;
      const revenue = orders.reduce((s, o) => s + o.total, 0);
      const processing = orders.filter(o => o.status === 'Processing').length;
      const delivered = orders.filter(o => o.status === 'Delivered').length;
      const newOrders = orders.filter(o => o.isNew).length;
      document.getElementById('admin-stats').innerHTML = `
    <div class="admin-stat"><div class="admin-stat-num">${total}</div><div class="admin-stat-label">Total Orders</div><div class="admin-stat-sub">${newOrders} new 🔥</div></div>
    <div class="admin-stat"><div class="admin-stat-num">Rs.${revenue.toLocaleString()}</div><div class="admin-stat-label">Total Revenue</div><div class="admin-stat-sub">All time</div></div>
    <div class="admin-stat"><div class="admin-stat-num">${processing}</div><div class="admin-stat-label">Processing</div><div class="admin-stat-sub">Need action</div></div>
    <div class="admin-stat"><div class="admin-stat-num">${delivered}</div><div class="admin-stat-label">Delivered</div><div class="admin-stat-sub">Completed</div></div>
    <div class="admin-stat"><div class="admin-stat-num">${orders.length ? Math.round(revenue / orders.length).toLocaleString() : 0}</div><div class="admin-stat-label">Avg. Order</div><div class="admin-stat-sub">Rs. per order</div></div>
  `;
    }

    function renderAdminTable(list) {
      const tbody = document.getElementById('admin-tbody');
      const empty = document.getElementById('admin-empty');
      if (!list.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
      empty.style.display = 'none';
      const scls = { 'Processing': 's-processing', 'Packed': 's-shipped', 'Shipped': 's-shipped', 'Delivered': 's-delivered', 'Cancelled': 's-cancelled' };
      tbody.innerHTML = list.map((o, i) => `
    <tr style="${o.isNew ? 'background:rgba(200,255,0,.03)' : ''};${o.status === 'Cancelled' ? 'opacity:0.7' : ''}">
      <td><span style="font-family:var(--fd);font-weight:900;color:var(--neon)">${o.id}</span>${o.isNew ? '<span class="notification-badge" style="margin-left:.4rem">New</span>' : ''}</td>
      <td style="color:var(--gray);white-space:nowrap">${o.date}<br><span style="font-size:.72rem">${o.time || ''}</span></td>
      <td><strong style="color:var(--white)">${o.name}</strong><br><span style="color:var(--gray);font-size:.75rem">${o.email || ''}</span></td>
      <td style="color:var(--gray)">${o.phone || ''}<br><span style="font-size:.75rem">${o.address}</span></td>
      <td style="font-size:.8rem">${o.items.map(x => `${x.emoji} ${x.name} ×${x.qty}`).join('<br>')}</td>
      <td><span style="font-family:var(--fd);font-size:1.1rem;font-weight:900">Rs.${o.total.toLocaleString()}</span></td>
      <td><span class="order-status ${scls[o.payment] || ''}" style="background:var(--dark3);color:var(--gray)">${o.payment}</span></td>
      <td>
        ${o.status === 'Cancelled'
          ? `<span class="order-status s-cancelled">Cancelled</span>`
          : `<select class="status-select" onchange="updateOrderStatus('${o._id}','${o.id}',this.value)">
              ${['Processing', 'Packed', 'Shipped', 'Delivered'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>`
        }
      </td>
      <td>
        <button onclick="markSeen(${orders.indexOf(o)})" style="background:none;border:1px solid #2a2a2a;color:var(--gray);padding:.3rem .6rem;border-radius:4px;cursor:pointer;font-size:.75rem;transition:all .2s" onmouseover="this.style.borderColor='var(--neon)';this.style.color='var(--neon)'" onmouseout="this.style.borderColor='#2a2a2a';this.style.color='var(--gray)'">✓ Seen</button>
      </td>
    </tr>`).join('');
    }

    async function updateOrderStatus(mongoId, orderId, status) {
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/orders/${mongoId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ status })
        });
        if (!res.ok) { showToast('Status update failed'); return; }
        // Local update
        const order = orders.find(o => o._id === mongoId);
        if (order) order.status = status;
        showToast('Status updated: ' + status);
        renderAdminStats();
        renderAdminTable(orders);
      } catch {
        showToast('Server se connect nahi ho saka');
      }
    }

    function markSeen(idx) {
      orders[idx].isNew = false;
      localStorage.setItem('survan_orders', JSON.stringify(orders));
      renderAdminTable(orders);
      renderAdminStats();
      const hasNew = orders.some(o => o.isNew);
      document.getElementById('notif-indicator').style.display = hasNew ? 'flex' : 'none';
    }

    function filterAdminOrders(q) {
      if (!q) { renderAdminTable(orders); return; }
      const query = q.toLowerCase().replace(/^#/, '');
      const filtered = orders.filter(o =>
        o.id.toLowerCase().includes(query) ||
        o.name.toLowerCase().includes(query) ||
        (o.email && o.email.toLowerCase().includes(query)) ||
        (o.phone && o.phone.includes(query)) ||
        (o.address && o.address.toLowerCase().includes(query)) ||
        o.status.toLowerCase().includes(query)
      );
      renderAdminTable(filtered);
    }

    function filterAdminStatus(status) {
      if (!status) { renderAdminTable(orders); return; }
      renderAdminTable(orders.filter(o => o.status === status));
    }

    async function changeAdminPass() {
      const np = document.getElementById('new-pass').value;
      const cp = document.getElementById('confirm-pass').value;
      if (!np) { showToast('Enter new password'); return; }
      if (np !== cp) { showToast('Passwords do not match'); return; }
      if (np.length < 6) { showToast('Password must be 6+ characters'); return; }
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ newPassword: np })
        });
        const data = await res.json();
        if (!res.ok) { showToast('' + data.message); return; }
        document.getElementById('new-pass').value = '';
        document.getElementById('confirm-pass').value = '';
        showToast('Password update ho gaya!');
      } catch {
        showToast('Server se connect nahi ho saka');
      }
    }

    function exportOrders() {
      if (!orders.length) { showToast('No orders to export'); return; }
      const header = 'Order ID,Date,Customer,Phone,Email,Address,Items,Total,Payment,Status\n';
      const rows = orders.map(o => [
        o.id, o.date + ' ' + o.time, o.name, o.phone || '', o.email || '',
        '"' + o.address + '"',
        '"' + o.items.map(x => `${x.name} x${x.qty}`).join('; ') + '"',
        o.total, o.payment, o.status
      ].join(',')).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'survan-orders-' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click(); URL.revokeObjectURL(url);
      showToast('📥 Orders exported as CSV!');
    }

    // ══════════════════════════════════════
    // IMAGE UPLOAD (Cloudinary)
    // ══════════════════════════════════════
    const CLOUD_NAME = 'dd9xoa71s';
    const UPLOAD_PRESET = 'survan_products';
    let uploadedImageUrls = [];

    function previewImages(input) {
      const files = Array.from(input.files);
      if (!files.length) return;
      const grid = document.getElementById('img-preview-grid');
      grid.innerHTML = '';
      uploadedImageUrls = [];
      document.getElementById('p-uploaded-urls').value = '';

      files.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const div = document.createElement('div');
          div.style.cssText = 'position:relative;aspect-ratio:1;border-radius:4px;overflow:hidden;border:1px solid #333';
          div.innerHTML = `
            <img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">
            <div id="upload-status-${idx}" style="position:absolute;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff">⏳</div>`;
          grid.appendChild(div);
        };
        reader.readAsDataURL(file);
      });

      // Upload to Cloudinary
      uploadImagesToCloudinary(files);
    }

    async function uploadImagesToCloudinary(files) {
      const progress = document.getElementById('img-upload-progress');
      const saveBtn = document.querySelector('#product-modal .btn-primary');
      progress.style.display = 'block';
      progress.style.color = '#f59e0b';
      progress.textContent = `⏳ Uploading 0/${files.length}... Save mat dabayein`;
      uploadedImageUrls = [];
      if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = '.5'; }

      for (let i = 0; i < files.length; i++) {
        try {
          const formData = new FormData();
          formData.append('file', files[i]);
          formData.append('upload_preset', UPLOAD_PRESET);

          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.secure_url) {
            uploadedImageUrls.push(data.secure_url);
            const statusEl = document.getElementById(`upload-status-${i}`);
            if (statusEl) statusEl.innerHTML = '<i data-lucide="check" style="width:14px;height:14px"></i>'; if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 10);
            progress.textContent = `⏳ Uploading ${uploadedImageUrls.length}/${files.length}...`;
          } else {
            const statusEl = document.getElementById(`upload-status-${i}`);
            if (statusEl) statusEl.innerHTML = '<i data-lucide="x" style="width:14px;height:14px"></i>'; if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 10);
            console.log('Upload error:', data);
          }
        } catch (e) {
          const statusEl = document.getElementById(`upload-status-${i}`);
          if (statusEl) statusEl.innerHTML = '<i data-lucide="x" style="width:14px;height:14px"></i>'; if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 10);
          console.log('Upload exception:', e);
        }
      }

      document.getElementById('p-uploaded-urls').value = uploadedImageUrls.join(',');
      if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; }

      if (uploadedImageUrls.length > 0) {
        progress.style.color = 'var(--neon)';
        progress.textContent = `${uploadedImageUrls.length}/${files.length} images uploaded! Ab Save kar sakte hain.`;
      } else {
        progress.style.color = '#ef4444';
        progress.textContent = `Upload fail ho gaya — URL field mein paste karein`;
      }
    }

    // ══════════════════════════════════════
    // ADMIN PRODUCTS MANAGEMENT
    // ══════════════════════════════════════

    async function loadAdminProducts() {
      const el = document.getElementById('admin-products-list');
      el.innerHTML = '<div class="loader" style="color:var(--gray);text-align:center;padding:2rem;grid-column:1/-1">Loading...</div>';
      try {
        const res = await fetch(`${API}/products`);
        const data = await res.json();
        if (!data.length) {
          el.innerHTML = '<div style="color:var(--gray);text-align:center;padding:2rem;grid-column:1/-1;font-family:var(--fd)">Koi product nahi — Add Product button dabayein</div>';
          return;
        }
        const badgeClrs = { new: '#10b981', sale: '#ef4444', hot: '#f59e0b', limited: '#a855f7' };
        el.innerHTML = data.map(p => `
          <div style="background:var(--dark2);border:1px solid var(--dark3);border-radius:6px;overflow:hidden">
            <div style="position:relative;height:180px;background:var(--dark3);display:flex;align-items:center;justify-content:center">
              ${p.images?.[0] || p.img ? `<img src="${p.images?.[0] || p.img}" style="width:100%;height:100%;object-fit:cover">` : `<span style="font-size:3rem">${p.emoji || '📦'}</span>`}
              ${p.badgeType ? `<span style="position:absolute;top:.5rem;left:.5rem;background:${badgeClrs[p.badgeType] || '#333'};color:#fff;font-size:.7rem;font-weight:900;padding:.2rem .5rem;border-radius:3px;text-transform:uppercase">${p.badgeType}</span>` : ''}
              ${p.stock <= 10 ? `<span style="position:absolute;top:.5rem;right:.5rem;background:#ef444499;color:#fff;font-size:.7rem;font-weight:700;padding:.2rem .5rem;border-radius:3px">Low Stock: ${p.stock}</span>` : ''}
            </div>
            <div style="padding:1rem">
              <div style="font-family:var(--fd);font-weight:900;font-size:.95rem;text-transform:uppercase;margin-bottom:.3rem">${p.emoji || ''} ${p.name}</div>
              <div style="color:var(--gray);font-size:.75rem;margin-bottom:.5rem">${p.category} · Stock: ${p.stock}</div>
              <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.8rem">
                <span style="font-family:var(--fd);font-weight:900;color:var(--neon);font-size:1rem">Rs.${p.price?.toLocaleString()}</span>
                ${p.originalPrice ? `<span style="color:var(--gray);text-decoration:line-through;font-size:.8rem">Rs.${p.originalPrice?.toLocaleString()}</span>` : ''}
              </div>
              <div style="display:flex;gap:.5rem">
                <button onclick="editProduct('${p._id}')" style="flex:1;background:none;border:1px solid #333;color:var(--gray);padding:.4rem;border-radius:4px;cursor:pointer;font-family:var(--fd);font-size:.78rem;font-weight:700;text-transform:uppercase;transition:all .2s" onmouseover="this.style.borderColor='var(--neon)';this.style.color='var(--neon)'" onmouseout="this.style.borderColor='#333';this.style.color='var(--gray)'"><i data-lucide="pencil" style="width:13px;height:13px;vertical-align:middle;margin-right:3px"></i>Edit</button>
                <button onclick="deleteProduct('${p._id}','${p.name}')" style="flex:1;background:none;border:1px solid #ef444466;color:#ef4444;padding:.4rem;border-radius:4px;cursor:pointer;font-family:var(--fd);font-size:.78rem;font-weight:700;text-transform:uppercase;transition:all .2s" onmouseover="this.style.background='#ef444422'" onmouseout="this.style.background='none'"><i data-lucide="trash-2" style="width:13px;height:13px;vertical-align:middle;margin-right:3px"></i>Delete</button>
              </div>
            </div>
          </div>`).join('');
      } catch (e) { el.innerHTML = '<div style="color:#ef4444;text-align:center;padding:2rem;grid-column:1/-1">Error loading products</div>'; }
    }

    function openAddProductModal() {
      document.getElementById('product-modal-title').textContent = '+ Add New Product';
      document.getElementById('product-edit-id').value = '';
      document.getElementById('p-name').value = '';
      document.getElementById('p-cat').value = 'Oversized';
      document.getElementById('p-price').value = '';
      document.getElementById('p-old-price').value = '';
      document.getElementById('p-emoji').value = '👕';
      document.getElementById('p-badge').value = '';
      document.getElementById('p-tag').value = '';
      document.getElementById('p-sizes').value = 'XS, S, M, L, XL';
      document.getElementById('p-stock').value = '100';
      document.getElementById('p-img').value = '';
      document.getElementById('p-uploaded-urls').value = '';
      document.getElementById('p-desc').value = '';
      document.getElementById('img-preview-grid').innerHTML = '';
      document.getElementById('img-upload-progress').style.display = 'none';
      uploadedImageUrls = [];
      document.getElementById('product-modal').style.display = 'flex';
    }

    async function editProduct(id) {
      try {
        const res = await fetch(`${API}/products`);
        const data = await res.json();
        const p = data.find(x => x._id === id);
        if (!p) { showToast('Product nahi mila'); return; }
        document.getElementById('product-modal-title').textContent = 'Edit Product';
        document.getElementById('product-edit-id').value = id;
        document.getElementById('p-name').value = p.name || '';
        document.getElementById('p-cat').value = p.category || 'Oversized';
        document.getElementById('p-price').value = p.price || '';
        document.getElementById('p-old-price').value = p.originalPrice || '';
        document.getElementById('p-emoji').value = p.emoji || '👕';
        document.getElementById('p-badge').value = p.badgeType || '';
        document.getElementById('p-tag').value = p.badge || '';
        document.getElementById('p-sizes').value = (p.sizes || []).join(', ');
        document.getElementById('p-stock').value = (p.stock === undefined || p.stock === null) ? 100 : p.stock;
        document.getElementById('p-img').value = p.images?.[0] || p.img || '';
        document.getElementById('p-uploaded-urls').value = '';
        document.getElementById('img-preview-grid').innerHTML = '';
        document.getElementById('img-upload-progress').style.display = 'none';
        uploadedImageUrls = [];
        document.getElementById('p-desc').value = p.description || '';
        document.getElementById('product-modal').style.display = 'flex';
      } catch { showToast('Error loading product'); }
    }

    async function saveProduct() {
      const name = document.getElementById('p-name').value.trim();
      const price = parseInt(document.getElementById('p-price').value);
      const desc = document.getElementById('p-desc').value.trim();
      const img = document.getElementById('p-img').value.trim();
      if (!name || !price || !desc) { showToast('Name, price aur description required'); return; }

      const editId = document.getElementById('product-edit-id').value;
      // Pehle uploaded images check karo, phir URL
      const uploadedUrls = document.getElementById('p-uploaded-urls').value.split(',').filter(Boolean);
      const urlInput = img ? [img] : [];
      const allImgs = uploadedUrls.length > 0 ? uploadedUrls : urlInput;

      const body = {
        name: name.toUpperCase(),
        category: document.getElementById('p-cat').value,
        price,
        originalPrice: parseInt(document.getElementById('p-old-price').value) || null,
        emoji: document.getElementById('p-emoji').value || '👕',
        badgeType: document.getElementById('p-badge').value,
        badge: document.getElementById('p-tag').value,
        sizes: document.getElementById('p-sizes').value.split(',').map(s => s.trim()).filter(Boolean),
        stock: (() => { const v = parseInt(document.getElementById('p-stock').value); return isNaN(v) ? 100 : v; })(),
        img: img,
        images: allImgs,
        description: desc
      };

      try {
        const token = localStorage.getItem('survan_token');
        const url = editId ? `${API}/products/${editId}` : `${API}/products`;
        const method = editId ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify(body)
        });
        if (!res.ok) { const d = await res.json(); showToast('' + d.message); return; }
        closeModal('product-modal');
        showToast(editId ? 'Product update ho gaya!' : 'Product add ho gaya!');
        loadAdminProducts();
        loadProductsFromBackend(); // Frontend bhi refresh karo
      } catch { showToast('Server se connect nahi ho saka'); }
    }

    async function deleteProduct(id, name) {
      if (!confirm(`"${name}" delete karna chahte hain?`)) return;
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/products/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) { showToast('Delete failed'); return; }
        showToast('Product delete ho gaya!');
        loadAdminProducts();
        loadProductsFromBackend();
      } catch { showToast('Server se connect nahi ho saka'); }
    }

    // ── ADMIN COUPONS ──
    let adminCoupons = [];
    async function loadAdminCoupons() {
      const el = document.getElementById('admin-coupons-list');
      el.innerHTML = '<div style="color:var(--gray);text-align:center;padding:2rem;grid-column:1/-1">Loading...</div>';
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/coupons`, { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        adminCoupons = data;
        if (!data.length) {
          el.innerHTML = '<div style="color:var(--gray);text-align:center;padding:2rem;grid-column:1/-1;font-family:var(--fd)">Koi coupon nahi — Add Coupon button dabayein</div>';
          return;
        }
        el.innerHTML = data.map(c => {
          const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
          const limitReached = c.usageLimit !== null && c.usedCount >= c.usageLimit;
          const isActive = c.enabled && !expired && !limitReached;
          return `
          <div style="background:var(--dark2);border:1px solid var(--dark3);border-radius:6px;padding:1rem">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem">
              <div style="font-family:var(--fd);font-weight:900;font-size:1.05rem;letter-spacing:.03em">${c.code}</div>
              <span style="font-size:.68rem;font-weight:900;padding:.2rem .5rem;border-radius:3px;text-transform:uppercase;background:${isActive ? '#10b98122' : '#ef444422'};color:${isActive ? '#10b981' : '#ef4444'}">${isActive ? 'Active' : (expired ? 'Expired' : (limitReached ? 'Limit Reached' : 'Disabled'))}</span>
            </div>
            <div style="color:var(--neon);font-family:var(--fd);font-weight:900;font-size:1rem;margin-bottom:.4rem">${c.type === 'percent' ? c.value + '% OFF' : 'Rs.' + c.value.toLocaleString() + ' OFF'}${c.maxDiscount ? ` (max Rs.${c.maxDiscount.toLocaleString()})` : ''}</div>
            <div style="color:var(--gray);font-size:.75rem;line-height:1.6;margin-bottom:.8rem">
              ${c.minOrderValue ? `Min order: Rs.${c.minOrderValue.toLocaleString()}<br>` : ''}
              Used: ${c.usedCount}${c.usageLimit ? ' / ' + c.usageLimit : ' (unlimited)'}<br>
              ${c.expiresAt ? 'Expires: ' + new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No expiry'}
            </div>
            <div style="display:flex;gap:.5rem">
              <button onclick="editCoupon('${c._id}')" style="flex:1;background:none;border:1px solid #333;color:var(--gray);padding:.4rem;border-radius:4px;cursor:pointer;font-family:var(--fd);font-size:.72rem;font-weight:700;text-transform:uppercase">Edit</button>
              <button onclick="toggleCoupon('${c._id}')" style="flex:1;background:none;border:1px solid #333;color:var(--gray);padding:.4rem;border-radius:4px;cursor:pointer;font-family:var(--fd);font-size:.72rem;font-weight:700;text-transform:uppercase">${c.enabled ? 'Disable' : 'Enable'}</button>
              <button onclick="deleteCoupon('${c._id}','${c.code}')" style="flex:1;background:none;border:1px solid #ef444466;color:#ef4444;padding:.4rem;border-radius:4px;cursor:pointer;font-family:var(--fd);font-size:.72rem;font-weight:700;text-transform:uppercase">Delete</button>
            </div>
          </div>`;
        }).join('');
      } catch (e) { el.innerHTML = '<div style="color:#ef4444;text-align:center;padding:2rem;grid-column:1/-1">Error loading coupons</div>'; }
    }

    function openAddCouponModal() {
      document.getElementById('coupon-modal-title').textContent = '+ Add New Coupon';
      document.getElementById('coupon-edit-id').value = '';
      document.getElementById('cp-code').value = '';
      document.getElementById('cp-type').value = 'percent';
      document.getElementById('cp-value-label').textContent = 'Discount Percent (%) *';
      document.getElementById('cp-value').value = '';
      document.getElementById('cp-min').value = '';
      document.getElementById('cp-max').value = '';
      document.getElementById('cp-limit').value = '';
      document.getElementById('cp-expiry').value = '';
      document.getElementById('coupon-modal').style.display = 'flex';
    }

    function editCoupon(id) {
      const c = adminCoupons.find(x => x._id === id);
      if (!c) return;
      document.getElementById('coupon-modal-title').textContent = 'Edit Coupon';
      document.getElementById('coupon-edit-id').value = c._id;
      document.getElementById('cp-code').value = c.code;
      document.getElementById('cp-type').value = c.type;
      document.getElementById('cp-value-label').textContent = c.type === 'flat' ? 'Discount Amount (Rs.) *' : 'Discount Percent (%) *';
      document.getElementById('cp-value').value = c.value;
      document.getElementById('cp-min').value = c.minOrderValue || '';
      document.getElementById('cp-max').value = c.maxDiscount ?? '';
      document.getElementById('cp-limit').value = c.usageLimit ?? '';
      document.getElementById('cp-expiry').value = c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : '';
      document.getElementById('coupon-modal').style.display = 'flex';
    }

    async function saveCoupon() {
      const code = document.getElementById('cp-code').value.trim().toUpperCase();
      const value = parseFloat(document.getElementById('cp-value').value);
      if (!code) { showToast('Enter a coupon code'); return; }
      if (isNaN(value) || value <= 0) { showToast('Enter a valid discount value'); return; }

      const editId = document.getElementById('coupon-edit-id').value;
      const minVal = document.getElementById('cp-min').value;
      const maxVal = document.getElementById('cp-max').value;
      const limitVal = document.getElementById('cp-limit').value;
      const expiryVal = document.getElementById('cp-expiry').value;

      const payload = {
        code,
        type: document.getElementById('cp-type').value,
        value,
        minOrderValue: minVal ? parseFloat(minVal) : 0,
        maxDiscount: maxVal ? parseFloat(maxVal) : null,
        usageLimit: limitVal ? parseInt(limitVal) : null,
        expiresAt: expiryVal || null
      };

      try {
        const token = localStorage.getItem('survan_token');
        const url = editId ? `${API}/coupons/${editId}` : `${API}/coupons`;
        const res = await fetch(url, {
          method: editId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.message || 'Could not save coupon'); return; }
        showToast(editId ? 'Coupon update ho gaya!' : 'Coupon ban gaya!');
        closeModal('coupon-modal');
        loadAdminCoupons();
      } catch { showToast('Server se connect nahi ho saka'); }
    }

    async function toggleCoupon(id) {
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/coupons/${id}/toggle`, {
          method: 'PATCH',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) { showToast('Could not update coupon'); return; }
        loadAdminCoupons();
      } catch { showToast('Server se connect nahi ho saka'); }
    }

    async function deleteCoupon(id, code) {
      if (!confirm(`"${code}" coupon delete karna chahte hain?`)) return;
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/coupons/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) { showToast('Delete failed'); return; }
        showToast('Coupon delete ho gaya!');
        loadAdminCoupons();
      } catch { showToast('Server se connect nahi ho saka'); }
    }

    // ── ADMIN RETURNS ──
    async function loadAdminReturns() {
      const el = document.getElementById('admin-returns-list');
      el.innerHTML = '<div class="loader" style="color:var(--gray);text-align:center;padding:2rem">Loading...</div>';
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/returns/all`, { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        if (!data.length) { el.innerHTML = '<div style="color:var(--gray);text-align:center;padding:2rem;font-family:var(--fd)">Koi request nahi hai</div>'; return; }
        const scls = { 'Pending': '#f59e0b', 'Approved': '#10b981', 'Rejected': '#ef4444' };
        const refundBadge = (r) => {
          if (r.refundStatus === 'Processed') return `<span style="background:#10b98122;color:#10b981;padding:.2rem .6rem;border-radius:20px;font-size:.72rem;font-weight:700">💳 Refunded Rs.${r.refundAmount.toLocaleString()} (Razorpay)</span>`;
          if (r.refundStatus === 'Failed') return `<span style="background:#ef444422;color:#ef4444;padding:.2rem .6rem;border-radius:20px;font-size:.72rem;font-weight:700">⚠ Refund Failed — check Razorpay dashboard</span>`;
          if (r.refundStatus === 'Pending') return `<span style="background:#f59e0b22;color:#f59e0b;padding:.2rem .6rem;border-radius:20px;font-size:.72rem;font-weight:700">Refund Pending</span>`;
          if (r.paymentMethod === 'COD') return `<span style="background:var(--dark3);color:var(--gray);padding:.2rem .6rem;border-radius:20px;font-size:.72rem">COD — settle manually</span>`;
          return '';
        };
        el.innerHTML = data.map(r => `
          <div style="background:var(--dark2);border:1px solid var(--dark3);border-radius:6px;padding:1.2rem;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem">
            <div>
              <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.4rem;flex-wrap:wrap">
                <span style="font-family:var(--fd);font-weight:900;color:var(--neon)">#${r.orderId}</span>
                <span style="background:${scls[r.status]}22;color:${scls[r.status]};padding:.2rem .6rem;border-radius:20px;font-size:.75rem;font-weight:700;border:1px solid ${scls[r.status]}44">${r.status}</span>
                <span style="background:var(--dark3);color:var(--gray);padding:.2rem .6rem;border-radius:20px;font-size:.72rem">${r.type}</span>
                ${r.paymentMethod ? `<span style="background:var(--dark3);color:var(--gray);padding:.2rem .6rem;border-radius:20px;font-size:.72rem">${r.paymentMethod} · Rs.${(r.orderTotal || 0).toLocaleString()}</span>` : ''}
                ${r.type === 'Return' && r.status === 'Approved' ? refundBadge(r) : ''}
              </div>
              <div style="color:var(--white);font-size:.85rem;margin-bottom:.3rem"><strong>${r.userName}</strong></div>
              <div style="color:var(--gray);font-size:.8rem">Reason: ${r.reason}</div>
              ${r.exchangeDetails ? `<div style="color:var(--gray);font-size:.8rem">Chahiye: ${r.exchangeDetails}</div>` : ''}
              <div style="color:var(--gray);font-size:.75rem;margin-top:.3rem">${new Date(r.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
            <div style="display:flex;gap:.5rem;flex-direction:column;min-width:120px">
              ${r.status === 'Pending' ? `
                <button onclick="updateReturn('${r._id}','Approved')" style="background:#10b98122;border:1px solid #10b98166;color:#10b981;padding:.35rem .8rem;border-radius:4px;cursor:pointer;font-family:var(--fd);font-size:.78rem;font-weight:700;text-transform:uppercase">✓ Approve</button>
                <button onclick="updateReturn('${r._id}','Rejected')" style="background:#ef444422;border:1px solid #ef444466;color:#ef4444;padding:.35rem .8rem;border-radius:4px;cursor:pointer;font-family:var(--fd);font-size:.78rem;font-weight:700;text-transform:uppercase">✕ Reject</button>
              ` : `<span style="color:var(--gray);font-size:.8rem">${r.status === 'Approved' ? 'Approved' : 'Rejected'}</span>`}
            </div>
          </div>`).join('');
      } catch (e) { el.innerHTML = '<div style="color:#ef4444;text-align:center;padding:2rem">Error loading returns</div>'; }
    }

    async function updateReturn(id, status) {
      try {
        const token = localStorage.getItem('survan_token');
        await fetch(`${API}/returns/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ status })
        });
        showToast(status === 'Approved' ? 'Request approved!' : 'Request rejected!');
        loadAdminReturns();
      } catch { showToast('Server error'); }
    }

    // ── ADMIN REVIEWS ──
    async function loadAdminReviews() {
      const el = document.getElementById('admin-reviews-list');
      el.innerHTML = '<div style="color:var(--gray);text-align:center;padding:2rem">Loading...</div>';
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/reviews/all`, { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        if (!data.length) { el.innerHTML = '<div style="color:var(--gray);text-align:center;padding:2rem;font-family:var(--fd)">Koi review nahi hai</div>'; return; }
        el.innerHTML = data.map(r => `
          <div style="background:var(--dark2);border:1px solid var(--dark3);border-radius:6px;padding:1.2rem;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.4rem;flex-wrap:wrap">
                <span style="font-size:1rem">${'⭐'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                <span style="font-family:var(--fd);font-weight:700;color:var(--white)">${r.userName}</span>
                <span style="background:${r.approved ? '#10b98122' : '#f59e0b22'};color:${r.approved ? '#10b981' : '#f59e0b'};padding:.2rem .6rem;border-radius:20px;font-size:.72rem;font-weight:700">${r.approved ? 'Published' : 'Pending'}</span>
              </div>
              <div style="color:var(--gray);font-size:.8rem;margin-bottom:.3rem">Product: ${r.productName}</div>
              <div style="color:var(--light);font-size:.85rem;font-style:italic">"${r.comment}"</div>
              <div style="color:var(--gray);font-size:.75rem;margin-top:.3rem">${new Date(r.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
            <div style="display:flex;gap:.5rem;flex-direction:column;min-width:120px">
              ${!r.approved ? `
                <button onclick="updateReview('${r._id}',true)" style="background:#10b98122;border:1px solid #10b98166;color:#10b981;padding:.35rem .8rem;border-radius:4px;cursor:pointer;font-family:var(--fd);font-size:.78rem;font-weight:700;text-transform:uppercase">✓ Publish</button>
                <button onclick="updateReview('${r._id}',false,true)" style="background:#ef444422;border:1px solid #ef444466;color:#ef4444;padding:.35rem .8rem;border-radius:4px;cursor:pointer;font-family:var(--fd);font-size:.78rem;font-weight:700;text-transform:uppercase">✕ Delete</button>
              ` : `<button onclick="updateReview('${r._id}',false,true)" style="background:#ef444422;border:1px solid #ef444466;color:#ef4444;padding:.35rem .8rem;border-radius:4px;cursor:pointer;font-family:var(--fd);font-size:.78rem;font-weight:700;text-transform:uppercase">✕ Delete</button>`}
            </div>
          </div>`).join('');
      } catch (e) { el.innerHTML = '<div style="color:#ef4444;text-align:center;padding:2rem">Error loading reviews</div>'; }
    }

    async function updateReview(id, approved, del = false) {
      try {
        const token = localStorage.getItem('survan_token');
        if (del) {
          await fetch(`${API}/reviews/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
          showToast('Review delete ho gaya');
        } else {
          await fetch(`${API}/reviews/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ approved })
          });
          showToast('Review published!');
        }
        loadAdminReviews();
      } catch { showToast('Server error'); }
    }