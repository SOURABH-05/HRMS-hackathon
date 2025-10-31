import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const roles = ['Developer', 'Designer', 'Analyst', 'HR', 'Recruiter', 'Admin', 'QA'];
const fakeName = i => `User${i}`;
const fakeEmail = i => `user${i}@test.com`;
const fakeDate = () => new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Employee.deleteMany({});
  const list = Array.from({length:50}, (_,i) => ({
    name: fakeName(i+1),
    email: fakeEmail(i+1),
    role: roles[Math.floor(Math.random()*roles.length)],
    joinDate: fakeDate(),
    documents: [],
    profile: '',
    performance: [],
    payroll: { basePay: 50000, allowances: 5000, tax: 0, netPay: 0 },
    attendance: [],
    leave: []
  }));
  await Employee.insertMany(list);

  // Ensure a default admin user exists for login
  const adminEmail = 'admin@test.com';
  const exists = await User.findOne({ email: adminEmail });
  if (!exists) {
    const hashed = await bcrypt.hash('pass123', 10);
    await User.create({ name: 'Admin', email: adminEmail, password: hashed, role: 'admin' });
    console.log('Created default admin: admin@test.com / pass123');
  } else {
    console.log('Default admin already exists');
  }

  console.log('50 employees seeded');
  process.exit();
}

seed();
