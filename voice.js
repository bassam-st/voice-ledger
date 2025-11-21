// ============================
//   مساعد بسّام الصوتي الذكي
//   يعمل بدون اشتراكات (محلي)
//   يدعم: إضافة بند – مبلغ – عملة – له/عليه – اسم عميل – عنوان – وصف بند
//   + ذكاء للتعرف على أسماء العملاء
// ============================

(function () {

  // زر المساعد
  const btn = document.getElementById("voiceAssistantBtn");

  if (!btn) {
    console.warn("زر المساعد الصوتي غير موجود في الصفحة");
    return;
  }

  // هل المتصفح يدعم الصوت؟
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    btn.disabled = true;
    btn.textContent = "🎤 جهازك لا يدعم الميكروفون";
    return;
  }

  // إنشاء محرك التعرف
  const recognition = new SpeechRecognition();
  recognition.lang = "ar-SA";
  recognition.interimResults = false;

  let listening = false;

  // الضغط على الزر
  btn.addEventListener("click", () => {
    if (listening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (_) {}
    }
  });

  recognition.onstart = () => {
    listening = true;
    btn.textContent = "🎙️ يستمع لك يا بسام...";
    btn.style.background = "#b91c1c";
  };

  recognition.onend = () => {
    listening = false;
    btn.textContent = "🎤 مساعد بسام الصوتي";
    btn.style.background = "#15803d";
  };

  recognition.onerror = (e) => {
    listening = false;
    btn.textContent = "🎤 مساعد بسام الصوتي";
    alert("خطأ في الميكروفون: " + e.error);
  };

  // ============================
  //   الرد بالصوت
  // ============================
  function say(msg) {
    try {
      const u = new SpeechSynthesisUtterance(msg);
      u.lang = "ar-SA";
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ============================
  //   استقبال الأمر الصوتي
  // ============================
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.trim();
    console.log("🗣️ أمر صوتي:", text);
    handleCommand(text);
  };

  // ============================
  //   سطح التطبيق (DOM)
  // ============================
  const el = (id) => document.getElementById(id);

  const clientName = el("clientName");
  const dateInput = el("statementDate");
  const titleInput = el("statementTitle");
  const entriesContainer = el("entriesContainer");
  const manualTotal = el("manualTotal");
  const extraNotes = el("extraNotes");

  // ============================
  //   وظائف أساسية
  // ============================
  function addEntry() {
    const addBtn = el("addEntryBtn");
    if (addBtn) addBtn.click();
  }

  function getLastEntry() {
    if (!entriesContainer || !entriesContainer.children.length) return null;
    return entriesContainer.children[entriesContainer.children.length - 1];
  }

  // ============================
  //   معالجة الأوامر
  // ============================
  function handleCommand(raw) {
    const text = normalize(raw);

    // ======== تحية ========
    if (text.includes("السلام") || text.includes("مرحبا")) {
      say("هلا يا بسام، أنا جاهز أساعدك في كشف الحساب");
      return;
    }

    // ======== كشف جديد ========
    if (text.includes("كشف جديد") || text.includes("افتح كشف")) {
      resetForm(clientName.value);
      say("تم فتح كشف جديد يا بسّام");
      return;
    }

    // ======== إضافة بند ========
    if (text.includes("بند جديد") || text.includes("اضف بند") || text.includes("ضيف بند") || text.includes("زود بند")) {
      addEntry();
      say("تم إضافة بند جديد");
      return;
    }

    // ======== اسم العميل ========
    if (text.startsWith("اسم العميل") || text.startsWith("العميل")) {
      const name = text.replace("اسم العميل", "").replace("العميل", "").trim();
      const best = bestClientMatch(name);

      clientName.value = best.name;
      say("سجلت اسم العميل " + best.name);
      return;
    }

    // ======== عنوان الكشف ========
    if (text.startsWith("عنوان الكشف") || text.startsWith("العنوان")) {
      const title = text.replace("عنوان الكشف", "").replace("العنوان", "").trim();
      titleInput.value = title;
      say("تم تسجيل عنوان الكشف");
      return;
    }

    // ======== وصف البند ========
    if (text.startsWith("وصف البند")) {
      const desc = text.replace("وصف البند", "").trim();
      const row = getLastEntry();
      if (!row) return say("أضف بند أولاً يا بسّام");

      row.querySelector(".entry-desc").value = desc;
      say("تم تسجيل وصف البند");
      return;
    }

    // ======== مبلغ ========
    if (text.includes("المبلغ") || text.includes("ادخل المبلغ")) {
      const num = extractNumber(text);
      const row = getLastEntry();
      if (!row) return say("ما في بند تضيف له مبلغ");

      row.querySelector(".entry-amount").value = num;
      say("تم تسجيل المبلغ " + num);
      return;
    }

    // ======== عملة ========
    if (text.includes("عملة") || text.includes("العملة")) {
      const row = getLastEntry();
      if (!row) return say("لا يوجد بند لأحدد العملة");

      const c = text.includes("سعودي")
        ? "سعودي"
        : text.includes("يمني")
        ? "يمني"
        : text.includes("دولار")
        ? "دولار"
        : text.includes("درهم")
        ? "درهم"
        : "يمني";

      row.querySelector(".entry-curr").value = c;
      say("تم تحديد العملة " + c);
      return;
    }

    // ======== له / عليه ========
    if (text.includes("خله له") || text.includes("له")) {
      const row = getLastEntry();
      if (!row) return say("أضف بند أولاً");
      row.querySelector(".entry-dir").value = "له";
      say("تم تعيينها له");
      return;
    }

    if (text.includes("خله عليه") || text.includes("عليه")) {
      const row = getLastEntry();
      if (!row) return say("أضف بند أولاً");
      row.querySelector(".entry-dir").value = "عليه";
      say("تم تعيينها عليه");
      return;
    }

    // ======== حفظ الكشف ========
    if (text.includes("احفظ") || text.includes("سجل الكشف")) {
      const saveBtn = el("saveStatementBtn");
      if (saveBtn) saveBtn.click();
      say("تم حفظ الكشف يا بسام");
      return;
    }

    // ======== لم يفهم الأمر ========
    say("ما فهمت الأمر يا بسام. حاول تعيده بشكل أبسط.");
  }

  // ============================
  //   دوال الذكاء
  // ============================
  function normalize(str) {
    return String(str).trim().toLowerCase();
  }

  function extractNumber(text) {
    const map = { "٠": "0","١": "1","٢": "2","٣": "3","٤": "4","٥": "5","٦": "6","٧": "7","٨": "8","٩": "9" };
    let fixed = "";
    for (const ch of text) fixed += map[ch] || ch;
    const m = fixed.match(/\d+/g);
    return m ? Number(m.join("")) : 0;
  }

  function getAllClientNames() {
    try {
      const raw = localStorage.getItem("voiceLedgerData_v1");
      const data = raw ? JSON.parse(raw) : {};
      return Object.keys(data.clients || {});
    } catch (_) {
      return [];
    }
  }

  function similarity(a, b) {
    a = normalize(a);
    b = normalize(b);
    if (!a || !b) return 0;

    const distance = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    return 1 - distance / maxLen;
  }

  function bestClientMatch(name) {
    const all = getAllClientNames();
    if (!all.length) return { name, score: 0 };

    let best = name;
    let bestScore = 0;

    all.forEach((n) => {
      const s = similarity(name, n);
      if (s > bestScore) {
        bestScore = s;
        best = n;
      }
    });

    return bestScore > 0.45 ? { name: best, score: bestScore } : { name, score: bestScore };
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  }

})();
