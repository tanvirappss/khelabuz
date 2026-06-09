package com.worldcup2026.liveapp.data.model

data class Match(
    val id: String,
    val team_a_id: String,
    val team_b_id: String,
    val team_a_score: Int = 0,
    val team_b_score: Int = 0,
    val status: String, // UPCOMING, LIVE, FINISHED
    val tournament: String = "FIFA World Cup 2026",
    val stadium: String,
    val start_time: String,
    val team_a: Team? = null,
    val team_b: Team? = null
)
