// ===== PAGE: إضافة القسط =====

const AddInstallmentPage = (() => {

  async function render() {
    const content = document.getElementById('page-add');
    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <div class="title-icon">➕</div>
            إضافة قسط جديد
          </div>
        </div>
        <div class="form-grid" id="add-form">
          <div class="form-group">
            <label>اسم العميل <span class="req">*</span></label>
            <input type="text" class="form-control" id="f-name" placeholder="أدخل اسم العميل">
          </div>
          <div class="form-group">
            <label>رقم الهاتف <span class="req">*</span></label>
            <input type="tel" class="form-control" id="f-phone" placeholder="07XXXXXXXXX" style="direction:ltr;text-align:right">
          </div>
          <div class="form-group">
            <label>سعر البيع مع التحميل <span class="req">*</span></label>
            <div class="input-group">
              <input type="text" class="form-control" id="f-total" placeholder="0">
              <span class="input-suffix">د.ع</span>
            </div>
          </div>
          <div class="form-group">
            <label>عدد الأشهر <span class="req">*</span></label>
            <input type="number" class="form-control" id="f-months" placeholder="مثال: 12" min="1" max="120">
          </div>
          <div class="form-group">
            <label>القسط الشهري (تلقائي)</label>
            <div class="input-group">
              <input type="text" class="form-control" id="f-monthly" readonly placeholder="يحسب تلقائياً">
              <span class="input-suffix">د.ع</span>
            </div>
          </div>
          <div class="form-group">
            <label>ملاحظات</label>
            <input type="text" class="form-control" id="f-note" placeholder="ملاحظات اختيارية">
          </div>
          <div class="form-group">
            <label>التاريخ والوقت</label>
            <input type="text" class="form-control" id="f-datetime" readonly>
          </div>
        </div>

        <div class="divider"></div>

        <div class="d-flex gap-3">
          <button class="btn btn-accent btn-lg" onclick="AddInstallmentPage.save()">
            💾 حفظ القسط
          </button>
          <button class="btn btn-ghost" onclick="AddInstallmentPage.reset()">
            🔄 إعادة تعيين
          </button>
        </div>
      </div>

      <!-- قائمة الأقساط الأخيرة -->
      <div class="card mt-6">
        <div class="card-header">
          <div class="card-title"><div class="title-icon">📋</div>آخر الأقساط المضافة</div>
        </div>
        <div id="recent-installments">
          <div class="empty-state"><div class="empty-icon">📭</div><p>لا توجد أقساط بعد</p></div>
        </div>
      </div>
    `;

    // تطبيق تنسيق الأرقام
    Utils.applyNumberFormat(document.getElementById('f-total'));

    // تحديث القسط الشهري تلقائياً
    const fTotal = document.getElementById('f-total');
    const fMonths = document.getElementById('f-months');
    const fMonthly = document.getElementById('f-monthly');

    function updateMonthly() {
      const total = Utils.parseAmount(fTotal.value);
      const months = parseInt(fMonths.value) || 0;
      if (total > 0 && months > 0) {
        const monthly = Utils.calcMonthly(total, months);
        fMonthly.value = monthly.toLocaleString('ar-IQ');
      } else {
        fMonthly.value = '';
      }
    }

    fTotal.addEventListener('input', updateMonthly);
    fMonths.addEventListener('input', updateMonthly);

    // تحديث التاريخ والوقت
    function updateTime() {
      const now = new Date();
      document.getElementById('f-datetime').value = Utils.formatDateTime(now.toISOString());
    }
    updateTime();
    setInterval(updateTime, 60000);

    await loadRecent();
  }

  async function loadRecent() {
    const container = document.getElementById('recent-installments');
    if (!container) return;
    const all = await DB.Installments.getAll();
    const sorted = all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

    if (sorted.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>لا توجد أقساط بعد</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم العميل</th>
              <th>رقم الهاتف</th>
              <th>المبلغ الكلي</th>
              <th>القسط الشهري</th>
              <th>عدد الأشهر</th>
              <th>الحالة</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map((inst, i) => `
              <tr>
                <td>${i + 1}</td>
                <td class="td-name">${inst.clientName}</td>
                <td class="td-phone">${inst.clientPhone}</td>
                <td class="td-amount">${Utils.formatCurrency(inst.totalAmount)}</td>
                <td class="td-amount" style="color:#94a3b8">${Utils.formatCurrency(inst.monthlyAmount)}</td>
                <td>${inst.months} شهر</td>
                <td>${inst.status === 'paid'
                  ? '<span class="badge badge-success">✅ مسدد</span>'
                  : '<span class="badge badge-warning">⏳ جاري</span>'}</td>
                <td>${Utils.formatDate(inst.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async function save() {
    const name = document.getElementById('f-name').value.trim();
    const phone = document.getElementById('f-phone').value.trim();
    const total = Utils.parseAmount(document.getElementById('f-total').value);
    const months = parseInt(document.getElementById('f-months').value) || 0;
    const note = document.getElementById('f-note').value.trim();

    if (!name) return Utils.toast('يرجى إدخال اسم العميل', 'error');
    if (!phone) return Utils.toast('يرجى إدخال رقم الهاتف', 'error');
    if (!total || total <= 0) return Utils.toast('يرجى إدخال المبلغ الصحيح', 'error');
    if (!months || months <= 0) return Utils.toast('يرجى إدخال عدد الأشهر', 'error');

    const monthly = Utils.calcMonthly(total, months);

    try {
      // تحقق إذا كان العميل موجود
      const clients = await DB.Clients.getAll();
      let client = clients.find(c => c.phone === phone);
      let clientId;

      if (!client) {
        clientId = await DB.Clients.add({ name, phone, active: true });
      } else {
        clientId = client.id;
      }

      await DB.Installments.add({
        clientId,
        clientName: name,
        clientPhone: phone,
        totalAmount: total,
        monthlyAmount: monthly,
        months,
        note
      });

      Utils.toast(`تم إضافة قسط العميل "${name}" بنجاح ✅`, 'success');
      reset();
      await loadRecent();
      await updateDashboardStats();
    } catch (e) {
      Utils.toast('حدث خطأ أثناء الحفظ', 'error');
      console.error(e);
    }
  }

  function reset() {
    ['f-name', 'f-phone', 'f-total', 'f-months', 'f-monthly', 'f-note'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  return { render, save, reset, loadRecent };
})();
