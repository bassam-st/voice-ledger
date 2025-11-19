// intent-engine.js
// تحليل النص وتحويله إلى أوامر

function getIntent(text) {
    text = text.trim();

    if (text.includes("كشف جديد") || text.includes("افتح كشف"))
        return { action: "new_statement" };

    if (text.includes("اضف بند") || text.includes("أضف بند"))
        return { action: "add_entry" };

    if (text.includes("الوصف"))
        return { action: "set_desc", value: text.replace("الوصف", "").trim() };

    if (text.includes("المبلغ"))
        return { action: "set_amount", value: extractNumber(text) };

    if (text.includes("العملة"))
        return { action: "set_currency", value: extractCurrency(text) };

    if (text.includes("عليه"))
        return { action: "set_direction", value: "عليه" };

    if (text.includes("له"))
        return { action: "set_direction", value: "له" };

    if (text.includes("احفظ"))
        return { action: "save" };

    if (text.includes("ارسل") || text.includes("pdf"))
        return { action: "export_pdf" };

    return { action: "none" };
}

function extractNumber(text) {
    return text.replace(/\D/g, "");
}

function extractCurrency(text) {
    if (text.includes("يمني")) return "يمني";
    if (text.includes("سعودي")) return "سعودي";
    if (text.includes("درهم")) return "درهم";
    return "";
}
