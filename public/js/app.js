// ===== MAIN APP — نسخة السيرفر =====

// ─────────────────────────────────────────
// لوحة التحكم
// ─────────────────────────────────────────
async function renderDashboard() {
  const content = document.getElementById('page-dashboard');
  if (!content) return;

  content.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card blue">
        <span class="stat-icon">👥</span>
        <div class="stat-value" id="stat-clients">—</div>
        <div class="stat-label">إجمالي العملاء</div>
      </div>
      <div class="stat-card gold">
        <span class="stat-icon">⏳</span>
        <div class="stat-value" id="stat-active">—</div>
        <div class="stat-label">أقساط جارية</div>
      </div>
      <div class="stat-card green">
        <span class="stat-icon">✅</span>
        <div class="stat-value" id="stat-paid">—</div>
        <div class="stat-label">أقساط مسددة</div>
      </div>
      <div class="stat-card red">
        <span class="stat-icon">💰</span>
        <div class="stat-value" id="stat-revenue" style="font-size:17px">—</div>
        <div class="stat-label">إجمالي المحصّل</div>
      </div>
    </div>

    <div class="quick-actions">
      <div class="quick-action-card blue"  onclick="navigateTo('page-add')">
        <div class="qa-icon">➕</div>
        <div class="qa-title">إضافة قسط جديد</div>
        <div class="qa-sub">تسجيل عميل وقسط</div>
      </div>
      <div class="quick-action-card green" onclick="navigateTo('page-payments')">
        <div class="qa-icon">💳</div>
        <div class="qa-title">تسجيل تسديد</div>
        <div class="qa-sub">استلام دفعة من عميل</div>
      </div>
      <div class="quick-action-card gold"  onclick="navigateTo('page-reminders')">
        <div class="qa-icon">🔔</div>
        <div class="qa-title">التذكير</div>
        <div class="qa-sub">متأخرون عن السداد</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title"><div class="title-icon">📈</div>آخر النشاطات</div>
      </div>
      <div id="recent-logs">
        <div class="loading-state"><div class="loading-spinner"></div></div>
      </div>
    </div>`;

  // تحميل الإحصائيات
  try {
    const stats = await API.Stats.get();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('stat-clients', stats.clients);
    set('stat-active',  stats.activeInstallments);
    set('stat-paid',    stats.paidInstallments);
    set('stat-revenue', Utils.formatCurrency(stats.totalRevenue));

    // شارة التذكير
    const badge = document.getElementById('reminder-badge');
    if (badge) {
      badge.textContent  = stats.overdueCount;
      badge.style.display = stats.overdueCount > 0 ? '' : 'none';
    }

    // شارة طلبات الانتساب (للأدمن)
    const reqBadge = document.getElementById('pending-badge');
    if (reqBadge && API.Auth.isAdmin()) {
      reqBadge.textContent   = stats.pendingUsers;
      reqBadge.style.display = stats.pendingUsers > 0 ? '' : 'none';
    }
  } catch (e) { console.error('stats error:', e); }

  // تحميل السجلات
  try {
    const logs = await API.Logs.getAll();
    const logsEl = document.getElementById('recent-logs');
    if (!logsEl) return;

    if (!logs.length) {
      logsEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>لا توجد نشاطات بعد</h3><p>ابدأ بإضافة قسط جديد</p></div>`;
      return;
    }

    const icons = { installment_add:'➕', payment:'💰', payment_delete:'🗑️', payment_edit:'✏️', client_add:'👤', installment_delete:'🗑️' };
    logsEl.innerHTML = logs.slice(0,8).map(log => `
      <div class="payment-history-item">
        <div style="font-size:20px;min-width:28px;text-align:center">${icons[log.type]||'📌'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;color:var(--text-main)">${log.clientName||'—'}</div>
          <div style="font-size:12px;color:var(--text-muted)">${log.note||''}</div>
        </div>
        ${log.amount ? `<div style="font-weight:700;color:var(--accent-light);white-space:nowrap">${Utils.formatCurrency(log.amount)}</div>` : ''}
        <div style="font-size:11px;color:var(--text-muted);white-space:nowrap">${Utils.formatDateTime(log.createdAt)}</div>
      </div>`).join('');
  } catch (e) { console.error('logs error:', e); }
}

// ─────────────────────────────────────────
// التنقل
// ─────────────────────────────────────────
async function navigateTo(pageId) {
  closeSidebar();

  document.querySelectorAll('.page-section').forEach(p => p.classList.add('hidden'));
  const page = document.getElementById(pageId);
  if (!page) return;
  page.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-page="${pageId}"]`)?.classList.add('active');

  const titles = {
    'page-dashboard':  { title: 'لوحة التحكم',       sub: 'نظرة عامة على النظام' },
    'page-add':        { title: 'إضافة قسط',         sub: 'تسجيل قسط جديد للعميل' },
    'page-payments':   { title: 'التسديد',            sub: 'استلام وإدارة المدفوعات' },
    'page-reports':    { title: 'التقارير',           sub: 'سجلات وإحصاءات الأقساط' },
    'page-reminders':  { title: 'التذكير',            sub: 'العملاء المتأخرون عن السداد' },
    'page-activation': { title: 'إدارة المستخدمين',  sub: 'الحسابات وطلبات التسجيل' },
  };

  const t = titles[pageId];
  if (t) {
    const tEl = document.getElementById('topbar-page-title');
    const sEl = document.getElementById('topbar-page-sub');
    if (tEl) tEl.textContent = t.title;
    if (sEl) sEl.textContent = t.sub;
  }

  page.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p>جاري التحميل...</p></div>`;

  try {
    switch (pageId) {
      case 'page-dashboard':  await renderDashboard();           break;
      case 'page-add':        await AddInstallmentPage.render(); break;
      case 'page-payments':   await PaymentsPage.render();       break;
      case 'page-reports':    await ReportsPage.render();        break;
      case 'page-reminders':  await RemindersPage.render();      break;
      case 'page-activation': await ActivationPage.render();     break;
    }
  } catch (e) {
    console.error(e);
    page.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>حدث خطأ</h3>
        <p style="color:#f87171;font-size:12px">${e.message}</p>
        <button class="btn btn-ghost" style="margin-top:16px" onclick="navigateTo('${pageId}')">🔄 إعادة المحاولة</button>
      </div>`;
  }
}

// ─────────────────────────────────────────
// موبايل
// ─────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sidebar-overlay')?.classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');
}

// ─────────────────────────────────────────
// الوقت
// ─────────────────────────────────────────
function updateTopbarTime() {
  const el = document.getElementById('current-time');
  if (el) el.textContent = new Date().toLocaleTimeString('ar-IQ', { hour:'2-digit', minute:'2-digit', hour12:true });
}

// ─────────────────────────────────────────
// عرض بيانات المستخدم في الشريط الجانبي
// ─────────────────────────────────────────
function renderUserInfo() {
  const user = API.Auth.getUser();
  if (!user) return;

  const el = document.getElementById('sidebar-user-info');
  if (!el) return;

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-top:1px solid var(--border);cursor:pointer" onclick="showUserMenu()">
      <div style="width:36px;height:36px;background:linear-gradient(135deg,var(--primary-light),var(--accent));border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">
        ${user.role === 'admin' ? '👑' : '👤'}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${user.name}</div>
        <div style="font-size:10px;color:var(--text-muted)">${user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</div>
      </div>
      <button onclick="event.stopPropagation();API.Auth.logout()" title="تسجيل خروج"
        style="background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.2);border-radius:6px;color:#f87171;padding:5px 8px;cursor:pointer;font-size:12px;font-family:Cairo,sans-serif">
        خروج
      </button>
    </div>`;
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  updateTopbarTime();
  setInterval(updateTopbarTime, 30000);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  });
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay'))
      e.target.classList.remove('active');
  });

  // تحقق من الجلسة
  try {
    await API.init();
  } catch {
    return; // سيتحول لـ landing.html تلقائياً
  }

  // عرض بيانات المستخدم
  renderUserInfo();

  // إخفاء تبويب الإدارة إذا مو أدمن
  if (!API.Auth.isAdmin()) {
    const adminNav = document.querySelector('[data-page="page-activation"]');
    if (adminNav) adminNav.style.display = 'none';
  }

  // تحميل الصفحة الرئيسية
  await navigateTo('page-dashboard');
  console.log('✅ النظام جاهز');
});
