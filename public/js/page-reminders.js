// ===== PAGE: التذكير =====

const RemindersPage = (() => {

  async function render() {
    const content = document.getElementById('page-reminders');
    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><div class="title-icon">🔔</div>تذكير المتأخرين</div>
          <button class="btn btn-ghost btn-sm" onclick="RemindersPage.render()">🔄 تحديث</button>
        </div>
        <div id="reminders-info" style="margin-bottom:16px;padding:12px 16px;background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.15);border-radius:8px;font-size:13px;color:var(--text-muted)">
          📅 يعرض هذه الصفحة العملاء الذين مضى على آخر تسديد لهم أكثر من <strong style="color:#f87171">29 يوماً</strong>
        </div>
        <div id="reminders-list"></div>
      </div>
    `;
    await loadReminders();
  }

  async function loadReminders() {
    const container = document.getElementById('reminders-list');
    if (!container) return;

    const installments = await DB.Installments.getAll();
    const active = installments.filter(i => i.status === 'active');

    const overdue = [];

    for (const inst of active) {
      const payments = await DB.Payments.getByInstallmentId(inst.id);
      let lastPaymentDate = null;
      let lastAmount = 0;

      if (payments.length > 0) {
        const sorted = payments.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
        lastPaymentDate = sorted[0].paidAt;
        lastAmount = sorted[0].amount;
      } else {
        lastPaymentDate = inst.createdAt;
        lastAmount = 0;
      }

      const days = Utils.daysSince(lastPaymentDate);

      if (days >= 29) {
        overdue.push({
          ...inst,
          lastPaymentDate,
          lastAmount,
          daysSince: days,
          remaining: inst.totalAmount - (inst.paidAmount || 0)
        });
      }
    }

    // تحديث الشارة
    const badge = document.getElementById('reminder-badge');
    if (badge) {
      badge.textContent = overdue.length;
      badge.style.display = overdue.length > 0 ? '' : 'none';
    }

    if (overdue.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>ممتاز!</h3>
          <p>لا يوجد عملاء متأخرون عن السداد</p>
        </div>
      `;
      return;
    }

    // ترتيب حسب الأيام (الأكثر تأخراً أولاً)
    overdue.sort((a, b) => b.daysSince - a.daysSince);

    container.innerHTML = overdue.map(item => `
      <div class="reminder-card">
        <div class="reminder-avatar">👤</div>
        <div class="reminder-info">
          <div class="reminder-name">${item.clientName}</div>
          <div class="reminder-detail">
            📱 ${item.clientPhone || 'لا يوجد رقم'} &nbsp;|&nbsp;
            آخر تسديد: ${item.lastAmount > 0 ? Utils.formatCurrency(item.lastAmount) : 'لا يوجد'}
            &nbsp;|&nbsp;
            📅 ${Utils.formatDate(item.lastPaymentDate)}
          </div>
          <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <span class="badge badge-danger">متبقي: ${Utils.formatCurrency(item.remaining)}</span>
            <span class="badge badge-muted">قسط شهري: ${Utils.formatCurrency(item.monthlyAmount)}</span>
          </div>
        </div>
        <div class="reminder-days">
          <div class="days-num">${item.daysSince}</div>
          <div class="days-label">يوم</div>
        </div>
        <div class="d-flex gap-2" style="flex-direction:column">
          ${item.clientPhone ? `
            <button class="btn btn-success btn-sm" onclick="Utils.sendWhatsApp('${item.clientPhone}','${item.clientName}',${item.monthlyAmount},${item.daysSince})">
              <span>📲</span> واتساب
            </button>
          ` : `<span class="badge badge-danger">لا يوجد هاتف</span>`}
          <button class="btn btn-accent btn-sm" onclick="PaymentsPage.openDetail(${item.id});Utils.showPage('page-payments')">
            💳 تسديد
          </button>
        </div>
      </div>
    `).join('');
  }

  return { render, loadReminders };
})();
