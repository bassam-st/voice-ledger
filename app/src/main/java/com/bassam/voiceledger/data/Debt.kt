package com.bassam.voiceledger.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity
data class Debt(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,

    val person: String,                // اسم الشخص
    val amount: Double,                // المبلغ
    val currency: String = "ريال",     // العملة
    val dueDate: Long? = null,         // تاريخ الاستحقاق (اختياري)
    val note: String = "",             // ملاحظات
    val isPaid: Boolean = false,       // هل تم السداد؟
    val createdAt: Long = System.currentTimeMillis()   // وقت الإضافة
)
