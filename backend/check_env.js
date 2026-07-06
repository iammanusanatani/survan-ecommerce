require('dotenv').config();
const email = process.env.ADMIN_EMAIL;
const pass = process.env.ADMIN_PASS;
console.log('ADMIN_EMAIL:', JSON.stringify(email), '(length:', email?.length, ')');
console.log('ADMIN_PASS:', JSON.stringify(pass), '(length:', pass?.length, ')');