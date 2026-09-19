package com.syntheticuser.healthbridge

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.health.connect.client.permission.PermissionController
import androidx.lifecycle.lifecycleScope
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Constraints
import com.syntheticuser.healthbridge.databinding.ActivityMainBinding
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var repository: HealthConnectRepository

    private val requestPermissions = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract(),
    ) { refreshStatus() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        repository = HealthConnectRepository(applicationContext)

        binding.syncUrlInput.setText(SyncPrefs.syncUrl(this) ?: "")
        binding.syncApiKeyInput.setText(SyncPrefs.syncApiKey(this) ?: "")

        binding.grantPermissionsButton.setOnClickListener {
            lifecycleScope.launch { requestPermissions.launch(HealthConnectRepository.READ_PERMISSIONS) }
        }

        binding.saveSettingsButton.setOnClickListener { saveSettingsAndSchedule() }
        binding.syncNowButton.setOnClickListener { syncNow() }

        refreshStatus()
    }

    override fun onResume() {
        super.onResume()
        refreshStatus()
    }

    private fun refreshStatus() {
        if (!repository.isAvailable()) {
            binding.statusText.text = "Health Connect is not available on this device.\n" +
                "Install/update the Health Connect app from Google Play, or use Android 14+."
            binding.grantPermissionsButton.isEnabled = false
            updateLastSyncText()
            return
        }

        binding.grantPermissionsButton.isEnabled = true

        lifecycleScope.launch {
            val hasAll = repository.hasAllPermissions()
            binding.statusText.text = if (hasAll) {
                "Health Connect access granted."
            } else {
                "Health Connect access not yet granted. Tap the button below."
            }
            binding.syncNowButton.isEnabled = hasAll && SyncPrefs.isConfigured(this@MainActivity)
            updateLastSyncText()
        }
    }

    private fun saveSettingsAndSchedule() {
        val url = binding.syncUrlInput.text.toString().trim()
        val apiKey = binding.syncApiKeyInput.text.toString().trim()

        if (url.isBlank() || apiKey.isBlank()) {
            Toast.makeText(this, "Enter both the sync URL and API key first.", Toast.LENGTH_SHORT).show()
            return
        }
        if (!url.startsWith("https://")) {
            Toast.makeText(this, "Sync URL should be an https:// Vercel deployment URL.", Toast.LENGTH_SHORT).show()
            return
        }

        SyncPrefs.save(this, url, apiKey)

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        // 15 minutes is the minimum interval WorkManager/JobScheduler allow for periodic work.
        val request = PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this)
            .enqueueUniquePeriodicWork(SyncWorker.WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE, request)

        Toast.makeText(this, "Periodic sync enabled (every ~15 min).", Toast.LENGTH_SHORT).show()
        refreshStatus()
    }

    private fun syncNow() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        val request = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueue(request)
        Toast.makeText(this, "Sync started...", Toast.LENGTH_SHORT).show()

        WorkManager.getInstance(this).getWorkInfoByIdLiveData(request.id)
            .observe(this) { info ->
                if (info != null && info.state.isFinished) {
                    updateLastSyncText()
                }
            }
    }

    private fun updateLastSyncText() {
        val status = SyncPrefs.lastSyncStatus(this) ?: "No sync attempted yet."
        val configured = SyncPrefs.isConfigured(this)
        binding.lastSyncText.text = buildString {
            appendLine("Periodic sync: ${if (configured) "configured" else "not configured"}")
            appendLine("Last sync result: $status")
        }
    }
}
