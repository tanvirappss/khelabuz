package com.worldcup2026.liveapp.data.repository

import com.worldcup2026.liveapp.data.model.*
import com.worldcup2026.liveapp.data.remote.SupabaseConfig
import com.worldcup2026.liveapp.data.remote.SupabaseService
import com.worldcup2026.liveapp.domain.repository.MatchRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MatchRepositoryImpl @Inject constructor(
    private val supabaseService: SupabaseService
) : MatchRepository {

    private val isMock = SupabaseConfig.isMockEnabled()
    private val scope = CoroutineScope(Dispatchers.Default)

    // --- In-Memory Mock Datasets ---
    private val mockTeams = mutableListOf(
        // North America
        Team("t-usa", "United States", "USA", "https://flagcdn.com/w320/us.png", "#002868", "#BF0A30"),
        Team("t-mex", "Mexico", "MEX", "https://flagcdn.com/w320/mx.png", "#006847", "#CE1126"),
        Team("t-can", "Canada", "CAN", "https://flagcdn.com/w320/ca.png", "#FF0000", "#FFFFFF"),
        // South America
        Team("t-arg", "Argentina", "ARG", "https://flagcdn.com/w320/ar.png", "#74ACDF", "#FFFFFF"),
        Team("t-bra", "Brazil", "BRA", "https://flagcdn.com/w320/br.png", "#FFDC02", "#009739"),
        Team("t-uru", "Uruguay", "URU", "https://flagcdn.com/w320/uy.png", "#007FFF", "#FFFFFF"),
        Team("t-col", "Colombia", "COL", "https://flagcdn.com/w320/co.png", "#FCD116", "#003893"),
        Team("t-ecu", "Ecuador", "ECU", "https://flagcdn.com/w320/ec.png", "#FFDD00", "#002E7A"),
        Team("t-par", "Paraguay", "PAR", "https://flagcdn.com/w320/py.png", "#D52B1E", "#0038A8"),
        Team("t-chi", "Chile", "CHI", "https://flagcdn.com/w320/cl.png", "#0039A6", "#D52B1E"),
        Team("t-per", "Peru", "PER", "https://flagcdn.com/w320/pe.png", "#D91414", "#FFFFFF"),
        Team("t-ven", "Venezuela", "VEN", "https://flagcdn.com/w320/ve.png", "#7B1829", "#FFCC00"),
        Team("t-bol", "Bolivia", "BOL", "https://flagcdn.com/w320/bo.png", "#007A33", "#F1E900"),
        // Europe
        Team("t-ger", "Germany", "GER", "https://flagcdn.com/w320/de.png", "#000000", "#FFCC00"),
        Team("t-fra", "France", "FRA", "https://flagcdn.com/w320/fr.png", "#002395", "#ED2939"),
        Team("t-esp", "Spain", "ESP", "https://flagcdn.com/w320/es.png", "#C60B1E", "#F1BF00"),
        Team("t-eng", "England", "ENG", "https://flagcdn.com/w320/gb-eng.png", "#FFFFFF", "#CE1126"),
        Team("t-por", "Portugal", "POR", "https://flagcdn.com/w320/pt.png", "#046A38", "#DA291C"),
        Team("t-ita", "Italy", "ITA", "https://flagcdn.com/w320/it.png", "#0066BC", "#FFFFFF"),
        Team("t-bel", "Belgium", "BEL", "https://flagcdn.com/w320/be.png", "#E30613", "#000000"),
        Team("t-ned", "Netherlands", "NED", "https://flagcdn.com/w320/nl.png", "#F36C21", "#FFFFFF"),
        Team("t-cro", "Croatia", "CRO", "https://flagcdn.com/w320/hr.png", "#FF0000", "#00205B"),
        Team("t-sui", "Switzerland", "SUI", "https://flagcdn.com/w320/ch.png", "#D52B1E", "#FFFFFF"),
        Team("t-den", "Denmark", "DEN", "https://flagcdn.com/w320/dk.png", "#C60C30", "#FFFFFF"),
        Team("t-pol", "Poland", "POL", "https://flagcdn.com/w320/pl.png", "#DC143C", "#FFFFFF"),
        Team("t-tur", "Turkey", "TUR", "https://flagcdn.com/w320/tr.png", "#E30A17", "#FFFFFF"),
        Team("t-ukr", "Ukraine", "UKR", "https://flagcdn.com/w320/ua.png", "#0057B7", "#FFDD00"),
        Team("t-aut", "Austria", "AUT", "https://flagcdn.com/w320/at.png", "#ED2939", "#FFFFFF"),
        Team("t-sco", "Scotland", "SCO", "https://flagcdn.com/w320/gb-sct.png", "#005EB8", "#FFFFFF"),
        Team("t-wal", "Wales", "WAL", "https://flagcdn.com/w320/gb-wls.png", "#A80532", "#00AD50"),
        Team("t-swe", "Sweden", "SWE", "https://flagcdn.com/w320/se.png", "#006AA7", "#FECC00"),
        Team("t-hun", "Hungary", "HUN", "https://flagcdn.com/w320/hu.png", "#CD2A3E", "#436F4D"),
        // Asia & Oceania
        Team("t-jpn", "Japan", "JPN", "https://flagcdn.com/w320/jp.png", "#0005A0", "#FFFFFF"),
        Team("t-kor", "South Korea", "KOR", "https://flagcdn.com/w320/kr.png", "#CD2E3A", "#0047A0"),
        Team("t-aus", "Australia", "AUS", "https://flagcdn.com/w320/au.png", "#00008B", "#FFCC00"),
        Team("t-irn", "Iran", "IRN", "https://flagcdn.com/w320/ir.png", "#239B56", "#DAF7A6"),
        Team("t-sau", "Saudi Arabia", "KSA", "https://flagcdn.com/w320/sa.png", "#006C35", "#FFFFFF"),
        Team("t-qat", "Qatar", "QAT", "https://flagcdn.com/w320/qa.png", "#8A1538", "#FFFFFF"),
        Team("t-nzl", "New Zealand", "NZL", "https://flagcdn.com/w320/nz.png", "#000000", "#FFFFFF"),
        // Africa
        Team("t-mar", "Morocco", "MAR", "https://flagcdn.com/w320/ma.png", "#C1272D", "#006233"),
        Team("t-sen", "Senegal", "SEN", "https://flagcdn.com/w320/sn.png", "#00853F", "#FDEF42"),
        Team("t-nga", "Nigeria", "NGA", "https://flagcdn.com/w320/ng.png", "#008751", "#FFFFFF"),
        Team("t-egy", "Egypt", "EGY", "https://flagcdn.com/w320/eg.png", "#C8102E", "#000000"),
        Team("t-cmr", "Cameroon", "CMR", "https://flagcdn.com/w320/cm.png", "#007A5E", "#FCD116"),
        Team("t-gha", "Ghana", "GHA", "https://flagcdn.com/w320/gh.png", "#DA121A", "#FCD116"),
        Team("t-civ", "Ivory Coast", "CIV", "https://flagcdn.com/w320/ci.png", "#FF8200", "#009E60"),
        Team("t-alg", "Algeria", "ALG", "https://flagcdn.com/w320/dz.png", "#006629", "#FFFFFF"),
        Team("t-rsa", "South Africa", "RSA", "https://flagcdn.com/w320/za.png", "#007A4D", "#E03C31")
    )

    private val mockMatches = mutableListOf(
        Match(
            id = "b4c9f2f0-0001-4d2e-983f-5993efd80001",
            team_a_id = "t-esp",
            team_b_id = "t-eng",
            team_a_score = 2,
            team_b_score = 1,
            status = "FINISHED",
            tournament = "FIFA World Cup 2026",
            stadium = "MetLife Stadium, East Rutherford",
            start_time = getIsoString(-180)
        ),
        Match(
            id = "b4c9f2f0-0002-4d2e-983f-5993efd80002",
            team_a_id = "t-ger",
            team_b_id = "t-fra",
            team_a_score = 1,
            team_b_score = 0,
            status = "LIVE",
            tournament = "FIFA World Cup 2026",
            stadium = "Azteca Stadium, Mexico City",
            start_time = getIsoString(-45)
        ),
        Match(
            id = "b4c9f2f0-0003-4d2e-983f-5993efd80003",
            team_a_id = "t-arg",
            team_b_id = "t-bra",
            team_a_score = 0,
            team_b_score = 0,
            status = "UPCOMING",
            tournament = "FIFA World Cup 2026",
            stadium = "BC Place, Vancouver",
            start_time = getIsoString(1)
        )
    )

    private val mockStreams = mutableListOf(
        Stream("c5da03f0-0001-4e3f-a94b-6004fae90001", "b4c9f2f0-0002-4d2e-983f-5993efd80002", "Main Stream (HLS)", "https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8", "https://demo.unified-streaming.com/k8s/live/stable/sintel.isml/.m3u8", "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8", null)
    )

    private val mockScoreUpdates = mutableMapOf(
        "b4c9f2f0-0002-4d2e-983f-5993efd80002" to ScoreStats("b4c9f2f0-0002-4d2e-983f-5993efd80002", 54, 46, 8, 6, 4, 2, 1, 1, 0, 0)
    )

    private val mockEvents = mutableListOf(
        MatchEvent("d6eb14f0-0001-4f4a-b05c-7115fbf00001", "b4c9f2f0-0002-4d2e-983f-5993efd80002", null, "MATCH_START", 0, null, null, null, "Kick-off! Match started"),
        MatchEvent("d6eb14f0-0002-4f4a-b05c-7115fbf00002", "b4c9f2f0-0002-4d2e-983f-5993efd80002", "t-ger", "GOAL", 32, null, "Thomas Muller", "Jamal Musiala", "Slick combination finish inside the box")
    )

    private val mockNotifications = mutableListOf(
        NotificationItem("1", "⚽ GOAL! Germany vs France", "Thomas Muller scored in the 32' - Germany 1 - 0 France", "GOAL_ALERT", "b4c9f2f0-0002-4d2e-983f-5993efd80002", getIsoString(0), "SENT", getIsoString(-5))
    )

    private val mockAds = mutableListOf(
        AdNetwork("1", "AdSense", "<div style=\"background:#0f172a;color:#10b981;border:1px solid #334155;padding:16px;text-align:center;border-radius:12px;font-weight:bold;\">Google AdSense Banner Banner</div>", null, null, null, null, true),
        AdNetwork("2", "Adsterra", null, null, null, null, null, false)
    )

    init {
        // Start background simulator for real-time scores updates if in Mock Mode
        if (isMock) {
            scope.launch {
                simulateLiveEvents()
            }
        }
    }

    private suspend fun simulateLiveEvents() {
        while (true) {
            delay(8000) // Trigger stat change or event every 8s
            
            // Randomly update stats of the live match (Spain vs England)
            val liveMatchId = "b4c9f2f0-0002-4d2e-983f-5993efd80002"
            val stats = mockScoreUpdates[liveMatchId]
            if (stats != null) {
                val possA = (40..70).random()
                val possB = 100 - possA
                val shotsA = stats.shots_a + (0..1).random()
                val shotsB = stats.shots_b + (0..1).random()
                val cornersA = stats.corners_a + (0..1).random()
                val cornersB = stats.corners_b + (0..1).random()
                
                mockScoreUpdates[liveMatchId] = stats.copy(
                    possession_a = possA,
                    possession_b = possB,
                    shots_a = shotsA,
                    shots_b = shotsB,
                    corners_a = cornersA,
                    corners_b = cornersB
                )
            }
        }
    }

    override fun simulateGoalScored(matchId: String) {
        val matchIndex = mockMatches.indexOfFirst { it.id === matchId }
        if (matchIndex >= 0) {
            val match = mockMatches[matchIndex]
            val isTeamA = (0..1).random() == 0
            val scorerName = listOf("Lionel Messi", "Vinicius Jr", "Alvaro Morata", "Harry Kane", "Kylian Mbappe").random()
            
            // Update Scoreboard
            val updatedMatch = if (isTeamA) {
                match.copy(team_a_score = match.team_a_score + 1)
            } else {
                match.copy(team_b_score = match.team_b_score + 1)
            }
            mockMatches[matchIndex] = updatedMatch

            // Add Match Event
            val activeTeamId = if (isTeamA) match.team_a_id else match.team_b_id
            val minute = (70..89).random()
            val newEvent = MatchEvent(
                id = UUID.randomUUID().toString(),
                match_id = matchId,
                team_id = activeTeamId,
                type = "GOAL",
                minute = minute,
                player_in = scorerName,
                detail = "Stunning shot into the corner"
            )
            mockEvents.add(newEvent)

            // Add System Notification
            val activeTeam = mockTeams.find { it.id == activeTeamId }
            val teamAName = mockTeams.find { it.id == match.team_a_id }?.name ?: ""
            val teamBName = mockTeams.find { it.id == match.team_b_id }?.name ?: ""
            
            val notif = NotificationItem(
                id = UUID.randomUUID().toString(),
                title = "⚽ GOAL! $teamAName vs $teamBName",
                message = "${activeTeam?.name} scored in the $minute' by $scorerName - Current Score: $teamAName ${updatedMatch.team_a_score} - ${updatedMatch.team_b_score} $teamBName",
                category = "GOAL_ALERT",
                match_id = matchId,
                sent_at = getIsoString(0),
                status = "SENT",
                created_at = getIsoString(0)
            )
            mockNotifications.add(0, notif)
        }
    }

    // --- Repository Methods Implementation ---

    override fun getMatchesFlow(): Flow<List<Match>> = flow {
        while (true) {
            emit(getMatches())
            delay(5000) // Poll database every 5s
        }
    }

    override suspend fun getMatches(): List<Match> {
        return if (isMock) {
            mockMatches.map { match ->
                match.copy(
                    team_a = mockTeams.find { it.id == match.team_a_id },
                    team_b = mockTeams.find { it.id == match.team_b_id }
                )
            }
        } else {
            try {
                supabaseService.getMatches()
            } catch (e: Exception) {
                // Network fails: Fallback to mock immediately
                mockMatches.map { match ->
                    match.copy(
                        team_a = mockTeams.find { it.id == match.team_a_id },
                        team_b = mockTeams.find { it.id == match.team_b_id }
                    )
                }
            }
        }
    }

    override fun getMatchEventsFlow(matchId: String): Flow<List<MatchEvent>> = flow {
        while (true) {
            emit(getMatchEvents(matchId))
            delay(5000)
        }
    }

    override suspend fun getMatchEvents(matchId: String): List<MatchEvent> {
        return if (isMock) {
            mockEvents.filter { it.match_id == matchId }.map { ev ->
                ev.apply { team = mockTeams.find { it.id == ev.team_id } }
            }.sortedBy { it.minute }
        } else {
            try {
                supabaseService.getMatchEvents(matchId)
            } catch (e: Exception) {
                mockEvents.filter { it.match_id == matchId }.map { ev ->
                    ev.apply { team = mockTeams.find { it.id == ev.team_id } }
                }.sortedBy { it.minute }
            }
        }
    }

    override fun getScoreStatsFlow(matchId: String): Flow<ScoreStats> = flow {
        while (true) {
            getScoreStats(matchId)?.let { emit(it) }
            delay(5000)
        }
    }

    override suspend fun getScoreStats(matchId: String): ScoreStats? {
        return if (isMock) {
            mockScoreUpdates[matchId] ?: ScoreStats(matchId)
        } else {
            try {
                val list = supabaseService.getScoreUpdates()
                list.find { it.match_id == matchId } ?: ScoreStats(matchId)
            } catch (e: Exception) {
                mockScoreUpdates[matchId] ?: ScoreStats(matchId)
            }
        }
    }

    override suspend fun getStreamsForMatch(matchId: String): List<Stream> {
        return if (isMock) {
            mockStreams.filter { it.match_id == matchId }
        } else {
            try {
                supabaseService.getStreams().filter { it.match_id == matchId }
            } catch (e: Exception) {
                mockStreams.filter { it.match_id == matchId }
            }
        }
    }

    override suspend fun getNotifications(): List<NotificationItem> {
        return if (isMock) {
            mockNotifications
        } else {
            try {
                supabaseService.getNotifications()
            } catch (e: Exception) {
                mockNotifications
            }
        }
    }

    override suspend fun getAdNetworks(): List<AdNetwork> {
        return if (isMock) {
            mockAds
        } else {
            try {
                supabaseService.getAdNetworks()
            } catch (e: Exception) {
                mockAds
            }
        }
    }

    // --- Helper Utilities ---
    private fun getIsoString(minutesOffset: Int): String {
        val tz = TimeZone.getTimeZone("UTC")
        val df = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        df.timeZone = tz
        val cal = Calendar.getInstance()
        if (minutesOffset != 0) {
            if (minutesOffset == 1) {
                cal.add(Calendar.DAY_OF_YEAR, 1) // Tomorrow helper
            } else {
                cal.add(Calendar.MINUTE, minutesOffset)
            }
        }
        return df.format(cal.time)
    }
}
