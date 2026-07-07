#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APP_NAME="linha-afetiva"
PM2_CONFIG="ecosystem.config.cjs"
GIT_BRANCH="${DEPLOY_GIT_BRANCH:-main}"

log()  { echo "[deploy] $*"; }
warn() { echo "[deploy] AVISO: $*" >&2; }
die()  { echo "[deploy] ERRO: $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Uso: scripts/deploy.sh [opções]

Opções:
  --git-pull   Atualiza o código com git fetch + reset --hard origin/main
  -h, --help   Mostra esta ajuda

Variáveis de ambiente:
  DEPLOY_USER_EMAIL=...           Cria usuário na primeira vez (opcional)
  DEPLOY_USER_PASSWORD=...        Senha do usuário inicial (opcional)
EOF
}

for arg in "$@"; do
  case "$arg" in
    --git-pull) GIT_PULL=1 ;;
    -h|--help) usage; exit 0 ;;
    *) die "Opção desconhecida: $arg (use --help)" ;;
  esac
done

command -v pnpm >/dev/null 2>&1 || die "pnpm não encontrado. Rode: corepack enable"
command -v pm2  >/dev/null 2>&1 || die "pm2 não encontrado. Instale com: npm install -g pm2"

if [[ "${GIT_PULL:-0}" == "1" ]]; then
  command -v git >/dev/null 2>&1 || die "git não encontrado"
  [[ -d .git ]] || die "--git-pull exige um repositório git"
  log "Atualizando código (origin/${GIT_BRANCH})..."
  git fetch origin
  git reset --hard "origin/${GIT_BRANCH}"
  log "Commit atual: $(git log -1 --oneline)"
fi

if [[ ! -f .env ]]; then
  [[ -f .env.example ]] || die ".env não existe e .env.example não foi encontrado"
  cp .env.example .env
  die ".env criado a partir de .env.example — edite APP_SECRET e rode o deploy novamente"
fi

if grep -q "gere-um-segredo" .env 2>/dev/null; then
  die "APP_SECRET ainda está com o valor padrão em .env"
fi

mkdir -p data

log "Instalando dependências..."
if [[ -f pnpm-lock.yaml ]]; then
  pnpm install --frozen-lockfile
else
  warn "pnpm-lock.yaml ausente; usando pnpm install sem lockfile congelado"
  pnpm install
fi

log "Aplicando migrações..."
pnpm run db:migrate

log "Aplicando migração do modelo de relacionamento (idempotente)..."
pnpm run db:migrate-relationship-model

if [[ -n "${DEPLOY_USER_EMAIL:-}" && -n "${DEPLOY_USER_PASSWORD:-}" ]]; then
  log "Tentando criar usuário inicial..."
  pnpm run user:create -- "$DEPLOY_USER_EMAIL" "$DEPLOY_USER_PASSWORD" || warn "Usuário não criado (talvez já exista)"
elif command -v sqlite3 >/dev/null && [[ -f data/linha-afetiva.db ]]; then
  user_count="$(sqlite3 data/linha-afetiva.db "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")"
  if [[ "$user_count" == "0" ]]; then
    warn "Nenhum usuário no banco. Rode: pnpm user:create"
  fi
fi

log "Build de produção..."
pnpm run build

log "Copiando assets para standalone..."
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

sqlite_native=".next/standalone/node_modules/better-sqlite3/build/Release/better_sqlite3.node"
[[ -f "$sqlite_native" ]] || die "better_sqlite3.node não encontrado no standalone. Tente: rm -rf node_modules && pnpm install && pnpm run build"

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  log "Reiniciando aplicação..."
  pm2 restart "$APP_NAME"
else
  log "Primeira subida com PM2..."
  pm2 start "$PM2_CONFIG"
  pm2 save
  warn "Se o servidor reiniciar, configure persistência: pm2 startup && pm2 save"
fi

log "Deploy concluído."
pm2 status "$APP_NAME"