# Galeria CEAC

Site de galeria de fotos e vídeos para a CEAC (Comunidade Evangélica Amor Cristão).

## Estrutura do projeto

```
├── index.html              → página única do site
├── css/style.css           → identidade visual
├── js/
│   ├── config.js            → credenciais do Supabase (edite aqui!)
│   ├── supabaseClient.js     → cria o cliente Supabase
│   ├── toast.js               → notificações
│   ├── auth.js                 → login/logout de admin
│   ├── gallery.js               → navegação e exibição das pastas/mídia
│   ├── lightbox.js               → visualizador de foto/vídeo em destaque
│   ├── admin.js                    → criar pasta, upload, editar, excluir
│   └── app.js                       → liga tudo (eventos de UI)
├── assets/logo.png           → logo da CEAC
└── supabase/schema.sql       → script SQL de configuração do banco
```

## Passo 1 — Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e crie um novo projeto.
2. Vá em **SQL Editor** → **New query**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
   - Isso cria as tabelas `folders` e `media`, ativa as políticas de segurança (RLS) e cria o bucket de Storage `media`.
3. Vá em **Authentication > Users > Add user** e crie a conta do(s) administrador(es) (e-mail + senha). Não existe cadastro público — só você cria essas contas.

## Passo 2 — Conectar o site ao Supabase

Abra `js/config.js` e substitua pelos dados do seu projeto (em **Project Settings > API**):

```js
const SUPABASE_CONFIG = {
  url: "https://SEU-PROJETO.supabase.co",
  anonKey: "SUA-ANON-KEY-AQUI",
  mediaBucket: "media"
};
```

A `anonKey` é pública por natureza (ela já vai para o navegador de qualquer visitante) — a segurança real é garantida pelas políticas de RLS já configuradas no `schema.sql`, que só permitem escrita para usuários autenticados.

## Passo 3 — Testar localmente

Como o projeto é HTML/CSS/JS puro, basta servir a pasta com qualquer servidor estático, por exemplo:

```bash
npx serve .
```

ou a extensão "Live Server" do VS Code. (Abrir o `index.html` direto com `file://` pode ter problemas de CORS com o Supabase — prefira sempre um servidor local.)

## Passo 4 — Deploy na Vercel

1. Suba este projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), clique em **Add New > Project** e importe o repositório.
3. Como é um projeto estático, não é necessário configurar build command — a Vercel detecta automaticamente. Se pedir, deixe o **Output Directory** como raiz (`.`).
4. Clique em **Deploy**. Pronto — o site estará no ar.

## Como usar

### Visitante comum
- Não precisa fazer login.
- Navega pelas pastas, visualiza fotos/vídeos e pode baixá-los clicando na mídia e depois em **Baixar**.

### Administrador
- Clique no ícone discreto de cadeado no canto superior direito do cabeçalho para entrar.
- Após o login, aparecem os botões **Nova pasta** e **Adicionar mídia** na barra de navegação, além dos ícones de editar/excluir ao passar o mouse sobre cada pasta ou mídia.
- **Nova pasta**: cria uma pasta (ou subpasta, se você estiver dentro de outra pasta).
- **Adicionar mídia**: selecione uma ou mais fotos/vídeos, defina um título para cada um e envie.
- **Editar** (ícone de lápis): altera o título e, opcionalmente, substitui o arquivo.
- **Excluir** (ícone de lixeira): remove o item (ou a pasta e tudo dentro dela) após confirmação.

## Personalização

- Cores, fontes e espaçamentos ficam centralizados em `:root` no topo de `css/style.css` (variáveis `--bg`, `--gold`, `--cream`, etc.).
- O texto do topo (hero) e a citação estão diretamente no `index.html`, dentro da seção `<section class="hero">`.
