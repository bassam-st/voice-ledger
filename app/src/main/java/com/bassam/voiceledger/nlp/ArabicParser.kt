package com.bassam.voiceledger.nlp

import java.text.SimpleDateFormat
import java.util.Locale

object ArabicParser {

    data class Parsed(
        val person: String?,
        val amount: Double?,
        val currency: String?,
        val dueMillis: Long?,
        val note: String
    )

    private val months = mapOf(
        "يناير" to 1, "فبراير" to 2, "مارس" to 3, "ابريل" to 4, "أبريل" to 4,
        "مايو" to 5, "يونيو" to 6, "يوليو" to 7, "اغسطس" to 8, "أغسطس" to 8,
        "سبتمبر" to 9, "اكتوبر" to 10, "أكتوبر" to 10, "نوفمبر" to 11, "ديسمبر" to 12
    )

    fun parse(input: String): Parsed {

        val text = input
            .replace("سجل عندك", "")
            .replace("سجّل عندك", "")
            .replace("سجل دين", "")
            .replace("سجّل دين", "")
            .trim()

        // استخراج اسم الشخص
        val nameRegex = Regex("(?:عند|على|ل|لـ)\\s+([\\u0600-\\u06FFa-zA-Z]+)")
        val person = nameRegex.find(text)?.groupValues?.getOrNull(1)

        // استخراج المبلغ + العملة
        val amountRegex = Regex("(\\d+[\\.,]?\\d*)\\s*(ريال|درهم|دولار|SAR|AED|USD)?")
        val amtMatch = amountRegex.find(text)

        val amount = amtMatch?.groupValues?.getOrNull(1)
            ?.replace(',', '.')
            ?.toDoubleOrNull()

        val currency = amtMatch?.groupValues?.getOrNull(2)?.ifBlank { null }
            ?: when {
                text.contains("درهم") -> "درهم"
                text.contains("دولار") -> "دولار"
                else -> "ريال"
            }

        // استخراج التاريخ (أرقام)
        val dateRegex = Regex("(\\d{1,2})[/-](\\d{1,2})[/-](\\d{2,4})")
        var dueMillis: Long? = dateRegex.find(text)?.let {
            val day = it.groupValues[1].padStart(2, '0')
            val month = it.groupValues[2].padStart(2, '0')
            val year = it.groupValues[3].let { y -> if (y.length == 2) "20$y" else y }

            SimpleDateFormat("dd/MM/yyyy", Locale.US)
                .parse("$day/$month/$year")?.time
        }

        // استخراج التاريخ بالكلمات (مثال: 1 ديسمبر 2025)
        if (dueMillis == null) {
            val wordsRegex = Regex("(\\d{1,2})\\s+([\\u0600-\\u06FF]+)(?:\\s+(\\d{4}))?")
            val match = wordsRegex.find(text)

            if (match != null) {
                val day = match.groupValues[1].padStart(2, '0')
                val monthName = match.groupValues[2]
                val monthNum = months[monthName]

                val year = if (match.groupValues[3].isNotBlank())
                    match.groupValues[3]
                else
                    SimpleDateFormat("yyyy", Locale.US).format(java.util.Date())

                if (monthNum != null) {
                    dueMillis = SimpleDateFormat("dd/MM/yyyy", Locale.US)
                        .parse("$day/$monthNum/$year")?.time
                }
            }
        }

        // الباقي يصبح ملاحظة
        val note = text
            .replace(nameRegex, "")
            .replace(amountRegex, "")
            .replace(dateRegex, "")
            .trim()

        return Parsed(
            person = person,
            amount = amount,
            currency = currency,
            dueMillis = dueMillis,
            note = note
        )
    }
}
