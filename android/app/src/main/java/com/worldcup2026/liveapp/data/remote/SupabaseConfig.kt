package com.worldcup2026.liveapp.data.remote

object SupabaseConfig {
    // In production, insert your Supabase project credentials here.
    // Leaving these blank or default will trigger Sandbox Mode using rich mock databases.
    const val SUPABASE_URL = "https://YOUR_SUPABASE_PROJECT_REF.supabase.co"
    const val SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"
    
    fun isMockEnabled(): Boolean {
        return SUPABASE_URL.contains("YOUR_SUPABASE_PROJECT_REF") || 
               SUPABASE_ANON_KEY.contains("YOUR_SUPABASE_ANON_KEY") ||
               SUPABASE_URL.isBlank()
    }
}
