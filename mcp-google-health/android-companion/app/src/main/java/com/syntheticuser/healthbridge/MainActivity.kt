package com.syntheticuser.healthbridge

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.health.connect.client.permission.PermissionController
import androidx.lifecycle.lifecycleScope
import com.syntheticuser.healthbridge.databinding.ActivityMainBinding
import java.net.NetworkInterface
import java.util.UUID
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var repository: HealthConnectRepository
    private lateinit var prefs: SharedPreferences
    private var serverRunning = false

    companion object {
        private const val PREFS_NAME = "health_bridge"
        private const val KEY_API_KEY = "api_key"
        private const val BRIDGE_PORT = 8787
    }

    private val requestPermissions = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract(),
    ) { refreshStatus() }

    private val requestNotificationPermission = registerForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.RequestPermission(),
    ) { /* Notification is best-effort; the foreground service still runs without it pre-33. */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        repository = HealthConnectRepository(applicationContext)
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        binding.grantPermissionsButton.setOnClickListener {
            lifecycleScope.launch { requestPermissions.launch(HealthConnectRepository.READ_PERMISSIONS) }
        }

        binding.toggleServerButton.setOnClickListener { toggleServer() }

        refreshStatus()
    }

    override fun onResume() {
        super.onResume()
        refreshStatus()
    }

    private fun apiKey(): String =
        prefs.getString(KEY_API_KEY, null) ?: UUID.randomUUID().toString().also {
            prefs.edit().putString(KEY_API_KEY, it).apply()
        }

    private fun refreshStatus() {
        if (!repository.isAvailable()) {
            binding.statusText.text = "Health Connect is not available on this device.\n" +
                "Install/update the Health Connect app from Google Play, or use Android 14+."
            binding.grantPermissionsButton.isEnabled = false
            binding.toggleServerButton.isEnabled = false
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
            binding.toggleServerButton.isEnabled = hasAll
            updateConnectionInfo()
        }
    }

    private fun toggleServer() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ActivityCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            requestNotificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }

        val intent = Intent(this, BridgeForegroundService::class.java)
            .putExtra(BridgeForegroundService.EXTRA_PORT, BRIDGE_PORT)
            .putExtra(BridgeForegroundService.EXTRA_API_KEY, apiKey())

        if (serverRunning) {
            stopService(intent)
        } else {
            ActivityCompat.startForegroundService(this, intent)
        }
        serverRunning = !serverRunning
        binding.toggleServerButton.text = if (serverRunning) "Stop bridge server" else "Start bridge server"
        updateConnectionInfo()
    }

    private fun updateConnectionInfo() {
        val addresses = localIpv4Addresses().ifEmpty { listOf("<no network connection found>") }
        val urls = addresses.joinToString("\n") { "http://$it:$BRIDGE_PORT" }

        binding.connectionInfoText.text = buildString {
            appendLine("Server: ${if (serverRunning) "RUNNING" else "stopped"}")
            appendLine()
            appendLine("On the laptop running the MCP server, set:")
            appendLine("HEALTH_BRIDGE_URL=<one of the URLs below>")
            appendLine(urls)
            appendLine()
            appendLine("HEALTH_BRIDGE_API_KEY=${apiKey()}")
            appendLine()
            appendLine("(Phone and laptop must be on the same Wi-Fi network, or use")
            appendLine("'adb reverse tcp:$BRIDGE_PORT tcp:$BRIDGE_PORT' over USB and")
            appendLine("HEALTH_BRIDGE_URL=http://127.0.0.1:$BRIDGE_PORT instead.)")
        }
    }

    private fun localIpv4Addresses(): List<String> =
        try {
            NetworkInterface.getNetworkInterfaces().toList()
                .filter { it.isUp && !it.isLoopback }
                .flatMap { it.inetAddresses.toList() }
                .filter { it.hostAddress?.contains(":") == false }
                .mapNotNull { it.hostAddress }
        } catch (_: Exception) {
            emptyList()
        }
}
