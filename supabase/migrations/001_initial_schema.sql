-- ===========================================
-- FreeLiao Initial Database Schema
-- ===========================================
-- Run this migration in your Supabase SQL Editor
-- or via Supabase CLI: supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username TEXT,
    display_name TEXT NOT NULL,
    profile_photo_url TEXT,
    invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user lookups
CREATE INDEX idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX idx_users_invite_code ON public.users(invite_code);

COMMENT ON TABLE public.users IS 'User accounts linked to Telegram';
COMMENT ON COLUMN public.users.telegram_id IS 'Unique Telegram user ID';
COMMENT ON COLUMN public.users.invite_code IS 'Shareable code for friend invites';

-- ============================================
-- FRIENDSHIPS TABLE (bidirectional)
-- ============================================
CREATE TABLE public.friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    closeness_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Indexes for friendship lookups
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);

COMMENT ON TABLE public.friendships IS 'Friend relationships between users';
COMMENT ON COLUMN public.friendships.closeness_score IS 'Higher score = closer friends (based on hangout history)';

-- ============================================
-- USER STATUS TABLE
-- ============================================
CREATE TABLE public.user_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Indexes for status lookups
CREATE INDEX idx_user_status_user_id ON public.user_status(user_id);
CREATE INDEX idx_user_status_type ON public.user_status(status_type);
CREATE INDEX idx_user_status_expires ON public.user_status(expires_at);

COMMENT ON TABLE public.user_status IS 'Current availability status for each user';
COMMENT ON COLUMN public.user_status.vibe_text IS 'Optional mood/vibe text (e.g., "Down for anything")';

-- ============================================
-- JIOS TABLE (hangout invitations)
-- ============================================
CREATE TABLE public.jios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Indexes for jio lookups
CREATE INDEX idx_jios_creator_id ON public.jios(creator_id);
CREATE INDEX idx_jios_status ON public.jios(status);
CREATE INDEX idx_jios_expires ON public.jios(expires_at);
CREATE INDEX idx_jios_created ON public.jios(created_at DESC);

COMMENT ON TABLE public.jios IS 'Hangout invitations (jios)';
COMMENT ON COLUMN public.jios.jio_type IS 'Type of hangout: kopi, makan, study, game, movie, chill, custom';

-- ============================================
-- JIO RESPONSES TABLE
-- ============================================
CREATE TABLE public.jio_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jio_id UUID NOT NULL REFERENCES public.jios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    response TEXT NOT NULL CHECK (response IN ('interested', 'joined', 'declined', 'maybe')),
    responded_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(jio_id, user_id)
);

-- Indexes
CREATE INDEX idx_jio_responses_jio_id ON public.jio_responses(jio_id);
CREATE INDEX idx_jio_responses_user_id ON public.jio_responses(user_id);

COMMENT ON TABLE public.jio_responses IS 'User responses to jio invitations';

-- ============================================
-- JIO INVITES TABLE (for specific visibility)
-- ============================================
CREATE TABLE public.jio_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jio_id UUID NOT NULL REFERENCES public.jios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    notified BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMPTZ,

    UNIQUE(jio_id, user_id)
);

CREATE INDEX idx_jio_invites_jio_id ON public.jio_invites(jio_id);
CREATE INDEX idx_jio_invites_user_id ON public.jio_invites(user_id);

COMMENT ON TABLE public.jio_invites IS 'Tracks which users were invited to specific jios';

-- ============================================
-- HANGOUT HISTORY (for closeness scoring)
-- ============================================
CREATE TABLE public.hangouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jio_id UUID REFERENCES public.jios(id) ON DELETE SET NULL,
    participants UUID[] NOT NULL,
    happened_at TIMESTAMPTZ DEFAULT NOW(),
    location_text TEXT
);

CREATE INDEX idx_hangouts_jio_id ON public.hangouts(jio_id);
CREATE INDEX idx_hangouts_happened ON public.hangouts(happened_at DESC);

COMMENT ON TABLE public.hangouts IS 'History of completed hangouts for closeness scoring';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jio_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jio_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangouts ENABLE ROW LEVEL SECURITY;

-- Users policies (public profiles for discovery)
CREATE POLICY "Users can read all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Friendships policies
CREATE POLICY "Users can read own friendships" ON public.friendships
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        auth.uid()::text = friend_id::text
    );

CREATE POLICY "Users can create friendships" ON public.friendships
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own friendships" ON public.friendships
    FOR UPDATE USING (
        auth.uid()::text = user_id::text OR
        auth.uid()::text = friend_id::text
    );

CREATE POLICY "Service role full access friendships" ON public.friendships
    FOR ALL USING (auth.role() = 'service_role');

-- Status policies (friends can see status)
CREATE POLICY "Anyone can read status" ON public.user_status
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own status" ON public.user_status
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role full access status" ON public.user_status
    FOR ALL USING (auth.role() = 'service_role');

-- Jios policies
CREATE POLICY "Anyone can read active jios" ON public.jios
    FOR SELECT USING (true);

CREATE POLICY "Users can create jios" ON public.jios
    FOR INSERT WITH CHECK (auth.uid()::text = creator_id::text);

CREATE POLICY "Creators can update own jios" ON public.jios
    FOR UPDATE USING (auth.uid()::text = creator_id::text);

CREATE POLICY "Service role full access jios" ON public.jios
    FOR ALL USING (auth.role() = 'service_role');

-- Jio responses policies
CREATE POLICY "Anyone can read jio responses" ON public.jio_responses
    FOR SELECT USING (true);

CREATE POLICY "Users can respond to jios" ON public.jio_responses
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own responses" ON public.jio_responses
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role full access responses" ON public.jio_responses
    FOR ALL USING (auth.role() = 'service_role');

-- Jio invites policies
CREATE POLICY "Users can read own invites" ON public.jio_invites
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role full access invites" ON public.jio_invites
    FOR ALL USING (auth.role() = 'service_role');

-- Hangouts policies
CREATE POLICY "Users can read hangouts they participated in" ON public.hangouts
    FOR SELECT USING (auth.uid()::text = ANY(participants::text[]));

CREATE POLICY "Service role full access hangouts" ON public.hangouts
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get friends' statuses
CREATE OR REPLACE FUNCTION get_friends_statuses(p_user_id UUID)
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
    FROM public.users u
    INNER JOIN public.friendships f ON (
        (f.user_id = p_user_id AND f.friend_id = u.id) OR
        (f.friend_id = p_user_id AND f.user_id = u.id)
    )
    LEFT JOIN public.user_status s ON s.user_id = u.id
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

-- Function to get visible jios for a user
CREATE OR REPLACE FUNCTION get_visible_jios(p_user_id UUID)
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
        (SELECT COUNT(*) FROM public.jio_responses jr
         WHERE jr.jio_id = j.id AND jr.response IN ('interested', 'joined')) as response_count,
        (SELECT jr.response FROM public.jio_responses jr
         WHERE jr.jio_id = j.id AND jr.user_id = p_user_id) as user_response
    FROM public.jios j
    INNER JOIN public.users u ON u.id = j.creator_id
    WHERE j.status = 'active'
    AND j.expires_at > NOW()
    AND (
        j.creator_id = p_user_id
        OR EXISTS (
            SELECT 1 FROM public.friendships f
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

-- Function to expire old statuses (called by cron)
CREATE OR REPLACE FUNCTION expire_old_statuses()
RETURNS void AS $$
BEGIN
    UPDATE public.user_status
    SET status_type = 'offline',
        free_until = NULL,
        free_after = NULL,
        vibe_text = NULL
    WHERE expires_at < NOW()
    AND status_type != 'offline';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old jios (called by cron)
CREATE OR REPLACE FUNCTION expire_old_jios()
RETURNS void AS $$
BEGIN
    UPDATE public.jios
    SET status = 'expired'
    WHERE expires_at < NOW()
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.friendships
        WHERE status = 'accepted'
        AND (
            (user_id = user1_id AND friend_id = user2_id) OR
            (user_id = user2_id AND friend_id = user1_id)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending friend requests for a user
CREATE OR REPLACE FUNCTION get_pending_friend_requests(p_user_id UUID)
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
    FROM public.friendships f
    INNER JOIN public.users u ON u.id = f.user_id
    WHERE f.friend_id = p_user_id
    AND f.status = 'pending'
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
-- Enable realtime for status and jios
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jio_responses;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER friendships_updated_at
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_status_updated_at
    BEFORE UPDATE ON public.user_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- GRANTS (for service role access)
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
