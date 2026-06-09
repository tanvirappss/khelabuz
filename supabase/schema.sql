-- PostgreSQL Schema for World Cup 2026 Live Football Streaming & Score Application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code VARCHAR(3) NOT NULL UNIQUE,
    flag_url TEXT NOT NULL,
    primary_color VARCHAR(7) DEFAULT '#000000',
    secondary_color VARCHAR(7) DEFAULT '#ffffff',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    team_a_id VARCHAR(50) REFERENCES public.teams(id) ON DELETE CASCADE,
    team_b_id VARCHAR(50) REFERENCES public.teams(id) ON DELETE CASCADE,
    team_a_score INT DEFAULT 0,
    team_b_score INT DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('UPCOMING', 'LIVE', 'FINISHED')),
    tournament TEXT NOT NULL DEFAULT 'FIFA World Cup 2026',
    stadium TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying active/live matches quickly
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_start_time ON public.matches(start_time);

-- 3. STREAMS TABLE
CREATE TABLE IF NOT EXISTS public.streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(50) REFERENCES public.matches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    primary_url TEXT NOT NULL,
    backup_url_1 TEXT,
    backup_url_2 TEXT,
    backup_url_3 TEXT,
    is_enabled BOOLEAN DEFAULT true,
    is_m3u BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure column exists if table is already created
ALTER TABLE public.streams ADD COLUMN IF NOT EXISTS is_m3u BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_streams_match_id ON public.streams(match_id);

-- 4. MATCH EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(50) REFERENCES public.matches(id) ON DELETE CASCADE,
    team_id VARCHAR(50) REFERENCES public.teams(id) ON DELETE CASCADE, -- Nullable for neutral events
    type VARCHAR(20) NOT NULL CHECK (type IN ('GOAL', 'PENALTY', 'OWN_GOAL', 'VAR', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'MATCH_START', 'MATCH_END')),
    minute INT NOT NULL,
    extra_minute INT,
    player_in TEXT,
    player_out TEXT,
    detail TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON public.match_events(match_id);

-- 5. SCORE UPDATES (STATS) TABLE
CREATE TABLE IF NOT EXISTS public.score_updates (
    match_id VARCHAR(50) PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
    possession_a INT DEFAULT 50 CHECK (possession_a BETWEEN 0 AND 100),
    possession_b INT DEFAULT 50 CHECK (possession_b BETWEEN 0 AND 100),
    shots_a INT DEFAULT 0,
    shots_b INT DEFAULT 0,
    corners_a INT DEFAULT 0,
    corners_b INT DEFAULT 0,
    yellow_cards_a INT DEFAULT 0,
    yellow_cards_b INT DEFAULT 0,
    red_cards_a INT DEFAULT 0,
    red_cards_b INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. API PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS public.api_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    api_key TEXT,
    is_enabled BOOLEAN DEFAULT false,
    priority INT NOT NULL DEFAULT 1, -- 1=Primary, 2=Secondary, 3=Backup
    health_status VARCHAR(20) DEFAULT 'UNKNOWN', -- HEALTHY, UNHEALTHY, DOWN
    response_time_ms INT DEFAULT 0,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. AD NETWORKS TABLE
CREATE TABLE IF NOT EXISTS public.ad_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'AdSense', 'Adsterra', 'Custom'
    banner_script TEXT,
    native_script TEXT,
    social_bar_script TEXT,
    header_script TEXT,
    footer_script TEXT,
    is_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('GOAL_ALERT', 'MATCH_STARTED', 'MATCH_FINISHED', 'FEATURE_UPDATE', 'ANNOUNCEMENT')),
    match_id VARCHAR(50) REFERENCES public.matches(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. APP UPDATES TABLE
CREATE TABLE IF NOT EXISTS public.app_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_code INT NOT NULL,
    version_name TEXT NOT NULL,
    force_update BOOLEAN DEFAULT false,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    download_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL, -- 'total_installs', 'daily_active_users', 'live_viewers', 'active_streams', 'notifications_sent', 'notification_open_rate'
    metric_value NUMERIC NOT NULL DEFAULT 0,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (metric_name, recorded_date)
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Create Public Read-only policies (Select allowed for anyone)
CREATE POLICY select_public_teams ON public.teams FOR SELECT USING (true);
CREATE POLICY select_public_matches ON public.matches FOR SELECT USING (true);
CREATE POLICY select_public_streams ON public.streams FOR SELECT USING (true);
CREATE POLICY select_public_match_events ON public.match_events FOR SELECT USING (true);
CREATE POLICY select_public_score_updates ON public.score_updates FOR SELECT USING (true);
CREATE POLICY select_public_api_providers ON public.api_providers FOR SELECT USING (true);
CREATE POLICY select_public_ad_networks ON public.ad_networks FOR SELECT USING (true);
CREATE POLICY select_public_notifications ON public.notifications FOR SELECT USING (true);
CREATE POLICY select_public_app_updates ON public.app_updates FOR SELECT USING (true);
CREATE POLICY select_public_analytics ON public.analytics FOR SELECT USING (true);

-- Create Authenticated Admin write policies (All privileges for authenticated users)
CREATE POLICY admin_all_teams ON public.teams FOR ALL TO authenticated USING (true);
CREATE POLICY admin_all_matches ON public.matches FOR ALL TO authenticated USING (true);
CREATE POLICY admin_all_streams ON public.streams FOR ALL TO authenticated USING (true);
CREATE POLICY admin_all_match_events ON public.match_events FOR ALL TO authenticated USING (true);
CREATE POLICY admin_all_score_updates ON public.score_updates FOR ALL TO authenticated USING (true);
CREATE POLICY admin_all_api_providers ON public.api_providers FOR ALL TO authenticated USING (true);
CREATE POLICY admin_all_ad_networks ON public.ad_networks FOR ALL TO authenticated USING (true);
CREATE POLICY admin_all_notifications ON public.notifications FOR ALL TO authenticated USING (true);
CREATE POLICY admin_all_app_updates ON public.app_updates FOR ALL TO authenticated USING (true);
CREATE POLICY admin_all_analytics ON public.analytics FOR ALL TO authenticated USING (true);

-- Turn on Realtime for selected tables (matches, streams, match_events, score_updates, notifications)
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.streams REPLICA IDENTITY FULL;
ALTER TABLE public.match_events REPLICA IDENTITY FULL;
ALTER TABLE public.score_updates REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
