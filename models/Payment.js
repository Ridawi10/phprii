// ===== موديل التسديدات =====
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  installmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Installment',
    required: true,
    index: true,
  },
  clientName:  { type: String, required: true },
  clientPhone: { type: String, default: '' },
  amount:      { type: Number, required: true, min: 0 },
  note:        { type: String, default: '' },
  paidAt:      { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
