package com.syntheticuser.healthbridge

import fi.iki.elonen.NanoHTTPD
import java.time.Instant
import java.time.format.DateTimeParseException
import kotlinx.coroutines.runBlocking
import org.json.JSONArray
import org.json.JSONObject

/**
 * Minimal local HTTP API exposing Health Connect data, meant to be reached over LAN/USB by the
 * Node MCP server running on a laptop during development. Not hardened for public exposure.
 */
class BridgeHttpServer(
    port: Int,
    private val repository: HealthConnectRepository,
    private val apiKey: String?,
) : NanoHTTPD(port) {

    private fun json(status: Response.Status, body: JSONObject): Response =
        newFixedLengthResponse(status, "application/json", body.toString())

    private fun unauthorized() =
        json(Response.Status.UNAUTHORIZED, JSONObject().put("error", "Missing or invalid bearer token."))

    private fun isAuthorized(session: IHTTPSession): Boolean {
        if (apiKey.isNullOrBlank()) return true
        val header = session.headers["authorization"] ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return token == apiKey
    }

    private fun requireInstant(session: IHTTPSession, name: String): Instant? =
        session.parameters[name]?.firstOrNull()?.let {
            try {
                Instant.parse(it)
            } catch (_: DateTimeParseException) {
                null
            }
        }

    override fun serve(session: IHTTPSession): Response {
        if (!isAuthorized(session)) return unauthorized()

        return try {
            when (session.uri) {
                "/status" -> runBlocking {
                    json(
                        Response.Status.OK,
                        JSONObject()
                            .put("healthConnectAvailable", repository.isAvailable())
                            .put("authorized", repository.hasAllPermissions())
                            .put("grantedPermissions", JSONArray(repository.grantedPermissions().toList())),
                    )
                }

                "/records/steps" -> withRange(session) { start, end -> repository.steps(start, end) }
                "/records/heart-rate" -> withRange(session) { start, end -> repository.heartRate(start, end) }
                "/records/sleep" -> withRange(session) { start, end -> repository.sleepSessions(start, end) }
                "/records/weight" -> withRange(session) { start, end -> repository.weightRecords(start, end) }
                "/records/active-calories" -> withRange(session) { start, end -> repository.activeCalories(start, end) }
                "/records/distance" -> withRange(session) { start, end -> repository.distance(start, end) }
                "/records/exercise" -> withRange(session) { start, end -> repository.exerciseSessions(start, end) }

                else -> json(Response.Status.NOT_FOUND, JSONObject().put("error", "Unknown route: ${session.uri}"))
            }
        } catch (e: SecurityException) {
            json(
                Response.Status.FORBIDDEN,
                JSONObject().put("error", "Health Connect permission not granted: ${e.message}"),
            )
        } catch (e: Exception) {
            json(Response.Status.INTERNAL_ERROR, JSONObject().put("error", e.message ?: e.toString()))
        }
    }

    private fun withRange(
        session: IHTTPSession,
        block: suspend (Instant, Instant) -> JSONObject,
    ): Response {
        val start = requireInstant(session, "start")
        val end = requireInstant(session, "end")
        if (start == null || end == null) {
            return json(
                Response.Status.BAD_REQUEST,
                JSONObject().put("error", "Query params 'start' and 'end' must be ISO-8601 instants."),
            )
        }
        return json(Response.Status.OK, runBlocking { block(start, end) })
    }
}
