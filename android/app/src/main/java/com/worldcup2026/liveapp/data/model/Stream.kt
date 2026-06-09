package com.worldcup2026.liveapp.data.model

data class Stream(
    val id: String,
    val match_id: String,
    val name: String,
    val primary_url: String,
    val backup_url_1: String? = null,
    val backup_url_2: String? = null,
    val backup_url_3: String? = null,
    val is_enabled: Boolean = true
)
