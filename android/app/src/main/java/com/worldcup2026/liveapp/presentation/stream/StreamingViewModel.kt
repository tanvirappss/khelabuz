package com.worldcup2026.liveapp.presentation.stream

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.worldcup2026.liveapp.data.model.Stream
import com.worldcup2026.liveapp.domain.repository.MatchRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class StreamingViewModel @Inject constructor(
    private val repository: MatchRepository
) : ViewModel() {

    private val _streams = MutableStateFlow<List<Stream>>(emptyList())
    val streams: StateFlow<List<Stream>> = _streams.asStateFlow()

    private val _currentStreamIndex = MutableStateFlow(0)
    val currentStreamIndex: StateFlow<Int> = _currentStreamIndex.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _streamError = MutableStateFlow<String?>(null)
    val streamError: StateFlow<String?> = _streamError.asStateFlow()

    fun loadStreams(matchId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val list = repository.getStreamsForMatch(matchId)
                _streams.value = list
                _currentStreamIndex.value = 0
                _streamError.value = null
            } catch (e: Exception) {
                _streamError.value = "Failed to load streaming streams: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun getActiveUrl(): String? {
        val streamList = _streams.value
        val index = _currentStreamIndex.value
        if (streamList.isEmpty()) return null
        val activeStream = streamList.firstOrNull() ?: return null

        return when (index) {
            0 -> activeStream.primary_url
            1 -> activeStream.backup_url_1
            2 -> activeStream.backup_url_2
            3 -> activeStream.backup_url_3
            else -> null
        }
    }

    // Return the stream source label
    fun getActiveLabel(): String {
        val index = _currentStreamIndex.value
        return when (index) {
            0 -> "Primary Stream"
            1 -> "Backup Feed 1"
            2 -> "Backup Feed 2"
            3 -> "Backup Feed 3"
            else -> "Offline Source"
        }
    }

    // Switch to next available backup stream source
    fun triggerStreamFailover(): Boolean {
        val stream = _streams.value.firstOrNull() ?: return false
        val nextIndex = _currentStreamIndex.value + 1

        val hasNext = when (nextIndex) {
            1 -> !stream.backup_url_1.isNullOrBlank()
            2 -> !stream.backup_url_2.isNullOrBlank()
            3 -> !stream.backup_url_3.isNullOrBlank()
            else -> false
        }

        if (hasNext) {
            _currentStreamIndex.value = nextIndex
            _streamError.value = "Switching to backup source ($nextIndex)..."
            return true
        }
        return false // No more backups available
    }

    fun selectStreamIndex(index: Int) {
        _currentStreamIndex.value = index
        _streamError.value = null
    }
}
