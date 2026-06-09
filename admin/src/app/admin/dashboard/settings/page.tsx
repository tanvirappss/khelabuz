'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDb, isMockEnabled } from '@/lib/supabase';
import { Upload, Trash2, Image, Type, Save, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const [logoUrl, setLogoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tickerText, setTickerText] = useState('');

  // Fetch site settings
  const { data: settings = { header_logo: '', header_title: 'World Cup 2026', header_subtitle: 'Live Platform', ticker_text: '' }, isLoading } = useQuery({
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
    }
  });

  // Populate state on load
  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.header_logo || '');
      setTitle(settings.header_title || 'World Cup 2026');
      setSubtitle(settings.header_subtitle || 'Live Platform');
      setTickerText(settings.ticker_text || 'Welcome to World Cup 2026 Live Platform! Enjoy real-time scores, schedules, and live streaming.');
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      if (isMockEnabled) return mockDb.saveSettings(updatedData);
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { error } = await supabase.from('site_settings').upsert({ id: 1, ...updatedData });
        if (error) {
          return mockDb.saveSettings(updatedData);
        }
        return updatedData;
      }
      return mockDb.saveSettings(updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_settings'] });
      alert("Settings saved successfully!");
    }
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate({
      header_logo: logoUrl,
      header_title: title,
      header_subtitle: subtitle,
      ticker_text: tickerText
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wider">Site Settings</h1>
        <p className="text-slate-400 text-sm">Customize the website header branding, title, and live scrolling ticker news.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Header Logo Upload */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Image className="w-4 h-4 text-emerald-400" />
            Website Logo & Branding
          </h3>
          <p className="text-xs text-slate-400">Upload an image file (Base64) or input a direct URL. Removing it falls back to the default trophy icon.</p>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {logoUrl ? (
                <img src={logoUrl} alt="Branding Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-slate-600 text-xs font-black uppercase tracking-wider">No Logo</span>
              )}
            </div>

            <div className="w-full space-y-3">
              <div className="flex flex-wrap gap-2.5">
                <label className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-350 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Image
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="px-4 py-2 bg-rose-500/10 border border-rose-500/25 hover:border-rose-500/50 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Logo
                  </button>
                )}
              </div>

              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Or paste direct image URL (https://...)"
                className="w-full bg-slate-950 border border-slate-855 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Header Branding Text */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Type className="w-4 h-4 text-emerald-400" />
            Branding Header Text
          </h3>
          <p className="text-xs text-slate-400">Edit the title and subtitle shown in the header of the user website.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">Header Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="World Cup 2026"
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">Header Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Live Platform"
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-sm text-white"
              />
            </div>
          </div>
        </div>

        {/* Ticker Headline Text */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Scrolling News Ticker Text
          </h3>
          <p className="text-xs text-slate-400">Enter custom news text that scrolls continuously below the main website header.</p>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold">Ticker Headline Text</label>
            <textarea
              value={tickerText}
              onChange={(e) => setTickerText(e.target.value)}
              placeholder="Enter news updates or alert messages..."
              rows={3}
              required
              className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none resize-none transition-all"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saveSettingsMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
