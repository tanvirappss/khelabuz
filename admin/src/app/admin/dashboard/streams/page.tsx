'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDb, isMockEnabled } from '@/lib/supabase';
import { Plus, Trash2, Edit3, Tv2 } from 'lucide-react';

export default function StreamManagerPage() {
  const queryClient = useQueryClient();
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewStreamUrl, setPreviewStreamUrl] = useState<string>('');

  // Forms
  const [matchId, setMatchId] = useState('');
  const [name, setName] = useState('');
  const [primaryUrl, setPrimaryUrl] = useState('');
  const [backupUrl1, setBackupUrl1] = useState('');
  const [backupUrl2, setBackupUrl2] = useState('');
  const [backupUrl3, setBackupUrl3] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isM3u, setIsM3u] = useState(false);

  // Queries
  const { data: matches = [] } = useQuery({
    queryKey: ['streams_matches_relocated'],
    queryFn: async () => {
      if (isMockEnabled) return mockDb.getMatches();
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('matches').select('*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)');
        if (error) throw error;
        return data;
      }
      return [];
    }
  });

  const { data: streams = [], refetch: refetchStreams } = useQuery({
    queryKey: ['streams_relocated'],
    queryFn: async () => {
      if (isMockEnabled) return mockDb.getStreams();
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('streams').select('*');
        if (error) throw error;
        return data;
      }
      return [];
    }
  });

  const saveStreamMutation = useMutation({
    mutationFn: async (streamData: any) => {
      if (isMockEnabled) return mockDb.saveStream(streamData);
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('streams').upsert(streamData).select();
        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams_relocated'] });
      refetchStreams();
      setIsModalOpen(false);
      resetForm();
    }
  });

  const deleteStreamMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isMockEnabled) mockDb.deleteStream(id);
      else {
        const { supabase } = await import('@/lib/supabase');
        if (supabase) {
          const { error } = await supabase.from('streams').delete().eq('id', id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams_relocated'] });
      refetchStreams();
    }
  });

  const resetForm = () => {
    setSelectedStream(null);
    setMatchId('');
    setName('');
    setPrimaryUrl('');
    setBackupUrl1('');
    setBackupUrl2('');
    setBackupUrl3('');
    setIsEnabled(true);
    setIsM3u(false);
  };

  const handleOpenEditModal = (stream: any) => {
    setSelectedStream(stream);
    setMatchId(stream.match_id);
    setName(stream.name);
    setPrimaryUrl(stream.primary_url);
    setBackupUrl1(stream.backup_url_1 || '');
    setBackupUrl2(stream.backup_url_2 || '');
    setBackupUrl3(stream.backup_url_3 || '');
    setIsEnabled(stream.is_enabled);
    setIsM3u(stream.is_m3u || false);
    setIsModalOpen(true);
  };
  const handleSaveStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isM3u && (!matchId || matchId === 'none')) {
      alert('Please select a match.');
      return;
    }
    saveStreamMutation.mutate({
      id: selectedStream?.id || undefined,
      match_id: matchId === 'none' || !matchId ? null : matchId,
      name,
      primary_url: primaryUrl,
      backup_url_1: backupUrl1 || null,
      backup_url_2: backupUrl2 || null,
      backup_url_3: backupUrl3 || null,
      is_enabled: isEnabled,
      is_m3u: isM3u
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Stream Manager</h1>
          <p className="text-slate-400 text-sm">Configure live HLS streams and fallback endpoints.</p>
        </div>
        <button
          onClick={() => { resetForm(); if (matches.length > 0) setMatchId(matches[0].id); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Stream URL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {streams.map((stream: any) => {
          const match = matches.find((m: any) => m.id === stream.match_id);
          return (
            <div key={stream.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-800 transition-all">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Tv2 className="w-4 h-4 text-emerald-400" />
                    <span>{stream.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {stream.is_m3u && (
                      <span className="text-[9px] font-black bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded">
                        M3U
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stream.is_enabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>{stream.is_enabled ? 'Active' : 'Disabled'}</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-2xl mb-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Match</p>
                  <p className="text-xs font-extrabold text-white">
                    {match ? `${match.team_a?.name} vs ${match.team_b?.name}` : stream.is_m3u ? 'M3U Playlist (General TV)' : 'General Live TV Channel'}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">Primary M3U8 Link</span>
                    <p className="font-mono text-slate-300 truncate bg-slate-950/20 border border-slate-900 px-3 py-2 rounded-xl">{stream.primary_url}</p>
                  </div>
                  {stream.backup_url_1 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">Backup URL 1</span>
                      <p className="font-mono text-slate-400 truncate bg-slate-950/20 border border-slate-900 px-3 py-2 rounded-xl">{stream.backup_url_1}</p>
                    </div>
                  )}
                  {stream.backup_url_2 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">Backup URL 2</span>
                      <p className="font-mono text-slate-400 truncate bg-slate-950/20 border border-slate-900 px-3 py-2 rounded-xl">{stream.backup_url_2}</p>
                    </div>
                  )}
                  {stream.backup_url_3 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">Backup URL 3</span>
                      <p className="font-mono text-slate-400 truncate bg-slate-950/20 border border-slate-900 px-3 py-2 rounded-xl">{stream.backup_url_3}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-900 mt-6 pt-4 flex gap-2.5 justify-end">
                <button 
                  onClick={() => setPreviewStreamUrl(stream.primary_url)} 
                  className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Tv2 className="w-3.5 h-3.5 text-emerald-400" /> Preview
                </button>
                <button onClick={() => handleOpenEditModal(stream)} className="px-3.5 py-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => { if (confirm('Delete stream?')) deleteStreamMutation.mutate(stream.id); }} className="p-2 bg-slate-950 hover:bg-rose-500/10 border border-slate-855 text-slate-500 hover:text-rose-400 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 relative">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4">Save Stream Feed</h2>
            <form onSubmit={handleSaveStream} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Match Link</label>
                <select value={matchId || ''} onChange={(e) => setMatchId(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm">
                  <option value="none">None (General TV / M3U Playlist)</option>
                  {matches.map((m: any) => <option key={m.id} value={m.id}>{m.team_a?.name} vs {m.team_b?.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Stream Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Server 1" className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Primary M3U8 URL</label>
                <input type="url" value={primaryUrl} onChange={(e) => setPrimaryUrl(e.target.value)} required placeholder="https://..." className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Backup 1</label>
                <input type="url" value={backupUrl1} onChange={(e) => setBackupUrl1(e.target.value)} placeholder="https://..." className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Backup 2</label>
                <input type="url" value={backupUrl2} onChange={(e) => setBackupUrl2(e.target.value)} placeholder="https://..." className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Backup 3</label>
                <input type="url" value={backupUrl3} onChange={(e) => setBackupUrl3(e.target.value)} placeholder="https://..." className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
              </div>
              <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                <input type="checkbox" id="isM3u" checked={isM3u} onChange={(e) => setIsM3u(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
                <label htmlFor="isM3u" className="text-xs font-bold text-slate-300">This URL is an M3U Playlist (Contains multiple channels)</label>
              </div>
              <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                <input type="checkbox" id="isEnabled" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
                <label htmlFor="isEnabled" className="text-xs font-bold text-slate-300">Enable this stream feed immediately</label>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 bg-slate-950 border border-slate-850 text-slate-400 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewStreamUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Stream Preview Player</h2>
              <button 
                onClick={() => setPreviewStreamUrl('')} 
                className="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs"
              >
                Close
              </button>
            </div>
            
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-950 shadow-xl">
              {(() => {
                const url = previewStreamUrl;
                const isIframe = !url.includes('.m3u8') && 
                                 !url.includes('.mp4') && 
                                 !url.includes('.webm') && 
                                 !url.includes('.ogg') &&
                                 (url.includes('embed') || 
                                  url.includes('iframe') || 
                                  url.includes('youtube.com') || 
                                  url.includes('youtu.be') || 
                                  url.includes('twitch.tv') ||
                                  url.includes('vimeo.com') ||
                                  !url.match(/\.(m3u8|mp4|webm|ogg)($|\?)/i));
                
                if (isIframe) {
                  const embedUrl = url.includes('youtube.com/watch?v=') 
                    ? url.replace('watch?v=', 'embed/') 
                    : url.includes('youtu.be/') 
                    ? `https://www.youtube.com/embed/${url.split('youtu.be/')[1]}`
                    : url;
                  return (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full border-0"
                      allowFullScreen
                      allow="autoplay; encrypted-media; picture-in-picture"
                    />
                  );
                } else {
                  return <AdminVideoPreview url={url} />;
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useRef, useEffect } from 'react';

function AdminVideoPreview({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    let hls: any = null;
    if (url && videoRef.current) {
      const video = videoRef.current;
      const isHls = url.includes('.m3u8') || url.includes('m3u8');
      
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else if (isHls) {
        import('hls.js').then((Hls) => {
          if (Hls.default.isSupported()) {
            hls = new Hls.default();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.default.Events.ERROR, (event: any, data: any) => {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.default.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                  case Hls.default.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    video.src = url;
                    break;
                }
              }
            });
          } else {
            video.src = url;
          }
        });
      } else {
        video.src = url;
      }
    }
    return () => {
      if (hls) hls.destroy();
    };
  }, [url]);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      className="w-full h-full object-contain"
    />
  );
}
