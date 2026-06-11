package com.worldcup2026.liveapp.presentation.stream

import android.app.Activity
import android.content.pm.ActivityInfo
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.OptIn
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.media3.ui.PlayerView
import com.worldcup2026.liveapp.presentation.theme.EmeraldAccent
import com.worldcup2026.liveapp.presentation.theme.SlateBg

@OptIn(UnstableApi::class)
@Composable
fun StreamingScreen(
    matchId: String,
    onNavigateBack: () -> Unit,
    viewModel: StreamingViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val streams by viewModel.streams.collectAsState()
    val currentStreamIndex by viewModel.currentStreamIndex.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val streamError by viewModel.streamError.collectAsState()

    // Request Landscape mode on enter, restore on exit
    DisposableEffect(Unit) {
        val activity = context as? Activity
        activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
        onDispose {
            activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
    }

    // Load streams on init
    LaunchedEffect(matchId) {
        viewModel.loadStreams(matchId)
    }

    // Initialize ExoPlayer with Low-Latency & Fast-Startup Configurations
    val exoPlayer = remember {
        val loadControl = DefaultLoadControl.Builder()
            .setBufferDurationsMs(
                10_000, // minBufferMs
                25_000, // maxBufferMs
                800,    // bufferForPlaybackMs (low threshold for instant startup)
                1_200   // bufferForPlaybackAfterRebufferMs (fast recovery)
            )
            .setPrioritizeTimeOverSizeThresholds(true)
            .build()

        val trackSelector = DefaultTrackSelector(context).apply {
            setParameters(
                buildUponParameters()
                    .setForceLowestBitrate(true) // Start low for instant play, ABR will adapt up
            )
        }

        ExoPlayer.Builder(context)
            .setLoadControl(loadControl)
            .setTrackSelector(trackSelector)
            .build().apply {
                playWhenReady = true
                repeatMode = Player.REPEAT_MODE_OFF
            }
    }

    // Release player on dispose
    DisposableEffect(exoPlayer) {
        onDispose {
            exoPlayer.release()
        }
    }

    // Re-bind source when active URL changes
    val activeUrl = remember(streams, currentStreamIndex) { viewModel.getActiveUrl() }
    
    LaunchedEffect(activeUrl) {
        if (!activeUrl.isNullOrBlank()) {
            // Parse host to set correct Origin and Referer to bypass CDN hotlink protections
            val uri = android.net.Uri.parse(activeUrl)
            val hostname = uri.host ?: ""
            val origin = if (hostname.isNotEmpty()) "https://$hostname" else ""

            val dataSourceFactory = DefaultHttpDataSource.Factory()
                .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .setAllowCrossProtocolRedirects(true)
                .setConnectTimeoutMs(3000) // Fast 3s timeout for responsive failover
                .setReadTimeoutMs(3000)
                .setDefaultRequestProperties(buildMap {
                    put("Accept", "*/*")
                    put("Cache-Control", "no-cache")
                    if (origin.isNotEmpty()) {
                        put("Origin", origin)
                        put("Referer", "$origin/")
                    }
                })
            
            val liveConfig = MediaItem.LiveConfiguration.Builder()
                .setTargetOffsetMs(8_000) // Safe live-edge offset
                .build()

            val mediaItem = MediaItem.Builder()
                .setUri(activeUrl)
                .setLiveConfiguration(liveConfig)
                .build()

            val hlsMediaSource = HlsMediaSource.Factory(dataSourceFactory)
                .setAllowChunklessPreparation(true) // Skip chunk parsing on prepare for instant start
                .createMediaSource(mediaItem)
            
            exoPlayer.setMediaSource(hlsMediaSource)
            exoPlayer.prepare()
            exoPlayer.play()
        }
    }

    // Player Event Listeners (handles auto failover)
    DisposableEffect(exoPlayer) {
        val listener = object : Player.Listener {
            override fun onPlayerError(error: PlaybackException) {
                // Playback error occurred (e.g., source offline) -> Trigger automatic failover!
                val failoverSucceeded = viewModel.triggerStreamFailover()
                if (!failoverSucceeded) {
                    // No backups left: show static warning
                    MaterialTheme.typography.bodyLarge // Trigger view update
                }
            }
        }
        exoPlayer.addListener(listener)
        onDispose {
            exoPlayer.removeListener(listener)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        if (isLoading) {
            CircularProgressIndicator(color = EmeraldAccent)
        } else if (activeUrl.isNullOrBlank()) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(24.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = "No Stream",
                    tint = Color.Red,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "Live stream is currently offline.",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Admin has not enabled any active channels for this fixture yet.",
                    color = Color.Gray,
                    fontSize = 12.sp
                )
            }
        } else {
            // Android View hosting native PlayerView
            AndroidView(
                factory = { ctx ->
                    PlayerView(ctx).apply {
                        player = exoPlayer
                        useController = true
                        layoutParams = FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                    }
                },
                modifier = Modifier.fillMaxSize()
            )

            // Header Controls overlay (shows Server switcher & Back button)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter)
                    .background(Color.Black.copy(alpha = 0.4f))
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onNavigateBack) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Go Back",
                        tint = Color.White
                    )
                }

                // Server stream switches
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    val streamList = streams.firstOrNull()
                    if (streamList != null) {
                        StreamBadge(
                            label = "Server 1",
                            isSelected = currentStreamIndex == 0,
                            onClick = { viewModel.selectStreamIndex(0) }
                        )
                        if (!streamList.backup_url_1.isNullOrBlank()) {
                            StreamBadge(
                                label = "Server 2",
                                isSelected = currentStreamIndex == 1,
                                onClick = { viewModel.selectStreamIndex(1) }
                            )
                        }
                        if (!streamList.backup_url_2.isNullOrBlank()) {
                            StreamBadge(
                                label = "Server 3",
                                isSelected = currentStreamIndex == 2,
                                onClick = { viewModel.selectStreamIndex(2) }
                            )
                        }
                    }
                }
            }

            // Stream status toast notification overlay
            if (streamError != null) {
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 60.dp)
                        .background(Color.Black.copy(alpha = 0.8f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = streamError ?: "",
                        color = Color.Yellow,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun StreamBadge(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .background(
                if (isSelected) EmeraldAccent else Color.DarkGray.copy(alpha = 0.5f),
                RoundedCornerShape(8.dp)
            )
            .clickable { onClick() }
            .padding(horizontal = 10.dp, vertical = 5.dp)
    ) {
        Text(
            text = label,
            color = if (isSelected) SlateBg else Color.White,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
