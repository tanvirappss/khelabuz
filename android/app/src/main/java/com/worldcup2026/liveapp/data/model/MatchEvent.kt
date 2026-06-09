package com.worldcup2026.liveapp.data.model

data class MatchEvent(
    val id: String,
    val match_id: String,
    val team_id: String?,
    val type: String, // GOAL, PENALTY, OWN_GOAL, VAR, YELLOW_CARD, RED_CARD, SUBSTITUTION, MATCH_START, MATCH_END
    val minute: Int,
    val extra_minute: Int? = null,
    val player_in: String? = null,
    val player_out: String? = null,
    val detail: String? = null,
    var team: Team? = null
)
