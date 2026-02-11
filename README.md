# NextCheckout

Plataforma de checkout personalizável com construtor visual, suporte a PIX e domínios customizados.

## ✨ Funcionalidades

- **Construtor visual** — Monte seu checkout com arrastar e soltar
- **Pagamento PIX** — Integração nativa para pagamentos instantâneos
- **Domínios personalizados** — Configure seu próprio domínio por checkout
- **Dashboard** — Acompanhe vendas, checkouts e métricas
- **Temas customizáveis** — Cores, tipografia e layout ajustáveis

## 🛠 Tecnologias

| Categoria    | Stack                                      |
|-------------|---------------------------------------------|
| Frontend    | React 18, TypeScript, Vite 5                |
| UI          | Tailwind CSS, shadcn/ui, Radix UI           |
| Backend     | Node.js, Express 5                          |
| Banco/Dados | Supabase                                    |
| Formulários | React Hook Form, Zod                        |
| Drag & Drop | @dnd-kit                                    |

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) 9+

## 🚀 Instalação

```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd checkout-lovable

# Instale as dependências
npm install

# Configure as variáveis de ambiente (veja seção abaixo)
# Crie um arquivo .env com as variáveis necessárias

# Inicie o servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:5173`.

## ⚙️ Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase
ADMIN_EMAIL=admin@seudominio.com
```

- `ADMIN_EMAIL` — e-mail da conta admin com acesso total às estatísticas e vendas de todos os usuários.
- Para o servidor em produção, configure também as variáveis usadas em `server.cjs` (porta, CORS, etc.).

## 📜 Scripts

| Comando           | Descrição                         |
|-------------------|-----------------------------------|
| `npm run dev`     | Servidor de desenvolvimento       |
| `npm run build`   | Build de produção (Vite)          |
| `npm run build:dev` | Build em modo desenvolvimento   |
| `npm start`       | Inicia o servidor Node            |
| `npm run preview` | Preview do build local            |
| `npm run lint`    | Executa o ESLint                  |
| `npm test`        | Executa os testes (Vitest)        |

## 📦 Deploy

O projeto pode ser implantado em plataformas como Railway, Vercel, Render, etc. O build utiliza `npm install` e `package-lock.json`. Após o build do frontend, use `npm start` para iniciar o servidor Express.

## 📁 Estrutura do projeto

```
├── src/
│   ├── components/     # Componentes React
│   │   ├── admin/      # Layout e rotas protegidas
│   │   ├── builder/    # Construtor de checkout
│   │   ├── checkout/   # Componentes do checkout
│   │   └── ui/         # Componentes shadcn/ui
│   ├── contexts/       # Contextos React
│   ├── hooks/          # Hooks customizados
│   ├── integrations/   # Integrações (Supabase)
│   ├── lib/            # Utilitários
│   ├── pages/          # Páginas e rotas
│   └── types/          # Tipos TypeScript
├── public/             # Assets estáticos
├── server.cjs          # Servidor Express
└── vite.config.ts      # Configuração do Vite
```

## 📄 Licença

Projeto privado.
