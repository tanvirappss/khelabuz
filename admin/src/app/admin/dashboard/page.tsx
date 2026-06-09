'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Tv, 
  BellRing, 
  Activity, 
  Flame, 
  Smartphone 
} from 'lucide-react';
import { mockDb, isMockEnabled } from '@/lib/supabase';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function OverviewPage() {
  const { data: matches = [] } = useQuery({
    queryKey: ['dashboard_matches_relocated'],
    queryFn: async () => {
      if (isMockEnabled) {
        return mockDb.getMatches();
      } else {
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
      }
    },
    refetchInterval: 5000
  });

  const liveMatches = matches.filter((m: any) => m.status === 'LIVE');

  const stats = [
    { name: 'Total App Installs', value: '1,428,500', change: '+12.5%', icon: Smartphone, color: 'text-sky-400' },
    { name: 'Live Match Viewers', value: '384,120', change: '+45.2%', icon: Users, color: 'text-emerald-400' },
    { name: 'Active Stream Feeds', value: '8', change: 'Stable', icon: Tv, color: 'text-violet-400' },
    { name: 'Push Delivery Rate', value: '99.4%', change: '+0.1%', icon: BellRing, color: 'text-amber-400' },
  ];

  const trafficData = [
    { time: '12:00', viewers: 120000 },
    { time: '13:00', viewers: 180000 },
    { time: '14:00', viewers: 240000 },
    { time: '15:00', viewers: 350000 },
    { time: '16:00', viewers: 384120 },
    { time: '17:00', viewers: 310000 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Dashboard Overview</h1>
          <p className="text-slate-400 text-sm">Real-time telemetry and operation control for World Cup traffic.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Real-time Stream Engine Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 hover:border-slate-800 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.name}</p>
                  <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{stat.value}</h3>
                </div>
                <div className={`p-3 bg-slate-950/60 rounded-2xl ${stat.color} border border-slate-800`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-xs">
                <span className="text-emerald-400 font-bold">{stat.change}</span>
                <span className="text-slate-500">vs yesterday</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                Live Concurrent Viewers
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Telemetry tracking concurrent stream sockets.</p>
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="viewers" name="Viewers" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorViewers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-white uppercase tracking-wider text-sm mb-4">
              Active Live Matches ({liveMatches.length})
            </h3>
            
            {liveMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-slate-950/60 rounded-2xl flex items-center justify-center border border-slate-800 text-slate-600 mb-3">
                  <Tv className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-400">No matches are live right now</p>
              </div>
            ) : (
              <div className="space-y-4">
                {liveMatches.map((match: any) => (
                  <div key={match.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>{match.tournament}</span>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full animate-pulse">
                        ● LIVE
                      </span>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img src={match.team_a?.flag_url} alt="" className="w-6 h-4 object-cover rounded shadow" />
                          <span className="text-sm font-extrabold text-white">{match.team_a?.name}</span>
                        </div>
                        <span className="text-base font-black text-white">{match.team_a_score}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img src={match.team_b?.flag_url} alt="" className="w-6 h-4 object-cover rounded shadow" />
                          <span className="text-sm font-extrabold text-white">{match.team_b?.name}</span>
                        </div>
                        <span className="text-base font-black text-white">{match.team_b_score}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/60 text-[10px] text-slate-400">
                      🏟️ {match.stadium}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <a href="/admin/dashboard/matches" className="w-full block text-center py-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold transition-all text-slate-200">
              Manage Matches & Triggers
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
