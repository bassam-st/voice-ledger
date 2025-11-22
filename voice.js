// voice.js — مساعد بسّام الصوتي

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

  // تشغيل/إيقاف الاستماع عند الضغط على الزر
  btn.addEventListener("click", () => {
    if (listening) recognition.stop();
    else recognition.start();
  });

  recognition.onstart = () => {
    listening = true;
    btn.textContent = "🎙️ أستمع لك الآن يا بسّام...";
  };

  recognition.onend = () => {
    listening = false;
    btn.textContent = "🎤 مساعد بسّام الصوتي";
  };

  recognition.onerror = (e) => {
    listening = false;
    btn.textContent = "🎤 مساعد بسّام الصوتي";
    console.error("Speech error:", e);
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.trim();
    console.log("%c[VOICE HEARD] → " + text, "color: green; font-size:16px");
    handleVoiceCommand(text);
  };

  //==============================
  // قراءة الأرقام من الكلام (أي رقم digits)
  //==============================
  function extractNumber(text) {
    const digits = text.replace(/[^\d]/g, "");
    if (!digits) return null;
    return parseInt(digits, 10);
  }

  //==============================
  // تنفيذ الأوامر الصوتية
  //==============================
  function handleVoiceCommand(text) {
    const client = document.getElementById("clientName");
    const title = document.getElementById("statementTitle");

    //========= بند جديد =========
    if (/بند جديد|اضف بند|أضف بند|ضيف بند/i.test(text)) {
      if (typeof addEntryRow === "function") {
        addEntryRow();
        speak("تم إضافة بند جديد يا بسام");
      } else {
        speak("لا أستطيع إضافة بند الآن، يوجد خطأ في الصفحة");
      }
      return;
    }

    //========= اسم العميل =========
    if (text.startsWith("اسم العميل")) {
      const name = text.replace("اسم العميل", "").trim();
      if (client && name) {
        client.value = name;
        speak("سجلت اسم العميل " + name);
      } else {
        speak("لم أفهم اسم العميل");
      }
      return;
    }

    //========= عنوان الكشف =========
    if (text.startsWith("عنوان الكشف")) {
      const t = text.replace("عنوان الكشف", "").trim();
      if (title && t) {
        title.value = t;
        speak("سجلت عنوان الكشف");
      } else {
        speak("لم أفهم عنوان الكشف");
      }
      return;
    }

    //========= وصف البند =========
    if (text.startsWith("وصف البند") || text.startsWith("الوصف")) {
      const content = text
        .replace("وصف البند", "")
        .replace("الوصف", "")
        .trim();

      const descInputs = document.querySelectorAll(".entry-desc");
      const last = descInputs[descInputs.length - 1];

      if (last && content) {
        last.value = content;
        speak("كتبت وصف البند");
      } else {
        speak("لم أجد بند أكتب فيه الوصف يا بسام");
      }
      return;
    }

    //========= مبلغ البند =========
    if (text.startsWith("المبلغ") || text.startsWith("قيمة")) {
      const lastAmounts = document.querySelectorAll(".entry-amount");
      const last = lastAmounts[lastAmounts.length - 1];

      const num = extractNumber(text);
      if (last && num !== null) {
        last.value = num;
        speak("تم تسجيل المبلغ " + num);
      } else {
        speak("لم أفهم رقم المبلغ يا بسام");
      }
      return;
    }

    //========= تغيير العملة =========
    if (/يمني|سعودي|درهم|دولار|عماني/i.test(text)) {
      const currs = document.querySelectorAll(".entry-curr");
      const last = currs[currs.length - 1];

      if (!last) {
        speak("لا يوجد بند لأغير عملته");
        return;
      }

      if (text.includes("يمني"))      last.value = "يمني";
      else if (text.includes("سعودي")) last.value = "سعودي";
      else if (text.includes("درهم"))  last.value = "درهم";
      else if (text.includes("دولار")) last.value = "دولار";
      else if (text.includes("عماني")) last.value = "عماني";

      speak("تم تغيير العملة");
      return;
    }

    //========= له / عليه =========
    if (text.includes("له")) {
      const dirs = document.querySelectorAll(".entry-dir");
      const last = dirs[dirs.length - 1];
      if (last) {
        last.value = "له";
        speak("خليتها له");
      }
      return;
    }

    if (text.includes("عليه")) {
      const dirs = document.querySelectorAll(".entry-dir");
      const last = dirs[dirs.length - 1];
      if (last) {
        last.value = "عليه";
        speak("خليتها عليه");
      }
      return;
    }

    //========= تحية / كلام عام =========
    if (text.includes("السلام") || text.includes("مرحبا") || text.includes("هلا")) {
      speak("هلا يا بسام، أنا مساعدك الصوتي، جاهز لأي كشف");
      return;
    }

    // لو ما فهم الأمر
    speak("سمعتك تقول: " + text + " لكن لم أفهم الأمر يا بسام");
  }

  //==============================
  // الرد الصوتي
  //==============================
  function speak(message) {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(message);
    utter.lang = "ar-SA";
    window.speechSynthesis.speak(utter);
  }
})();
