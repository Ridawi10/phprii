const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('📁 المجلد الحالي:', __dirname);
console.log('🔍 MONGO_URI من process.env:', process.env.MONGO_URI ? '✅ موجود' : '❌ غير موجود');

// جرب طريقة ثانية للتحميل
const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

console.log('📄 مسار ملف .env:', envPath);
console.log('🔍 بعد التحميل المباشر - MONGO_URI:', process.env.MONGO_URI ? '✅ موجود' : '❌ غير موجود');

// اطبع أول 50 حرف من الرابط للتأكد (بدون كلمة المرور)
if (process.env.MONGO_URI) {
    const uri = process.env.MONGO_URI;
    const hiddenUri = uri.replace(/:[^:@]*@/, ':****@');
    console.log('🔗 الرابط (مخفي كلمة المرور):', hiddenUri.substring(0, 50) + '...');
}