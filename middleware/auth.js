// ===== Middleware التوثيق =====
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

// حماية الـ routes - يتحقق من التوكن
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'غير مصرح — يرجى تسجيل الدخول' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ success: false, message: 'الحساب غير مفعّل' });
    }

    req.user = user;
    next();

  } catch (err) {
    return res.status(401).json({ success: false, message: 'توكن غير صحيح أو منتهي الصلاحية' });
  }
};

// للأدمن فقط
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'هذه الصلاحية للمدير فقط' });
  }
  next();
};

// توليد JWT
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};
