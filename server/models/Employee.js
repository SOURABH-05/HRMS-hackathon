import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  role: { type: String, required: true, index: true },
  joinDate: { type: Date, required: true, index: true },
  documents: [{ type: String }], // URLs or filenames
  profile: { type: String },
  performance: [
    {
      period: String,
      rating: Number,
      notes: String,
      date: Date,
    },
  ],
  payroll: {
    basePay: Number,
    allowances: Number,
    tax: Number,
    netPay: Number,
  },
  attendance: [
    {
      clockIn: Date,
      clockOut: Date,
    },
  ],
  leave: [
    {
      type: mongoose.Schema.Types.Mixed,
      default: {
        type: undefined,
        from: undefined,
        to: undefined,
        status: 'applied',
        notes: undefined,
      },
    },
  ],
});

export default mongoose.model('Employee', employeeSchema);
