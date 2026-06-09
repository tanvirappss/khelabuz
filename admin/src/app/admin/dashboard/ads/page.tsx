'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDb, isMockEnabled } from '@/lib/supabase';
import { ToggleLeft, ToggleRight, Save, HelpCircle } from 'lucide-react';

export default function AdsManagerPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'adsense' | 'adsterra'>('adsense');

  // Queries
  const { data: ads = [], refetch: refetchAds } = useQuery({
    queryKey: ['ads_relocated'],
    queryFn: async () => {
      if (isMockEnabled) return mockDb.getAds();
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('ad_networks').select('*');
        if (error) throw error;
        return data;
      }
      return [];
    }
  });

  const saveAdsMutation = useMutation({
    mutationFn: async (adData: any) => {
      if (isMockEnabled) return mockDb.saveAds(adData);
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('ad_networks').upsert(adData).select();
        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads_relocated'] });
      refetchAds();
      alert('Ad scripts updated successfully!');
    }
  });

  const adsense = ads.find((a: any) => a.name.toLowerCase() === 'adsense') || {
    name: 'AdSense', banner_script: '', header_script: '', footer_script: '', is_enabled: false
  };

  const adsterra = ads.find((a: any) => a.name.toLowerCase() === 'adsterra') || {
    name: 'Adsterra', banner_script: '', native_script: '', social_bar_script: '', header_script: '', is_enabled: false
  };

  // Forms
  const [adsenseHeader, setAdsenseHeader] = useState('');
  const [adsenseBanner, setAdsenseBanner] = useState('');
  const [adsenseFooter, setAdsenseFooter] = useState('');

  const [adsterraBanner, setAdsterraBanner] = useState('');
  const [adsterraNative, setAdsterraNative] = useState('');
  const [adsterraSocial, setAdsterraSocial] = useState('');
  const [adsterraHeader, setAdsterraHeader] = useState('');

  React.useEffect(() => {
    if (ads.length > 0) {
      setAdsenseHeader(adsense.header_script || '');
      setAdsenseBanner(adsense.banner_script || '');
      setAdsenseFooter(adsense.footer_script || '');

      setAdsterraBanner(adsterra.banner_script || '');
      setAdsterraNative(adsterra.native_script || '');
      setAdsterraSocial(adsterra.social_bar_script || '');
      setAdsterraHeader(adsterra.header_script || '');
    }
  }, [ads]);

  const handleSaveAdsense = (e: React.FormEvent) => {
    e.preventDefault();
    saveAdsMutation.mutate({
      id: adsense.id || undefined,
      name: 'AdSense',
      header_script: adsenseHeader,
      banner_script: adsenseBanner,
      footer_script: adsenseFooter,
      is_enabled: adsense.is_enabled
    });
  };

  const handleSaveAdsterra = (e: React.FormEvent) => {
    e.preventDefault();
    saveAdsMutation.mutate({
      id: adsterra.id || undefined,
      name: 'Adsterra',
      banner_script: adsterraBanner,
      native_script: adsterraNative,
      social_bar_script: adsterraSocial,
      header_script: adsterraHeader,
      is_enabled: adsterra.is_enabled
    });
  };

  const handleToggleEnable = (network: any) => {
    saveAdsMutation.mutate({
      ...network,
      is_enabled: !network.is_enabled
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Earnings Dashboard</h1>
          <p className="text-slate-400 text-sm">Deploy Google AdSense and Adsterra scripts instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-2.5">
          <button onClick={() => setActiveTab('adsense')} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider border ${activeTab === 'adsense' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-950/20 border-transparent text-slate-400'}`}>
            <span>Google AdSense</span>
            <span className={`w-2.5 h-2.5 rounded-full ${adsense.is_enabled ? 'bg-emerald-400' : 'bg-slate-700'}`} />
          </button>
          <button onClick={() => setActiveTab('adsterra')} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider border ${activeTab === 'adsterra' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-950/20 border-transparent text-slate-400'}`}>
            <span>Adsterra Network</span>
            <span className={`w-2.5 h-2.5 rounded-full ${adsterra.is_enabled ? 'bg-emerald-400' : 'bg-slate-700'}`} />
          </button>
          
          <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><HelpCircle className="w-4 h-4 text-emerald-400" />Developer Tip</h4>
            <p className="text-[10px] text-slate-400">Scripts load dynamically inside client WebViews without requiring an app store update.</p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6">
          {activeTab === 'adsense' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                <div>
                  <h3 className="font-extrabold text-white text-sm">Google AdSense</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Edit AdSense placements.</p>
                </div>
                <button onClick={() => handleToggleEnable(adsense)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${adsense.is_enabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-955 border-slate-850 text-slate-500'}`}>
                  {adsense.is_enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{adsense.is_enabled ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>

              <form onSubmit={handleSaveAdsense} className="space-y-5">
                <textarea rows={3} value={adsenseHeader} onChange={(e) => setAdsenseHeader(e.target.value)} placeholder="Header scripts..." className="w-full bg-slate-955 border border-slate-850 rounded-xl p-3 text-xs font-mono" />
                <textarea rows={3} value={adsenseBanner} onChange={(e) => setAdsenseBanner(e.target.value)} placeholder="Banner scripts..." className="w-full bg-slate-955 border border-slate-850 rounded-xl p-3 text-xs font-mono" />
                <button type="submit" className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs"><Save className="w-4 h-4" /> Save</button>
              </form>
            </div>
          )}

          {activeTab === 'adsterra' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                <div>
                  <h3 className="font-extrabold text-white text-sm">Adsterra Network</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Configure Adsterra codes.</p>
                </div>
                <button onClick={() => handleToggleEnable(adsterra)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${adsterra.is_enabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-955 border-slate-850 text-slate-500'}`}>
                  {adsterra.is_enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{adsterra.is_enabled ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>

              <form onSubmit={handleSaveAdsterra} className="space-y-5">
                <textarea rows={3} value={adsterraHeader} onChange={(e) => setAdsterraHeader(e.target.value)} placeholder="Header script..." className="w-full bg-slate-955 border border-slate-850 rounded-xl p-3 text-xs font-mono" />
                <textarea rows={3} value={adsterraBanner} onChange={(e) => setAdsterraBanner(e.target.value)} placeholder="Banner script..." className="w-full bg-slate-955 border border-slate-850 rounded-xl p-3 text-xs font-mono" />
                <button type="submit" className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs"><Save className="w-4 h-4" /> Save</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
