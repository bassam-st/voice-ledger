// ============================
//  ملف voice.js
//  مساعد بسّام الصوتي الذكي للأوامر المحلية (بدون اشتراك)
// ============================

(function () {
  const btn = document.getElementById("voiceAssistantBtn");
  if (!btn) return;

  // فحص دعم المتصفح للتعرف على الصوت
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    btn.disabled = true;
    btn.textContent = "🎤 المساعد الصوتي غير مدعوم في هذا المتصفح";
    console.warn("SpeechRecognition not supported in this browser");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ar-SA"; // جرّب ar-YE لو حاب
  recognition.interimResults = false;
  recognition.continuous = false;

  let listening = false;

  // نطق صوتي
  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  }

  // أدوات DOM
  function getEl(id) {
    return document.getElementById(id);
  }

  function getLastEntryRow() {
    const container = getEl("entriesContainer");
    if (!container || !container.children.length) return null;
    return container.children[container.children.length - 1];
  }

  // تحويل أرقام عربية ٠١٢٣٤٥٦٧٨٩ إلى 0123456789
  function arabicDigitsToEnglish(str) {
    const map = {
      "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
      "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
    };
    return str.replace(/[٠-٩]/g, (d) => map[d] || d);
  }

  // إزالة الحركات + توحيد بعض الحروف
  function normalizeArabicLetters(str) {
    return str
      .replace(/[\u064B-\u0652]/g, "") // حركات
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي");
  }

  // تحويل كلمات الأرقام إلى رقم (تقريبية – للأحرف فقط)
  function arabicWordsToNumber(text) {
    if (!text) return 0;

    text = normalizeArabicLetters(text.toLowerCase());
    const parts = text.split(/[\sو]+/).filter(Boolean);

    const units = {
      "صفر":0, "واحد":1, "واحده":1,
      "اثنان":2, "اثنين":2, "اتنين":2,
      "ثلاث":3, "ثلاثه":3,
      "اربع":4, "اربعه":4,
      "خمس":5, "خمسه":5,
      "ست":6, "سته":6,
      "سبع":7, "سبعه":7,
      "ثمان":8, "ثمانيه":8,
      "تسع":9, "تسعه":9
    };

    const tens = {
      "عشر":10, "عشره":10,
      "احدى عشر":11, "احدىعشر":11,
      "احد عشر":11, "احدعشر":11,
      "اثنا عشر":12, "اثناعشر":12, "اثني عشر":12,
      "ثلاثه عشر":13, "ثلاثة عشر":13, "ثلاثعشر":13,
      "اربعه عشر":14, "اربعة عشر":14,
      "خمسه عشر":15, "خمسة عشر":15,
      "سته عشر":16, "ستة عشر":16,
      "سبعه عشر":17, "سبعة عشر":17,
      "ثمانيه عشر":18, "ثمانية عشر":18,
      "تسعه عشر":19, "تسعة عشر":19,

      "عشرون":20, "عشرين":20,
      "ثلاثون":30, "ثلاثين":30,
      "اربعون":40, "اربعين":40,
      "خمسون":50, "خمسين":50,
      "ستون":60, "ستين":60,
      "سبعون":70, "سبعين":70,
      "ثمانون":80, "ثمانين":80,
      "تسعون":90, "تسعين":90
    };

    const hundreds = {
      "مئه":100, "مائه":100, "مئة":100,
      "مائتان":200, "مئتان":200, "ميتين":200,
      "ثلاثمائه":300, "ثلاثمئة":300,
      "اربعمائه":400, "اربعمئة":400,
      "خمسمائه":500, "خمسمئة":500,
      "ستمائه":600, "ستمئة":600,
      "سبعمائه":700, "سبعمئة":700,
      "ثمانمائه":800, "ثمانمئة":800,
      "تسعمائه":900, "تسعمئة":900
    };

    const scales = {
      "الف":1000, "الاف":1000,
      "مليون":1000000, "ملايين":1000000,
      "مليار":1000000000, "مليارات":1000000000
    };

    let total = 0;
    let current = 0;

    for (let raw of parts) {
      const w = raw.trim();
      if (!w) continue;

      if (units[w] != null) {
        current += units[w];
      } else if (tens[w] != null) {
        current += tens[w];
      } else if (hundreds[w] != null) {
        current += hundreds[w];
      } else if (scales[w] != null) {
        if (current === 0) current = 1;
        current *= scales[w];
        total += current;
        current = 0;
      }
    }

    return total + current;
  }

  // ============================
  //   التحكم في زر الاستماع
  // ============================

  btn.addEventListener("click", () => {
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
    console.error("Speech recognition error:", e.error);
    speak("عفواً يا بسام، حصل خطأ في الميكروفون أو في التعرف على الصوت.");
  };

  recognition.onresult = (event) => {
    const rawText = event.results[0][0].transcript.trim();
    console.log("🗣️ النص الذي سمعته:", rawText);
    handleCommand(rawText);
  };

  // ============================
  //       تنفيذ الأوامر
  // ============================

  function handleCommand(rawText) {
    const text = rawText.trim();
    const lowered = normalizeArabicLetters(text.toLowerCase());

    console.log("🔍 normalized:", lowered);

    const clientInput = getEl("clientName");
    const dateInput   = getEl("statementDate") || getEl("dateInput");
    const titleInput  = getEl("statementTitle");
    const extraNotes  = getEl("extraNotes");

    // ===== تحيات عامة =====
    if (lowered.includes("سلام") || lowered.includes("مرحبا") || lowered.includes("هلا")) {
      speak("هلا يا بسام، أنا مساعدك الصوتي في دفتر كشف الحساب، تحت أمرك.");
      return;
    }

    // ===== كشف جديد =====
    if (
      lowered.includes("كشف جديد") ||
      lowered.includes("افتح كشف") ||
      lowered.includes("سجل كشف")
    ) {
      if (typeof resetForm === "function") {
        resetForm(""); // يفتح كشف جديد ويخلي الاسم فاضي
      } else {
        if (clientInput) clientInput.value = "";
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
        if (titleInput) titleInput.value = "";
        if (extraNotes) extraNotes.value = "";
        const entriesContainer = getEl("entriesContainer");
        if (entriesContainer) {
          entriesContainer.innerHTML = "";
          if (typeof addEntryRow === "function") addEntryRow();
        }
        if (typeof updatePreviewText === "function") updatePreviewText();
      }

      if (typeof renderStatementsList === "function") renderStatementsList();
      speak("حاضر يا بسام، فتحت لك كشف جديد.");
      return;
    }

    // ===== اسم العميل =====
    if (lowered.startsWith("اسم العميل") || lowered.startsWith("العميل")) {
      let name = text
        .replace(/^اسم العميل/i, "")
        .replace(/^العميل/i, "")
        .trim();
      if (clientInput && name) {
        clientInput.value = name;
        console.log("👤 اسم العميل:", name);
        speak("تم تعيين اسم العميل " + name);
        if (typeof updatePreviewText === "function") updatePreviewText();
      } else {
        speak("ما فهمت اسم العميل يا بسام.");
      }
      return;
    }

    // ===== عنوان الكشف =====
    if (lowered.startsWith("عنوان الكشف") || lowered.startsWith("العنوان")) {
      let title = text
        .replace(/^عنوان الكشف/i, "")
        .replace(/^العنوان/i, "")
        .trim();
      if (titleInput && title) {
        titleInput.value = title;
        console.log("📝 عنوان الكشف:", title);
        speak("تم تعيين عنوان الكشف.");
        if (typeof updatePreviewText === "function") updatePreviewText();
      } else {
        speak("ما فهمت العنوان يا بسام.");
      }
      return;
    }

    // ===== إضافة بند =====
    if (/بند جديد|اضف بند|أضف بند|ضيف بند|زود بند/i.test(text)) {
      console.log("➕ أمر: بند جديد");
      if (typeof addEntryRow === "function") {
        addEntryRow();
        speak("تم إضافة بند جديد يا بسام.");
      } else {
        const btnAdd = getEl("addEntryBtn");
        if (btnAdd) {
          btnAdd.click();
          speak("تم إضافة بند جديد يا بسام.");
        } else {
          speak("لا أستطيع إضافة بند الآن.");
        }
      }
      return;
    }

    // ===== وصف البند =====
    if (lowered.startsWith("وصف البند")) {
      const descText = text.replace(/^وصف البند/i, "").trim();
      console.log("📝 وصف البند المطلوب:", descText);
      const lastRow = getLastEntryRow();
      if (lastRow && descText) {
        const descInput =
          lastRow.querySelector(".entry-desc") ||
          lastRow.querySelector(".desc") ||
          lastRow.querySelector("input");
        if (descInput) {
          descInput.value = descText;
          console.log("✅ تم وضع الوصف في آخر بند:", descText);
          speak("كتبت وصف البند.");
          if (typeof updatePreviewText === "function") updatePreviewText();
        } else {
          console.warn("لم يتم إيجاد خانة وصف البند داخل الصف");
          speak("ما لقيت خانة الوصف.");
        }
      } else {
        speak("ما لقيت بند أكتب فيه الوصف.");
      }
      return;
    }

    // ===== المبلغ =====
    if (
      lowered.startsWith("المبلغ") ||
      lowered.startsWith("ادخل المبلغ") ||
      lowered.startsWith("اكتب المبلغ")
    ) {
      let numPart = rawText
        .replace(/^المبلغ/i, "")
        .replace(/^ادخل المبلغ/i, "")
        .replace(/^اكتب المبلغ/i, "")
        .trim();

      console.log("📦 المبلغ (خام قبل التحويل):", numPart);

      // 1) حوّل الأرقام العربية إلى إنجليزية
      numPart = arabicDigitsToEnglish(numPart);

      // 2) خذ فقط الأرقام والمسافات بينها
      let onlyDigitsAndSpaces = numPart.replace(/[^\d\s]/g, "");
      // 3) احذف المسافات بين الأرقام تماماً
      let joinDigits = onlyDigitsAndSpaces.replace(/\s+/g, "");
      console.log("🔢 بعد تنظيف الأرقام:", joinDigits);

      let value = 0;

      if (joinDigits) {
        value = Number(joinDigits);
        console.log("✅ رقم من الأرقام:", value);
      } else {
        // لا توجد أرقام… جرّب الكلمات
        value = arabicWordsToNumber(numPart);
        console.log("🧠 تحويل كلمات إلى رقم (تقريبي):", value);
      }

      const lastRow = getLastEntryRow();
      if (lastRow && value > 0) {
        const amountInput =
          lastRow.querySelector(".entry-amount") ||
          lastRow.querySelector(".amount");
        if (amountInput) {
          amountInput.value = value;
          speak("تم إدخال المبلغ " + value.toLocaleString("en-US"));
          if (typeof updatePreviewText === "function") updatePreviewText();
        } else {
          speak("ما لقيت خانة المبلغ.");
        }
      } else {
        speak("ما قدرت أفهم رقم المبلغ يا بسام.");
      }
      return;
    }

    // ===== العملة =====
    if (lowered.includes("العمله") || lowered.includes("العملة")) {
      const lastRow = getLastEntryRow();
      if (!lastRow) {
        speak("ما في بند عشان أغير العملة.");
        return;
      }

      const currSelect =
        lastRow.querySelector(".entry-curr") ||
        lastRow.querySelector(".currency");
      if (!currSelect) {
        speak("ما لقيت خانة العملة.");
        return;
      }

      console.log("💱 نص العملة:", lowered);

      if (lowered.includes("يمني") || lowered.includes("ريال يمني") || lowered.includes("بالريال")) {
        currSelect.value = "يمني";
        speak("تم تعيين العملة يمني.");
      } else if (lowered.includes("سعودي") || lowered.includes("ريال سعودي")) {
        currSelect.value = "سعودي";
        speak("تم تعيين العملة سعودي.");
      } else if (lowered.includes("درهم")) {
        currSelect.value = "درهم";
        speak("تم تعيين العملة درهم.");
      } else if (lowered.includes("دولار")) {
        currSelect.value = "دولار";
        speak("تم تعيين العملة دولار.");
      } else if (lowered.includes("عماني") || lowered.includes("عمان")) {
        currSelect.value = "عماني";
        speak("تم تعيين العملة عماني.");
      } else {
        speak("ما فهمت نوع العملة.");
      }

      if (typeof updatePreviewText === "function") updatePreviewText();
      return;
    }

    // ===== له =====
    if (
      lowered.includes("خله له") ||
      lowered.includes("خليها له") ||
      lowered.endsWith(" له")
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

    // ===== عليه =====
    if (
      lowered.includes("خله عليه") ||
      lowered.includes("خليها عليه") ||
      lowered.endsWith(" عليه")
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
      lowered.includes("احفظ الكشف") ||
      lowered.includes("حفظ الكشف") ||
      lowered.includes("سجل الكشف")
    ) {
      console.log("💾 أمر: حفظ الكشف بالصوت");
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

    // ===== لم يفهم الأمر =====
    console.warn("❓ لم يتم التعرف على الأمر:", rawText);
    speak("سمعتك تقول: " + rawText + " لكن ما فهمت أمرك يا بسام.");
  }
})();
