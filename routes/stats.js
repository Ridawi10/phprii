// ===== Routes: السجلات والإحصائيات =====
const express     = require('express');
const router      = express.Router();
const Log         = require('../models/Log');
const Installment = require('../models/Installment');
const Payment     = require('../models/Payment');
const User        = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

// ─────────────────────────────────────────
// GET /api/logs — السجلات
// ─────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'admin') {
      if (req.query.userId) filter.userId = req.query.userId;
    } else {
      filter.userId = req.user._id;
    }
    if (req.query.type) filter.type = req.query.type;

    const logs = await Log.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data: logs });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// GET /api/stats — إحصائيات لوحة التحكم
// ─────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.query.userId
      ? req.query.userId
      : req.user.role === 'client'
        ? req.user._id
        : null; // أدمن بدون فلتر = كل البيانات

    const instFilter    = userId ? { userId } : {};
    const paymentFilter = userId ? { userId } : {};

    const [installments, payments, pendingUsers] = await Promise.all([
      Installment.find(instFilter),
      Payment.find(paymentFilter),
      req.user.role === 'admin' ? User.countDocuments({ status: 'pending' }) : 0,
    ]);

    const active        = installments.filter(i => i.status === 'active');
    const paid          = installments.filter(i => i.status === 'paid');
    const totalRevenue  = payments.reduce((s, p) => s + p.amount, 0);
    const totalExpected = installments.reduce((s, i) => s + i.totalAmount, 0);
    const clients       = new Set(installments.map(i => i.clientPhone || i.clientName)).size;

    // المتأخرون +29 يوم
    const now = Date.now();
    let overdueCount = 0;
    for (const inst of active) {
      const lastPay = await Payment.findOne(
        { installmentId: inst._id },
        {},
        { sort: { paidAt: -1 } }
      );
      const lastDate = lastPay ? lastPay.paidAt : inst.createdAt;
      const days = Math.floor((now - new Date(lastDate)) / (1000 * 60 * 60 * 24));
      if (days >= 29) overdueCount++;
    }

    res.json({
      success: true,
      data: {
        clients,
        activeInstallments:  active.length,
        paidInstallments:    paid.length,
        totalInstallments:   installments.length,
        totalRevenue,
        totalExpected,
        totalRemaining:      totalExpected - totalRevenue,
        overdueCount,
        pendingUsers,       // للأدمن فقط
      }
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
