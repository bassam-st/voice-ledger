package com.bassam.voiceledger.data

class DebtRepository(private val dao: DebtDao) {

    // إرجاع الديون غير المسددة
    fun getUnpaid() = dao.getUnpaid()

    // إرجاع كل الديون
    fun getAll() = dao.getAll()

    // إضافة دين جديد
    suspend fun insert(debt: Debt) = dao.insert(debt)

    // تحديد دين بأنه "تم السداد"
    suspend fun markPaid(id: Long) = dao.markPaid(id)
}
