package com.worldcup2026.liveapp.data.model

data class AdNetwork(
    val id: String,
    val name: String,
    val banner_script: String? = null,
    val native_script: String? = null,
    val social_bar_script: String? = null,
    val header_script: String? = null,
    val footer_script: String? = null,
    val is_enabled: Boolean = false
)
// Model representation of active script arrays dynamically parsed from Supabase
data class AdNetworkList(val networks: List<AdNetwork>)
