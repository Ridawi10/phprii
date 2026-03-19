// ===== LANDING PAGE LOGIC =====
// يتحكم في الواجهة الأمامية، التسجيل، تسجيل الدخول

const Landing = (() => {

  // ===== مفاتيح التخزين =====
  const KEYS = {
    CONTENT: 'aqsat_landing_content',
    USERS: 'aqsat_users',
    REQUESTS: 'aqsat_reg_requests',
    ADMIN_PASS: 'aqsat_admin_pass',
    SESSION: 'aqsat_session',
  };

  // ===== محتوى افتراضي للصفحة =====
  const DEFAULT_CONTENT = {
    badge: '✨ نظام إدارة الأقساط الأحترافي',
    titleLine1: 'إدارة أقساطك',
    titleLine2: 'بكل سهولة واحترافية',
    subtitle: 'نظام متكامل لإدارة الأقساط والتسديدات للعملاء — بواجهة عربية سهلة وقاعدة بيانات محلية آمنة.',
    btnPrimary: '🚀 ابدأ الآن',
    btnSecondary: '📖 اعرف أكثر',
    stat1Num: '+500', stat1Label: 'عميل مسجل',
    stat2Num: '+1200', stat2Label: 'قسط مُدار',
    stat3Num: '99%', stat3Label: 'دقة في السجلات',
    extraTexts: [
      { title: '📢 مرحباً بكم', body: 'نقدم لكم أفضل نظام لإدارة الأقساط والتقسيط بعملة الدينار العراقي. نظامنا مصمم خصيصاً لتلبية احتياجات السوق العراقية.' },
    ],
    features: [
      { icon: '📋', title: 'إضافة أقساط', desc: 'سجّل بيانات العميل والمبلغ وعدد الأشهر وسيتم حساب القسط الشهري تلقائياً.' },
      { icon: '💳', title: 'تسديد فوري', desc: 'استقبل الدفعات وتتبع المبالغ المسددة والمتبقية بوقت فعلي.' },
      { icon: '🔔', title: 'تذكير تلقائي', desc: 'يعرض النظام العملاء المتأخرين مع إمكانية إرسال تذكير عبر واتساب مباشرة.' },
      { icon: '📊', title: 'تقارير شاملة', desc: 'سجلات كاملة لكل عملية إضافة أو تسديد مع التاريخ والوقت.' },
      { icon: '🔑', title: 'إدارة الحسابات', desc: 'أضف حسابات للعملاء وتحكم في صلاحيات الوصول وتفعيل الخدمات.' },
      { icon: '🛡️', title: 'أمان محلي', desc: 'جميع البيانات محفوظة على جهازك مباشرة بدون إرسالها لأي سيرفر خارجي.' },
    ]
  };

  // ===== كلمة مرور الأدمن الافتراضية =====
  const DEFAULT_ADMIN = { user: 'admin', pass: 'admin123' };

  // ===== قراءة البيانات =====
  function getContent() {
    try { return JSON.parse(localStorage.getItem(KEYS.CONTENT)) || DEFAULT_CONTENT; }
    catch { return DEFAULT_CONTENT; }
  }

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(KEYS.USERS)) || []; }
    catch { return []; }
  }

  function getRequests() {
    try { return JSON.parse(localStorage.getItem(KEYS.REQUESTS)) || []; }
    catch { return []; }
  }

  function saveContent(c) { localStorage.setItem(KEYS.CONTENT, JSON.stringify(c)); }
  function saveUsers(u) { localStorage.setItem(KEYS.USERS, JSON.stringify(u)); }
  function saveRequests(r) { localStorage.setItem(KEYS.REQUESTS, JSON.stringify(r)); }

  // ===== Session =====
  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(KEYS.SESSION)); }
    catch { return null; }
  }

  function setSession(user) { sessionStorage.setItem(KEYS.SESSION, JSON.stringify(user)); }
  function clearSession() { sessionStorage.removeItem(KEYS.SESSION); }

  // ===== INIT =====
  function init() {
    renderPage();
    setupParticles();
    setupScrollEffects();
    setupNavScroll();
    checkSession();
  }

  function checkSession() {
    const session = getSession();
    if (session?.role === 'admin') {
      showAdminEditBtn();
    }
  }

  // ===== RENDER PAGE =====
  function renderPage() {
    const c = getContent();

    // Badge
    document.getElementById('hero-badge-text').textContent = c.badge;

    // Title
    document.getElementById('hero-title-line1').textContent = c.titleLine1;
    document.getElementById('hero-title-line2').textContent = c.titleLine2;

    // Subtitle
    document.getElementById('hero-subtitle').textContent = c.subtitle;

    // Buttons
    document.getElementById('hero-btn-primary').innerHTML = c.btnPrimary;
    document.getElementById('hero-btn-secondary').innerHTML = c.btnSecondary;

    // Stats
    document.getElementById('stat1-num').textContent = c.stat1Num;
    document.getElementById('stat1-label').textContent = c.stat1Label;
    document.getElementById('stat2-num').textContent = c.stat2Num;
    document.getElementById('stat2-label').textContent = c.stat2Label;
    document.getElementById('stat3-num').textContent = c.stat3Num;
    document.getElementById('stat3-label').textContent = c.stat3Label;

    // Features
    const fg = document.getElementById('features-grid');
    fg.innerHTML = c.features.map(f => `
      <div class="feature-card">
        <div class="feature-icon">${f.icon}</div>
        <div class="feature-title">${f.title}</div>
        <div class="feature-desc">${f.desc}</div>
      </div>
    `).join('');

    // Extra Texts
    const et = document.getElementById('extra-texts-container');
    if (c.extraTexts && c.extraTexts.length > 0) {
      et.innerHTML = c.extraTexts.map(t => `
        <div class="extra-text-block">
          <h3>${t.title}</h3>
          <p>${t.body}</p>
        </div>
      `).join('');
      et.parentElement.style.display = '';
    } else {
      et.parentElement.style.display = 'none';
    }

    // Trigger scroll observer
    setTimeout(setupScrollObserver, 100);
  }

  // ===== PARTICLES =====
  function setupParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const colors = ['rgba(212,168,67,0.5)', 'rgba(37,99,235,0.4)', 'rgba(255,255,255,0.2)'];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 4 + 1;
      p.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        animation-duration: ${Math.random() * 20 + 15}s;
        animation-delay: ${Math.random() * 15}s;
      `;
      canvas.appendChild(p);
    }
  }

  // ===== SCROLL EFFECTS =====
  function setupScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.feature-card, .extra-text-block').forEach(el => {
      observer.observe(el);
    });

    // stagger feature cards
    document.querySelectorAll('.feature-card').forEach((card, i) => {
      card.style.transitionDelay = `${i * 0.08}s`;
    });
  }

  function setupScrollEffects() {
    document.querySelector('.scroll-indicator')?.addEventListener('click', () => {
      document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function setupNavScroll() {
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('main-navbar');
      if (window.scrollY > 50) nav?.classList.add('scrolled');
      else nav?.classList.remove('scrolled');
    });
  }

  // ===== AUTH MODALS =====
  function openLogin() {
    closeAllModals();
    document.getElementById('modal-login').classList.add('active');
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
  }

  function openRegister() {
    closeAllModals();
    document.getElementById('modal-register').classList.add('active');
    document.getElementById('reg-error').style.display = 'none';
    document.getElementById('reg-success').style.display = 'none';
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-phone').value = '';
    document.getElementById('reg-user').value = '';
    document.getElementById('reg-pass').value = '';
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  // ===== LOGIN =====
  function doLogin() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const errEl = document.getElementById('login-error');

    if (!user || !pass) {
      showError(errEl, 'يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    // تحقق من أدمن
    if (user === DEFAULT_ADMIN.user && pass === DEFAULT_ADMIN.pass) {
      setSession({ username: user, role: 'admin', name: 'المدير' });
      closeAllModals();
      window.location.href = 'index.html';
      return;
    }

    // تحقق من المستخدمين المعتمدين
    const users = getUsers();
    const found = users.find(u => u.username === user && u.password === pass && u.status === 'approved');

    if (found) {
      setSession({ username: user, role: 'client', name: found.name });
      closeAllModals();
      showClientDashboard(found);
      return;
    }

    // تحقق إذا الطلب معلق
    const requests = getRequests();
    const pending = requests.find(r => r.username === user);
    if (pending) {
      if (pending.status === 'pending') {
        showError(errEl, '⏳ طلبك قيد المراجعة، يرجى الانتظار حتى موافقة المدير');
      } else if (pending.status === 'rejected') {
        showError(errEl, '❌ تم رفض طلبك. تواصل مع المدير لمزيد من التفاصيل');
      }
      return;
    }

    showError(errEl, 'اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  // ===== REGISTER =====
  function doRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const user = document.getElementById('reg-user').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();
    const errEl = document.getElementById('reg-error');
    const sucEl = document.getElementById('reg-success');

    if (!name || !user || !pass) {
      showError(errEl, 'يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    if (pass.length < 6) {
      showError(errEl, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    // تحقق من تكرار اسم المستخدم
    const users = getUsers();
    const requests = getRequests();

    if (users.find(u => u.username === user) || requests.find(r => r.username === user)) {
      showError(errEl, 'اسم المستخدم مستخدم مسبقاً، اختر اسماً آخر');
      return;
    }

    // حفظ الطلب
    requests.push({
      id: Date.now(),
      name, phone, username: user, password: pass,
      status: 'pending',
      requestedAt: new Date().toISOString()
    });
    saveRequests(requests);

    errEl.style.display = 'none';
    sucEl.style.display = 'block';
    sucEl.textContent = '✅ تم إرسال طلبك بنجاح! سيتم مراجعته من قبل المدير وإشعارك.';

    // إخفاء الفورم وإظهار رسالة انتظار
    setTimeout(() => {
      document.getElementById('reg-form-fields').style.display = 'none';
      document.getElementById('reg-pending-msg').style.display = 'block';
    }, 1500);
  }

  // ===== CLIENT DASHBOARD (بعد تسجيل الدخول) =====
  function showClientDashboard(user) {
    const modal = document.getElementById('modal-client-dash');
    document.getElementById('client-dash-name').textContent = user.name;
    document.getElementById('client-dash-user').textContent = user.username;
    modal.classList.add('active');
  }

  function goToClientSystem() {
    window.location.href = 'index.html';
  }

  // ===== ADMIN: زر تعديل =====
  function showAdminEditBtn() {
    const btn = document.querySelector('.admin-edit-btn');
    if (btn) btn.style.display = 'flex';
  }

  function openEditContent() {
    const c = getContent();
    document.getElementById('edit-badge').value = c.badge;
    document.getElementById('edit-title1').value = c.titleLine1;
    document.getElementById('edit-title2').value = c.titleLine2;
    document.getElementById('edit-subtitle').value = c.subtitle;
    document.getElementById('edit-btn1').value = c.btnPrimary;
    document.getElementById('edit-btn2').value = c.btnSecondary;
    document.getElementById('edit-stat1n').value = c.stat1Num;
    document.getElementById('edit-stat1l').value = c.stat1Label;
    document.getElementById('edit-stat2n').value = c.stat2Num;
    document.getElementById('edit-stat2l').value = c.stat2Label;
    document.getElementById('edit-stat3n').value = c.stat3Num;
    document.getElementById('edit-stat3l').value = c.stat3Label;

    // Extra texts
    renderEditExtraTexts(c.extraTexts || []);

    document.getElementById('modal-edit-content').classList.add('active');
  }

  function renderEditExtraTexts(texts) {
    const container = document.getElementById('extra-texts-editor');
    container.innerHTML = texts.map((t, i) => `
      <div class="extra-text-edit-item" data-index="${i}" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:12px;color:rgba(212,168,67,0.7);font-weight:700">نص ${i+1}</span>
          <button onclick="Landing.removeExtraText(${i})" style="background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.2);color:#f87171;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:12px;font-family:Cairo,sans-serif">حذف</button>
        </div>
        <input type="text" class="auth-input" placeholder="العنوان" value="${escHtml(t.title)}" id="et-title-${i}" style="margin-bottom:8px">
        <textarea class="auth-input edit-text-area" placeholder="النص" id="et-body-${i}" style="min-height:70px">${escHtml(t.body)}</textarea>
      </div>
    `).join('');
  }

  function addExtraText() {
    const c = getContent();
    c.extraTexts = c.extraTexts || [];
    c.extraTexts.push({ title: 'عنوان جديد', body: 'نص جديد...' });
    renderEditExtraTexts(c.extraTexts);
  }

  function removeExtraText(i) {
    const c = getContent();
    c.extraTexts.splice(i, 1);
    renderEditExtraTexts(c.extraTexts);
  }

  function saveEditContent() {
    const c = getContent();
    c.badge = document.getElementById('edit-badge').value;
    c.titleLine1 = document.getElementById('edit-title1').value;
    c.titleLine2 = document.getElementById('edit-title2').value;
    c.subtitle = document.getElementById('edit-subtitle').value;
    c.btnPrimary = document.getElementById('edit-btn1').value;
    c.btnSecondary = document.getElementById('edit-btn2').value;
    c.stat1Num = document.getElementById('edit-stat1n').value;
    c.stat1Label = document.getElementById('edit-stat1l').value;
    c.stat2Num = document.getElementById('edit-stat2n').value;
    c.stat2Label = document.getElementById('edit-stat2l').value;
    c.stat3Num = document.getElementById('edit-stat3n').value;
    c.stat3Label = document.getElementById('edit-stat3l').value;

    // جمع النصوص الإضافية
    const extraTexts = [];
    document.querySelectorAll('.extra-text-edit-item').forEach((item, i) => {
      const title = document.getElementById(`et-title-${i}`)?.value || '';
      const body = document.getElementById(`et-body-${i}`)?.value || '';
      if (title) extraTexts.push({ title, body });
    });
    c.extraTexts = extraTexts;

    saveContent(c);
    closeAllModals();
    renderPage();
    showToast('✅ تم حفظ التعديلات بنجاح');
  }

  // ===== HELPERS =====
  function showError(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
  }

  function escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:9999;
      background:#0f2040;border:1px solid rgba(212,168,67,0.3);
      border-radius:10px;padding:14px 20px;font-size:14px;font-weight:600;
      color:#f0c96a;box-shadow:0 8px 32px rgba(0,0,0,0.4);
      animation:fadeIn .3s ease;font-family:Cairo,sans-serif;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ===== PUBLIC API =====
  return {
    init,
    openLogin, openRegister, closeAllModals,
    doLogin, doRegister,
    goToClientSystem,
    openEditContent, addExtraText, removeExtraText, saveEditContent,
    // expose for page-activation.js
    getRequests, saveRequests, getUsers, saveUsers
  };
})();

// Run
document.addEventListener('DOMContentLoaded', Landing.init);
