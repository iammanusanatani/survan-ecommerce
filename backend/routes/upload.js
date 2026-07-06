const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');

// Cloudinary config
const CLOUD_NAME = 'dd9xoa71s'; // ← apna cloud name
const UPLOAD_PRESET = 'survan_products';

router.get('/signature', authMiddleware, isAdmin, (req, res) => {
  res.json({ cloudName: CLOUD_NAME, uploadPreset: UPLOAD_PRESET });
});

module.exports = router;