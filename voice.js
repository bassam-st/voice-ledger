// voice.js — مساعد بسّام الصوتي الذكي (نسخة حوارية متقدمة)

(function () {
  const btn = document.getElementById("voiceAssistantBtn");
  if (!btn) return;

  // ===== دعم التعرف على الصوت =====
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    btn.disabled = true;
    btn.textContent = "🎤 المساعد الصوتي غير مدعوم في هذا المتصفح";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ar-SA"; // للهجة السعودية/اليمنية غالباً أفضل
  recognition.interimResults = false;

  let listening = false;

  // حالة المحادثة
  const convo = {
    mode: "idle",          // "idle" | "adding_entry"
    step: null,            // "desc" | "amount" | "currency" | "direction"
  };

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

  function resetConversation() {
    convo.mode = "idle";
    convo.step = null;
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

  // ====== تنفيذ الأوامر الصوتية ======

  function handleVoiceCommand(rawText) {
    const text = normalize(rawText);
    console.log("🔎 بعد التطبيع:", text);

    const clientInput  = getEl("clientName");
    const titleInput   = getEl("statementTitle");
    const dateInput    = getEl("statementDate");
    const truckInput   = getEl("truckNumber");
    const stmtNumInput = getEl("statementNumber");

    // ===== أوامر إلغاء عامة =====
    if (
      text.includes("الغ") ||     // الغي / الغاء
      text.includes("إلغاء") ||
      text.includes("cancel")
    ) {
      resetConversation();
      say("ألغيت العملية الحالية يا بسّام.");
      return;
    }

    // ===== تحية بسيطة =====
    if (text.includes("سلام") || text.includes("مرحبا") || text.includes("هلا")) {
      say("هلا يا بسّام، تحت أمرك. قل لي وش تحب أعمل.");
      return;
    }

    // ===== كشف جديد =====
    if (
      text.includes("كشف جديد") ||
      text.includes("افتح كشف") ||
      text.includes("سجل كشف") ||
      text.includes("كشف فاضي")
    ) {
      if (typeof resetForm === "function") {
        const keepName = clientInput ? clientInput.value : "";
        resetForm(keepName);
      } else {
        if (clientInput) clientInput.value = "";
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
        if (titleInput) titleInput.value = "";
        const extraNotes = getEl("extraNotes");
        if (extraNotes) extraNotes.value = "";
        const entriesContainer = getEl("entriesContainer");
        if (entriesContainer) {
          entriesContainer.innerHTML = "";
          if (typeof addEntryRow === "function") addEntryRow();
        }
        if (typeof updatePreviewText === "function") updatePreviewText();
      }
      resetConversation();
      say("حاضر يا بسام، فتحت لك كشف جديد.");
      return;
    }

    // ===== تعيين اسم العميل =====
    if (text.startsWith("اسم العميل") || text.startsWith("العميل ")) {
      let name = text
        .replace("اسم العميل", "")
        .replace("العميل", "")
        .trim();
      if (clientInput && name) {
        clientInput.value = name;
        if (typeof renderStatementsList === "function") renderStatementsList();
        if (typeof renderTotalsForCurrentClient === "function")
          renderTotalsForCurrentClient();
        if (typeof updatePreviewText === "function") updatePreviewText();
        say("سجلت اسم العميل " + name);
      } else {
        say("ما فهمت اسم العميل يا بسّام.");
      }
      return;
    }

    // ===== تعيين عنوان الكشف =====
    if (text.startsWith("عنوان الكشف") || text.startsWith("العنوان")) {
      const titleClean = text
        .replace("عنوان الكشف", "")
        .replace("العنوان", "")
        .trim();
      if (titleInput && titleClean) {
        // نستخدم النص الأصلي للحفاظ على الحروف كما هي
        titleInput.value = rawText.replace(/^(عنوان الكشف|العنوان)\s*/i, "");
        if (typeof updatePreviewText === "function") updatePreviewText();
        say("سجلت عنوان الكشف.");
      } else {
        say("ما فهمت العنوان يا بسّام.");
      }
      return;
    }

    // ===== رقم القاطرة =====
    if (
      text.includes("رقم القاطرة") ||
      text.includes("رقم القاطره") ||
      text.startsWith("القاطرة") ||
      text.startsWith("القاطره")
    ) {
      const clean = normalizeDigits(rawText);
      const digitsOnly = clean.replace(/[^\d]/g, "");
      if (truckInput && digitsOnly) {
        truckInput.value = digitsOnly;
        if (typeof updatePreviewText === "function") updatePreviewText();
        say("سجلت رقم القاطرة " + digitsOnly);
      } else {
        say("ما قدرت أقرأ رقم القاطرة يا بسّام.");
      }
      return;
    }

    // ===== رقم البيان =====
    if (
      text.includes("رقم البيان") ||
      text.startsWith("البيان")
    ) {
      const clean = normalizeDigits(rawText);
      const digitsOnly = clean.replace(/[^\d]/g, "");
      if (stmtNumInput && digitsOnly) {
        stmtNumInput.value = digitsOnly;
        if (typeof updatePreviewText === "function") updatePreviewText();
        say("سجلت رقم البيان " + digitsOnly);
      } else {
        say("ما قدرت أقرأ رقم البيان يا بسّام.");
      }
      return;
    }

    // ======================================================
    //         وضع المحادثة لإضافة بند (C)
    // ======================================================

    // بدء محادثة إضافة بند جديد
    if (
      text.includes("بند جديد") ||
      text.includes("اضف بند") ||
      text.includes("أضف بند") ||
      text.includes("ضيف بند") ||
      text.includes("زود بند")
    ) {
      if (typeof addEntryRow === "function") {
        addEntryRow();
        convo.mode = "adding_entry";
        convo.step = "desc";
        say("طيب يا بسّام، ما هو وصف البند؟");
      } else {
        say("ما قدرت أضيف بند، في مشكلة في الصفحة.");
      }
      return;
    }

    // لو نحن في وضع إضافة بند، نتعامل حسب الخطوة الحالية
    if (convo.mode === "adding_entry") {
      const row = getLastEntryRow();
      if (!row) {
        resetConversation();
        say("ما لقيت البند يا بسّام، أعد المحاولة.");
        return;
      }

      // ===== الخطوة 1: الوصف =====
      if (convo.step === "desc") {
        // لو قال "وصف البند ..." نزيلها، ولو ما قال نأخذ النص كامل
        let desc = rawText
          .replace(/^وصف البند/i, "")
          .replace(/^وصف/i, "")
          .trim();
        if (!desc) desc = rawText.trim();

        const descInput =
          row.querySelector(".entry-desc") || row.querySelector("input");
        if (descInput && desc) {
          descInput.value = desc;
          if (typeof updatePreviewText === "function") updatePreviewText();
          convo.step = "amount";
          say("تمام، كم المبلغ يا بسّام؟");
        } else {
          say("ما فهمت وصف البند، كرر الوصف لو سمحت.");
        }
        return;
      }

      // ===== الخطوة 2: المبلغ =====
      if (convo.step === "amount") {
        const clean = normalizeDigits(rawText);
        const digitsOnly = clean.replace(/[^\d]/g, "");
        const value = Number(digitsOnly || "0");
        if (value > 0) {
          const amountInput = row.querySelector(".entry-amount");
          if (amountInput) {
            amountInput.value = String(value);
            if (typeof updatePreviewText === "function") updatePreviewText();
            convo.step = "currency";
            say("ما هي العملة؟ يمني، سعودي، درهم، دولار، أو عماني؟");
          } else {
            resetConversation();
            say("ما لقيت خانة المبلغ يا بسّام.");
          }
        } else {
          say("ما فهمت رقم المبلغ، كرر لو سمحت.");
        }
        return;
      }

      // ===== الخطوة 3: العملة =====
      if (convo.step === "currency") {
        const currSelect = row.querySelector(".entry-curr");
        if (!currSelect) {
          resetConversation();
          say("ما لقيت خانة العملة يا بسّام.");
          return;
        }

        let chosen = null;
        if (text.includes("يمني") || text.includes("ريال يمني")) chosen = "يمني";
        else if (text.includes("سعودي") || text.includes("ريال سعودي")) chosen = "سعودي";
        else if (text.includes("درهم")) chosen = "درهم";
        else if (text.includes("دولار")) chosen = "دولار";
        else if (text.includes("عماني") || text.includes("ريال عماني")) chosen = "عماني";

        if (chosen) {
          currSelect.value = chosen;
          if (typeof updatePreviewText === "function") updatePreviewText();
          convo.step = "direction";
          say("تمام، هل هو له أم عليه؟");
        } else {
          say("ما فهمت نوع العملة، قل يمني أو سعودي أو درهم أو دولار أو عماني.");
        }
        return;
      }

      // ===== الخطوة 4: له / عليه =====
      if (convo.step === "direction") {
        const dirSelect = row.querySelector(".entry-dir");
        if (!dirSelect) {
          resetConversation();
          say("ما لقيت خانة له أو عليه يا بسّام.");
          return;
        }

        if (text.includes("له")) {
          dirSelect.value = "له";
        } else if (text.includes("عليه")) {
          dirSelect.value = "عليه";
        } else {
          say("قل له أو عليه يا بسّام.");
          return;
        }

        if (typeof updatePreviewText === "function") updatePreviewText();
        resetConversation();
        say("تم تسجيل البند يا بسّام. إذا تبي أضيف بند جديد، قل: أضف بند جديد.");
        return;
      }
    }

    // ======================================================
    //    أوامر تقليدية (خارج وضع المحادثة C)
    // ======================================================

    // وصف البند (أمر يدوي خارج المحادثة)
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
          if (typeof updatePreviewText === "function") updatePreviewText();
          say("كتبت وصف البند يا بسّام.");
        } else {
          say("ما لقيت خانة وصف البند.");
        }
      } else {
        say("ما عرفت وين أكتب وصف البند.");
      }
      return;
    }

    // المبلغ (أمر يدوي)
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
          if (typeof updatePreviewText === "function") updatePreviewText();
          say("تم إدخال المبلغ " + value);
        } else {
          say("ما لقيت خانة المبلغ.");
        }
      } else {
        say("ما قدرت أقرأ رقم المبلغ يا بسّام.");
      }
      return;
    }

    // تغيير العملة (أمر يدوي)
    if (text.includes("العملة") || text.includes("عملة")) {
      const row = getLastEntryRow();
      if (!row) {
        say("ما في بند عشان أغير له العملة.");
        return;
      }
      const currSelect = row.querySelector(".entry-curr");
      if (!currSelect) {
        say("ما لقيت خانة العملة.");
        return;
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
        say("ما فهمت نوع العملة يا بسام.");
      }

      if (typeof updatePreviewText === "function") updatePreviewText();
      return;
    }

    // له / عليه (أمر يدوي)
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
          if (typeof updatePreviewText === "function") updatePreviewText();
          say("خليتها له.");
        } else {
          say("ما لقيت خانة له أو عليه.");
        }
      } else {
        say("ما في بند أعدل عليه يا بسّام.");
      }
      return;
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
          if (typeof updatePreviewText === "function") updatePreviewText();
          say("خليتها عليه.");
        } else {
          say("ما لقيت خانة له أو عليه.");
        }
      } else {
        say("ما في بند أعدل عليه يا بسّام.");
      }
      return;
    }

    // ===== حفظ الكشف =====
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
      } else if (typeof saveCurrentStatement === "function") {
        saveCurrentStatement();
        say("حفظت لك الكشف يا بسّام.");
      } else {
        say("ما قدرت أحفظ الكشف، زر الحفظ غير موجود.");
      }
      return;
    }

    // ===== لو ما فهم الأمر =====
    say("سمعتك تقول: " + rawText + " لكن ما فهمت الأمر يا بسّام.");
  }
})();
