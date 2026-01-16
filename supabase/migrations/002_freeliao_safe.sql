-- ===========================================
-- FreeLiao Database Schema (Safe Version)
-- ===========================================
-- Safe to run alongside existing tables
-- All policy names prefixed with "freeliao_"

-- Enable UUID extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- FREELIAO TABLES (with IF NOT EXISTS)
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS public.fl_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username TEXT,
    display_name TEXT NOT NULL,
    profile_photo_url TEXT,
    invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fl_users_telegram_id ON public.fl_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_fl_users_invite_code ON public.fl_users(invite_code);

-- Friendships table
CREATE TABLE IF NOT EXISTS public.fl_friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.fl_users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.fl_users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    closeness_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_fl_friendships_user_id ON public.fl_friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_fl_friendships_friend_id ON public.fl_friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_fl_friendships_status ON public.fl_friendships(status);

-- User status table
CREATE TABLE IF NOT EXISTS public.fl_user_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.fl_users(id) ON DELETE CASCADE,
    status_type TEXT NOT NULL DEFAULT 'offline'
        CHECK (status_type IN ('free', 'free_later', 'busy', 'offline')),
    free_until TIMESTAMPTZ,
    free_after TIMESTAMPTZ,
    vibe_text TEXT,
    location_text TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fl_user_status_user_id ON public.fl_user_status(user_id);
CREATE INDEX IF NOT EXISTS idx_fl_user_status_type ON public.fl_user_status(status_type);
CREATE INDEX IF NOT EXISTS idx_fl_user_status_expires ON public.fl_user_status(expires_at);

-- Jios table (hangout invitations)
CREATE TABLE IF NOT EXISTS public.fl_jios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.fl_users(id) ON DELETE CASCADE,
    jio_type TEXT NOT NULL DEFAULT 'custom'
        CHECK (jio_type IN ('kopi', 'makan', 'study', 'game', 'movie', 'chill', 'custom')),
    title TEXT NOT NULL,
    description TEXT,
    location_text TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    proposed_time TIMESTAMPTZ,
    is_now BOOLEAN DEFAULT TRUE,
    min_participants INTEGER DEFAULT 1,
    max_participants INTEGER DEFAULT 10,
    visibility TEXT DEFAULT 'all_friends'
        CHECK (visibility IN ('all_friends', 'close_friends', 'specific')),
    status TEXT DEFAULT 'active'
        CHECK (status IN ('active', 'confirmed', 'expired', 'cancelled')),
    telegram_group_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fl_jios_creator_id ON public.fl_jios(creator_id);
CREATE INDEX IF NOT EXISTS idx_fl_jios_status ON public.fl_jios(status);
CREATE INDEX IF NOT EXISTS idx_fl_jios_expires ON public.fl_jios(expires_at);
CREATE INDEX IF NOT EXISTS idx_fl_jios_created ON public.fl_jios(created_at DESC);

-- Jio responses table
CREATE TABLE IF NOT EXISTS public.fl_jio_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jio_id UUID NOT NULL REFERENCES public.fl_jios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.fl_users(id) ON DELETE CASCADE,
    response TEXT NOT NULL CHECK (response IN ('interested', 'joined', 'declined', 'maybe')),
    responded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(jio_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fl_jio_responses_jio_id ON public.fl_jio_responses(jio_id);
CREATE INDEX IF NOT EXISTS idx_fl_jio_responses_user_id ON public.fl_jio_responses(user_id);

-- Jio invites table
CREATE TABLE IF NOT EXISTS public.fl_jio_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jio_id UUID NOT NULL REFERENCES public.fl_jios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.fl_users(id) ON DELETE CASCADE,
    notified BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMPTZ,
    UNIQUE(jio_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fl_jio_invites_jio_id ON public.fl_jio_invites(jio_id);
CREATE INDEX IF NOT EXISTS idx_fl_jio_invites_user_id ON public.fl_jio_invites(user_id);

-- Hangouts history table
CREATE TABLE IF NOT EXISTS public.fl_hangouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jio_id UUID REFERENCES public.fl_jios(id) ON DELETE SET NULL,
    participants UUID[] NOT NULL,
    happened_at TIMESTAMPTZ DEFAULT NOW(),
    location_text TEXT
);

CREATE INDEX IF NOT EXISTS idx_fl_hangouts_jio_id ON public.fl_hangouts(jio_id);
CREATE INDEX IF NOT EXISTS idx_fl_hangouts_happened ON public.fl_hangouts(happened_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.fl_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fl_friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fl_user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fl_jios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fl_jio_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fl_jio_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fl_hangouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe cleanup)
DROP POLICY IF EXISTS "freeliao_users_select" ON public.fl_users;
DROP POLICY IF EXISTS "freeliao_users_insert" ON public.fl_users;
DROP POLICY IF EXISTS "freeliao_users_update" ON public.fl_users;
DROP POLICY IF EXISTS "freeliao_friendships_select" ON public.fl_friendships;
DROP POLICY IF EXISTS "freeliao_friendships_insert" ON public.fl_friendships;
DROP POLICY IF EXISTS "freeliao_friendships_update" ON public.fl_friendships;
DROP POLICY IF EXISTS "freeliao_friendships_all" ON public.fl_friendships;
DROP POLICY IF EXISTS "freeliao_status_select" ON public.fl_user_status;
DROP POLICY IF EXISTS "freeliao_status_all" ON public.fl_user_status;
DROP POLICY IF EXISTS "freeliao_status_service" ON public.fl_user_status;
DROP POLICY IF EXISTS "freeliao_jios_select" ON public.fl_jios;
DROP POLICY IF EXISTS "freeliao_jios_insert" ON public.fl_jios;
DROP POLICY IF EXISTS "freeliao_jios_update" ON public.fl_jios;
DROP POLICY IF EXISTS "freeliao_jios_all" ON public.fl_jios;
DROP POLICY IF EXISTS "freeliao_responses_select" ON public.fl_jio_responses;
DROP POLICY IF EXISTS "freeliao_responses_insert" ON public.fl_jio_responses;
DROP POLICY IF EXISTS "freeliao_responses_update" ON public.fl_jio_responses;
DROP POLICY IF EXISTS "freeliao_responses_all" ON public.fl_jio_responses;
DROP POLICY IF EXISTS "freeliao_invites_select" ON public.fl_jio_invites;
DROP POLICY IF EXISTS "freeliao_invites_all" ON public.fl_jio_invites;
DROP POLICY IF EXISTS "freeliao_hangouts_select" ON public.fl_hangouts;
DROP POLICY IF EXISTS "freeliao_hangouts_all" ON public.fl_hangouts;

-- Users policies
CREATE POLICY "freeliao_users_select" ON public.fl_users FOR SELECT USING (true);
CREATE POLICY "freeliao_users_insert" ON public.fl_users FOR INSERT WITH CHECK (true);
CREATE POLICY "freeliao_users_update" ON public.fl_users FOR UPDATE USING (true);

-- Friendships policies
CREATE POLICY "freeliao_friendships_select" ON public.fl_friendships FOR SELECT USING (true);
CREATE POLICY "freeliao_friendships_insert" ON public.fl_friendships FOR INSERT WITH CHECK (true);
CREATE POLICY "freeliao_friendships_update" ON public.fl_friendships FOR UPDATE USING (true);
CREATE POLICY "freeliao_friendships_all" ON public.fl_friendships FOR ALL USING (auth.role() = 'service_role');

-- Status policies
CREATE POLICY "freeliao_status_select" ON public.fl_user_status FOR SELECT USING (true);
CREATE POLICY "freeliao_status_all" ON public.fl_user_status FOR ALL USING (true);
CREATE POLICY "freeliao_status_service" ON public.fl_user_status FOR ALL USING (auth.role() = 'service_role');

-- Jios policies
CREATE POLICY "freeliao_jios_select" ON public.fl_jios FOR SELECT USING (true);
CREATE POLICY "freeliao_jios_insert" ON public.fl_jios FOR INSERT WITH CHECK (true);
CREATE POLICY "freeliao_jios_update" ON public.fl_jios FOR UPDATE USING (true);
CREATE POLICY "freeliao_jios_all" ON public.fl_jios FOR ALL USING (auth.role() = 'service_role');

-- Jio responses policies
CREATE POLICY "freeliao_responses_select" ON public.fl_jio_responses FOR SELECT USING (true);
CREATE POLICY "freeliao_responses_insert" ON public.fl_jio_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "freeliao_responses_update" ON public.fl_jio_responses FOR UPDATE USING (true);
CREATE POLICY "freeliao_responses_all" ON public.fl_jio_responses FOR ALL USING (auth.role() = 'service_role');

-- Jio invites policies
CREATE POLICY "freeliao_invites_select" ON public.fl_jio_invites FOR SELECT USING (true);
CREATE POLICY "freeliao_invites_all" ON public.fl_jio_invites FOR ALL USING (auth.role() = 'service_role');

-- Hangouts policies
CREATE POLICY "freeliao_hangouts_select" ON public.fl_hangouts FOR SELECT USING (true);
CREATE POLICY "freeliao_hangouts_all" ON public.fl_hangouts FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- FUNCTIONS (with fl_ prefix)
-- ============================================

-- Function to get friends' statuses
CREATE OR REPLACE FUNCTION fl_get_friends_statuses(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    telegram_username TEXT,
    profile_photo_url TEXT,
    status_type TEXT,
    free_until TIMESTAMPTZ,
    free_after TIMESTAMPTZ,
    vibe_text TEXT,
    location_text TEXT,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id as user_id,
        u.display_name,
        u.telegram_username,
        u.profile_photo_url,
        COALESCE(s.status_type, 'offline') as status_type,
        s.free_until,
        s.free_after,
        s.vibe_text,
        s.location_text,
        s.updated_at
    FROM public.fl_users u
    INNER JOIN public.fl_friendships f ON (
        (f.user_id = p_user_id AND f.friend_id = u.id) OR
        (f.friend_id = p_user_id AND f.user_id = u.id)
    )
    LEFT JOIN public.fl_user_status s ON s.user_id = u.id
    WHERE f.status = 'accepted'
    AND (s.expires_at IS NULL OR s.expires_at > NOW())
    ORDER BY
        CASE s.status_type
            WHEN 'free' THEN 1
            WHEN 'free_later' THEN 2
            WHEN 'busy' THEN 3
            ELSE 4
        END,
        s.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get visible jios
CREATE OR REPLACE FUNCTION fl_get_visible_jios(p_user_id UUID)
RETURNS TABLE (
    jio_id UUID,
    creator_id UUID,
    creator_name TEXT,
    creator_photo TEXT,
    jio_type TEXT,
    title TEXT,
    description TEXT,
    location_text TEXT,
    proposed_time TIMESTAMPTZ,
    is_now BOOLEAN,
    status TEXT,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    response_count BIGINT,
    user_response TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        j.id as jio_id,
        j.creator_id,
        u.display_name as creator_name,
        u.profile_photo_url as creator_photo,
        j.jio_type,
        j.title,
        j.description,
        j.location_text,
        j.proposed_time,
        j.is_now,
        j.status,
        j.created_at,
        j.expires_at,
        (SELECT COUNT(*) FROM public.fl_jio_responses jr
         WHERE jr.jio_id = j.id AND jr.response IN ('interested', 'joined')) as response_count,
        (SELECT jr.response FROM public.fl_jio_responses jr
         WHERE jr.jio_id = j.id AND jr.user_id = p_user_id) as user_response
    FROM public.fl_jios j
    INNER JOIN public.fl_users u ON u.id = j.creator_id
    WHERE j.status = 'active'
    AND j.expires_at > NOW()
    AND (
        j.creator_id = p_user_id
        OR EXISTS (
            SELECT 1 FROM public.fl_friendships f
            WHERE f.status = 'accepted'
            AND (
                (f.user_id = p_user_id AND f.friend_id = j.creator_id) OR
                (f.friend_id = p_user_id AND f.user_id = j.creator_id)
            )
        )
    )
    ORDER BY j.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old statuses
CREATE OR REPLACE FUNCTION fl_expire_old_statuses()
RETURNS void AS $$
BEGIN
    UPDATE public.fl_user_status
    SET status_type = 'offline',
        free_until = NULL,
        free_after = NULL,
        vibe_text = NULL
    WHERE expires_at < NOW()
    AND status_type != 'offline';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old jios
CREATE OR REPLACE FUNCTION fl_expire_old_jios()
RETURNS void AS $$
BEGIN
    UPDATE public.fl_jios
    SET status = 'expired'
    WHERE expires_at < NOW()
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check friendship
CREATE OR REPLACE FUNCTION fl_are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.fl_friendships
        WHERE status = 'accepted'
        AND (
            (user_id = user1_id AND friend_id = user2_id) OR
            (user_id = user2_id AND friend_id = user1_id)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending friend requests
CREATE OR REPLACE FUNCTION fl_get_pending_friend_requests(p_user_id UUID)
RETURNS TABLE (
    friendship_id UUID,
    from_user_id UUID,
    from_display_name TEXT,
    from_telegram_username TEXT,
    from_profile_photo TEXT,
    requested_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id as friendship_id,
        f.user_id as from_user_id,
        u.display_name as from_display_name,
        u.telegram_username as from_telegram_username,
        u.profile_photo_url as from_profile_photo,
        f.created_at as requested_at
    FROM public.fl_friendships f
    INNER JOIN public.fl_users u ON u.id = f.user_id
    WHERE f.friend_id = p_user_id
    AND f.status = 'pending'
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION fl_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fl_users_updated_at ON public.fl_users;
CREATE TRIGGER fl_users_updated_at
    BEFORE UPDATE ON public.fl_users
    FOR EACH ROW EXECUTE FUNCTION fl_update_updated_at();

DROP TRIGGER IF EXISTS fl_friendships_updated_at ON public.fl_friendships;
CREATE TRIGGER fl_friendships_updated_at
    BEFORE UPDATE ON public.fl_friendships
    FOR EACH ROW EXECUTE FUNCTION fl_update_updated_at();

DROP TRIGGER IF EXISTS fl_user_status_updated_at ON public.fl_user_status;
CREATE TRIGGER fl_user_status_updated_at
    BEFORE UPDATE ON public.fl_user_status
    FOR EACH ROW EXECUTE FUNCTION fl_update_updated_at();

-- ============================================
-- REALTIME (enable for FreeLiao tables)
-- ============================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fl_user_status;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fl_jios;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fl_jio_responses;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================
-- GRANTS
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
