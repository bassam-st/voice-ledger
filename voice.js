const API_URL = "https://voice-ledger.onrender.com/voice-command";

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("voiceAssistantBtn");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        if (!navigator.mediaDevices) {
            alert("المتصفح لا يدعم التسجيل الصوتي.");
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        let chunks = [];

        alert("🎤 يبدأ التسجيل... تكلم الآن");

        recorder.ondataavailable = e => chunks.push(e.data);

        recorder.onstop = async () => {
            alert("⏳ جاري تحليل الصوت...");

            const blob = new Blob(chunks, { type: "audio/webm" });
            const formData = new FormData();
            formData.append("audio", blob);

            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    body: formData
                });

                const data = await res.json();

                // تنفيذ الأمر
                if (data.action === "add_entry") {
                    addNewEntry();
                }
                if (data.action === "set_title") {
                    document.getElementById("statementTitle").value = data.title;
                }
                if (data.action === "set_client_name") {
                    document.getElementById("clientName").value = data.client_name;
                }

                // نطق الرد
                speak(data.reply || "تم");

            } catch (err) {
                alert("خطأ في الاتصال بالخادم الصوتي");
            }
        };

        recorder.start();

        setTimeout(() => {
            recorder.stop();
        }, 4000);
    });
});

function speak(text) {
    const tts = new SpeechSynthesisUtterance(text);
    tts.lang = "ar";
    speechSynthesis.speak(tts);
}
