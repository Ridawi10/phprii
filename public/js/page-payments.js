// ===== PAGE: التسديد =====

const PaymentsPage = (() => {
  let allInstallments = [];
  let selectedInstallment = null;
  let editingPaymentId = null;

  async function render() {
    const content = document.getElementById('page-payments');
    content.innerHTML = `
      <!-- بحث العملاء -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><div class="title-icon">💳</div>التسديد</div>
        </div>
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" class="form-control" id="search-client" placeholder="ابحث باسم العميل أو رقم الهاتف..." oninput="PaymentsPage.search(this.value)">
        </div>
        <div id="clients-list"></div>
      </div>

      <!-- تفاصيل العميل -->
      <div id="client-detail-section" class="hidden mt-6">
        <div class="card">
          <div class="card-header">
            <div class="card-title" id="detail-client-name">📌 تفاصيل العميل</div>
            <button class="btn btn-ghost btn-sm" onclick="PaymentsPage.closeDetail()">✖ إغلاق</button>
          </div>
          <div class="payment-summary" id="payment-summary"></div>
          <div class="divider"></div>
          <!-- استلام مبلغ -->
          <div class="form-grid" style="margin-bottom:16px">
            <div class="form-group">
              <label>المبلغ المستلم <span class="req">*</span></label>
              <div class="input-group">
                <input type="text" class="form-control" id="receive-amount" placeholder="أدخل المبلغ">
                <span class="input-suffix">د.ع</span>
              </div>
              <small id="suggested-amount" style="color:var(--accent-light);font-size:12px;margin-top:4px"></small>
            </div>
            <div class="form-group">
              <label>ملاحظة</label>
              <input type="text" class="form-control" id="receive-note" placeholder="ملاحظة اختيارية">
            </div>
          </div>
          <button class="btn btn-success" id="save-payment-btn" onclick="PaymentsPage.savePayment()">
            💰 حفظ التسديد
          </button>
        </div>

        <!-- سجل التسديدات -->
        <div class="card mt-6">
          <div class="card-header">
            <div class="card-title"><div class="title-icon">📜</div>سجل التسديدات</div>
          </div>
          <div id="payments-history"></div>
        </div>
      </div>

      <!-- Modal تعديل تسديد -->
      <div class="modal-overlay" id="edit-payment-modal">
        <div class="modal" style="max-width:420px">
          <div class="modal-header">
            <span class="modal-title">✏️ تعديل التسديد</span>
            <button class="modal-close" onclick="Utils.closeModal('edit-payment-modal')">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>المبلغ المسدد</label>
              <div class="input-group">
                <input type="text" class="form-control" id="edit-pay-amount" placeholder="0">
                <span class="input-suffix">د.ع</span>
              </div>
            </div>
            <div class="form-group mt-4">
              <label>ملاحظة</label>
              <input type="text" class="form-control" id="edit-pay-note" placeholder="ملاحظة">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="Utils.closeModal('edit-payment-modal')">إلغاء</button>
            <button class="btn btn-primary" onclick="PaymentsPage.confirmEditPayment()">💾 حفظ التعديل</button>
          </div>
        </div>
      </div>
    `;

    Utils.applyNumberFormat(document.getElementById('receive-amount'));
    await loadClientsList('');
  }

  async function loadClientsList(query) {
    const container = document.getElementById('clients-list');
    if (!container) return;

    allInstallments = await DB.Installments.getAll();
    const active = allInstallments.filter(i => i.status === 'active');

    let filtered = active;
    if (query) {
      const q = query.toLowerCase();
      filtered = active.filter(i =>
        i.clientName.toLowerCase().includes(q) ||
        (i.clientPhone && i.clientPhone.includes(q))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>لا توجد نتائج</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>اسم العميل</th>
              <th>رقم الهاتف</th>
              <th>المبلغ الكلي</th>
              <th>المسدد</th>
              <th>المتبقي</th>
              <th>القسط الشهري</th>
              <th>التقدم</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(inst => {
              const remaining = inst.totalAmount - (inst.paidAmount || 0);
              const pct = Math.min(100, Math.round(((inst.paidAmount || 0) / inst.totalAmount) * 100));
              return `
                <tr>
                  <td class="td-name">${Utils.highlight(inst.clientName, query)}</td>
                  <td class="td-phone">${inst.clientPhone || '-'}</td>
                  <td class="td-amount">${Utils.formatCurrency(inst.totalAmount)}</td>
                  <td style="color:#4ade80;font-weight:700">${Utils.formatCurrency(inst.paidAmount || 0)}</td>
                  <td style="color:#f87171;font-weight:700">${Utils.formatCurrency(remaining)}</td>
                  <td class="td-amount" style="color:#94a3b8">${Utils.formatCurrency(inst.monthlyAmount)}</td>
                  <td style="min-width:80px">
                    <div class="progress-bar-wrap">
                      <div class="progress-bar" style="width:${pct}%"></div>
                    </div>
                    <small style="color:var(--text-muted);font-size:10px">${pct}%</small>
                  </td>
                  <td>
                    <button class="btn btn-accent btn-sm" onclick="PaymentsPage.openDetail(${inst.id})">
                      💳 تسديد
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function search(val) {
    loadClientsList(val);
  }

  async function openDetail(installmentId) {
    selectedInstallment = await DB.Installments.getById(installmentId);
    if (!selectedInstallment) return;

    document.getElementById('client-detail-section').classList.remove('hidden');
    document.getElementById('detail-client-name').innerHTML =
      `<div class="title-icon">👤</div>${selectedInstallment.clientName}`;

    // المبلغ المقترح
    document.getElementById('suggested-amount').textContent =
      `القسط الشهري المعتاد: ${Utils.formatCurrency(selectedInstallment.monthlyAmount)}`;
    document.getElementById('receive-amount').value =
      selectedInstallment.monthlyAmount.toLocaleString('ar-IQ');
    document.getElementById('receive-note').value = '';

    updateSummary();
    await loadPaymentsHistory(installmentId);

    // تمرير لأسفل
    document.getElementById('client-detail-section').scrollIntoView({ behavior: 'smooth' });
  }

  function updateSummary() {
    if (!selectedInstallment) return;
    const paid = selectedInstallment.paidAmount || 0;
    const remaining = selectedInstallment.totalAmount - paid;
    const pct = Math.min(100, Math.round((paid / selectedInstallment.totalAmount) * 100));

    document.getElementById('payment-summary').innerHTML = `
      <div class="summary-item">
        <div class="s-val">${Utils.formatCurrency(selectedInstallment.totalAmount)}</div>
        <div class="s-label">المبلغ الكلي</div>
      </div>
      <div class="summary-item">
        <div class="s-val" style="color:#4ade80">${Utils.formatCurrency(paid)}</div>
        <div class="s-label">المسدد</div>
      </div>
      <div class="summary-item">
        <div class="s-val" style="color:#f87171">${Utils.formatCurrency(remaining)}</div>
        <div class="s-label">المتبقي</div>
      </div>
      <div style="grid-column:1/-1">
        <div class="progress-bar-wrap" style="height:10px">
          <div class="progress-bar" style="width:${pct}%"></div>
        </div>
        <small style="color:var(--text-muted);font-size:11px;display:block;margin-top:4px;text-align:center">${pct}% مسدد</small>
      </div>
    `;
  }

  async function loadPaymentsHistory(installmentId) {
    const container = document.getElementById('payments-history');
    if (!container) return;

    const payments = await DB.Payments.getByInstallmentId(installmentId);
    const sorted = payments.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

    if (sorted.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">💸</div><p>لا توجد تسديدات بعد</p></div>`;
      return;
    }

    container.innerHTML = sorted.map((p, i) => `
      <div class="payment-history-item">
        <div style="font-size:22px">💰</div>
        <div style="flex:1">
          <div style="font-weight:700;color:var(--text-main)">${Utils.formatCurrency(p.amount)}</div>
          <div style="font-size:12px;color:var(--text-muted)">${Utils.formatDateTime(p.paidAt)}${p.note ? ' · ' + p.note : ''}</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-ghost btn-sm" onclick="PaymentsPage.editPayment(${p.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="PaymentsPage.deletePayment(${p.id})">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  async function savePayment() {
    if (!selectedInstallment) return;
    const amount = Utils.parseAmount(document.getElementById('receive-amount').value);
    const note = document.getElementById('receive-note').value.trim();

    if (!amount || amount <= 0) return Utils.toast('يرجى إدخال مبلغ صحيح', 'error');

    try {
      await DB.Payments.add({
        installmentId: selectedInstallment.id,
        clientId: selectedInstallment.clientId,
        clientName: selectedInstallment.clientName,
        amount,
        note
      });

      selectedInstallment = await DB.Installments.getById(selectedInstallment.id);
      updateSummary();
      await loadPaymentsHistory(selectedInstallment.id);
      document.getElementById('receive-amount').value = selectedInstallment.monthlyAmount.toLocaleString('ar-IQ');
      document.getElementById('receive-note').value = '';

      Utils.toast(`تم تسجيل تسديد ${Utils.formatCurrency(amount)} ✅`, 'success');
      await loadClientsList(document.getElementById('search-client').value);
      await updateDashboardStats();
    } catch (e) {
      Utils.toast('حدث خطأ أثناء الحفظ', 'error');
    }
  }

  async function editPayment(paymentId) {
    editingPaymentId = paymentId;
    const p = await DB.Payments.getById(paymentId);
    if (!p) return;
    Utils.applyNumberFormat(document.getElementById('edit-pay-amount'));
    document.getElementById('edit-pay-amount').value = p.amount.toLocaleString('ar-IQ');
    document.getElementById('edit-pay-note').value = p.note || '';
    Utils.openModal('edit-payment-modal');
  }

  async function confirmEditPayment() {
    if (!editingPaymentId) return;
    const amount = Utils.parseAmount(document.getElementById('edit-pay-amount').value);
    const note = document.getElementById('edit-pay-note').value.trim();

    if (!amount || amount <= 0) return Utils.toast('يرجى إدخال مبلغ صحيح', 'error');

    const p = await DB.Payments.getById(editingPaymentId);
    await DB.Payments.update({ ...p, amount, note });
    selectedInstallment = await DB.Installments.getById(p.installmentId);
    updateSummary();
    await loadPaymentsHistory(p.installmentId);
    Utils.closeModal('edit-payment-modal');
    Utils.toast('تم تعديل التسديد ✅', 'success');
    editingPaymentId = null;
  }

  async function deletePayment(paymentId) {
    if (!Utils.confirmDelete('هل تريد حذف هذا التسديد نهائياً؟')) return;
    const p = await DB.Payments.getById(paymentId);
    await DB.Payments.remove(paymentId);
    selectedInstallment = await DB.Installments.getById(p.installmentId);
    updateSummary();
    await loadPaymentsHistory(p.installmentId);
    await loadClientsList(document.getElementById('search-client').value);
    Utils.toast('تم حذف التسديد', 'info');
  }

  function closeDetail() {
    document.getElementById('client-detail-section').classList.add('hidden');
    selectedInstallment = null;
  }

  return { render, search, openDetail, savePayment, editPayment, confirmEditPayment, deletePayment, closeDetail };
})();
