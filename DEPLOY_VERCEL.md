# Deploy do Frontend na Vercel

Guia passo a passo para subir o **frontend** do NextCheckout na Vercel. O backend continua no Railway.

---

## Passo 1: Preparar o repositório

1. Certifique-se de que o código está no **GitHub**, **GitLab** ou **Bitbucket**.
2. Faça commit e push das alterações recentes (incluindo o `vercel.json`).

```bash
git add .
git commit -m "Config para deploy na Vercel"
git push
```

---

## Passo 2: Conectar na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login (use sua conta do GitHub/GitLab).
2. Clique em **"Add New..."** → **"Project"**.
3. Importe o repositório do NextCheckout (conecte o GitHub se ainda não conectou).
4. Selecione o repositório e clique em **Import**.

---

## Passo 3: Configurar o projeto

A Vercel deve detectar automaticamente o **Vite**. Confirme:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

Se quiser, use o **Root Directory** como `.` (raiz do projeto).

---

## Passo 4: Variáveis de ambiente

Em **Environment Variables**, adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `VITE_SUPABASE_URL` | `https://qmdgseggtdtamtxcwqjx.supabase.co` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | `sua_anon_key` | Production, Preview |
| `VITE_API_URL` | `https://api.nextcheckoutbr.com` | Production, Preview |
| `VITE_APP_HOST` | `localhost,app.nextcheckoutbr.com` | Production, Preview |
| `VITE_APP_CANONICAL_HOST` | `app.nextcheckoutbr.com` | Production, Preview |

> **Importante:** substitua `sua_anon_key` pela chave anon do Supabase (a mesma do `.env`).

---

## Passo 5: Deploy

1. Clique em **Deploy**.
2. Aguarde o build e o deploy.
3. A URL será algo como `seu-projeto.vercel.app`.

---

## Passo 6: Domínio customizado (app.nextcheckoutbr.com)

1. No projeto, vá em **Settings** → **Domains**.
2. Clique em **Add** e informe `app.nextcheckoutbr.com`.
3. Siga as instruções de DNS (CNAME ou A record).
4. Aguarde a validação e o provisionamento de SSL.

---

## Passo 7: Domínios de checkouts — adição automática

Os domínios são adicionados automaticamente na Vercel quando o usuário salva um domínio personalizado no painel. Configure no **backend (Railway)**:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `VERCEL_API_TOKEN` | token da Vercel | Token em [Vercel → Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_PROJECT_ID` | Project ID ou nome | Use o **Project ID** (Settings → Project ID, ex: `prj_pF5jalAuon01nZWYdbm6u9X1EYgU`) ou o nome `next-checkout` |
| `VERCEL_TEAM_ID` | (opcional) | ID do time, se usar conta Team |
| `APP_CANONICAL_HOST` | `cname.vercel-dns.com` | Valor CNAME exibido ao adicionar domínio na Vercel (para verificação) |

**Como obter o token:**
1. Acesse [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Crie um token com permissão **Full Access** ou **Domains**
3. Cole em `VERCEL_API_TOKEN` no Railway

---

## CORS no backend (Railway)

O backend já está configurado para aceitar requisições de `https://app.nextcheckoutbr.com`. Se usar outro domínio na Vercel, inclua-o em `FRONTEND_URL` no Railway:

```
FRONTEND_URL=https://app.nextcheckoutbr.com,https://seu-projeto.vercel.app
```

---

## Estrutura final

| Serviço | URL | Hosting |
|---------|-----|---------|
| Frontend | app.nextcheckoutbr.com | Vercel |
| Backend API | api.nextcheckoutbr.com | Railway |
| Checkouts públicos | app.nextcheckoutbr.com/c/:slug | Vercel |
| Domínios personalizados | pay.cliente.com/c/:slug | Vercel (domínio adicionado manualmente) |
