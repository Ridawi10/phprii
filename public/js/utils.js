// ===== UTILITIES MODULE =====

const Utils = (() => {

  // تنسيق العملة العراقية
  function formatCurrency(amount) {
    if (!amount && amount !== 0) return '0 د.ع';
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('en-US') + ' د.ع';
  }

  // تنسيق الأرقام مع الفاصلة تلقائياً
  function formatNumber(val) {
    const str = val.toString().replace(/,/g, '');
    const num = parseFloat(str);
    if (isNaN(num)) return val;
    return num.toLocaleString('en-US');
  }

  // تطبيق التنسيق التلقائي على حقل الإدخال
  function applyNumberFormat(input) {
    input.addEventListener('input', function () {
      // احتفظ بموضع المؤشر
      const cursorPos = this.selectionStart;
      const oldLen    = this.value.length;

      // أزل كل شيء غير رقم أو نقطة (بما فيها الفواصل والأرقام العربية)
      const raw = this.value
        .replace(/[\u0660-\u0669]/g, d => d.charCodeAt(0) - 0x0660) // أرقام عربية → إنجليزية
        .replace(/,/g, '')
        .replace(/[^0-9.]/g, '');

      const parts = raw.split('.');
      if (parts[0] === '') { this.value = ''; return; }

      const intPart = parseInt(parts[0], 10);
      if (isNaN(intPart)) { this.value = ''; return; }

      // استخدم en-US لضمان أرقام إنجليزية مع فاصلة آلاف
      let formatted = intPart.toLocaleString('en-US');
      if (parts.length > 1) formatted += '.' + parts[1];

      this.value = formatted;

      // أعد ضبط موضع المؤشر
      const newLen  = this.value.length;
      const newPos  = cursorPos + (newLen - oldLen);
      this.setSelectionRange(Math.max(0, newPos), Math.max(0, newPos));
    });
  }

  // قراءة القيمة الرقمية من حقل منسق
  function parseAmount(val) {
    if (!val) return 0;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
  }

  // تنسيق التاريخ والوقت
  function formatDateTime(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    const date = d.toLocaleDateString('ar-IQ', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const time = d.toLocaleTimeString('ar-IQ', {
      hour: '2-digit', minute: '2-digit'
    });
    return `${date} - ${time}`;
  }

  // تنسيق التاريخ فقط
  function formatDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleDateString('ar-IQ', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  }

  // احتساب عدد الأيام منذ تاريخ معين
  function daysSince(isoStr) {
    if (!isoStr) return 0;
    const diff = new Date() - new Date(isoStr);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // الحصول على الوقت الحالي
  function nowISO() {
    return new Date().toISOString();
  }

  // إنشاء Toast رسالة
  function toast(msg, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-20px)';
      el.style.transition = 'all 0.3s';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // فتح Modal
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
  }

  // إغلاق Modal
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
  }

  // تبديل الصفحات
  function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById(pageId);
    if (page) page.classList.remove('hidden');
    // تحديث التنقل
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`[data-page="${pageId}"]`);
    if (navItem) navItem.classList.add('active');
  }

  // توليد رسالة واتساب
  function sendWhatsApp(phone, name, amount, days) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intPhone = cleanPhone.startsWith('0') ? '964' + cleanPhone.slice(1) : cleanPhone;
    const msg = `السلام عليكم ${name} 🌟\nنود تذكيركم بأن موعد سداد قسطكم قد حل.\nالمبلغ المستحق: ${formatCurrency(amount)}\nمنذ: ${days} يوم\nنرجو التفضل بالتسديد في أقرب وقت ممكن.\nشكراً لتعاملكم معنا 🙏`;
    window.open(`https://wa.me/${intPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  // تأكيد الحذف
  function confirmDelete(msg = 'هل أنت متأكد من الحذف؟') {
    return window.confirm(msg);
  }

  // حساب القسط الشهري
  function calcMonthly(total, months) {
    if (!months || months === 0) return 0;
    return Math.ceil(total / months);
  }

  // تمييز النص في البحث
  function highlight(text, search) {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, '<mark style="background:rgba(212,168,67,0.3);color:inherit;border-radius:2px">$1</mark>');
  }

  return {
    formatCurrency, formatNumber, parseAmount, applyNumberFormat,
    formatDateTime, formatDate, daysSince, nowISO,
    toast, openModal, closeModal, showPage,
    sendWhatsApp, confirmDelete, calcMonthly, highlight
  };
})();
