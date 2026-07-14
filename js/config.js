// =========================================================
// CONFIGURAÇÃO DO SUPABASE
// Substitua os valores abaixo pelos dados do SEU projeto Supabase.
// Você encontra isso em: Supabase Dashboard > Project Settings > API
//
// A "anon key" é pública por design — não é um segredo.
// A segurança real vem das políticas de RLS (veja supabase/schema.sql).
// =========================================================

const SUPABASE_CONFIG = {
  url: "https://SEU-PROJETO.supabase.co",
  anonKey: "SUA-ANON-KEY-AQUI",
  mediaBucket: "media" // nome do bucket de Storage criado no Supabase
};
