package com.worldcup2026.liveapp.data.model

data class ScoreStats(
    val match_id: String,
    val possession_a: Int = 50,
    val possession_b: Int = 50,
    val shots_a: Int = 0,
    val shots_b: Int = 0,
    val corners_a: Int = 0,
    val corners_b: Int = 0,
    val yellow_cards_a: Int = 0,
    val yellow_cards_b: Int = 0,
    val red_cards_a: Int = 0,
    val red_cards_b: Int = 0
)
