package com.worldcup2026.liveapp.presentation.details

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.worldcup2026.liveapp.data.model.Match
import com.worldcup2026.liveapp.data.model.MatchEvent
import com.worldcup2026.liveapp.data.model.ScoreStats
import com.worldcup2026.liveapp.domain.repository.MatchRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DetailsViewModel @Inject constructor(
    private val repository: MatchRepository
) : ViewModel() {

    private val _selectedTab = MutableStateFlow(0) // 0: Timeline, 1: Statistics
    val selectedTab: StateFlow<Int> = _selectedTab.asStateFlow()

    private val _match = MutableStateFlow<Match?>(null)
    val match: StateFlow<Match?> = _match.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun selectTab(index: Int) {
        _selectedTab.value = index
    }

    fun loadMatchDetails(matchId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val matches = repository.getMatches()
                val item = matches.find { it.id == matchId }
                _match.value = item
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }

    // Live timelines Flow polled every 5s
    fun getEventsFlow(matchId: String): StateFlow<List<MatchEvent>> {
        return repository.getMatchEventsFlow(matchId)
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = emptyList()
            )
    }

    // Live score statistics Flow polled every 5s
    fun getStatsFlow(matchId: String): StateFlow<ScoreStats> {
        return repository.getScoreStatsFlow(matchId)
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = ScoreStats(matchId)
            )
    }
}
