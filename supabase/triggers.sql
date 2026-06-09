-- PostgreSQL Triggers for Realtime Automation

-- 1. TRIGGER: Initialize score statistics on match creation
CREATE OR REPLACE FUNCTION public.fn_init_match_score_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.score_updates (
        match_id,
        possession_a,
        possession_b,
        shots_a,
        shots_b,
        corners_a,
        corners_b,
        yellow_cards_a,
        yellow_cards_b,
        red_cards_a,
        red_cards_b,
        updated_at
    ) VALUES (
        NEW.id,
        50, 50, 0, 0, 0, 0, 0, 0, 0, 0, now()
    ) ON CONFLICT (match_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_init_match_score_stats
    AFTER INSERT ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_init_match_score_stats();


-- 2. TRIGGER: Update match scoreboard automatically from match events
CREATE OR REPLACE FUNCTION public.fn_update_match_score_on_event()
RETURNS TRIGGER AS $$
DECLARE
    v_team_a_id VARCHAR(50);
    v_team_b_id VARCHAR(50);
BEGIN
    -- Get team IDs for the match
    SELECT team_a_id, team_b_id INTO v_team_a_id, v_team_b_id
    FROM public.matches
    WHERE id = NEW.match_id;

    IF NEW.type = 'GOAL' OR NEW.type = 'PENALTY' THEN
        IF NEW.team_id = v_team_a_id THEN
            UPDATE public.matches
            SET team_a_score = team_a_score + 1, updated_at = now()
            WHERE id = NEW.match_id;
        ELSIF NEW.team_id = v_team_b_id THEN
            UPDATE public.matches
            SET team_b_score = team_b_score + 1, updated_at = now()
            WHERE id = NEW.match_id;
        END IF;
    ELSIF NEW.type = 'OWN_GOAL' THEN
        -- Own goal goes to the OPPOSING team's score
        IF NEW.team_id = v_team_a_id THEN
            UPDATE public.matches
            SET team_b_score = team_b_score + 1, updated_at = now()
            WHERE id = NEW.match_id;
        ELSIF NEW.team_id = v_team_b_id THEN
            UPDATE public.matches
            SET team_a_score = team_a_score + 1, updated_at = now()
            WHERE id = NEW.match_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_update_match_score_on_event
    AFTER INSERT ON public.match_events
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_match_score_on_event();


-- 3. TRIGGER: Generate notifications for goals, kickoff, and match end
CREATE OR REPLACE FUNCTION public.fn_create_notification_from_event()
RETURNS TRIGGER AS $$
DECLARE
    v_team_a_name TEXT;
    v_team_b_name TEXT;
    v_team_name TEXT;
    v_match_title TEXT;
    v_score_a INT;
    v_score_b INT;
    v_notif_title TEXT;
    v_notif_message TEXT;
    v_category VARCHAR(30);
BEGIN
    -- Fetch team and score details
    SELECT t_a.name, t_b.name, m.team_a_score, m.team_b_score
    INTO v_team_a_name, v_team_b_name, v_score_a, v_score_b
    FROM public.matches m
    JOIN public.teams t_a ON m.team_a_id = t_a.id
    JOIN public.teams t_b ON m.team_b_id = t_b.id
    WHERE m.id = NEW.match_id;

    v_match_title := v_team_a_name || ' vs ' || v_team_b_name;

    IF NEW.type = 'GOAL' OR NEW.type = 'PENALTY' OR NEW.type = 'OWN_GOAL' THEN
        SELECT name INTO v_team_name FROM public.teams WHERE id = NEW.team_id;
        
        v_category := 'GOAL_ALERT';
        IF NEW.type = 'OWN_GOAL' THEN
            v_notif_title := '⚽ OWN GOAL! ' || v_match_title;
            v_notif_message := 'Unfortunate own goal in the ' || NEW.minute || '''' || 
                               ' - Current Score: ' || v_team_a_name || ' ' || v_score_a || ' - ' || v_score_b || ' ' || v_team_b_name;
        ELSE
            v_notif_title := '⚽ GOAL! ' || v_match_title;
            v_notif_message := v_team_name || ' scored in the ' || NEW.minute || '''' || 
                               COALESCE(' by ' || NEW.player_in, '') || 
                               ' - Current Score: ' || v_team_a_name || ' ' || v_score_a || ' - ' || v_score_b || ' ' || v_team_b_name;
        END IF;
        
    ELSIF NEW.type = 'MATCH_START' THEN
        v_category := 'MATCH_STARTED';
        v_notif_title := '🟢 MATCH STARTED';
        v_notif_message := 'Kick-off! The match ' || v_match_title || ' has officially started. Watch live streaming now!';
        
        -- Also set match status to LIVE
        UPDATE public.matches SET status = 'LIVE', updated_at = now() WHERE id = NEW.match_id;
        
    ELSIF NEW.type = 'MATCH_END' THEN
        v_category := 'MATCH_FINISHED';
        v_notif_title := '🔴 MATCH FINISHED';
        v_notif_message := 'Full time whistle! ' || v_match_title || ' ended with a score of ' || v_score_a || ' - ' || v_score_b || '.';
        
        -- Also set match status to FINISHED
        UPDATE public.matches SET status = 'FINISHED', updated_at = now() WHERE id = NEW.match_id;
    ELSE
        -- No automatic notifications for cards or substitutions to prevent spamming
        RETURN NEW;
    END IF;

    -- Insert into notifications table. An Edge Function can then process this table to push to OneSignal.
    INSERT INTO public.notifications (
        title,
        message,
        category,
        match_id,
        status,
        created_at
    ) VALUES (
        v_notif_title,
        v_notif_message,
        v_category,
        NEW.match_id,
        'DRAFT', -- DRAFT status. Webhook/Edge function sends it and changes to SENT
        now()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_create_notification_from_event
    AFTER INSERT ON public.match_events
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_create_notification_from_event();
