'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDb, isMockEnabled } from '@/lib/supabase';
import { Bell, Send, CheckCircle2, Clock, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  
  // Forms
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('ANNOUNCEMENT');
  const [matchId, setMatchId] = useState('');

  // Queries
  const { data: matches = [] } = useQuery({
    queryKey: ['notifications_matches_relocated'],
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

  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications_relocated'],
    queryFn: async () => {
      if (isMockEnabled) return mockDb.getNotifications();
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      }
      return [];
    }
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isMockEnabled) {
        return mockDb.addNotification({
          ...payload,
          status: 'SENT'
        });
      } else {
        const { supabase } = await import('@/lib/supabase');
        if (supabase) {
          const { data, error } = await supabase.from('notifications').insert({
            ...payload,
            status: 'DRAFT'
          }).select();
          if (error) throw error;
          return data[0];
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_relocated'] });
      refetchNotifications();
      setTitle('');
      setMessage('');
      setMatchId('');
      alert('Notification broadcast dispatched!');
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isMockEnabled) {
        mockDb.deleteNotification(id);
      } else {
        const { supabase } = await import('@/lib/supabase');
        if (supabase) {
          const { error } = await supabase.from('notifications').delete().eq('id', id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_relocated'] });
      refetchNotifications();
    }
  });

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      alert('Please fill out all fields.');
      return;
    }
    sendNotificationMutation.mutate({
      title,
      message,
      category,
      match_id: matchId || null
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Broadcast Center</h1>
          <p className="text-slate-400 text-sm">Send high-priority push notifications to all users globally.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 h-fit">
          <h3 className="font-extrabold text-white uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" /> New Broadcast
          </h3>
          
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm">
                <option value="ANNOUNCEMENT">📢 General Announcement</option>
                <option value="FEATURE_UPDATE">✨ Feature Update</option>
                <option value="GOAL_ALERT">⚽ Goal Alert</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Alert title" className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">Message</label>
              <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Notification message body" className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">Linked Match (Optional)</label>
              <select value={matchId} onChange={(e) => setMatchId(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm">
                <option value="">None</option>
                {matches.map((m: any) => <option key={m.id} value={m.id}>{m.team_a?.name} vs {m.team_b?.name}</option>)}
              </select>
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-955 font-black rounded-xl text-xs">
              <Send className="w-4 h-4" /> Broadcast
            </button>
          </form>
        </div>

        <div className="xl:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6">
          <h3 className="font-extrabold text-white text-sm mb-4">Transmission History Logs</h3>
          <div className="space-y-3.5 max-h-[600px] overflow-y-auto">
            {notifications.map((notif: any) => (
              <div key={notif.id} className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-full">{notif.category}</span>
                  <h4 className="text-sm font-extrabold text-white mt-1.5">{notif.title}</h4>
                  <p className="text-xs text-slate-400">{notif.message}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {notif.status === 'SENT' ? (
                      <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-[10px] text-emerald-400">Sent</span></>
                    ) : (
                      <><Clock className="w-4 h-4 text-amber-500" /><span className="text-[10px] text-amber-500">Queue</span></>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm('Delete this notification log?')) {
                        deleteNotificationMutation.mutate(notif.id);
                      }
                    }}
                    className="p-1.5 bg-slate-950/60 hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
