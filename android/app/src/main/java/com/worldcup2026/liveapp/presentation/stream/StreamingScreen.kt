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
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.hls.HlsMediaSource
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

    // Initialize ExoPlayer
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
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
            val dataSourceFactory = DefaultHttpDataSource.Factory()
                .setAllowCrossProtocolRedirects(true)
                .setConnectTimeoutMs(10000)
                .setReadTimeoutMs(10000)
            
            val hlsMediaSource = HlsMediaSource.Factory(dataSourceFactory)
                .createMediaSource(MediaItem.fromUri(activeUrl))
            
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
