(function () {

  function buildCurrencySeparatedReport() {
    const sel = document.getElementById("reportClientSelect");
    const reportBox = document.getElementById("reportBox");
    if (!sel || !reportBox) return;

    const clientName = sel.value;
    if (!clientName) { alert("اختر عميل أولاً"); return; }

    if (!window.state || !state.data || !state.data.clients[clientName]) {
      alert("لا توجد بيانات لهذا العميل");
      return;
    }

    const client = state.data.clients[clientName];
    const statements = client.statements || [];
    if (!statements.length) {
      reportBox.textContent = "لا توجد كشوف لهذا العميل.";
      return;
    }

    const currencyMap = {};

    statements.forEach(st => {
      (st.entries || []).forEach(e => {
        if (!currencyMap[e.currency]) {
          currencyMap[e.currency] = { entries: [], lah:0, alaih:0 };
        }
        currencyMap[e.currency].entries.push({
          date: st.date || "",
          title: st.title || "بدون عنوان",
          amount: e.amount,
          direction: e.direction
        });
        if (e.direction === "له") currencyMap[e.currency].lah += e.amount;
        else currencyMap[e.currency].alaih += e.amount;
      });
    });

    let html = `<h3 style="margin-top:0;">تقرير مفصول حسب العملة للعميل: ${clientName}</h3>`;
    const finalTotals = {};

    Object.keys(currencyMap).forEach(curr => {
      const b = currencyMap[curr];
      const balance = b.lah - b.alaih;
      const dir = balance>0 ? "له" : (balance<0 ? "عليه" : "متساوي");

      finalTotals[curr] = { lah:b.lah, alaih:b.alaih, balance };

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
            <td>${b.lah}</td>
            <td>${b.alaih}</td>
            <td>${Math.abs(balance)} (${dir})</td>
          </tr>
        </tbody>
      </table>

      <h5>تفاصيل الحركات (مع الرصيد التراكمي)</h5>
      <table>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>البيان</th>
            <th>المبلغ</th>
            <th>له/عليه</th>
            <th>الرصيد</th>
          </tr>
        </thead>
        <tbody>`;

      let running = 0;
      b.entries.forEach(en=>{
        const amt = Number(en.amount||0)||0;
        running += (en.direction === "له") ? amt : -amt;

        html += `<tr>
          <td>${en.date}</td>
          <td>${en.title}</td>
          <td>${amt}</td>
          <td>${en.direction}</td>
          <td>${running}</td>
        </tr>`;
      });

      html += `</tbody></table>`;
    });

    html += `<hr><h3>📌 ملخص جميع العملات</h3>
    <table>
      <thead>
        <tr>
          <th>العملة</th>
          <th>إجمال له</th>
          <th>إجمال عليه</th>
          <th>الرصيد</th>
        </tr>
      </thead>
      <tbody>`;

    Object.keys(finalTotals).forEach(c=>{
      const t = finalTotals[c];
      const dir = t.balance>0 ? "له" : (t.balance<0 ? "عليه" : "متساوي");
      html += `<tr>
        <td>${c}</td>
        <td>${t.lah}</td>
        <td>${t.alaih}</td>
        <td>${Math.abs(t.balance)} (${dir})</td>
      </tr>`;
    });

    html += `</tbody></table>`;
    reportBox.innerHTML = html;
  }

  window.buildCurrencySeparatedReport = buildCurrencySeparatedReport;

  document.addEventListener("DOMContentLoaded", ()=>{
    const btn = document.getElementById("buildCurrencySeparatedBtn");
    if (btn) btn.onclick = buildCurrencySeparatedReport;
  });

})();