package com.worldcup2026.liveapp.presentation.details

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.worldcup2026.liveapp.data.model.MatchEvent
import com.worldcup2026.liveapp.data.model.ScoreStats
import com.worldcup2026.liveapp.presentation.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MatchDetailsScreen(
    matchId: String,
    onNavigateBack: () -> Unit,
    viewModel: DetailsViewModel = hiltViewModel()
) {
    val match by viewModel.match.collectAsState()
    val selectedTab by viewModel.selectedTab.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    // Trigger details load
    LaunchedEffect(matchId) {
        viewModel.loadMatchDetails(matchId)
    }

    // Connect to polling state flow
    val events by viewModel.getEventsFlow(matchId).collectAsState()
    val stats by viewModel.getStatsFlow(matchId).collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Match Details", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = SlateBg,
                    titleContentColor = Color.White
                )
            )
        },
        containerColor = SlateBg
    ) { paddingValues ->
        if (isLoading || match == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = EmeraldAccent)
            }
        } else {
            val activeMatch = match!!
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                
                // Score Board Header Box
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = CardBg),
                    border = BorderStroke(1.dp, BorderColor),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = activeMatch.tournament,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary,
                            fontWeight = FontWeight.Bold
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            // Team A Info
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.weight(1f)
                            ) {
                                AsyncImage(
                                    model = activeMatch.team_a?.flag_url,
                                    contentDescription = null,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(60.dp, 40.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .border(1.dp, BorderColor, RoundedCornerShape(8.dp))
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = activeMatch.team_a?.name ?: "",
                                    style = MaterialTheme.typography.titleLarge,
                                    color = Color.White,
                                    fontWeight = FontWeight.Black,
                                    textAlign = TextAlign.Center,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }

                            // Score digit
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                if (activeMatch.status != "UPCOMING") {
                                    Text(
                                        text = "${activeMatch.team_a_score} - ${activeMatch.team_b_score}",
                                        fontSize = 36.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color.White
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    if (activeMatch.status == "LIVE") {
                                        Text(
                                            text = "LIVE",
                                            color = EmeraldAccent,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp
                                        )
                                    } else {
                                        Text(
                                            text = "Full Time",
                                            color = TextSecondary,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp
                                        )
                                    }
                                } else {
                                    Text(
                                        text = "VS",
                                        fontSize = 28.sp,
                                        fontWeight = FontWeight.Black,
                                        color = GoldAccent
                                    )
                                }
                            }

                            // Team B Info
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.weight(1f)
                            ) {
                                AsyncImage(
                                    model = activeMatch.team_b?.flag_url,
                                    contentDescription = null,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(60.dp, 40.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .border(1.dp, BorderColor, RoundedCornerShape(8.dp))
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = activeMatch.team_b?.name ?: "",
                                    style = MaterialTheme.typography.titleLarge,
                                    color = Color.White,
                                    fontWeight = FontWeight.Black,
                                    textAlign = TextAlign.Center,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "🏟️ ${activeMatch.stadium}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }
                }

                // Sub Navigation Tabs
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = SlateBg,
                    contentColor = EmeraldAccent,
                    indicator = { tabPositions ->
                        TabRowDefaults.Indicator(
                            modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                            color = EmeraldAccent
                        )
                    },
                    divider = { Divider(color = BorderColor) }
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { viewModel.selectTab(0) },
                        text = { Text("TIMELINE", fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { viewModel.selectTab(1) },
                        text = { Text("STATISTICS", fontWeight = FontWeight.Bold) }
                    )
                }

                // Tab Content Switcher
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f)
                ) {
                    when (selectedTab) {
                        0 -> TimelineTab(events = events)
                        1 -> StatsTab(stats = stats, match = activeMatch)
                    }
                }
            }
        }
    }
}

@Composable
fun TimelineTab(events: List<MatchEvent>) {
    if (events.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Kick-off pending. Events will populate here.",
                color = TextSecondary,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    } else {
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(events) { event ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Time indicator
                    Box(
                        modifier = Modifier
                            .width(44.dp)
                            .background(GlassWhite, RoundedCornerShape(8.dp))
                            .border(1.dp, BorderColor, RoundedCornerShape(8.dp))
                            .padding(vertical = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "${event.minute}'",
                            color = GoldAccent,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    // Event icon
                    val (iconText, iconBg) = when (event.type) {
                        "GOAL" -> Pair("⚽", EmeraldAccent.copy(alpha = 0.15f))
                        "PENALTY" -> Pair("🎯", EmeraldAccent.copy(alpha = 0.15f))
                        "OWN_GOAL" -> Pair("❌", CrimsonAccent.copy(alpha = 0.15f))
                        "YELLOW_CARD" -> Pair("🟨", Color.Yellow.copy(alpha = 0.15f))
                        "RED_CARD" -> Pair("🟥", CrimsonAccent.copy(alpha = 0.15f))
                        "SUBSTITUTION" -> Pair("🔄", SkyAccent.copy(alpha = 0.15f))
                        "MATCH_START" -> Pair("🟢", EmeraldAccent.copy(alpha = 0.15f))
                        "MATCH_END" -> Pair("🔴", CrimsonAccent.copy(alpha = 0.15f))
                        else -> Pair("ℹ️", GlassWhite)
                    }

                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(iconBg, CircleShape)
                            .border(1.dp, BorderColor, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(iconText, fontSize = 16.sp)
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    // Event description
                    Column(modifier = Modifier.weight(1f)) {
                        val title = when (event.type) {
                            "GOAL" -> "Goal Scored"
                            "PENALTY" -> "Penalty Conversion"
                            "OWN_GOAL" -> "Own Goal"
                            "YELLOW_CARD" -> "Yellow Card"
                            "RED_CARD" -> "Red Card"
                            "SUBSTITUTION" -> "Substitution"
                            "MATCH_START" -> "Match Started"
                            "MATCH_END" -> "Match Finished"
                            else -> "Match Event"
                        }
                        Text(
                            text = title,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 13.sp
                        )
                        
                        val desc = when (event.type) {
                            "SUBSTITUTION" -> "${event.player_out} out / ${event.player_in} in"
                            "GOAL", "PENALTY", "OWN_GOAL" -> "${event.player_in ?: ""} (${event.team?.name ?: ""})"
                            "YELLOW_CARD", "RED_CARD" -> "${event.player_in ?: ""} (${event.team?.name ?: ""})"
                            else -> event.detail ?: ""
                        }
                        
                        if (desc.isNotBlank()) {
                            Text(
                                text = desc,
                                color = TextSecondary,
                                fontSize = 11.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatsTab(stats: ScoreStats, match: Match) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        StatBar(
            title = "Possession",
            valueA = stats.possession_a,
            valueB = stats.possession_b,
            suffix = "%",
            colorA = match.team_a?.primary_color ?: "#10B981",
            colorB = match.team_b?.primary_color ?: "#F59E0B"
        )
        
        StatBar(
            title = "Shots on Goal",
            valueA = stats.shots_a,
            valueB = stats.shots_b,
            colorA = match.team_a?.primary_color ?: "#10B981",
            colorB = match.team_b?.primary_color ?: "#F59E0B"
        )

        StatBar(
            title = "Corners",
            valueA = stats.corners_a,
            valueB = stats.corners_b,
            colorA = match.team_a?.primary_color ?: "#10B981",
            colorB = match.team_b?.primary_color ?: "#F59E0B"
        )

        StatBar(
            title = "Yellow Cards",
            valueA = stats.yellow_cards_a,
            valueB = stats.yellow_cards_b,
            colorA = "#EAB308", // Card specific yellow
            colorB = "#EAB308"
        )

        StatBar(
            title = "Red Cards",
            valueA = stats.red_cards_a,
            valueB = stats.red_cards_b,
            colorA = "#EF4444", // Card specific red
            colorB = "#EF4444"
        )
    }
}

@Composable
fun StatBar(
    title: String,
    valueA: Int,
    valueB: Int,
    suffix: String = "",
    colorA: String,
    colorB: String
) {
    val total = valueA + valueB
    val progress = if (total == 0) 0.5f else valueA.toFloat() / total.toFloat()

    val parsedColorA = remember(colorA) { try { Color(android.graphics.Color.parseColor(colorA)) } catch (e: Exception) { EmeraldAccent } }
    val parsedColorB = remember(colorB) { try { Color(android.graphics.Color.parseColor(colorB)) } catch (e: Exception) { GoldAccent } }

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "$valueA$suffix",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
            Text(
                text = title,
                color = TextSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "$valueB$suffix",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Custom two-sided linear progress indicator
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(CircleShape)
                .background(BorderColor)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .weight(progress.coerceAtLeast(0.02f))
                    .background(parsedColorA)
            )
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .weight((1f - progress).coerceAtLeast(0.02f))
                    .background(parsedColorB)
            )
        }
    }
}
