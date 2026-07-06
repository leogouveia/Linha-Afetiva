# Linha Afetiva

Aplicativo pessoal e privado para registrar e compreender experiências afetivas. Esta primeira entrega inclui a base Next.js, banco SQLite persistente, autenticação por JWT e um dashboard protegido.

## Requisitos

- Node.js 20 ou superior
- npm
- PM2 e Caddy apenas no servidor de produção

## Instalação e desenvolvimento

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run user:create
npm run dev
```

No Windows/PowerShell, copie o ambiente com `Copy-Item .env.example .env`. Antes de iniciar, substitua `APP_SECRET` por um segredo aleatório de no mínimo 32 caracteres. O app estará em `http://localhost:3000`.

O script de usuário também aceita argumentos para automação local: `npm run user:create -- email@exemplo.com senha-segura`. Evite essa forma em servidores compartilhados porque a senha pode ficar no histórico do terminal.

## Banco de dados

Por padrão, o SQLite persistente fica em `data/linha-afetiva.db` e não é versionado. Para alterar o schema:

```bash
npm run db:generate
npm run db:migrate
```

## Validação e build

```bash
npm run lint
npm run build
npm start
```

## Autenticação

Não há cadastro público. O usuário inicial é criado somente pela CLI. Após o login, o servidor grava um JWT HS256 em cookie `httpOnly`, `sameSite=lax`, com duração de 7 dias e `secure` em produção. O middleware e o layout server-side protegem toda a árvore `/app`.

## Deploy com PM2 e Caddy

1. Instale dependências, configure `.env`, rode as migrações e crie o usuário.
2. Execute `npm run build`.
3. Copie `public` (quando existir) para `.next/standalone/public` e `.next/static` para `.next/standalone/.next/static`.
4. Inicie com `pm2 start ecosystem.config.cjs` e salve com `pm2 save`.
5. Adapte `Caddyfile.example` ao domínio, instale-o no Caddy e recarregue o serviço.

O Caddy fornece HTTPS automaticamente para um domínio público apontado para o servidor. Mantenha o processo Next.js ouvindo apenas em `127.0.0.1`.

## Estrutura atual

- `src/app/login`: tela pública única
- `src/app/app`: área privada e dashboard
- `src/app/api/auth`: login e logout
- `src/lib/auth`: JWT e sessão
- `src/lib/db`: conexão Drizzle e schema
- `src/lib/validation`: schemas Zod
- `scripts`: migração e criação do usuário inicial

As telas de pessoas, tags e importação pertencem à próxima etapa do MVP; as tabelas iniciais já estão modeladas para recebê-las.
