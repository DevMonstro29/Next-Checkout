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

## Passo 7: Domínios de checkouts (ex: pay.pagamentofaciloficial.com)

1. Em **Settings** → **Domains**, adicione cada domínio de checkout.
2. A Vercel exibe o valor CNAME (ex: `cname.vercel-dns.com`).
3. O cliente configura no DNS: `pay.cliente.com` → CNAME → valor indicado pela Vercel.
4. No **backend (Railway)**, defina `APP_CANONICAL_HOST` como o valor CNAME da Vercel (ex: `cname.vercel-dns.com`) para a verificação de domínio funcionar.

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
