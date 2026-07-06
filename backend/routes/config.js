const router = require('express').Router();

// Public, read-only site config. Currently just the WhatsApp business number
// used by the "message us about your order" popup — this used to live only
// in the admin's own browser localStorage, so real customers never saw it.
router.get('/', (req, res) => {
  res.json({
    whatsappNumber: process.env.WHATSAPP_NUMBER || ''
  });
});

module.exports = router;
