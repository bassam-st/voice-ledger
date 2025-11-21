// ============================
//  ملف voice.js
//  مساعد بسّام الصوتي الذكي (محلي وبالمجّان)
// ============================
(function () {
  const voiceBtn = document.getElementById("voiceAssistantBtn");
  if (!voiceBtn) return;

  // واجهة التعرف على الصوت من المتصفح
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    voiceBtn.disabled = true;
    voiceBtn.textContent = "🎤 المساعد الصوتي غير مدعوم في هذا المتصفح";
    console.warn("SpeechRecognition غير مدعوم في هذا المتصفح");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ar-SA"; // جرّب ar-YE لو حاب
  recognition.continuous = false;
  recognition.interimResults = false;

  let listening = false;

  // دالة النطق (الرد على بسّام بالصوت)
  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("تعذر استخدام النطق:", e);
    }
  }

  // دوال مساعدة للنص
  function stripDiacritics(s) {
    // إزالة الحركات والمدود
    return s.replace(/[\u064B-\u065F]/g, "").replace(/ـ/g, "");
  }

  function normalize(text) {
    return stripDiacritics(text).toLowerCase().trim();
  }

  function arabicDigitsToEnglish(str) {
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
    return str.replace(/[٠-٩]/g, (d) => map[d] || d);
  }

  // دوال مساعدة لعناصر الصفحة
  function getEl(id) {
    return document.getElementById(id);
  }

  function getLastEntryRow() {
    const container = getEl("entriesContainer");
    if (!container || !container.children.length) return null;
    return container.children[container.children.length - 1];
  }

  // التحكم في زر المساعد الصوتي
  voiceBtn.addEventListener("click", () => {
    if (!listening) {
      try {
        recognition.start();
      } catch (e) {
        console.error(e);
      }
    } else {
      recognition.stop();
    }
  });

  recognition.onstart = () => {
    listening = true;
    voiceBtn.textContent = "🎙️ أستمع لك يا بسّام... اضغط للإيقاف";
    voiceBtn.style.background = "#b91c1c";
  };

  recognition.onend = () => {
    listening = false;
    voiceBtn.textContent = "🎤 مساعد بسّام الصوتي";
    voiceBtn.style.background = "#15803d";
  };

  recognition.onerror = (event) => {
    listening = false;
    voiceBtn.textContent = "🎤 مساعد بسّام الصوتي";
    console.error("Speech recognition error:", event.error);
    speak("عفواً يا بسام، حصل خطأ في الميكروفون أو التعرف على الصوت.");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    console.log("🗣️ سمع:", transcript);
    handleCommand(transcript);
  };

  // ============================
  //     الأوامر الصوتية الذكية
  // ============================

  function handleCommand(rawText) {
    const text = normalize(rawText);
    console.log("⚙️ normalized:", text);

    const clientInput = getEl("clientName");
    const dateInput = getEl("statementDate") || getEl("dateInput");
    const titleInput = getEl("statementTitle");
    const extraNotes = getEl("extraNotes");

    // ===== تحية عامة =====
    if (
      text.includes("السلام") ||
      text.includes("مرحبا") ||
      text.includes("هلا") ||
      text.includes("صباح الخير") ||
      text.includes("مساء الخير")
    ) {
      speak("هلا يا بسام، أنا مساعدك الصوتي لكشوفات العملاء، تحت أمرك.");
      return;
    }

    // ===== كشف جديد =====
    if (
      text.includes("كشف جديد") ||
      text.includes("افتح كشف جديد") ||
      text.includes("سجل كشف جديد") ||
      text.includes("ابدأ كشف جديد")
    ) {
      if (clientInput) clientInput.value = "";
      if (dateInput)
        dateInput.value = new Date().toISOString().slice(0, 10);
      if (titleInput) titleInput.value = "";
      if (extraNotes) extraNotes.value = "";

      const entriesContainer = getEl("entriesContainer");
      if (entriesContainer) {
        entriesContainer.innerHTML = "";
        if (typeof addEntryRow === "function") addEntryRow();
      }

      if (typeof updatePreviewText === "function") updatePreviewText();
      if (typeof renderStatementsList === "function") renderStatementsList();

      speak("حاضر يا بسام، فتحت لك كشف جديد.");
      return;
    }

    // ===== اسم العميل: "اسم العميل محمد" أو "العميل محمد" =====
    if (text.startsWith("اسم العميل") || text.startsWith("العميل ")) {
      // نستخدم النص الأصلي للحفاظ على الاسم
      let name = rawText
        .replace(/^اسم العميل/i, "")
        .replace(/^العميل/i, "")
        .trim();
      if (clientInput && name) {
        clientInput.value = name;
        speak("تم تعيين اسم العميل " + name);
        if (typeof updatePreviewText === "function") updatePreviewText();
      } else {
        speak("ما فهمت اسم العميل يا بسام.");
      }
      return;
    }

    // ===== عنوان الكشف =====
    if (text.startsWith("عنوان الكشف") || text.startsWith("العنوان")) {
      let title = rawText
        .replace(/^(عنوان الكشف|العنوان)/i, "")
        .trim();
      if (titleInput && title) {
        titleInput.value = title;
        speak("تم تعيين عنوان الكشف.");
        if (typeof updatePreviewText === "function") updatePreviewText();
      } else {
        speak("ما فهمت عنوان الكشف يا بسام.");
      }
      return;
    }

    // ===== إضافة بند جديد =====
    if (
      text.includes("بند جديد") ||
      text.includes("اضف بند") ||
      text.includes("أضف بند") ||
      text.includes("ضيف بند") ||
      text.includes("زود بند")
    ) {
      if (typeof addEntryRow === "function") {
        addEntryRow();
        speak("تم إضافة بند جديد يا بسام.");
      } else {
        const btn = getEl("addEntryBtn");
        if (btn) {
          btn.click();
          speak("تم إضافة بند جديد يا بسام.");
        } else {
          speak("ما قدرت أضيف بند، زر الإضافة غير موجود.");
        }
      }
      return;
    }

    // ===== وصف البند =====
    // أمثلة:
    // "وصف البند البنك والتحسين"
    // "الوصف البنك والتحسين"
    // "اكتب الوصف البنك والتحسين"
    if (
      text.startsWith("وصف البند") ||
      text.startsWith("الوصف") ||
      text.startsWith("اكتب الوصف")
    ) {
      let desc = rawText
        .replace(/^وصف البند/i, "")
        .replace(/^الوصف/i, "")
        .replace(/^اكتب الوصف/i, "")
        .trim();

      const lastRow = getLastEntryRow();
      if (lastRow && desc) {
        const descInput =
          lastRow.querySelector(".entry-desc") ||
          lastRow.querySelector(".desc") ||
          lastRow.querySelector("input");
        if (descInput) {
          descInput.value = desc;
          speak("كتبت وصف البند.");
          if (typeof updatePreviewText === "function") updatePreviewText();
        } else {
          speak("ما لقيت خانة لوصف البند.");
        }
      } else {
        speak("ما لقيت بند أكتب فيه الوصف يا بسام.");
      }
      return;
    }

    // ===== المبلغ =====
    // أمثلة:
    // "المبلغ ١٥٠٠٠"
    // "ادخل المبلغ 2000"
    // "اكتب المبلغ ٣٥٠٠"
    if (
      text.startsWith("المبلغ") ||
      text.startsWith("ادخل المبلغ") ||
      text.startsWith("اكتب المبلغ")
    ) {
      let numPart = rawText
        .replace(/^المبلغ/i, "")
        .replace(/^ادخل المبلغ/i, "")
        .replace(/^اكتب المبلغ/i, "")
        .trim();

      numPart = arabicDigitsToEnglish(numPart);
      const digits = numPart.match(/\d+/);
      const value = digits ? Number(digits[0]) : 0;

      const lastRow = getLastEntryRow();
      if (lastRow && value > 0) {
        const amountInput =
          lastRow.querySelector(".entry-amount") ||
          lastRow.querySelector(".amount");
        if (amountInput) {
          amountInput.value = value;
          speak("تم إدخال المبلغ " + value);
          if (typeof updatePreviewText === "function") updatePreviewText();
        } else {
          speak("ما لقيت خانة المبلغ يا بسام.");
        }
      } else {
        speak("ما قدرت أقرأ رقم المبلغ يا بسام، حاول تقوله مرة ثانية.");
      }
      return;
    }

    // ===== العملة =====
    // أمثلة:
    // "العملة يمني"
    // "العملة ريال يمني"
    // "العملة سعودي"
    // "خلي العملة دولار"
    if (text.includes("العملة") || text.includes("عمله") || text.includes("عملة")) {
      const lastRow = getLastEntryRow();
      if (!lastRow) {
        speak("ما في بند عشان أعدل عليه العملة.");
        return;
      }

      const currSelect =
        lastRow.querySelector(".entry-curr") ||
        lastRow.querySelector(".currency");
      if (!currSelect) {
        speak("ما قدرت أجد خانة العملة.");
        return;
      }

      let clean = stripDiacritics(rawText);
      clean = clean
        .replace(/العملة|عمله|عملة/gi, "")
        .replace(/ريال|ريالاً|ريال سعودي|ريال يمني/gi, "")
        .trim()
        .toLowerCase();

      console.log("🔍 currency clean:", clean);

      if (clean.includes("يمن")) {
        currSelect.value = "يمني";
        speak("تم تعيين العملة يمني.");
      } else if (clean.includes("سعود")) {
        currSelect.value = "سعودي";
        speak("تم تعيين العملة سعودي.");
      } else if (clean.includes("درهم")) {
        currSelect.value = "درهم";
        speak("تم تعيين العملة درهم.");
      } else if (
        clean.includes("دول") ||
        clean.includes("دولار") ||
        clean.includes("امريك")
      ) {
        currSelect.value = "دولار";
        speak("تم تعيين العملة دولار.");
      } else if (clean.includes("عمان")) {
        currSelect.value = "عماني";
        speak("تم تعيين العملة عماني.");
      } else {
        speak("ما فهمت نوع العملة يا بسام، حاول تقول: العملة يمني أو العملة سعودي.");
      }

      if (typeof updatePreviewText === "function") updatePreviewText();
      return;
    }

    // ===== له / عليه =====
    // "خله له" / "خليها له" / "خله عليه" / "خليها عليه"
    if (
      text.includes("خله له") ||
      text.includes("خليها له") ||
      (text.endsWith(" له") && text.includes("خل"))
    ) {
      const lastRow = getLastEntryRow();
      if (lastRow) {
        const dirSelect =
          lastRow.querySelector(".entry-dir") ||
          lastRow.querySelector(".direction");
        if (dirSelect) dirSelect.value = "له";
        speak("تم تعيينها له.");
        if (typeof updatePreviewText === "function") updatePreviewText();
      } else {
        speak("ما لقيت بند أعدل عليه يا بسام.");
      }
      return;
    }

    if (
      text.includes("خله عليه") ||
      text.includes("خليها عليه") ||
      (text.endsWith(" عليه") && text.includes("خل"))
    ) {
      const lastRow = getLastEntryRow();
      if (lastRow) {
        const dirSelect =
          lastRow.querySelector(".entry-dir") ||
          lastRow.querySelector(".direction");
        if (dirSelect) dirSelect.value = "عليه";
        speak("تم تعيينها عليه.");
        if (typeof updatePreviewText === "function") updatePreviewText();
      } else {
        speak("ما لقيت بند أعدل عليه يا بسام.");
      }
      return;
    }

    // ===== حفظ الكشف =====
    if (
      text.includes("احفظ الكشف") ||
      text.includes("حفظ الكشف") ||
      text.includes("سجل الكشف") ||
      text.includes("احفظ هذا الكشف") ||
      text.includes("سجل هذا الكشف")
    ) {
      const saveBtn = getEl("saveStatementBtn");
      if (saveBtn) {
        saveBtn.click();
        speak("تم حفظ الكشف يا بسام.");
      } else if (typeof saveCurrentStatement === "function") {
        saveCurrentStatement();
        speak("تم حفظ الكشف يا بسام.");
      } else {
        speak("ما قدرت أحفظ الكشف، زر الحفظ غير موجود.");
      }
      return;
    }

    // ===== لو ما فهمنا الأمر =====
    speak("سمعتك تقول: " + rawText + " لكن ما فهمت الأمر يا بسام، حاول تقوله بشكل أبسط.");
  }
})();
