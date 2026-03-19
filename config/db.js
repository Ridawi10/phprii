// ===== اتصال MongoDB =====
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB متصل: ${conn.connection.host}`);

    // إنشاء حساب الأدمن تلقائياً عند أول تشغيل
    await createDefaultAdmin();

  } catch (error) {
    console.error(`❌ فشل الاتصال بـ MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// إنشاء الأدمن الافتراضي إذا ما كان موجود
async function createDefaultAdmin() {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) return;

    const hashedPass = await bcrypt.hash(
      process.env.ADMIN_DEFAULT_PASS || 'admin123', 10
    );

    await User.create({
      name: 'المدير',
      email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@aqsat.com',
      password: hashedPass,
      role: 'admin',
      status: 'approved',
    });

    console.log('✅ تم إنشاء حساب الأدمن الافتراضي');
    console.log(`   📧 الإيميل: ${process.env.ADMIN_DEFAULT_EMAIL || 'admin@aqsat.com'}`);
    console.log(`   🔑 كلمة المرور: ${process.env.ADMIN_DEFAULT_PASS || 'admin123'}`);
    console.log('   ⚠️  غيّر كلمة المرور بعد أول دخول!');

  } catch (e) {
    // الأدمن موجود مسبقاً
  }
}

module.exports = connectDB;
