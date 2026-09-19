package com.syntheticuser.healthbridge

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/**
 * Periodically pushes a rolling window of Health Connect data to the cloud MCP server's
 * /api/sync endpoint, so Claude can read it without the phone needing to be reachable live.
 *
 * Uploads a wide (48h) window every run so a missed sync (phone offline, Doze, etc.) is
 * backfilled by the next one, rather than leaving a permanent gap.
 */
class SyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    companion object {
        const val WORK_NAME = "health_connect_sync"
        private val WINDOW = 48L to ChronoUnit.HOURS
        private val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val syncUrl = SyncPrefs.syncUrl(applicationContext)
        val apiKey = SyncPrefs.syncApiKey(applicationContext)
        if (syncUrl.isNullOrBlank() || apiKey.isNullOrBlank()) {
            return@withContext Result.failure()
        }

        val repository = HealthConnectRepository(applicationContext)
        if (!repository.isAvailable() || !repository.hasAllPermissions()) {
            SyncPrefs.recordSyncResult(applicationContext, "Skipped: Health Connect not available/authorized")
            return@withContext Result.failure()
        }

        // Align to whole hours so re-uploading an overlapping window produces identical bucket
        // boundaries (the server upserts on start_time, so this keeps syncs idempotent).
        val end = Instant.now().truncatedTo(ChronoUnit.HOURS).plus(1, ChronoUnit.HOURS)
        val start = end.minus(WINDOW.first, WINDOW.second)

        return@withContext try {
            val payload = JSONObject()
                .put("steps", repository.steps(start, end))
                .put("heartRate", repository.heartRate(start, end))
                .put("sleep", repository.sleepSessions(start, end))
                .put("weight", repository.weightRecords(start, end))
                .put("activeCalories", repository.activeCalories(start, end))
                .put("distance", repository.distance(start, end))
                .put("exercise", repository.exerciseSessions(start, end))

            val request = Request.Builder()
                .url("$syncUrl/api/sync")
                .header("Authorization", "Bearer $apiKey")
                .post(payload.toString().toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    SyncPrefs.recordSyncResult(applicationContext, "OK at ${Instant.now()}")
                    Result.success()
                } else {
                    val body = response.body?.string().orEmpty()
                    SyncPrefs.recordSyncResult(applicationContext, "HTTP ${response.code}: $body")
                    Result.retry()
                }
            }
        } catch (e: Exception) {
            SyncPrefs.recordSyncResult(applicationContext, "Error: ${e.message}")
            Result.retry()
        }
    }
}
