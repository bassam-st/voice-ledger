// voice.js
(function () {
  const btn = document.getElementById("voiceAssistantBtn");
  if (!btn) return;

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
    if (listening) {
      recognition.stop();
    } else {
      recognition.start();
    }
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
    alert("حدث خطأ في الميكروفون أو التعرف على الصوت: " + e.error);
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.trim();
    console.log("سمعتك تقول:", text);
    handleVoiceCommand(text);
  };

  function handleVoiceCommand(text) {
    const clientInput = document.getElementById("clientName");
    const titleInput = document.getElementById("statementTitle");

    if (/بند جديد|اضف بند|ضيف بند/i.test(text)) {
      if (typeof addEntryRow === "function") {
        addEntryRow();
        say("تم إضافة بند جديد يا بسام");
      } else {
        say("لا أستطيع إضافة بند الآن، يوجد خطأ في الصفحة");
      }
      return;
    }

    if (text.startsWith("اسم العميل")) {
      const name = text.replace("اسم العميل", "").trim();
      if (clientInput) clientInput.value = name;
      say("سجلت اسم العميل " + name);
      return;
    }

    if (text.startsWith("عنوان الكشف")) {
      const st = text.replace("عنوان الكشف", "").trim();
      if (titleInput) titleInput.value = st;
      say("سجلت عنوان الكشف");
      return;
    }

    say("سمعتك تقول: " + text + " لكن لم أفهم الأمر");
  }

  function say(message) {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(message);
    utter.lang = "ar-SA";
    window.speechSynthesis.speak(utter);
  }
})();
