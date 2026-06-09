'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockDb, isMockEnabled } from '@/lib/supabase';
import dynamic from 'next/dynamic';
const PremiumPlayer = dynamic(() => import('@/components/PremiumPlayer'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full aspect-video bg-slate-900 rounded-3xl flex flex-col items-center justify-center border border-slate-800">
      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
        Loading Premium Player...
      </span>
    </div>
  )
});
import { 
  Trophy, 
  Tv, 
  MapPin, 
  Clock, 
  Activity, 
  Info, 
  Play, 
  Volume2, 
  VolumeX, 
  X,
  Zap,
  Bell,
  ArrowLeft,
  Search
} from 'lucide-react';

interface M3UChannel {
  name: string;
  logo: string;
  url: string;
  group: string;
}

function parseM3uPlaylist(rawText: string): M3UChannel[] {
  const lines = rawText.split('\n');
  const channels: M3UChannel[] = [];
  let currentChannelInfo: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      const logo = logoMatch ? logoMatch[1] : '';

      const groupMatch = line.match(/group-title="([^"]+)"/i);
      const group = groupMatch ? groupMatch[1] : 'General';

      const commaIndex = line.lastIndexOf(',');
      const name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Live Channel';

      currentChannelInfo = { name, logo, group };
    } else if (line && !line.startsWith('#')) {
      if (currentChannelInfo) {
        channels.push({
          name: currentChannelInfo.name,
          logo: currentChannelInfo.logo,
          url: line,
          group: currentChannelInfo.group
        });
        currentChannelInfo = null;
      }
    }
  }
  return channels;
}

export default function WebUserFrontend() {
  const [selectedTab, setSelectedTab] = useState(0); // 0: Live, 1: Schedule, 2: Results, 3: Live TV
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');
  const [detailsTab, setDetailsTab] = useState(0); // 0: Timeline, 1: Stats
  const [matchStreams, setMatchStreams] = useState<any[]>([]);
  const [activeStream, setActiveStream] = useState<any>(null);

  // Fetch site settings
  const { data: settings = { header_logo: '', header_title: 'World Cup 2026', header_subtitle: 'Live Platform', ticker_text: '' } } = useQuery({
    queryKey: ['site_settings'],
    queryFn: async () => {
      if (isMockEnabled) return mockDb.getSettings();
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('site_settings').select('*').single();
        if (error) return mockDb.getSettings();
        return data;
      }
      return mockDb.getSettings();
    },
    staleTime: 1000 * 60 * 10 // Cache site settings for 10 minutes
  });

  // Live TV & M3U Playlist States
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [parsedChannels, setParsedChannels] = useState<M3UChannel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoadingM3u, setIsLoadingM3u] = useState(false);
  const [m3uError, setM3uError] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<M3UChannel | null>(null);
  
  // Notification States
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<any>(null);
  const lastNotificationIdRef = useRef<string | null>(null);

  // Script ad integration
  const [activeAdBanner, setActiveAdBanner] = useState<string>('');

  // Load tab and playlist from localStorage on mount (prevents SSR hydration mismatch)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('wc_selected_tab');
      if (savedTab !== null) {
        const parsed = parseInt(savedTab, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) {
          setSelectedTab(parsed);
        }
      }
      const savedPlaylist = localStorage.getItem('wc_selected_playlist');
      if (savedPlaylist) {
        try {
          setSelectedPlaylist(JSON.parse(savedPlaylist));
        } catch (e) {
          console.error(e);
        }
      }

      // Auto-sync local modifications to Supabase if running on localhost
      import('@/lib/supabase').then(({ syncLocalStorageToSupabase }) => {
        syncLocalStorageToSupabase();
      });
    }
  }, []);

  // Save selected tab to localStorage
  useEffect(() => {
    localStorage.setItem('wc_selected_tab', selectedTab.toString());
  }, [selectedTab]);

  // Save selected playlist to localStorage
  useEffect(() => {
    if (selectedPlaylist) {
      localStorage.setItem('wc_selected_playlist', JSON.stringify(selectedPlaylist));
    } else {
      localStorage.removeItem('wc_selected_playlist');
    }
  }, [selectedPlaylist]);

  // Fetch matches
  const { data: matches = [], refetch: refetchMatches } = useQuery({
    queryKey: ['web_user_matches'],
    queryFn: async () => {
      if (isMockEnabled) return mockDb.getMatches();
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase
          .from('matches')
          .select('*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)')
          .order('start_time', { ascending: false });
        if (error) throw error;
        return data;
      }
      return [];
    },
    refetchInterval: 5000 // poll scores every 5s
  });

  // Fetch streams for general TV / M3U playlists
  const { data: streams = [] } = useQuery({
    queryKey: ['web_user_streams'],
    queryFn: async () => {
      if (isMockEnabled) return mockDb.getStreams().filter((s: any) => s.is_enabled);
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('streams').select('*').eq('is_enabled', true);
        if (error) throw error;
        return data;
      }
      return [];
    },
    staleTime: 1000 * 60 * 2 // Cache streams for 2 minutes
  });

  // Handle M3U Fetching & Parsing via proxy
  useEffect(() => {
    if (selectedPlaylist) {
      if (selectedPlaylist.is_m3u) {
        setIsLoadingM3u(true);
        setM3uError('');
        setParsedChannels([]);
        
        fetch(`/api/proxy-m3u?url=${encodeURIComponent(selectedPlaylist.primary_url)}`)
          .then((res) => {
            if (!res.ok) throw new Error("Failed to load playlist file.");
            return res.text();
          })
          .then((text) => {
            const channels = parseM3uPlaylist(text);
            setParsedChannels(channels);
            if (channels.length > 0) {
              setSelectedChannel(channels[0]);
              setActiveStreamUrl(channels[0].url);
            } else {
              setM3uError("M3U playlist is empty or has invalid format.");
            }
          })
          .catch((err) => {
            console.error(err);
            setM3uError("Failed to fetch M3U playlist. Network or proxy error occurred.");
          })
          .finally(() => {
            setIsLoadingM3u(false);
          });
      } else {
        // Standalone TV Channel
        setParsedChannels([]);
        const channelObj = {
          name: selectedPlaylist.name,
          logo: '',
          url: selectedPlaylist.primary_url,
          group: 'General'
        };
        setSelectedChannel(channelObj);
        setActiveStreamUrl(selectedPlaylist.primary_url);
      }
    }
  }, [selectedPlaylist]);

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['web_user_notifications'],
    queryFn: async () => {
      if (isMockEnabled) return mockDb.getNotifications();
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      }
      return [];
    },
    refetchInterval: 5000 // poll notifications every 5s
  });

  // Real-time Push Notification Toast trigger
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotif = notifications[0];
      
      // Initialize reference with the latest ID on first load
      if (lastNotificationIdRef.current === null) {
        lastNotificationIdRef.current = latestNotif.id;
        return;
      }
      
      // If we see a new ID, trigger the toast and play chime
      if (latestNotif.id !== lastNotificationIdRef.current) {
        lastNotificationIdRef.current = latestNotif.id;
        setActiveToast(latestNotif);
        
        // Play crisp digital chime notification sound
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
          audio.volume = 0.5;
          audio.play().catch((err) => console.log('Autoplay audio blocked until user interacts with the page:', err));
        } catch (soundErr) {
          console.error('Failed to play notification audio:', soundErr);
        }
        
        const timer = setTimeout(() => {
          setActiveToast(null);
        }, 6000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  // Fetch ads
  useEffect(() => {
    async function loadAds() {
      try {
        let activeAd: any = null;
        if (isMockEnabled) {
          activeAd = mockDb.getAds().find((a: any) => a.is_enabled);
        } else {
          const { supabase } = await import('@/lib/supabase');
          if (supabase) {
            const { data } = await supabase.from('ad_networks').select('*');
            activeAd = data?.find((a: any) => a.is_enabled);
          }
        }
        if (activeAd) {
          setActiveAdBanner(activeAd.banner_script || '');
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadAds();
  }, []);

  let filteredMatches = matches.filter((m: any) => {
    if (selectedTab === 0) return m.status === 'LIVE';
    if (selectedTab === 1) return m.status === 'UPCOMING';
    if (selectedTab === 2) return m.status === 'FINISHED';
    return false;
  });

  if (selectedTab === 1) {
    // Sort upcoming matches chronologically (ascending/serial)
    filteredMatches = [...filteredMatches].sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  } else {
    // Sort finished/live matches descending
    filteredMatches = [...filteredMatches].sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  }

  const handleOpenMatch = async (match: any) => {
    setSelectedMatch(match);
    setDetailsTab(0);

    // Fetch stream for any match status to allow previewing/watching if a stream is configured
    try {
      let streamsList: any[] = [];
      if (isMockEnabled) {
        streamsList = mockDb.getStreams().filter((s: any) => s.match_id === match.id && s.is_enabled);
      } else {
        const { supabase } = await import('@/lib/supabase');
        if (supabase) {
          const { data } = await supabase.from('streams').select('*').eq('match_id', match.id).eq('is_enabled', true);
          streamsList = data || [];
        }
      }
      setMatchStreams(streamsList);
      if (streamsList.length > 0) {
        setActiveStream(streamsList[0]);
        setActiveStreamUrl(streamsList[0].primary_url);
      } else {
        setActiveStream(null);
        setActiveStreamUrl('');
      }
    } catch (e) {
      console.error(e);
      setMatchStreams([]);
      setActiveStream(null);
      setActiveStreamUrl('');
    }
  };

  // Match streams load logic (simplified since PremiumPlayer manages its own video ref & HLS loader)

  // Detect if the URL is an iframe/embed page (e.g. YouTube watch/embed page or twitch link or general HTTP pages)
  const isIframeStream = activeStreamUrl && (
    !activeStreamUrl.includes('.m3u8') && 
    !activeStreamUrl.includes('.mp4') && 
    !activeStreamUrl.includes('.webm') && 
    !activeStreamUrl.includes('.ogg') &&
    (activeStreamUrl.includes('embed') || 
     activeStreamUrl.includes('iframe') || 
     activeStreamUrl.includes('youtube.com') || 
     activeStreamUrl.includes('youtu.be') || 
     activeStreamUrl.includes('twitch.tv') ||
     activeStreamUrl.includes('vimeo.com') ||
     !activeStreamUrl.match(/\.(m3u8|mp4|webm|ogg)($|\?)/i))
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4 md:p-8 flex flex-col justify-between">
      
      <div className="max-w-6xl w-full mx-auto space-y-8">
        
        {/* Navigation Top Header */}
        <header className="flex justify-between items-center bg-slate-900/40 backdrop-blur-md border border-slate-900 px-6 py-4 rounded-3xl">
          <div className="flex items-center gap-3">
            {settings?.header_logo ? (
              <div className="w-10 h-10 flex items-center justify-center bg-slate-950/60 rounded-xl overflow-hidden border border-slate-800">
                <img src={settings.header_logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl">
                <Trophy className="w-6 h-6 text-slate-950" />
              </div>
            )}
            <div>
              <h1 className="font-black text-lg text-white uppercase tracking-wider leading-none">
                {settings?.header_title || 'World Cup 2026'}
              </h1>
              <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">
                {settings?.header_subtitle || 'Live Platform'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Notification Bell Dropdown Button */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="p-2 border border-slate-800 hover:border-slate-705 bg-slate-950 hover:bg-slate-900 text-slate-300 rounded-xl transition-all relative flex items-center justify-center cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
                )}
              </button>
              
              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-black text-white uppercase tracking-wider">Notifications Center</span>
                    <span className="text-[9px] font-bold text-slate-500">{notifications.length} Alerts</span>
                  </div>
                  <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map((notif: any) => (
                        <div key={notif.id} className="text-xs border-b border-slate-950/50 pb-2.5 last:border-0 last:pb-0 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-950 border border-slate-850 text-slate-400 rounded">
                              {notif.category}
                            </span>
                            <span className="text-[8px] text-slate-500 font-medium">
                              {new Date(notif.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dhaka' })}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-white">{notif.title}</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* News Ticker Headline */}
        <div className="w-full overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-900/60 py-2.5 px-4 rounded-2xl flex items-center gap-3">
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0 animate-pulse">
            Flash News
          </span>
          <div className="relative overflow-hidden w-full h-5 flex items-center">
            <div className="absolute whitespace-nowrap text-xs font-bold text-slate-300 animate-ticker hover:[animation-play-state:paused] cursor-pointer">
              {settings?.ticker_text || "Welcome to World Cup 2026 Live Platform! Enjoy real-time scores, schedules, and live streaming."}
            </div>
          </div>
        </div>

        {/* Dashboard grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Matches List Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabs Selector */}
            <div className="flex bg-slate-900/30 border border-slate-900 p-1.5 rounded-2xl gap-1">
              {['Live Matches', 'Schedules', 'Finished', 'Live TV'].map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedTab(idx);
                    if (idx !== 3) {
                      setSelectedPlaylist(null);
                      setSelectedChannel(null);
                    } else {
                      setSelectedMatch(null);
                      setActiveStreamUrl('');
                    }
                  }}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    selectedTab === idx 
                      ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-400 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-4">
              {selectedTab === 3 ? (
                // Live TV List View
                <div className="space-y-6">
                  {!selectedPlaylist ? (
                    // Playlists selection
                    <div className="space-y-4">
                      <div className="bg-slate-950/45 border border-slate-900/60 p-4 rounded-2xl">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-1">Live TV Playlists & Channels</h3>
                        <p className="text-[10px] text-slate-400">Select an M3U playlist or a standalone TV feed below to browse and play channels.</p>
                      </div>
                      
                      {(() => {
                        const tvFeeds = streams.filter((s: any) => s.is_m3u || !s.match_id);
                        if (tvFeeds.length === 0) {
                          return (
                            <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-12 text-center text-slate-500 text-sm">
                              📺 No Live TV channels or M3U playlists have been added by the admin yet.
                            </div>
                          );
                        }
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tvFeeds.map((feed: any) => (
                              <div
                                key={feed.id}
                                onClick={() => setSelectedPlaylist(feed)}
                                className="bg-slate-900/40 backdrop-blur-md border border-slate-900 hover:border-slate-800 p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-black text-white uppercase tracking-wider">{feed.name}</span>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${feed.is_m3u ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                      {feed.is_m3u ? 'M3U PLAYLIST' : 'LIVE CHANNEL'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-mono truncate">{feed.primary_url}</p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-end">
                                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Play className="w-3 h-3 fill-emerald-400" /> Browse & Play
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    // Channels list from selected playlist
                    <div className="space-y-4 bg-slate-900/30 border border-slate-900 p-5 rounded-3xl">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-900/60">
                        <button
                          onClick={() => { setSelectedPlaylist(null); setParsedChannels([]); setSelectedChannel(null); setActiveStreamUrl(''); }}
                          className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-white transition-all uppercase tracking-wider cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" /> Back to Playlists
                        </button>
                        <span className="text-xs text-slate-400 font-bold">
                          Playlist: <span className="text-white font-black">{selectedPlaylist.name}</span>
                        </span>
                      </div>

                      {selectedPlaylist.is_m3u ? (
                        <>
                          {/* Search and Category filters */}
                          <div className="flex flex-col gap-3">
                            <div className="relative">
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search channels by name..."
                                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition-all"
                              />
                              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                            </div>
                          </div>

                          {/* Categories selector */}
                          {parsedChannels.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                              {['All', ...Array.from(new Set(parsedChannels.map((c: any) => c.group || 'General')))].map((category: any) => (
                                <button
                                  key={category}
                                  onClick={() => setSelectedCategory(category)}
                                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border shrink-0 cursor-pointer ${
                                    selectedCategory === category
                                      ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400'
                                      : 'bg-slate-950/60 border-slate-850 text-slate-500 hover:text-white'
                                  }`}
                                >
                                  {category}
                                </button>
                              ))}
                            </div>
                          )}

                          {isLoadingM3u && (
                            <div className="text-center py-12 space-y-2">
                              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                              <p className="text-xs text-slate-400">Loading playlist channels...</p>
                            </div>
                          )}

                          {m3uError && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl p-6 text-center text-xs">
                              {m3uError}
                            </div>
                          )}

                          {!isLoadingM3u && !m3uError && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                              {(() => {
                                const filtered = parsedChannels.filter((c: any) => {
                                  const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
                                  const matchCat = selectedCategory === 'All' || c.group === selectedCategory;
                                  return matchSearch && matchCat;
                                });
                                
                                if (filtered.length === 0) {
                                  return (
                                    <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                                      No channels found matching the filters.
                                    </div>
                                  );
                                }

                                return filtered.map((c: any, index: number) => {
                                  const isSelected = selectedChannel?.name === c.name && selectedChannel?.url === c.url;
                                  return (
                                    <div
                                      key={index}
                                      onClick={() => { setSelectedChannel(c); setActiveStreamUrl(c.url); }}
                                      className={`p-3 rounded-xl cursor-pointer border flex flex-col justify-between transition-all duration-200 min-h-[90px] ${
                                        isSelected
                                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                          : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-start gap-2.5">
                                        {c.logo ? (
                                          <img src={c.logo} className="w-8 h-8 object-contain rounded bg-slate-900 p-0.5 border border-slate-850" onError={(e) => { (e.target as any).src = ''; }} />
                                        ) : (
                                          <div className="w-8 h-8 rounded bg-slate-950 border border-slate-850 text-slate-500 flex items-center justify-center font-bold text-xs uppercase">
                                            {c.name.substring(0, 2)}
                                          </div>
                                        )}
                                        <span className="text-[10px] font-extrabold line-clamp-2 leading-tight flex-1">{c.name}</span>
                                      </div>
                                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide truncate mt-2">{c.group || 'General'}</span>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </>
                      ) : (
                        // Standalone channel info
                        <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-2xl text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mx-auto">
                            📺
                          </div>
                          <div>
                            <h4 className="font-extrabold text-white text-sm">{selectedPlaylist.name}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-1 truncate">{selectedPlaylist.primary_url}</p>
                          </div>
                          <p className="text-xs text-slate-400">This channel has been loaded into the Player. Watch in the Match Center panel.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                filteredMatches.length === 0 ? (
                  <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-12 text-center text-slate-500 text-sm">
                    No matches are currently listed in this category.
                  </div>
                ) : (
                  filteredMatches.map((match: any) => (
                    <div
                      key={match.id}
                      onClick={() => handleOpenMatch(match)}
                      className="bg-slate-900/40 backdrop-blur-md border border-slate-900 hover:border-slate-800/80 p-6 rounded-3xl cursor-pointer transition-all duration-300 flex flex-col justify-between"
                    >
                      
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>{match.tournament}</span>
                        {match.status === 'LIVE' ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 animate-pulse">
                            ● LIVE
                          </span>
                        ) : match.status === 'FINISHED' ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-500">
                            FINISHED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            UPCOMING
                          </span>
                        )}
                      </div>

                      {/* Score grid row */}
                      <div className="grid grid-cols-3 items-center py-6">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <img src={match.team_a?.flag_url} alt="" className="w-12 h-8 object-cover rounded-lg shadow-md" />
                          <span className="text-sm font-extrabold text-white">{match.team_a?.name}</span>
                        </div>

                        <div className="flex flex-col items-center">
                          {match.status !== 'UPCOMING' ? (
                            <span className="text-2xl font-black text-white">{match.team_a_score} - {match.team_b_score}</span>
                          ) : (
                            <div className="flex flex-col items-center text-center">
                              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest leading-none">
                                {new Date(match.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Dhaka' })}
                              </span>
                              <span className="text-sm font-black text-white mt-1">
                                {new Date(match.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dhaka' })}
                              </span>
                            </div>
                          )}
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {match.status === 'LIVE' ? 'Playing' : match.status === 'FINISHED' ? 'Full Time' : 'Kickoff'}
                          </span>
                        </div>

                        <div className="flex flex-col items-center gap-2 text-center">
                          <img src={match.team_b?.flag_url} alt="" className="w-12 h-8 object-cover rounded-lg shadow-md" />
                          <span className="text-sm font-extrabold text-white">{match.team_b?.name}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-900/60 pt-4 flex justify-between items-center text-[10px] text-slate-400">
                        <span>🏟️ {match.stadium}</span>
                        {match.status === 'LIVE' && (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <Tv className="w-3.5 h-3.5" /> Watch Stream
                          </span>
                        )}
                      </div>

                    </div>
                  ))
                )
              )}
            </div>

          </div>

          {/* Details & Video Player Side panel */}
          <div className="space-y-6">
            {selectedMatch || (selectedTab === 3 && activeStreamUrl) ? (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-200">
                
                {/* Header panel */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                  <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    {selectedTab === 3 ? 'Live TV Center' : 'Match Center'}
                  </h3>
                  <button 
                    onClick={() => { 
                      if (selectedTab === 3) {
                        setActiveStreamUrl('');
                        setSelectedChannel(null);
                      } else {
                        setSelectedMatch(null); 
                      }
                    }} 
                    className="p-1 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Video / Iframe Player Wrapper */}
                {activeStreamUrl && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-emerald-400" />
                      {selectedTab === 3 ? (selectedChannel?.name || 'Live Channel Feed') : (selectedMatch?.status === 'LIVE' ? 'Live Match Stream Feed' : 'Match Stream Preview')}
                    </span>
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-950 shadow-xl group">
                      {isIframeStream ? (
                        <iframe
                          src={activeStreamUrl.includes('youtube.com/watch?v=') 
                            ? activeStreamUrl.replace('watch?v=', 'embed/') 
                            : activeStreamUrl.includes('youtu.be/') 
                            ? `https://www.youtube.com/embed/${activeStreamUrl.split('youtu.be/')[1]}`
                            : activeStreamUrl}
                          className="w-full h-full border-0"
                          allowFullScreen
                          allow="autoplay; encrypted-media; picture-in-picture"
                        />
                      ) : (
                        <PremiumPlayer 
                          url={activeStreamUrl} 
                          title={selectedTab === 3 ? selectedChannel?.name : (selectedMatch ? `${selectedMatch.team_a?.name} vs ${selectedMatch.team_b?.name}` : 'Live Match')} 
                        />
                      )}
                    </div>

                    {/* Stream links switcher */}
                    {selectedMatch && matchStreams.length > 0 && (
                      <div className="mt-3.5 p-3.5 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                          📺 Select Stream Link:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {matchStreams.map((stream: any, streamIdx: number) => {
                            const links = [
                              { name: stream.name || `Link ${streamIdx + 1}`, url: stream.primary_url },
                              stream.backup_url_1 ? { name: `${stream.name || `Link ${streamIdx + 1}`} B1`, url: stream.backup_url_1 } : null,
                              stream.backup_url_2 ? { name: `${stream.name || `Link ${streamIdx + 1}`} B2`, url: stream.backup_url_2 } : null,
                              stream.backup_url_3 ? { name: `${stream.name || `Link ${streamIdx + 1}`} B3`, url: stream.backup_url_3 } : null,
                            ].filter(Boolean) as { name: string; url: string }[];

                            return links.map((link, linkIdx) => {
                              const isActive = activeStreamUrl === link.url;
                              return (
                                <button
                                  key={`${stream.id}-${linkIdx}`}
                                  onClick={() => setActiveStreamUrl(link.url)}
                                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
                                    isActive
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-transparent shadow shadow-emerald-500/10'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                                  }`}
                                >
                                  {link.name}
                                </button>
                              );
                            });
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Info panel */}
                {selectedMatch ? (
                  <>
                    {/* Team flags comparisons header */}
                    <div className="flex justify-around items-center bg-slate-950/40 border border-slate-905 p-4 rounded-2xl">
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <img src={selectedMatch.team_a?.flag_url} alt="" className="w-8 h-5 object-cover rounded shadow" />
                        <span className="text-xs font-extrabold text-white">{selectedMatch.team_a?.code}</span>
                      </div>
                      <div className="text-center">
                        {selectedMatch.status !== 'UPCOMING' ? (
                          <span className="text-lg font-black text-white">{selectedMatch.team_a_score} - {selectedMatch.team_b_score}</span>
                        ) : (
                          <span className="text-xs font-bold text-amber-500">VS</span>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <img src={selectedMatch.team_b?.flag_url} alt="" className="w-8 h-5 object-cover rounded shadow" />
                        <span className="text-xs font-extrabold text-white">{selectedMatch.team_b?.code}</span>
                      </div>
                    </div>

                    {/* Timeline & Stats tabs */}
                    <div className="flex bg-slate-955/40 p-1 rounded-xl border border-slate-900 gap-1">
                      {['Events Timeline', 'Statistics'].map((label, idx) => (
                        <button
                          key={idx}
                          onClick={() => setDetailsTab(idx)}
                          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                            detailsTab === idx ? 'bg-slate-900 border border-slate-850 text-white' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Views */}
                    {detailsTab === 0 ? (
                      // Timeline (Mock events or Supabase select)
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {mockDb.getEvents(selectedMatch.id).map((ev: any) => (
                          <div key={ev.id} className="flex items-center gap-3 text-xs">
                            <span className="font-mono font-bold text-amber-500 px-2 py-0.5 bg-slate-950 border border-slate-900 rounded">
                              {ev.minute}'
                            </span>
                            <div>
                              <span className="font-extrabold text-white">{ev.type}</span>
                              <p className="text-[10px] text-slate-500">{ev.player_in || ev.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Stats Comparisons Progress Bars
                      <div className="space-y-4 text-xs">
                        {(() => {
                          const stats = mockDb.getStatsForMatch(selectedMatch.id);
                          return (
                            <>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                                  <span>Possession: {stats.possession_a}%</span>
                                  <span>{stats.possession_b}%</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden flex bg-slate-950">
                                  <div className="bg-emerald-500 h-full" style={{ width: `${stats.possession_a}%` }} />
                                  <div className="bg-amber-500 h-full" style={{ width: `${stats.possession_b}%` }} />
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                                  <span>Shots on Target: {stats.shots_a}</span>
                                  <span>{stats.shots_b}</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden flex bg-slate-950">
                                  <div className="bg-emerald-500 h-full" style={{ width: `${(stats.shots_a / (stats.shots_a + stats.shots_b || 1)) * 100}%` }} />
                                  <div className="bg-amber-500 h-full" style={{ width: `${(stats.shots_b / (stats.shots_a + stats.shots_b || 1)) * 100}%` }} />
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </>
                ) : (
                  // Live TV Info
                  <div className="bg-slate-955/40 border border-slate-900 p-4 rounded-2xl text-xs space-y-3">
                    <div className="flex items-center gap-3">
                      {selectedChannel?.logo ? (
                        <img src={selectedChannel.logo} className="w-12 h-12 object-contain rounded bg-slate-900 p-1 border border-slate-800" onError={(e) => { (e.target as any).src = ''; }} alt="" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm uppercase">
                          {selectedChannel?.name.substring(0, 2) || 'TV'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-extrabold text-white text-xs leading-snug line-clamp-1">{selectedChannel?.name}</h4>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 block">{selectedChannel?.group || 'General'}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-900/60">
                      ℹ️ This stream is playing from your selected playlist. If the stream fails to load or buffers, try switching channels or reload the page.
                    </div>
                  </div>
                )}

              </div>
            ) : (
              // Empty panel placeholder
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                <div className="w-12 h-12 bg-slate-950/60 rounded-2xl flex items-center justify-center border border-slate-850 text-slate-600 mb-3 animate-pulse">
                  <Trophy className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Select a fixture or channel</p>
                <p className="text-xs text-slate-500 mt-1">Select a match card or visit the Live TV tab to browse and play live streaming channels.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Dynamic script ad network banner container */}
      {activeAdBanner && (
        <div className="mt-8 border-t border-slate-900 pt-6 text-center max-w-4xl mx-auto w-full">
          <div 
            className="inline-block"
            dangerouslySetInnerHTML={{ __html: activeAdBanner }} 
          />
        </div>
      )}

      {/* Footer attribution */}
      <footer className="w-full text-center py-6 border-t border-slate-900/60 mt-12 text-slate-500 text-xs font-semibold">
        Developed by <a href="https://www.tanvirh.pro" target="_blank" rel="noopener noreferrer" className="font-black text-slate-350 hover:text-emerald-400 transition-all">Tanvir Hossain</a>
      </footer>

      {/* Real-time Push Notification Toast */}
      {activeToast && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-5 shadow-2xl shadow-emerald-950/20 animate-in slide-in-from-top-10 slide-in-from-right-10 duration-300">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 animate-pulse flex-shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full uppercase tracking-wider">
                  {activeToast.category}
                </span>
                <button onClick={() => setActiveToast(null)} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="text-xs font-black text-white truncate">{activeToast.title}</h4>
              <p className="text-[11px] text-slate-400 leading-normal break-words">{activeToast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
