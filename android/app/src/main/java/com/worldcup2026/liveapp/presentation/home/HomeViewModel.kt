package com.worldcup2026.liveapp.presentation.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.worldcup2026.liveapp.data.model.Match
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
class HomeViewModel @Inject constructor(
    private val repository: MatchRepository
) : ViewModel() {

    // Manage tab index selection (0: LIVE, 1: UPCOMING, 2: FINISHED)
    private val _selectedTab = MutableStateFlow(0)
    val selectedTab: StateFlow<Int> = _selectedTab.asStateFlow()

    // Matches Flow feeding UI real-time lists
    val matches: StateFlow<List<Match>> = repository.getMatchesFlow()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun selectTab(index: Int) {
        _selectedTab.value = index
    }

    // Trigger simulation (Sandbox Demo mode only)
    fun simulateGoal(matchId: String) {
        viewModelScope.launch {
            repository.simulateGoalScored(matchId)
        }
    }
}
