-- =============================================================================
-- Gestión de Proyectos de Aplicaciones TI - Supabase Schema
-- Run this script in the Supabase SQL Editor to create tables, enums, RLS,
-- triggers and functions.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('functional', 'developer', 'admin');
CREATE TYPE request_type AS ENUM ('incidencia', 'mejora', 'proyecto');
CREATE TYPE request_status AS ENUM ('backlog', 'prioritized', 'in_progress', 'done');

-- -----------------------------------------------------------------------------
-- Profiles (extends auth.users, synced via trigger)
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'functional',
  avatar_url TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Requests
-- -----------------------------------------------------------------------------
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type request_type NOT NULL,
  status request_status NOT NULL DEFAULT 'backlog',
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  developer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  urgency SMALLINT NOT NULL CHECK (urgency >= 1 AND urgency <= 5),
  importance SMALLINT NOT NULL CHECK (importance >= 1 AND importance <= 5),
  complexity SMALLINT NOT NULL CHECK (complexity >= 1 AND complexity <= 5),
  priority_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_requests_requester ON requests(requester_id);
CREATE INDEX idx_requests_developer ON requests(developer_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_priority ON requests(priority_score DESC);

-- -----------------------------------------------------------------------------
-- Function: calculate priority_score
-- Formula: (urgency + importance) * (6 - complexity) / 5
-- (Higher complexity lowers the effective score.)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_priority_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.priority_score := ROUND(
    (NEW.urgency::numeric + NEW.importance::numeric)
    * (6.0 - NEW.complexity::numeric) / 5.0,
    2
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_priority_score
  BEFORE INSERT OR UPDATE OF urgency, importance, complexity ON requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_priority_score();

-- -----------------------------------------------------------------------------
-- Trigger: updated_at on requests
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Trigger: create profile on auth signup (sync auth.users -> profiles)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    'functional',
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS: profiles
-- - Authenticated users can read all profiles.
-- - Only admin can update profiles (e.g. role).
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- RLS: requests
-- - Functional: can INSERT (as requester) and SELECT own requests.
-- - Developer/Admin: can SELECT all, UPDATE all.
-- -----------------------------------------------------------------------------
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requests_insert_authenticated"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "requests_select_own_for_functional"
  ON requests FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('developer', 'admin'))
  );

CREATE POLICY "requests_update_developer_admin"
  ON requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('developer', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('developer', 'admin'))
  );

-- -----------------------------------------------------------------------------
-- Optional: Domain restriction for signup
-- Restrict signups to a specific email domain (e.g. @tuempresa.com).
-- Enable in Auth -> Policies or via a custom signup check.
-- Example (run after configuring allowed_domain in app):
-- In Supabase Dashboard: Authentication -> Providers -> Google -> restrict to domain.
-- =============================================================================
