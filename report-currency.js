/* =========================================================
   تقرير مفصول حسب العملة
   هذا الملف يضيف تقرير جديد بدون تغيير أي بيانات
   يعتمد على state.data و reportBox الموجودين في index.html
========================================================= */

(function () {

  function buildCurrencySeparatedReport() {
    const clientName = window.reportClientSelect?.value;
    if (!clientName) {
      alert("اختر عميل أولاً");
      return;
    }

    const data = window.state?.data;
    if (!data || !data.clients || !data.clients[clientName]) {
      alert("لا توجد بيانات لهذا العميل");
      return;
    }

    const client = data.clients[clientName];
    const statements = client.statements || [];

    if (!statements.length) {
      document.getElementById("reportBox").textContent =
        "لا توجد كشوف لهذا العميل.";
      return;
    }

    // تجميع حسب العملة
    const currencyMap = {};

    statements.forEach(st => {
      (st.entries || []).forEach(e => {
        if (!currencyMap[e.currency]) {
          currencyMap[e.currency] = {
            entries: [],
            lah: 0,
            alaih: 0
          };
        }

        currencyMap[e.currency].entries.push({
          date: st.date || "",
          title: st.title || "بدون عنوان",
          amount: e.amount,
          direction: e.direction
        });

        if (e.direction === "له") {
          currencyMap[e.currency].lah += e.amount;
        } else {
          currencyMap[e.currency].alaih += e.amount;
        }
      });
    });

    let html = `<h3 style="margin-top:0;">تقرير مفصول حسب العملة للعميل: ${clientName}</h3>`;

    const finalTotals = {};

    Object.keys(currencyMap).forEach(curr => {
      const block = currencyMap[curr];
      const diff = block.lah - block.alaih;
      const dir = diff > 0 ? "له" : (diff < 0 ? "عليه" : "متساوي");

      finalTotals[curr] = {
        lah: block.lah,
        alaih: block.alaih,
        diff: diff
      };

      html += `
        <hr>
        <h4>💱 العملة: ${curr}</h4>

        <table>
          <thead>
            <tr>
              <th>إجمال له</th>
              <th>إجمال عليه</th>
              <th>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${block.lah}</td>
              <td>${block.alaih}</td>
              <td>${Math.abs(diff)} (${dir})</td>
            </tr>
          </tbody>
        </table>

        <h5 style="margin-top:8px;">تفاصيل الحركات</h5>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>البيان</th>
              <th>المبلغ</th>
              <th>له/عليه</th>
            </tr>
          </thead>
          <tbody>
      `;

      block.entries.forEach(en => {
        html += `
          <tr>
            <td>${en.date}</td>
            <td>${en.title}</td>
            <td>${en.amount}</td>
            <td>${en.direction}</td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
    });

    // ملخص نهائي
    html += `
      <hr>
      <h3>📌 ملخص جميع العملات</h3>
      <table>
        <thead>
          <tr>
            <th>العملة</th>
            <th>إجمال له</th>
            <th>إجمال عليه</th>
            <th>الرصيد</th>
          </tr>
        </thead>
        <tbody>
    `;

    Object.keys(finalTotals).forEach(c => {
      const t = finalTotals[c];
      const dir = t.diff > 0 ? "له" : (t.diff < 0 ? "عليه" : "متساوي");
      html += `
        <tr>
          <td>${c}</td>
          <td>${t.lah}</td>
          <td>${t.alaih}</td>
          <td>${Math.abs(t.diff)} (${dir})</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;

    const reportBox = document.getElementById("reportBox");
    reportBox.innerHTML = html;
  }

  // ربط الدالة بالزر الجديد
  window.buildCurrencySeparatedReport = buildCurrencySeparatedReport;

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("buildCurrencySeparatedBtn");
    if (btn) {
      btn.onclick = buildCurrencySeparatedReport;
    }
  });

})();
