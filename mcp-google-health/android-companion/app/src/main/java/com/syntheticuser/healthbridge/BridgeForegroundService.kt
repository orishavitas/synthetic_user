package com.syntheticuser.healthbridge

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * Keeps [BridgeHttpServer] alive while the app is backgrounded, so a laptop-side MCP client can
 * keep polling this phone without the OS killing the process.
 */
class BridgeForegroundService : Service() {

    companion object {
        const val EXTRA_PORT = "port"
        const val EXTRA_API_KEY = "apiKey"
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "health_bridge_channel"
    }

    private var server: BridgeHttpServer? = null
    val binder = LocalBinder()

    inner class LocalBinder : android.os.Binder() {
        fun service(): BridgeForegroundService = this@BridgeForegroundService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val port = intent?.getIntExtra(EXTRA_PORT, 8787) ?: 8787
        val apiKey = intent?.getStringExtra(EXTRA_API_KEY)

        startForeground(NOTIFICATION_ID, buildNotification(port))

        if (server == null) {
            server = BridgeHttpServer(port, HealthConnectRepository(applicationContext), apiKey).also {
                it.start(NanoHttpdTimeoutMs, false)
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        server?.stop()
        server = null
        super.onDestroy()
    }

    fun isRunning(): Boolean = server != null

    private fun buildNotification(port: Int): Notification {
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ID,
                    getString(R.string.bridge_notification_channel),
                    NotificationManager.IMPORTANCE_LOW,
                ),
            )
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText("Serving Health Connect data on port $port")
            .setSmallIcon(android.R.drawable.ic_menu_myplaces)
            .setOngoing(true)
            .build()
    }
}

private const val NanoHttpdTimeoutMs = 60_000
