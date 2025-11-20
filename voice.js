// ============================
//  ملف voice.js
//  مساعد بسّام الصوتي – أوامر محلّية بدون اشتراك
// ============================

(function () {
  const btn = document.getElementById("voiceAssistantBtn");
  if (!btn) return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  let recognition = null;
  let listening = false;

  // دالة نطق
  function speak(text) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("Speech synthesis not available", e);
    }
  }

  // لو المتصفح لا يدعم التعرف على الصوت
  if (!SpeechRecognition) {
    btn.disabled = true;
    btn.textContent = "🎤 الميكروفون غير مدعوم في هذا المتصفح";
    return;
  }

  // تهيئة التعرف على الصوت
  recognition = new SpeechRecognition();
  recognition.lang = "ar-SA";
  recognition.continuous = false;
  recognition.interimResults = false;

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
    alert("حدث خطأ في الميكروفون أو التعرف على الصوت: " + e.error);
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.trim();
    console.log("🗣️ سمعتك تقول:", text);
    handleVoiceCommand(text);
  };

  // زر تشغيل/إيقاف الاستماع
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

  // ============================
  //     مساعدات للوصول للعناصر
  // ============================

  function getEl(id) {
    return document.getElementById(id);
  }

  function getLastEntryRow() {
    const container = getEl("entriesContainer");
    if (!container || !container.children.length) return null;
    return container.children[container.children.length - 1];
  }

  function normalize(text) {
    return text.trim().toLowerCase();
  }

  // ============================
  //        معالجة الأوامر
  // ============================

  function handleVoiceCommand(rawText) {
    const text = normalize(rawText);

    const clientInput = getEl("clientName");
    const dateInput = getEl("statementDate");
    const titleInput = getEl("statementTitle");
    const entriesContainer = getEl("entriesContainer");
    const extraNotes = getEl("extraNotes");

    // ===== 1) كشف جديد =====
    if (
      text.includes("كشف جديد") ||
      text.includes("افتح كشف جديد") ||
      text.includes("سجل كشف جديد")
    ) {
      // نستخدم resetForm الموجودة في index.html إن وُجدت
      if (typeof resetForm === "function") {
        resetForm(clientInput ? clientInput.value : "");
      } else {
        // تفريغ يدوي احتياطي
        if (clientInput) clientInput.value = clientInput.value || "";
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
        if (titleInput) titleInput.value = "";
        if (extraNotes) extraNotes.value = "";
        if (entriesContainer) {
          entriesContainer.innerHTML = "";
          if (typeof addEntryRow === "function") addEntryRow();
        }
        if (typeof updatePreviewText === "function") updatePreviewText();
      }

      speak("حاضر يا بسام، فتحت لك كشف جديد.");
      return;
    }

    // ===== 2) اسم العميل: "اسم العميل محمد" أو "العميل محمد" =====
    if (text.startsWith("اسم العميل") || text.startsWith("العميل")) {
      let name = text
        .replace("اسم العميل", "")
        .replace("العميل", "")
        .trim();
      if (clientInput && name) {
        clientInput.value = name;
        speak("سجلت اسم العميل " + name);
        if (typeof updatePreviewText === "function") updatePreviewText();
      } else {
        speak("ما فهمت اسم العميل يا بسام.");
      }
      return;
    }

    // ===== 3) عنوان الكشف =====
    if (text.startsWith("عنوان الكشف") || text.startsWith("العنوان")) {
      const title = text
        .replace("عنوان الكشف", "")
        .replace("العنوان", "")
        .trim();
      if (titleInput && title) {
        titleInput.value = title;
        speak("تم تعيين عنوان الكشف.");
        if (typeof updatePreviewText === "function") updatePreviewText();
      } else {
        speak("ما فهمت العنوان يا بسام.");
      }
      return;
    }

    // ===== 4) إضافة بند جديد =====
    if (
      text.includes("اضف بند") ||
      text.includes("أضف بند") ||
      text.includes("ضيف بند") ||
      text.includes("بند جديد") ||
      text.includes("زود بند")
    ) {
      if (typeof addEntryRow === "function") {
        addEntryRow();
        speak("تم إضافة بند جديد يا بسام.");
      } else {
        speak("لا أستطيع إضافة بند الآن، يوجد خطأ في الصفحة.");
      }
      return;
    }

    // ===== 5) وصف البند =====
    // مثال: "وصف البند البيان والتحسين"
    if (text.startsWith("وصف البند")) {
      const desc = text.replace("وصف البند", "").trim();
      const lastRow = getLastEntryRow();
      if (lastRow && desc) {
        const descInput =
          lastRow.querySelector(".entry-desc") ||
          lastRow.querySelector("input");
        if (descInput) descInput.value = desc;
        speak("كتبت وصف البند.");
        if (typeof updatePreviewText === "function") updatePreviewText();
      } else {
        speak("ما لقيت بند أكتب فيه الوصف.");
      }
      return;
    }

    // ===== 6) المبلغ =====
    // مثال: "المبلغ 150000" أو "ادخل المبلغ 2000"
    if (
      text.startsWith("المبلغ") ||
      text.startsWith("ادخل المبلغ") ||
      text.startsWith("اكتب المبلغ")
    ) {
      const numText = text
        .replace("المبلغ", "")
        .replace("ادخل المبلغ", "")
        .replace("اكتب المبلغ", "")
        .trim()
        .replace(/[^\d]/g, "");
      const value = Number(numText || "0");
      const lastRow = getLastEntryRow();
      if (lastRow && value > 0) {
        const amountInput =
          lastRow.querySelector(".entry-amount") ||
          lastRow.querySelector("input[type='number']");
        if (amountInput) {
          amountInput.value = value;
          speak("تم إدخال المبلغ.");
          if (typeof updatePreviewText === "function") updatePreviewText();
        } else {
          speak("ما لقيت خانة المبلغ يا بسام.");
        }
      } else {
        speak("ما قدرت أقرأ رقم المبلغ يا بسام.");
      }
      return;
    }

    // ===== 7) العملة =====
    // مثال: "العملة يمني / سعودي / درهم / دولار / عماني"
    if (text.includes("العملة") || text.includes("عملة")) {
      const lastRow = getLastEntryRow();
      if (!lastRow) {
        speak("ما في بند عشان أعدل عليه العملة.");
        return;
      }
      const currSelect =
        lastRow.querySelector(".entry-curr") ||
        lastRow.querySelector("select");

      if (!currSelect) {
        speak("ما قدرت أجد خانة العملة.");
        return;
      }

      if (text.includes("يمني")) {
        currSelect.value = "يمني";
        speak("تم تعيين العملة يمني.");
      } else if (text.includes("سعودي")) {
        currSelect.value = "سعودي";
        speak("تم تعيين العملة سعودي.");
      } else if (text.includes("درهم")) {
        currSelect.value = "درهم";
        speak("تم تعيين العملة درهم.");
      } else if (text.includes("دولار")) {
        currSelect.value = "دولار";
        speak("تم تعيين العملة دولار.");
      } else if (text.includes("عماني")) {
        currSelect.value = "عماني";
        speak("تم تعيين العملة عماني.");
      } else {
        speak("ما فهمت نوع العملة يا بسام.");
      }

      if (typeof updatePreviewText === "function") updatePreviewText();
      return;
    }

    // ===== 8) له / عليه =====
    // "خليها له" / "خله له" / "خليها عليه" / "خله عليه"
    if (
      text.includes("خليه له") ||
      text.includes("خليها له") ||
      text.includes("خله له")
    ) {
      const lastRow = getLastEntryRow();
      if (lastRow) {
        const dirSelect =
          lastRow.querySelector(".entry-dir") ||
          lastRow.querySelector(".direction") ||
          lastRow.querySelector("select:last-of-type");
        if (dirSelect) {
          dirSelect.value = "له";
          speak("تم تعيينها له.");
          if (typeof updatePreviewText === "function") updatePreviewText();
        } else {
          speak("ما لقيت خانة له أو عليه.");
        }
      } else {
        speak("ما لقيت بند أعدل عليه يا بسام.");
      }
      return;
    }

    if (
      text.includes("خليه عليه") ||
      text.includes("خليها عليه") ||
      text.includes("خله عليه")
    ) {
      const lastRow = getLastEntryRow();
      if (lastRow) {
        const dirSelect =
          lastRow.querySelector(".entry-dir") ||
          lastRow.querySelector(".direction") ||
          lastRow.querySelector("select:last-of-type");
        if (dirSelect) {
          dirSelect.value = "عليه";
          speak("تم تعيينها عليه.");
          if (typeof updatePreviewText === "function") updatePreviewText();
        } else {
          speak("ما لقيت خانة له أو عليه.");
        }
      } else {
        speak("ما لقيت بند أعدل عليه يا بسام.");
      }
      return;
    }

    // ===== 9) حفظ الكشف =====
    if (
      text.includes("احفظ الكشف") ||
      text.includes("حفظ الكشف") ||
      text.includes("سجل الكشف")
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

    // ===== 10) تحية بسيطة =====
    if (text.includes("السلام") || text.includes("مرحبا") || text.includes("هلا")) {
      speak("هلا يا بسام، أنا مساعدك الصوتي لكشوفات العملاء، تحت أمرك.");
      return;
    }

    // لو ما فهمنا الأمر
    speak("سمعتك تقول: " + rawText + " لكن ما فهمت الأمر يا بسام.");
  }
})();
