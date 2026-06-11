'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  Maximize, 
  Minimize, 
  Settings, 
  Tv,
  Info
} from 'lucide-react';

interface PremiumPlayerProps {
  url: string;
  title?: string;
  isLive?: boolean;
}

export default function PremiumPlayer({ url, title, isLive = true }: PremiumPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [playbackQuality, setPlaybackQuality] = useState('Auto');
  const [availableQualities, setAvailableQualities] = useState<{ label: string; index: number }[]>([]);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showVolumeTooltip, setShowVolumeTooltip] = useState(false);
  const [showStatusToast, setShowStatusToast] = useState('');
  const [toastTimeout, setToastTimeout] = useState<NodeJS.Timeout | null>(null);

  // Detect if stream is an iframe
  const isIframeStream = url && (
    !url.includes('.m3u8') && 
    !url.includes('.mp4') && 
    !url.includes('.webm') && 
    !url.includes('.ogg') &&
    (url.includes('embed') || 
     url.includes('iframe') || 
     url.includes('youtube.com') || 
     url.includes('youtu.be') || 
     url.includes('twitch.tv') ||
     url.includes('vimeo.com') ||
     !url.match(/\.(m3u8|mp4|webm|ogg)($|\?)/i))
  );

  const getEmbedUrl = (link: string) => {
    if (!link) return '';
    if (link.includes('youtube.com/watch?v=')) {
      return link.replace('watch?v=', 'embed/');
    } else if (link.includes('youtu.be/')) {
      return `https://www.youtube.com/embed/${link.split('youtu.be/')[1]}`;
    }
    return link;
  };

  const triggerToast = (message: string) => {
    if (toastTimeout) clearTimeout(toastTimeout);
    setShowStatusToast(message);
    const timeout = setTimeout(() => {
      setShowStatusToast('');
    }, 1500);
    setToastTimeout(timeout);
  };

  // Setup HLS or MP4 playback
  useEffect(() => {
    if (isIframeStream || !url) {
      setIsBuffering(false);
      return;
    }

    setIsBuffering(true);
    setHasError(false);
    setErrorMessage('');
    setAvailableQualities([{ label: 'Auto', index: -1 }]);
    setPlaybackQuality('Auto');

    const video = videoRef.current;
    if (!video) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    video.src = '';

    const isHls = url.includes('.m3u8') || url.includes('m3u8');
    const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isHttpOnHttps = isHttpsPage && url.startsWith('http://');

    const attemptPlay = () => {
      if (!video) return;
      video.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Autoplay blocked. Retrying muted...", err);
          video.muted = true;
          setIsMuted(true);
          video.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((playErr) => {
              console.error("Muted autoplay failed:", playErr);
              setIsPlaying(false);
            });
        });
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS support
      video.src = url;
      attemptPlay();
    } else if (isHls) {
      // Desktop Chrome, Firefox, Edge, etc.
      import('hls.js').then((Hls) => {
        if (!video) return;
        if (Hls.default.isSupported()) {
          // Standard optimized HLS configuration (no aggressive buffer restrictions)
          const hls = new Hls.default({
            enableWorker: true,
            lowLatencyMode: false, // Turn off low latency to prioritize buffering smoothness
            maxBufferLength: 30, // Buffer up to 30 seconds for butter-smooth playback
            maxMaxBufferLength: 60,
            maxBufferSize: 60 * 1024 * 1024, // 60MB max buffer
            liveSyncDuration: 3, // Play 3 seconds behind the edge for stream stability
            manifestLoadingMaxRetry: 6,
            levelLoadingMaxRetry: 6,
            fragLoadingMaxRetry: 6,
            abrEwmaDefaultEstimate: 5000000, // 5 Mbps default bandwidth estimate
          });

          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(video);

          hls.on(Hls.default.Events.MANIFEST_PARSED, () => {
            setIsBuffering(false);
            const levels = hls.levels;
            if (levels && levels.length > 0) {
              const list = [{ label: 'Auto', index: -1 }];
              levels.forEach((l: any, idx: number) => {
                const label = l.height ? l.height + 'p' : l.name || `Level ${idx + 1}`;
                if (!list.some(item => item.label === label)) {
                  list.push({ label, index: idx });
                }
              });
              setAvailableQualities(list);
            }
            attemptPlay();
          });

          hls.on(Hls.default.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.default.ErrorTypes.NETWORK_ERROR:
                  console.warn('HLS Network error, trying to recover...');
                  hls.startLoad();
                  break;
                case Hls.default.ErrorTypes.MEDIA_ERROR:
                  console.warn('HLS Media error, trying to recover...');
                  hls.recoverMediaError();
                  break;
                default:
                  setHasError(true);
                  setErrorMessage(isHttpOnHttps 
                    ? 'Mixed Content Error: Secure website (HTTPS) cannot play unsecure stream (HTTP). VLC player link below is recommended.'
                    : 'Playback Error: Failed to play stream. The URL might be offline, invalid, or blocked by CORS.'
                  );
                  hls.destroy();
                  break;
              }
            }
          });
        } else {
          // Fallback to native video src
          video.src = url;
          attemptPlay();
        }
      });
    } else {
      // Direct MP4 or other format
      video.src = url;
      attemptPlay();
    }

    // Video Event Listeners
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const handleCanPlay = () => {
      setIsBuffering(false);
    };
    const handleError = () => {
      setHasError(true);
      setErrorMessage(isHttpOnHttps 
        ? 'Mixed Content Error: Secure website (HTTPS) cannot load HTTP stream. Open directly or use VLC option.'
        : 'Streaming Error: Stream offline or blocked. Try an alternate link.'
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
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url, isIframeStream]);

  // Controls Auto-Hide Logic
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    
    if (isPlaying && !hasError) {
      const timeout = setTimeout(() => {
        setShowControls(false);
        setShowQualityMenu(false);
      }, 3000);
      setControlsTimeout(timeout);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [controlsTimeout]);

  // Play/Pause Action
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      triggerToast('Paused');
    } else {
      video.play()
        .then(() => {
          setIsPlaying(true);
          triggerToast('Playing');
        })
        .catch(() => {});
    }
  };

  // Mute Action
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      triggerToast('Muted');
    } else {
      triggerToast(`Volume: ${Math.round(volume * 100)}%`);
    }
  };

  // Volume Change Action
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    const muted = val === 0;
    video.muted = muted;
    setIsMuted(muted);
    triggerToast(`Volume: ${Math.round(val * 100)}%`);
  };

  // Fullscreen Action
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  // Fullscreen Event listener to catch Escape keys
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Reload Stream
  const handleReload = () => {
    setIsBuffering(true);
    setHasError(false);
    setErrorMessage('');
    const video = videoRef.current;
    if (video) {
      video.load();
      const currentUrl = video.src;
      video.src = '';
      video.load();
      video.src = url;
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
      triggerToast('Reloading...');
    }
  };

  // Quality Selection
  const handleQualitySelect = (label: string, index: number) => {
    setPlaybackQuality(label);
    setShowQualityMenu(false);
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = index;
    triggerToast(`Quality: ${label}`);
  };

  // Keyboard Event Listeners for Player Control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only capture if video is focused or body is target (no input focus)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (isIframeStream) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((prev) => {
            const next = Math.min(prev + 0.05, 1);
            video.volume = next;
            video.muted = false;
            setIsMuted(false);
            triggerToast(`Volume: ${Math.round(next * 100)}%`);
            return next;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((prev) => {
            const next = Math.max(prev - 0.05, 0);
            video.volume = next;
            if (next === 0) {
              setIsMuted(true);
              video.muted = true;
            }
            triggerToast(`Volume: ${Math.round(next * 100)}%`);
            return next;
          });
          break;
        case 'r':
          e.preventDefault();
          handleReload();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume, url, isIframeStream]);

  if (!url) {
    return (
      <div className="w-full aspect-video bg-slate-950 rounded-3xl border border-slate-900 flex flex-col items-center justify-center text-slate-500">
        <Tv className="w-10 h-10 mb-2 stroke-1 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider">No Stream Loaded</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && !hasError && setShowControls(false)}
        className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden group select-none shadow-2xl border border-slate-900 transition-all duration-300"
      >
        {isIframeStream ? (
          <iframe
            src={getEmbedUrl(url)}
            className="w-full h-full border-0 absolute inset-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              onClick={togglePlay}
              autoPlay
              playsInline
              muted={isMuted}
              preload="auto"
              className="w-full h-full object-contain cursor-pointer"
            />

            {/* RADIAL GRADIENT OVERLAY */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(0,0,0,0.45)_100%)]" />

            {/* STATUS TOAST DISPLAY */}
            {showStatusToast && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-35 bg-black/85 backdrop-blur-md border border-slate-800 text-emerald-400 font-extrabold text-[11px] tracking-widest uppercase px-4 py-2.5 rounded-2xl shadow-2xl transition-all duration-200 pointer-events-none scale-105">
                {showStatusToast}
              </div>
            )}

            {/* FLOATING UNMUTE OVERLAY FOR AUTOPLAY */}
            {isMuted && isPlaying && !hasError && (
              <button
                onClick={toggleMute}
                className="absolute top-4 left-4 z-30 px-3.5 py-2.5 bg-black/85 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-slate-800 hover:border-transparent rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all duration-350 shadow-2xl hover:scale-105 cursor-pointer pointer-events-auto active:scale-95"
              >
                <VolumeX className="w-3.5 h-3.5" />
                Unmute Audio
              </button>
            )}

            {/* BUFFERING SPINNER */}
            {isBuffering && !hasError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px] transition-all">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 border-4 border-emerald-500/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-emerald-500 border-r-emerald-500/20 border-b-emerald-500/10 border-l-emerald-500/30 rounded-full animate-spin" />
                </div>
                <span className="text-emerald-400 text-[9px] font-black uppercase tracking-widest mt-4 animate-pulse">Establishing Stream...</span>
              </div>
            )}

            {/* STREAM ERROR DISPLAY */}
            {hasError && (
              <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-md p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-lg mb-4">
                  ⚠️
                </div>
                <h4 className="text-white font-black text-sm uppercase tracking-wider mb-2">Stream Offline / Playback Error</h4>
                <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed mb-6">{errorMessage}</p>
                <div className="flex flex-wrap gap-2.5 justify-center">
                  <button 
                    type="button"
                    onClick={handleReload}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer active:scale-95"
                  >
                    Retry Connection
                  </button>
                  <a 
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-white text-xs font-black rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Open Directly ↗
                  </a>
                  <a 
                    href={`vlc://${url}`}
                    className="px-5 py-2.5 bg-slate-905 border border-slate-800 text-amber-500 text-xs font-black rounded-xl hover:bg-slate-850 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Play in VLC Player 🧡
                  </a>
                </div>
              </div>
            )}

            {/* PLAYER CONTROL BAR */}
            <div 
              className={`absolute inset-0 z-20 flex flex-col justify-between p-4 bg-gradient-to-t from-black/90 via-transparent to-black/55 transition-all duration-350 pointer-events-none ${
                showControls ? 'opacity-100' : 'opacity-0 translate-y-1'
              }`}
            >
              {/* Header Info */}
              <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1 text-[9px] font-black bg-rose-600 px-2 py-0.5 rounded-lg text-white animate-pulse">
                    ● LIVE
                  </span>
                  <span className="text-white text-xs font-extrabold truncate max-w-[250px] drop-shadow">
                    {title || 'Live Broadcast'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Badges */}
                  <span className="text-[8px] font-black text-slate-400 bg-slate-950/70 border border-slate-850 px-2.5 py-1 rounded-lg">
                    {playbackQuality === 'Auto' ? 'Adaptive' : 'Manual'}
                  </span>
                </div>
              </div>

              {/* Middle Play Button Overlay */}
              <div className="flex items-center justify-center">
                <button 
                  type="button"
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-200 pointer-events-auto shadow-2xl cursor-pointer hover:shadow-emerald-500/20"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  )}
                </button>
              </div>

              {/* Bottom Control Actions */}
              <div className="flex items-center justify-between pointer-events-auto bg-slate-950/90 backdrop-blur-xl px-4 py-3 rounded-2xl border border-slate-900/60 shadow-2xl">
                <div className="flex items-center gap-4">
                  {/* Play/Pause Button */}
                  <button onClick={togglePlay} type="button" className="text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-90 duration-150">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  {/* Volume Controller */}
                  <div className="flex items-center gap-2.5 group/volume">
                    <button onClick={toggleMute} type="button" className="text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95 duration-150">
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1.5 rounded-full accent-emerald-500 cursor-pointer bg-slate-800 transition-all"
                    />
                  </div>

                  <span className="text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-900/20 uppercase">
                    HD
                  </span>
                </div>

                <div className="flex items-center gap-4 relative">
                  {/* Quality Settings Trigger */}
                  {availableQualities.length > 0 && (
                    <div className="relative">
                      <button 
                        type="button" 
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        className="p-1.5 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">{playbackQuality}</span>
                      </button>

                      {showQualityMenu && (
                        <div className="absolute right-0 bottom-full mb-2 bg-slate-950/98 backdrop-blur-2xl border border-slate-850 rounded-2xl py-2 shadow-2xl z-50 min-w-[100px] max-h-48 overflow-y-auto">
                          <div className="text-[8px] font-black text-slate-500 px-3 py-1 uppercase border-b border-slate-900 mb-1">Select Quality</div>
                          {availableQualities.map((q) => (
                            <button
                              key={q.label}
                              type="button"
                              onClick={() => handleQualitySelect(q.label, q.index)}
                              className={`w-full text-left px-3.5 py-2 text-[10px] font-extrabold flex items-center justify-between ${
                                playbackQuality === q.label ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                              }`}
                            >
                              <span>{q.label}</span>
                              {playbackQuality === q.label && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reload button */}
                  <button onClick={handleReload} type="button" title="Reload Feed" className="text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95 duration-150">
                    <RotateCw className="w-4 h-4" />
                  </button>

                  {/* Fullscreen button */}
                  <button onClick={toggleFullscreen} type="button" className="text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95 duration-150">
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quality Selection Bar below the player - clean and responsive */}
      {!isIframeStream && availableQualities.length > 0 && (
        <div className="mt-3.5 p-3.5 bg-slate-950/60 border border-slate-900 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Settings className="w-4.5 h-4.5 text-emerald-500" />
            Select Resolution / রেজোলিউশন সিলেক্ট করুন:
          </span>
          <div className="flex flex-wrap gap-2.5">
            {availableQualities.map((q) => {
              const isActive = playbackQuality === q.label;
              return (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => handleQualitySelect(q.label, q.index)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-transparent shadow shadow-emerald-500/20 hover:scale-103'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {q.label === 'Auto' ? '🔄 Automatic (Auto ABR)' : q.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
