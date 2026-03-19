// ===== Routes: التوثيق =====
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Log      = require('../models/Log');
const { protect, adminOnly, generateToken } = require('../middleware/auth');

// ─────────────────────────────────────────
// POST /api/auth/register — تسجيل حساب جديد
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'الاسم والإيميل وكلمة المرور مطلوبة' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(400).json({ success: false, message: 'الإيميل مسجل مسبقاً' });

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name, email: email.toLowerCase(),
      password: hashed, phone,
      role: 'client', status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'تم إرسال طلب التسجيل — انتظر موافقة المدير',
      data: { id: user._id, name: user.name, email: user.email, status: user.status }
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/login — تسجيل الدخول
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'الإيميل وكلمة المرور مطلوبان' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user)
      return res.status(401).json({ success: false, message: 'الإيميل أو كلمة المرور غير صحيحة' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'الإيميل أو كلمة المرور غير صحيحة' });

    if (user.status === 'pending')
      return res.status(403).json({ success: false, message: 'طلبك قيد المراجعة من المدير', status: 'pending' });

    if (user.status === 'rejected')
      return res.status(403).json({ success: false, message: 'تم رفض طلبك — تواصل مع المدير', status: 'rejected' });

    if (user.status === 'suspended')
      return res.status(403).json({ success: false, message: 'الحساب موقوف — تواصل مع المدير', status: 'suspended' });

    // تحديث آخر دخول
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id:          user._id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        status:      user.status,
        accountType: user.accountType,
        phone:       user.phone,
      }
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// GET /api/auth/me — بيانات المستخدم الحالي
// ─────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ─────────────────────────────────────────
// PUT /api/auth/change-password — تغيير كلمة المرور
// ─────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'يرجى إدخال كلمة المرور القديمة والجديدة' });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'كلمة المرور الجديدة يجب 6 أحرف على الأقل' });

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch)
      return res.status(400).json({ success: false, message: 'كلمة المرور القديمة غير صحيحة' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// ADMIN: GET /api/auth/users — كل المستخدمين
// ─────────────────────────────────────────
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const { status, role, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role)   filter.role   = role;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({ success: true, data: users, total, page: +page });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// ADMIN: PUT /api/auth/users/:id — تعديل مستخدم
// ─────────────────────────────────────────
router.put('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, accountType, expireDate, note, name, phone } = req.body;
    const updateData = {};

    if (status)      updateData.status      = status;
    if (accountType) updateData.accountType = accountType;
    if (expireDate !== undefined) updateData.expireDate = expireDate || null;
    if (note  !== undefined) updateData.note  = note;
    if (name)        updateData.name  = name;
    if (phone !== undefined) updateData.phone = phone;

    // عند الموافقة نسجّل من وافق ومتى
    if (status === 'approved') {
      updateData.approvedBy = req.user._id;
      updateData.approvedAt = new Date();
    }

    const user = await User.findByIdAndUpdate(
      req.params.id, updateData, { new: true }
    ).select('-password');

    if (!user)
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    res.json({ success: true, data: user, message: 'تم تحديث بيانات المستخدم' });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─────────────────────────────────────────
// ADMIN: DELETE /api/auth/users/:id — حذف مستخدم
// ─────────────────────────────────────────
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك الخاص' });

    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    await user.deleteOne();

    res.json({ success: true, message: `تم حذف المستخدم "${user.name}" وجميع بياناته` });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ADMIN: إعادة تعيين كلمة مرور مستخدم
router.put('/users/:id/reset-password', protect, adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'كلمة مرور يجب 6 أحرف على الأقل' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.params.id, { password: hashed });

    res.json({ success: true, message: 'تم إعادة تعيين كلمة المرور' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
