'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PremiumPlayerProps {
  url: string;
  title?: string;
  isLive?: boolean;
}

export default function PremiumPlayer({ url, title, isLive = true }: PremiumPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<any>(null);
  const [playbackQuality, setPlaybackQuality] = useState('Auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const hlsRef = useRef<any>(null);

  // Load stream
  useEffect(() => {
    setIsBuffering(true);
    setHasError(false);
    setErrorMessage('');
    
    let hls: any = null;
    const video = videoRef.current;
    if (!video || !url) return;

    // Reset video source
    video.src = '';
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isTs = url.includes('.ts') || url.endsWith('.ts');
    const isHls = (url.includes('.m3u8') || url.includes('m3u8') || (!url.includes('.mp4') && !url.includes('.webm') && !url.includes('.ogg'))) && !isTs;
    const isHttpOnHttps = typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://');

    const attemptPlay = () => {
      if (!video) return;
      video.play().catch((err) => {
        console.warn("Autoplay blocked. Muting and retrying...", err);
        video.muted = true;
        setIsMuted(true);
        video.play().catch((playErr) => {
          console.error("Muted autoplay failed:", playErr);
        });
      });
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      attemptPlay();
    } else if (isHls) {
      import('hls.js').then((Hls) => {
        if (Hls.default.isSupported()) {
          hls = new Hls.default({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 0, // Disable backbuffer to save memory
            maxBufferLength: 1.5,  // Buffer only 1.5 seconds for extreme loading speed
            maxMaxBufferLength: 3, // Keep max buffer length low
            maxBufferSize: 800 * 1024, // Cap buffer size to 800KB for instant chunk startup
            liveSyncDurationCount: 0.5, // Play after ONLY 0.5 segments are loaded (Instant startup)
            liveMaxLatencyDurationCount: 1.5,
            maxFragLookUpTolerance: 0.1,
            manifestLoadingMaxRetry: 10,
            manifestLoadingRetryDelay: 500,
            levelLoadingMaxRetry: 10,
            levelLoadingRetryDelay: 500,
            fragLoadingMaxRetry: 10,
            fragLoadingRetryDelay: 500,
            stretchShortVideoTrack: true,
            progressive: true,
            testBandwidth: false, // Bypass initial bandwidth test delay
            startLevel: 0 // Start playing lowest level first for instant loading, ABR will upgrade quality
          });
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(video);

          hls.on(Hls.default.Events.MANIFEST_PARSED, () => {
            setIsBuffering(false);
            const levels = hls.levels;
            if (levels && levels.length > 0) {
              const qualities = ['Auto', ...levels.map((l: any) => l.height + 'p')];
              setAvailableQualities(qualities);
            }
            attemptPlay();
          });

          hls.on(Hls.default.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.default.ErrorTypes.NETWORK_ERROR:
                  console.warn('Network error, attempting recovery...');
                  hls.startLoad();
                  break;
                case Hls.default.ErrorTypes.MEDIA_ERROR:
                  console.warn('Media error, attempting recovery...');
                  hls.recoverMediaError();
                  break;
                default:
                  setHasError(true);
                  setErrorMessage(isHttpOnHttps 
                    ? 'Mixed Content Error: Browser blocked this unsecure HTTP stream on a secure HTTPS website. Try the "Play in VLC" or "Open Directly" buttons below.'
                    : 'Playback Error: Unable to parse or play this stream. The URL might be offline, invalid, or blocked by CORS security headers.'
                  );
                  hls.destroy();
                  break;
              }
            }
          });
        } else {
          video.src = url;
          attemptPlay();
        }
      });
    } else {
      video.src = url;
      attemptPlay();
    }

    // Event listeners
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const handleCanPlay = () => {
      setIsBuffering(false);
      attemptPlay();
    };
    const handleError = () => {
      setHasError(true);
      setErrorMessage(isHttpOnHttps 
        ? 'Mixed Content Error: Browser blocked this unsecure HTTP stream on a secure HTTPS website. Try the "Play in VLC" or "Open Directly" buttons below.'
        : 'Streaming Error: The stream is offline, unreachable, or blocked by CORS security headers. Try using another link or click below to play externally.'
      );
      setIsBuffering(false);
    };

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  // Controls auto-hide
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    
    const timeout = setTimeout(() => {
      if (isPlaying && !hasError) {
        setShowControls(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  };

  // Play/Pause toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    video.muted = val === 0;
    setIsMuted(val === 0);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Handle reload
  const handleReload = () => {
    setIsBuffering(true);
    setHasError(false);
    setErrorMessage('');
    const video = videoRef.current;
    if (video) {
      const currentUrl = video.src;
      video.src = '';
      video.load();
      video.src = url;
      video.play().catch(() => {});
    }
  };

  // Handle Quality Selection
  const handleQualitySelect = (quality: string) => {
    setPlaybackQuality(quality);
    const hls = hlsRef.current;
    if (!hls) return;
    if (quality === 'Auto') {
      hls.currentLevel = -1;
    } else {
      const height = parseInt(quality);
      const levelIdx = hls.levels.findIndex((l: any) => l.height === height);
      if (levelIdx !== -1) {
        hls.currentLevel = levelIdx;
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full h-full bg-black flex items-center justify-center select-none group/player overflow-hidden"
    >
      <video
        ref={videoRef}
        onClick={togglePlay}
        autoPlay
        playsInline
        muted={isMuted}
        preload="auto"
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* FLOATING UNMUTE BADGE */}
      {isMuted && isPlaying && !hasError && (
        <button
          onClick={toggleMute}
          className="absolute top-4 left-4 z-20 px-3.5 py-2 bg-black/70 hover:bg-black/90 backdrop-blur-md border border-slate-800 rounded-xl text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg pointer-events-auto cursor-pointer animate-pulse"
        >
          🔇 Click to Unmute
        </button>
      )}

      {/* GLOWING AMBIENT LIGHT */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.4)_100%)]" />

      {/* BUFFERING SPINNER */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] transition-all">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-emerald-400 text-xs font-black uppercase tracking-widest mt-4 animate-pulse">Buffering Live Feed...</span>
        </div>
      )}

      {/* ERROR OVERLAY */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-955/95 backdrop-blur-md p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-lg mb-3">
            ⚠️
          </div>
          <h4 className="text-white font-extrabold text-sm uppercase tracking-wider mb-2">Failed to Play Stream</h4>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">{errorMessage}</p>
          <div className="flex flex-wrap gap-2.5 justify-center mt-2">
            <button 
              type="button"
              onClick={handleReload}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black rounded-lg hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer"
            >
              Retry
            </button>
            <a 
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-white text-xs font-black rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Open Directly ↗
            </a>
            <a 
              href={`vlc://${url}`}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-amber-400 text-xs font-black rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Play in VLC 🧡
            </a>
          </div>
        </div>
      )}

      {/* CONTROLS OVERLAY */}
      <div 
        className={`absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-all duration-300 pointer-events-none z-10 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Header */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[9px] font-black bg-rose-600 px-2 py-0.5 rounded text-white animate-pulse">
              ● LIVE
            </span>
            <span className="text-white text-xs font-black truncate max-w-[200px] drop-shadow-md">
              {title || 'Live TV Broadcast'}
            </span>
          </div>

          {/* Quality Selector */}
          {availableQualities.length > 0 && (
            <div className="relative group/quality">
              <button type="button" className="px-2.5 py-1 bg-slate-900/80 backdrop-blur border border-slate-800 hover:border-slate-700 rounded-lg text-[10px] text-slate-300 font-extrabold cursor-pointer">
                ⚙️ {playbackQuality}
              </button>
              <div className="absolute right-0 mt-1 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-lg py-1 shadow-xl hidden group-hover/quality:block z-50 min-w-[80px]">
                {availableQualities.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQualitySelect(q)}
                    className={`w-full text-left px-3 py-1.5 text-[9px] font-bold ${
                      playbackQuality === q ? 'text-emerald-400 bg-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Play Centered Button */}
        <div className="flex items-center justify-center">
          <button 
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-emerald-500/90 text-slate-950 flex items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-5 h-5 fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
        </div>

        {/* Bottom Bar Controls */}
        <div className="flex items-center justify-between pointer-events-auto bg-slate-950/70 backdrop-blur px-4 py-2.5 rounded-xl border border-slate-900/60 shadow-xl">
          <div className="flex items-center gap-3">
            {/* Play/Pause icon */}
            <button onClick={togglePlay} type="button" className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              {isPlaying ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            {/* Mute/Volume icon */}
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} type="button" className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                {isMuted ? (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM3 9v6h4l5 5V4L7 9H3z"/></svg>
                ) : (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 rounded-full accent-emerald-500 cursor-pointer hidden group-hover/volume:block transition-all"
              />
            </div>

            {/* Live indicator */}
            <span className="text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/20 uppercase">
              LIVE BROADCAST
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Reload button */}
            <button onClick={handleReload} type="button" title="Reload Stream" className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            </button>
            {/* Fullscreen button */}
            <button onClick={toggleFullscreen} type="button" className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              {isFullscreen ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
