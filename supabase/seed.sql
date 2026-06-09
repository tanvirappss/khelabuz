-- Seed Data for World Cup 2026 Live Football Streaming & Score Application

-- 1. Seed 48 Teams
INSERT INTO public.teams (id, name, code, flag_url, primary_color, secondary_color) VALUES
('t-usa', 'United States', 'USA', 'https://flagcdn.com/w320/us.png', '#002868', '#BF0A30'),
('t-mex', 'Mexico', 'MEX', 'https://flagcdn.com/w320/mx.png', '#006847', '#CE1126'),
('t-can', 'Canada', 'CAN', 'https://flagcdn.com/w320/ca.png', '#FF0000', '#FFFFFF'),
('t-arg', 'Argentina', 'ARG', 'https://flagcdn.com/w320/ar.png', '#74ACDF', '#FFFFFF'),
('t-bra', 'Brazil', 'BRA', 'https://flagcdn.com/w320/br.png', '#FFDC02', '#009739'),
('t-uru', 'Uruguay', 'URU', 'https://flagcdn.com/w320/uy.png', '#007FFF', '#FFFFFF'),
('t-col', 'Colombia', 'COL', 'https://flagcdn.com/w320/co.png', '#FCD116', '#003893'),
('t-ecu', 'Ecuador', 'ECU', 'https://flagcdn.com/w320/ec.png', '#FFDD00', '#002E7A'),
('t-par', 'Paraguay', 'PAR', 'https://flagcdn.com/w320/py.png', '#D52B1E', '#0038A8'),
('t-chi', 'Chile', 'CHI', 'https://flagcdn.com/w320/cl.png', '#0039A6', '#D52B1E'),
('t-per', 'Peru', 'PER', 'https://flagcdn.com/w320/pe.png', '#D91414', '#FFFFFF'),
('t-ven', 'Venezuela', 'VEN', 'https://flagcdn.com/w320/ve.png', '#7B1829', '#FFCC00'),
('t-bol', 'Bolivia', 'BOL', 'https://flagcdn.com/w320/bo.png', '#007A33', '#F1E900'),
('t-ger', 'Germany', 'GER', 'https://flagcdn.com/w320/de.png', '#000000', '#FFCC00'),
('t-fra', 'France', 'FRA', 'https://flagcdn.com/w320/fr.png', '#002395', '#ED2939'),
('t-esp', 'Spain', 'ESP', 'https://flagcdn.com/w320/es.png', '#C60B1E', '#F1BF00'),
('t-eng', 'England', 'ENG', 'https://flagcdn.com/w320/gb-eng.png', '#FFFFFF', '#CE1126'),
('t-por', 'Portugal', 'POR', 'https://flagcdn.com/w320/pt.png', '#046A38', '#DA291C'),
('t-ita', 'Italy', 'ITA', 'https://flagcdn.com/w320/it.png', '#0066BC', '#FFFFFF'),
('t-bel', 'Belgium', 'BEL', 'https://flagcdn.com/w320/be.png', '#E30613', '#000000'),
('t-ned', 'Netherlands', 'NED', 'https://flagcdn.com/w320/nl.png', '#F36C21', '#FFFFFF'),
('t-cro', 'Croatia', 'CRO', 'https://flagcdn.com/w320/hr.png', '#FF0000', '#00205B'),
('t-sui', 'Switzerland', 'SUI', 'https://flagcdn.com/w320/ch.png', '#D52B1E', '#FFFFFF'),
('t-den', 'Denmark', 'DEN', 'https://flagcdn.com/w320/dk.png', '#C60C30', '#FFFFFF'),
('t-pol', 'Poland', 'POL', 'https://flagcdn.com/w320/pl.png', '#DC143C', '#FFFFFF'),
('t-tur', 'Turkey', 'TUR', 'https://flagcdn.com/w320/tr.png', '#E30A17', '#FFFFFF'),
('t-ukr', 'Ukraine', 'UKR', 'https://flagcdn.com/w320/ua.png', '#0057B7', '#FFDD00'),
('t-aut', 'Austria', 'AUT', 'https://flagcdn.com/w320/at.png', '#ED2939', '#FFFFFF'),
('t-sco', 'Scotland', 'SCO', 'https://flagcdn.com/w320/gb-sct.png', '#005EB8', '#FFFFFF'),
('t-wal', 'Wales', 'WAL', 'https://flagcdn.com/w320/gb-wls.png', '#A80532', '#00AD50'),
('t-swe', 'Sweden', 'SWE', 'https://flagcdn.com/w320/se.png', '#006AA7', '#FECC00'),
('t-hun', 'Hungary', 'HUN', 'https://flagcdn.com/w320/hu.png', '#CD2A3E', '#436F4D'),
('t-jpn', 'Japan', 'JPN', 'https://flagcdn.com/w320/jp.png', '#0005A0', '#FFFFFF'),
('t-kor', 'South Korea', 'KOR', 'https://flagcdn.com/w320/kr.png', '#CD2E3A', '#0047A0'),
('t-aus', 'Australia', 'AUS', 'https://flagcdn.com/w320/au.png', '#00008B', '#FFCC00'),
('t-irn', 'Iran', 'IRN', 'https://flagcdn.com/w320/ir.png', '#239B56', '#DAF7A6'),
('t-sau', 'Saudi Arabia', 'KSA', 'https://flagcdn.com/w320/sa.png', '#006C35', '#FFFFFF'),
('t-qat', 'Qatar', 'QAT', 'https://flagcdn.com/w320/qa.png', '#8A1538', '#FFFFFF'),
('t-nzl', 'New Zealand', 'NZL', 'https://flagcdn.com/w320/nz.png', '#000000', '#FFFFFF'),
('t-mar', 'Morocco', 'MAR', 'https://flagcdn.com/w320/ma.png', '#C1272D', '#006233'),
('t-sen', 'Senegal', 'SEN', 'https://flagcdn.com/w320/sn.png', '#00853F', '#FDEF42'),
('t-nga', 'Nigeria', 'NGA', 'https://flagcdn.com/w320/ng.png', '#008751', '#FFFFFF'),
('t-egy', 'Egypt', 'EGY', 'https://flagcdn.com/w320/eg.png', '#C8102E', '#000000'),
('t-cmr', 'Cameroon', 'CMR', 'https://flagcdn.com/w320/cm.png', '#007A5E', '#FCD116'),
('t-gha', 'Ghana', 'GHA', 'https://flagcdn.com/w320/gh.png', '#DA121A', '#FCD116'),
('t-civ', 'Ivory Coast', 'CIV', 'https://flagcdn.com/w320/ci.png', '#FF8200', '#009E60'),
('t-alg', 'Algeria', 'ALG', 'https://flagcdn.com/w320/dz.png', '#006629', '#FFFFFF'),
('t-rsa', 'South Africa', 'RSA', 'https://flagcdn.com/w320/za.png', '#007A4D', '#E03C31'),
('t-cze', 'Czechia', 'CZE', 'https://flagcdn.com/w320/cz.png', '#11457E', '#D7141A'),
('t-bih', 'Bosnia and Herzegovina', 'BIH', 'https://flagcdn.com/w320/ba.png', '#002F6C', '#FEC524'),
('t-hai', 'Haiti', 'HAI', 'https://flagcdn.com/w320/ht.png', '#00209F', '#D21034'),
('t-cuw', 'Curaçao', 'CUW', 'https://flagcdn.com/w320/cw.png', '#002B7F', '#F9E814'),
('t-tun', 'Tunisia', 'TUN', 'https://flagcdn.com/w320/tn.png', '#E70013', '#FFFFFF'),
('t-cpv', 'Cape Verde', 'CPV', 'https://flagcdn.com/w320/cv.png', '#002A8F', '#D21034'),
('t-irq', 'Iraq', 'IRQ', 'https://flagcdn.com/w320/iq.png', '#C8102E', '#007A33'),
('t-jor', 'Jordan', 'JOR', 'https://flagcdn.com/w320/jo.png', '#007A33', '#C8102E'),
('t-cod', 'DR Congo', 'COD', 'https://flagcdn.com/w320/cd.png', '#007FFF', '#F9D616'),
('t-uzb', 'Uzbekistan', 'UZB', 'https://flagcdn.com/w320/uz.png', '#00A598', '#FFFFFF'),
('t-pan', 'Panama', 'PAN', 'https://flagcdn.com/w320/pa.png', '#DA121A', '#072357')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Matches (LIVE: Germany vs France, FINISHED: Spain vs England, UPCOMING: Argentina vs Brazil)
INSERT INTO public.matches (id, team_a_id, team_b_id, team_a_score, team_b_score, status, tournament, stadium, start_time) VALUES
('b4c9f2f0-0001-4d2e-983f-5993efd80001', 't-esp', 't-eng', 2, 1, 'FINISHED', 'FIFA World Cup 2026', 'MetLife Stadium, East Rutherford', now() - interval '3 hours'),
('b4c9f2f0-0002-4d2e-983f-5993efd80002', 't-ger', 't-fra', 1, 0, 'LIVE', 'FIFA World Cup 2026', 'Azteca Stadium, Mexico City', now() - interval '45 minutes'),
('b4c9f2f0-0003-4d2e-983f-5993efd80003', 't-arg', 't-bra', 0, 0, 'UPCOMING', 'FIFA World Cup 2026', 'BC Place, Vancouver', now() + interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Streams (For Live Match: Germany vs France)
INSERT INTO public.streams (id, match_id, name, primary_url, backup_url_1, backup_url_2, backup_url_3, is_enabled) VALUES
('c5da03f0-0001-4e3f-a94b-6004fae90001', 'b4c9f2f0-0002-4d2e-983f-5993efd80002', 'Main Stream (HLS)', 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8', 'https://demo.unified-streaming.com/k8s/live/stable/sintel.isml/.m3u8', 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Live Match Stats (For Live Match: Germany vs France)
INSERT INTO public.score_updates (match_id, possession_a, possession_b, shots_a, shots_b, corners_a, corners_b, yellow_cards_a, yellow_cards_b, red_cards_a, red_cards_b, updated_at) VALUES
('b4c9f2f0-0002-4d2e-983f-5993efd80002', 54, 46, 8, 6, 4, 2, 1, 1, 0, 0, now())
ON CONFLICT (match_id) DO UPDATE SET updated_at = now();

-- 5. Seed Match Events (For Live Match: Germany vs France)
INSERT INTO public.match_events (id, match_id, team_id, type, minute, extra_minute, player_in, player_out, detail) VALUES
('d6eb14f0-0001-4f4a-b05c-7115fbf00001', 'b4c9f2f0-0002-4d2e-983f-5993efd80002', NULL, 'MATCH_START', 0, NULL, NULL, NULL, 'Kick-off! Match started'),
('d6eb14f0-0002-4f4a-b05c-7115fbf00002', 'b4c9f2f0-0002-4d2e-983f-5993efd80002', 't-ger', 'GOAL', 32, NULL, 'Thomas Muller', 'Jamal Musiala', 'Slick combination finish inside the box')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed API Providers
INSERT INTO public.api_providers (id, name, url, api_key, is_enabled, priority, health_status, response_time_ms, last_sync_at) VALUES
('e7fc25f0-0001-4f5b-c16d-8226fcf00001', 'SportsRadar API', 'https://api.sportradar.com/soccer/worldcup2026', 'mock-api-key-1', true, 1, 'HEALTHY', 145, now())
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Ad Networks
INSERT INTO public.ad_networks (id, name, banner_script, native_script, social_bar_script, header_script, footer_script, is_enabled) VALUES
('f8fd36f0-0001-4f6c-d27e-9337fdf00001', 'AdSense', '<div style="background:#0f172a;color:#10b981;border:1px solid #334155;padding:16px;text-align:center;border-radius:12px;font-weight:bold;">Google AdSense Banner Banner</div>', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
