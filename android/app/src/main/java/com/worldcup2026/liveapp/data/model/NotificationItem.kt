package com.worldcup2026.liveapp.data.model

data class NotificationItem(
    val id: String,
    val title: String,
    val message: String,
    val category: String, // GOAL_ALERT, MATCH_STARTED, MATCH_FINISHED, FEATURE_UPDATE, ANNOUNCEMENT
    val match_id: String? = null,
    val sent_at: String? = null,
    val status: String,
    val created_at: String
)
