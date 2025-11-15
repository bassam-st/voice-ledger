package com.bassam.voiceledger.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.bassam.voiceledger.data.AppDb
import com.bassam.voiceledger.data.Debt
import com.bassam.voiceledger.data.DebtRepository
import com.bassam.voiceledger.nlp.ArabicParser
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class DebtViewModel(app: Application) : AndroidViewModel(app) {

    private val repo: DebtRepository =
        DebtRepository(AppDb.getInstance(app).debtDao())

    // قائمة الديون غير المسددة
    val unpaid: StateFlow<List<Debt>> =
        repo.getUnpaid()
            .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    // إضافة دين من الصوت
    fun addFromVoice(text: String) {
        val parsed = ArabicParser.parse(text)

        val debt = Debt(
            person = parsed.person ?: "غير محدد",
            amount = parsed.amount ?: 0.0,
            currency = parsed.currency ?: "ريال",
            dueDate = parsed.dueMillis,
            note = parsed.note
        )

        viewModelScope.launch {
            repo.insert(debt)
        }
    }

    // إضافة يدوي
    fun addManual(person: String, amount: Double, currency: String, note: String) {
        val debt = Debt(
            person = person.ifBlank { "غير محدد" },
            amount = amount,
            currency = currency,
            note = note
        )

        viewModelScope.launch {
            repo.insert(debt)
        }
    }

    // تحديد دين كمسدّد
    fun markPaid(id: Long) {
        viewModelScope.launch {
            repo.markPaid(id)
        }
    }
}
