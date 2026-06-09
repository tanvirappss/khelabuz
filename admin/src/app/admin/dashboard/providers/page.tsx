'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDb, isMockEnabled } from '@/lib/supabase';
import { Server, Settings, CheckCircle, XCircle, AlertCircle, RefreshCw, Plus, Wifi, Terminal } from 'lucide-react';

export default function ProvidersPage() {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Forms
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [priority, setPriority] = useState(1);
  const [isEnabled, setIsEnabled] = useState(false);

  // Queries
  const { data: providers = [], refetch: refetchProviders } = useQuery({
    queryKey: ['providers_relocated'],
    queryFn: async () => {
      if (isMockEnabled) return mockDb.getProviders();
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('api_providers').select('*').order('priority');
        if (error) throw error;
        return data;
      }
      return [];
    }
  });

  const saveProviderMutation = useMutation({
    mutationFn: async (providerData: any) => {
      if (isMockEnabled) return mockDb.saveProvider(providerData);
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('api_providers').upsert(providerData).select();
        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers_relocated'] });
      refetchProviders();
      setIsModalOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setSelectedProvider(null);
    setName('');
    setUrl('');
    setApiKey('');
    setPriority(1);
    setIsEnabled(false);
  };

  const handleOpenEdit = (prov: any) => {
    setSelectedProvider(prov);
    setName(prov.name);
    setUrl(prov.url);
    setApiKey(prov.api_key || '');
    setPriority(prov.priority);
    setIsEnabled(prov.is_enabled);
    setIsModalOpen(true);
  };

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    saveProviderMutation.mutate({
      id: selectedProvider?.id || undefined,
      name,
      url,
      api_key: apiKey || null,
      priority,
      is_enabled: isEnabled,
      health_status: selectedProvider?.health_status || 'UNKNOWN',
      response_time_ms: selectedProvider?.response_time_ms || 0
    });
  };

  const handleToggleEnable = (prov: any) => {
    saveProviderMutation.mutate({
      ...prov,
      is_enabled: !prov.is_enabled
    });
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('Synchronized successfully!');
    }, 1000);
  };

  const errorLogs = [
    { time: '2026-06-08 14:23:11', provider: 'Football-Data.org', type: 'TIMEOUT', msg: 'Gateway timeout from provider server.' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Score Feed Providers</h1>
          <p className="text-slate-400 text-sm">Manage API keys and monitor failovers.</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={handleSyncNow} disabled={isSyncing} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all">
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Feeds
          </button>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow">
            <Plus className="w-4 h-4" /> Add Provider
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Provider</th>
                    <th className="pb-3">Health</th>
                    <th className="pb-3">Latency</th>
                    <th className="pb-3">Priority</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50">
                  {providers.map((prov: any) => (
                    <tr key={prov.id} className="hover:bg-slate-950/20 transition-all">
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 bg-slate-950/60 rounded-xl border ${prov.is_enabled ? 'border-emerald-500/20 text-emerald-400' : 'border-slate-800 text-slate-600'}`}>
                            <Server className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-white text-sm block">{prov.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate max-w-xs">{prov.url}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          {prov.health_status === 'HEALTHY' ? (
                            <><CheckCircle className="w-4 h-4 text-emerald-400" /><span className="font-bold text-emerald-400">Healthy</span></>
                          ) : (
                            <><XCircle className="w-4 h-4 text-rose-400" /><span className="font-bold text-rose-400">Degraded</span></>
                          )}
                        </div>
                      </td>
                      <td className="py-4 font-mono text-slate-300 font-bold">{prov.response_time_ms > 0 ? `${prov.response_time_ms}ms` : '—'}</td>
                      <td className="py-4"><span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-extrabold text-[10px] text-slate-300">P{prov.priority}</span></td>
                      <td className="py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleToggleEnable(prov)} className={`px-2.5 py-1 text-[10px] font-black rounded-lg ${prov.is_enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>{prov.is_enabled ? 'Enabled' : 'Disabled'}</button>
                          <button onClick={() => handleOpenEdit(prov)} className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg"><Settings className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 flex flex-col justify-between h-full">
            <div>
              <h3 className="font-extrabold text-white uppercase tracking-wider text-sm flex items-center gap-2">Console</h3>
              <div className="mt-4 space-y-3 font-mono text-[10px]">
                {errorLogs.map((log, i) => (
                  <div key={i} className="bg-slate-950/80 border border-slate-850 p-3 rounded-xl">
                    <div className="flex justify-between font-bold"><span className="text-rose-400">[{log.type}]</span><span className="text-slate-500">{log.time}</span></div>
                    <p className="text-slate-400 mt-1">{log.msg}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 border-t border-slate-900 pt-4">
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex gap-3">
                <Wifi className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="text-[10px] text-slate-400"><span className="text-xs font-extrabold text-emerald-400 block uppercase">Auto Failover Active</span>Failover resolves sync feeds within 2 seconds.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 relative">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4">Save Feed Provider</h2>
            <form onSubmit={handleSaveProvider} className="space-y-4">
              <input type="text" placeholder="Provider Name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
              <input type="url" placeholder="API Endpoint" value={url} onChange={(e) => setUrl(e.target.value)} required className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
              <input type="password" placeholder="Access Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm" />
              <div className="grid grid-cols-2 gap-4">
                <select value={priority} onChange={(e) => setPriority(parseInt(e.target.value))} className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm">
                  <option value={1}>Primary</option>
                  <option value={2}>Secondary</option>
                </select>
                <select value={isEnabled ? 'true' : 'false'} onChange={(e) => setIsEnabled(e.target.value === 'true')} className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm">
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 bg-slate-950 border border-slate-850 text-slate-400 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
