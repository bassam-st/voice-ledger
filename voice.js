// ============================
//  ملف voice.js
//  مساعد بسّام الصوتي (بدون اشتراك، أوامر محليّة)
// ============================

// زر المساعد الصوتي في الصفحة
const voiceBtn = document.getElementById("voiceAssistantBtn");

// فحص دعم المتصفح لواجهة التعرف على الصوت
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let listening = false;

// دالة للنطق بالصوت (الرد على بسّام)
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

// تهيئة التعرف على الصوت إذا كان مدعوم
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "ar-SA";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    listening = true;
    if (voiceBtn) {
      voiceBtn.textContent = "🎙️ يستمع لك... اضغط للإيقاف";
      voiceBtn.style.background = "#b91c1c";
    }
  };

  recognition.onend = () => {
    listening = false;
    if (voiceBtn) {
      voiceBtn.textContent = "🎤 مساعد بسّام الصوتي";
      voiceBtn.style.background = "#15803d";
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    speak("عفواً يا بسام، حصل خطأ في الميكروفون.");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    console.log("🗣️ سمع:", transcript);
    handleCommand(transcript);
  };
} else {
  // المتصفح لا يدعم الميكروفون
  if (voiceBtn) {
    voiceBtn.textContent = "🎙️ الميكروفون غير مدعوم";
    voiceBtn.disabled = true;
  }
  console.warn("This browser does not support SpeechRecognition");
}

// عند الضغط على زر المساعد الصوتي
if (voiceBtn && recognition) {
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
}

// ============================
//     أوامر بسّام الصوتية
// ============================

// مساعدات للوصول للعناصر
function getEl(id) {
  return document.getElementById(id);
}

function getLastEntryRow() {
  const container = getEl("entriesContainer");
  if (!container || !container.children.length) return null;
  return container.children[container.children.length - 1];
}

// تنظيف النص (تحويل لأحرف صغيرة وإزالة مسافات)
function normalize(text) {
  return text.toLowerCase().trim();
}

// ----- قاموس ألفاظ العملات -----
const currencyWords = {
  "يمني": "يمني",
  "ريال يمني": "يمني",
  "السعر يمني": "يمني",
  "سعودي": "سعودي",
  "ريال": "سعودي",
  "ريال سعودي": "سعودي",
  "السعودي": "سعودي",
  "درهم": "درهم",
  "درهم اماراتي": "درهم",
  "درهم إماراتي": "درهم",
  "الدرهم": "درهم",
  "دولار": "دولار",
  "الدولار": "دولار",
  "امريكي": "دولار",
  "أمريكي": "دولار",
  "عماني": "عماني",
  "ريال عماني": "عماني",
  "العماني": "عماني"
};

function detectCurrency(text) {
  const t = text.toLowerCase();
  for (const key in currencyWords) {
    if (t.includes(key)) return currencyWords[key];
  }
  return null;
}

// تنفيذ الأوامر
function handleCommand(rawText) {
  const text = normalize(rawText);

  // ===== كشف جديد =====
  if (text.includes("كشف جديد") || text.includes("افتح كشف") || text.includes("سجل كشف")) {
    const clientInput = getEl("clientName");
    const dateInput = getEl("dateInput") || getEl("statementDate");
    const titleInput = getEl("statementTitle");
    const extraNotes = getEl("extraNotes");
    const entriesContainer = getEl("entriesContainer");

    if (clientInput) clientInput.value = "";
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
    if (titleInput) titleInput.value = "";
    if (extraNotes) extraNotes.value = "";
    if (entriesContainer) {
      entriesContainer.innerHTML = "";
      if (typeof addEntryRow === "function") {
        addEntryRow();
      }
    }
    if (typeof updatePreviewText === "function") updatePreviewText();
    if (typeof renderStatementsList === "function") renderStatementsList();

    speak("حاضر يا بسام، فتحت لك كشف جديد.");
    return;
  }

  // ===== اسم العميل: "اسم العميل محمد" أو "العميل محمد" =====
  if (text.startsWith("اسم العميل") || text.startsWith("العميل")) {
    const name = rawText
      .replace(/اسم العميل/i, "")
      .replace(/العميل/i, "")
      .trim();
    const clientInput = getEl("clientName");
    if (clientInput && name) {
      clientInput.value = name;
      speak("تم تعيين اسم العميل " + name);
      if (typeof updatePreviewText === "function") updatePreviewText();
    } else {
      speak("ما فهمت اسم العميل يا بسام.");
    }
    return;
  }

  // ===== عنوان الكشف: "عنوان الكشف شحنة سيارات" =====
  if (text.startsWith("عنوان الكشف") || text.startsWith("العنوان")) {
    const title = rawText
      .replace(/عنوان الكشف/i, "")
      .replace(/العنوان/i, "")
      .trim();
    const titleInput = getEl("statementTitle");
    if (titleInput && title) {
      titleInput.value = title;
      speak("تم تعيين عنوان الكشف.");
      if (typeof updatePreviewText === "function") updatePreviewText();
    } else {
      speak("ما فهمت العنوان يا بسام.");
    }
    return;
  }

  // ===== إضافة بند جديد: "اضف بند" / "ضيف بند جديد" =====
  if (
    text.includes("اضف بند") ||
    text.includes("أضف بند") ||
    text.includes("ضيف بند") ||
    text.includes("زود بند")
  ) {
    if (typeof addEntryRow === "function") {
      addEntryRow();
    } else {
      const btn = getEl("addEntryBtn");
      if (btn) btn.click();
    }
    speak("تم إضافة بند جديد يا بسام.");
    return;
  }

  // ===== وصف البند: "وصف البند بيان وتحسين" =====
  if (text.startsWith("وصف البند")) {
    const desc = rawText.replace(/وصف البند/i, "").trim();
    const lastRow = getLastEntryRow();
    if (lastRow && desc) {
      const descInput = lastRow.querySelector(".entry-desc, .desc, input");
      if (descInput) descInput.value = desc;
      speak("كتبت وصف البند.");
      if (typeof updatePreviewText === "function") updatePreviewText();
    } else {
      speak("ما لقيت بند أكتب فيه الوصف.");
    }
    return;
  }

  // ===== المبلغ: "المبلغ ١٥٠٠٠٠٠" أو "ادخل المبلغ ١٥٠٠" =====
  if (text.startsWith("المبلغ") || text.startsWith("ادخل المبلغ") || text.startsWith("اكتب المبلغ")) {
    // استخراج الأرقام من الكلام
    const numText = rawText
      .replace(/المبلغ/i, "")
      .replace(/ادخل المبلغ/i, "")
      .replace(/اكتب المبلغ/i, "")
      .trim()
      .replace(/[^\d]/g, "");
    const value = Number(numText || "0");
    const lastRow = getLastEntryRow();
    if (lastRow && value > 0) {
      const amountInput = lastRow.querySelector(".entry-amount, .amount");
      if (amountInput) amountInput.value = value;
      speak("تم إدخال المبلغ.");
      if (typeof updatePreviewText === "function") updatePreviewText();
    } else {
      speak("ما قدرت أقرأ رقم المبلغ يا بسام.");
    }
    return;
  }

  // ===== تغيير العملة بالصوت (بأي صيغة فيها اسم العملة) =====
  const detectedCurr = detectCurrency(rawText);
  if (detectedCurr) {
    const lastRow = getLastEntryRow();
    if (!lastRow) {
      speak("ما في بند عشان أعدل عليه العملة.");
      return;
    }
    const currSelect = lastRow.querySelector(".entry-curr, .currency");
    if (!currSelect) {
      speak("ما قدرت أجد خانة العملة.");
      return;
    }
    currSelect.value = detectedCurr;
    speak("تم تعيين العملة " + detectedCurr + ".");
    if (typeof updatePreviewText === "function") updatePreviewText();
    return;
  }

  // ===== له / عليه: "خله له" أو "خله عليه" =====
  if (text.includes("خله له") || text.includes("خليها له") || text.endsWith("له")) {
    const lastRow = getLastEntryRow();
    if (lastRow) {
      const dirSelect = lastRow.querySelector(".entry-dir, .direction");
      if (dirSelect) dirSelect.value = "له";
      speak("تم تعيينها له.");
      if (typeof updatePreviewText === "function") updatePreviewText();
    } else {
      speak("ما لقيت بند أعدل عليه يا بسام.");
    }
    return;
  }

  if (text.includes("خله عليه") || text.includes("خليها عليه") || text.endsWith("عليه")) {
    const lastRow = getLastEntryRow();
    if (lastRow) {
      const dirSelect = lastRow.querySelector(".entry-dir, .direction");
      if (dirSelect) dirSelect.value = "عليه";
      speak("تم تعيينها عليه.");
      if (typeof updatePreviewText === "function") updatePreviewText();
    } else {
      speak("ما لقيت بند أعدل عليه يا بسام.");
    }
    return;
  }

  // ===== حفظ الكشف: "احفظ الكشف" =====
  if (text.includes("احفظ الكشف") || text.includes("حفظ الكشف") || text.includes("سجل الكشف")) {
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

  // ===== أوامر عامة =====
  if (text.includes("السلام") || text.includes("مرحبا") || text.includes("هلا")) {
    speak("هلا يا بسام، أنا مساعدك الصوتي لكشوفات العملاء، تحت أمرك.");
    return;
  }

  // لو ما فهمنا الأمر
  speak("ما فهمت الأمر يا بسام، حاول تعيده بشكل أبسط.");
}
