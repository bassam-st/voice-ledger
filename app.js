// app.js
function executeIntent(intent) {
  switch (intent.action) {

    case "new_statement":
      if (typeof resetForm === "function") {
        resetForm(document.getElementById("clientName")?.value || "");
      }
      speak("تم فتح كشف جديد يا بسام");
      break;

    case "add_entry":
      if (typeof addEntryRow === "function") addEntryRow();
      speak("تم إضافة بند جديد");
      break;

    case "set_desc":
      if (typeof setLastDesc === "function") setLastDesc(intent.value);
      speak("تم وضع الوصف");
      break;

    case "set_amount":
      if (typeof setLastAmount === "function") setLastAmount(intent.value);
      speak("تم إدخال المبلغ");
      break;

    case "set_currency":
      if (typeof setLastCurrency === "function") setLastCurrency(intent.value);
      speak("تم تغيير العملة");
      break;

    case "set_direction":
      if (typeof setLastDirection === "function") setLastDirection(intent.value);
      speak("تم تحديد الجهة");
      break;

    case "save":
      if (typeof saveCurrentStatement === "function") saveCurrentStatement();
      speak("تم حفظ الكشف");
      break;

    case "export_pdf":
      if (typeof printAsPdf === "function") printAsPdf();
      speak("تم تجهيز الطباعة");
      break;

    // ✅ نسخ البنود من كشف سابق عبر الصوت
    case "copy_from_old_statement":
      if (typeof window.copyEntriesFromPreviousStatement === "function") {
        // مهم جداً: اعتبر النسخ بداية كشف جديد حتى لا يعدّل كشف قديم عند تغيير العنوان
        if (typeof window.__markNewDraftAfterCopy === "function") {
          window.__markNewDraftAfterCopy();
        }

        window.copyEntriesFromPreviousStatement();
        speak("اختر الكشف الذي تريد النسخ منه");
      } else {
        speak("ميزة النسخ من كشف سابق غير متاحة حالياً");
      }
      break;

    // ✅ (اختياري) نسخ البنود من آخر كشف عبر الصوت
    case "copy_last_entries":
      if (typeof window.copyLastEntries === "function") {
        if (typeof window.__markNewDraftAfterCopy === "function") {
          window.__markNewDraftAfterCopy();
        }
        window.copyLastEntries();
        speak("تم نسخ البنود من آخر كشف");
      } else {
        speak("ميزة النسخ من آخر كشف غير متاحة حالياً");
      }
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
