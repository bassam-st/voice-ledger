// voice.js — مساعد بسّام الصوتي الذكي (نسخة مطوّرة)
// يدعم:
// 1) أوامر ثابتة (كشف جديد، اسم العميل، وصف البند، المبلغ، العملة، له/عليه، حفظ...)
// 2) محاولة ذكاء أعلى عبر API خارجي (Smart AI) إذا لم يفهم الأوامر الثابتة

(function () {
  const btn = document.getElementById("voiceAssistantBtn");
  if (!btn) return;

  // ===== إعداد التعرف على الصوت =====
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    btn.disabled = true;
    btn.textContent = "🎤 المساعد الصوتي غير مدعوم في هذا المتصفح";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ar-SA"; // للهجة الخليج/اليمن
  recognition.interimResults = false;

  let listening = false;

  // ===== إعداد عنوان API للذكاء القوي (عدّل هذا عندك) =====
  // يمكنك تعريف window.VOICE_AI_ENDPOINT في index.html قبل تضمين هذا الملف
  // أو عدّل الرابط هنا مباشرة:
  const SMART_AI_ENDPOINT =
    window.VOICE_AI_ENDPOINT || null; // مثال: "https://your-server.com/voice-intent"

  // ===== أدوات مساعدة عامة =====

  function say(message) {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(message);
    utter.lang = "ar-SA";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function getLastEntryRow() {
    const container = getEl("entriesContainer");
    if (!container || !container.children.length) return null;
    return container.children[container.children.length - 1];
  }

  // تحويل الأرقام العربية (١٢٣) إلى إنجليزية (123)
  function normalizeDigits(text) {
    const map = {
      "٠": "0",
      "١": "1",
      "٢": "2",
      "٣": "3",
      "٤": "4",
      "٥": "5",
      "٦": "6",
      "٧": "7",
      "٨": "8",
      "٩": "9",
    };
    return text.replace(/[٠-٩]/g, (d) => map[d] || d);
  }

  // تنظيف النص: تصغير، إزالة مسافات زائدة، تحويل أرقام
  function normalize(text) {
    return normalizeDigits(text).toLowerCase().trim();
  }

  // تغيير قيمة حقل بالـ id
  function setInputValue(id, value) {
    const el = getEl(id);
    if (el) {
      el.value = value;
      if (typeof window.updatePreviewText === "function") {
        window.updatePreviewText();
      }
    }
  }

  // ===== زر التشغيل / الإيقاف =====
  btn.addEventListener("click", () => {
    if (listening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });

  recognition.onstart = () => {
    listening = true;
    btn.textContent = "🎙️ أستمع لك الآن يا بسّام...";
    btn.style.background = "#b91c1c";
  };

  recognition.onend = () => {
    listening = false;
    btn.textContent = "🎤 مساعد بسّام الصوتي";
    btn.style.background = "#15803d";
  };

  recognition.onerror = (e) => {
    listening = false;
    btn.textContent = "🎤 مساعد بسّام الصوتي";
    btn.style.background = "#15803d";
    console.error("Speech error:", e.error);
    say("حصل خطأ في الميكروفون يا بسّام.");
  };

  recognition.onresult = (event) => {
    const raw = event.results[0][0].transcript.trim();
    console.log("🎧 سمع:", raw);
    handleVoiceCommand(raw);
  };

  // ===== تنفيذ الأوامر الصوتية (طبقتين: بسيطة + ذكية) =====

  async function handleVoiceCommand(rawText) {
    const text = normalize(rawText);
    console.log("🔎 بعد التطبيع:", text);

    // أولاً: حاول نفّذ بالأوامر الثابتة
    const handled = await handleSimpleCommands(text, rawText);
    if (handled) return;

    // ثانيًا: لو عندك API للذكاء القوي، جرّب تستخدمه
    const smartHandled = await trySmartAi(rawText, text);
    if (smartHandled) return;

    // في النهاية لو ما فهم شيء
    say("سمعتك تقول: " + rawText + " لكن ما فهمت الأمر يا بسّام.");
  }

  // ========= الطبقة الأولى: أوامر ثابتة داخل المتصفح =========

  async function handleSimpleCommands(text, rawText) {
    const clientInput = getEl("clientName");
    const titleInput = getEl("statementTitle");
    const dateInput = getEl("statementDate");

    // --- تحية بسيطة ---
    if (text.includes("سلام") || text.includes("مرحبا") || text.includes("هلا")) {
      say("هلا يا بسّام، تحت أمرك. قل لي وش تحب أعمل.");
      return true;
    }

    // --- كشف جديد ---
    if (
      text.includes("كشف جديد") ||
      text.includes("افتح كشف") ||
      text.includes("سجل كشف") ||
      text.includes("كشف فاضي")
    ) {
      if (typeof window.resetForm === "function") {
        const keepName = clientInput ? clientInput.value : "";
        window.resetForm(keepName);
      } else {
        if (clientInput) clientInput.value = "";
        if (dateInput)
          dateInput.value = new Date().toISOString().slice(0, 10);
        if (titleInput) titleInput.value = "";
        const extraNotes = getEl("extraNotes");
        if (extraNotes) extraNotes.value = "";
        const entriesContainer = getEl("entriesContainer");
        if (entriesContainer) {
          entriesContainer.innerHTML = "";
          if (typeof window.addEntryRow === "function") window.addEntryRow();
        }
        if (typeof window.updatePreviewText === "function")
          window.updatePreviewText();
      }

      say("حاضر يا بسّام، فتحت لك كشف جديد.");
      return true;
    }

    // --- إضافة بند جديد ---
    if (
      text.includes("بند جديد") ||
      text.includes("اضف بند") ||
      text.includes("أضف بند") ||
      text.includes("ضيف بند") ||
      text.includes("زود بند")
    ) {
      if (typeof window.addEntryRow === "function") {
        window.addEntryRow();
        say("تم إضافة بند جديد يا بسّام.");
      } else {
        say("ما قدرت أضيف بند، في مشكلة في الصفحة.");
      }
      return true;
    }

    // --- حذف آخر بند ---
    if (
      text.includes("حذف اخر بند") ||
      text.includes("احذف اخر بند") ||
      text.includes("امسح اخر بند") ||
      text.includes("امسح آخر بند")
    ) {
      const container = getEl("entriesContainer");
      if (container && container.lastElementChild) {
        container.removeChild(container.lastElementChild);
        if (typeof window.updatePreviewText === "function")
          window.updatePreviewText();
        say("حذفت آخر بند يا بسّام.");
      } else {
        say("ما في بنود عشان أحذفها.");
      }
      return true;
    }

    // --- اسم العميل ---
    // مثال: "اسم العميل محمد أحمد" أو "العميل محمد"
    if (text.startsWith("اسم العميل") || text.startsWith("العميل ")) {
      let name = text
        .replace("اسم العميل", "")
        .replace("العميل", "")
        .trim();
      if (clientInput && name) {
        clientInput.value = name;
        if (typeof window.renderStatementsList === "function")
          window.renderStatementsList();
        if (typeof window.renderTotalsForCurrentClient === "function")
          window.renderTotalsForCurrentClient();
        if (typeof window.updatePreviewText === "function")
          window.updatePreviewText();
        say("سجلت اسم العميل " + name);
      } else {
        say("ما فهمت اسم العميل يا بسّام.");
      }
      return true;
    }

    // --- عنوان الكشف ---
    // "عنوان الكشف شحنة فلان" أو "العنوان شحنة فلان"
    if (text.startsWith("عنوان الكشف") || text.startsWith("العنوان")) {
      const title = rawText
        .replace(/^عنوان الكشف/i, "")
        .replace(/^العنوان/i, "")
        .trim();
      if (titleInput && title) {
        titleInput.value = title;
        if (typeof window.updatePreviewText === "function")
          window.updatePreviewText();
        say("سجلت عنوان الكشف.");
      } else {
        say("ما فهمت العنوان يا بسّام.");
      }
      return true;
    }

    // --- رقم القاطرة ---
    // مثال: "رقم القاطرة واحد اثنين ثلاثة" أو "القاطرة 123"
    if (text.includes("رقم القاطرة") || text.startsWith("القاطرة")) {
      const truckInput = getEl("truckNumber");
      const clean = normalizeDigits(rawText)
        .replace(/رقم القاطرة/i, "")
        .replace(/القاطرة/i, "")
        .trim();
      if (truckInput && clean) {
        truckInput.value = clean;
        if (typeof window.updatePreviewText === "function")
          window.updatePreviewText();
        say("سجلت رقم القاطرة.");
      } else {
        say("ما فهمت رقم القاطرة.");
      }
      return true;
    }

    // --- رقم البيان ---
    if (text.includes("رقم البيان") || text.startsWith("البيان")) {
      const stInput = getEl("statementNumber");
      const clean = normalizeDigits(rawText)
        .replace(/رقم البيان/i, "")
        .replace(/البيان/i, "")
        .trim();
      if (stInput && clean) {
        stInput.value = clean;
        if (typeof window.updatePreviewText === "function")
          window.updatePreviewText();
        say("سجلت رقم البيان.");
      } else {
        say("ما فهمت رقم البيان.");
      }
      return true;
    }

    // --- وصف البند ---
    // مثال: "وصف البند البيان والتحسين ورسوم أخرى"
    if (text.startsWith("وصف البند") || text.startsWith("وصف ")) {
      let desc = rawText
        .replace(/^وصف البند/i, "")
        .replace(/^وصف/i, "")
        .trim();
      const row = getLastEntryRow();
      if (row && desc) {
        const descInput =
          row.querySelector(".entry-desc") || row.querySelector("input");
        if (descInput) {
          descInput.value = desc;
          if (typeof window.updatePreviewText === "function")
            window.updatePreviewText();
          say("كتبت وصف البند يا بسّام.");
        } else {
          say("ما لقيت خانة وصف البند.");
        }
      } else {
        say("ما عرفت وين أكتب وصف البند.");
      }
      return true;
    }

    // --- المبلغ ---
    // مثال: "المبلغ 245000" أو "ادخل المبلغ 1490000"
    if (
      text.startsWith("المبلغ") ||
      text.startsWith("اكتب المبلغ") ||
      text.startsWith("ادخل المبلغ")
    ) {
      const clean = normalizeDigits(rawText)
        .replace("المبلغ", "")
        .replace("اكتب المبلغ", "")
        .replace("ادخل المبلغ", "")
        .trim();

      const digitsOnly = clean.replace(/[^\d]/g, "");
      const value = Number(digitsOnly || "0");

      const row = getLastEntryRow();
      if (row && value > 0) {
        const amountInput = row.querySelector(".entry-amount");
        if (amountInput) {
          amountInput.value = String(value);
          if (typeof window.updatePreviewText === "function")
            window.updatePreviewText();
          say("تم إدخال المبلغ " + value);
        } else {
          say("ما لقيت خانة المبلغ.");
        }
      } else {
        say("ما قدرت أقرأ رقم المبلغ يا بسّام.");
      }
      return true;
    }

    // --- تغيير العملة ---
    // "العملة يمني" / "خلي العملة سعودي" / "غير العملة دولار"
    if (text.includes("العملة") || text.includes("عملة")) {
      const row = getLastEntryRow();
      if (!row) {
        say("ما في بند عشان أغير له العملة.");
        return true;
      }
      const currSelect = row.querySelector(".entry-curr");
      if (!currSelect) {
        say("ما لقيت خانة العملة.");
        return true;
      }

      if (text.includes("يمني") || text.includes("ريال يمني")) {
        currSelect.value = "يمني";
        say("غيرت العملة إلى يمني.");
      } else if (text.includes("سعودي") || text.includes("ريال سعودي")) {
        currSelect.value = "سعودي";
        say("غيرت العملة إلى سعودي.");
      } else if (text.includes("دولار") || text.includes("امريكي")) {
        currSelect.value = "دولار";
        say("غيرت العملة إلى دولار.");
      } else if (text.includes("درهم")) {
        currSelect.value = "درهم";
        say("غيرت العملة إلى درهم.");
      } else if (text.includes("عماني") || text.includes("ريال عماني")) {
        currSelect.value = "عماني";
        say("غيرت العملة إلى عماني.");
      } else {
        say("ما فهمت نوع العملة يا بسّام.");
      }

      if (typeof window.updatePreviewText === "function")
        window.updatePreviewText();
      return true;
    }

    // --- له / عليه ---
    if (
      text.includes("خله له") ||
      text.includes("خليها له") ||
      text.endsWith(" له")
    ) {
      const row = getLastEntryRow();
      if (row) {
        const dirSelect = row.querySelector(".entry-dir");
        if (dirSelect) {
          dirSelect.value = "له";
          if (typeof window.updatePreviewText === "function")
            window.updatePreviewText();
          say("خليتها له.");
        } else {
          say("ما لقيت خانة له أو عليه.");
        }
      } else {
        say("ما في بند أعدل عليه يا بسّام.");
      }
      return true;
    }

    if (
      text.includes("خله عليه") ||
      text.includes("خليها عليه") ||
      text.endsWith(" عليه")
    ) {
      const row = getLastEntryRow();
      if (row) {
        const dirSelect = row.querySelector(".entry-dir");
        if (dirSelect) {
          dirSelect.value = "عليه";
          if (typeof window.updatePreviewText === "function")
            window.updatePreviewText();
          say("خليتها عليه.");
        } else {
          say("ما لقيت خانة له أو عليه.");
        }
      } else {
        say("ما في بند أعدل عليه يا بسّام.");
      }
      return true;
    }

    // --- حفظ الكشف ---
    if (
      text.includes("احفظ الكشف") ||
      text.includes("حفظ الكشف") ||
      text.includes("سجل الكشف") ||
      (text.includes("احفظ") && text.includes("الكشف"))
    ) {
      const saveBtn = getEl("saveStatementBtn");
      if (saveBtn) {
        saveBtn.click();
        say("حفظت لك الكشف يا بسّام.");
      } else if (typeof window.saveCurrentStatement === "function") {
        window.saveCurrentStatement();
        say("حفظت لك الكشف يا بسّام.");
      } else {
        say("ما قدرت أحفظ الكشف، زر الحفظ غير موجود.");
      }
      return true;
    }

    // --- فتح آخر كشف لنفس العميل ---
    if (
      text.includes("اخر كشف") ||
      text.includes("آخر كشف") ||
      text.includes("اخر حساب") ||
      text.includes("آخر حساب")
    ) {
      const name = clientInput ? clientInput.value.trim() : "";
      if (!name) {
        say("قل لي أول اسم العميل، بعدين أفتح لك آخر كشف له.");
        return true;
      }
      const data = window.state && window.state.data;
      if (!data || !data.clients || !data.clients[name]) {
        say("ما لقيت كشوف لهذا العميل.");
        return true;
      }
      const list = data.clients[name].statements || [];
      if (!list.length) {
        say("ما لقيت كشوف لهذا العميل.");
        return true;
      }
      const last = list[0]; // لأننا مرتبين الأحدث أولاً
      if (typeof window.loadStatement === "function") {
        window.loadStatement(name, last.id);
        say("فتحت لك آخر كشف للعميل " + name);
      } else {
        say("ما قدرت أفتح الكشف من الكود.");
      }
      return true;
    }

    // --- مشاركة واتساب ---
    if (text.includes("ارسل واتساب") || text.includes("أرسل واتس") || text.includes("واتساب")) {
      const btnShare = getEl("shareWhatsappBtn");
      if (btnShare) {
        btnShare.click();
        say("أرسلت لك النص جاهز على واتساب.");
      } else {
        say("ما قدرت أشارك عبر واتساب من هنا.");
      }
      return true;
    }

    // لو وصلنا هنا، ما في أمر من الأوامر الثابتة
    return false;
  }

  // ========= الطبقة الثانية: ذكاء أعلى عبر API خارجي =========

  async function trySmartAi(rawText, normalizedText) {
    if (!SMART_AI_ENDPOINT) {
      // ما في API محدد
      return false;
    }

    try {
      // نرسل للنموذج النص كما هو (بدون تطبيع كثير)
      const res = await fetch(SMART_AI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText,
          normalized: normalizedText,
        }),
      });

      if (!res.ok) {
        console.error("Smart AI HTTP error:", res.status);
        return false;
      }

      const data = await res.json();
      console.log("🤖 Smart AI response:", data);

      // نتوقع شكل مثل:
      // { actions: [ { action: "set_field", target:"clientName", value:"فلان" }, ... ], say: "تم" }
      const actions = Array.isArray(data)
        ? data
        : data.actions || [data];

      let anyDone = false;
      for (const act of actions) {
        const done = runSmartAction(act);
        if (done) anyDone = true;
      }

      if (anyDone) {
        if (data.say) {
          say(data.say);
        } else {
          say("تم تنفيذ الأمر يا بسّام.");
        }
        return true;
      }

      return false;
    } catch (err) {
      console.error("Smart AI error:", err);
      say("حاولت أفهمك بذكاء أعلى، لكن حصل خطأ بالاتصال.");
      return false;
    }
  }

  // تنفيذ أمر واحد مرسل من الذكاء الخارجي
  function runSmartAction(act) {
    if (!act || !act.action) return false;

    switch (act.action) {
      case "new_statement":
        if (typeof window.resetForm === "function") {
          const keepName =
            act.keepClientName && getEl("clientName")
              ? getEl("clientName").value
              : "";
          window.resetForm(keepName);
          return true;
        }
        return false;

      case "add_entry":
        if (typeof window.addEntryRow === "function") {
          window.addEntryRow();
          return true;
        }
        return false;

      case "set_field":
        // target: clientName, statementTitle, truckNumber, statementNumber, extraNotes, manualTotal, date
        if (!act.target) return false;
        const fieldMap = {
          clientName: "clientName",
          title: "statementTitle",
          statementTitle: "statementTitle",
          truckNumber: "truckNumber",
          statementNumber: "statementNumber",
          notes: "extraNotes",
          extraNotes: "extraNotes",
          total: "manualTotal",
          manualTotal: "manualTotal",
          date: "statementDate",
        };
        const id = fieldMap[act.target] || act.target;
        setInputValue(id, act.value || "");
        return true;

      case "set_entry":
        // { action:"set_entry", index:0, desc:"..", amount:123, currency:"سعودي", direction:"له" }
        const row = getLastEntryRow();
        if (!row) return false;
        if (act.desc != null) {
          const descInput =
            row.querySelector(".entry-desc") || row.querySelector("input");
          if (descInput) descInput.value = act.desc;
        }
        if (act.amount != null) {
          const amountInput = row.querySelector(".entry-amount");
          if (amountInput) amountInput.value = String(act.amount);
        }
        if (act.currency) {
          const curr = row.querySelector(".entry-curr");
          if (curr) curr.value = act.currency;
        }
        if (act.direction) {
          const dir = row.querySelector(".entry-dir");
          if (dir) dir.value = act.direction;
        }
        if (typeof window.updatePreviewText === "function")
          window.updatePreviewText();
        return true;

      case "set_direction_last":
        {
          const row2 = getLastEntryRow();
          if (!row2) return false;
          const dirSel = row2.querySelector(".entry-dir");
          if (!dirSel) return false;
          dirSel.value = act.value === "له" ? "له" : "عليه";
          if (typeof window.updatePreviewText === "function")
            window.updatePreviewText();
          return true;
        }

      case "save":
        if (typeof window.saveCurrentStatement === "function") {
          window.saveCurrentStatement();
          return true;
        } else {
          const btnSave = getEl("saveStatementBtn");
          if (btnSave) {
            btnSave.click();
            return true;
          }
        }
        return false;

      case "open_last_statement_for_client":
        {
          const name =
            act.clientName ||
            (getEl("clientName") ? getEl("clientName").value.trim() : "");
          if (!name || !window.state || !window.state.data) return false;
          const client = window.state.data.clients[name];
          if (!client || !client.statements.length) return false;
          const last = client.statements[0];
          if (typeof window.loadStatement === "function") {
            window.loadStatement(name, last.id);
            return true;
          }
          return false;
        }

      case "share_whatsapp":
        {
          const btnShare = getEl("shareWhatsappBtn");
          if (btnShare) {
            btnShare.click();
            return true;
          }
          return false;
        }

      default:
        console.log("Unknown smart action:", act);
        return false;
    }
  }
})();
