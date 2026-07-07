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

Assume uma VM Oracle Linux (ou outra distro baseada em RHEL — comandos usam `dnf`/`firewalld`, ajuste se sua imagem for diferente) acessada via SSH.

### 1. Preparar a VM (uma vez)

```bash
sudo dnf update -y
sudo dnf install -y git 'dnf-command(copr)'

# Ferramentas de build: o better-sqlite3 é um módulo nativo e pode precisar
# compilar do zero durante o npm ci — principalmente em instâncias ARM
# (Ampere A1, comum no free tier da Oracle), onde nem sempre há binário
# pré-compilado disponível. Instale mesmo que sua instância seja x86.
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3

# Node.js — escolha uma versão LTS (20 ou 22; evite versões "Current" como a
# 24 em servidor, priorize estabilidade)
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs

sudo npm install -g pm2
```

### 2. Obter o código

Prefira `git clone`/`git pull`: garante que `node_modules` seja instalado direto na VM. Um `node_modules` copiado de outra máquina não funciona — o binário nativo do SQLite é específico de plataforma/arquitetura.

```bash
git clone <url-do-seu-repositorio-privado> linha-afetiva
cd linha-afetiva
```

Sem um remote git, copie os arquivos com `rsync`, **excluindo `node_modules`, `.next` e `data`**:

```bash
rsync -av --exclude node_modules --exclude .next --exclude data ./ usuario@vm:/caminho/linha-afetiva/
```

### 3. Configurar

```bash
npm ci
cp .env.example .env
```

Edite o `.env`: gere um `APP_SECRET` aleatório (`openssl rand -base64 32`) e confirme o `DATABASE_URL`. **Não** rode `npm ci --omit=dev` — o build do próximo passo precisa de `typescript`, `tailwindcss` e `drizzle-kit`, que são devDependencies.

```bash
npm run db:migrate
npm run user:create
```

### 4. Build

```bash
npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
```

Confira que o binário nativo do SQLite foi incluído no output standalone antes de seguir:

```bash
ls .next/standalone/node_modules/better-sqlite3/build/Release/
```

Se `better_sqlite3.node` não aparecer aí, o processo vai falhar ao subir — limpe e reinstale (`rm -rf node_modules && npm ci`) e rode o build de novo.

### 5. PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # copie e rode o comando que ele imprimir, com sudo
```

`ecosystem.config.cjs` fixa `cwd` na raiz do projeto, então `data/linha-afetiva.db` resolve sempre no mesmo lugar onde as migrações rodaram, não importa de onde o `pm2 start` seja chamado.

### 6. Firewall — dois níveis, os dois precisam estar liberados

No console da Oracle Cloud: **VCN → Security List (ou NSG) da subnet** → regra de ingresso para as portas 80 e 443 (TCP), origem `0.0.0.0/0`. É fácil esquecer essa camada porque ela é separada do firewall do sistema operacional.

Na própria VM (`firewalld`, ativo por padrão no Oracle Linux):

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 7. DNS

Aponte o registro A do domínio para o IP público da VM **antes** do próximo passo — o Caddy tenta emitir o certificado Let's Encrypt assim que sobe, e isso falha (com retentativas) se o domínio ainda não resolver para a VM.

### 8. Caddy

```bash
sudo dnf copr enable -y @caddy/caddy
sudo dnf install -y caddy
sudo cp Caddyfile.example /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile   # troque pelo seu domínio
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```

O Caddy fornece HTTPS automaticamente para o domínio apontado para o servidor. Mantenha o processo Next.js ouvindo apenas em `127.0.0.1` (já configurado em `ecosystem.config.cjs`).

### 9. Checagem final

Acesse `https://seudominio.com`, faça login com o usuário criado no passo 3 e confirme que a árvore cronológica carrega.

## Atualizando uma versão já publicada

```bash
./scripts/deploy.sh --git-pull
```

Ou, se o código já estiver atualizado:

```bash
./scripts/deploy.sh
```

O script instala dependências com pnpm, aplica migrações do schema (`db:migrate`), roda a migração idempotente do modelo de relacionamento (`db:migrate-relationship-model`), faz o build standalone e reinicia o PM2.

## Modelo de dados: pessoa, evento e tags

Uma **pessoa** é a identidade (nome, origem, foto) mais um resumo da relação: `currentStatus`, início/término, como terminou e notas gerais — campos editados diretamente na tela da pessoa, não derivados automaticamente (exceto `currentStatus`, ver abaixo).

Um **registro (evento)** é um acontecimento específico: data, título, tipo, canal, local, tom emocional, resultado e status depois do evento. Cada pessoa acumula vários registros ao longo do tempo.

**Tags têm escopo**: `relationship` (explicam a dinâmica da pessoa, ex. `potencial-relacionamento`), `event` (explicam o acontecimento, ex. `briga`), ou `both` quando o escopo não é óbvio. Tags de relação ficam em `personTags`; tags de evento ficam em `eventTags` — são independentes, a mesma tag pode aparecer nas duas se o escopo for `both`.

**Sincronização de status**: ao salvar um evento (criar ou editar), se o status escolhido não for "Indefinido", `people.currentStatus` é atualizado com esse valor. Deixar "Indefinido" nunca altera o status atual da pessoa. Não há verificação de "é o evento mais recente" nem reversão ao excluir um evento — regra deliberadamente simples.

Essa separação (pessoa/evento/tags) substituiu um modelo anterior onde tudo — status, tags, notas — vivia só no evento. A migração que fez essa transição (`scripts/migrate-relationship-model.ts`) roda uma vez, é idempotente, e:
- Classifica as tags já existentes por escopo (lista fixa de tags conhecidamente de relação/evento; o resto cai em `both`).
- Copia as tags do registro mais recente de cada pessoa para `personTags`, só para preservar o "resumo" que já existia.
- Preenche `currentStatus` de cada pessoa com o status do registro mais recente.

Ao atualizar um deploy já publicado que ainda não passou por essa mudança, o `scripts/deploy.sh` já executa isso automaticamente após `db:migrate`. Para rodar manualmente:

```bash
pnpm run db:migrate-relationship-model
```

## Estrutura atual

- `src/app/login`: tela pública única
- `src/app/app`: área privada, dashboard/timeline, pessoas e tags
- `src/app/api`: rotas de auth, pessoas, eventos e tags
- `src/lib/auth`: JWT e sessão
- `src/lib/db`: conexão Drizzle e schema
- `src/lib/validation`: schemas Zod
- `scripts`: migração, migração do modelo pessoa/evento, seed de tags, importação em massa, criação/reset de usuário
