package com.worldcup2026.liveapp

import android.app.Application
import com.onesignal.OneSignal
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@HiltAndroidApp
class WorldCupApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // Initialize OneSignal Push Notifications
        // The App ID will be pulled dynamically or hardcoded here in final builds
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Default OneSignal Init
                OneSignal.initWithContext(this@WorldCupApplication, "YOUR_ONESIGNAL_APP_ID")
                
                // Prompt user for push notifications
                OneSignal.Notifications.requestPermission(true)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
