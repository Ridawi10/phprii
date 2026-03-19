// ===== PAGE: إدارة المستخدمين (أدمن) =====

const ActivationPage = (() => {

  async function render() {
    const content = document.getElementById('page-activation');
    if (!content) return;

    const isAdmin = API.Auth.isAdmin();

    if (!isAdmin) {
      content.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-icon">🔒</div>
            <h3>صلاحية المدير فقط</h3>
          </div>
        </div>`;
      return;
    }

    content.innerHTML = `
      <!-- إحصائيات سريعة -->
      <div class="stats-grid" id="users-stats" style="margin-bottom:20px"></div>

      <!-- تبويبات -->
      <div class="card">
        <div class="tab-bar">
          <button class="tab-btn active" id="tab-pending"   onclick="ActivationPage.switchTab('pending')">
            ⏳ طلبات التسجيل <span class="nav-badge" id="pending-count" style="display:none;position:relative;margin-right:6px">0</span>
          </button>
          <button class="tab-btn" id="tab-approved" onclick="ActivationPage.switchTab('approved')">✅ المفعّلون</button>
          <button class="tab-btn" id="tab-all"      onclick="ActivationPage.switchTab('all')">👥 الكل</button>
          <button class="tab-btn" id="tab-db"       onclick="ActivationPage.switchTab('db')">🗄️ قاعدة البيانات</button>
        </div>

        <!-- بحث -->
        <div class="search-bar" id="users-search-wrap" style="margin-top:14px">
          <span class="search-icon">🔍</span>
          <input type="text" class="form-control" id="users-search"
            placeholder="بحث بالاسم أو الإيميل..."
            oninput="ActivationPage.filterUsers(this.value)">
        </div>

        <div id="tab-content">
          <div class="loading-state"><div class="loading-spinner"></div></div>
        </div>
      </div>

      <!-- Modal تعديل مستخدم -->
      <div class="modal-overlay" id="edit-user-modal">
        <div class="modal" style="max-width:480px">
          <div class="modal-header">
            <div class="modal-title">✏️ تعديل المستخدم</div>
            <button class="modal-close" onclick="document.getElementById('edit-user-modal').classList.remove('active')">✕</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="edit-user-id">
            <div class="form-grid">
              <div class="form-group">
                <label>الاسم</label>
                <input type="text" class="form-control" id="edit-user-name">
              </div>
              <div class="form-group">
                <label>الهاتف</label>
                <input type="text" class="form-control" id="edit-user-phone" style="direction:ltr;text-align:right">
              </div>
              <div class="form-group">
                <label>الحالة</label>
                <select class="form-control" id="edit-user-status">
                  <option value="pending">⏳ قيد المراجعة</option>
                  <option value="approved">✅ مفعّل</option>
                  <option value="rejected">❌ مرفوض</option>
                  <option value="suspended">🚫 موقوف</option>
                </select>
              </div>
              <div class="form-group">
                <label>نوع الحساب</label>
                <select class="form-control" id="edit-user-type">
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP 👑</option>
                </select>
              </div>
              <div class="form-group">
                <label>تاريخ انتهاء الاشتراك</label>
                <input type="date" class="form-control" id="edit-user-expire">
              </div>
              <div class="form-group">
                <label>ملاحظة</label>
                <input type="text" class="form-control" id="edit-user-note" placeholder="ملاحظة داخلية">
              </div>
            </div>
            <div class="divider"></div>
            <div class="form-group">
              <label>🔑 إعادة تعيين كلمة المرور (اتركه فارغاً إذا لا تريد التغيير)</label>
              <input type="password" class="form-control" id="edit-user-newpass" placeholder="كلمة مرور جديدة (6+ أحرف)">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="document.getElementById('edit-user-modal').classList.remove('active')">إلغاء</button>
            <button class="btn btn-accent" onclick="ActivationPage.saveUser()">💾 حفظ التعديلات</button>
          </div>
        </div>
      </div>
    `;

    await loadStats();
    await switchTab('pending');
  }

  // ── إحصائيات ──
  async function loadStats() {
    try {
      const all      = (await API.Auth.getUsers()).data;
      const pending  = all.filter(u => u.status === 'pending').length;
      const approved = all.filter(u => u.status === 'approved').length;
      const rejected = all.filter(u => u.status === 'rejected' || u.status === 'suspended').length;

      // شارة الطلبات
      const pb = document.getElementById('pending-count');
      if (pb) { pb.textContent = pending; pb.style.display = pending > 0 ? '' : 'none'; }

      document.getElementById('users-stats').innerHTML = `
        <div class="stat-card blue">
          <span class="stat-icon">👥</span>
          <div class="stat-value">${all.length}</div>
          <div class="stat-label">إجمالي المستخدمين</div>
        </div>
        <div class="stat-card gold">
          <span class="stat-icon">⏳</span>
          <div class="stat-value">${pending}</div>
          <div class="stat-label">بانتظار الموافقة</div>
        </div>
        <div class="stat-card green">
          <span class="stat-icon">✅</span>
          <div class="stat-value">${approved}</div>
          <div class="stat-label">حسابات مفعّلة</div>
        </div>
        <div class="stat-card red">
          <span class="stat-icon">🚫</span>
          <div class="stat-value">${rejected}</div>
          <div class="stat-label">مرفوض / موقوف</div>
        </div>`;
    } catch (e) { console.error(e); }
  }

  let _allUsers   = [];
  let _currentTab = 'pending';

  async function switchTab(tab) {
    _currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');

    const searchWrap = document.getElementById('users-search-wrap');
    if (searchWrap) searchWrap.style.display = tab === 'db' ? 'none' : '';

    if (tab === 'db') {
      renderDBPanel();
      return;
    }

    document.getElementById('tab-content').innerHTML =
      `<div class="loading-state"><div class="loading-spinner"></div></div>`;

    try {
      const params = tab !== 'all' ? { status: tab } : {};
      const res    = await API.Auth.getUsers(params);
      _allUsers    = res.data || [];
      renderUsers(_allUsers);
    } catch (e) {
      document.getElementById('tab-content').innerHTML =
        `<div class="empty-state"><div class="empty-icon">⚠️</div><p>${e.message}</p></div>`;
    }
  }

  function filterUsers(q) {
    if (!q.trim()) { renderUsers(_allUsers); return; }
    const filtered = _allUsers.filter(u =>
      u.name.includes(q) || u.email.includes(q) || (u.phone||'').includes(q)
    );
    renderUsers(filtered);
  }

  function renderUsers(users) {
    const el = document.getElementById('tab-content');
    if (!el) return;

    if (!users.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>لا يوجد مستخدمون</h3></div>`;
      return;
    }

    const statusLabel = { pending:'⏳ انتظار', approved:'✅ مفعّل', rejected:'❌ مرفوض', suspended:'🚫 موقوف' };
    const statusBadge = { pending:'badge-warning', approved:'badge-success', rejected:'badge-danger', suspended:'badge-danger' };
    const typeLabel   = { basic:'Basic', premium:'Premium ⭐', vip:'VIP 👑' };

    el.innerHTML = `
      <div class="table-wrapper" style="margin-top:4px">
        <table>
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>الإيميل</th>
              <th>الهاتف</th>
              <th>الحساب</th>
              <th>الحالة</th>
              <th>تاريخ التسجيل</th>
              <th>آخر دخول</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${users.filter(u => u.role !== 'admin').map(u => `
              <tr>
                <td class="td-name">${u.name}</td>
                <td style="direction:ltr;text-align:right;font-size:12px">${u.email}</td>
                <td class="td-phone">${u.phone||'—'}</td>
                <td><span class="badge badge-gold">${typeLabel[u.accountType]||u.accountType}</span></td>
                <td><span class="badge ${statusBadge[u.status]||'badge-muted'}">${statusLabel[u.status]||u.status}</span></td>
                <td style="font-size:12px;color:var(--text-muted)">${Utils.formatDate(u.createdAt)}</td>
                <td style="font-size:12px;color:var(--text-muted)">${u.lastLogin ? Utils.formatDate(u.lastLogin) : '—'}</td>
                <td>
                  <div style="display:flex;gap:5px;flex-wrap:wrap">
                    ${u.status === 'pending' ? `
                      <button class="btn btn-success btn-sm" onclick="ActivationPage.quickAction('${u._id}','approved')">✅ موافقة</button>
                      <button class="btn btn-danger  btn-sm" onclick="ActivationPage.quickAction('${u._id}','rejected')">❌ رفض</button>
                    ` : ''}
                    ${u.status === 'approved' ? `
                      <button class="btn btn-ghost btn-sm" onclick="ActivationPage.quickAction('${u._id}','suspended')">🚫 وقف</button>
                    ` : ''}
                    ${u.status === 'suspended' ? `
                      <button class="btn btn-success btn-sm" onclick="ActivationPage.quickAction('${u._id}','approved')">🔓 رفع الوقف</button>
                    ` : ''}
                    <button class="btn btn-primary btn-sm" onclick="ActivationPage.openEdit('${u._id}')">✏️ تعديل</button>
                    <button class="btn btn-danger btn-sm"  onclick="ActivationPage.deleteUser('${u._id}','${u.name}')">🗑️</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // ── موافقة / رفض / وقف سريع ──
  async function quickAction(userId, status) {
    try {
      await API.Auth.updateUser(userId, { status });
      const msg = { approved:'تم تفعيل الحساب ✅', rejected:'تم رفض الطلب ❌', suspended:'تم وقف الحساب 🚫' };
      Utils.showToast(msg[status]||'تم', 'success');
      await loadStats();
      await switchTab(_currentTab);
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  // ── فتح modal التعديل ──
  async function openEdit(userId) {
    const user = _allUsers.find(u => u._id === userId);
    if (!user) return;

    document.getElementById('edit-user-id').value      = user._id;
    document.getElementById('edit-user-name').value    = user.name;
    document.getElementById('edit-user-phone').value   = user.phone||'';
    document.getElementById('edit-user-status').value  = user.status;
    document.getElementById('edit-user-type').value    = user.accountType||'basic';
    document.getElementById('edit-user-expire').value  = user.expireDate ? user.expireDate.split('T')[0] : '';
    document.getElementById('edit-user-note').value    = user.note||'';
    document.getElementById('edit-user-newpass').value = '';

    document.getElementById('edit-user-modal').classList.add('active');
  }

  async function saveUser() {
    const id = document.getElementById('edit-user-id').value;
    const newpass = document.getElementById('edit-user-newpass').value;

    const data = {
      name:        document.getElementById('edit-user-name').value,
      phone:       document.getElementById('edit-user-phone').value,
      status:      document.getElementById('edit-user-status').value,
      accountType: document.getElementById('edit-user-type').value,
      expireDate:  document.getElementById('edit-user-expire').value || null,
      note:        document.getElementById('edit-user-note').value,
    };

    try {
      await API.Auth.updateUser(id, data);

      if (newpass.trim()) {
        if (newpass.length < 6) { Utils.showToast('كلمة المرور يجب 6 أحرف على الأقل', 'error'); return; }
        await API.Auth.resetUserPassword(id, newpass);
      }

      document.getElementById('edit-user-modal').classList.remove('active');
      Utils.showToast('تم حفظ التعديلات ✅', 'success');
      await loadStats();
      await switchTab(_currentTab);
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  async function deleteUser(userId, name) {
    if (!confirm(`هل تريد حذف "${name}" وجميع بياناته؟ لا يمكن التراجع!`)) return;
    try {
      await API.Auth.deleteUser(userId);
      Utils.showToast(`تم حذف "${name}"`, 'success');
      await loadStats();
      await switchTab(_currentTab);
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  // ─────────────────────────────────────────
  // تبويب قاعدة البيانات
  // ─────────────────────────────────────────
  function renderDBPanel() {
    const el = document.getElementById('tab-content');
    if (!el) return;

    el.innerHTML = `
      <div style="padding:8px 0">

        <!-- معلومات الاتصال -->
        <div class="card" style="margin-bottom:16px;background:rgba(22,163,74,0.06);border-color:rgba(22,163,74,0.2)">
          <div class="card-header">
            <div class="card-title"><div class="title-icon">🗄️</div>معلومات قاعدة البيانات</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">
            <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:14px">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">النوع</div>
              <div style="font-weight:700;color:var(--accent-light)">MongoDB Atlas</div>
            </div>
            <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:14px">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">الحالة</div>
              <div style="font-weight:700;color:#4ade80">🟢 متصل</div>
            </div>
            <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:14px">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">اسم قاعدة البيانات</div>
              <div style="font-weight:700;color:var(--text-main);font-family:monospace">aqsat_db</div>
            </div>
          </div>
        </div>

        <!-- كيف تضيف قاعدة بيانات MongoDB Atlas -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <div class="card-title"><div class="title-icon">☁️</div>إنشاء قاعدة بيانات MongoDB Atlas (مجاني)</div>
          </div>

          <div style="display:flex;flex-direction:column;gap:12px">

            <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:16px">
              <div style="font-size:13px;font-weight:700;color:var(--accent-light);margin-bottom:10px">الخطوات:</div>
              ${[
                ['1','اذهب لـ', 'mongodb.com/atlas', 'https://mongodb.com/atlas', '→ سجّل حساب مجاني'],
                ['2','اختر', 'Free Tier (M0)', null, '→ مجاني تماماً'],
                ['3','اختر مزود السحابة', 'AWS أو Google Cloud', null, 'والمنطقة الأقرب لك'],
                ['4','اضغط', 'Create Cluster', null, '→ ينشئ قاعدة البيانات'],
                ['5','من القائمة اختر', 'Database Access', null, '→ أضف مستخدم وكلمة مرور'],
                ['6','من القائمة اختر', 'Network Access', null, '→ اضغط Add IP → Allow All (0.0.0.0)'],
                ['7','اضغط', 'Connect → Drivers', null, '→ انسخ رابط الاتصال'],
                ['8','ضع الرابط في ملف', '.env', null, 'في المتغير MONGO_URI'],
              ].map(([num, pre, highlight, link, post]) => `
                <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px">
                  <div style="width:24px;height:24px;background:linear-gradient(135deg,var(--primary-light),var(--accent));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;color:#000">${num}</div>
                  <div style="font-size:13px;color:var(--text-light);line-height:1.6">
                    ${pre} ${link ? `<a href="${link}" target="_blank" style="color:var(--accent-light)">${highlight}</a>` : `<strong style="color:var(--accent-light)">${highlight}</strong>`} ${post}
                  </div>
                </div>`).join('')}
            </div>

            <!-- رابط الاتصال مثال -->
            <div style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:8px;padding:14px">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">📋 مثال على رابط الاتصال في ملف .env:</div>
              <div style="font-family:monospace;font-size:12px;color:#4ade80;line-height:1.8;word-break:break-all">
                MONGO_URI=mongodb+srv://<span style="color:var(--accent-light)">username</span>:<span style="color:#f87171">password</span>@cluster0.xxxxx.mongodb.net/<span style="color:#22d3ee">aqsat_db</span>?retryWrites=true&w=majority
              </div>
            </div>
          </div>
        </div>

        <!-- إجراءات قاعدة البيانات -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><div class="title-icon">⚙️</div>إجراءات قاعدة البيانات</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">

            <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:10px;padding:18px;text-align:center">
              <div style="font-size:28px;margin-bottom:8px">📤</div>
              <div style="font-weight:700;color:var(--text-main);margin-bottom:4px">تصدير البيانات</div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px">تنزيل كل البيانات كـ JSON</div>
              <button class="btn btn-primary btn-sm btn-block" onclick="ActivationPage.exportData()">تصدير</button>
            </div>

            <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:10px;padding:18px;text-align:center">
              <div style="font-size:28px;margin-bottom:8px">📥</div>
              <div style="font-weight:700;color:var(--text-main);margin-bottom:4px">استيراد بيانات</div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px">رفع ملف JSON من نسخة سابقة</div>
              <button class="btn btn-ghost btn-sm btn-block" onclick="document.getElementById('import-file').click()">استيراد</button>
              <input type="file" id="import-file" accept=".json" style="display:none" onchange="ActivationPage.importData(this)">
            </div>

            <div style="background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.2);border-radius:10px;padding:18px;text-align:center">
              <div style="font-size:28px;margin-bottom:8px">🗑️</div>
              <div style="font-weight:700;color:#f87171;margin-bottom:4px">حذف كل البيانات</div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px">احذف جميع الأقساط والتسديدات</div>
              <button class="btn btn-danger btn-sm btn-block" onclick="ActivationPage.clearAllData()">حذف الكل ⚠️</button>
            </div>

          </div>
        </div>

      </div>`;
  }

  // ── تصدير البيانات ──
  async function exportData() {
    try {
      Utils.showToast('جاري تصدير البيانات...', 'info');
      const [installments, payments] = await Promise.all([
        API.Installments.getAll(),
        API.Payments.getAll(),
      ]);
      const blob = new Blob([JSON.stringify({ installments, payments, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `aqsat-backup-${new Date().toLocaleDateString('en-CA')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Utils.showToast('تم تصدير البيانات ✅', 'success');
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  // ── استيراد بيانات ──
  async function importData(input) {
    const file = input.files[0];
    if (!file) return;
    if (!confirm('سيتم إضافة البيانات المستوردة. هل تريد المتابعة؟')) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      Utils.showToast('جاري الاستيراد...', 'info');

      let added = 0;
      for (const inst of (data.installments || [])) {
        try {
          await API.Installments.add(inst);
          added++;
        } catch {}
      }
      Utils.showToast(`تم استيراد ${added} قسط ✅`, 'success');
    } catch (e) {
      Utils.showToast('ملف غير صحيح: ' + e.message, 'error');
    }
    input.value = '';
  }

  // ── حذف كل البيانات ──
  async function clearAllData() {
    const confirmed = prompt('اكتب "حذف الكل" للتأكيد:');
    if (confirmed !== 'حذف الكل') return;

    try {
      const insts = await API.Installments.getAll();
      for (const inst of insts) {
        try { await API.Installments.remove(inst._id); } catch {}
      }
      Utils.showToast('تم حذف جميع البيانات', 'success');
    } catch (e) { Utils.showToast(e.message, 'error'); }
  }

  return {
    render, switchTab, filterUsers,
    quickAction, openEdit, saveUser, deleteUser,
    exportData, importData, clearAllData,
  };
})();
