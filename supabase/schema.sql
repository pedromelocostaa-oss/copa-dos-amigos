-- Copa dos Amigos — Schema completo
-- Seguro para re-executar (IF NOT EXISTS + CREATE OR REPLACE)

-- ========================================
-- PARTICIPANTS
-- ========================================
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'pago', 'isento')),
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE participants ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- ========================================
-- MATCHES
-- ========================================
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team text NOT NULL,
  away_team text NOT NULL,
  match_date timestamptz NOT NULL,
  stage text NOT NULL DEFAULT 'Fase de Grupos',
  home_score integer,
  away_score integer,
  is_finished boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_iso text NOT NULL DEFAULT '';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_iso text NOT NULL DEFAULT '';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS group_name text;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS stadium text;

-- ========================================
-- PREDICTIONS
-- ========================================
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  home_score integer NOT NULL,
  away_score integer NOT NULL,
  points integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- ========================================
-- GOALS
-- ========================================
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  player_name text NOT NULL,
  team text NOT NULL,
  team_iso text NOT NULL DEFAULT '',
  minute integer,
  is_own_goal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- BOLOES (entidade central do bolão)
-- ========================================
CREATE TABLE IF NOT EXISTS boloes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'todos'
    CHECK (scope IN ('todos', 'fase_grupos', 'mata_mata', 'times_especificos', 'jogos_especificos', 'artilheiro')),
  scope_config jsonb DEFAULT '{}',
  -- entry_fee em centavos (ex: 2000 = R$20,00)
  entry_fee integer NOT NULL DEFAULT 0,
  prize_config jsonb DEFAULT '{"distribution": [70, 20, 10]}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bolao_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bolao_id uuid REFERENCES boloes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_status text NOT NULL DEFAULT 'pendente'
    CHECK (payment_status IN ('pendente', 'pago', 'isento')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bolao_id, user_id)
);

-- FK de participants para boloes (adicionada depois que boloes já existe)
ALTER TABLE participants ADD COLUMN IF NOT EXISTS active_bolao_id uuid;

DO $$ BEGIN
  ALTER TABLE participants
    ADD CONSTRAINT participants_active_bolao_id_fkey
    FOREIGN KEY (active_bolao_id) REFERENCES boloes(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- LEAGUES (legado, mantido para compatibilidade)
-- ========================================
CREATE TABLE IF NOT EXISTS leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS league_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid REFERENCES leagues(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(league_id, user_id)
);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE boloes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolao_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- Participants
DROP POLICY IF EXISTS "participants_select" ON participants;
CREATE POLICY "participants_select" ON participants FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "participants_insert" ON participants;
CREATE POLICY "participants_insert" ON participants FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "participants_update" ON participants;
CREATE POLICY "participants_update" ON participants FOR UPDATE TO authenticated USING (true);

-- Matches
DROP POLICY IF EXISTS "matches_select" ON matches;
CREATE POLICY "matches_select" ON matches FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "matches_admin_all" ON matches;
CREATE POLICY "matches_admin_all" ON matches FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM participants WHERE user_id = auth.uid() AND is_admin = true));

-- Predictions
DROP POLICY IF EXISTS "predictions_select" ON predictions;
CREATE POLICY "predictions_select" ON predictions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "predictions_insert" ON predictions;
CREATE POLICY "predictions_insert" ON predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "predictions_update" ON predictions;
CREATE POLICY "predictions_update" ON predictions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Goals
DROP POLICY IF EXISTS "goals_select" ON goals;
CREATE POLICY "goals_select" ON goals FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "goals_admin_all" ON goals;
CREATE POLICY "goals_admin_all" ON goals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM participants WHERE user_id = auth.uid() AND is_admin = true));

-- Boloes
DROP POLICY IF EXISTS "boloes_select" ON boloes;
CREATE POLICY "boloes_select" ON boloes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "boloes_insert" ON boloes;
CREATE POLICY "boloes_insert" ON boloes FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "boloes_update" ON boloes;
CREATE POLICY "boloes_update" ON boloes FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

-- Bolao members
DROP POLICY IF EXISTS "bolao_members_select" ON bolao_members;
CREATE POLICY "bolao_members_select" ON bolao_members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "bolao_members_insert" ON bolao_members;
CREATE POLICY "bolao_members_insert" ON bolao_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "bolao_members_update" ON bolao_members;
CREATE POLICY "bolao_members_update" ON bolao_members FOR UPDATE TO authenticated USING (true);

-- Leagues (legado)
DROP POLICY IF EXISTS "leagues_select" ON leagues;
CREATE POLICY "leagues_select" ON leagues FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "leagues_insert" ON leagues;
CREATE POLICY "leagues_insert" ON leagues FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "league_members_select" ON league_members;
CREATE POLICY "league_members_select" ON league_members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "league_members_insert" ON league_members;
CREATE POLICY "league_members_insert" ON league_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "league_members_update" ON league_members;
CREATE POLICY "league_members_update" ON league_members FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ========================================
-- VIEWS
-- ========================================

-- Ranking global
CREATE OR REPLACE VIEW ranking AS
SELECT
  p.user_id,
  p.name,
  p.payment_status,
  COALESCE(SUM(pr.points), 0) AS total_points,
  COALESCE(COUNT(pr.id) FILTER (WHERE pr.points = 10), 0) AS exact_scores,
  COALESCE(COUNT(pr.id) FILTER (WHERE pr.points = 5), 0) AS correct_results,
  MAX(pr.created_at) AS last_prediction_at
FROM participants p
LEFT JOIN predictions pr ON pr.user_id = p.user_id
GROUP BY p.user_id, p.name, p.payment_status;

GRANT SELECT ON ranking TO authenticated;

-- Tabela de grupos
CREATE OR REPLACE VIEW group_standings AS
SELECT
  m.group_name,
  team_data.team,
  team_data.iso,
  COUNT(*) FILTER (WHERE m.is_finished) AS played,
  COUNT(*) FILTER (WHERE m.is_finished AND (
    (team_data.is_home AND m.home_score > m.away_score) OR
    (NOT team_data.is_home AND m.away_score > m.home_score)
  )) AS won,
  COUNT(*) FILTER (WHERE m.is_finished AND m.home_score = m.away_score) AS drawn,
  COUNT(*) FILTER (WHERE m.is_finished AND (
    (team_data.is_home AND m.home_score < m.away_score) OR
    (NOT team_data.is_home AND m.away_score < m.home_score)
  )) AS lost,
  COALESCE(SUM(CASE WHEN team_data.is_home AND m.is_finished THEN m.home_score
                    WHEN NOT team_data.is_home AND m.is_finished THEN m.away_score ELSE 0 END), 0) AS goals_for,
  COALESCE(SUM(CASE WHEN team_data.is_home AND m.is_finished THEN m.away_score
                    WHEN NOT team_data.is_home AND m.is_finished THEN m.home_score ELSE 0 END), 0) AS goals_against,
  COALESCE(SUM(CASE WHEN team_data.is_home AND m.is_finished THEN m.home_score - m.away_score
                    WHEN NOT team_data.is_home AND m.is_finished THEN m.away_score - m.home_score ELSE 0 END), 0) AS goal_diff,
  (COUNT(*) FILTER (WHERE m.is_finished AND (
    (team_data.is_home AND m.home_score > m.away_score) OR
    (NOT team_data.is_home AND m.away_score > m.home_score)
  )) * 3 +
  COUNT(*) FILTER (WHERE m.is_finished AND m.home_score = m.away_score)) AS points
FROM matches m
CROSS JOIN LATERAL (
  VALUES (m.home_team, m.home_iso, true), (m.away_team, m.away_iso, false)
) AS team_data(team, iso, is_home)
WHERE m.stage = 'Fase de Grupos' AND m.group_name IS NOT NULL
GROUP BY m.group_name, team_data.team, team_data.iso;

GRANT SELECT ON group_standings TO authenticated;

-- Ranking por liga (legado)
CREATE OR REPLACE VIEW league_ranking AS
SELECT
  lm.league_id,
  p.user_id,
  p.name,
  COALESCE(SUM(pr.points), 0) AS total_points,
  COALESCE(COUNT(pr.id) FILTER (WHERE pr.points = 10), 0) AS exact_scores,
  COALESCE(COUNT(pr.id) FILTER (WHERE pr.points = 5), 0) AS correct_results
FROM league_members lm
JOIN participants p ON p.user_id = lm.user_id
LEFT JOIN predictions pr ON pr.user_id = lm.user_id
GROUP BY lm.league_id, p.user_id, p.name;

GRANT SELECT ON league_ranking TO authenticated;

-- Ranking por bolão
CREATE OR REPLACE VIEW bolao_ranking AS
SELECT
  bm.bolao_id,
  p.user_id,
  p.name,
  COALESCE(SUM(pr.points), 0) AS total_points,
  COALESCE(COUNT(pr.id) FILTER (WHERE pr.points = 10), 0) AS exact_scores,
  COALESCE(COUNT(pr.id) FILTER (WHERE pr.points = 5), 0) AS correct_results,
  MAX(pr.created_at) AS last_prediction_at,
  bm.payment_status
FROM bolao_members bm
JOIN participants p ON p.user_id = bm.user_id
LEFT JOIN predictions pr ON pr.user_id = bm.user_id
GROUP BY bm.bolao_id, p.user_id, p.name, bm.payment_status;

GRANT SELECT ON bolao_ranking TO authenticated;

-- Artilharia
CREATE OR REPLACE VIEW top_scorers AS
SELECT
  player_name,
  team,
  team_iso,
  COUNT(*) FILTER (WHERE NOT is_own_goal) AS goals,
  COUNT(*) FILTER (WHERE is_own_goal) AS own_goals
FROM goals
GROUP BY player_name, team, team_iso
ORDER BY goals DESC, player_name ASC;

GRANT SELECT ON top_scorers TO authenticated;

-- ========================================
-- TRIGGERS
-- ========================================

-- Cria participant automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO participants (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Calcula pontos dos palpites ao inserir/finalizar jogo
CREATE OR REPLACE FUNCTION calculate_match_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.is_finished = true AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    UPDATE predictions SET
      points = CASE
        WHEN home_score = NEW.home_score AND away_score = NEW.away_score THEN 10
        WHEN SIGN(home_score - away_score::numeric) = SIGN(NEW.home_score::numeric - NEW.away_score::numeric) THEN 5
        ELSE 0
      END
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_match_finished ON matches;
CREATE TRIGGER on_match_finished
  AFTER UPDATE OF is_finished, home_score, away_score ON matches
  FOR EACH ROW
  WHEN (NEW.is_finished = true)
  EXECUTE FUNCTION calculate_match_points();
