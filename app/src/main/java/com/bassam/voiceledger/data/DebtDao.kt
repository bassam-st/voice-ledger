package com.bassam.voiceledger.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface DebtDao {

    // إرجاع الديون غير المسددة مرتبة حسب تاريخ الاستحقاق
    @Query(
        "SELECT * FROM Debt " +
        "WHERE isPaid = 0 " +
        "ORDER BY dueDate IS NULL, dueDate ASC, createdAt DESC"
    )
    fun getUnpaid(): Flow<List<Debt>>

    // كل الديون (المسددة وغير المسددة)
    @Query("SELECT * FROM Debt ORDER BY createdAt DESC")
    fun getAll(): Flow<List<Debt>>

    // إضافة دين جديد
    @Insert
    suspend fun insert(debt: Debt): Long

    // تعديل سجل
    @Update
    suspend fun update(debt: Debt)

    // حذف سجل
    @Delete
    suspend fun delete(debt: Debt)

    // تحديد الدين كـ "تم السداد"
    @Query("UPDATE Debt SET isPaid = 1 WHERE id = :id")
    suspend fun markPaid(id: Long)
}
