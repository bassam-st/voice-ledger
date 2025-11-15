package com.bassam.voiceledger.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.bassam.voiceledger.data.Debt
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun DebtRow(
    debt: Debt,
    onPaid: () -> Unit
) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {

            // اسم الشخص + المبلغ
            Text(
                "${debt.person} — ${debt.amount} ${debt.currency}",
                style = MaterialTheme.typography.titleMedium
            )

            Spacer(Modifier.height(4.dp))

            // عرض تاريخ الاستحقاق إذا موجود
            if (debt.dueDate != null) {
                val df = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
                Text(
                    "تاريخ الاستحقاق: ${df.format(Date(debt.dueDate))}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            // ملاحظات
            if (debt.note.isNotBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    "ملاحظة: ${debt.note}",
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Spacer(Modifier.height(10.dp))

            // زر "تم السداد"
            Button(
                onClick = onPaid,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("تم السداد")
            }
        }
    }
}
