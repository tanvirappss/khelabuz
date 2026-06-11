// Supabase Client wrapper with Mock Fallback for local preview & offline capability
import { createClient } from '@supabase/supabase-js';

// 48 FIFA World Cup 2026 Nations (with codes and flag CDN links)
const initialTeams = [
  // North America (Hosts & Qualifiers)
  { id: 't-usa', name: 'United States', code: 'USA', flag_url: 'https://flagcdn.com/w320/us.png', primary_color: '#002868', secondary_color: '#BF0A30' },
  { id: 't-mex', name: 'Mexico', code: 'MEX', flag_url: 'https://flagcdn.com/w320/mx.png', primary_color: '#006847', secondary_color: '#CE1126' },
  { id: 't-can', name: 'Canada', code: 'CAN', flag_url: 'https://flagcdn.com/w320/ca.png', primary_color: '#FF0000', secondary_color: '#FFFFFF' },
  // South America
  { id: 't-arg', name: 'Argentina', code: 'ARG', flag_url: 'https://flagcdn.com/w320/ar.png', primary_color: '#74ACDF', secondary_color: '#FFFFFF' },
  { id: 't-bra', name: 'Brazil', code: 'BRA', flag_url: 'https://flagcdn.com/w320/br.png', primary_color: '#FFDC02', secondary_color: '#009739' },
  { id: 't-uru', name: 'Uruguay', code: 'URU', flag_url: 'https://flagcdn.com/w320/uy.png', primary_color: '#007FFF', secondary_color: '#FFFFFF' },
  { id: 't-col', name: 'Colombia', code: 'COL', flag_url: 'https://flagcdn.com/w320/co.png', primary_color: '#FCD116', secondary_color: '#003893' },
  { id: 't-ecu', name: 'Ecuador', code: 'ECU', flag_url: 'https://flagcdn.com/w320/ec.png', primary_color: '#FFDD00', secondary_color: '#002E7A' },
  { id: 't-par', name: 'Paraguay', code: 'PAR', flag_url: 'https://flagcdn.com/w320/py.png', primary_color: '#D52B1E', secondary_color: '#0038A8' },
  { id: 't-chi', name: 'Chile', code: 'CHI', flag_url: 'https://flagcdn.com/w320/cl.png', primary_color: '#0039A6', secondary_color: '#D52B1E' },
  { id: 't-per', name: 'Peru', code: 'PER', flag_url: 'https://flagcdn.com/w320/pe.png', primary_color: '#D91414', secondary_color: '#FFFFFF' },
  { id: 't-ven', name: 'Venezuela', code: 'VEN', flag_url: 'https://flagcdn.com/w320/ve.png', primary_color: '#7B1829', secondary_color: '#FFCC00' },
  { id: 't-bol', name: 'Bolivia', code: 'BOL', flag_url: 'https://flagcdn.com/w320/bo.png', primary_color: '#007A33', secondary_color: '#F1E900' },
  // Europe
  { id: 't-ger', name: 'Germany', code: 'GER', flag_url: 'https://flagcdn.com/w320/de.png', primary_color: '#000000', secondary_color: '#FFCC00' },
  { id: 't-fra', name: 'France', code: 'FRA', flag_url: 'https://flagcdn.com/w320/fr.png', primary_color: '#002395', secondary_color: '#ED2939' },
  { id: 't-esp', name: 'Spain', code: 'ESP', flag_url: 'https://flagcdn.com/w320/es.png', primary_color: '#C60B1E', secondary_color: '#F1BF00' },
  { id: 't-eng', name: 'England', code: 'ENG', flag_url: 'https://flagcdn.com/w320/gb-eng.png', primary_color: '#FFFFFF', secondary_color: '#CE1126' },
  { id: 't-por', name: 'Portugal', code: 'POR', flag_url: 'https://flagcdn.com/w320/pt.png', primary_color: '#046A38', secondary_color: '#DA291C' },
  { id: 't-ita', name: 'Italy', code: 'ITA', flag_url: 'https://flagcdn.com/w320/it.png', primary_color: '#0066BC', secondary_color: '#FFFFFF' },
  { id: 't-bel', name: 'Belgium', code: 'BEL', flag_url: 'https://flagcdn.com/w320/be.png', primary_color: '#E30613', secondary_color: '#000000' },
  { id: 't-ned', name: 'Netherlands', code: 'NED', flag_url: 'https://flagcdn.com/w320/nl.png', primary_color: '#F36C21', secondary_color: '#FFFFFF' },
  { id: 't-cro', name: 'Croatia', code: 'CRO', flag_url: 'https://flagcdn.com/w320/hr.png', primary_color: '#FF0000', secondary_color: '#00205B' },
  { id: 't-sui', name: 'Switzerland', code: 'SUI', flag_url: 'https://flagcdn.com/w320/ch.png', primary_color: '#D52B1E', secondary_color: '#FFFFFF' },
  { id: 't-den', name: 'Denmark', code: 'DEN', flag_url: 'https://flagcdn.com/w320/dk.png', primary_color: '#C60C30', secondary_color: '#FFFFFF' },
  { id: 't-pol', name: 'Poland', code: 'POL', flag_url: 'https://flagcdn.com/w320/pl.png', primary_color: '#DC143C', secondary_color: '#FFFFFF' },
  { id: 't-tur', name: 'Turkey', code: 'TUR', flag_url: 'https://flagcdn.com/w320/tr.png', primary_color: '#E30A17', secondary_color: '#FFFFFF' },
  { id: 't-ukr', name: 'Ukraine', code: 'UKR', flag_url: 'https://flagcdn.com/w320/ua.png', primary_color: '#0057B7', secondary_color: '#FFDD00' },
  { id: 't-aut', name: 'Austria', code: 'AUT', flag_url: 'https://flagcdn.com/w320/at.png', primary_color: '#ED2939', secondary_color: '#FFFFFF' },
  { id: 't-sco', name: 'Scotland', code: 'SCO', flag_url: 'https://flagcdn.com/w320/gb-sct.png', primary_color: '#005EB8', secondary_color: '#FFFFFF' },
  { id: 't-wal', name: 'Wales', code: 'WAL', flag_url: 'https://flagcdn.com/w320/gb-wls.png', primary_color: '#A80532', secondary_color: '#00AD50' },
  { id: 't-swe', name: 'Sweden', code: 'SWE', flag_url: 'https://flagcdn.com/w320/se.png', primary_color: '#006AA7', secondary_color: '#FECC00' },
  { id: 't-hun', name: 'Hungary', code: 'HUN', flag_url: 'https://flagcdn.com/w320/hu.png', primary_color: '#CD2A3E', secondary_color: '#436F4D' },
  // Asia & Oceania
  { id: 't-jpn', name: 'Japan', code: 'JPN', flag_url: 'https://flagcdn.com/w320/jp.png', primary_color: '#0005A0', secondary_color: '#FFFFFF' },
  { id: 't-kor', name: 'South Korea', code: 'KOR', flag_url: 'https://flagcdn.com/w320/kr.png', primary_color: '#CD2E3A', secondary_color: '#0047A0' },
  { id: 't-aus', name: 'Australia', code: 'AUS', flag_url: 'https://flagcdn.com/w320/au.png', primary_color: '#00008B', secondary_color: '#FFCC00' },
  { id: 't-irn', name: 'Iran', code: 'IRN', flag_url: 'https://flagcdn.com/w320/ir.png', primary_color: '#239B56', secondary_color: '#DAF7A6' },
  { id: 't-sau', name: 'Saudi Arabia', code: 'KSA', flag_url: 'https://flagcdn.com/w320/sa.png', primary_color: '#006C35', secondary_color: '#FFFFFF' },
  { id: 't-qat', name: 'Qatar', code: 'QAT', flag_url: 'https://flagcdn.com/w320/qa.png', primary_color: '#8A1538', secondary_color: '#FFFFFF' },
  { id: 't-nzl', name: 'New Zealand', code: 'NZL', flag_url: 'https://flagcdn.com/w320/nz.png', primary_color: '#000000', secondary_color: '#FFFFFF' },
  // Africa
  { id: 't-mar', name: 'Morocco', code: 'MAR', flag_url: 'https://flagcdn.com/w320/ma.png', primary_color: '#C1272D', secondary_color: '#006233' },
  { id: 't-sen', name: 'Senegal', code: 'SEN', flag_url: 'https://flagcdn.com/w320/sn.png', primary_color: '#00853F', secondary_color: '#FDEF42' },
  { id: 't-nga', name: 'Nigeria', code: 'NGA', flag_url: 'https://flagcdn.com/w320/ng.png', primary_color: '#008751', secondary_color: '#FFFFFF' },
  { id: 't-egy', name: 'Egypt', code: 'EGY', flag_url: 'https://flagcdn.com/w320/eg.png', primary_color: '#C8102E', secondary_color: '#000000' },
  { id: 't-cmr', name: 'Cameroon', code: 'CMR', flag_url: 'https://flagcdn.com/w320/cm.png', primary_color: '#007A5E', secondary_color: '#FCD116' },
  { id: 't-gha', name: 'Ghana', code: 'GHA', flag_url: 'https://flagcdn.com/w320/gh.png', primary_color: '#DA121A', secondary_color: '#FCD116' },
  { id: 't-civ', name: 'Ivory Coast', code: 'CIV', flag_url: 'https://flagcdn.com/w320/ci.png', primary_color: '#FF8200', secondary_color: '#009E60' },
  { id: 't-alg', name: 'Algeria', code: 'ALG', flag_url: 'https://flagcdn.com/w320/dz.png', primary_color: '#006629', secondary_color: '#FFFFFF' },
  { id: 't-rsa', name: 'South Africa', code: 'RSA', flag_url: 'https://flagcdn.com/w320/za.png', primary_color: '#007A4D', secondary_color: '#E03C31' },
  { id: 't-cze', name: 'Czechia', code: 'CZE', flag_url: 'https://flagcdn.com/w320/cz.png', primary_color: '#11457E', secondary_color: '#D7141A' },
  { id: 't-bih', name: 'Bosnia and Herzegovina', code: 'BIH', flag_url: 'https://flagcdn.com/w320/ba.png', primary_color: '#002F6C', secondary_color: '#FEC524' },
  { id: 't-hai', name: 'Haiti', code: 'HAI', flag_url: 'https://flagcdn.com/w320/ht.png', primary_color: '#00209F', secondary_color: '#D21034' },
  { id: 't-cuw', name: 'Curaçao', code: 'CUW', flag_url: 'https://flagcdn.com/w320/cw.png', primary_color: '#002B7F', secondary_color: '#F9E814' },
  { id: 't-tun', name: 'Tunisia', code: 'TUN', flag_url: 'https://flagcdn.com/w320/tn.png', primary_color: '#E70013', secondary_color: '#FFFFFF' },
  { id: 't-cpv', name: 'Cape Verde', code: 'CPV', flag_url: 'https://flagcdn.com/w320/cv.png', primary_color: '#002A8F', secondary_color: '#D21034' },
  { id: 't-irq', name: 'Iraq', code: 'IRQ', flag_url: 'https://flagcdn.com/w320/iq.png', primary_color: '#C8102E', secondary_color: '#007A33' },
  { id: 't-jor', name: 'Jordan', code: 'JOR', flag_url: 'https://flagcdn.com/w320/jo.png', primary_color: '#007A33', secondary_color: '#C8102E' },
  { id: 't-cod', name: 'DR Congo', code: 'COD', flag_url: 'https://flagcdn.com/w320/cd.png', primary_color: '#007FFF', secondary_color: '#F9D616' },
  { id: 't-uzb', name: 'Uzbekistan', code: 'UZB', flag_url: 'https://flagcdn.com/w320/uz.png', primary_color: '#00A598', secondary_color: '#FFFFFF' },
  { id: 't-pan', name: 'Panama', code: 'PAN', flag_url: 'https://flagcdn.com/w320/pa.png', primary_color: '#DA121A', secondary_color: '#072357' }
];

export const newQualifiedTeams = [
  { id: 't-cze', name: 'Czechia', code: 'CZE', flag_url: 'https://flagcdn.com/w320/cz.png', primary_color: '#11457E', secondary_color: '#D7141A' },
  { id: 't-bih', name: 'Bosnia and Herzegovina', code: 'BIH', flag_url: 'https://flagcdn.com/w320/ba.png', primary_color: '#002F6C', secondary_color: '#FEC524' },
  { id: 't-hai', name: 'Haiti', code: 'HAI', flag_url: 'https://flagcdn.com/w320/ht.png', primary_color: '#00209F', secondary_color: '#D21034' },
  { id: 't-cuw', name: 'Curaçao', code: 'CUW', flag_url: 'https://flagcdn.com/w320/cw.png', primary_color: '#002B7F', secondary_color: '#F9E814' },
  { id: 't-tun', name: 'Tunisia', code: 'TUN', flag_url: 'https://flagcdn.com/w320/tn.png', primary_color: '#E70013', secondary_color: '#FFFFFF' },
  { id: 't-cpv', name: 'Cape Verde', code: 'CPV', flag_url: 'https://flagcdn.com/w320/cv.png', primary_color: '#002A8F', secondary_color: '#D21034' },
  { id: 't-irq', name: 'Iraq', code: 'IRQ', flag_url: 'https://flagcdn.com/w320/iq.png', primary_color: '#C8102E', secondary_color: '#007A33' },
  { id: 't-jor', name: 'Jordan', code: 'JOR', flag_url: 'https://flagcdn.com/w320/jo.png', primary_color: '#007A33', secondary_color: '#C8102E' },
  { id: 't-cod', name: 'DR Congo', code: 'COD', flag_url: 'https://flagcdn.com/w320/cd.png', primary_color: '#007FFF', secondary_color: '#F9D616' },
  { id: 't-uzb', name: 'Uzbekistan', code: 'UZB', flag_url: 'https://flagcdn.com/w320/uz.png', primary_color: '#00A598', secondary_color: '#FFFFFF' },
  { id: 't-pan', name: 'Panama', code: 'PAN', flag_url: 'https://flagcdn.com/w320/pa.png', primary_color: '#DA121A', secondary_color: '#072357' },
  { id: 't-nor', name: 'Norway', code: 'NOR', flag_url: 'https://flagcdn.com/w320/no.png', primary_color: '#BA0C2F', secondary_color: '#00205B' }
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfovxkppiygtenkbsmlc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmb3Z4a3BwaXlndGVua2JzbWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5ODc1OTAsImV4cCI6MjA5NjU2MzU5MH0.iDXhN5FSxIeAV8JyeFh4FQlg_nF85z42oNPRsBgMgqY';

export const isMockEnabled = !supabaseUrl || !supabaseAnonKey;

export const supabase = isMockEnabled 
  ? null 
  : createClient(supabaseUrl, supabaseAnonKey);

// Force clear old local storage mock databases to ensure the new 48-team database and live matches load correctly
if (typeof window !== 'undefined') {
  try {
    const storedTeamsStr = localStorage.getItem('wc_teams');
    if (storedTeamsStr) {
      const parsed = JSON.parse(storedTeamsStr);
      if (Array.isArray(parsed)) {
        if (parsed.length < 40) {
          localStorage.removeItem('wc_teams');
          localStorage.removeItem('wc_matches');
          localStorage.removeItem('wc_streams');
          localStorage.removeItem('wc_stats');
          localStorage.removeItem('wc_events');
          localStorage.removeItem('wc_providers');
          localStorage.removeItem('wc_ads');
          localStorage.removeItem('wc_notifications');
          localStorage.removeItem('wc_db_version');
        } else {
          // Revert accidental overrides in local storage
          let changed = false;
          const updated = parsed.map((t: any) => {
            const original = [...initialTeams, ...newQualifiedTeams].find(ot => ot.id === t.id);
            if (original && (t.name === 'Bangladesh' || t.name === 'admin' || t.name !== original.name || t.flag_url !== original.flag_url)) {
              changed = true;
              return {
                ...t,
                name: original.name,
                flag_url: original.flag_url
              };
            }
            return t;
          });
          if (changed) {
            localStorage.setItem('wc_teams', JSON.stringify(updated));
            localStorage.removeItem('wc_matches'); // force matches refetch
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse or clean mock db cache:', e);
  }

  // Inject Sports Stream M3U playlist if missing in local storage cache
  try {
    const storedStreamsStr = localStorage.getItem('wc_streams');
    if (storedStreamsStr) {
      const parsed = JSON.parse(storedStreamsStr);
      if (Array.isArray(parsed) && !parsed.some((s: any) => s.primary_url === '/sports_streams.m3u')) {
        parsed.push({ 
          id: 'c5da03f0-0002-4e3f-a94b-6004fae90002', 
          match_id: null, 
          name: 'Sports & Entertainment Stream', 
          primary_url: '/sports_streams.m3u', 
          backup_url_1: '', 
          backup_url_2: '', 
          backup_url_3: '', 
          is_enabled: true, 
          is_m3u: true 
        });
        localStorage.setItem('wc_streams', JSON.stringify(parsed));
      }
    }
  } catch (err) {
    console.error('Failed to inject sports playlist into cache:', err);
  }
}

const getStorageItem = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue;
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
};

const setStorageItem = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('storage'));
  }
};



// Matches: LIVE is now Germany vs France, FINISHED is Spain vs England, Argentina vs Brazil is UPCOMING
const initialMatches = [
  { id: 'b4c9f2f0-0001-4d2e-983f-5993efd80001', team_a_id: 't-esp', team_b_id: 't-eng', team_a_score: 2, team_b_score: 1, status: 'FINISHED', tournament: 'FIFA World Cup 2026', stadium: 'MetLife Stadium, East Rutherford', start_time: new Date(Date.now() - 10800000).toISOString() },
  { id: 'b4c9f2f0-0002-4d2e-983f-5993efd80002', team_a_id: 't-ger', team_b_id: 't-fra', team_a_score: 1, team_b_score: 0, status: 'LIVE', tournament: 'FIFA World Cup 2026', stadium: 'Azteca Stadium, Mexico City', start_time: new Date(Date.now() - 2700000).toISOString() },
  { id: 'b4c9f2f0-0003-4d2e-983f-5993efd80003', team_a_id: 't-arg', team_b_id: 't-bra', team_a_score: 0, team_b_score: 0, status: 'UPCOMING', tournament: 'FIFA World Cup 2026', stadium: 'BC Place, Vancouver', start_time: new Date(Date.now() + 86400000).toISOString() }
];

const initialStreams = [
  { id: 'c5da03f0-0001-4e3f-a94b-6004fae90001', match_id: 'b4c9f2f0-0002-4d2e-983f-5993efd80002', name: 'Main Stream (HLS)', primary_url: 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8', backup_url_1: 'https://demo.unified-streaming.com/k8s/live/stable/sintel.isml/.m3u8', backup_url_2: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8', backup_url_3: '', is_enabled: true },
  { id: 'c5da03f0-0002-4e3f-a94b-6004fae90002', match_id: null, name: 'Sports & Entertainment Stream', primary_url: '/sports_streams.m3u', backup_url_1: '', backup_url_2: '', backup_url_3: '', is_enabled: true, is_m3u: true }
];

const initialScoreUpdates = [
  { match_id: 'b4c9f2f0-0002-4d2e-983f-5993efd80002', possession_a: 54, possession_b: 46, shots_a: 8, shots_b: 6, corners_a: 4, corners_b: 2, yellow_cards_a: 1, yellow_cards_b: 1, red_cards_a: 0, red_cards_b: 0 }
];

const initialMatchEvents = [
  { id: 'd6eb14f0-0001-4f4a-b05c-7115fbf00001', match_id: 'b4c9f2f0-0002-4d2e-983f-5993efd80002', team_id: null, type: 'MATCH_START', minute: 0, extra_minute: null, player_in: null, player_out: null, detail: 'Kick-off! Match started' },
  { id: 'd6eb14f0-0002-4f4a-b05c-7115fbf00002', match_id: 'b4c9f2f0-0002-4d2e-983f-5993efd80002', team_id: 't-ger', type: 'GOAL', minute: 32, extra_minute: null, player_in: 'Thomas Muller', player_out: 'Jamal Musiala', detail: 'Slick combination finish inside the box' }
];

const initialApiProviders = [
  { id: 'e7fc25f0-0001-4f5b-c16d-8226fcf00001', name: 'SportsRadar API', url: 'https://api.sportradar.com/soccer/worldcup2026', api_key: 'mock-api-key-1', is_enabled: true, priority: 1, health_status: 'HEALTHY', response_time_ms: 145, last_sync_at: new Date().toISOString() }
];

const initialAdNetworks = [
  { id: 'f8fd36f0-0001-4f6c-d27e-9337fdf00001', name: 'AdSense', banner_script: '<div style="background:#0f172a;color:#10b981;border:1px solid #334155;padding:16px;text-align:center;border-radius:12px;font-weight:bold;">Google AdSense Banner Ad</div>', native_script: '', social_bar_script: '', header_script: '', footer_script: '', is_enabled: true }
];

const initialNotifications = [
  { id: '1', title: '⚽ GOAL! Germany vs France', message: 'Thomas Muller scored in the 32\' - Germany 1 - 0 France', category: 'GOAL_ALERT', match_id: 'b4c9f2f0-0002-4d2e-983f-5993efd80002', status: 'SENT', sent_at: new Date().toISOString(), created_at: new Date().toISOString() }
];

export const mockDb = {
  getTeams: () => getStorageItem('wc_teams', initialTeams),
  saveTeam: (team: any) => {
    const teams = getStorageItem('wc_teams', initialTeams);
    const index = teams.findIndex((t: any) => t.id === team.id);
    if (index >= 0) {
      teams[index] = { ...teams[index], ...team };
    } else {
      team.id = team.id || `t-${team.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      teams.push(team);
    }
    setStorageItem('wc_teams', teams);
    return team;
  },
  getSettings: () => getStorageItem('wc_site_settings', {
    header_logo: '',
    header_title: 'World Cup 2026',
    header_subtitle: 'Live Platform',
    ticker_text: 'Welcome to World Cup 2026 Live Platform! Enjoy real-time scores, schedules, and live streaming.'
  }),
  saveSettings: (settings: any) => {
    const current = mockDb.getSettings();
    const updated = { ...current, ...settings };
    setStorageItem('wc_site_settings', updated);
    return updated;
  },
  getMatches: () => {
    const matches = getStorageItem('wc_matches', initialMatches);
    const teams = mockDb.getTeams();
    return matches.map((m: any) => ({
      ...m,
      team_a: teams.find((t: any) => t.id === m.team_a_id),
      team_b: teams.find((t: any) => t.id === m.team_b_id)
    }));
  },
  saveMatch: (match: any) => {
    const matches = getStorageItem('wc_matches', initialMatches);
    const index = matches.findIndex((m: any) => m.id === match.id);
    if (index >= 0) {
      matches[index] = { ...matches[index], ...match, updated_at: new Date().toISOString() };
    } else {
      match.id = match.id || crypto.randomUUID();
      match.created_at = new Date().toISOString();
      match.updated_at = new Date().toISOString();
      matches.push(match);
      
      const stats = getStorageItem('wc_stats', initialScoreUpdates);
      stats.push({
        match_id: match.id,
        possession_a: 50, possession_b: 50,
        shots_a: 0, shots_b: 0,
        corners_a: 0, corners_b: 0,
        yellow_cards_a: 0, yellow_cards_b: 0,
        red_cards_a: 0, red_cards_b: 0
      });
      setStorageItem('wc_stats', stats);
    }
    setStorageItem('wc_matches', matches);
    return match;
  },
  deleteMatch: (id: string) => {
    const matches = getStorageItem('wc_matches', initialMatches).filter((m: any) => m.id !== id);
    setStorageItem('wc_matches', matches);
  },
  getStreams: () => getStorageItem('wc_streams', initialStreams),
  saveStream: (stream: any) => {
    const streams = getStorageItem('wc_streams', initialStreams);
    const index = streams.findIndex((s: any) => s.id === stream.id);
    if (index >= 0) {
      streams[index] = { ...streams[index], ...stream };
    } else {
      stream.id = stream.id || crypto.randomUUID();
      streams.push(stream);
    }
    setStorageItem('wc_streams', streams);
    return stream;
  },
  deleteStream: (id: string) => {
    const streams = getStorageItem('wc_streams', initialStreams).filter((s: any) => s.id !== id);
    setStorageItem('wc_streams', streams);
  },
  getStatsForMatch: (matchId: string) => {
    const stats = getStorageItem('wc_stats', initialScoreUpdates);
    return stats.find((s: any) => s.match_id === matchId) || {
      match_id: matchId, possession_a: 50, possession_b: 50,
      shots_a: 0, shots_b: 0, corners_a: 0, corners_b: 0,
      yellow_cards_a: 0, yellow_cards_b: 0, red_cards_a: 0, red_cards_b: 0
    };
  },
  saveStats: (stat: any) => {
    const stats = getStorageItem('wc_stats', initialScoreUpdates);
    const index = stats.findIndex((s: any) => s.match_id === stat.match_id);
    if (index >= 0) {
      stats[index] = { ...stats[index], ...stat };
    } else {
      stats.push(stat);
    }
    setStorageItem('wc_stats', stats);
    return stat;
  },
  getEvents: (matchId: string) => {
    const events = getStorageItem('wc_events', initialMatchEvents);
    const teams = mockDb.getTeams();
    return events
      .filter((e: any) => e.match_id === matchId)
      .map((e: any) => ({
        ...e,
        team: teams.find((t: any) => t.id === e.team_id)
      }))
      .sort((a: any, b: any) => a.minute - b.minute);
  },
  addEvent: (event: any) => {
    const events = getStorageItem('wc_events', initialMatchEvents);
    event.id = crypto.randomUUID();
    event.created_at = new Date().toISOString();
    events.push(event);
    setStorageItem('wc_events', events);

    if (event.type === 'GOAL' || event.type === 'PENALTY' || event.type === 'OWN_GOAL') {
      const matches = getStorageItem('wc_matches', initialMatches);
      const match = matches.find((m: any) => m.id === event.match_id);
      if (match) {
        if (event.type === 'OWN_GOAL') {
          if (event.team_id === match.team_a_id) match.team_b_score += 1;
          else match.team_a_score += 1;
        } else {
          if (event.team_id === match.team_a_id) match.team_a_score += 1;
          else match.team_b_score += 1;
        }
        setStorageItem('wc_matches', matches);
      }
    }
    return event;
  },
  getProviders: () => getStorageItem('wc_providers', initialApiProviders),
  saveProvider: (provider: any) => {
    const providers = getStorageItem('wc_providers', initialApiProviders);
    const index = providers.findIndex((p: any) => p.id === provider.id);
    if (index >= 0) {
      providers[index] = { ...providers[index], ...provider };
    } else {
      provider.id = provider.id || crypto.randomUUID();
      providers.push(provider);
    }
    setStorageItem('wc_providers', providers);
    return provider;
  },
  getAds: () => getStorageItem('wc_ads', initialAdNetworks),
  saveAds: (ad: any) => {
    const ads = getStorageItem('wc_ads', initialAdNetworks);
    const index = ads.findIndex((a: any) => a.id === ad.id);
    if (index >= 0) {
      ads[index] = { ...ads[index], ...ad, updated_at: new Date().toISOString() };
    } else {
      ad.id = ad.id || crypto.randomUUID();
      ad.updated_at = new Date().toISOString();
      ads.push(ad);
    }
    setStorageItem('wc_ads', ads);
    return ad;
  },
  getNotifications: () => getStorageItem('wc_notifications', initialNotifications),
  addNotification: (notif: any) => {
    const notifications = getStorageItem('wc_notifications', initialNotifications);
    notif.id = crypto.randomUUID();
    notif.created_at = new Date().toISOString();
    notif.sent_at = notif.status === 'SENT' ? new Date().toISOString() : null;
    notifications.unshift(notif);
    setStorageItem('wc_notifications', notifications);
    return notif;
  },
  deleteNotification: (id: string) => {
    const notifications = getStorageItem('wc_notifications', initialNotifications).filter((n: any) => n.id !== id);
    setStorageItem('wc_notifications', notifications);
  }
};



export function getWc2026GroupMatches() {
  const groups = [
    { id: 'A', name: 'Group A', teams: ['t-mex', 't-rsa', 't-kor', 't-cze'], venues: ['Estadio Azteca, Mexico City', 'Estadio Akron, Guadalajara', 'Estadio BBVA, Monterrey'] },
    { id: 'B', name: 'Group B', teams: ['t-can', 't-bih', 't-qat', 't-sui'], venues: ['BMO Field, Toronto', 'BC Place, Vancouver', 'Gillette Stadium, Foxborough'] },
    { id: 'C', name: 'Group C', teams: ['t-bra', 't-mar', 't-hai', 't-sco'], venues: ['MetLife Stadium, East Rutherford', 'Lincoln Financial Field, Philadelphia', 'Lumen Field, Seattle'] },
    { id: 'D', name: 'Group D', teams: ['t-usa', 't-par', 't-aus', 't-tur'], venues: ['SoFi Stadium, Los Angeles', 'Lumen Field, Seattle', 'Levi\'s Stadium, San Francisco'] },
    { id: 'E', name: 'Group E', teams: ['t-ger', 't-cuw', 't-civ', 't-ecu'], venues: ['Hard Rock Stadium, Miami', 'Mercedes-Benz Stadium, Atlanta', 'NRG Stadium, Houston'] },
    { id: 'F', name: 'Group F', teams: ['t-ned', 't-jpn', 't-swe', 't-tun'], venues: ['AT&T Stadium, Dallas', 'Arrowhead Stadium, Kansas City', 'NRG Stadium, Houston'] },
    { id: 'G', name: 'Group G', teams: ['t-bel', 't-egy', 't-irn', 't-nzl'], venues: ['Lincoln Financial Field, Philadelphia', 'Gillette Stadium, Foxborough', 'MetLife Stadium, East Rutherford'] },
    { id: 'H', name: 'Group H', teams: ['t-esp', 't-cpv', 't-sau', 't-uru'], venues: ['Hard Rock Stadium, Miami', 'Mercedes-Benz Stadium, Atlanta', 'NRG Stadium, Houston'] },
    { id: 'I', name: 'Group I', teams: ['t-fra', 't-sen', 't-irq', 't-nor'], venues: ['MetLife Stadium, East Rutherford', 'Gillette Stadium, Foxborough', 'Lincoln Financial Field, Philadelphia', 'BMO Field, Toronto'] },
    { id: 'J', name: 'Group J', teams: ['t-arg', 't-alg', 't-aut', 't-jor'], venues: ['MetLife Stadium, East Rutherford', 'AT&T Stadium, Dallas', 'Lincoln Financial Field, Philadelphia'] },
    { id: 'K', name: 'Group K', teams: ['t-por', 't-cod', 't-uzb', 't-col'], venues: ['Arrowhead Stadium, Kansas City', 'Levi\'s Stadium, San Francisco', 'SoFi Stadium, Los Angeles'] },
    { id: 'L', name: 'Group L', teams: ['t-eng', 't-cro', 't-gha', 't-pan'], venues: ['AT&T Stadium, Dallas', 'Hard Rock Stadium, Miami', 'Mercedes-Benz Stadium, Atlanta'] }
  ];

  const matches: any[] = [];
  groups.forEach((group, gIdx) => {
    const t = group.teams;
    
    if (group.id === 'I') {
      // Custom Group I authentic schedule from Google Search
      const customMatches = [
        {
          id: `match-g-I-0`,
          team_a_id: 't-fra',
          team_b_id: 't-sen',
          team_a_score: 0,
          team_b_score: 0,
          status: 'UPCOMING',
          tournament: 'FIFA World Cup 2026 - Group I',
          stadium: 'MetLife Stadium, East Rutherford',
          start_time: '2026-06-16T19:00:00Z' // 3:00 PM ET -> 1:00 AM BST June 17
        },
        {
          id: `match-g-I-1`,
          team_a_id: 't-irq',
          team_b_id: 't-nor',
          team_a_score: 0,
          team_b_score: 0,
          status: 'UPCOMING',
          tournament: 'FIFA World Cup 2026 - Group I',
          stadium: 'Gillette Stadium, Foxborough',
          start_time: '2026-06-16T22:00:00Z' // 6:00 PM ET -> 4:00 AM BST June 17
        },
        {
          id: `match-g-I-2`,
          team_a_id: 't-fra',
          team_b_id: 't-irq',
          team_a_score: 0,
          team_b_score: 0,
          status: 'UPCOMING',
          tournament: 'FIFA World Cup 2026 - Group I',
          stadium: 'Lincoln Financial Field, Philadelphia',
          start_time: '2026-06-22T21:00:00Z' // 5:00 PM ET -> 3:00 AM BST June 23
        },
        {
          id: `match-g-I-3`,
          team_a_id: 't-nor',
          team_b_id: 't-sen',
          team_a_score: 0,
          team_b_score: 0,
          status: 'UPCOMING',
          tournament: 'FIFA World Cup 2026 - Group I',
          stadium: 'MetLife Stadium, East Rutherford',
          start_time: '2026-06-23T00:00:00Z' // 8:00 PM ET -> 6:00 AM BST June 23
        },
        {
          id: `match-g-I-4`,
          team_a_id: 't-nor',
          team_b_id: 't-fra',
          team_a_score: 0,
          team_b_score: 0,
          status: 'UPCOMING',
          tournament: 'FIFA World Cup 2026 - Group I',
          stadium: 'Gillette Stadium, Foxborough',
          start_time: '2026-06-26T19:00:00Z' // 3:00 PM ET -> 1:00 AM BST June 27
        },
        {
          id: `match-g-I-5`,
          team_a_id: 't-sen',
          team_b_id: 't-irq',
          team_a_score: 0,
          team_b_score: 0,
          status: 'UPCOMING',
          tournament: 'FIFA World Cup 2026 - Group I',
          stadium: 'BMO Field, Toronto',
          start_time: '2026-06-26T19:00:00Z' // 3:00 PM ET -> 1:00 AM BST June 27
        }
      ];
      matches.push(...customMatches);
      return;
    }

    const pairings = [
      { a: t[0], b: t[1], dayOffset: 0, hour: 17, stadium: group.venues[0] }, // Matchday 1
      { a: t[2], b: t[3], dayOffset: 0, hour: 20, stadium: group.venues[1] },
      { a: t[0], b: t[2], dayOffset: 6, hour: 17, stadium: group.venues[2] }, // Matchday 2
      { a: t[1], b: t[3], dayOffset: 6, hour: 20, stadium: group.venues[0] },
      { a: t[0], b: t[3], dayOffset: 12, hour: 23, stadium: group.venues[1] }, // Matchday 3
      { a: t[1], b: t[2], dayOffset: 12, hour: 2, stadium: group.venues[2] }
    ];

    pairings.forEach((p, pIdx) => {
      const groupStartDay = gIdx % 6; // spread across day 0 to 5
      const day = 11 + groupStartDay + p.dayOffset;
      const dateStr = `2026-06-${day.toString().padStart(2, '0')}T${p.hour.toString().padStart(2, '0')}:00:00Z`;

      matches.push({
        id: `match-g-${group.id}-${pIdx}`,
        team_a_id: p.a,
        team_b_id: p.b,
        team_a_score: 0,
        team_b_score: 0,
        status: 'UPCOMING',
        tournament: `FIFA World Cup 2026 - Group ${group.id}`,
        stadium: p.stadium,
        start_time: dateStr
      });
    });
  });

  matches.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  return matches;
}

export async function syncLocalStorageToSupabase() {
  if (typeof window === 'undefined' || window.location.hostname !== 'localhost') return;
  if (isMockEnabled) return;
  
  const { supabase } = await import('@/lib/supabase');
  if (!supabase) return;

  console.log("Checking for local modifications to sync with Supabase...");

  try {
    // 1. Sync Teams
    const localTeams = localStorage.getItem('wc_teams');
    if (localTeams) {
      const teams = JSON.parse(localTeams);
      if (Array.isArray(teams) && teams.length > 0) {
        console.log(`Syncing ${teams.length} teams...`);
        for (const team of teams) {
          await supabase.from('teams').upsert({
            id: team.id,
            name: team.name,
            code: team.code,
            flag_url: team.flag_url,
            primary_color: team.primary_color,
            secondary_color: team.secondary_color
          });
        }
      }
    }

    // 2. Sync Matches
    const localMatches = localStorage.getItem('wc_matches');
    if (localMatches) {
      const matches = JSON.parse(localMatches);
      if (Array.isArray(matches) && matches.length > 0) {
        console.log(`Syncing ${matches.length} matches...`);
        for (const match of matches) {
          await supabase.from('matches').upsert({
            id: match.id,
            team_a_id: match.team_a_id,
            team_b_id: match.team_b_id,
            team_a_score: match.team_a_score,
            team_b_score: match.team_b_score,
            status: match.status,
            tournament: match.tournament,
            stadium: match.stadium,
            start_time: match.start_time
          });
        }
      }
    }

    // 3. Sync Streams
    const localStreams = localStorage.getItem('wc_streams');
    if (localStreams) {
      const streams = JSON.parse(localStreams);
      if (Array.isArray(streams) && streams.length > 0) {
        console.log(`Syncing ${streams.length} streams...`);
        for (const stream of streams) {
          await supabase.from('streams').upsert({
            id: stream.id,
            match_id: stream.match_id,
            name: stream.name,
            primary_url: stream.primary_url,
            backup_url_1: stream.backup_url_1,
            backup_url_2: stream.backup_url_2,
            backup_url_3: stream.backup_url_3,
            is_enabled: stream.is_enabled,
            is_m3u: stream.is_m3u || false
          });
        }
      }
    }

    // 4. Sync Settings
    const localSettings = localStorage.getItem('wc_site_settings');
    if (localSettings) {
      const settings = JSON.parse(localSettings);
      if (settings && typeof settings === 'object') {
        console.log("Syncing site settings...");
        await supabase.from('site_settings').upsert({
          id: 1,
          header_logo: settings.header_logo,
          header_title: settings.header_title,
          header_subtitle: settings.header_subtitle,
          ticker_text: settings.ticker_text
        });
      }
    }

    console.log("Local modifications synced with Supabase successfully!");
  } catch (e) {
    console.error("Failed to sync local storage modifications to Supabase:", e);
  }
}
