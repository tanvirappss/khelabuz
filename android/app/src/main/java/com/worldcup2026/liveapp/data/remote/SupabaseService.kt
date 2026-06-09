package com.worldcup2026.liveapp.data.remote

import com.worldcup2026.liveapp.data.model.*
import retrofit2.http.GET
import retrofit2.http.Query

interface SupabaseService {

    @GET("rest/v1/matches")
    suspend fun getMatches(
        @Query("select") select: String = "*,team_a:teams!matches_team_a_id_fkey(*),team_b:teams!matches_team_b_id_fkey(*)",
        @Query("order") order: String = "start_time.desc"
    ): List<Match>

    @GET("rest/v1/streams")
    suspend fun getStreams(
        @Query("select") select: String = "*",
        @Query("is_enabled") isEnabled: String = "eq.true"
    ): List<Stream>

    @GET("rest/v1/score_updates")
    suspend fun getScoreUpdates(
        @Query("select") select: String = "*"
    ): List<ScoreStats>

    @GET("rest/v1/match_events")
    suspend fun getMatchEvents(
        @Query("match_id") matchId: String,
        @Query("select") select: String = "*,team:teams!match_events_team_id_fkey(*)",
        @Query("order") order: String = "minute.asc"
    ): List<MatchEvent>

    @GET("rest/v1/notifications")
    suspend fun getNotifications(
        @Query("select") select: String = "*",
        @Query("status") status: String = "eq.SENT",
        @Query("order") order: String = "created_at.desc"
    ): List<NotificationItem>

    @GET("rest/v1/ad_networks")
    suspend fun getAdNetworks(
        @Query("select") select: String = "*"
    ): List<AdNetwork>
}
