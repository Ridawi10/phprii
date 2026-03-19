// ===== Routes: الأقساط =====
const express      = require('express');
const router       = express.Router();
const Installment  = require('../models/Installment');
const Payment      = require('../models/Payment');
const Log          = require('../models/Log');
const { protect, adminOnly } = require('../middleware/auth');

// كل الـ routes تحتاج تسجيل دخول
router.use(protect);

// ─────────────────────────────────────────
// GET /api/installments — جلب الأقساط
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 100 } = req.query;
    const filter = {};

    // الأدمن يشوف كل الأقساط، العميل يشوف أقساطه فقط
    if (req.user.role === 'admin') {
      if (req.query.userId) filter.userId = req.query.userId;
    } else {
      filter.userId = req.user._id;
    }

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { clientPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const installments = await Installment.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Installment.countDocuments(filter);

    res.json({ success: true, data: installments, total });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// GET /api/installments/:id — قسط واحد
// ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const inst = await Installment.findById(req.params.id);
    if (!inst)
      return res.status(404).json({ success: false, message: 'القسط غير موجود' });

    if (req.user.role !== 'admin' && inst.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'غير مصرح' });

    res.json({ success: true, data: inst });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// POST /api/installments — إضافة قسط
// ─────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { clientName, clientPhone, totalAmount, monthlyAmount, months, note } = req.body;

    if (!clientName || !totalAmount || !months)
      return res.status(400).json({ success: false, message: 'بيانات ناقصة' });

    const inst = await Installment.create({
      userId: req.user._id,
      clientName, clientPhone,
      totalAmount, monthlyAmount: monthlyAmount || Math.ceil(totalAmount / months),
      months, note,
    });

    // سجّل العملية
    await Log.create({
      userId:        req.user._id,
      type:          'installment_add',
      clientName,
      installmentId: inst._id,
      amount:        totalAmount,
      note:          'إضافة قسط جديد',
    });

    res.status(201).json({ success: true, data: inst, message: 'تم إضافة القسط بنجاح' });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// PUT /api/installments/:id — تعديل قسط
// ─────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const inst = await Installment.findById(req.params.id);
    if (!inst)
      return res.status(404).json({ success: false, message: 'القسط غير موجود' });

    if (req.user.role !== 'admin' && inst.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'غير مصرح' });

    const allowed = ['clientName', 'clientPhone', 'totalAmount', 'monthlyAmount', 'months', 'note', 'status'];
    allowed.forEach(k => { if (req.body[k] !== undefined) inst[k] = req.body[k]; });

    await inst.save();

    res.json({ success: true, data: inst, message: 'تم تحديث القسط' });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// DELETE /api/installments/:id — حذف قسط
// ─────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const inst = await Installment.findById(req.params.id);
    if (!inst)
      return res.status(404).json({ success: false, message: 'القسط غير موجود' });

    if (req.user.role !== 'admin' && inst.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'غير مصرح' });

    // احذف التسديدات المرتبطة
    await Payment.deleteMany({ installmentId: inst._id });
    await inst.deleteOne();

    await Log.create({
      userId:    req.user._id,
      type:      'installment_delete',
      clientName: inst.clientName,
      amount:    inst.totalAmount,
      note:      'حذف قسط',
    });

    res.json({ success: true, message: 'تم حذف القسط وتسديداته' });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
