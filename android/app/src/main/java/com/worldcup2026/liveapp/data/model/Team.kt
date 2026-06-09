package com.worldcup2026.liveapp.data.model

data class Team(
    val id: String,
    val name: String,
    val code: String,
    val flag_url: String,
    val primary_color: String = "#000000",
    val secondary_color: String = "#ffffff"
)
