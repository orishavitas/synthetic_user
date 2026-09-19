package com.syntheticuser.healthbridge

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateGroupByDurationRequest
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Duration
import java.time.Instant
import org.json.JSONArray
import org.json.JSONObject

/** Wraps the Health Connect Jetpack client and serializes results as the JSON shapes the MCP server expects. */
class HealthConnectRepository(private val context: Context) {

    companion object {
        val READ_PERMISSIONS: Set<String> = setOf(
            HealthPermission.getReadPermission(StepsRecord::class),
            HealthPermission.getReadPermission(HeartRateRecord::class),
            HealthPermission.getReadPermission(SleepSessionRecord::class),
            HealthPermission.getReadPermission(WeightRecord::class),
            HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
            HealthPermission.getReadPermission(DistanceRecord::class),
            HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        )

        /** Not exhaustive; Health Connect defines 80+ exercise type codes. Covers the common ones. */
        private val EXERCISE_TYPE_NAMES = mapOf(
            79 to "WALKING",
            56 to "RUNNING",
            8 to "BIKING",
            82 to "SWIMMING_POOL",
            37 to "HIKING",
            80 to "STRENGTH_TRAINING",
            101 to "YOGA",
            0 to "OTHER_WORKOUT",
        )

        fun sleepStageName(stage: Int): String = when (stage) {
            SleepSessionRecord.STAGE_TYPE_AWAKE -> "AWAKE"
            SleepSessionRecord.STAGE_TYPE_AWAKE_IN_BED -> "AWAKE_IN_BED"
            SleepSessionRecord.STAGE_TYPE_SLEEPING -> "SLEEPING"
            SleepSessionRecord.STAGE_TYPE_OUT_OF_BED -> "OUT_OF_BED"
            SleepSessionRecord.STAGE_TYPE_LIGHT -> "LIGHT"
            SleepSessionRecord.STAGE_TYPE_DEEP -> "DEEP"
            SleepSessionRecord.STAGE_TYPE_REM -> "REM"
            else -> "UNKNOWN"
        }
    }

    fun sdkStatus(): Int = HealthConnectClient.getSdkStatus(context)

    fun isAvailable(): Boolean = sdkStatus() == HealthConnectClient.SDK_AVAILABLE

    private fun client(): HealthConnectClient = HealthConnectClient.getOrCreate(context)

    suspend fun grantedPermissions(): Set<String> =
        client().permissionController.getGrantedPermissions()

    suspend fun hasAllPermissions(): Boolean =
        grantedPermissions().containsAll(READ_PERMISSIONS)

    suspend fun steps(start: Instant, end: Instant): JSONObject {
        val range = TimeRangeFilter.between(start, end)
        val total = client()
            .aggregate(AggregateRequest(setOf(StepsRecord.COUNT_TOTAL), range))[StepsRecord.COUNT_TOTAL] ?: 0L

        val buckets = client().aggregateGroupByDuration(
            AggregateGroupByDurationRequest(
                metrics = setOf(StepsRecord.COUNT_TOTAL),
                timeRangeFilter = range,
                timeRangeSlicer = Duration.ofHours(1),
            ),
        )

        val bucketsJson = JSONArray()
        for (bucket in buckets) {
            bucketsJson.put(
                JSONObject()
                    .put("start", bucket.startTime.toString())
                    .put("end", bucket.endTime.toString())
                    .put("count", bucket.result[StepsRecord.COUNT_TOTAL] ?: 0L),
            )
        }

        return JSONObject().put("totalSteps", total).put("buckets", bucketsJson)
    }

    suspend fun heartRate(start: Instant, end: Instant): JSONObject {
        val records = client().readRecords(
            ReadRecordsRequest(HeartRateRecord::class, TimeRangeFilter.between(start, end)),
        ).records

        val samples = JSONArray()
        for (record in records) {
            for (sample in record.samples) {
                samples.put(
                    JSONObject()
                        .put("time", sample.time.toString())
                        .put("bpm", sample.beatsPerMinute),
                )
            }
        }
        return JSONObject().put("samples", samples)
    }

    suspend fun sleepSessions(start: Instant, end: Instant): JSONObject {
        val records = client().readRecords(
            ReadRecordsRequest(SleepSessionRecord::class, TimeRangeFilter.between(start, end)),
        ).records

        val sessions = JSONArray()
        for (record in records) {
            val stages = JSONArray()
            for (stage in record.stages) {
                stages.put(
                    JSONObject()
                        .put("stage", sleepStageName(stage.stage))
                        .put("start", stage.startTime.toString())
                        .put("end", stage.endTime.toString()),
                )
            }
            sessions.put(
                JSONObject()
                    .put("start", record.startTime.toString())
                    .put("end", record.endTime.toString())
                    .put("stages", stages),
            )
        }
        return JSONObject().put("sessions", sessions)
    }

    suspend fun weightRecords(start: Instant, end: Instant): JSONObject {
        val records = client().readRecords(
            ReadRecordsRequest(WeightRecord::class, TimeRangeFilter.between(start, end)),
        ).records

        val out = JSONArray()
        for (record in records) {
            out.put(
                JSONObject()
                    .put("time", record.time.toString())
                    .put("kg", record.weight.inKilograms),
            )
        }
        return JSONObject().put("records", out)
    }

    suspend fun activeCalories(start: Instant, end: Instant): JSONObject {
        val range = TimeRangeFilter.between(start, end)
        val total = client()
            .aggregate(AggregateRequest(setOf(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL), range))[
            ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL,
        ]?.inKilocalories ?: 0.0

        val buckets = client().aggregateGroupByDuration(
            AggregateGroupByDurationRequest(
                metrics = setOf(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL),
                timeRangeFilter = range,
                timeRangeSlicer = Duration.ofHours(1),
            ),
        )
        val bucketsJson = JSONArray()
        for (bucket in buckets) {
            bucketsJson.put(
                JSONObject()
                    .put("start", bucket.startTime.toString())
                    .put("end", bucket.endTime.toString())
                    .put(
                        "kcal",
                        bucket.result[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories ?: 0.0,
                    ),
            )
        }

        return JSONObject().put("totalKcal", total).put("buckets", bucketsJson)
    }

    suspend fun distance(start: Instant, end: Instant): JSONObject {
        val range = TimeRangeFilter.between(start, end)
        val total = client()
            .aggregate(AggregateRequest(setOf(DistanceRecord.DISTANCE_TOTAL), range))[DistanceRecord.DISTANCE_TOTAL]
            ?.inMeters ?: 0.0

        val buckets = client().aggregateGroupByDuration(
            AggregateGroupByDurationRequest(
                metrics = setOf(DistanceRecord.DISTANCE_TOTAL),
                timeRangeFilter = range,
                timeRangeSlicer = Duration.ofHours(1),
            ),
        )
        val bucketsJson = JSONArray()
        for (bucket in buckets) {
            bucketsJson.put(
                JSONObject()
                    .put("start", bucket.startTime.toString())
                    .put("end", bucket.endTime.toString())
                    .put("meters", bucket.result[DistanceRecord.DISTANCE_TOTAL]?.inMeters ?: 0.0),
            )
        }

        return JSONObject().put("totalMeters", total).put("buckets", bucketsJson)
    }

    suspend fun exerciseSessions(start: Instant, end: Instant): JSONObject {
        val records = client().readRecords(
            ReadRecordsRequest(ExerciseSessionRecord::class, TimeRangeFilter.between(start, end)),
        ).records

        val sessions = JSONArray()
        for (record in records) {
            sessions.put(
                JSONObject()
                    .put("start", record.startTime.toString())
                    .put("end", record.endTime.toString())
                    .put(
                        "exerciseType",
                        EXERCISE_TYPE_NAMES[record.exerciseType] ?: "CODE_${record.exerciseType}",
                    )
                    .put("title", record.title ?: JSONObject.NULL),
            )
        }
        return JSONObject().put("sessions", sessions)
    }
}
