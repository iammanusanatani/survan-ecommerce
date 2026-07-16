// ════ SEARCH ════
    function openSearch() {
      document.getElementById('search-overlay').classList.add('open');
      setTimeout(() => document.getElementById('search-input').focus(), 100);
    }
    function closeSearch() {
      document.getElementById('search-overlay').classList.remove('open');
      document.getElementById('search-input').value = '';
      document.getElementById('search-results').innerHTML = '';
    }
    document.getElementById('search-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeSearch();
    });
    function liveSearch(q) {
      const el = document.getElementById('search-results');
      if (!q.trim()) { el.innerHTML = ''; return; }
      const res = PRODUCTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.cat.toLowerCase().includes(q.toLowerCase()));
      if (!res.length) { el.innerHTML = '<div style="padding:1.5rem;color:var(--gray);font-family:var(--fd);font-size:1.1rem;text-align:center">No results for "' + q + '"</div>'; return; }
      el.innerHTML = res.slice(0, 6).map(p => `
    <div class="search-result-item" onclick="openDetail(${p.id},'shop');closeSearch()">
      <div style="width:40px;height:40px;border-radius:4px;overflow:hidden;flex-shrink:0"><img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.textContent='${p.emoji}'"></div>
      <div>
        <div style="font-family:var(--fd);font-weight:700;font-size:1rem;text-transform:uppercase">${p.name}</div>
        <div style="font-size:.78rem;color:var(--gray)">${p.cat} · Rs.${p.price.toLocaleString()}</div>
      </div>
      <span style="margin-left:auto;color:var(--neon);font-family:var(--fd);font-size:1rem;font-weight:900">Rs.${p.price.toLocaleString()}</span>
    </div>`).join('');
    }

    // ════ CARD SLIDER ════
    let cardSliderState = {};
    function cardSlide(pid, dir, e) {
      e && e.stopPropagation();
      const p = PRODUCTS.find(x => String(x.id) === String(pid));
      if (!p || !p.imgs) return;
      let idx = cardSliderState[pid] || 0;
      idx = (idx + dir + p.imgs.length) % p.imgs.length;
      cardSliderState[pid] = idx;
      const track = document.getElementById('cst-' + pid);
      if (track) track.style.transform = `translateX(-${idx * 100}%)`;
      document.querySelectorAll(`.cdot-${pid}`).forEach((d, i) => {
        d.style.background = i === idx ? 'var(--neon)' : 'rgba(255,255,255,.5)';
        d.style.width = i === idx ? '18px' : '6px';
      });
    }
    function cardDotSlide(pid, idx, e) {
      e && e.stopPropagation();
      const p = PRODUCTS.find(x => String(x.id) === String(pid));
      if (!p) return;
      cardSliderState[pid] = idx;
      const track = document.getElementById('cst-' + pid);
      if (track) track.style.transform = `translateX(-${idx * 100}%)`;
      document.querySelectorAll(`.cdot-${pid}`).forEach((d, i) => {
        d.style.background = i === idx ? 'var(--neon)' : 'rgba(255,255,255,.5)';
        d.style.width = i === idx ? '18px' : '6px';
      });
    }

    // ════ PRODUCTS ════
    // Grid "Add to Cart" has no size picker of its own — for products that
    // actually have a size choice, jump to the detail page so they can pick
    // one, instead of silently defaulting or failing with just a toast.
    function quickAdd(id, from) {
      const p = PRODUCTS.find(x => String(x.id) === String(id));
      if (p && p.sizes && p.sizes.length > 1) {
        showToast('Please select a size');
        openDetail(id, from);
        return;
      }
      addToCart(id);
    }

    function productCard(p, from = 'shop') {
      const pid = String(p.id);
      const inWish = wishlist.map(String).includes(pid);
      const imgs = p.imgs || [p.img];
      const soldOut = Number(p.stock) === 0;
      return `<div class="product-card" style="cursor:pointer">
    <div class="pimg-wrap" style="position:relative;overflow:hidden" onclick="openDetail('${pid}','${from}')">
      <!-- SLIDER TRACK -->
      <div id="cst-${pid}" style="display:flex;width:100%;height:100%;transition:transform .35s cubic-bezier(.4,0,.2,1)">
        ${imgs.map(src => `<div style="min-width:100%;height:100%;flex-shrink:0"><img src="${src}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;${soldOut ? 'opacity:.45' : ''}"></div>`).join('')}
      </div>
      ${soldOut ? `<div style="position:absolute;top:8px;left:8px;background:#000;color:#fff;font-size:.7rem;font-weight:900;letter-spacing:.05em;padding:.25rem .6rem;border-radius:3px;z-index:4;text-transform:uppercase">Sold Out</div>` : ''}
      <!-- PREV / NEXT ARROWS -->
      <button onclick="event.stopPropagation();cardSlide('${pid}',-1,event)" style="position:absolute;left:6px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.55);border:none;color:#fff;width:28px;height:28px;border-radius:50%;font-size:.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;z-index:3" class="cslide-btn-${pid}">‹</button>
      <button onclick="event.stopPropagation();cardSlide('${pid}',1,event)" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.55);border:none;color:#fff;width:28px;height:28px;border-radius:50%;font-size:.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;z-index:3" class="cslide-btn-${pid}">›</button>
      <!-- DOTS -->
      <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:4px;align-items:center;z-index:3">
        ${imgs.map((_, i) => `<span class="cdot-${pid}" onclick="event.stopPropagation();cardDotSlide('${pid}',${i},event)" style="display:inline-block;height:6px;width:${i === 0 ? '18px' : '6px'};border-radius:3px;background:${i === 0 ? 'var(--neon)' : 'rgba(255,255,255,.5)'};cursor:pointer;transition:all .25s"></span>`).join('')}
      </div>
      <!-- IMAGE COUNT BADGE -->
      <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.6);color:#fff;font-size:.65rem;padding:2px 6px;border-radius:3px;letter-spacing:.05em;z-index:3">${imgs.length} imgs</div>
      <div class="product-overlay">
        ${soldOut
          ? `<button class="quick-add" disabled style="opacity:.5;cursor:not-allowed">Sold Out</button>`
          : `<button class="quick-add" onclick="event.stopPropagation();quickAdd('${pid}','${from}')">Add to Cart</button>`}
        <button class="quick-wish ${inWish ? 'wishlisted' : ''}" onclick="event.stopPropagation();toggleWish('${pid}',this)" title="Wishlist">${inWish ? `<i data-lucide="heart" style="width:16px;height:16px;fill:currentColor"></i>` : `<i data-lucide="heart" style="width:16px;height:16px"></i>`}</button>
      </div>
    </div>
    <div class="product-info" onclick="openDetail('${pid}','${from}')">
      <div class="product-tag">${p.tag}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price-row">
        <span class="product-price">Rs.${p.price.toLocaleString()}</span>
        ${p.old ? `<span class="product-price-old">Rs.${p.old.toLocaleString()}</span>` : ''}
        <span class="${p.badge === 'new' ? 'badge-new' : 'badge-sale'}">${p.badge === 'new' ? 'New' : 'Sale'}</span>
      </div>
      <div class="size-pills">${p.sizes.map(s => `<span class="size-pill">${s}</span>`).join('')}</div>
      <div style="margin-top:.6rem;font-size:.75rem;color:var(--gray)">${'★'.repeat(Math.floor(p.rating))} ${p.rating} (${p.reviews})</div>
    </div>
  </div>`;
    }

    // Show/hide arrows on card hover
    document.addEventListener('mouseover', function (e) {
      const card = e.target.closest('.product-card');
      if (!card) return;
      card.querySelectorAll('[class^="cslide-btn-"]').forEach(b => b.style.opacity = '1');
    });
    document.addEventListener('mouseout', function (e) {
      const card = e.target.closest('.product-card');
      if (!card) return;
      if (!card.contains(e.relatedTarget)) {
        card.querySelectorAll('[class^="cslide-btn-"]').forEach(b => b.style.opacity = '0');
      }
    });

    // Touch swipe for product cards
    let _cTouchData = {};
    document.addEventListener('touchstart', function (e) {
      const wrap = e.target.closest('.pimg-wrap');
      if (!wrap) return;
      const card = wrap.closest('.product-card');
      if (!card) return;
      const pid = wrap.querySelector('[id^="cst-"]')?.id?.replace('cst-', '');
      if (!pid) return;
      _cTouchData[pid] = e.touches[0].clientX;
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      const wrap = e.target.closest('.pimg-wrap');
      if (!wrap) return;
      const pid = wrap.querySelector('[id^="cst-"]')?.id?.replace('cst-', '');
      if (!pid || _cTouchData[pid] === undefined) return;
      const dx = e.changedTouches[0].clientX - _cTouchData[pid];
      delete _cTouchData[pid];
      if (Math.abs(dx) > 35) cardSlide(String(pid), dx < 0 ? 1 : -1, null);
    }, { passive: true });

    // Placeholder cards shown immediately, before the real catalog has
    // loaded — keeps the grid from sitting empty during a slow/cold-start
    // backend fetch. Swapped out by renderHomeProducts()/renderShopProducts()
    // once real data arrives.
    function skeletonCard() {
      return `<div class="skeleton-card">
    <div class="skeleton-img"></div>
    <div class="skeleton-line w-60"></div>
    <div class="skeleton-line w-40"></div>
  </div>`;
    }
    function renderProductSkeletons(containerId, count = 4) {
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = Array(count).fill(skeletonCard()).join('');
    }

    function renderHomeProducts() {
      document.getElementById('home-featured').innerHTML = PRODUCTS.slice(0, 4).map(p => productCard(p, 'home')).join('');
    }

    function renderCats() {
      document.getElementById('cat-grid').innerHTML = CATS.map(c => `
    <div class="cat-card" onclick="filterAndGoShop('${c.name}')">
      <div class="cat-icon">${c.emoji}</div>
      <div class="cat-name">${c.name === 'Oversized' ? 'Oversized Tees' : c.name === 'Shorts' ? 'Shorts & Joggers' : c.name + 's'}</div>
      <div class="cat-count">${c.count} Styles →</div>
    </div>`).join('');
    }

    function getSortedFiltered() {
      // Kept for any other caller expecting the old full in-memory behavior
      // (e.g. if backend is unreachable, renderShopProducts falls back to this).
      let list = currentFilter === 'All' ? [...PRODUCTS] : PRODUCTS.filter(p => p.cat === currentFilter);
      if (currentShopSearch) {
        const q = currentShopSearch.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q));
      }
      if (currentSort === 'low') list.sort((a, b) => a.price - b.price);
      else if (currentSort === 'high') list.sort((a, b) => b.price - a.price);
      else if (currentSort === 'new') list.sort((a, b) => b.id - a.id);
      return list;
    }

    let currentShopSearch = '';
    let shopSearchDebounce = null;
    function onShopSearchInput(val) {
      clearTimeout(shopSearchDebounce);
      shopSearchDebounce = setTimeout(() => {
        currentShopSearch = val.trim();
        currentShopPage = 1;
        renderShopProducts();
      }, 300);
    }

    // Shop grid is backend-driven (search + category + sort + pagination) so
    // it stays fast and scales as the real product catalog grows — instead
    // of always filtering the entire in-memory PRODUCTS array on the client.
    // The small built-in demo catalog is merged in on page 1 for continuity.
    async function renderShopProducts() {
      const el = document.getElementById('shop-products');
      const paginEl = document.getElementById('shop-pagination');
      try {
        const params = new URLSearchParams();
        if (currentFilter !== 'All') params.set('category', currentFilter);
        if (currentSort === 'low') params.set('sort', 'price_asc');
        else if (currentSort === 'high') params.set('sort', 'price_desc');
        else if (currentSort === 'new') params.set('sort', 'newest');
        if (currentShopSearch) params.set('q', currentShopSearch);
        params.set('page', currentShopPage);
        params.set('limit', SHOP_PAGE_SIZE);

        const res = await fetch(`${API}/products?${params.toString()}`);
        if (!res.ok) throw new Error('bad response');
        const data = await res.json();
        const backendItems = (data.products || []).map(mapBackendProduct);

        let demoItems = [];
        if (currentShopPage === 1) {
          demoItems = DEFAULT_PRODUCTS.filter(p =>
            (currentFilter === 'All' || p.cat === currentFilter) &&
            (!currentShopSearch || p.name.toLowerCase().includes(currentShopSearch.toLowerCase()) || p.cat.toLowerCase().includes(currentShopSearch.toLowerCase()))
          );
          if (currentSort === 'low') demoItems.sort((a, b) => a.price - b.price);
          else if (currentSort === 'high') demoItems.sort((a, b) => b.price - a.price);
        }

        const combined = [...backendItems, ...demoItems];
        el.innerHTML = combined.length
          ? combined.map(p => productCard(p, 'shop')).join('')
          : `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--gray);font-family:var(--fd)">No products found</div>`;

        renderShopPagination(data.totalPages || 1, data.page || 1);
        if (window.lucide) lucide.createIcons();
      } catch (e) {
        console.log('Shop products fetch error, falling back to local list:', e);
        const list = getSortedFiltered();
        el.innerHTML = list.map(p => productCard(p, 'shop')).join('');
        if (paginEl) paginEl.innerHTML = '';
        if (window.lucide) lucide.createIcons();
      }
    }

    function renderShopPagination(totalPages, page) {
      const el = document.getElementById('shop-pagination');
      if (!el) return;
      if (totalPages <= 1) { el.innerHTML = ''; return; }
      let html = '';
      html += `<button class="filter-btn" ${page <= 1 ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''} onclick="goShopPage(${page - 1})">‹ Prev</button>`;
      const maxButtons = 5;
      let start = Math.max(1, page - Math.floor(maxButtons / 2));
      let end = Math.min(totalPages, start + maxButtons - 1);
      start = Math.max(1, end - maxButtons + 1);
      for (let i = start; i <= end; i++) {
        html += `<button class="filter-btn ${i === page ? 'active' : ''}" onclick="goShopPage(${i})">${i}</button>`;
      }
      html += `<button class="filter-btn" ${page >= totalPages ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''} onclick="goShopPage(${page + 1})">Next ›</button>`;
      el.innerHTML = html;
    }

    function goShopPage(p) {
      if (p < 1) return;
      currentShopPage = p;
      renderShopProducts();
      document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function filterProducts(cat, btn) {
      currentFilter = cat;
      currentShopPage = 1;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderShopProducts();
    }

    function sortProducts(val) {
      currentSort = val;
      currentShopPage = 1;
      renderShopProducts();
    }

    function filterAndGoShop(cat) {
      currentFilter = cat;
      currentShopPage = 1;
      currentShopSearch = '';
      const searchInput = document.getElementById('shop-search-input');
      if (searchInput) searchInput.value = '';
      showPage('shop');
      renderShopProducts();
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        if (b.textContent.toLowerCase() === cat.toLowerCase() || (cat === 'Cap' && b.textContent === 'Caps')) b.classList.add('active');
      });
    }

    // ════ PRODUCT DETAIL ════
    function openDetail(id, from = 'shop') {
      const p = PRODUCTS.find(x => String(x.id) === String(id));
      detailFrom = from;
      detailSelected = {};
      const inWish = wishlist.map(String).includes(String(p.id));
      const discount = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
      const soldOut = Number(p.stock) === 0;
      document.getElementById('detail-content').innerHTML = `
    <div>
      <!-- MAIN SLIDER -->
      <div style="position:relative;background:var(--dark2);border:1px solid #1a1a1a;border-radius:4px;overflow:hidden;aspect-ratio:3/4" id="detail-slider-wrap">
        <div id="detail-slider-track" style="display:flex;height:100%;transition:transform .38s cubic-bezier(.4,0,.2,1)">
          ${p.imgs.map((src, i) => `<div style="min-width:100%;height:100%;flex-shrink:0"><img src="${src}" alt="${p.name} view ${i + 1}" style="width:100%;height:100%;object-fit:cover;display:block" loading="${i === 0 ? 'eager' : 'lazy'}"></div>`).join('')}
        </div>
        <!-- PREV ARROW -->
        <button id="detail-prev" onclick="detailSlide(-1)" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.65);border:none;color:#fff;width:38px;height:38px;border-radius:50%;font-size:1.3rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:5;transition:background .2s" onmouseover="this.style.background='rgba(200,255,0,.85)';this.style.color='#000'" onmouseout="this.style.background='rgba(0,0,0,.65)';this.style.color='#fff'">‹</button>
        <!-- NEXT ARROW -->
        <button id="detail-next" onclick="detailSlide(1)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.65);border:none;color:#fff;width:38px;height:38px;border-radius:50%;font-size:1.3rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:5;transition:background .2s" onmouseover="this.style.background='rgba(200,255,0,.85)';this.style.color='#000'" onmouseout="this.style.background='rgba(0,0,0,.65)';this.style.color='#fff'">›</button>
        <!-- IMAGE COUNTER -->
        <div id="detail-counter" style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,.65);color:#fff;font-size:.75rem;padding:3px 9px;border-radius:12px;letter-spacing:.05em;z-index:5;font-family:var(--fb)">1 / ${p.imgs.length}</div>
        <!-- DOTS -->
        <div style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:5px;align-items:center;z-index:5" id="detail-dots">
          ${p.imgs.map((_, i) => `<span class="det-dot" onclick="detailGoTo(${i})" style="display:inline-block;height:7px;width:${i === 0 ? '22px' : '7px'};border-radius:4px;background:${i === 0 ? 'var(--neon)' : 'rgba(255,255,255,.5)'};cursor:pointer;transition:all .25s"></span>`).join('')}
        </div>
      </div>
      <!-- THUMBNAILS STRIP (like Flipkart left rail — shown as bottom strip on mobile) -->
      <div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin;scrollbar-color:var(--dark3) transparent" id="detail-thumbs">
        ${p.imgs.map((src, i) => `<div class="det-thumb" id="dt-${i}" onclick="detailGoTo(${i})" style="flex-shrink:0;width:px;height:64px;border-radius:4px;overflow:hidden;cursor:pointer;border:2px solid ${i === 0 ? 'var(--neon)' : '#2a2a2a'};transition:border-color .2s"><img src="${src}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" loading="lazy"></div>`).join('')}
      </div>
    </div>
    <div class="detail-info">
      <div class="detail-tag">${p.tag} ${p.cat}</div>
      <h1 class="detail-name">${p.name}</h1>
      <div class="detail-price-row">
        <span class="detail-price">Rs.${p.price.toLocaleString()}</span>
        ${p.old ? `<span class="detail-old">Rs.${p.old.toLocaleString()}</span><span class="badge-sale">${discount}% OFF</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:1.5rem">
        <span class="rating-stars">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}</span>
        <span style="font-size:.85rem;color:var(--gray)">${p.rating} · ${p.reviews} reviews</span>
      </div>
      <p class="detail-desc">${p.desc}</p>
      <div class="size-label">Select Size <span style="color:var(--neon);cursor:pointer;text-decoration:underline;font-size:.72rem" onclick="showToast('Size guide: XS=34, S=36, M=38, L=40, XL=42, XXL=44')">Size Guide →</span></div>
      <div class="size-options" id="detail-sizes">
        ${p.sizes.map(s => `<button class="size-opt" onclick="selectSize('${s}',this)">${s}</button>`).join('')}
      </div>
      <div class="detail-actions">
        <button class="btn-primary" ${soldOut ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''} onclick="${soldOut ? '' : `addToCartFromDetail('${p.id}')`}">${soldOut ? 'Sold Out' : 'Add to Cart'}</button>
        <button class="wish-btn ${inWish ? 'active' : ''}" id="detail-wish" onclick="toggleWishDetail('${p.id}')">${inWish ? `<i data-lucide="heart" style="width:16px;height:16px;fill:currentColor"></i>` : `<i data-lucide="heart" style="width:16px;height:16px"></i>`}</button>
        <button class="btn-outline" style="width:100%" ${soldOut ? 'disabled style="opacity:.5;cursor:not-allowed;width:100%"' : ''} onclick="${soldOut ? '' : `buyNowFromDetail('${p.id}')`}">${soldOut ? 'Sold Out' : 'Buy Now →'}</button>
      </div>
      <div class="detail-meta">
        <div class="detail-meta-row"><span>Category</span>${p.cat}</div>
        <div class="detail-meta-row"><span>Delivery</span>2–5 Business Days</div>
        <div class="detail-meta-row"><span>Returns</span>7-Day Easy Returns</div>
        <div class="detail-meta-row"><span>Payment</span>COD · Card · Easypaisa · JazzCash</div>
        <div class="detail-meta-row"><span>In Stock</span>${soldOut ? `<span style="color:#ef4444">● Out of Stock</span>` : `<span style="color:var(--neon)">● Available</span>`}</div>
      </div>
    </div>

    <!-- REVIEWS SECTION -->
    <div style="margin-top:2.5rem;padding:0 2rem 2rem">
      <div style="font-family:var(--fd);font-size:1.4rem;font-weight:900;text-transform:uppercase;margin-bottom:1.2rem;border-top:1px solid var(--dark3);padding-top:1.5rem"><i data-lucide="star" style="width:18px;height:18px;vertical-align:middle;margin-right:6px"></i>Customer Reviews</div>
      <div id="product-reviews-list">
        <div class="loader" style="color:var(--gray);text-align:center;padding:1.5rem">Loading reviews...</div>
      </div>
    </div>`;

      showPage('detail');
      setTimeout(() => initDetailSliderTouch(), 50);
      // Load reviews for this product
      loadProductReviews(p.id);
    }

    // ════ DETAIL SLIDER ════
    let detailSliderIdx = 0;
    let detailSliderTotal = 0;
    let _dTouchX = null;

    function detailGoTo(idx) {
      const track = document.getElementById('detail-slider-track');
      const counter = document.getElementById('detail-counter');
      if (!track) return;
      const total = track.children.length;
      detailSliderIdx = (idx + total) % total;
      detailSliderTotal = total;
      track.style.transform = `translateX(-${detailSliderIdx * 100}%)`;
      if (counter) counter.textContent = (detailSliderIdx + 1) + ' / ' + total;
      // Update dots
      document.querySelectorAll('.det-dot').forEach((d, i) => {
        d.style.background = i === detailSliderIdx ? 'var(--neon)' : 'rgba(255,255,255,.5)';
        d.style.width = i === detailSliderIdx ? '22px' : '7px';
      });
      // Update thumbnails
      document.querySelectorAll('[id^="dt-"]').forEach((t, i) => {
        t.style.borderColor = i === detailSliderIdx ? 'var(--neon)' : '#2a2a2a';
        if (i === detailSliderIdx) t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    }

    function detailSlide(dir) {
      detailGoTo(detailSliderIdx + dir);
    }

    function initDetailSliderTouch() {
      const wrap = document.getElementById('detail-slider-wrap');
      if (!wrap) return;
      wrap.addEventListener('touchstart', e => { _dTouchX = e.touches[0].clientX; }, { passive: true });
      wrap.addEventListener('touchend', e => {
        if (_dTouchX === null) return;
        const dx = e.changedTouches[0].clientX - _dTouchX;
        _dTouchX = null;
        if (Math.abs(dx) > 40) detailSlide(dx < 0 ? 1 : -1);
      }, { passive: true });
    }

    function selectSize(s, btn) {
      document.querySelectorAll('.size-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      detailSelected.size = s;
    }

    function addToCartFromDetail(id) {
      addToCart(id, detailSelected.size);
    }

    // "Checkout Now" — same size validation as Add to Cart (addToCart
    // returns false and shows its own toast if a size is required but
    // missing), and only proceeds to checkout if the item actually got in.
    // function buyNowFromDetail(id) {
    //   const added = addToCart(id, detailSelected.size);
    //   if (added) showPage('');
    // }