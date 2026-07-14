// Cria o cliente Supabase (usa o SDK carregado via CDN no index.html)
const sb = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
