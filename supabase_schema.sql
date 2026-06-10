-- ============================================================
--  CONTROLE DA QUALIDADE — DRIFTS
--  Esquema do banco para Supabase (PostgreSQL)
--  Rode este script em: Supabase -> SQL Editor -> New query
-- ============================================================

-- ----------------------------------------------------------------
-- Tabela: drifts
-- Cadastro dos drifts (código EC e diâmetro)
-- ----------------------------------------------------------------
create table if not exists public.drifts (
  id          uuid primary key default gen_random_uuid(),
  ec          text not null unique,
  diametro    numeric not null,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- Tabela: responsaveis
-- Cadastro dos responsáveis pela medição (PN e nome)
-- ----------------------------------------------------------------
create table if not exists public.responsaveis (
  id          uuid primary key default gen_random_uuid(),
  pn          text not null unique,
  nome        text not null,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- Tabela: movimentacoes
-- Registros de saída e entrada (diferenciados pela coluna `tipo`)
-- Cada registro guarda as 9 medições e o valor médio calculado.
-- ----------------------------------------------------------------
create table if not exists public.movimentacoes (
  id                uuid primary key default gen_random_uuid(),
  tipo              text not null check (tipo in ('saida', 'entrada')),
  ec                text not null,
  diametro          numeric,
  ordem_producao    text,            -- preenchido apenas nas saídas; nulo nas entradas

  pe_1              numeric,
  pe_2              numeric,
  pe_3              numeric,
  centro_1          numeric,
  centro_2          numeric,
  centro_3          numeric,
  ponta_1           numeric,
  ponta_2           numeric,
  ponta_3           numeric,

  valor_medio       numeric,
  valor_min         numeric,
  valor_max         numeric,
  responsavel_pn    text,
  responsavel_nome  text,
  data_hora         timestamptz not null,
  created_at        timestamptz not null default now()
);

create index if not exists idx_mov_ec on public.movimentacoes (ec);
create index if not exists idx_mov_ordem on public.movimentacoes (ordem_producao);
create index if not exists idx_mov_tipo on public.movimentacoes (tipo);

-- ============================================================
--  POLÍTICAS DE ACESSO (RLS)
--  A aplicação usa a chave pública (anon) no navegador.
--  As políticas abaixo liberam leitura e escrita para a chave anon
--  — adequado para uso interno. Para restringir, implemente Auth
--  e troque as políticas por regras baseadas em auth.uid().
-- ============================================================
alter table public.drifts        enable row level security;
alter table public.responsaveis  enable row level security;
alter table public.movimentacoes enable row level security;

create policy "acesso_total_drifts"
  on public.drifts for all
  using (true) with check (true);

create policy "acesso_total_responsaveis"
  on public.responsaveis for all
  using (true) with check (true);

create policy "acesso_total_movimentacoes"
  on public.movimentacoes for all
  using (true) with check (true);

-- ============================================================
--  (OPCIONAL) Dados de exemplo para testar rapidamente
-- ============================================================
-- insert into public.drifts (ec, diametro) values
--   ('EC-1001', 12.7),
--   ('EC-1002', 15.875),
--   ('EC-1003', 19.05);
--
-- insert into public.responsaveis (pn, nome) values
--   ('PN-001', 'Ana Souza'),
--   ('PN-002', 'Carlos Lima'),
--   ('PN-003', 'Marina Reis');
