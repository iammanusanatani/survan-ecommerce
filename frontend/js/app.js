    // ════ DATA ════
    let PRODUCTS = [
      { id: 1, name: "VOLT OVERSIZED TEE", cat: "Oversized", price: 1799, old: 2200, tag: "Best Seller", emoji: "👕", img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80", imgs: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80", "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80", "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80"], badge: "sale", sizes: ["XS", "S", "M", "L", "XL"], desc: "Our signature oversized tee in heavyweight 280gsm cotton. Drop-shoulder cut, screen-printed SURVAN graphic on the back. Made to live in.", rating: 4.9, reviews: 142 },
      { id: 2, name: "NEON STRIKE HOODIE", cat: "Hoodie", price: 3499, old: null, tag: "New Drop", emoji: "🧥", img: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80", imgs: ["https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80", "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80", "https://images.unsplash.com/photo-1614495800597-27ba9f4ce6f3?w=600&q=80", "https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=600&q=80"], badge: "new", sizes: ["S", "M", "L", "XL", "XXL"], desc: "Premium fleece-lined hoodie with a bold neon strike graphic. Kangaroo pocket, drawstring hood, ribbed cuffs. The warmth hits different.", rating: 4.8, reviews: 87 },
      { id: 3, name: "BLACKOUT CARGO PANTS", cat: "Cargo", price: 2999, old: 3500, tag: "Trending", emoji: "👖", img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80", imgs: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80", "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80", "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&q=80", "https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=600&q=80"], badge: "sale", sizes: ["28", "30", "32", "34", "36"], desc: "6-pocket tactical cargo pants in durable ripstop fabric. Adjustable ankle ties, hidden zip closure. Utility meets street.", rating: 4.7, reviews: 203 },
      { id: 4, name: "CIRCUIT BOARD JACKET", cat: "Jacket", price: 5499, old: null, tag: "Limited Ed.", emoji: "🫡", img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80", imgs: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80", "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=600&q=80", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80", "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80"], badge: "new", sizes: ["S", "M", "L", "XL"], desc: "Statement bomber jacket with circuit-board all-over print. Satin lining, ribbed collar and cuffs. Only 50 pieces worldwide.", rating: 5.0, reviews: 34 },
      { id: 5, name: "STATIC SHORTS", cat: "Shorts", price: 1499, old: null, tag: "Summer Hit", emoji: "🩳", img: "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80", imgs: ["https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80", "https://images.unsplash.com/photo-1562588673-7b7e7bbae7bb?w=600&q=80", "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80", "https://images.unsplash.com/photo-1517720359744-6d12f8a09b10?w=600&q=80"], badge: "new", sizes: ["S", "M", "L", "XL"], desc: "Lightweight mesh shorts with side stripes and elastic waistband. Perfect for gym, street, or just vibing. Available in 4 colourways.", rating: 4.6, reviews: 118 },
      { id: 6, name: "SURVAN CAP", cat: "Cap", price: 999, old: 1200, tag: "Accessory", emoji: "🧢", img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80", imgs: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80", "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80", "https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=600&q=80", "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=600&q=80"], badge: "sale", sizes: ["One Size"], desc: "6-panel structured cap with embroidered SURVAN bolt logo. Adjustable strapback, one size fits all.", rating: 4.8, reviews: 267 },
      { id: 7, name: "GLITCH GRAPHIC TEE", cat: "Oversized", price: 1599, old: null, tag: "New Arrival", emoji: "👕", img: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80", imgs: ["https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80", "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80", "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80", "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&q=80"], badge: "new", sizes: ["XS", "S", "M", "L", "XL"], desc: "Distorted glitch-art graphic on the chest, crew neck, boxy fit. 100% ringspun cotton. Looks like it was corrupted in the best way.", rating: 4.7, reviews: 56 },
      { id: 8, name: "URBAN TECH HOODIE", cat: "Hoodie", price: 3999, old: 4500, tag: "Fan Fav", emoji: "🧥", img: "https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=600&q=80", imgs: ["https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=600&q=80", "https://images.unsplash.com/photo-1614495800597-27ba9f4ce6f3?w=600&q=80", "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80", "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80"], badge: "sale", sizes: ["S", "M", "L", "XL"], desc: "Tech-fleece construction for lightweight warmth. Zip chest pocket, thumbhole cuffs, minimal branding. The city is your runway.", rating: 4.9, reviews: 179 },
      { id: 9, name: "ACID WASH CARGO", cat: "Cargo", price: 2799, old: null, tag: "Drop 02", emoji: "👖", img: "https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=600&q=80", imgs: ["https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=600&q=80", "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80", "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&q=80", "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80"], badge: "new", sizes: ["28", "30", "32", "34", "36"], desc: "Hand-treated acid wash finish on our bestselling cargo silhouette. Every pair is unique. Side-cargo pockets, tapered leg.", rating: 4.6, reviews: 44 },
      { id: 10, name: "REBEL JOGGERS", cat: "Shorts", price: 1899, old: null, tag: "Comfy", emoji: "🩳", img: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80", imgs: ["https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80", "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80", "https://images.unsplash.com/photo-1562588673-7b7e7bbae7bb?w=600&q=80", "https://images.unsplash.com/photo-1517720359744-6d12f8a09b10?w=600&q=80"], badge: "new", sizes: ["S", "M", "L", "XL"], desc: "Heavyweight jogger in brushed fleece. Tapered fit, deep side pockets. For when you want comfort that still looks cold.", rating: 4.5, reviews: 91 },
      { id: 11, name: "SHADOW OVERSIZED", cat: "Oversized", price: 1699, old: 2000, tag: "Classic", emoji: "👕", img: "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&q=80", imgs: ["https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&q=80", "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80", "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80", "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80"], badge: "sale", sizes: ["S", "M", "L", "XL", "XXL"], desc: "The crowd-pleaser. Solid black body, tonal shadow print on the back. Goes with everything in your wardrobe.", rating: 4.8, reviews: 311 },
      { id: 12, name: "STORM WINDBREAKER", cat: "Jacket", price: 4999, old: null, tag: "Limited", emoji: "🫡", img: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80", imgs: ["https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80", "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80", "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=600&q=80"], badge: "new", sizes: ["S", "M", "L", "XL"], desc: "Lightweight packable windbreaker with neon trim details. Water-resistant shell, zippered pockets, packable into its own hood.", rating: 4.9, reviews: 22 },
    ];

    const CATS = [
      { name: "Oversized", emoji: "👕", count: 3 },
      { name: "Hoodie", emoji: "🧥", count: 2 },
      { name: "Cargo", emoji: "👖", count: 2 },
      { name: "Jacket", emoji: "🫡", count: 2 },
      { name: "Shorts", emoji: "🩳", count: 2 },
      { name: "Cap", emoji: "🧢", count: 1 },
    ];

    // ════ STATE ════
    let cart = [];
    let productsLoaded = false;
    let wishlist = JSON.parse(localStorage.getItem('survan_wish') || '[]');
    let orders = JSON.parse(localStorage.getItem('survan_orders') || '[]');
    let selectedPM = 'cod';
    let currentFilter = 'All';
    let currentSort = 'default';
    let currentShopPage = 1;
    const SHOP_PAGE_SIZE = 12;
    let detailFrom = 'shop';
    let detailSelected = {};
    let promoDiscount = 0;
    let appliedPromoCode = '';

    // ════ PAGES (defined in auth section above) ════
    function _oldShowPage_removed() { }

    // ── PAGE HISTORY (back button) ──
    let pageHistory = [];
    const PAGE_LABELS = {
      home: 'Home', shop: 'Shop', wishlist: 'Wishlist', orders: 'My Orders',
      cart: 'Cart', checkout: 'Checkout', account: 'Account', admin: 'Admin',
      detail: 'Product', success: 'Order Placed'
    };

    function showPage(name) {
      const currentActive = document.querySelector('.page.active');
      const currentName = currentActive ? currentActive.id.replace('page-', '') : null;
      // Push to history (don't push same page or home repeatedly)
      if (currentName && currentName !== name) {
        pageHistory.push(currentName);
        if (pageHistory.length > 20) pageHistory.shift();
      }
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-' + name).classList.add('active');
      document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
      const nl = document.getElementById('nav-' + name);
      if (nl) nl.classList.add('active');
      document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
      const bnavId = (name === 'checkout' || name === 'success') ? 'cart'
        : (name === 'account' || name === 'orders' || name === 'admin') ? 'account'
        : (name === 'detail') ? 'shop'
        : name;
      const bn = document.getElementById('bnav-' + bnavId);
      if (bn) bn.classList.add('active');
      window.scrollTo(0, 0);
      if (name === 'cart') renderCart();
      if (name === 'checkout') { renderCheckout(); autoFillCheckout(); }
      if (name === 'orders') renderOrders();
      if (name === 'wishlist') renderWishlist();
      if (name === 'account') renderAccountPage();
      updateBackBtn();
    }

    function goBack() {
      if (!pageHistory.length) { showPage('home'); return; }
      const prev = pageHistory.pop();
      // Direct navigate without pushing to history again
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-' + prev).classList.add('active');
      document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
      const nl = document.getElementById('nav-' + prev);
      if (nl) nl.classList.add('active');
      window.scrollTo(0, 0);
      if (prev === 'cart') renderCart();
      if (prev === 'checkout') { renderCheckout(); autoFillCheckout(); }
      if (prev === 'orders') renderOrders();
      if (prev === 'wishlist') renderWishlist();
      if (prev === 'account') renderAccountPage();
      updateBackBtn();
    }

    function updateBackBtn() {
      const bar = document.getElementById('back-btn-bar');
      if (!bar) return;
      if (pageHistory.length > 0) {
        const prevPage = pageHistory[pageHistory.length - 1];
        document.getElementById('back-btn-label').textContent = PAGE_LABELS[prevPage] || prevPage;
        bar.classList.add('visible');
      } else {
        bar.classList.remove('visible');
      }
    }

    function toggleProfileEdit() {
      const viewMode = document.getElementById('profile-view-mode');
      const editMode = document.getElementById('profile-edit-mode');
      const editBtn = document.getElementById('profile-edit-btn');
      const isEditing = editMode.style.display !== 'none';
      if (isEditing) {
        editMode.style.display = 'none';
        viewMode.style.display = 'block';
        editBtn.innerHTML = '<i data-lucide="pencil" style="width:13px;height:13px;vertical-align:middle;margin-right:3px"></i>Edit'; if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 10);
      } else {
        editMode.style.display = 'block';
        viewMode.style.display = 'none';
        editBtn.textContent = '✕ Cancel';
        // Fill edit fields
        document.getElementById('acc-fname').value = currentUser.fname || '';
        document.getElementById('acc-lname').value = currentUser.lname || '';
        document.getElementById('acc-femail').value = currentUser.email || '';
        document.getElementById('acc-fphone').value = currentUser.phone || '';
        document.getElementById('acc-dob').value = currentUser.dob || '';
        document.getElementById('acc-gender').value = currentUser.gender || '';
      }
    }

    async function renderAccountPage() {
      if (!currentUser) { openAuth('login'); return; }
      // Reload from storage (get latest)
      const users = JSON.parse(localStorage.getItem('survan_users') || '[]');
      const fresh = users.find(u => u.id === currentUser.id);
      if (fresh) { currentUser = { ...fresh }; delete currentUser.password; localStorage.setItem('survan_user', JSON.stringify(currentUser)); }

      const initials = (currentUser.fname[0] + (currentUser.lname ? currentUser.lname[0] : '')).toUpperCase();
      document.getElementById('acc-avatar').textContent = initials;
      document.getElementById('acc-name').textContent = currentUser.fname + ' ' + (currentUser.lname || '');
      document.getElementById('acc-email').textContent = currentUser.email;
      document.getElementById('acc-member-since').textContent = 'Member since ' + currentUser.joinDate;

      // Fill profile form
      // Fill VIEW mode
      const vf = document.getElementById('view-fname');
      const vl = document.getElementById('view-lname');
      const ve = document.getElementById('view-email');
      const vp = document.getElementById('view-phone');
      const vd = document.getElementById('view-dob');
      const vg = document.getElementById('view-gender');
      if (vf) vf.textContent = currentUser.fname || '—';
      if (vl) vl.textContent = currentUser.lname || '—';
      if (ve) ve.textContent = currentUser.email || '—';
      if (vp) vp.textContent = currentUser.phone || '—';
      if (vd) vd.textContent = currentUser.dob || '—';
      if (vg) vg.textContent = currentUser.gender || '—';
      // Reset to view mode
      const vm = document.getElementById('profile-view-mode');
      const em = document.getElementById('profile-edit-mode');
      const eb = document.getElementById('profile-edit-btn');
      if (vm) vm.style.display = 'block';
      if (em) em.style.display = 'none';
      if (eb) { eb.innerHTML = '<i data-lucide="pencil" style="width:13px;height:13px;vertical-align:middle;margin-right:3px"></i>Edit'; if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 10); }
      document.getElementById('acc-fname').value = currentUser.fname || '';
      document.getElementById('acc-lname').value = currentUser.lname || '';
      document.getElementById('acc-femail').value = currentUser.email || '';
      document.getElementById('acc-fphone').value = currentUser.phone || '';
      if (currentUser.dob) document.getElementById('acc-dob').value = currentUser.dob;
      if (currentUser.gender) document.getElementById('acc-gender').value = currentUser.gender;

      // Stats — fetched from the backend so they're correct on every device,
      // not just whichever browser happens to have orders in localStorage.
      document.getElementById('acc-stats').innerHTML = `
    <div class="profile-stat"><div class="profile-stat-num">…</div><div class="profile-stat-label">Orders</div></div>
    <div class="profile-stat"><div class="profile-stat-num">…</div><div class="profile-stat-label">Total Spent</div></div>
    <div class="profile-stat"><div class="profile-stat-num">${wishlist.length}</div><div class="profile-stat-label">Wishlist Items</div></div>`;
      (async () => {
        let orderCount = 0, totalSpent = 0;
        try {
          const token = localStorage.getItem('survan_token');
          if (token) {
            const res = await fetch(`${API}/orders/my`, { headers: { 'Authorization': 'Bearer ' + token } });
            if (res.ok) {
              const backendOrders = await res.json();
              orderCount = backendOrders.length;
              totalSpent = backendOrders.reduce((s, o) => s + (o.total || 0), 0);
            }
          }
        } catch (e) { console.log('Account stats fetch error:', e); }
        document.getElementById('acc-stats').innerHTML = `
    <div class="profile-stat"><div class="profile-stat-num">${orderCount}</div><div class="profile-stat-label">Orders</div></div>
    <div class="profile-stat"><div class="profile-stat-num">Rs.${totalSpent.toLocaleString()}</div><div class="profile-stat-label">Total Spent</div></div>
    <div class="profile-stat"><div class="profile-stat-num">${wishlist.length}</div><div class="profile-stat-label">Wishlist Items</div></div>`;
      })();

      renderAddresses();
      renderAccOrders();
      renderAccWishlist();
    }

    function switchAccSection(sec, el) {
      document.querySelectorAll('.account-nav-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      document.querySelectorAll('.account-section').forEach(s => s.classList.remove('active'));
      const target = document.getElementById('acc-' + sec);
      if (target) target.classList.add('active');
    }

    async function saveProfile() {
      if (!currentUser) { showToast('Please login first'); return; }
      const fname = document.getElementById('acc-fname').value.trim();
      const lname = document.getElementById('acc-lname').value.trim();
      const phone = document.getElementById('acc-fphone').value.trim();
      const dob = document.getElementById('acc-dob').value;
      const gender = document.getElementById('acc-gender').value;
      if (!fname) { showToast('First name required'); return; }
      try {
        const token = localStorage.getItem('survan_token');
        const res = await fetch(`${API}/users/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ fname, lname, phone, dob, gender })
        });
        const data = await res.json();
        if (!res.ok) { showToast('' + data.message); return; }
        currentUser = { ...currentUser, ...data };
        localStorage.setItem('survan_user', JSON.stringify(currentUser));
        updateNavUser();
        toggleProfileEdit(); // Edit mode band karo
        renderAccountPage(); // View mode update karo
        showToast('Profile save ho gaya!');
      } catch { showToast('Server se connect nahi ho saka'); }
    }

    // ════ INIT ════
    // Default products backup
    const DEFAULT_PRODUCTS = [...PRODUCTS];

    // Converts a raw backend Product document into the shape productCard()
    // and the rest of the frontend expect (id/cat/tag/imgs/etc). Used both
    // for the full-catalog load and the paginated Shop-page fetches.
    function mapBackendProduct(p) {
      return {
        id: p._id,
        name: p.name,
        cat: p.category,
        price: p.price,
        old: p.originalPrice || null,
        tag: p.badge || '',
        emoji: p.emoji || '👕',
        img: p.images?.[0] || p.img || '',
        imgs: p.images?.length ? p.images : [p.img || ''],
        badge: p.badgeType || '',
        sizes: p.sizes || [],
        desc: p.description || '',
        rating: p.rating || 0,
        reviews: p.reviewCount || 0,
        stock: (p.stock === undefined || p.stock === null) ? 100 : p.stock
      };
    }

    async function loadProductsFromBackend() {
      try {
        const res = await fetch(`${API}/products`);
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            // Backend products + default products (jo backend mein nahi hain)
            const backendProducts = data.map(mapBackendProduct);
            // Dono ko merge karo — backend first, phir defaults
            PRODUCTS = [...backendProducts, ...DEFAULT_PRODUCTS];
          }
        }
      } catch (e) { console.log('Products fetch error:', e); }
      renderHomeProducts();
      renderCats();
      renderShopProducts();
    }

    // Site-wide config from the backend (e.g. WhatsApp number) — this used to
    // only exist in the admin's own browser localStorage, so real customers
    // never got it. Now every visitor fetches the real value from the server.
    let SITE_CONFIG = { whatsappNumber: '' };
    async function loadSiteConfig() {
      try {
        const res = await fetch(`${API}/config`);
        if (res.ok) SITE_CONFIG = await res.json();
      } catch (e) { console.log('Site config fetch error:', e); }
    }

    // If already logged in (returning session), refresh the wishlist from
    // the backend so a page reload/reopen always reflects the account's
    // real cross-device state, not just whatever was last saved locally.
    async function syncWishlistFromBackend() {
      const token = localStorage.getItem('survan_token');
      if (!token || !currentUser) return;
      try {
        const res = await fetch(`${API}/users/wishlist`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          const data = await res.json();
          wishlist = (data.wishlist || []).map(String);
          localStorage.setItem('survan_wish', JSON.stringify(wishlist));
          updateBadges();
        }
      } catch (e) { console.log('Wishlist fetch error:', e); }
    }

    loadProductsFromBackend();
    loadSiteConfig();
    syncWishlistFromBackend();
    updateBadges();
    updateNavUser();

    // Nav scroll effect
    window.addEventListener('scroll', () => {
      document.querySelector('nav')?.classList.toggle('scrolled', window.scrollY > 20);
    });

    // Init Lucide Icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // ════ MOBILE UX ENHANCEMENTS ════

    // 1. Hardware-accelerated scroll restoration — instant on mobile
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    // 2. iOS viewport height fix (100vh is wrong on Safari)
    function setMobileVH() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    setMobileVH();
    window.addEventListener('resize', setMobileVH, { passive: true });

    // 3. Swipe-back gesture (right-swipe → goBack)
    (function initSwipeBack() {
      let startX = 0, startY = 0;
      const THRESHOLD = 80, EDGE_ZONE = 30;
      document.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, { passive: true });
      document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = Math.abs(e.changedTouches[0].clientY - startY);
        if (startX < EDGE_ZONE && dx > THRESHOLD && dy < 60) goBack();
      }, { passive: true });
    })();

    // 4. Prevent double-tap zoom on buttons
    // document.addEventListener('touchend', e => {
    //   if (e.target.closest('button, .btn-primary, .btn-outline, .product-card, .cat-card'))
    //     e.preventDefault();
    // }, { passive: false });

    // 5. Add haptic-like press animation to product cards & buttons via CSS class
    document.addEventListener('touchstart', e => {
      const card = e.target.closest('.product-card, .cat-card');
      if (card) card.style.transform = 'scale(0.97)';
    }, { passive: true });
    document.addEventListener('touchend', e => {
      const card = e.target.closest('.product-card, .cat-card');
      if (card) setTimeout(() => card.style.transform = '', 120);
    }, { passive: true });

    // ════ MENU DRAWER ════
    function openMenuDrawer() {
      document.getElementById('menu-drawer').classList.add('open');
      document.getElementById('menu-overlay').classList.add('open');
      document.body.style.overflow = 'hidden';
      // Sync user info into drawer
      if (typeof lucide !== 'undefined') lucide.createIcons();
      updateMenuDrawerUser();
      updateMenuThemeLabel();
      // Sync badge counts
      const cartBadge = document.getElementById('cart-count');
      const wishBadge = document.getElementById('wish-count');
      const mCart = document.getElementById('menu-cart-count');
      const mWish = document.getElementById('menu-wish-count');
      if (mCart && cartBadge) mCart.textContent = cartBadge.textContent;
      if (mWish && wishBadge) mWish.textContent = wishBadge.textContent;
    }

    function closeMenuDrawer() {
      document.getElementById('menu-drawer').classList.remove('open');
      document.getElementById('menu-overlay').classList.remove('open');
      document.body.style.overflow = '';
    }

    function updateMenuDrawerUser() {
      const nameEl   = document.getElementById('menu-drawer-username');
      const emailEl  = document.getElementById('menu-drawer-useremail');
      const avatarEl = document.getElementById('menu-drawer-avatar');
      const logoutBtn = document.getElementById('menu-logout-btn');
      if (currentUser) {
        const name = currentUser.firstName || currentUser.email?.split('@')[0] || 'User';
        if (nameEl)   nameEl.textContent  = currentUser.fname + ' ' + (currentUser.lname || '');
        if (emailEl)  emailEl.textContent = currentUser.email || '';
        if (avatarEl) avatarEl.textContent = currentUser.fname.charAt(0).toUpperCase();
        if (logoutBtn) logoutBtn.style.display = 'flex';
      } else {
        if (nameEl)   nameEl.textContent  = 'Guest';
        if (emailEl)  emailEl.textContent = 'Sign in to your account';
        if (avatarEl) avatarEl.textContent = '?';
        if (logoutBtn) logoutBtn.style.display = 'none';
      }
    }

    function updateMenuThemeLabel() {
      const isDark = document.body.classList.contains('light-mode');
      const lbl  = document.getElementById('menu-theme-label');
      const icon = document.getElementById('menu-theme-icon');
      if (lbl)  lbl.textContent = isDark ? 'Light Mode' : 'Dark Mode';
      if (icon) icon.innerHTML  = isDark
        ? '<i data-lucide="sun" style="width:18px;height:18px"></i>'
        : '<i data-lucide="moon" style="width:18px;height:18px"></i>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Close drawer on back-swipe when open
    (function() {
      let sx = 0, sy = 0;
      document.addEventListener('touchstart', e => {
        sx = e.touches[0].clientX; sy = e.touches[0].clientY;
      }, { passive: true });
      document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = Math.abs(e.changedTouches[0].clientY - sy);
        const drawer = document.getElementById('menu-drawer');
        if (drawer && drawer.classList.contains('open') && dx > 60 && dy < 60) {
          closeMenuDrawer();
        }
      }, { passive: true });
    })();