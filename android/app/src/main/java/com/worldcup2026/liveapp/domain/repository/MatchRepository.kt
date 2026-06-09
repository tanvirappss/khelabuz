package com.worldcup2026.liveapp.domain.repository

import com.worldcup2026.liveapp.data.model.*
import kotlinx.coroutines.flow.Flow

interface MatchRepository {
    
    // Core Fetch APIs (Returns Flow for reactive scoreboards)
    fun getMatchesFlow(): Flow<List<Match>>
    suspend fun getMatches(): List<Match>
    
    fun getMatchEventsFlow(matchId: String): Flow<List<MatchEvent>>
    suspend fun getMatchEvents(matchId: String): List<MatchEvent>
    
    fun getScoreStatsFlow(matchId: String): Flow<ScoreStats>
    suspend fun getScoreStats(matchId: String): ScoreStats?
    
    suspend fun getStreamsForMatch(matchId: String): List<Stream>
    
    suspend fun getNotifications(): List<NotificationItem>
    
    suspend fun getAdNetworks(): List<AdNetwork>
    
    // Push notifications simulated events (For Sandbox Demo Mode)
    fun simulateGoalScored(matchId: String)
}
