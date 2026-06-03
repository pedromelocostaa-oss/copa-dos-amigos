-- Participantes
create table participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  name text not null,
  email text not null,
  avatar_url text,
  payment_status text not null default 'pendente' check (payment_status in ('pendente', 'pago', 'isento')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Jogos
create table matches (
  id uuid primary key default gen_random_uuid(),
  home_team text not null,
  away_team text not null,
  home_flag text not null default '🏳️',
  away_flag text not null default '🏳️',
  match_date timestamptz not null,
  stage text not null default 'Fase de Grupos',
  home_score int,
  away_score int,
  is_finished boolean not null default false,
  created_at timestamptz not null default now()
);

-- Palpites
create table predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  match_id uuid references matches(id) on delete cascade,
  home_score int not null,
  away_score int not null,
  points int not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, match_id)
);

-- Ligas
create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Membros das ligas
create table league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(league_id, user_id)
);

-- View de ranking global
create or replace view ranking as
select
  p.user_id,
  p.name,
  p.payment_status,
  coalesce(sum(pr.points), 0) as total_points,
  coalesce(count(pr.id) filter (where pr.points = 10), 0) as exact_scores,
  coalesce(count(pr.id) filter (where pr.points = 5), 0) as correct_results,
  max(pr.created_at) as last_prediction_at
from participants p
left join predictions pr on pr.user_id = p.user_id
group by p.user_id, p.name, p.payment_status;

-- Trigger: criar participante ao cadastrar usuario
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into participants (user_id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Trigger: calcular pontos após resultado
create or replace function calculate_prediction_points()
returns trigger as $$
begin
  if new.is_finished and (old.is_finished = false or old.is_finished is null) then
    update predictions
    set points = case
      when home_score = new.home_score and away_score = new.away_score then 10
      when sign(home_score - away_score) = sign(new.home_score - new.away_score) then 5
      else 0
    end
    where match_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_match_finished
  after update on matches
  for each row execute procedure calculate_prediction_points();

-- RLS
alter table participants enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table leagues enable row level security;
alter table league_members enable row level security;

create policy "Participantes visíveis para autenticados" on participants for select to authenticated using (true);
create policy "Admin pode atualizar participantes" on participants for update to authenticated using (true);
create policy "Jogos visíveis para autenticados" on matches for select to authenticated using (true);
create policy "Palpites visíveis para autenticados" on predictions for select to authenticated using (true);
create policy "Usuário gerencia seus palpites" on predictions for insert to authenticated with check (auth.uid() = user_id);
create policy "Usuário atualiza seus palpites" on predictions for update to authenticated using (auth.uid() = user_id);
create policy "Ligas visíveis para autenticados" on leagues for select to authenticated using (true);
create policy "Usuário cria liga" on leagues for insert to authenticated with check (auth.uid() = owner_id);
create policy "Membros visíveis para autenticados" on league_members for select to authenticated using (true);
create policy "Usuário entra em liga" on league_members for insert to authenticated with check (auth.uid() = user_id);
