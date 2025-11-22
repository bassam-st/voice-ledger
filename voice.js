// voice.js — نسخة العمل الأصلية بالكامل

(function () {
  const btn = document.getElementById("voiceAssistantBtn");
  if (!btn) return;

  // التحقق من دعم المتصفح
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    btn.disabled = true;
    btn.textContent = "🎤 المساعد الصوتي غير مدعوم في هذا المتصفح";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ar-SA";
  recognition.interimResults = false;
  let listening = false;

  btn.addEventListener("click", () => {
    if (listening) recognition.stop();
    else recognition.start();
  });

  recognition.onstart = () => {
    listening = true;
    btn.textContent = "🎙️ أستمع لك الآن...";
  };

  recognition.onend = () => {
    listening = false;
    btn.textContent = "🎤 مساعد بسّام الصوتي";
  };

  recognition.onerror = (e) => {
    listening = false;
    btn.textContent = "🎤 مساعد بسّام الصوتي";
    console.error(e);
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.trim();
    console.log("%c[VOICE HEARD] → " + text, "color: green; font-size:16px");
    handleVoiceCommand(text);
  };

  //==============================
  // ذكاء قراءة الأرقام كما كانت تعمل
  //==============================
  function extractNumber(text) {
    let num = text.replace(/[^\d]/g, "");
    return num ? parseInt(num, 10) : null;
  }

  //==============================
  // تنفيذ الأوامر الصوتية
  //==============================
  function handleVoiceCommand(text) {
    const client = document.getElementById("clientName");
    const title = document.getElementById("statementTitle");

    //========= إضافة بند جديد =========
    if (/بند جديد|اضف بند|ضيف بند/.test(text)) {
      if (typeof addEntryRow === "function") {
        addEntryRow();
        speak("تم إضافة بند جديد");
      }
      return;
    }

    //========= كتابة اسم العميل =========
    if (text.startsWith("اسم العميل")) {
      const name = text.replace("اسم العميل", "").trim();
      if (client) client.value = name;
      speak("سجلت اسم العميل");
      return;
    }

    //========= عنوان الكشف =========
    if (text.startsWith("عنوان الكشف")) {
      const t = text.replace("عنوان الكشف", "").trim();
      if (title) title.value = t;
      speak("تم تسجيل العنوان");
      return;
    }

    // ========= وصف البند =========
    if (text.startsWith("وصف البند") || text.startsWith("الوصف")) {
      const last = document.querySelector(".entry-desc:last-of-type");
      const content = text.replace("وصف البند", "").replace("الوصف", "").trim();
      if (last) {
        last.value = content;
        speak("تم تسجيل وصف البند");
      }
      return;
    }

    // ========= مبلغ البند =========
    if (text.startsWith("المبلغ") || text.startsWith("قيمة")) {
      const last = document.querySelector(".entry-amount:last-of-type");
      let num = extractNumber(text);
      if (num && last) {
        last.value = num;
        speak("تم تسجيل المبلغ");
      } else {
        speak("لم أفهم المبلغ");
      }
      return;
    }

    // ========= تغيير العملة =========
    if (/يمني|سعودي|درهم|دولار|عماني/.test(text)) {
      const last = document.querySelector(".entry-curr:last-of-type");
      if (last) {
        if (text.includes("يمني")) last.value = "يمني";
        if (text.includes("سعودي")) last.value = "سعودي";
        if (text.includes("درهم")) last.value = "درهم";
        if (text.includes("دولار")) last.value = "دولار";
        if (text.includes("عماني")) last.value = "عماني";
        speak("تم تغيير العملة");
      }
      return;
    }

    // ========= له / عليه =========
    if (text.includes("له")) {
      const last = document.querySelector(".entry-dir:last-of-type");
      if (last) last.value = "له";
      speak("تم تحديد له");
      return;
    }

    if (text.includes("عليه")) {
      const last = document.querySelector(".entry-dir:last-of-type");
      if (last) last.value = "عليه";
      speak("تم تحديد عليه");
      return;
    }

    // لو ما فهم الأمر
    speak("سمعتك تقول " + text);
  }

  //==============================
  // الرد الصوتي
  //==============================
  function speak(message) {
    const utter = new SpeechSynthesisUtterance(message);
    utter.lang = "ar-SA";
    window.speechSynthesis.speak(utter);
  }
})();
