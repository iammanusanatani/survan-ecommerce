# SURVAN Frontend

Restructured from a single 6,882-line `index.html` (all CSS/JS inline) into
the modular layout below. No behavior was changed — only reorganized.

```
frontend/
│
├── index.html
├── styles/
│   ├── main.css         Reset, CSS variables, dark mode, toast, page transitions
│   ├── navbar.css       Nav bar, mobile menu, search overlay
│   ├── hero.css         Hero banner + marquee
│   ├── products.css     Category grid, product cards, filters, product detail page
│   ├── cart.css         Cart, checkout, orders, tracking, wishlist page, success page
│   ├── auth.css         Login/signup modal, account page, addresses, profile
│   ├── admin.css        Admin dashboard, tables, admin login/setup
│   ├── footer.css       Newsletter + footer
│   └── responsive.css   All @media breakpoints (tablet/mobile)
│
├── js/
│   ├── api.js           Backend API base URL
│   ├── app.js           Product/category data, global state, page navigation, app init
│   ├── auth.js          Login/signup/account/addresses/security
│   ├── products.js      Search, product listing, filters, product detail
│   ├── cart.js          Cart + checkout logic
│   ├── wishlist.js      Wishlist
│   ├── coupons.js       Promo code apply (customer-facing)
│   ├── reviews.js       Product reviews (customer-facing)
│   ├── orders.js        Order placement, order history, tracking, returns/exchanges
│   ├── admin.js         Admin panel: products, coupons, returns, reviews, image upload
│   ├── payment.js       Razorpay payment flow
│   ├── theme.js         Dark/light theme toggle
│   └── utils.js         WhatsApp notification config, badges, newsletter, scroll-top
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── README.md
```

## Notes

- All product images currently come from Unsplash URLs, and icons from the
  Lucide CDN — nothing local yet, so `assets/` is empty. Drop real product
  photos into `assets/images/` and point new products at them when ready.
- Because these are plain (non-module) `<script>` tags, every file still
  shares one global scope, exactly like the original single `<script>`
  block — so load order in `index.html` matters. Keep `app.js` **last**,
  since it initializes the page and calls functions defined in the other
  files. `api.js` should stay **first**, since it defines the `API` base URL
  every other file uses.
- CSS files are linked in `index.html` in this order: `main → navbar → hero →
  products → cart → auth → admin → footer → responsive` (responsive last so
  its media queries can override the base styles).
- The backend (`/backend`) was not touched.
