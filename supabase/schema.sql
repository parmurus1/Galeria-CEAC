-- =========================================================
-- CEAC — Galeria — Setup do Supabase
-- Execute este arquivo inteiro no SQL Editor do seu projeto
-- Supabase (Dashboard > SQL Editor > New query > colar > Run).
-- =========================================================

-- Extensão para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- TABELA: folders (pastas e subpastas)
-- ---------------------------------------------------------
create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references folders(id) on delete cascade,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- ---------------------------------------------------------
-- TABELA: media (fotos e vídeos)
-- ---------------------------------------------------------
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references folders(id) on delete cascade,
  title text not null,
  type text not null check (type in ('image', 'video')),
  storage_path text not null,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create index if not exists idx_folders_parent on folders(parent_id);
create index if not exists idx_media_folder on media(folder_id);

-- ---------------------------------------------------------
-- ROW LEVEL SECURITY
-- Leitura: pública (qualquer visitante pode ver a galeria)
-- Escrita: apenas usuários autenticados (ou seja, admins,
-- já que não existe cadastro público — só contas criadas
-- manualmente por você no painel do Supabase em
-- Authentication > Users > Add user)
-- ---------------------------------------------------------
alter table folders enable row level security;
alter table media enable row level security;

create policy "Leitura pública de pastas"
  on folders for select
  using (true);

create policy "Admins podem criar pastas"
  on folders for insert
  with check (auth.role() = 'authenticated');

create policy "Admins podem editar pastas"
  on folders for update
  using (auth.role() = 'authenticated');

create policy "Admins podem excluir pastas"
  on folders for delete
  using (auth.role() = 'authenticated');

create policy "Leitura pública de mídia"
  on media for select
  using (true);

create policy "Admins podem criar mídia"
  on media for insert
  with check (auth.role() = 'authenticated');

create policy "Admins podem editar mídia"
  on media for update
  using (auth.role() = 'authenticated');

create policy "Admins podem excluir mídia"
  on media for delete
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------
-- STORAGE — bucket "media"
-- Crie o bucket manualmente em Storage > New bucket
--   nome: media
--   marcar como "Public bucket": SIM
-- Depois rode as policies abaixo (ou crie pela interface).
-- ---------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Leitura pública do bucket media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Admins podem enviar arquivos"
  on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

create policy "Admins podem atualizar arquivos"
  on storage.objects for update
  using (bucket_id = 'media' and auth.role() = 'authenticated');

create policy "Admins podem excluir arquivos"
  on storage.objects for delete
  using (bucket_id = 'media' and auth.role() = 'authenticated');

-- =========================================================
-- Fim do setup. Próximo passo: criar a conta de admin em
-- Authentication > Users > Add user (e-mail + senha).
-- =========================================================
