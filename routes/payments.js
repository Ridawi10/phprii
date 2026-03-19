// ===== Routes: التسديدات =====
const express     = require('express');
const router      = express.Router();
const Payment     = require('../models/Payment');
const Installment = require('../models/Installment');
const Log         = require('../models/Log');
const { protect } = require('../middleware/auth');

router.use(protect);

// دالة مساعدة: تحديث المبلغ المسدد في القسط
async function syncInstallmentPaid(installmentId) {
  const payments = await Payment.find({ installmentId });
  const total    = payments.reduce((s, p) => s + p.amount, 0);
  const inst     = await Installment.findById(installmentId);
  if (!inst) return;
  inst.paidAmount = total;
  inst.status     = total >= inst.totalAmount ? 'paid' : 'active';
  await inst.save();
}

// ─────────────────────────────────────────
// GET /api/payments?installmentId=xxx
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'admin') {
      if (req.query.userId)        filter.userId        = req.query.userId;
      if (req.query.installmentId) filter.installmentId = req.query.installmentId;
    } else {
      filter.userId = req.user._id;
      if (req.query.installmentId) filter.installmentId = req.query.installmentId;
    }

    const payments = await Payment.find(filter).sort({ paidAt: -1 });
    res.json({ success: true, data: payments });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// POST /api/payments — إضافة تسديد
// ─────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { installmentId, amount, note, paidAt } = req.body;

    if (!installmentId || !amount)
      return res.status(400).json({ success: false, message: 'رقم القسط والمبلغ مطلوبان' });

    const inst = await Installment.findById(installmentId);
    if (!inst)
      return res.status(404).json({ success: false, message: 'القسط غير موجود' });

    if (req.user.role !== 'admin' && inst.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'غير مصرح' });

    const payment = await Payment.create({
      userId:        inst.userId,
      installmentId,
      clientName:    inst.clientName,
      clientPhone:   inst.clientPhone,
      amount:        Number(amount),
      note:          note || '',
      paidAt:        paidAt ? new Date(paidAt) : new Date(),
    });

    await syncInstallmentPaid(installmentId);

    await Log.create({
      userId:        inst.userId,
      type:          'payment',
      clientName:    inst.clientName,
      installmentId: inst._id,
      paymentId:     payment._id,
      amount:        Number(amount),
      note:          'تسديد قسط',
    });

    // أرجع القسط المحدث أيضاً
    const updatedInst = await Installment.findById(installmentId);

    res.status(201).json({
      success: true,
      data: payment,
      installment: updatedInst,
      message: 'تم حفظ التسديد',
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// PUT /api/payments/:id — تعديل تسديد
// ─────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment)
      return res.status(404).json({ success: false, message: 'التسديد غير موجود' });

    if (req.user.role !== 'admin' && payment.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'غير مصرح' });

    if (req.body.amount !== undefined) payment.amount = Number(req.body.amount);
    if (req.body.note   !== undefined) payment.note   = req.body.note;
    if (req.body.paidAt !== undefined) payment.paidAt = new Date(req.body.paidAt);

    await payment.save();
    await syncInstallmentPaid(payment.installmentId);

    await Log.create({
      userId:    payment.userId,
      type:      'payment_edit',
      clientName: payment.clientName,
      paymentId:  payment._id,
      amount:    payment.amount,
      note:      'تعديل تسديد',
    });

    res.json({ success: true, data: payment, message: 'تم تعديل التسديد' });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// DELETE /api/payments/:id — حذف تسديد
// ─────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment)
      return res.status(404).json({ success: false, message: 'التسديد غير موجود' });

    if (req.user.role !== 'admin' && payment.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'غير مصرح' });

    const instId = payment.installmentId;

    await Log.create({
      userId:    payment.userId,
      type:      'payment_delete',
      clientName: payment.clientName,
      paymentId:  payment._id,
      amount:    payment.amount,
      note:      'حذف تسديد',
    });

    await payment.deleteOne();
    await syncInstallmentPaid(instId);

    res.json({ success: true, message: 'تم حذف التسديد' });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
