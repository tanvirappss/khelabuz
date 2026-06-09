'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDb, isMockEnabled, getWc2026GroupMatches, newQualifiedTeams } from '@/lib/supabase';
import { Calendar, Clock, MapPin, Plus, Trash2, Edit3, Activity, Zap } from 'lucide-react';

export default function MatchManagerPage() {
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Edit Match states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<any>(null);
  const [editTeamAName, setEditTeamAName] = useState('');
  const [editTeamAFlag, setEditTeamAFlag] = useState('');
  const [editTeamBName, setEditTeamBName] = useState('');
  const [editTeamBFlag, setEditTeamBFlag] = useState('');
  const [editTeamAScore, setEditTeamAScore] = useState(0);
  const [editTeamBScore, setEditTeamBScore] = useState(0);
  const [editStadium, setEditStadium] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editStatus, setEditStatus] = useState('UPCOMING');
  const [editTournament, setEditTournament] = useState('');

  // Team edit states (in Create Modal)
  const [teamAName, setTeamAName] = useState('');
  const [teamAFlag, setTeamAFlag] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [teamBFlag, setTeamBFlag] = useState('');

  // General Manage Teams states
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [selectedManageTeamId, setSelectedManageTeamId] = useState('');
  const [manageTeamName, setManageTeamName] = useState('');
  const [manageTeamFlag, setManageTeamFlag] = useState('');

  const saveTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      if (isMockEnabled) return mockDb.saveTeam(teamData);
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('teams').upsert(teamData).select();
        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams_relocated'] });
      queryClient.invalidateQueries({ queryKey: ['matches_relocated'] });
    }
  });

  const handleFlagUpload = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectManageTeam = (teamId: string) => {
    setSelectedManageTeamId(teamId);
    const t = teams.find((x: any) => x.id === teamId);
    if (t) {
      setManageTeamName(t.name);
      setManageTeamFlag(t.flag_url);
    }
  };

  const handleUpdateTeam = async () => {
    const t = teams.find((x: any) => x.id === selectedManageTeamId);
    if (t) {
      await saveTeamMutation.mutateAsync({
        ...t,
        name: manageTeamName,
        flag_url: manageTeamFlag
      });
      alert("Team details updated successfully!");
    }
  };

  const handleToggleWcGroupStage = async () => {
    const isWcPopulated = matches.some((m: any) => m.id.startsWith('match-g-'));
    
    if (isWcPopulated) {
      if (!confirm("Are you sure you want to REMOVE all 72 auto-populated World Cup 2026 Group Stage matches?")) {
        return;
      }
      setIsImporting(true);
      try {
        if (isMockEnabled) {
          const allMatches = JSON.parse(localStorage.getItem('wc_matches') || '[]');
          const filtered = allMatches.filter((m: any) => !m.id.startsWith('match-g-'));
          localStorage.setItem('wc_matches', JSON.stringify(filtered));
          
          // Also clean up stats
          const allStats = JSON.parse(localStorage.getItem('wc_stats') || '[]');
          const filteredStats = allStats.filter((s: any) => !s.match_id.startsWith('match-g-'));
          localStorage.setItem('wc_stats', JSON.stringify(filteredStats));

          alert("Successfully removed all 72 Group Stage matches from Mock Database!");
        } else {
          const { supabase } = await import('@/lib/supabase');
          if (supabase) {
            const { error } = await supabase.from('matches').delete().like('id', 'match-g-%');
            if (error) throw error;
            alert("Successfully removed all 72 Group Stage matches from production Supabase database!");
          }
        }
        queryClient.invalidateQueries({ queryKey: ['matches_relocated'] });
        refetchMatches();
      } catch (err: any) {
        console.error(err);
        alert("Error removing matches: " + (err.message || err));
      } finally {
        setIsImporting(false);
      }
    } else {
      if (!confirm("Do you want to auto-populate all 72 Group Stage matches of the Football World Cup 2026?")) {
        return;
      }
      setIsImporting(true);
      try {
        if (isMockEnabled) {
          // 1. Ensure all 48 teams are in local storage teams
          const existingTeams = mockDb.getTeams();
          const updatedTeams = [...existingTeams];
          newQualifiedTeams.forEach((newTeam) => {
            if (!updatedTeams.some((t: any) => t.id === newTeam.id)) {
              updatedTeams.push(newTeam);
            }
          });
          localStorage.setItem('wc_teams', JSON.stringify(updatedTeams));

          // 2. Generate and save group stage matches
          const groupMatches = getWc2026GroupMatches();
          groupMatches.forEach((m) => {
            mockDb.saveMatch(m);
          });
          
          alert("Successfully populated all 72 Group Stage matches in Mock Sandbox Database!");
        } else {
          const { supabase } = await import('@/lib/supabase');
          if (supabase) {
            // 1. Upsert missing qualified teams to Supabase
            const { error: teamsErr } = await supabase.from('teams').upsert(newQualifiedTeams, { onConflict: 'id' });
            if (teamsErr) throw teamsErr;

            // 2. Generate and save group stage matches to Supabase
            const groupMatches = getWc2026GroupMatches();
            const { error: matchesErr } = await supabase.from('matches').upsert(groupMatches, { onConflict: 'id' });
            if (matchesErr) throw matchesErr;

            // 3. Create initial empty stats entries for all matches
            const initialStats = groupMatches.map((m) => ({
              match_id: m.id,
              possession_a: 50, possession_b: 50,
              shots_a: 0, shots_b: 0,
              corners_a: 0, corners_b: 0,
              yellow_cards_a: 0, yellow_cards_b: 0,
              red_cards_a: 0, red_cards_b: 0
            }));
            const { error: statsErr } = await supabase.from('score_updates').upsert(initialStats, { onConflict: 'match_id' });
            if (statsErr) throw statsErr;

            alert("Successfully populated all 72 Group Stage matches in production Supabase database!");
          }
        }
        queryClient.invalidateQueries({ queryKey: ['matches_relocated'] });
        refetchMatches();
      } catch (err: any) {
        console.error(err);
        alert("Error importing matches: " + (err.message || err));
      } finally {
        setIsImporting(false);
      }
    }
  };

  // Forms
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [stadium, setStadium] = useState('');
  const [startTime, setStartTime] = useState('');
  const [status, setStatus] = useState('UPCOMING');
  const [tournament, setTournament] = useState('FIFA World Cup 2026');

  // Stats
  const [possessionA, setPossessionA] = useState(50);
  const [possessionB, setPossessionB] = useState(50);
  const [shotsA, setShotsA] = useState(0);
  const [shotsB, setShotsB] = useState(0);
  const [cornersA, setCornersA] = useState(0);
  const [cornersB, setCornersB] = useState(0);
  const [yellowA, setYellowA] = useState(0);
  const [yellowB, setYellowB] = useState(0);
  const [redA, setRedA] = useState(0);
  const [redB, setRedB] = useState(0);

  // Events
  const [eventType, setEventType] = useState('GOAL');
  const [eventTeamId, setEventTeamId] = useState('');
  const [eventMinute, setEventMinute] = useState(1);
  const [playerIn, setPlayerIn] = useState('');
  const [playerOut, setPlayerOut] = useState('');
  const [eventDetail, setEventDetail] = useState('');

  // Custom Dropdown states for Team A and Team B flag selectors
  const [isDropdownAOpen, setIsDropdownAOpen] = useState(false);
  const [isDropdownBOpen, setIsDropdownBOpen] = useState(false);

  // Queries
  const { data: teams = [] } = useQuery({
    queryKey: ['teams_relocated'],
    queryFn: async () => {
      if (isMockEnabled) return mockDb.getTeams();
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('teams').select('*').order('name');
        if (error) throw error;
        return data;
      }
      return [];
    }
  });

  const { data: matches = [], refetch: refetchMatches } = useQuery({
    queryKey: ['matches_relocated'],
    queryFn: async () => {
      if (isMockEnabled) return mockDb.getMatches();
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase
          .from('matches')
          .select('*, team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)')
          .order('start_time', { ascending: true }); // Sort chronologically ascending
        if (error) throw error;
        return data;
      }
      return [];
    }
  });

  const saveMatchMutation = useMutation({
    mutationFn: async (matchData: any) => {
      if (isMockEnabled) return mockDb.saveMatch(matchData);
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('matches').upsert(matchData).select();
        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches_relocated'] });
      refetchMatches();
      setIsCreateModalOpen(false);
      setTeamAId(''); setTeamBId(''); setStadium(''); setStartTime(''); setStatus('UPCOMING');
    }
  });

  const deleteMatchMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isMockEnabled) mockDb.deleteMatch(id);
      else {
        const { supabase } = await import('@/lib/supabase');
        if (supabase) {
          const { error } = await supabase.from('matches').delete().eq('id', id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches_relocated'] });
      refetchMatches();
    }
  });

  const saveStatsMutation = useMutation({
    mutationFn: async (statData: any) => {
      if (isMockEnabled) return mockDb.saveStats(statData);
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('score_updates').upsert(statData).select();
        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => setIsStatsModalOpen(false)
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      if (isMockEnabled) return mockDb.addEvent(eventData);
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('match_events').insert(eventData).select();
        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches_relocated'] });
      refetchMatches();
      setIsEventsModalOpen(false);
      setPlayerIn(''); setPlayerOut(''); setEventDetail(''); setEventMinute(1);
    }
  });

  const formatDatetimeLocal = (isoString: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  const openEditModal = (match: any) => {
    setEditMatch(match);
    setEditTeamAName(match.team_a?.name || '');
    setEditTeamAFlag(match.team_a?.flag_url || '');
    setEditTeamBName(match.team_b?.name || '');
    setEditTeamBFlag(match.team_b?.flag_url || '');
    setEditTeamAScore(match.team_a_score || 0);
    setEditTeamBScore(match.team_b_score || 0);
    setEditStadium(match.stadium || '');
    setEditStartTime(formatDatetimeLocal(match.start_time));
    setEditStatus(match.status || 'UPCOMING');
    setEditTournament(match.tournament || 'FIFA World Cup 2026');
    setIsEditModalOpen(true);
  };

  const handleUpdateMatchDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMatch) return;

    try {
      // 1. Update Team A details if changed
      if (editMatch.team_a && (editMatch.team_a.name !== editTeamAName || editMatch.team_a.flag_url !== editTeamAFlag)) {
        await saveTeamMutation.mutateAsync({
          ...editMatch.team_a,
          name: editTeamAName,
          flag_url: editTeamAFlag
        });
      }

      // 2. Update Team B details if changed
      if (editMatch.team_b && (editMatch.team_b.name !== editTeamBName || editMatch.team_b.flag_url !== editTeamBFlag)) {
        await saveTeamMutation.mutateAsync({
          ...editMatch.team_b,
          name: editTeamBName,
          flag_url: editTeamBFlag
        });
      }

      // 3. Update Match details
      await saveMatchMutation.mutateAsync({
        id: editMatch.id,
        team_a_id: editMatch.team_a_id,
        team_b_id: editMatch.team_b_id,
        stadium: editStadium,
        start_time: new Date(editStartTime).toISOString(),
        status: editStatus,
        tournament: editTournament,
        team_a_score: editTeamAScore,
        team_b_score: editTeamBScore
      });

      alert("Match details updated successfully!");
      setIsEditModalOpen(false);
      setEditMatch(null);
    } catch (err: any) {
      console.error(err);
      alert("Error updating match details: " + (err.message || err));
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamAId || !teamBId || teamAId === teamBId) {
      alert('Select two different teams.');
      return;
    }

    // Save modified Team A details first
    const currentTeamA = teams.find((t: any) => t.id === teamAId);
    if (currentTeamA && (currentTeamA.name !== teamAName || currentTeamA.flag_url !== teamAFlag)) {
      await saveTeamMutation.mutateAsync({
        ...currentTeamA,
        name: teamAName,
        flag_url: teamAFlag
      });
    }

    // Save modified Team B details first
    const currentTeamB = teams.find((t: any) => t.id === teamBId);
    if (currentTeamB && (currentTeamB.name !== teamBName || currentTeamB.flag_url !== teamBFlag)) {
      await saveTeamMutation.mutateAsync({
        ...currentTeamB,
        name: teamBName,
        flag_url: teamBFlag
      });
    }

    saveMatchMutation.mutate({
      team_a_id: teamAId,
      team_b_id: teamBId,
      stadium,
      start_time: new Date(startTime).toISOString(),
      status,
      tournament,
      team_a_score: 0,
      team_b_score: 0
    });
  };

  const handleUpdateStatus = (match: any, newStatus: string) => {
    saveMatchMutation.mutate({
      id: match.id,
      team_a_id: match.team_a_id,
      team_b_id: match.team_b_id,
      stadium: match.stadium,
      start_time: match.start_time,
      status: newStatus,
      tournament: match.tournament,
      team_a_score: match.team_a_score,
      team_b_score: match.team_b_score
    });
  };

  const openStatsModal = async (match: any) => {
    setSelectedMatch(match);
    let stats: any = null;
    if (isMockEnabled) stats = mockDb.getStatsForMatch(match.id);
    else {
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data } = await supabase.from('score_updates').select('*').eq('match_id', match.id).single();
        stats = data;
      }
    }

    if (stats) {
      setPossessionA(stats.possession_a); setPossessionB(stats.possession_b);
      setShotsA(stats.shots_a); setShotsB(stats.shots_b);
      setCornersA(stats.corners_a); setCornersB(stats.corners_b);
      setYellowA(stats.yellow_cards_a); setYellowB(stats.yellow_cards_b);
      setRedA(stats.red_cards_a); setRedB(stats.red_cards_b);
    }
    setIsStatsModalOpen(true);
  };

  const handleSaveStats = (e: React.FormEvent) => {
    e.preventDefault();
    saveStatsMutation.mutate({
      match_id: selectedMatch.id,
      possession_a: possessionA, possession_b: possessionB,
      shots_a: shotsA, shots_b: shotsB,
      corners_a: cornersA, corners_b: cornersB,
      yellow_cards_a: yellowA, yellow_cards_b: yellowB,
      red_cards_a: redA, red_cards_b: redB
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Match Management</h1>
          <p className="text-slate-400 text-sm">Control kick-off times, stats, scores, and timeline triggers.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {(() => {
            const isWcPopulated = matches.some((m: any) => m.id.startsWith('match-g-'));
            return (
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider">WC 2026 Group Stage:</span>
                <button
                  type="button"
                  onClick={handleToggleWcGroupStage}
                  disabled={isImporting}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                    isWcPopulated ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                      isWcPopulated ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-[10px] font-black uppercase tracking-wider ${isWcPopulated ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isWcPopulated ? 'Populated (ON)' : 'Empty (OFF)'}
                </span>
              </div>
            );
          })()}
          <button
            onClick={() => setIsTeamsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200 font-bold rounded-xl shadow transition-all cursor-pointer"
          >
            Manage Teams
          </button>
          <button
            onClick={() => {
              setTeamAId(''); setTeamBId(''); setTeamAName(''); setTeamAFlag(''); setTeamBName(''); setTeamBFlag('');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Create Match
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {matches.map((match: any) => (
          <div key={match.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 bg-slate-950 border border-slate-850 rounded-full text-slate-400 uppercase tracking-wider">
                  {match.tournament}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-3">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{match.stadium}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {match.status === 'LIVE' ? (
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-black animate-pulse">
                    ● LIVE
                  </span>
                ) : match.status === 'FINISHED' ? (
                  <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold">
                    FINISHED
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-bold">
                    UPCOMING
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 items-center py-6">
              <div className="flex flex-col items-center text-center">
                <img src={match.team_a?.flag_url} alt="" className="w-14 h-9 object-cover rounded-xl shadow-lg border border-slate-800" />
                <span className="text-sm font-extrabold text-white mt-3">{match.team_a?.name}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-855 rounded-2xl px-5 py-2.5">
                  <span className="text-2xl font-black text-white">{match.team_a_score}</span>
                  <span className="text-slate-600 font-extrabold">:</span>
                  <span className="text-2xl font-black text-white">{match.team_b_score}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                  {new Date(match.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Dhaka' })} at {new Date(match.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dhaka' })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <img src={match.team_b?.flag_url} alt="" className="w-14 h-9 object-cover rounded-xl shadow-lg border border-slate-800" />
                <span className="text-sm font-extrabold text-white mt-3">{match.team_b?.name}</span>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-4 flex flex-wrap gap-2.5 items-center justify-between">
              <div className="flex items-center gap-2">
                {match.status === 'UPCOMING' && (
                  <button onClick={() => handleUpdateStatus(match, 'LIVE')} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg">
                    Start Match
                  </button>
                )}
                {match.status === 'LIVE' && (
                  <button onClick={() => handleUpdateStatus(match, 'FINISHED')} className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-lg">
                    End Match
                  </button>
                )}
                
                <button onClick={() => openEditModal(match)} className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  Edit Details
                </button>
                
                <button onClick={() => openStatsModal(match)} className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Edit Stats
                </button>

                <button onClick={() => { setSelectedMatch(match); setEventTeamId(match.team_a_id); setIsEventsModalOpen(true); }} className="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Add Event
                </button>
              </div>

              <button
                onClick={() => { if (confirm('Delete this match?')) deleteMatchMutation.mutate(match.id); }}
                className="p-2 bg-slate-950/60 hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 relative">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4">Create New Match</h2>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Team A Custom Dropdown flag selector */}
                <div className="space-y-1 relative">
                  <label className="text-xs text-slate-400 font-bold">Team A</label>
                  <button 
                    type="button" 
                    onClick={() => { setIsDropdownAOpen(!isDropdownAOpen); setIsDropdownBOpen(false); }} 
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm flex items-center justify-between text-white outline-none focus:border-emerald-500"
                  >
                    {teamAId ? (
                      <div className="flex items-center gap-2">
                        <img src={teamAFlag || teams.find((t: any) => t.id === teamAId)?.flag_url} className="w-6 h-4 object-cover rounded shadow" />
                        <span className="truncate">{teamAName || teams.find((t: any) => t.id === teamAId)?.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Select Team A</span>
                    )}
                    <span className="text-xs text-slate-500">▼</span>
                  </button>
                  {isDropdownAOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-850 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                      {teams.map((t: any) => (
                        <div 
                          key={t.id} 
                          onClick={() => { 
                            setTeamAId(t.id); 
                            setTeamAName(t.name);
                            setTeamAFlag(t.flag_url);
                            setIsDropdownAOpen(false); 
                          }} 
                          className="p-2.5 hover:bg-slate-900 cursor-pointer flex items-center gap-3 transition-colors"
                        >
                          <img src={t.flag_url} className="w-6 h-4 object-cover rounded" />
                          <span className="text-white text-xs font-semibold">{t.name} ({t.code})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {teamAId && (
                    <div className="mt-2 p-2.5 bg-slate-950/40 rounded-xl border border-slate-850 space-y-2">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Edit Team A</div>
                      <input 
                        type="text" 
                        value={teamAName} 
                        onChange={(e) => setTeamAName(e.target.value)} 
                        placeholder="Team Name" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white" 
                      />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFlagUpload(file, (base64) => setTeamAFlag(base64));
                          }
                        }}
                        className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-900 file:text-slate-350 hover:file:bg-slate-800 cursor-pointer" 
                      />
                    </div>
                  )}
                </div>

                {/* Team B Custom Dropdown flag selector */}
                <div className="space-y-1 relative">
                  <label className="text-xs text-slate-400 font-bold">Team B</label>
                  <button 
                    type="button" 
                    onClick={() => { setIsDropdownBOpen(!isDropdownBOpen); setIsDropdownAOpen(false); }} 
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm flex items-center justify-between text-white outline-none focus:border-emerald-500"
                  >
                    {teamBId ? (
                      <div className="flex items-center gap-2">
                        <img src={teamBFlag || teams.find((t: any) => t.id === teamBId)?.flag_url} className="w-6 h-4 object-cover rounded shadow" />
                        <span className="truncate">{teamBName || teams.find((t: any) => t.id === teamBId)?.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Select Team B</span>
                    )}
                    <span className="text-xs text-slate-500">▼</span>
                  </button>
                  {isDropdownBOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-850 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                      {teams.map((t: any) => (
                        <div 
                          key={t.id} 
                          onClick={() => { 
                            setTeamBId(t.id); 
                            setTeamBName(t.name);
                            setTeamBFlag(t.flag_url);
                            setIsDropdownBOpen(false); 
                          }} 
                          className="p-2.5 hover:bg-slate-900 cursor-pointer flex items-center gap-3 transition-colors"
                        >
                          <img src={t.flag_url} className="w-6 h-4 object-cover rounded" />
                          <span className="text-white text-xs font-semibold">{t.name} ({t.code})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {teamBId && (
                    <div className="mt-2 p-2.5 bg-slate-950/40 rounded-xl border border-slate-850 space-y-2">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Edit Team B</div>
                      <input 
                        type="text" 
                        value={teamBName} 
                        onChange={(e) => setTeamBName(e.target.value)} 
                        placeholder="Team Name" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white" 
                      />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFlagUpload(file, (base64) => setTeamBFlag(base64));
                          }
                        }}
                        className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-900 file:text-slate-350 hover:file:bg-slate-800 cursor-pointer" 
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Stadium</label>
                <input type="text" value={stadium} onChange={(e) => setStadium(e.target.value)} required placeholder="MetLife Stadium" className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Date & Time (Click to open Calendar/Clock)</label>
                <input 
                  type="datetime-local" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  onClick={(e) => (e.target as any).showPicker?.()}
                  required 
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm cursor-pointer outline-none focus:border-emerald-500 text-white scheme-dark" 
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2.5 bg-slate-950 border border-slate-850 text-slate-400 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DETAILS MODAL */}
      {isEditModalOpen && editMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4">Edit Match Details</h2>
            <form onSubmit={handleUpdateMatchDetails} className="space-y-4">
              
              {/* Team A Details */}
              <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-850 space-y-3">
                <div className="text-xs font-black text-emerald-400 uppercase tracking-wider">Team A (Home)</div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold">Team Name</label>
                  <input 
                    type="text" 
                    value={editTeamAName} 
                    onChange={(e) => setEditTeamAName(e.target.value)} 
                    required 
                    placeholder="Team A Name" 
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm text-white" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold block">Flag Preview & Upload</label>
                  <div className="flex items-center gap-3">
                    {editTeamAFlag && (
                      <img src={editTeamAFlag} alt="Team A Flag" className="w-12 h-8 object-cover rounded shadow border border-slate-800" />
                    )}
                    <div className="flex-1 space-y-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFlagUpload(file, (base64) => setEditTeamAFlag(base64));
                          }
                        }}
                        className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-900 file:text-slate-350 cursor-pointer" 
                      />
                      <input 
                        type="text" 
                        value={editTeamAFlag} 
                        onChange={(e) => setEditTeamAFlag(e.target.value)} 
                        placeholder="Or flag URL" 
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1 text-xs text-white" 
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold">Goals Scored</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editTeamAScore} 
                    onChange={(e) => setEditTeamAScore(parseInt(e.target.value) || 0)} 
                    required 
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 text-sm text-white" 
                  />
                </div>
              </div>

              {/* Team B Details */}
              <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-850 space-y-3">
                <div className="text-xs font-black text-teal-400 uppercase tracking-wider">Team B (Away)</div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold">Team Name</label>
                  <input 
                    type="text" 
                    value={editTeamBName} 
                    onChange={(e) => setEditTeamBName(e.target.value)} 
                    required 
                    placeholder="Team B Name" 
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm text-white" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold block">Flag Preview & Upload</label>
                  <div className="flex items-center gap-3">
                    {editTeamBFlag && (
                      <img src={editTeamBFlag} alt="Team B Flag" className="w-12 h-8 object-cover rounded shadow border border-slate-800" />
                    )}
                    <div className="flex-1 space-y-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFlagUpload(file, (base64) => setEditTeamBFlag(base64));
                          }
                        }}
                        className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-900 file:text-slate-350 cursor-pointer" 
                      />
                      <input 
                        type="text" 
                        value={editTeamBFlag} 
                        onChange={(e) => setEditTeamBFlag(e.target.value)} 
                        placeholder="Or flag URL" 
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1 text-xs text-white" 
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold">Goals Scored</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editTeamBScore} 
                    onChange={(e) => setEditTeamBScore(parseInt(e.target.value) || 0)} 
                    required 
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 text-sm text-white" 
                  />
                </div>
              </div>

              {/* General Match Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold">Tournament</label>
                    <input 
                      type="text" 
                      value={editTournament} 
                      onChange={(e) => setEditTournament(e.target.value)} 
                      required 
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm text-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold">Stadium</label>
                    <input 
                      type="text" 
                      value={editStadium} 
                      onChange={(e) => setEditStadium(e.target.value)} 
                      required 
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm text-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold">Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={editStartTime} 
                      onChange={(e) => setEditStartTime(e.target.value)} 
                      onClick={(e) => (e.target as any).showPicker?.()}
                      required 
                      style={{ colorScheme: 'dark' }}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm text-white scheme-dark cursor-pointer animate-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold">Status</label>
                    <select 
                      value={editStatus} 
                      onChange={(e) => setEditStatus(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm text-white outline-none"
                    >
                      <option value="UPCOMING">UPCOMING</option>
                      <option value="LIVE">LIVE</option>
                      <option value="FINISHED">FINISHED</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditMatch(null); }} className="px-4 py-2.5 bg-slate-950 border border-slate-850 text-slate-400 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATS MODAL */}
      {isStatsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 relative">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4">Adjust Stats</h2>
            <form onSubmit={handleSaveStats} className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>{selectedMatch?.team_a?.name}: {possessionA}%</span>
                  <span>{selectedMatch?.team_b?.name}: {possessionB}%</span>
                </div>
                <input type="range" min="0" max="100" value={possessionA} onChange={(e) => { const v = parseInt(e.target.value); setPossessionA(v); setPossessionB(100-v); }} className="w-full accent-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Shots A" value={shotsA} onChange={(e) => setShotsA(parseInt(e.target.value) || 0)} className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
                <input type="number" placeholder="Shots B" value={shotsB} onChange={(e) => setShotsB(parseInt(e.target.value) || 0)} className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsStatsModalOpen(false)} className="px-4 py-2.5 bg-slate-950 border border-slate-850 text-slate-400 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT LOGGER */}
      {isEventsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 relative">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4">Log Match Event</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              createEventMutation.mutate({
                match_id: selectedMatch.id,
                team_id: eventType === 'MATCH_START' || eventType === 'MATCH_END' ? null : eventTeamId,
                type: eventType,
                minute: eventMinute,
                player_in: playerIn || null,
                player_out: playerOut || null,
                detail: eventDetail || null
              });
            }} className="space-y-4">
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm">
                <option value="GOAL">⚽ Goal</option>
                <option value="PENALTY">🎯 Penalty</option>
                <option value="OWN_GOAL">❌ Own Goal</option>
                <option value="YELLOW_CARD">🟨 Yellow Card</option>
                <option value="RED_CARD">🟥 Red Card</option>
                <option value="SUBSTITUTION">🔄 Substitution</option>
                <option value="MATCH_START">🟢 Kick-off</option>
                <option value="MATCH_END">🔴 Full Time</option>
              </select>
              {eventType !== 'MATCH_START' && eventType !== 'MATCH_END' && (
                <select value={eventTeamId} onChange={(e) => setEventTeamId(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm">
                  <option value={selectedMatch?.team_a_id}>{selectedMatch?.team_a?.name}</option>
                  <option value={selectedMatch?.team_b_id}>{selectedMatch?.team_b?.name}</option>
                </select>
              )}
              <input type="number" placeholder="Minute" value={eventMinute} onChange={(e) => setEventMinute(parseInt(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
              <input type="text" placeholder="Player Name" value={playerIn} onChange={(e) => setPlayerIn(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsEventsModalOpen(false)} className="px-4 py-2.5 bg-slate-950 border border-slate-850 text-slate-400 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl">Log Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE TEAMS MODAL */}
      {isTeamsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 relative">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4">Manage Teams</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Select Team to Edit</label>
                <select 
                  value={selectedManageTeamId} 
                  onChange={(e) => handleSelectManageTeam(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm text-white"
                >
                  <option value="">-- Choose Team --</option>
                  {teams.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

              {selectedManageTeamId && (
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold">Team Name</label>
                    <input 
                      type="text" 
                      value={manageTeamName} 
                      onChange={(e) => setManageTeamName(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm text-white" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-bold block">Country Flag</label>
                    <div className="flex items-center gap-4">
                      {manageTeamFlag && (
                        <img src={manageTeamFlag} alt="Flag" className="w-16 h-10 object-cover rounded shadow border border-slate-800" />
                      )}
                      <div className="flex-1 space-y-2">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFlagUpload(file, (base64) => setManageTeamFlag(base64));
                            }
                          }}
                          className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-slate-950 file:text-slate-350 cursor-pointer" 
                        />
                        <input 
                          type="text" 
                          value={manageTeamFlag} 
                          onChange={(e) => setManageTeamFlag(e.target.value)} 
                          placeholder="Or enter Flag URL" 
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 text-xs text-white" 
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleUpdateTeam}
                    disabled={saveTeamMutation.isPending}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {saveTeamMutation.isPending ? 'Updating...' : 'Update Team Details'}
                  </button>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button type="button" onClick={() => { setIsTeamsModalOpen(false); setSelectedManageTeamId(''); }} className="px-4 py-2.5 bg-slate-950 border border-slate-850 text-slate-400 text-xs font-bold rounded-xl">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
