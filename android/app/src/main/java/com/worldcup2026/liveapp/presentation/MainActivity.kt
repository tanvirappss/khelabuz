package com.worldcup2026.liveapp.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.worldcup2026.liveapp.data.model.AdNetwork
import com.worldcup2026.liveapp.domain.repository.MatchRepository
import com.worldcup2026.liveapp.presentation.ads.AdWebView
import com.worldcup2026.liveapp.presentation.details.MatchDetailsScreen
import com.worldcup2026.liveapp.presentation.home.HomeScreen
import com.worldcup2026.liveapp.presentation.notifications.NotificationCenterScreen
import com.worldcup2026.liveapp.presentation.splash.SplashScreen
import com.worldcup2026.liveapp.presentation.stream.StreamingScreen
import com.worldcup2026.liveapp.presentation.theme.WorldCupTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var matchRepository: MatchRepository

    override fun onCreate(
        savedInstanceState: Bundle?
    ) {
        super.onCreate(savedInstanceState)
        
        setContent {
            WorldCupTheme {
                val navController = rememberNavController()
                var activeAdScript by remember { mutableStateOf("") }

                // Fetch active ads asynchronously
                LaunchedEffect(Unit) {
                    withContext(Dispatchers.IO) {
                        try {
                            val ads = matchRepository.getAdNetworks()
                            val activeAd = ads.find { it.is_enabled }
                            if (activeAd != null) {
                                activeAdScript = activeAd.banner_script ?: ""
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                }

                // Retrieve current route to conditionally display Ad banner
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                Scaffold(
                    bottomBar = {
                        // Display Ad banner on Home, Details and Notification screen only
                        // (Do not render on Splash or true fullscreen landscape Streaming page)
                        val showBanner = currentRoute != "splash" && 
                                         currentRoute != "stream/{matchId}" && 
                                         activeAdScript.isNotBlank()
                        
                        if (showBanner) {
                            AdWebView(htmlScript = activeAdScript)
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        NavHost(
                            navController = navController,
                            startDestination = "splash"
                        ) {
                            // SPLASH SCREEN
                            composable("splash") {
                                SplashScreen(
                                    onNavigateToHome = {
                                        navController.navigate("home") {
                                            popUpTo("splash") { inclusive = true }
                                        }
                                    }
                                )
                            }

                            // HOME SCREEN
                            composable("home") {
                                HomeScreen(
                                    onNavigateToStream = { matchId ->
                                        navController.navigate("stream/$matchId")
                                    },
                                    onNavigateToDetails = { matchId ->
                                        navController.navigate("details/$matchId")
                                    },
                                    onNavigateToNotifications = {
                                        navController.navigate("notifications")
                                    }
                                )
                            }

                            // LIVE STREAMING PLAYER
                            composable(
                                route = "stream/{matchId}",
                                arguments = listOf(navArgument("matchId") { type = NavType.StringType })
                            ) { backStackEntry ->
                                val matchId = backStackEntry.arguments?.getString("matchId") ?: ""
                                StreamingScreen(
                                    matchId = matchId,
                                    onNavigateBack = { navController.popBackStack() }
                                )
                            }

                            // FIXTURE DETAILS (STATS/TIMELINE)
                            composable(
                                route = "details/{matchId}",
                                arguments = listOf(navArgument("matchId") { type = NavType.StringType })
                            ) { backStackEntry ->
                                val matchId = backStackEntry.arguments?.getString("matchId") ?: ""
                                MatchDetailsScreen(
                                    matchId = matchId,
                                    onNavigateBack = { navController.popBackStack() }
                                )
                            }

                            // NOTIFICATION CENTER
                            composable("notifications") {
                                NotificationCenterScreen(
                                    onNavigateBack = { navController.popBackStack() }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
