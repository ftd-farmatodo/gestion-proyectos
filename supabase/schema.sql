-- =============================================================================
-- Gestión de Proyectos de Aplicaciones TI - Supabase Schema
-- Applied via 12 migrations on Supabase project zkzudgoqehlnihzulcxc
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('functional', 'developer', 'admin');
CREATE TYPE request_type AS ENUM ('incidencia', 'mejora', 'proyecto');

-- -----------------------------------------------------------------------------
-- Profiles (extends auth.users, synced via trigger)
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'functional',
  avatar_url TEXT,
  display_name TEXT,
  team_id TEXT,
  department TEXT,
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
  status TEXT NOT NULL DEFAULT 'backlog',
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  developer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  urgency SMALLINT NOT NULL CHECK (urgency >= 1 AND urgency <= 5),
  importance SMALLINT NOT NULL CHECK (importance >= 1 AND importance <= 5),
  complexity SMALLINT NOT NULL CHECK (complexity >= 1 AND complexity <= 5),
  priority_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  internal_id TEXT,
  requester_name TEXT,
  requester_department TEXT,
  team_id TEXT,
  fiscal_year TEXT,
  affected_module TEXT,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  affected_url TEXT,
  business_justification TEXT,
  expected_benefit TEXT,
  impacted_users TEXT,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  countries TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_requests_requester ON requests(requester_id);
CREATE INDEX idx_requests_developer ON requests(developer_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_priority ON requests(priority_score DESC);
CREATE INDEX idx_requests_team_fy ON requests(team_id, fiscal_year);

-- -----------------------------------------------------------------------------
-- Teams catalog
-- -----------------------------------------------------------------------------
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Departments catalog
-- -----------------------------------------------------------------------------
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Status pipeline config
-- -----------------------------------------------------------------------------
CREATE TABLE status_config (
  key TEXT PRIMARY KEY,
  label_es TEXT NOT NULL,
  label_en TEXT NOT NULL,
  color TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  allowed_transitions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Countries catalog
-- -----------------------------------------------------------------------------
CREATE TABLE countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  flag TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Affected modules catalog
-- -----------------------------------------------------------------------------
CREATE TABLE affected_modules (
  key TEXT PRIMARY KEY,
  label_es TEXT NOT NULL,
  label_en TEXT NOT NULL,
  icon TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Fiscal years and closures
-- -----------------------------------------------------------------------------
CREATE TABLE fiscal_years (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  period_number INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_fiscal_years_current_true ON fiscal_years (is_current) WHERE is_current = true;

CREATE TABLE fiscal_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fy_key TEXT NOT NULL REFERENCES fiscal_years(key) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fy_key, team_id)
);

-- -----------------------------------------------------------------------------
-- Activity timeline
-- -----------------------------------------------------------------------------
CREATE TABLE activity_entries (
  id TEXT PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  request_internal_id TEXT,
  request_title TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  team_id TEXT,
  fiscal_year TEXT,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_request ON activity_entries(request_id);
CREATE INDEX idx_activity_team_fy ON activity_entries(team_id, fiscal_year);
CREATE INDEX idx_activity_actor ON activity_entries(actor_id);

-- -----------------------------------------------------------------------------
-- Functions & Triggers (all with search_path = public)
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
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_calculate_priority_score
  BEFORE INSERT OR UPDATE OF urgency, importance, complexity ON requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_priority_score();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_status_config_updated_at
  BEFORE UPDATE ON status_config
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_countries_updated_at
  BEFORE UPDATE ON countries
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_fiscal_years_updated_at
  BEFORE UPDATE ON fiscal_years
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_fiscal_closures_updated_at
  BEFORE UPDATE ON fiscal_closures
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS: profiles
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_self"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "profiles_update_self_or_admin"
  ON profiles FOR UPDATE TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin')
  )
  WITH CHECK (
    id = (select auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- RLS: requests
-- -----------------------------------------------------------------------------
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requests_insert_authenticated"
  ON requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = (select auth.uid()));

CREATE POLICY "requests_select_own_for_functional"
  ON requests FOR SELECT TO authenticated
  USING (
    requester_id = (select auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role IN ('developer', 'admin'))
  );

CREATE POLICY "requests_update_developer_admin"
  ON requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role IN ('developer', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role IN ('developer', 'admin')));

-- -----------------------------------------------------------------------------
-- RLS: teams
-- -----------------------------------------------------------------------------
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select_authenticated"
  ON teams FOR SELECT TO authenticated USING (true);

CREATE POLICY "teams_insert_admin" ON teams FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));
CREATE POLICY "teams_update_admin" ON teams FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));
CREATE POLICY "teams_delete_admin" ON teams FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- -----------------------------------------------------------------------------
-- RLS: departments
-- -----------------------------------------------------------------------------
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_select_authenticated"
  ON departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "departments_insert_admin" ON departments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));
CREATE POLICY "departments_update_admin" ON departments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));
CREATE POLICY "departments_delete_admin" ON departments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- -----------------------------------------------------------------------------
-- RLS: status_config
-- -----------------------------------------------------------------------------
ALTER TABLE status_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "status_config_select_authenticated"
  ON status_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "status_config_insert_admin" ON status_config FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));
CREATE POLICY "status_config_update_admin" ON status_config FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));
CREATE POLICY "status_config_delete_admin" ON status_config FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- -----------------------------------------------------------------------------
-- RLS: affected_modules
-- -----------------------------------------------------------------------------
ALTER TABLE affected_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affected_modules_select_authenticated"
  ON affected_modules FOR SELECT TO authenticated USING (true);

CREATE POLICY "affected_modules_insert_admin" ON affected_modules FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));
CREATE POLICY "affected_modules_update_admin" ON affected_modules FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));
CREATE POLICY "affected_modules_delete_admin" ON affected_modules FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- -----------------------------------------------------------------------------
-- RLS: countries
-- -----------------------------------------------------------------------------
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "countries_select_authenticated"
  ON countries FOR SELECT TO authenticated USING (true);

CREATE POLICY "countries_insert_admin" ON countries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));
CREATE POLICY "countries_update_admin" ON countries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));
CREATE POLICY "countries_delete_admin" ON countries FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- -----------------------------------------------------------------------------
-- RLS: fiscal_years
-- -----------------------------------------------------------------------------
ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fiscal_years_select_authenticated"
  ON fiscal_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "fiscal_years_insert_admin" ON fiscal_years FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));
CREATE POLICY "fiscal_years_update_admin" ON fiscal_years FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- -----------------------------------------------------------------------------
-- RLS: fiscal_closures
-- -----------------------------------------------------------------------------
ALTER TABLE fiscal_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fiscal_closures_select_authenticated"
  ON fiscal_closures FOR SELECT TO authenticated USING (true);
CREATE POLICY "fiscal_closures_insert_admin" ON fiscal_closures FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- -----------------------------------------------------------------------------
-- RLS: activity_entries
-- -----------------------------------------------------------------------------
ALTER TABLE activity_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_select_authenticated"
  ON activity_entries FOR SELECT TO authenticated USING (true);

CREATE POLICY "activity_insert_authenticated"
  ON activity_entries FOR INSERT TO authenticated WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Storage bucket for request attachments
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-attachments', 'request-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "request_attachments_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'request-attachments');

CREATE POLICY "request_attachments_authenticated_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'request-attachments');

-- -----------------------------------------------------------------------------
-- Realtime publication
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE requests;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activity_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE activity_entries;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Seed default data
-- -----------------------------------------------------------------------------
INSERT INTO teams (id, name, code, description, icon, is_active) VALUES
  ('team-ti', 'Tecnologia de la Informacion', 'TI', 'Equipo de desarrollo, infraestructura y soporte TI', '💻', true),
  ('team-ops', 'Operaciones', 'OPS', 'Equipo de operaciones y logistica', '📦', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO departments (name, is_active) VALUES
  ('Finanzas', true), ('Recursos Humanos', true), ('Comercial', true),
  ('Operaciones', true), ('Tecnología', true), ('Legal', true),
  ('Marketing', true), ('Logística', true), ('Compras', true), ('Gerencia', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO status_config (key, label_es, label_en, color, bg_color, "order", allowed_transitions, is_active) VALUES
  ('backlog', 'Backlog', 'Backlog', 'var(--cool-gray)', 'color-mix(in srgb, var(--cool-gray) 12%, transparent)', 0, ARRAY['prioritized', 'cancelled'], true),
  ('prioritized', 'Priorizado', 'Prioritized', 'var(--orange)', 'color-mix(in srgb, var(--orange) 12%, transparent)', 1, ARRAY['in_progress', 'backlog', 'cancelled'], true),
  ('in_progress', 'En progreso', 'In Progress', 'var(--primary-light)', 'color-mix(in srgb, var(--primary-light) 12%, transparent)', 2, ARRAY['qa_review', 'done', 'prioritized', 'cancelled'], true),
  ('qa_review', 'En revisión', 'QA Review', 'var(--purple)', 'color-mix(in srgb, var(--purple) 12%, transparent)', 3, ARRAY['done', 'in_progress'], true),
  ('done', 'Completado', 'Completed', 'var(--lime)', 'color-mix(in srgb, var(--lime) 12%, transparent)', 4, ARRAY['backlog'], true),
  ('cancelled', 'Cancelado', 'Cancelled', 'var(--magenta)', 'color-mix(in srgb, var(--magenta) 12%, transparent)', 5, ARRAY['backlog'], true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO countries (code, name, flag, is_active) VALUES
  ('VE', 'Venezuela', '🇻🇪', true),
  ('AR', 'Argentina', '🇦🇷', true),
  ('CO', 'Colombia', '🇨🇴', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO affected_modules (key, label_es, label_en, icon, "order") VALUES
  ('portal',   'Portal web',      'Web portal',      NULL, 1),
  ('app',      'App móvil',       'Mobile app',      NULL, 2),
  ('backend',  'Backend / APIs',  'Backend / APIs',  NULL, 3),
  ('database', 'Base de datos',   'Database',        NULL, 4),
  ('reports',  'Reportes',        'Reports',         NULL, 5),
  ('other',    'Otro',            'Other',           NULL, 6)
ON CONFLICT (key) DO NOTHING;

INSERT INTO fiscal_years (key, label, start_date, end_date, period_number, is_current) VALUES
  ('FY2026', 'Período Actual', now(), null, 1, true)
ON CONFLICT (key) DO NOTHING;

-- DELETE policies (added for production hardening)
CREATE POLICY "requests_delete_admin" ON requests FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "fiscal_closures_delete_admin" ON fiscal_closures FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "fiscal_years_delete_admin" ON fiscal_years FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
