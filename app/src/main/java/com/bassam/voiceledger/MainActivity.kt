package com.bassam.voiceledger

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.speech.RecognizerIntent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import com.bassam.voiceledger.ui.screens.HomeScreen
import com.bassam.voiceledger.viewmodel.DebtViewModel
import java.util.Locale

class MainActivity : ComponentActivity() {

    private val viewModel: DebtViewModel by viewModels()

    private val requestPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    private val voiceLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                val text = result.data
                    ?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                    ?.firstOrNull()
                if (!text.isNullOrBlank()) {
                    viewModel.addFromVoice(text)
                }
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // طلب صلاحية الميكروفون
        requestPermission.launch(Manifest.permission.RECORD_AUDIO)

        setContent {
            MaterialTheme {
                HomeScreen(
                    vm = viewModel,
                    onAddByVoice = { startVoice() }
                )
            }
        }
    }

    private fun startVoice() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
            )
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale("ar", "YE"))
            putExtra(
                RecognizerIntent.EXTRA_PROMPT,
                "تكلّم: مثال — سجل عندك على علاء 500 ريال يستحق 1 ديسمبر"
            )
        }
        voiceLauncher.launch(intent)
    }
}
