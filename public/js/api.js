// ===== API MODULE — يستبدل db.js =====
// كل العمليات تذهب للسيرفر بدل IndexedDB

const API = (() => {

  // ── عنوان السيرفر ── غيّره عند الرفع على الاستضافة
  const BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api'; // في الإنتاج نفس الدومين

  // ─────────────────────────────────────────
  // طلب HTTP مع التوكن
  // ─────────────────────────────────────────
  async function request(method, endpoint, body = null) {
    const token = localStorage.getItem('aqsat_token');
    const opts  = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    if (body) opts.body = JSON.stringify(body);

    const res  = await fetch(`${BASE}${endpoint}`, opts);
    const data = await res.json();

    if (!res.ok) {
      // توكن منتهي → أعد للصفحة الرئيسية
      if (res.status === 401) {
        localStorage.removeItem('aqsat_token');
        localStorage.removeItem('aqsat_user');
        window.location.href = 'landing.html';
      }
      throw new Error(data.message || 'خطأ في الطلب');
    }

    return data;
  }

  const get    = (ep)       => request('GET',    ep);
  const post   = (ep, body) => request('POST',   ep, body);
  const put    = (ep, body) => request('PUT',    ep, body);
  const del    = (ep)       => request('DELETE', ep);

  // ─────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────
  const Auth = {
    async login(email, password) {
      const data = await post('/auth/login', { email, password });
      localStorage.setItem('aqsat_token', data.token);
      localStorage.setItem('aqsat_user',  JSON.stringify(data.user));
      return data;
    },
    async register(name, email, password, phone) {
      return await post('/auth/register', { name, email, password, phone });
    },
    async me() {
      return await get('/auth/me');
    },
    async changePassword(oldPassword, newPassword) {
      return await put('/auth/change-password', { oldPassword, newPassword });
    },
    logout() {
      localStorage.removeItem('aqsat_token');
      localStorage.removeItem('aqsat_user');
      window.location.href = 'landing.html';
    },
    getUser() {
      try { return JSON.parse(localStorage.getItem('aqsat_user')); }
      catch { return null; }
    },
    isLoggedIn() {
      return !!localStorage.getItem('aqsat_token');
    },
    isAdmin() {
      return this.getUser()?.role === 'admin';
    },
    // ── إدارة المستخدمين (أدمن فقط) ──
    async getUsers(params = {}) {
      const q = new URLSearchParams(params).toString();
      return await get(`/auth/users${q ? '?' + q : ''}`);
    },
    async updateUser(id, data) {
      return await put(`/auth/users/${id}`, data);
    },
    async deleteUser(id) {
      return await del(`/auth/users/${id}`);
    },
    async resetUserPassword(id, newPassword) {
      return await put(`/auth/users/${id}/reset-password`, { newPassword });
    },
  };

  // ─────────────────────────────────────────
  // INSTALLMENTS
  // ─────────────────────────────────────────
  const Installments = {
    async getAll(params = {}) {
      const q = new URLSearchParams(params).toString();
      const data = await get(`/installments${q ? '?' + q : ''}`);
      return data.data;
    },
    async getById(id) {
      const data = await get(`/installments/${id}`);
      return data.data;
    },
    async add(installment) {
      const data = await post('/installments', installment);
      return data.data;
    },
    async update(installment) {
      const data = await put(`/installments/${installment._id || installment.id}`, installment);
      return data.data;
    },
    async remove(id) {
      return await del(`/installments/${id}`);
    },
    async getActive() {
      return await this.getAll({ status: 'active' });
    },
  };

  // ─────────────────────────────────────────
  // PAYMENTS
  // ─────────────────────────────────────────
  const Payments = {
    async getAll(params = {}) {
      const q = new URLSearchParams(params).toString();
      const data = await get(`/payments${q ? '?' + q : ''}`);
      return data.data;
    },
    async getByInstallmentId(installmentId) {
      return await this.getAll({ installmentId });
    },
    async add(payment) {
      const data = await post('/payments', payment);
      return data;
    },
    async update(payment) {
      const data = await put(`/payments/${payment._id || payment.id}`, payment);
      return data.data;
    },
    async remove(id) {
      return await del(`/payments/${id}`);
    },
  };

  // ─────────────────────────────────────────
  // LOGS
  // ─────────────────────────────────────────
  const Logs = {
    async getAll(params = {}) {
      const q = new URLSearchParams(params).toString();
      const data = await get(`/logs${q ? '?' + q : ''}`);
      return data.data;
    },
  };

  // ─────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────
  const Stats = {
    async get(params = {}) {
      const q = new URLSearchParams(params).toString();
      const data = await get(`/stats${q ? '?' + q : ''}`);
      return data.data;
    },
  };

  // ─────────────────────────────────────────
  // INIT — يتحقق من الجلسة
  // ─────────────────────────────────────────
  async function init() {
    if (!Auth.isLoggedIn()) {
      window.location.href = 'landing.html';
      throw new Error('غير مسجّل');
    }
    // تحقق من صلاحية التوكن
    try {
      const data = await Auth.me();
      localStorage.setItem('aqsat_user', JSON.stringify(data.user));
    } catch {
      Auth.logout();
    }
  }

  return { init, Auth, Installments, Payments, Logs, Stats };
})();

// ── لضمان التوافق مع الكود القديم الذي يستخدم DB ──
const DB = API;
