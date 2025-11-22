(async function () {
  const btn = document.getElementById("voiceAssistantBtn");
  if (!btn) return;

  // Whisper model to use
  const WHISPER_MODEL = "base"; // الأفضل

  // التحويل إلى نص باستخدام نموذج Whisper
  async function transcribeAudio(blob) {
    const formData = new FormData();
    formData.append("file", blob, "voice.webm");
    formData.append("model", WHISPER_MODEL);

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const data = await res.json();
    return data.text;
  }

  // ================== التسجيل الصوتي ===================
  let recorder, chunks = [], listening = false;

  btn.addEventListener("click", async () => {
    if (listening) {
      recorder.stop();
      listening = false;
      btn.textContent = "🎤 مساعد بسّام الصوتي";
    } else {
      await startRecording();
    }
  });

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const text = await transcribeAudio(blob);
      console.log("🎧 النص المُستمع:", text);
      handleVoiceCommand(text.trim());
    };

    recorder.start();
    listening = true;
    btn.textContent = "🎙️ أستمع لك الآن يا بسّام...";
  }

  // ================== أدوات المساعدة ===================
  const clientInput = document.getElementById("clientName");
  const titleInput = document.getElementById("statementTitle");

  const entriesContainer = document.getElementById("entriesContainer");

  function say(msg) {
    const ut = new SpeechSynthesisUtterance(msg);
    ut.lang = "ar-SA";
    speechSynthesis.speak(ut);
  }

  // تحليل الأرقام الكبيرة من الكلام  
  function extractNumber(sentence) {
    const digits = sentence.match(/\d+/g);
    if (!digits) return null;
    return Number(digits.join(""));
  }

  // موافقة العملات
  function detectCurrency(text) {
    if (text.includes("يمني") || text.includes("ريال يمني")) return "يمني";
    if (text.includes("سعودي") || text.includes("ريال سعودي")) return "سعودي";
    if (text.includes("درهم")) return "درهم";
    if (text.includes("دولار")) return "دولار";
    if (text.includes("عماني")) return "عماني";
    return null;
  }

  // ================== إضافة بند ===================
  function addEntryRowVoice(initial = {}) {
    const row = document.createElement("div");
    row.className = "entry-row";

    const desc = document.createElement("input");
    desc.placeholder = "وصف البند";
    desc.className = "entry-desc";

    const amount = document.createElement("input");
    amount.type = "number";
    amount.placeholder = "المبلغ";
    amount.className = "entry-amount";

    const curr = document.createElement("select");
    ["يمني","سعودي","درهم","دولار","عماني"].forEach(c=>{
      const o=document.createElement("option");
      o.value=c; o.textContent=c; curr.append(o);
    });
    curr.className="entry-curr";

    const dir = document.createElement("select");
    ["له","عليه"].forEach(c=>{
      const o=document.createElement("option");
      o.value=c; o.textContent=c; dir.append(o);
    });
    dir.className="entry-dir";

    const del=document.createElement("button");
    del.textContent="حذف";
    del.className="pill-btn pill-red";
    del.onclick=()=>row.remove();

    if(initial.desc) desc.value=initial.desc;
    if(initial.amount) amount.value=initial.amount;
    if(initial.currency) curr.value=initial.currency;
    if(initial.direction) dir.value=initial.direction;

    row.append(desc,amount,curr,dir,del);
    entriesContainer.appendChild(row);

    return row;
  }

  // ================== أوامر الصوت ===================
  function handleVoiceCommand(text) {
    text = text.replace("مساعد بسام", "").trim();
    const lower = text.toLowerCase();

    // ====== بند جديد ======
    if (text.includes("بند جديد") || text.includes("اضف بند") || text.includes("إضافة بند")) {
      addEntryRowVoice();
      say("تم إضافة بند جديد");
      return;
    }

    // ====== وصف البند ======
    if (text.startsWith("وصف البند")) {
      const row = entriesContainer.lastElementChild || addEntryRowVoice();
      const descText = text.replace("وصف البند", "").trim();
      row.querySelector(".entry-desc").value = descText;
      say("تم تسجيل وصف البند");
      return;
    }

    // ====== المبلغ ======
    if (text.includes("المبلغ") || text.startsWith("مبلغ")) {
      const row = entriesContainer.lastElementChild || addEntryRowVoice();
      const num = extractNumber(text);
      if (num) {
        row.querySelector(".entry-amount").value = num;
        say("تم تسجيل المبلغ");
      } else {
        say("لم أفهم المبلغ");
      }
      return;
    }

    // ====== العملة ======
    const curr = detectCurrency(text);
    if (curr) {
      const row = entriesContainer.lastElementChild || addEntryRowVoice();
      row.querySelector(".entry-curr").value = curr;
      say("تم تسجيل العملة");
      return;
    }

    // ====== له / عليه ======
    if (text.includes("عليه")) {
      const row = entriesContainer.lastElementChild || addEntryRowVoice();
      row.querySelector(".entry-dir").value = "عليه";
      say("تم ضبطها عليه");
      return;
    }
    if (text.includes("له")) {
      const row = entriesContainer.lastElementChild || addEntryRowVoice();
      row.querySelector(".entry-dir").value = "له";
      say("تم ضبطها له");
      return;
    }

    // ====== اسم العميل ======
    if (text.startsWith("اسم العميل")) {
      const name = text.replace("اسم العميل", "").trim();
      clientInput.value = name;
      say("تم تسجيل اسم العميل");
      return;
    }

    // ====== عنوان الكشف ======
    if (text.startsWith("عنوان الكشف")) {
      const name = text.replace("عنوان الكشف", "").trim();
      titleInput.value = name;
      say("تم تسجيل عنوان الكشف");
      return;
    }

    // إذا لم يفهم الأمر
    say("سمعتك تقول: " + text + " لكن لم أفهم الأمر");
  }
})();
