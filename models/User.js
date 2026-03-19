// ===== موديل المستخدمين =====
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    trim: true,
    maxlength: [100, 'الاسم طويل جداً'],
  },
  email: {
    type: String,
    required: [true, 'الإيميل مطلوب'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'إيميل غير صحيح'],
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: 6,
    select: false, // لا تُرجع كلمة المرور في الاستعلامات
  },
  phone: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['admin', 'client'],
    default: 'client',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  accountType: {
    type: String,
    enum: ['basic', 'premium', 'vip'],
    default: 'basic',
  },
  expireDate: {
    type: Date,
    default: null,
  },
  note: {
    type: String,
    default: '',
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true, // createdAt و updatedAt تلقائياً
});

// عند حذف مستخدم → احذف كل بياناته
UserSchema.pre('deleteOne', { document: true }, async function () {
  await mongoose.model('Installment').deleteMany({ userId: this._id });
  await mongoose.model('Payment').deleteMany({ userId: this._id });
  await mongoose.model('Log').deleteMany({ userId: this._id });
});

module.exports = mongoose.model('User', UserSchema);
