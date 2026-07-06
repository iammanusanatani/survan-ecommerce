require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const ADMIN_PASS = process.env.ADMIN_PASS?.trim();
const RESET = process.argv.includes('--reset');

if (!ADMIN_EMAIL || !ADMIN_PASS) {
  console.log("❌ ADMIN_EMAIL and ADMIN_PASS must be set in .env before running this script");
  process.exit(1);
}
if (ADMIN_PASS.length < 8) {
  console.log("❌ ADMIN_PASS in .env is too short. Use at least 8 characters, mixing letters/numbers/symbols.");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("✅ Connected");

  const exists = await User.findOne({ email: ADMIN_EMAIL });
  const hashed = await bcrypt.hash(ADMIN_PASS, 10);

  if (exists) {
    if (!RESET) {
      console.log("⚠️  Admin already exists for", ADMIN_EMAIL);
      console.log("   If you need to reset their password to match the current .env value, run:");
      console.log("   node createAdmin.js --reset");
      process.exit();
    }
    exists.password = hashed;
    exists.isAdmin = true;
    await exists.save();
    console.log("✅ Password reset for", ADMIN_EMAIL);
    process.exit();
  }

  await User.create({
    fname: "Admin",
    lname: "Survan",
    email: ADMIN_EMAIL,
    password: hashed,
    phone: "0300-0000000",
    isAdmin: true
  });

  console.log("✅ Admin user created for", ADMIN_EMAIL);
  console.log("   Log in once, then change this password immediately from Account > Change Password.");
  process.exit();
}).catch(err => {
  console.log("❌ Error:", err);
  process.exit(1);
});