package com.syntheticuser.healthbridge

import android.content.Context

/** Shared preferences for the Vercel-hosted sync endpoint, read by both the UI and [SyncWorker]. */
object SyncPrefs {
    private const val PREFS_NAME = "health_bridge"
    private const val KEY_SYNC_URL = "sync_url"
    private const val KEY_SYNC_API_KEY = "sync_api_key"
    private const val KEY_LAST_SYNC_STATUS = "last_sync_status"

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun syncUrl(context: Context): String? = prefs(context).getString(KEY_SYNC_URL, null)
    fun syncApiKey(context: Context): String? = prefs(context).getString(KEY_SYNC_API_KEY, null)

    fun save(context: Context, syncUrl: String, syncApiKey: String) {
        prefs(context).edit()
            .putString(KEY_SYNC_URL, syncUrl.trimEnd('/'))
            .putString(KEY_SYNC_API_KEY, syncApiKey)
            .apply()
    }

    fun isConfigured(context: Context): Boolean =
        !syncUrl(context).isNullOrBlank() && !syncApiKey(context).isNullOrBlank()

    fun lastSyncStatus(context: Context): String? = prefs(context).getString(KEY_LAST_SYNC_STATUS, null)

    fun recordSyncResult(context: Context, message: String) {
        prefs(context).edit().putString(KEY_LAST_SYNC_STATUS, message).apply()
    }
}
