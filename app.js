// app.js
function executeIntent(intent) {

    switch (intent.action) {

        case "new_statement":
            newStatement();
            speak("تم فتح كشف جديد يا بسام");
            break;

        case "add_entry":
            addEntry();
            speak("تم إضافة بند جديد");
            break;

        case "set_desc":
            setLastDesc(intent.value);
            speak("تم وضع الوصف");
            break;

        case "set_amount":
            setLastAmount(intent.value);
            speak("تم إدخال المبلغ");
            break;

        case "set_currency":
            setLastCurrency(intent.value);
            speak("تم تغيير العملة");
            break;

        case "set_direction":
            setLastDirection(intent.value);
            speak("تم تحديد الجهة");
            break;

        case "save":
            saveStatement();
            speak("تم حفظ الكشف");
            break;

        case "export_pdf":
            exportPDF();
            speak("تم إرسال الملف");
            break;

        default:
            speak("لم أفهم أمرك يا بسام، أعد من فضلك");
    }
}

function speak(text) {
    const s = new SpeechSynthesisUtterance(text);
    s.lang = "ar-SA";
    speechSynthesis.speak(s);
}
