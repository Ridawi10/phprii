// ===== موديل السجلات =====
const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['installment_add', 'payment', 'payment_delete', 'payment_edit', 'client_add', 'installment_delete'],
    required: true,
  },
  clientName:    { type: String, default: '' },
  clientId:      { type: mongoose.Schema.Types.ObjectId, default: null },
  installmentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  paymentId:     { type: mongoose.Schema.Types.ObjectId, default: null },
  amount:        { type: Number, default: null },
  note:          { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Log', LogSchema);
