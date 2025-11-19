// voice.js
let mediaRecorder;
let audioChunks = [];

document.getElementById("start-voice").onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    audioChunks = [];
    mediaRecorder.start();

    document.getElementById("voice-text").innerText = "🔴 استمع لك…";

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

        // تحويل الصوت إلى نص
        const text = await transcribeAudio(audioBlob);

        document.getElementById("voice-text").innerText = "✔ " + text;

        // تحليل نية المستخدم
        const intent = getIntent(text);

        // تنفيذ الأمر داخل التطبيق
        executeIntent(intent);
    };

    setTimeout(() => {
        mediaRecorder.stop();
    }, 3000);
};
