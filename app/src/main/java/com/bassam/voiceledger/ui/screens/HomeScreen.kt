package com.bassam.voiceledger.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.bassam.voiceledger.data.Debt
import com.bassam.voiceledger.ui.components.DebtRow
import com.bassam.voiceledger.viewmodel.DebtViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    vm: DebtViewModel,
    onAddByVoice: () -> Unit
) {
    val unpaid by vm.unpaid.collectAsState()
    var showManual by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("ذاكرة الديون") }
            )
        }
    ) { padding ->
        Column(
            Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize()
        ) {

            // أزرار الإضافة
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onAddByVoice,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("إضافة بالصوت")
                }

                OutlinedButton(
                    onClick = { showManual = true },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("إضافة يدويًا")
                }
            }

            Spacer(Modifier.height(20.dp))

            Text("الديون غير المسددة:", style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(10.dp))

            // قائمة الديون
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(unpaid) { debt: Debt ->
                    DebtRow(
                        debt = debt,
                        onPaid = { vm.markPaid(debt.id) }
                    )
                }
            }
        }

        // نافذة الإدخال اليدوي
        if (showManual) {
            ManualDebtDialog(
                onSave = { person, amount, currency, note ->
                    vm.addManual(person, amount, currency, note)
                    showManual = false
                },
                onCancel = { showManual = false }
            )
        }
    }
}

@Composable
fun ManualDebtDialog(
    onSave: (String, Double, String, String) -> Unit,
    onCancel: () -> Unit
) {
    var person by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }
    var currency by remember { mutableStateOf("ريال") }
    var note by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onCancel,
        confirmButton = {
            TextButton(onClick = {
                val amount = amountText.toDoubleOrNull() ?: 0.0
                onSave(person, amount, currency, note)
            }) {
                Text("حفظ")
            }
        },
        dismissButton = {
            TextButton(onClick = onCancel) {
                Text("إلغاء")
            }
        },
        title = { Text("إضافة دين يدويًا") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {

                OutlinedTextField(
                    value = person,
                    onValueChange = { person = it },
                    label = { Text("اسم الشخص") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text("المبلغ") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = currency,
                    onValueChange = { currency = it },
                    label = { Text("العملة") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("ملاحظة") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    )
}
