// ════ AUTH SYSTEM ════
    // ── BACKEND API ──

    let currentUser = JSON.parse(localStorage.getItem('survan_user') || 'null');

    function openAuth(tab = 'login') {
      document.getElementById('auth-modal').classList.add('open');
      switchAuthTab(tab);
    }
    function closeAuth() {
      document.getElementById('auth-modal').classList.remove('open');
    }
    document.getElementById('auth-modal').addEventListener('click', function (e) {
      if (e.target === this) closeAuth();
    });

    function switchAuthTab(tab) {
      document.getElementById('tab-login').classList.toggle('active', tab === 'login');
      document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
      document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
      document.getElementById('form-signup').style.display = tab === 'signup' ? 'block' : 'none';
      document.getElementById('form-forgot').style.display = 'none';
      document.getElementById('form-reset').style.display = 'none';
    }

    function showResetPassForm() {
      document.getElementById('form-login').style.display = 'none';
      document.getElementById('form-signup').style.display = 'none';
      document.getElementById('form-forgot').style.display = 'none';
      document.getElementById('form-reset').style.display = 'block';
    }

    function showForgotPass() {
      document.getElementById('form-login').style.display = 'none';
      document.getElementById('form-forgot').style.display = 'block';
    }

    function togglePassVis(id, btn) {
      const inp = document.getElementById(id);
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁' : '🙈';
    }

    async function doLogin() {
      const email = document.getElementById('li-email').value.trim();
      const pass = document.getElementById('li-pass').value;
      if (!email || !pass) { showToast('Enter email and password'); return; }
      try {
        const res = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass })
        });
        const data = await res.json();
        if (!res.ok) { showToast('' + data.message); return; }
        localStorage.setItem('survan_token', data.token);
        currentUser = data.user;
        if (!currentUser.addresses) currentUser.addresses = [];
        localStorage.setItem('survan_user', JSON.stringify(currentUser));

        // Merge whatever was wishlisted as a guest (this browser) with the
        // account's saved wishlist, so nothing gets silently lost either way.
        const accountWishlist = (data.user.wishlist || []).map(String);
        wishlist = [...new Set([...wishlist.map(String), ...accountWishlist])];
        localStorage.setItem('survan_wish', JSON.stringify(wishlist));
        syncWishlistToBackend();

        closeAuth();
        updateNavUser();
        if (data.user.isAdmin) {
          sessionStorage.setItem('survan_admin_auth', '1');
          showToast('🔐 Welcome Back Admin Sir!');
          showPage('admin');
          showAdminDashboard();
        } else {
          showToast('Welcome back, ' + data.user.fname + '!');
          showPage('account');
        }
      } catch {
        showToast('Server se connect nahi ho saka');
      }
    }

    async function doSignup() {
      const fname = document.getElementById('su-fname').value.trim();
      const lname = document.getElementById('su-lname').value.trim();
      const email = document.getElementById('su-email').value.trim();
      const phone = document.getElementById('su-phone').value.trim();
      const pass = document.getElementById('su-pass').value;
      const cpass = document.getElementById('su-cpass').value;
      const agree = document.getElementById('su-agree').checked;
      if (!fname || !lname || !email || !phone || !pass) { showToast('Fill all required fields'); return; }
      if (pass.length < 8) { showToast('Password must be 8+ characters'); return; }
      if (pass !== cpass) { showToast('Passwords do not match'); return; }
      if (!agree) { showToast('Please agree to Terms & Conditions'); return; }
      try {
        const res = await fetch(`${API}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fname, lname, email, phone, password: pass })
        });
        const data = await res.json();
        if (!res.ok) { showToast('' + data.message); return; }
        localStorage.setItem('survan_token', data.token);
        currentUser = data.user;
        if (!currentUser.addresses) currentUser.addresses = [];
        localStorage.setItem('survan_user', JSON.stringify(currentUser));
        if (wishlist.length) syncWishlistToBackend();
        closeAuth();
        updateNavUser();
        showToast('Account ban gaya! Welcome, ' + fname + '!');
        showPage('account');
      } catch {
        showToast('Server se connect nahi ho saka');
      }
    }

    async function doForgotPass() {
      const email = document.getElementById('fp-email').value.trim();
      if (!email) { showToast('Enter your email'); return; }
      try {
        const res = await fetch(`${API}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        // Always shown regardless of whether the account exists — this is
        // intentional (prevents anyone using this form to guess registered emails).
        showToast(data.message || 'If an account exists for that email, a reset link has been sent.');
        switchAuthTab('login');
      } catch (e) {
        showToast('Could not send reset link. Please try again.');
      }
    }

    let pendingResetToken = null;
    async function doResetPassword() {
      const pass = document.getElementById('rp-pass').value;
      const pass2 = document.getElementById('rp-pass2').value;
      if (!pass || pass.length < 6) { showToast('Password must be at least 6 characters'); return; }
      if (pass !== pass2) { showToast('Passwords do not match'); return; }
      if (!pendingResetToken) { showToast('Reset link is invalid. Please request a new one.'); return; }
      try {
        const res = await fetch(`${API}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: pendingResetToken, newPassword: pass })
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.message || 'Reset link is invalid or expired'); return; }
        showToast('Password reset! You can now log in.');
        pendingResetToken = null;
        switchAuthTab('login');
      } catch (e) {
        showToast('Could not reset password. Please try again.');
      }
    }

    // If the page was opened from a password-reset email (?resetToken=...),
    // pull the token out of the URL, open the reset form, and clean the URL
    // so refreshing the page doesn't re-trigger this.
    (function checkForResetToken() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('resetToken');
      if (token) {
        pendingResetToken = token;
        document.getElementById('auth-modal').classList.add('open');
        showResetPassForm();
        params.delete('resetToken');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        window.history.replaceState({}, '', newUrl);
      }
    })();

    function doLogout() {
      currentUser = null;
      localStorage.removeItem('survan_user');
      localStorage.removeItem('survan_token');
      sessionStorage.removeItem('survan_admin_auth');
      updateNavUser();
      showToast('👋 Logged out successfully');
      showPage('home');
    }

    function requireLogin(page) {
      if (!currentUser) { openAuth('login'); return; }
      if (page === 'account') showPage('account');
      else showPage(page);
    }

    // Bottom tab bar's Account button: logged-out -> open login modal;
    // logged-in admin -> jump straight to the admin dashboard (same shortcut
    // the desktop "Dashboard" button gives); regular logged-in user -> account page.
    function handleBottomNavAccount() {
      if (!currentUser) { openAuth('login'); return; }
      const isAdmin = currentUser.email && currentUser.email.toLowerCase() === 'admin@survan.com';
      if (isAdmin) showAdmin();
      else showPage('account');
    }

    function refreshIcons() {
      if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
    }

    function updateNavUser() {
      const btn = document.getElementById('nav-user-btn');
      const mob = document.getElementById('mob-auth-btn');
      const adminNavLi = document.getElementById('nav-admin-li');
      const adminMobLi = document.getElementById('mob-admin-li');
      const isAdmin = currentUser && currentUser.email && currentUser.email.toLowerCase() === 'admin@survan.com';

      // Admin nav li: hide always (admin uses dashboard button instead)
      if (adminNavLi) adminNavLi.style.display = 'none';
      if (adminMobLi) adminMobLi.style.display = 'none';

      if (currentUser) {
        if (isAdmin) {
          btn.innerHTML = `<button class="user-nav-btn" onclick="showAdmin()" style="background:var(--ink);color:var(--bg);padding:.4rem 1rem;border-radius:4px;font-family:var(--fb);font-weight:600;font-size:.82rem;letter-spacing:.05em;border:none;cursor:pointer;display:flex;align-items:center;gap:.4rem"><i data-lucide="layout-dashboard" style="width:14px;height:14px"></i> Dashboard</button>`;
          if (mob) mob.textContent = 'Dashboard';
        } else {
          const initials = (currentUser.fname[0] + (currentUser.lname ? currentUser.lname[0] : '')).toUpperCase();
          btn.innerHTML = `<button class="user-nav-btn" onclick="showPage('account')"><span style="background:var(--neon);color:var(--dark);width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900">${initials}</span> ${currentUser.fname}</button>`;
          if (mob) mob.textContent = 'My Account';
        }
        autoFillCheckout();
      } else {
        btn.innerHTML = `<button class="user-nav-btn" onclick="openAuth('login')" style="display:flex;align-items:center;gap:.4rem"><i data-lucide="user" style="width:15px;height:15px"></i> Login</button>`;
        if (mob) mob.textContent = 'Login / Signup';
      }
      if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 10);
      // Sync menu drawer user info
      if (typeof updateMenuDrawerUser === 'function') updateMenuDrawerUser();
    }

    function autoFillCheckout() {
      if (!currentUser) return;
      setTimeout(() => {
        const f = id => document.getElementById(id);
        if (f('fname')) f('fname').value = currentUser.fname || '';
        if (f('lname')) f('lname').value = currentUser.lname || '';
        if (f('email')) f('email').value = currentUser.email || '';
        if (f('phone')) f('phone').value = currentUser.phone || '';
        // Fill default address
        if (currentUser.addresses && currentUser.addresses.length) {
          const def = currentUser.addresses.find(a => a.isDefault) || currentUser.addresses[0];
          if (def) {
            if (f('address')) f('address').value = def.street || '';
            if (f('city')) f('city').value = def.city || '';
          }
        }
      }, 100);
    }

    // ── ACCOUNT PAGE ──
    // ── ADDRESSES ──
    function renderAddresses() {
      const addrs = currentUser.addresses || [];
      const grid = document.getElementById('address-grid');
      if (!addrs.length) {
        grid.innerHTML = `<div style="color:var(--gray);font-size:.88rem;padding:1rem 0">No saved addresses yet. Add one below!</div>`;
        return;
      }
      grid.innerHTML = addrs.map((a, i) => `
    <div class="address-card ${a.isDefault ? 'default' : ''}">
      ${a.isDefault ? '<span class="address-default-badge">Default</span>' : ''}
      <div class="address-name">${a.name}</div>
      <div class="address-text">${a.street}<br>${a.city}, ${a.province} ${a.postal || ''}<br>📞 ${a.phone || ''}</div>
      <div class="address-actions">
        ${!a.isDefault ? `<button class="addr-btn" onclick="setDefaultAddress(${i})">Set Default</button>` : ''}
        <button class="addr-btn danger" onclick="deleteAddress(${i})">Remove</button>
      </div>
    </div>`).join('');
    }

    function showAddAddressForm() {
      document.getElementById('add-address-form').style.display = 'block';
      document.getElementById('add-address-form').scrollIntoView({ behavior: 'smooth' });
    }

    async function saveNewAddress() {
      if (!currentUser) { showToast('Please login'); return; }
      const name = document.getElementById('new-addr-name').value.trim();
      const phone = document.getElementById('new-addr-phone').value.trim();
      const street = document.getElementById('new-addr-street').value.trim();
      const city = document.getElementById('new-addr-city').value.trim();
      const prov = document.getElementById('new-addr-prov').value;
      const postal = document.getElementById('new-addr-postal').value.trim();
      const isDef = document.getElementById('new-addr-default').checked;
      if (!name || !phone || !street || !city || !prov || !postal) { showToast('Please fill all required fields'); return; }
      if (!/^[\d+][\d\s-]{6,18}$/.test(phone)) { showToast('Please enter a valid phone number'); return; }
      if (!/^[1-9][0-9]{5}$/.test(postal)) { showToast('Please enter a valid 6-digit PIN code'); return; }
      const newAddr = { name, phone, street, city, province: prov, postal, isDefault: isDef };
      if (!currentUser.addresses) currentUser.addresses = [];
      if (isDef) currentUser.addresses.forEach(a => a.isDefault = false);
      currentUser.addresses.push({ ...newAddr, isDefault: isDef || currentUser.addresses.length === 0 });
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/users/addresses`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ addresses: currentUser.addresses })
        });
        const data = await res.json();
        if (!res.ok) { showToast('' + data.message); return; }
        currentUser.addresses = data.addresses;
        localStorage.setItem('survan_user', JSON.stringify(currentUser));
        document.getElementById('add-address-form').style.display = 'none';
        ['new-addr-name', 'new-addr-phone', 'new-addr-street', 'new-addr-city', 'new-addr-postal'].forEach(id => document.getElementById(id).value = '');
        renderAddresses();
        showToast('Address save ho gaya!');
      } catch {
        showToast('Server se connect nahi ho saka');
      }
    }

    async function setDefaultAddress(idx) {
      if (!currentUser.addresses) return;
      currentUser.addresses.forEach((a, i) => a.isDefault = (i === idx));
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/users/addresses`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ addresses: currentUser.addresses })
        });
        const data = await res.json();
        if (!res.ok) { showToast('' + data.message); return; }
        currentUser.addresses = data.addresses;
        localStorage.setItem('survan_user', JSON.stringify(currentUser));
        renderAddresses();
        showToast('Default address update ho gaya!');
      } catch {
        showToast('Server se connect nahi ho saka');
      }
    }

    async function deleteAddress(idx) {
      if (!currentUser.addresses) return;
      currentUser.addresses.splice(idx, 1);
      if (currentUser.addresses.length && !currentUser.addresses.some(a => a.isDefault)) {
        currentUser.addresses[0].isDefault = true;
      }
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/users/addresses`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ addresses: currentUser.addresses })
        });
        const data = await res.json();
        if (!res.ok) { showToast('' + data.message); return; }
        currentUser.addresses = data.addresses;
        localStorage.setItem('survan_user', JSON.stringify(currentUser));
        renderAddresses();
        showToast('Address removed');
      } catch {
        showToast('Server se connect nahi ho saka');
      }
    }

    async function renderAccOrders() {
      const el = document.getElementById('acc-orders-list');
      el.innerHTML = `<div class="loader" style="text-align:center;padding:2rem;color:var(--gray)">Loading...</div>`;
      let userOrders = [];
      try {
        const token = localStorage.getItem('survan_token');
        if (token) {
          const res = await fetch(`${API}/orders/my`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (res.ok) {
            const data = await res.json();
            userOrders = data.map(o => ({
              id: o.orderId,
              date: new Date(o.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }),
              createdAt: o.createdAt,
              deliveredAt: o.deliveredAt,
              statusHistory: o.statusHistory || [],
              awbCode: o.awbCode, courierName: o.courierName,
              items: o.items, total: o.total, status: o.status, _id: o._id
            }));
          }
        }
      } catch (e) { console.log(e); }

      if (!userOrders.length) {
        el.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--gray)"><div style="font-family:var(--fd);font-size:2rem;font-weight:900;color:#1a1a1a;text-transform:uppercase">No Orders Yet</div><p style="margin:1rem 0 1.5rem">Start shopping!</p><button class="btn-primary" onclick="showPage('shop')">Shop Now →</button></div>`;
        return;
      }
      const scls = { 'Processing': 's-processing', 'Shipped': 's-shipped', 'Delivered': 's-delivered', 'Cancelled': 's-cancelled', 'Returned': 's-returned' };
      const RETURN_WINDOW_DAYS = 5;
      const steps = ['Placed', 'Processing', 'Packed', 'Shipped', 'Delivered'];
      el.innerHTML = userOrders.map((o, i) => {
        const isCancelled = o.status === 'Cancelled';
        const isReturned = o.status === 'Returned';
        const daysSincePlaced = (Date.now() - new Date(o.createdAt).getTime()) / 86400000;
        const withinReturnWindow = daysSincePlaced <= RETURN_WINDOW_DAYS;
        const stepIdx = isCancelled ? -1 : ({ 'Processing': 1, 'Packed': 2, 'Shipped': 3, 'Delivered': 4, 'Returned': 4 }[o.status] || 1);
        const stepsHtml = isCancelled ? `
          <div class="track-step">
            <div class="track-dot done">✓</div>
            <div class="track-label done">Placed</div>
          </div>
          <div class="track-step">
            <div class="track-dot" style="background:#ef4444;border-color:#ef4444;color:#fff">✕</div>
            <div class="track-label" style="color:#ef4444;font-weight:700">Cancelled</div>
          </div>
        ` : isReturned ? `
          ${steps.map(s => `
          <div class="track-step">
            <div class="track-dot done">✓</div>
            <div class="track-label done">${s}</div>
          </div>`).join('')}
          <div class="track-step">
            <div class="track-dot" style="background:#a855f7;border-color:#a855f7;color:#fff">↩</div>
            <div class="track-label" style="color:#a855f7;font-weight:700">Returned</div>
          </div>
        ` : steps.map((s, si) => `
          <div class="track-step">
            <div class="track-dot ${si < stepIdx ? 'done' : si === stepIdx ? 'current' : ''}">${si < stepIdx ? '✓' : si + 1}</div>
            <div class="track-label ${si <= stepIdx ? 'done' : ''}">${s}</div>
          </div>`).join('');
        return `
    <div class="order-card" style="margin-bottom:1px">
      <div class="order-card-top">
        <div><div class="order-id">#${o.id}</div><div class="order-date">${o.date}</div>${o.deliveredAt ? `<div class="order-date" style="color:var(--neon)">Delivered: ${new Date(o.deliveredAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</div>` : ''}</div>
        <div><div class="order-emojis">${o.items.map(x => x.emoji).slice(0, 4).join('')}</div><div class="order-count">${o.items.reduce((s, x) => s + x.qty, 0)} item(s)</div></div>
        <div class="order-total">Rs.${o.total.toLocaleString()}</div>
        <span class="order-status ${scls[o.status] || 's-processing'}">${o.status}</span>
      </div>
      <div class="order-expand" id="acc-exp-${i}">
        ${o.status === 'Delivered' ? `<div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:6px;padding:.9rem 1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:.6rem">
          <i data-lucide="check-circle" style="width:20px;height:20px;color:#22c55e;flex-shrink:0"></i>
          <div><div style="color:#22c55e;font-weight:700;font-size:.9rem">Your order was delivered successfully!</div>${o.deliveredAt ? `<div style="color:var(--gray);font-size:.78rem">on ${new Date(o.deliveredAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</div>` : ''}</div>
        </div>` : ''}
        <div style="margin:1rem 0">${renderOrderTimeline(o.statusHistory)}</div>
        ${o.awbCode ? `<div style="font-size:.83rem;color:#3b82f6;margin-bottom:.8rem"><i data-lucide="truck" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"></i>Tracking: <strong>${o.awbCode}</strong>${o.courierName ? ` via ${o.courierName}` : ''}</div>` : ''}
        <div style="display:flex;flex-direction:column;gap:.6rem">
          ${o.items.map(item => `
            <div style="display:flex;align-items:center;gap:1rem;background:var(--dark3);padding:.7rem 1rem;border-radius:4px">
              <div style="width:40px;height:40px;border-radius:4px;overflow:hidden;flex-shrink:0;background:var(--dark4);display:flex;align-items:center;justify-content:center;font-size:1.3rem">${item.emoji || '📦'}</div>
              <div><div style="font-family:var(--fd);font-weight:700;font-size:.9rem;text-transform:uppercase">${item.name}</div><div style="font-size:.75rem;color:var(--gray)">Size: ${item.size} · Qty: ${item.qty}</div></div>
              <span style="margin-left:auto;font-family:var(--fd);font-weight:900;color:var(--neon)">Rs.${(item.price * item.qty).toLocaleString()}</span>
            </div>`).join('')}
        </div>
      </div>
      <div style="margin-top:1rem;display:flex;justify-content:space-between;align-items:center">
        ${isCancelled ? `<span></span>` :
            isReturned ? `<span style="font-size:.78rem;color:#a855f7;font-family:var(--fd);font-weight:700"><i data-lucide="rotate-ccw" style="width:13px;height:13px;vertical-align:middle;margin-right:3px"></i>Item Returned</span>` :
            o.status === 'Delivered' && withinReturnWindow ? `
            <div style="display:flex;gap:.5rem;flex-wrap:wrap">
              <button onclick="openReturnModal('${o.id}')" style="background:none;border:1px solid #3b82f666;color:#3b82f6;cursor:pointer;font-family:var(--fd);font-size:.75rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:.35rem .8rem;border-radius:4px;transition:all .2s" onmouseover="this.style.background='#3b82f622'" onmouseout="this.style.background='none'"><i data-lucide="rotate-ccw" style="width:13px;height:13px;vertical-align:middle;margin-right:3px"></i>Return</button>
              <button onclick="openExchangeModal('${o.id}')" style="background:none;border:1px solid #f59e0b66;color:#f59e0b;cursor:pointer;font-family:var(--fd);font-size:.75rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:.35rem .8rem;border-radius:4px;transition:all .2s" onmouseover="this.style.background='#f59e0b22'" onmouseout="this.style.background='none'"><i data-lucide="repeat" style="width:13px;height:13px;vertical-align:middle;margin-right:3px"></i>Exchange</button>
              <button onclick="openReviewModal('${o.id}','${o.items[0]?.id || 0}','${o.items[0]?.name || ''}')" style="background:none;border:1px solid #a855f766;color:#a855f7;cursor:pointer;font-family:var(--fd);font-size:.75rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:.35rem .8rem;border-radius:4px;transition:all .2s" onmouseover="this.style.background='#a855f722'" onmouseout="this.style.background='none'"><i data-lucide="star" style="width:13px;height:13px;vertical-align:middle;margin-right:3px"></i>Review</button>
            </div>` :
              o.status === 'Delivered' ? `
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center">
              <span style="font-size:.75rem;color:var(--gray);font-family:var(--fd)">Return window expired (5 days)</span>
              <button onclick="openReviewModal('${o.id}','${o.items[0]?.id || 0}','${o.items[0]?.name || ''}')" style="background:none;border:1px solid #a855f766;color:#a855f7;cursor:pointer;font-family:var(--fd);font-size:.75rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:.35rem .8rem;border-radius:4px;transition:all .2s" onmouseover="this.style.background='#a855f722'" onmouseout="this.style.background='none'"><i data-lucide="star" style="width:13px;height:13px;vertical-align:middle;margin-right:3px"></i>Review</button>
            </div>` :
              o.status === 'Shipped' ? `
            <span style="font-size:.78rem;color:var(--gray);font-family:var(--fd)">Order shipped — cancel nahi ho sakta</span>` :
                `<button onclick="cancelOrder('${o.id}','${o._id}')" style="background:none;border:1px solid #ef444466;color:#ef4444;cursor:pointer;font-family:var(--fd);font-size:.78rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:.35rem .8rem;border-radius:4px;transition:all .2s" onmouseover="this.style.background='#ef444422'" onmouseout="this.style.background='none'">✕ Cancel</button>`
          }
        <button onclick="toggleAccOrder(${i})" style="background:none;border:none;color:var(--gray);cursor:pointer;font-family:var(--fd);font-size:.82rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;transition:color .2s" onmouseover="this.style.color='var(--neon)'" onmouseout="this.style.color='var(--gray)'" id="acc-exp-btn-${i}">View Details ↓</button>
      </div>
    </div>`;
      }).join('');
    }

    function toggleAccOrder(i) {
      const el = document.getElementById('acc-exp-' + i);
      const btn = document.getElementById('acc-exp-btn-' + i);
      el.classList.toggle('open');
      btn.textContent = el.classList.contains('open') ? 'Hide Details ↑' : 'View Details ↓';
    }

    function renderAccWishlist() {
      const el = document.getElementById('acc-wishlist-grid');
      const items = PRODUCTS.filter(p => wishlist.map(String).includes(String(p.id)));
      if (!items.length) { el.innerHTML = `<div style="color:var(--gray);padding:2rem;grid-column:1/-1">Your wishlist is empty.</div>`; return; }
      el.innerHTML = items.map(p => productCard(p, 'account')).join('');
    }

    // ── SECURITY ──
    function changeUserPass() {
      const old = document.getElementById('sec-old').value;
      const newp = document.getElementById('sec-new').value;
      const cnew = document.getElementById('sec-cnew').value;
      if (!old || !newp || !cnew) { showToast('Fill all fields'); return; }
      const users = JSON.parse(localStorage.getItem('survan_users') || '[]');
      const idx = users.findIndex(u => u.id === currentUser.id);
      if (users[idx].password !== btoa(old)) { showToast('Current password is wrong'); return; }
      if (newp.length < 8) { showToast('New password must be 8+ chars'); return; }
      if (newp !== cnew) { showToast('Passwords do not match'); return; }
      users[idx].password = btoa(newp);
      localStorage.setItem('survan_users', JSON.stringify(users));
      ['sec-old', 'sec-new', 'sec-cnew'].forEach(id => document.getElementById(id).value = '');
      showToast('Password changed successfully!');
    }

    function deleteAccount() {
      if (!confirm('Are you sure? This will permanently delete your account.')) return;
      const users = JSON.parse(localStorage.getItem('survan_users') || '[]');
      const filtered = users.filter(u => u.id !== currentUser.id);
      localStorage.setItem('survan_users', JSON.stringify(filtered));
      doLogout();
      showToast('Account deleted. Goodbye! 👋');
    }