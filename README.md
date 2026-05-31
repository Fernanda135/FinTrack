# FinTrack 💰

> Aplicativo de finanças pessoais multiusuário — backend REST seguro em **NestJS + Prisma + PostgreSQL** e app mobile em **Expo / React Native**.

O FinTrack permite que cada usuário acompanhe **saldo consolidado**, **receitas**, **gastos**, **contas**, **categorias**, **orçamentos** e o **histórico completo de transações**. Toda informação é por usuário, autenticada via JWT (access + refresh com rotação), e os valores monetários nunca trafegam como `float` — são armazenados como `Decimal(14,2)` no banco.

- 🎨 **Design Figma**: [Clique aqui](https://www.figma.com/design/77gDUrn6DW6sX9r86Ryk1l/FinTrack?node-id=94-274&t=XgoOvWY6sQGq3rbU-1)
- 📄 **Documentação**: [Clique aqui](https://docs.google.com/document/d/1CO_u75NRPYIzsFCykFXftyeKxgwweAp445R1df1CYHU/edit?usp=sharing)
- 🟡 **Status**: em desenvolvimento

---

## Índice

- [Arquitetura geral](#arquitetura-geral)
- [Stack tecnológica](#stack-tecnológica)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Backend](#backend)
  - [Configuração e infraestrutura](#configuração-e-infraestrutura)
  - [Modelo de dados (Prisma)](#modelo-de-dados-prisma)
  - [Inicialização e segurança](#inicialização-e-segurança)
  - [Módulos de domínio](#módulos-de-domínio)
  - [Testes do backend](#testes-do-backend)
- [Frontend](#frontend)
  - [Configuração](#configuração-frontend)
  - [Camada de API](#camada-de-api)
  - [Navegação e autenticação](#navegação-e-autenticação)
  - [Telas](#telas)
  - [Hooks](#hooks)
  - [Componentes](#componentes)
  - [Sincronização de dados](#sincronização-de-dados)
- [Design system / identidade visual](#design-system--identidade-visual)
- [Como rodar](#como-rodar)

---

## Arquitetura geral

```
┌─────────────────────────────┐         HTTPS / JSON          ┌──────────────────────────────┐
│   App Expo / React Native   │  ───────────────────────────► │       API NestJS (/api)        │
│                             │   Authorization: Bearer <jwt> │                                │
│  expo-router · Context API  │  ◄─────────────────────────── │  Auth · Accounts · Categories  │
│  fetch client + refresh     │      access / refresh token   │  Transactions · Budgets · Dash │
└─────────────────────────────┘                               └──────────────┬─────────────────┘
                                                                              │  Prisma 6
                                                                              ▼
                                                                 ┌─────────────────────────┐
                                                                 │  PostgreSQL 16 (Docker)  │
                                                                 │  Decimal(14,2) p/ moeda  │
                                                                 └─────────────────────────┘
```

**Princípios de arquitetura** (definidos no plano TDD em `docs/superpowers/plans/2026-05-29-fintrack-backend.md`):

- **Um módulo NestJS por entidade de domínio** (auth, accounts, categories, transactions, budgets, dashboard, users).
- **Tudo escopado ao usuário autenticado** — nenhuma query roda sem `userId`.
- **A tabela de transações é a única fonte de verdade.** Campos agregados (`categoria.valor`, `orcamento.gasto`, totais do dashboard) são **derivados em tempo de consulta** via `groupBy`/`aggregate`, nunca duplicados.
- **Saldos de conta são mantidos transacionalmente** a cada escrita (`prisma.$transaction`): uma `RECEITA` incrementa o saldo, uma `DESPESA` decrementa; updates revertem o delta antigo e aplicam o novo.
- **Dinheiro sempre como `Decimal(14,2)`** — os helpers `toDecimal`/`toNumber` em `src/common/money.ts` evitam drift de ponto flutuante.
- **JWT curto + refresh rotativo** — o hash do refresh atual fica salvo no usuário (`refreshHash`), permitindo invalidação e detecção de reuso.

---

## Stack tecnológica

| Camada | Tecnologias |
|---|---|
| **Backend** | Node ≥ 20 · TypeScript 5.7 · NestJS 11 · Prisma 6 · PostgreSQL 16 · Passport-JWT · Argon2 · Helmet · `@nestjs/throttler` · Zod · Swagger |
| **Frontend** | Expo SDK 54 · React Native 0.81 · React 19 · expo-router 6 · TypeScript 5.9 · React Native Paper · Reanimated 4 · lucide-react-native · react-native-svg · expo-secure-store |
| **Testes** | Jest 30 + Supertest (unitários e e2e) |
| **Infra** | Docker Compose (PostgreSQL 16-alpine) |

---

## Estrutura do repositório

```
FinTrack/
├── README.md                 ← este arquivo
├── docs/superpowers/plans/
│   └── 2026-05-29-fintrack-backend.md   ← plano TDD completo do backend
├── backend/                  ← API NestJS
│   ├── prisma/
│   │   ├── schema.prisma     ← modelo de dados
│   │   ├── seed.ts           ← usuário demo + 8 categorias
│   │   └── migrations/20260529041432_init/
│   ├── src/
│   │   ├── main.ts           ← bootstrap (helmet, cors, pipes, prefixo /api, swagger)
│   │   ├── app.module.ts     ← raiz: config, throttler global, módulos
│   │   ├── config/env.validation.ts   ← validação de env com Zod
│   │   ├── common/money.ts            ← helpers Decimal ⇄ number
│   │   ├── prisma/                    ← PrismaService (global)
│   │   ├── auth/                      ← register/login/refresh/logout, JWT
│   │   ├── users/                     ← acesso a usuários (sem controller)
│   │   ├── accounts/                  ← CRUD de contas
│   │   ├── categories/                ← categorias + agregados
│   │   ├── transactions/              ← transações + balanço atômico
│   │   ├── budgets/                   ← orçamentos + gasto derivado
│   │   └── dashboard/                 ← resumo agregado
│   ├── test/                          ← specs e2e (auth, accounts, categories, ...)
│   └── docker-compose.yml
└── frontend/                 ← app Expo / React Native
    ├── app.json              ← config Expo (nova arquitetura, splash, ícone)
    └── src/
        ├── api/              ← client fetch + endpoints tipados
        ├── app/              ← rotas (expo-router): Login, index, Contas, ...
        ├── components/       ← BottomNav, Header, modais, Toast, gráficos
        ├── context/          ← AuthContext
        ├── hooks/            ← useDashboard, useTransacoes, useCategorias, useOrcamentos
        ├── constants/colors.ts        ← paleta de cores
        ├── utils/            ← formatCurrency, formatDate, events (event bus)
        └── data/data.ts      ← mock legado (não mais usado em runtime)
```

---

## Backend

### Configuração e infraestrutura

**Scripts** (`backend/package.json`):

| Script | Ação |
|---|---|
| `npm run start:dev` | NestJS em watch mode |
| `npm run start:prod` | `node dist/main` |
| `npm run build` | `nest build` |
| `npm test` | testes unitários (`*.spec.ts` em `src/`) |
| `npm run test:e2e` | testes e2e (`test/jest-e2e.json`, requer banco vivo) |
| `npm run lint` | ESLint + Prettier |
| `npx prisma db seed` | popula usuário demo + categorias |

**Docker Compose** sobe um único serviço `db`: imagem `postgres:16-alpine`, `restart: unless-stopped`, credenciais `fintrack`/`fintrack`/`fintrack`, porta `5432:5432`, volume nomeado `fintrack_pgdata`.

**Variáveis de ambiente** (`.env.example`):

```env
DATABASE_URL="postgresql://fintrack:fintrack@localhost:5432/fintrack?schema=public"
JWT_ACCESS_SECRET=""
JWT_REFRESH_SECRET=""
JWT_ACCESS_TTL="900s"      # access token: 15 min
JWT_REFRESH_TTL="7d"        # refresh token: 7 dias
PORT="3333"
CORS_ORIGINS="http://localhost:8081,http://localhost:19006"
```

As variáveis são **validadas no boot com Zod** (`src/config/env.validation.ts`): `DATABASE_URL` precisa ser URL válida, os dois segredos JWT são obrigatórios; se algo falhar, a aplicação lança `Invalid environment: ...` e **não sobe**.

**TypeScript** usa `module: nodenext`, `target: ES2023`, `strictNullChecks: true` e decorators experimentais (necessários ao NestJS). Lint via `typescript-eslint` (`recommendedTypeChecked`) + Prettier (`singleQuote`, `trailingComma: all`).

### Modelo de dados (Prisma)

Datasource `postgresql`, generator `prisma-client-js`. IDs são `cuid()` (string); timestamps em `Timestamptz(3)`.

**Enums**

```prisma
enum TransactionType { RECEITA  DESPESA }

enum AccountType {
  CONTA_CORRENTE   CONTA_POUPANCA   CARTEIRA
  CARTAO_CREDITO   INVESTIMENTOS    OUTROS
}
```

| Modelo | Campos principais | Observações |
|---|---|---|
| **User** | `id`, `email @unique`, `name`, `passwordHash`, `refreshHash?`, timestamps | `refreshHash` guarda o hash argon2 do refresh atual (rotação) |
| **Category** | `id`, `userId`, `label`, `value` (slug), `isIncome @default(false)` | só "Renda" é `true`; `@@unique([userId, value])`; cascade do usuário |
| **Account** | `id`, `userId`, `label`, `type`, `balance Decimal(14,2) @default(0)`, `color @default("#AAAAAA")` | `@@index([userId])` |
| **Transaction** | `id`, `userId`, `title`, `amount Decimal(14,2)`, `type`, `date`, `accountId`, `categoryId` | conta/categoria com `onDelete: Restrict`; índices em `[userId,date]`, `accountId`, `categoryId` |
| **Budget** | `id`, `userId`, `title`, `description`, `limit Decimal(14,2)`, `categoryId` | `@@unique([userId, categoryId])` → um orçamento por categoria |

**Seed** (`prisma/seed.ts`, idempotente via `upsert`): cria o usuário demo `demo@fintrack.app` (`name: "Fulano"`, senha `demo1234` com hash argon2) e 8 categorias padrão — Alimentação, Transporte, Moradia, Assinaturas, **Renda** (única `isIncome: true`), Saúde, Lazer, Educação.

### Inicialização e segurança

`src/main.ts` configura, nesta ordem: `helmet()` → `enableCors` (origens de `CORS_ORIGINS`, `credentials: true`) → `ValidationPipe({ whitelist: true, transform: true })` global → `setGlobalPrefix('api')` (**todas** as rotas sob `/api/...`) → `enableShutdownHooks()` → Swagger em **`/api/docs`** (apenas fora de produção).

`app.module.ts` registra `ConfigModule` global, `ThrottlerModule` (100 req/min global via `APP_GUARD`) e os módulos de domínio. As rotas de auth têm rate limit mais agressivo: **5 req/min**.

### Módulos de domínio

Todas as rotas (exceto `/auth/register`, `/auth/login`, `/auth/refresh`) exigem `JwtAuthGuard` e operam sobre o `userId` extraído do token via o decorator `@CurrentUser()`.

#### 🔐 Auth — `/api/auth`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/register` | cria usuário (argon2), retorna `{ accessToken, refreshToken }` · 5/min |
| `POST` | `/login` | autentica, retorna par de tokens · 5/min |
| `POST` | `/refresh` | `JwtRefreshGuard`; valida `refreshHash` e emite novo par (rotação) |
| `POST` | `/logout` | `JwtAuthGuard`; zera o `refreshHash` (revoga refresh) |

**DTOs:** `RegisterDto` (`@IsEmail`, `name` 2–80, `password` 8–128) · `LoginDto` (`@IsEmail`, `password` ≤128).

**Detalhes do `AuthService`:**
- `register` → 409 `ConflictException` se o e-mail já existe.
- `login` → executa `argon2.verify` **sempre** (contra um hash dummy quando o usuário não existe), evitando enumeração de usuários por latência (timing-safe). 401 em qualquer falha.
- `issueTokens` → assina access e refresh em paralelo (`Promise.all`), cada um com `{ sub, email, jti: randomUUID() }` (o `jti` único impede tokens idênticos no mesmo segundo) e salva `argon2.hash(refreshToken)` como novo `refreshHash`.

**Estratégias Passport:** `JwtStrategy` (`'jwt'`, segredo de acesso) e `JwtRefreshStrategy` (`'jwt-refresh'`, segredo de refresh, `passReqToCallback` para recuperar o token cru). Guards: `JwtAuthGuard`, `JwtRefreshGuard`.

#### 🏦 Accounts — `/api/accounts`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/types` | lista estática dos 6 tipos de conta (label PT + value enum) |
| `GET` | `/` | lista contas do usuário (por criação), saldo como `number` |
| `POST` | `/` | cria conta |
| `PATCH` | `/:id` | atualização parcial (verifica posse) |
| `DELETE` | `/:id` | remove; 409 se a conta tiver transações (FK `P2003`) |

**DTO** `CreateAccountDto`: `label` (≥1), `type` (`@IsEnum(AccountType)`), `balance` (`@IsNumber @Min(0)`), `color?` (`@IsHexColor`). `UpdateAccountDto = PartialType(...)`.

#### 🏷️ Categories — `/api/categories`

`GET /` lista categorias com agregados derivados (`valor` = soma dos `amount`, `transacoes` = contagem) via `transaction.groupBy`. `POST /` cria categoria. **DTO** `CreateCategoryDto`: `label`, `value` (slug), `isIncome?`.

#### 💸 Transactions — `/api/transactions`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/?limit=N` | lista transações (join conta + categoria), `date desc` |
| `POST` | `/` | cria transação e ajusta saldo **atomicamente** |
| `PATCH` | `/:id` | atualiza; reverte delta antigo e aplica novo (trata troca de conta) |
| `DELETE` | `/:id` | remove e reverte o saldo |

Todo write roda dentro de `prisma.$transaction`. `delta` = `+amount` (RECEITA) / `-amount` (DESPESA); saldo atualizado com `{ increment: toDecimal(delta) }`. **DTO** `CreateTransactionDto`: `title`, `amount` (`@IsPositive`), `type` (`@IsEnum`), `accountId`, `categoryId`, `date` (`@IsDateString`). `QueryTransactionDto`: `limit?` (`@IsInt @Min(1)`).

#### 🎯 Budgets — `/api/budgets`

`GET /` lista orçamentos com `gasto` derivado (soma de `DESPESA` da categoria). `POST /` valida posse da categoria + unicidade (409 em duplicata). `PATCH`/`DELETE` com verificação de posse. Resposta em PT: `{ id, title, descricao, categoriaId, limite, gasto }`. **DTO** `CreateBudgetDto`: `title`, `description?`, `limit` (`@IsPositive`), `categoryId`.

#### 📊 Dashboard — `/api/dashboard`

`GET /` executa **7 queries em paralelo** (`Promise.all`) e retorna:

```ts
{
  saldoTotal,        // soma dos saldos das contas
  receitaTotal,      // soma das RECEITAS
  gastoTotal,        // soma das DESPESAS
  gastoOrcaTotal,    // despesas das categorias com orçamento
  limiteOrcTotal,    // soma dos limites de orçamento
  orcAtivos,         // quantidade de orçamentos
  ultimasTransacoes  // últimas 5 transações (join conta + categoria)
}
```

#### 👤 Users — interno

`UsersService` (`findByEmail`, `findById`, `create`, `setRefreshHash`) é consumido pelo `AuthService`. Não expõe controller.

### Testes do backend

**Unitários** (`src/**/*.spec.ts`): `auth.service.spec.ts` (rejeita senha errada → 401; emite tokens em login válido) · `money.spec.ts` (inclui `0.1 + 0.2 → "0.3"` sem drift, `null/undefined → 0`) · `env.validation.spec.ts` (falha sem `DATABASE_URL`/URL inválida; default `PORT = 3000`).

**E2E** (`test/*.e2e-spec.ts`, exigem banco): `auth` (registro+login, duplicata 409, **rotação de refresh** com invalidação do anterior, logout revoga, rota protegida → 401) · `accounts` (CRUD) · `transactions` (DESPESA decrementa saldo, rejeita conta de terceiros → 404, delete restaura, update rebalanceia) · `budgets` (deriva `gasto`, rejeita duplicata 409) · `dashboard` (verifica totais e formato).

---

## Frontend

### Configuração (frontend)

App **Expo SDK 54** com **nova arquitetura do React Native** (`newArchEnabled: true`) e `edgeToEdgeEnabled` no Android. Entry point `expo-router/entry`; rotas tipadas (`typedRoutes: true`). Ícone/splash sobre fundo `#222222`. Plugins: `expo-router`, `expo-secure-store`. Alias de import `@/*` → `./src/*`.

```env
# .env / .env.example
EXPO_PUBLIC_API_URL=http://localhost:3333/api
```

> Em dispositivo físico, troque `localhost` pelo IP da sua rede local. As variáveis `EXPO_PUBLIC_*` são embutidas no bundle em build time.

### Camada de API

**`src/api/client.ts`** — cliente `fetch` com:
- Base URL de `EXPO_PUBLIC_API_URL` (fallback `http://localhost:3333/api`).
- Armazenamento de tokens **plataforma-aware**: `SecureStore` no nativo, `localStorage` na web. Chaves `ft_access` / `ft_refresh`.
- `api<T>()` injeta `Authorization: Bearer <access>`; em **401**, tenta `POST /auth/refresh`, salva o novo par e **reexecuta** a requisição original. Se o refresh falhar, limpa os tokens (força logout). Trata 204 e propaga a mensagem de erro do corpo JSON.

**`src/api/endpoints.ts`** — módulos tipados (`Auth`, `Accounts`, `Categories`, `Transactions`, `Budgets`, `Dashboard`) espelhando exatamente as rotas do backend.

### Navegação e autenticação

**`src/context/AuthContext.tsx`** expõe `{ ready, signedIn, login, register, logout }` (verifica `tokens.access()` no mount). **`src/app/_layout.tsx`** envolve tudo em `AuthProvider` e contém o `Guard`: enquanto `!ready` mostra `ActivityIndicator`; redireciona não autenticados para `/Login` e autenticados para fora do `/Login`. Usa `<Stack screenOptions={{ headerShown: false }}>` (sem headers nativos) e renderiza o `<Toast>` global.

### Telas

| Rota | Tela | Fundo | Função |
|---|---|---|---|
| `/Login` | Login/Cadastro | `#F8F8F8` | modo duplo; login pré-preenchido com a conta demo |
| `/` | Home/Dashboard | claro | `Header` (saldo/receitas/gastos) + `GastCateg` (donut top-3) + `UltTransac` (últimas 5) |
| `/Contas` | Contas | `#F8F8F8` | saldo consolidado + cards coloridos; "+" abre `NovaContaModal` |
| `/Categorias` | Categorias | `#222222` | total de gastos + lista de categorias de despesa com barra de progresso |
| `/Transferencias` | Transações | `#222222` | lista completa (ícone de direção, valor verde/vermelho) |
| `/Orcamentos` | Orçamentos | claro + header primário | cards com progresso e modal "Ver Detalhes"; "+" abre `NovoOrcamentoModal` |

### Hooks

- **`useDashboard()`** → `Dashboard.summary()`; expõe todos os totais + `ultimasTransacoes`.
- **`useTransacoes(limit?)`** → `Transactions.list()`; mapeia campos EN→PT (`title→titulo`, `amount→valor`...).
- **`useCategorias()`** → `Categories.list()`; filtra renda, calcula `totalGastos`, `porcentagem`, `progresso`, ordena por valor.
- **`useOrcamentos()`** → hook puro: `getPorcentagem(gasto, limite)` e `getColor(%)` (verde < 80, warning < 100, error ≥ 100).

### Componentes

- **`BottomNav`** — `BottomNavigation.Bar` (RN Paper) com 5 abas: Home, Contas, **"+" central** (abre `NovaTransacaoModal`, não navega), Orçamentos, Transferências.
- **`Header`** — card escuro (350px) com saudação, "SALDO TOTAL" e cards Receitas/Gastos em `primary`.
- **`UltTransac`** — últimas 5 transações na Home; "Ver tudo" → `/Transferencias`.
- **`GastCateg`** — donut SVG (`react-native-svg`) das 3 maiores categorias; "Ver tudo" → `/Categorias`.
- **`NovaTransacaoModal` / `NovaContaModal` / `NovoOrcamentoModal`** — bottom-sheets (72–80% de altura) com inputs monetários mascarados, pickers em sub-modal e seletor de cor (`react-native-wheel-color-picker`) para contas.
- **`Toast/`** — config de `react-native-toast-message` com variantes `success`/`error`/`info` e helpers `showSuccess`/`showError`/`showInfo`.

### Sincronização de dados

Em vez de uma store global, o app usa um **event bus** minimalista (`src/utils/events.ts`): qualquer mutação chama `emitDataChanged()`, e todos os hooks inscritos em `onDataChanged` re-buscam da API — mantendo a UI sincronizada sem dependências extras. `formatCurrency` formata em `pt-BR`/BRL ("R$ 1.234,56"); `formatDate` produz "03 de jun.".

> `src/data/data.ts` contém os mocks originais. Permanece por referência histórica, mas **não é mais usado em runtime** — todos os dados vêm da API.

---

## Design system / identidade visual

Paleta central em **`frontend/src/constants/colors.ts`**:

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#9CFF19` | verde-limão neon — acento principal, abas ativas, botão "+", header de orçamentos, gráficos |
| `darkBackground` | `#222222` | header, bottom nav, telas escuras (Categorias/Transferências), splash |
| `background` | `#F8F8F8` | fundo das telas claras, inputs, modais |
| `white` / `black` | `#FFFFFF` / `#1A1A1A` | superfícies e texto principal |
| `gray` · `lightGray` · `darkGray` · `borderGray` | `#AAAAAA` · `#D9D9D9` · `#383A39` · `#EFEFEF` | textos secundários, bordas |
| `success` / `danger` | `#116E1F` / `#A70205` | valores de receita / despesa |
| `progressGreen` · `warning` · `error` | `#1F7A3D` · `#D8A300` · `#B00000` | progresso de orçamento (< 80% / 80–99% / ≥ 100%) |

**Tipografia:** fontes do sistema (sem fonte custom). Escala: títulos 30–36px bold, seções 16–18px bold, corpo 14–16px, labels 11–14px, valores monetários 18–34px.

**Padrões de UX:** navegação file-based com bottom nav persistente; inputs monetários mascarados; seletores como modais inline; modais de criação em bottom-sheet; feedback de erro via toast.

---

## Como rodar

### Backend

```bash
cd backend
cp .env.example .env          # preencha JWT_ACCESS_SECRET e JWT_REFRESH_SECRET
docker compose up -d          # PostgreSQL 16 na porta 5432
npm install
npx prisma migrate deploy     # aplica a migration
npx prisma db seed            # cria usuário demo + categorias
npm run start:dev             # API em http://localhost:3333/api  (docs em /api/docs)
```

### Frontend

```bash
cd frontend
cp .env.example .env          # ajuste EXPO_PUBLIC_API_URL se usar dispositivo físico
npm install
npm run start                 # Expo (a / i / w para Android/iOS/Web)
```

Conta demo: **`demo@fintrack.app` / `demo1234`** (já pré-preenchida na tela de login).
