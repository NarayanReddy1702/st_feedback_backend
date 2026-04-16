require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedAdmin = async () => {
  await connectDB();
  const exists = await User.findOne({ email: 'admin@feedback.com' });
  if (exists) {
    console.log('Admin already exists');
    process.exit();
  }
  await User.create({
    name: 'Super Admin',
    email: 'admin@feedback.com',
    password: 'admin@123!',
    role: 'admin',
    isApproved: true
  });
  console.log('✅ Admin created: admin@feedback.com / admin@123!');
  process.exit();
};

seedAdmin();