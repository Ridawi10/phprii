# 🏦 نظام الأقساط — دليل التشغيل الكامل

## 🗂️ هيكل المشروع

```
aqsat-backend/
├── server.js              ← نقطة الدخول
├── package.json
├── .env                   ← إعداداتك (أنشئه من .env.example)
├── config/
│   └── db.js              ← اتصال MongoDB
├── models/
│   ├── User.js
│   ├── Installment.js
│   ├── Payment.js
│   └── Log.js
├── routes/
│   ├── auth.js            ← تسجيل / دخول / إدارة مستخدمين
│   ├── installments.js    ← CRUD الأقساط
│   ├── payments.js        ← CRUD التسديدات
│   └── stats.js           ← إحصائيات + سجلات
├── middleware/
│   └── auth.js            ← JWT حماية الـ routes
└── public/                ← الفرونت (HTML/CSS/JS)
    ├── landing.html
    ├── index.html
    ├── css/
    └── js/
```

---

## ⚡ خطوات التشغيل المحلي

### 1. إنشاء قاعدة بيانات MongoDB Atlas (مجاني)

1. اذهب لـ [mongodb.com/atlas](https://mongodb.com/atlas) وسجّل حساب
2. اضغط **Create a deployment** → اختر **M0 Free**
3. اختر AWS أو Google Cloud → أي منطقة
4. اضغط **Create Deployment**
5. من القائمة الجانبية → **Database Access** → أضف مستخدم:
   - Username: `aqsat_user`
   - Password: اختر كلمة مرور قوية
6. من القائمة → **Network Access** → اضغط **Add IP Address** → اختر **Allow access from anywhere**
7. ارجع للـ Dashboard → اضغط **Connect** → **Drivers** → انسخ الرابط

### 2. إعداد ملف .env

```bash
cp .env.example .env
```

افتح `.env` وعدّل:
```env
MONGO_URI=mongodb+srv://aqsat_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/aqsat_db?retryWrites=true&w=majority
JWT_SECRET=اكتب_هنا_أي_نص_عشوائي_طويل_جداً
ADMIN_DEFAULT_EMAIL=admin@yourdomain.com
ADMIN_DEFAULT_PASS=your_strong_password
```

### 3. تثبيت الحزم وتشغيل السيرفر

```bash
npm install
npm run dev     # للتطوير (nodemon)
# أو
npm start       # للإنتاج
```

### 4. افتح المتصفح

```
http://localhost:5000/landing.html
```

عند أول تشغيل يُنشئ السيرفر حساب الأدمن تلقائياً ويطبع بياناته في الـ terminal.

---

## 🚀 الرفع على الاستضافة

### خيار 1 — Railway (مجاني، الأسهل)

1. اذهب لـ [railway.app](https://railway.app) وسجّل بـ GitHub
2. اضغط **New Project** → **Deploy from GitHub repo**
3. من **Variables** أضف كل متغيرات `.env`
4. Railway يشغّل `npm start` تلقائياً
5. من **Settings** → **Domains** احصل على رابطك

### خيار 2 — VPS (أي استضافة Linux)

```bash
# على السيرفر
sudo apt update && sudo apt install nodejs npm -y

# انسخ ملفات المشروع
git clone YOUR_REPO  # أو رفع بـ FTP
cd aqsat-backend
npm install
cp .env.example .env
nano .env    # عدّل الإعدادات

# تشغيل دائم بـ PM2
npm install -g pm2
pm2 start server.js --name aqsat
pm2 startup
pm2 save
```

### خيار 3 — Render (مجاني)

1. اذهب لـ [render.com](https://render.com)
2. **New Web Service** → ارتبط بـ GitHub
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. أضف Environment Variables من لوحة التحكم

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/api/auth/register` | تسجيل حساب جديد |
| POST | `/api/auth/login` | تسجيل الدخول |
| GET  | `/api/auth/me` | بيانات المستخدم الحالي |
| PUT  | `/api/auth/change-password` | تغيير كلمة المرور |
| GET  | `/api/auth/users` | كل المستخدمين (أدمن) |
| PUT  | `/api/auth/users/:id` | تعديل مستخدم (أدمن) |
| DELETE | `/api/auth/users/:id` | حذف مستخدم (أدمن) |
| PUT  | `/api/auth/users/:id/reset-password` | إعادة تعيين كلمة مرور |

### Installments
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET    | `/api/installments` | جلب الأقساط |
| POST   | `/api/installments` | إضافة قسط |
| PUT    | `/api/installments/:id` | تعديل قسط |
| DELETE | `/api/installments/:id` | حذف قسط |

### Payments
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET    | `/api/payments?installmentId=` | جلب التسديدات |
| POST   | `/api/payments` | إضافة تسديد |
| PUT    | `/api/payments/:id` | تعديل تسديد |
| DELETE | `/api/payments/:id` | حذف تسديد |

### Stats & Logs
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/stats` | إحصائيات لوحة التحكم |
| GET | `/api/logs` | سجل العمليات |

---

## 🔐 الأمان

- كل كلمات المرور مشفرة بـ **bcrypt** (لا تُخزن كنص)
- التوثيق بـ **JWT** صالح 30 يوم
- كل مستخدم يرى بياناته فقط
- الأدمن يرى كل شيء
- حساب جديد → `pending` حتى يوافق الأدمن

---

## 👑 بيانات الأدمن الافتراضية

تُضبط في ملف `.env`:
```
ADMIN_DEFAULT_EMAIL=admin@aqsat.com
ADMIN_DEFAULT_PASS=admin123
```
**⚠️ غيّرها فوراً بعد أول دخول!**
