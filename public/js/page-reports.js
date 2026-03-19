// ===== PAGE: التقارير =====

const ReportsPage = (() => {

  async function render() {
    const content = document.getElementById('page-reports');
    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><div class="title-icon">📊</div>التقارير والسجلات</div>
          <div class="d-flex gap-2">
            <select class="form-control" id="filter-type" onchange="ReportsPage.filter()" style="width:auto;padding:8px 12px">
              <option value="">جميع السجلات</option>
              <option value="installment_add">إضافة أقساط</option>
              <option value="payment">تسديدات</option>
              <option value="payment_delete">حذف تسديد</option>
              <option value="client_add">عملاء جدد</option>
            </select>
          </div>
        </div>
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" class="form-control" id="search-log" placeholder="ابحث باسم العميل..." oninput="ReportsPage.filter()">
        </div>
        <div id="logs-table"></div>
      </div>
    `;
    await loadLogs();
  }

  async function loadLogs(query = '', typeFilter = '') {
    const container = document.getElementById('logs-table');
    if (!container) return;

    let logs = await DB.Logs.getAll();

    if (typeFilter) logs = logs.filter(l => l.type === typeFilter);
    if (query) {
      const q = query.toLowerCase();
      logs = logs.filter(l => l.clientName && l.clientName.toLowerCase().includes(q));
    }

    if (logs.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>لا توجد سجلات</p></div>`;
      return;
    }

    const typeLabels = {
      installment_add: { label: '➕ إضافة قسط', badge: 'badge-info' },
      payment: { label: '💰 تسديد', badge: 'badge-success' },
      payment_delete: { label: '🗑️ حذف تسديد', badge: 'badge-danger' },
      client_add: { label: '👤 عميل جديد', badge: 'badge-muted' },
    };

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>النوع</th>
              <th>اسم العميل</th>
              <th>المبلغ</th>
              <th>الملاحظة</th>
              <th>التاريخ والوقت</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map((log, i) => {
              const t = typeLabels[log.type] || { label: log.type, badge: 'badge-muted' };
              return `
                <tr>
                  <td style="color:var(--text-muted)">${i + 1}</td>
                  <td><span class="badge ${t.badge}">${t.label}</span></td>
                  <td class="td-name">${log.clientName || '-'}</td>
                  <td class="td-amount">${log.amount ? Utils.formatCurrency(log.amount) : '-'}</td>
                  <td style="color:var(--text-muted);font-size:12px">${log.note || '-'}</td>
                  <td style="font-size:12px;color:var(--text-muted)">${Utils.formatDateTime(log.createdAt)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function filter() {
    const q = document.getElementById('search-log')?.value || '';
    const t = document.getElementById('filter-type')?.value || '';
    loadLogs(q, t);
  }

  return { render, filter };
})();
