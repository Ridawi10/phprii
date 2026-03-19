// ===== السيرفر الرئيسي =====
require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const connectDB = require('./config/db');

const app = express();

// ─── اتصال قاعدة البيانات ───
connectDB();

// ─── Middleware ───
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/installments', require('./routes/installments'));
app.use('/api/payments',     require('./routes/payments'));
app.use('/api',              require('./routes/stats'));

// ─── تقديم الفرونت في بيئة الإنتاج ───
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
  });
}

// ─── معالجة الأخطاء ───
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
});

// ─── تشغيل السيرفر ───
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 السيرفر يعمل على: http://localhost:${PORT}`);
  console.log(`📦 البيئة: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  قاعدة البيانات: MongoDB\n`);
});
