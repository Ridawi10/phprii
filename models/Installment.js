// ===== موديل الأقساط =====
const mongoose = require('mongoose');

const InstallmentSchema = new mongoose.Schema({
  // كل قسط مرتبط بمستخدم (الأدمن الذي أضافه) وبعميل
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // بيانات العميل
  clientName:  { type: String, required: true, trim: true },
  clientPhone: { type: String, default: '' },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // إذا كان العميل مسجلاً في النظام
  },

  // بيانات القسط
  totalAmount:   { type: Number, required: true, min: 0 },
  monthlyAmount: { type: Number, required: true, min: 0 },
  months:        { type: Number, required: true, min: 1 },
  paidAmount:    { type: Number, default: 0, min: 0 },

  status: {
    type: String,
    enum: ['active', 'paid', 'cancelled'],
    default: 'active',
    index: true,
  },

  note: { type: String, default: '' },

}, { timestamps: true });

// حساب المتبقي تلقائياً
InstallmentSchema.virtual('remainingAmount').get(function () {
  return this.totalAmount - this.paidAmount;
});

InstallmentSchema.virtual('progressPercent').get(function () {
  if (!this.totalAmount) return 0;
  return Math.min(100, Math.round((this.paidAmount / this.totalAmount) * 100));
});

InstallmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Installment', InstallmentSchema);
