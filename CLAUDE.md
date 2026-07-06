# Linha Afetiva — Guia para Claude

Aplicativo web privado, single-user, para registrar e compreender uma linha do tempo afetiva. Sem cadastro público, sem multiusuário, sem analytics externos.

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind v4 + Drizzle ORM + SQLite (`better-sqlite3`) + Zod + `jose` (JWT) + `@node-rs/argon2` (hash de senha). Deploy: VM Oracle Linux, PM2, Caddy. Ver README.md para setup e deploy.

## Princípios do projeto

- **Incremental**: antes de implementar uma funcionalidade nova, definir estrutura, modelo de dados e estratégia técnica primeiro. Não pular direto para código sem alinhar a abordagem.
- **Simplicidade**: é um app pessoal para um único usuário. Evitar abstrações, camadas ou dependências que só fariam sentido em multiusuário/escala. Preferir a solução mais simples que resolve o problema.
- **Privacidade em primeiro lugar**: dados afetivos são sensíveis. Nunca adicionar telemetria, analytics de terceiros ou logging que exponha conteúdo pessoal (nomes, notas, tags) em texto plano fora do banco.
- **Preparado para evoluir**: o schema já modela tabelas para funcionalidades futuras (linha do tempo visual, gráficos, anexos, exportação, backups). Ao alterar o schema, considerar esse roadmap antes de tomar atalhos que exigiriam retrabalho.

## Arquitetura

Um único app Next.js, sem separação física entre frontend/backend — mas com camadas claras:

- `src/app/` — rotas e páginas. Server Components por padrão; `"use client"` só quando há estado/interatividade real (ex: formulários).
- `src/app/api/` — API routes, usadas apenas para ações disparadas do cliente (login, criar/editar registros). Leitura de dados em páginas server-side deve consultar `db` diretamente, sem passar por uma API.
- `src/lib/db/` — conexão Drizzle e schema. Fonte única de verdade do modelo de dados.
- `src/lib/auth/` — JWT, sessão, cookie httpOnly. Proteção dupla: `middleware.ts` (edge, redireciona sem cookie válido) + checagem de sessão no layout server-side de `/app`.
- `src/lib/validation/` — schemas Zod, compartilhados entre API routes e formulários.
- `scripts/` — tarefas de CLI (migração, criação de usuário inicial). Nunca expor essas ações como rota pública.

## Requisitos de plataforma

- **PWA**: o app deve ser instalável e usável tranquilamente em celulares. Requer `app/manifest.ts` (Web App Manifest nativo do Next 15) com ícones, nome, `theme_color`/`background_color` na paleta violeta, e um service worker enxuto para cache de assets estáticos. Priorizar solução manual e simples antes de considerar pacotes como `next-pwa` — manter poucas dependências.
- **Responsividade**: toda tela nova deve ser pensada mobile-first (testar em viewport pequena antes de expandir para desktop). Já usamos utilitários responsivos do Tailwind; manter o padrão.
- **Tema claro/escuro**: alternância manual entre claro/escuro, com detecção do tema do sistema (`prefers-color-scheme`) como padrão inicial. A preferência escolhida fica em `localStorage` (é preferência de dispositivo, não de conta — não precisa ir para o banco). Implementar com Tailwind `darkMode: "class"` + um client component/context pequeno para o toggle; evitar libs como `next-themes` a menos que resolvam de forma clara o flicker de hidratação.

## Convenções de código

- TypeScript `strict` já ativado — manter assim, não adicionar `any` sem necessidade real.
- Validar toda entrada externa (API routes, forms) com Zod antes de tocar no banco.
- Mensagens de erro para o usuário em português; nomes de variáveis, funções e commits em inglês, seguindo o que já existe no código.
- Paleta de UI em tons de roxo/lilás (`violet-*` do Tailwind já em uso) — manter consistência visual discreta e acolhedora nas novas telas.
- Rodar `npm run lint` e `npm run build` antes de considerar uma mudança pronta.
- Ao alterar `src/lib/db/schema.ts`, gerar migração com `npm run db:generate` e aplicar com `npm run db:migrate` — nunca editar o SQLite manualmente.

## O que evitar

- Não introduzir autenticação multiusuário, OAuth ou cadastro público — é uso exclusivamente pessoal.
- Não adicionar dependências pesadas (ORMs alternativos, frameworks de state management, UI kits completos) sem necessidade clara — o projeto preza por poucas dependências e fácil manutenção.
- Não commitar `.env`, `data/*.db` ou segredos — já cobertos pelo `.gitignore`, mas revisar antes de qualquer commit que toque configuração.
- Não quebrar a proteção de `/app/*`: qualquer rota nova sob essa árvore deve continuar coberta pelo middleware + checagem de sessão.

## Estado atual vs. próximos passos

Seguir a ordem abaixo. Ao concluir uma etapa, marcar com `[x]` antes de iniciar a próxima.

### Fundação (concluída)

- [x] Base Next.js + autenticação JWT + dashboard protegido
- [x] Schema inicial (`users`, `people`, `tags`, `personTags`, `timelineEvents`)
- [x] PWA: manifest + ícones + service worker (ver "Requisitos de plataforma")
- [x] Tema claro/escuro com toggle manual e detecção do sistema

### MVP

- [x] CRUD de pessoas: listagem em `/app/pessoas`, criar/editar/excluir registros (nome, origem, status, datas, como terminou, notas). Status: `active`/`paused`/`ended`; origem: lista fixa (Tinder, Grindr, Pessoalmente, Outro App)
- [x] Gestão de tags: criar/editar/excluir tags com cor (paleta fixa de 8 cores) em `/app/tags`, associação via chips no formulário da pessoa
- [x] Modelo de registros (acontecimentos): a unidade da linha do tempo é o registro (data + situação + tags + nota), não a pessoa. Pessoa = identidade (nome, origem), listada/editada em `/app/pessoas`; pode reaparecer com novos registros, geridos em `/app/pessoas/[id]`. `timelineEvents` ganhou `status`/`datePrecision`/`note`; tags migraram de `personTags` para `eventTags`. Situação/tags "atuais" da pessoa = as do registro mais recente. Datas com precisão (dia/mês/ano/aproximada). Origem ganhou "Espontâneo" e "Não informado"
- [x] Árvore cronológica como home (`/app`): estilo git tree — uma cor por pessoa (paleta fixa de 8 cores por hash do id), registros da mesma pessoa conectados por linha tracejada na cor dela (calculada no cliente via posição dos nós), nome + data + situação + tags visíveis, separadores de mês/ano, animação leve de entrada (respeita `prefers-reduced-motion`). Composer de registro rápido no topo (pessoa com autocomplete via `datalist` que cria na hora com origem "Não informado", data padrão hoje, situação, tags) — cadastro fluido, sem telas separadas
- [ ] Importação de dados: entrada em massa dos registros existentes (tabela markdown/CSV já mantida pelo usuário → pessoas + primeiro registro + tags; unificar nomes de tags divergentes do seed)

### Pós-MVP

- [ ] Página "Reflexões": texto livre editável para aprendizados e "o que procuro"
- [ ] Gráficos e estatísticas (padrões por tag, origem, duração)
- [ ] Anexos (fotos/arquivos ligados a pessoas ou eventos)
- [ ] Exportação dos dados
- [ ] Backups automáticos do SQLite
