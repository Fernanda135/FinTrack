# FinTrack 💰

> Aplicativo de finanças pessoais multiusuário — backend REST em **NestJS + Prisma + PostgreSQL** e app mobile/web em **Expo / React Native**.

O FinTrack é um controle financeiro pessoal completo: cada usuário cadastra suas **contas** (corrente, poupança, carteira, cartão, investimentos...), registra **transações** (receitas e despesas), organiza tudo por **categorias**, define **orçamentos** mensais por categoria e acompanha **estatísticas** (gráficos de evolução de saldo, receitas, despesas e distribuição por conta/categoria). Tudo é isolado por usuário, autenticado via **JWT com refresh rotativo**, e todo valor monetário é armazenado como `Decimal(14,2)` no banco — nunca como `float` — para eliminar erros de arredondamento.

- 🎨 **Design Figma**: [Clique aqui](https://www.figma.com/design/77gDUrn6DW6sX9r86Ryk1l/FinTrack?node-id=94-274&t=XgoOvWY6sQGq3rbU-1)
- 📄 **Documentação complementar**: [Clique aqui](https://docs.google.com/document/d/1CO_u75NRPYIzsFCykFXftyeKxgwweAp445R1df1CYHU/edit?usp=sharing)
- 🟡 **Status**: em desenvolvimento

---

## Índice

1. [Visão geral da arquitetura](#1-visão-geral-da-arquitetura)
2. [Stack tecnológica completa](#2-stack-tecnológica-completa)
3. [Estrutura do repositório](#3-estrutura-do-repositório)
4. [Como o frontend e o backend se comunicam](#4-como-o-frontend-e-o-backend-se-comunicam)
5. [Backend — como foi construído](#5-backend--como-foi-construído)
   - 5.1 [Bootstrap e segurança da aplicação](#51-bootstrap-e-segurança-da-aplicação)
   - 5.2 [Configuração de ambiente](#52-configuração-de-ambiente)
   - 5.3 [Modelo de dados (Prisma)](#53-modelo-de-dados-prisma)
   - 5.4 [Autenticação (JWT + refresh rotativo)](#54-autenticação-jwt--refresh-rotativo)
   - 5.5 [Módulo de Contas](#55-módulo-de-contas--apiaccounts)
   - 5.6 [Módulo de Categorias](#56-módulo-de-categorias--apicategories)
   - 5.7 [Módulo de Transações](#57-módulo-de-transações--apitransactions)
   - 5.8 [Módulo de Orçamentos](#58-módulo-de-orçamentos--apibudgets)
   - 5.9 [Módulo de Dashboard](#59-módulo-de-dashboard--apidashboard)
   - 5.10 [Health check](#510-health-check--apihealth)
   - 5.11 [Dinheiro sem drift de ponto flutuante](#511-dinheiro-sem-drift-de-ponto-flutuante)
   - 5.12 [Testes do backend](#512-testes-do-backend)
6. [Frontend — como foi construído](#6-frontend--como-foi-construído)
   - 6.1 [Configuração do Expo](#61-configuração-do-expo)
   - 6.2 [Camada de API (cliente HTTP + endpoints)](#62-camada-de-api-cliente-http--endpoints)
   - 6.3 [Autenticação e roteamento protegido](#63-autenticação-e-roteamento-protegido)
   - 6.4 [Telas (rotas do expo-router)](#64-telas-rotas-do-expo-router)
   - 6.5 [Hooks de dados](#65-hooks-de-dados)
   - 6.6 [Componentes reutilizáveis](#66-componentes-reutilizáveis)
   - 6.7 [Sincronização de dados sem store global](#67-sincronização-de-dados-sem-store-global)
7. [Design system / identidade visual](#7-design-system--identidade-visual)
8. [Como rodar o projeto](#8-como-rodar-o-projeto)
9. [Fluxos de ponta a ponta (exemplos)](#9-fluxos-de-ponta-a-ponta-exemplos)
10. [Decisões de arquitetura e por quê](#10-decisões-de-arquitetura-e-por-quê)

---

## 1. Visão geral da arquitetura

O projeto é um monorepo simples com duas aplicações independentes que conversam por HTTP/JSON:

```
┌───────────────────────────────┐          HTTPS / JSON           ┌───────────────────────────────────┐
│    App Expo / React Native    │  ──────────────────────────►    │         API NestJS  (/api)          │
│                                │   Authorization: Bearer <jwt>   │                                     │
│  expo-router (rotas por arq.) │  ◄──────────────────────────    │  Auth · Users · Accounts            │
│  Context API (AuthContext)    │     access token + refresh      │  Categories · Transactions          │
│  fetch client c/ auto-refresh │                                 │  Budgets · Dashboard · Health        │
└───────────────────────────────┘                                 └────────────────┬────────────────────┘
                                                                                     │  Prisma Client 6
                                                                                     ▼
                                                                    ┌──────────────────────────────────┐
                                                                    │      PostgreSQL 16 (Docker)        │
                                                                    │  Decimal(14,2) para todo dinheiro   │
                                                                    └──────────────────────────────────┘
```

**Fluxo básico de uma requisição autenticada:**

1. O app guarda `accessToken` e `refreshToken` em `expo-secure-store` (nativo) ou `localStorage` (web).
2. Toda chamada de API injeta `Authorization: Bearer <accessToken>`.
3. Se o backend responder **401** (token expirado), o cliente HTTP automaticamente chama `POST /api/auth/refresh` com o refresh token, salva o novo par de tokens e **repete a requisição original** — de forma transparente para quem chamou.
4. Se o refresh também falhar, os tokens são apagados e o `Guard` do `expo-router` redireciona para `/Login`.
5. No backend, todo endpoint (exceto register/login/refresh) passa por um `JwtAuthGuard`, que popula `request.user` com `{ userId, email }` extraídos do token — e **toda query do Prisma é filtrada por esse `userId`**, garantindo isolamento total entre usuários.

---

## 2. Stack tecnológica completa

| Camada | Tecnologia | Papel no projeto |
|---|---|---|
| **Runtime backend** | Node.js ≥ 20, TypeScript 5.7 | linguagem/runtime da API |
| **Framework backend** | NestJS 11 | estrutura modular (controllers/services/módulos), injeção de dependência, guards, pipes |
| **ORM** | Prisma 6 (`@prisma/client`) | acesso tipado ao banco, migrations, `$transaction` |
| **Banco de dados** | PostgreSQL 16 (`postgres:16-alpine` via Docker) | persistência; `Decimal(14,2)` para dinheiro |
| **Autenticação** | Passport + `@nestjs/jwt` + `passport-jwt` | estratégias JWT para access token e refresh token |
| **Hashing de senha/token** | Argon2 (`argon2`) | hash de senha e do refresh token armazenado |
| **Segurança HTTP** | Helmet | cabeçalhos HTTP seguros |
| **Rate limiting** | `@nestjs/throttler` | limite de requisições global e por rota (auth) |
| **Validação de DTO** | `class-validator` + `class-transformer` | validação/whitelisting do corpo das requisições |
| **Validação de env** | Zod | garante que variáveis de ambiente obrigatórias existem e têm o formato certo antes do boot |
| **Documentação de API** | `@nestjs/swagger` | Swagger UI em `/api/docs` (apenas fora de produção) |
| **Testes backend** | Jest 30 + Supertest | testes unitários (`*.spec.ts`) e end-to-end (`test/*.e2e-spec.ts`) |
| **Runtime frontend** | Expo SDK 54, React Native 0.81, React 19 | app multiplataforma (Android/iOS/Web) |
| **Roteamento** | expo-router 6 (rotas tipadas) | navegação baseada em arquivos, sem `react-navigation` manual |
| **Linguagem frontend** | TypeScript 5.9 | tipagem estática no app |
| **UI Kit** | React Native Paper | `BottomNavigation.Bar` e outros componentes prontos |
| **Ícones** | `lucide-react-native`, `@expo/vector-icons` | ícones vetoriais das telas |
| **Gráficos** | `react-native-svg` (donut custom) + `react-native-chart-kit` (linhas/pizza) | visualizações da Home e da tela de Estatísticas |
| **Animações** | `react-native-reanimated` 4 + `react-native-worklets` | necessário pela nova arquitetura do RN |
| **Seleção de cor** | `react-native-wheel-color-picker` | escolher a cor de uma conta |
| **Data/hora** | `@react-native-community/datetimepicker` | seletor nativo de data nos formulários |
| **Armazenamento seguro** | `expo-secure-store` | tokens no keychain/keystore (nativo) |
| **Notificações in-app** | `react-native-toast-message` | toasts de sucesso/erro/info |
| **Infraestrutura** | Docker Compose | sobe o Postgres localmente para desenvolvimento |

---

## 3. Estrutura do repositório

```
FinTrack/
├── README.md
├── docs/
│   └── superpowers/plans/2026-05-29-fintrack-backend.md   ← plano TDD original do backend
│
├── backend/                         ← API NestJS
│   ├── docker-compose.yml           ← sobe o Postgres 16 (host :5433 → container :5432)
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma            ← modelo de dados (fonte da verdade do banco)
│   │   ├── seed.ts                  ← cria o usuário demo + 8 categorias legadas
│   │   └── migrations/              ← histórico de migrations SQL geradas pelo Prisma
│   ├── src/
│   │   ├── main.ts                  ← bootstrap: helmet, cors, validation pipe, prefixo /api, swagger
│   │   ├── app.module.ts            ← módulo raiz: registra config, throttler global e todos os módulos de domínio
│   │   ├── config/env.validation.ts ← schema Zod das variáveis de ambiente
│   │   ├── common/
│   │   │   ├── money.ts             ← toDecimal / toNumber (conversão segura Decimal ⇄ number)
│   │   │   └── decorators/current-user.decorator.ts  ← @CurrentUser() extrai { userId, email } do JWT
│   │   ├── prisma/                  ← PrismaService (client global, injetável)
│   │   ├── auth/                    ← registro, login, refresh, logout, estratégias e guards JWT
│   │   ├── users/                   ← acesso a usuários e categorias padrão (sem controller HTTP próprio)
│   │   ├── accounts/                ← CRUD de contas bancárias
│   │   ├── categories/              ← categorias de transação + agregados
│   │   ├── transactions/            ← transações + ajuste atômico de saldo
│   │   ├── budgets/                 ← orçamentos por categoria + gasto derivado
│   │   ├── dashboard/               ← resumo agregado para a Home
│   │   └── health/                  ← healthcheck simples
│   └── test/                        ← specs e2e (auth, accounts, categories, transactions, budgets, dashboard)
│
└── frontend/                        ← app Expo / React Native
    ├── app.json                     ← config do Expo (nova arquitetura, ícone, splash, updates OTA)
    ├── .env.example
    └── src/
        ├── api/
        │   ├── client.ts            ← fetch wrapper com tokens + auto-refresh em 401
        │   └── endpoints.ts         ← Auth, Accounts, Categories, Transactions, Budgets, Dashboard (tipados)
        ├── app/                     ← uma rota por arquivo (expo-router)
        │   ├── _layout.tsx          ← AuthProvider + Guard de navegação + Toast global
        │   ├── Login.tsx
        │   ├── index.tsx            ← Home / Dashboard
        │   ├── Contas.tsx
        │   ├── Categorias.tsx
        │   ├── Transferencias.tsx   ← lista de transações
        │   ├── Orcamentos.tsx
        │   └── Estatisticas.tsx     ← gráficos de evolução e distribuição
        ├── components/              ← BottomNav, Header, modais de criação/edição, Toast, gráficos
        ├── context/AuthContext.tsx  ← estado global de autenticação
        ├── hooks/                   ← useDashboard, useTransacoes, useCategorias, useOrcamentos, useEstatisticas...
        ├── constants/colors.ts      ← paleta de cores central
        ├── utils/                   ← formatCurrency, formatDate, events (event bus)
        └── data/data.ts             ← mock legado, não usado em runtime (mantido por referência histórica)
```

---

## 4. Como o frontend e o backend se comunicam

Toda a comunicação é **REST sobre HTTP**, com corpo em **JSON**, sob o prefixo global `/api`. Não há WebSocket, GraphQL ou polling — a "sincronização em tempo real" dentro do app é resolvida no cliente com um event bus local (veja [seção 6.7](#67-sincronização-de-dados-sem-store-global)), não pelo servidor.

**No frontend**, tudo passa por dois arquivos:

- **`src/api/client.ts`** — a função `api<T>(path, init)` é o único ponto que efetivamente chama `fetch`. Ela:
  1. Lê o `EXPO_PUBLIC_API_URL` do `.env` como base URL (fallback `http://localhost:3333/api`).
  2. Busca o `accessToken` salvo (SecureStore no nativo, `localStorage` na web) e injeta o header `Authorization: Bearer <token>`.
  3. Se a resposta for `401` e existir um `refreshToken` salvo, chama `POST /auth/refresh` automaticamente, salva o novo par de tokens e refaz a chamada original **uma única vez**.
  4. Se o refresh falhar, limpa os tokens do storage (o que força o `Guard` a deslogar o usuário).
  5. Trata `204 No Content` como sucesso sem corpo, e em caso de erro HTTP lança uma `Error` com a mensagem vinda do corpo JSON (`{ message: "..." }`), que os componentes capturam para exibir em um `Toast`.

- **`src/api/endpoints.ts`** — módulos finos (`Auth`, `Accounts`, `Categories`, `Transactions`, `Budgets`, `Dashboard`) que apenas montam o `path`/`method`/`body` e chamam `api<T>()`. Cada função aqui espelha **exatamente** uma rota do backend — é o "contrato" tipado entre as duas aplicações.

**No backend**, o `ValidationPipe` global (`whitelist: true, transform: true`) garante que:
- Campos que não estão no DTO são descartados silenciosamente (protege contra mass assignment).
- Tipos são convertidos automaticamente (ex.: query string `?limit=5` vira `number`).
- Se a validação falhar, a API responde `400` com a lista de mensagens de erro do `class-validator`, que o frontend concatena e mostra no toast de erro.

---

## 5. Backend — como foi construído

### 5.1 Bootstrap e segurança da aplicação

`src/main.ts` monta a aplicação Nest nesta ordem exata:

```
helmet()  →  CORS (origens de CORS_ORIGINS, credentials: true)  →  ValidationPipe global
   →  setGlobalPrefix('api')  →  enableShutdownHooks()  →  Swagger em /api/docs (se não for produção)
```

- **Helmet** aplica cabeçalhos HTTP de segurança padrão (`X-Content-Type-Options`, `X-Frame-Options` etc.).
- **CORS** só libera as origens listadas em `CORS_ORIGINS` (o app Expo rodando em modo web).
- **`enableShutdownHooks()`** garante que o `PrismaService.onModuleDestroy` (`$disconnect`) rode ao receber `SIGTERM`/`SIGINT`, fechando a conexão com o banco de forma limpa.
- **Swagger** só é exposto fora de produção — em produção, a documentação completa de rotas/DTOs de uma API financeira não deveria ficar pública.

`src/app.module.ts` registra:
- `ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })` — env acessível em qualquer módulo, validado no boot.
- `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])` como `APP_GUARD` global — **100 requisições/minuto** por padrão em toda a API; as rotas de `/auth` sobrescrevem esse limite para **5/min** via `@Throttle()` (proteção contra força bruta em login/registro).
- Todos os módulos de domínio: `Auth`, `Users`, `Categories`, `Accounts`, `Transactions`, `Budgets`, `Dashboard`, `Health`.

### 5.2 Configuração de ambiente

As variáveis são validadas no boot com **Zod** (`src/config/env.validation.ts`). Se algo obrigatório faltar ou for inválido, a aplicação lança `Invalid environment: ...` e **não sobe** — falha rápido em vez de rodar em um estado inconsistente.

```env
DATABASE_URL="postgresql://fintrack:fintrack@localhost:5432/fintrack?schema=public"
JWT_ACCESS_SECRET=""        # obrigatório, sem default
JWT_REFRESH_SECRET=""       # obrigatório, sem default
JWT_ACCESS_TTL="900s"       # access token: 15 minutos
JWT_REFRESH_TTL="7d"        # refresh token: 7 dias
PORT="3333"
CORS_ORIGINS="http://localhost:8081,http://localhost:19006"
```

> ⚠️ O `docker-compose.yml` do backend expõe o Postgres na porta **5433** do host (`"5433:5432"`), enquanto o `.env.example` aponta `DATABASE_URL` para a porta **5432**. Se você usar o compose como está, ajuste a porta no seu `.env` para `5433` (ou altere o compose) antes de rodar as migrations.

### 5.3 Modelo de dados (Prisma)

Datasource `postgresql`, generator `prisma-client-js`. IDs são `cuid()` (string); timestamps em `Timestamptz(3)`.

**Enums**

```prisma
enum TransactionType { RECEITA  DESPESA }

enum AccountType {
  CONTA_CORRENTE   CONTA_POUPANCA   CARTEIRA
  CARTAO_CREDITO   INVESTIMENTOS    OUTROS
}
```

**Tabelas**

| Modelo | Campos principais | Observações |
|---|---|---|
| **User** | `id`, `email @unique`, `name`, `passwordHash`, `refreshHash?` | `refreshHash` guarda o hash Argon2 do refresh token *atual* — permite revogar e detectar reuso |
| **Category** | `id`, `userId`, `label`, `value` (slug), `isIncome @default(false)` | `@@unique([userId, value])`; cascade quando o usuário é apagado |
| **Account** | `id`, `userId`, `label`, `type`, `balance Decimal(14,2) @default(0)`, `color @default("#AAAAAA")` | `@@index([userId])` |
| **Transaction** | `id`, `userId`, `title`, `amount Decimal(14,2)`, `type`, `date`, `accountId`, `categoryId` | conta/categoria com `onDelete: Restrict` (não é possível apagar uma conta/categoria com transações); índices em `[userId,date]`, `accountId`, `categoryId` |
| **Budget** | `id`, `userId`, `title`, `description @default("")`, `limit Decimal(14,2)`, `categoryId` | `@@unique([userId, categoryId])` → **no máximo um orçamento por categoria por usuário** |

**Regra central do domínio:** a tabela `Transaction` é a **única fonte de verdade** financeira. Nada de "gasto da categoria" ou "gasto do orçamento" é armazenado — tudo é **derivado em tempo de consulta** via `groupBy`/`aggregate` do Prisma. Isso elimina qualquer risco de os agregados ficarem dessincronizados da lista real de transações.

O único valor que *é* persistido e mantido incrementalmente é o **saldo da conta** (`Account.balance`), porque recalculá-lo do zero a cada leitura seria caro; ele é atualizado transacionalmente a cada escrita (ver [5.7](#57-módulo-de-transações--apitransactions)).

### 5.4 Autenticação (JWT + refresh rotativo)

#### Rotas — `/api/auth`

| Método | Rota | Guard | Rate limit | Descrição |
|---|---|---|---|---|
| `POST` | `/register` | — | 5/min | Cria usuário, hash Argon2 da senha, cria 14 categorias padrão, retorna `{ accessToken, refreshToken }` |
| `POST` | `/login` | — | 5/min | Autentica e retorna novo par de tokens |
| `POST` | `/refresh` | `JwtRefreshGuard` | — | Valida o refresh token contra o `refreshHash` salvo e emite um **novo** par (rotação) |
| `POST` | `/logout` | `JwtAuthGuard` | — | Zera o `refreshHash` do usuário (revoga o refresh token) |
| `GET` | `/me` | `JwtAuthGuard` | — | Retorna `{ id, name, email }` do usuário autenticado |

**Detalhes de segurança do `AuthService`:**

- **Timing-safe login**: em `login()`, o serviço faz `argon2.verify` **sempre**, mesmo quando o e-mail não existe (contra um "hash sentinela" gerado uma vez na construção do serviço). Isso evita que um atacante descubra quais e-mails existem apenas medindo o tempo de resposta. Qualquer falha (usuário inexistente ou senha errada) retorna o mesmo `401 Credenciais inválidas`.
- **`jti` único por token**: cada access/refresh token é assinado com `{ sub: userId, email, jti: randomUUID() }`. Sem o `jti`, dois tokens emitidos no mesmo segundo com o mesmo payload seriam **byte-idênticos**, o que quebraria a rotação (um refresh "antigo" ainda bateria com o hash recém-salvo).
- **Rotação de refresh token**: a cada `login`/`register`/`refresh`, um novo par de tokens é emitido e o hash Argon2 do novo refresh token substitui o anterior em `User.refreshHash`. Um refresh token antigo deixa de validar assim que um novo é emitido — se ele for reutilizado, a chamada falha com `401`.
- **Estratégias Passport**: `JwtStrategy` (nome `'jwt'`, valida com `JWT_ACCESS_SECRET`) e `JwtRefreshStrategy` (nome `'jwt-refresh'`, valida com `JWT_REFRESH_SECRET`, usa `passReqToCallback: true` para recuperar o token cru e devolvê-lo em `AuthUser.refreshToken`). Os guards correspondentes são `JwtAuthGuard` e `JwtRefreshGuard`.
- **`@CurrentUser()`**: decorator de parâmetro (`src/common/decorators/current-user.decorator.ts`) que lê `request.user` (populado pela strategy) e tipa como `AuthUser { userId, email, refreshToken? }`. Usado em **todos** os controllers protegidos para nunca precisar confiar em um `userId` vindo do corpo da requisição.

**Categorias padrão criadas no registro** (`UsersService.createDefaultCategories`, chamado por `AuthService.register`): 8 categorias de despesa (Alimentação, Transporte, Moradia, Assinaturas, Saúde, Lazer, Educação, Outros) + 6 categorias de receita (Salário, Freelancer, Investimentos, Presentes, Reembolsos, Outras Receitas) — todas com `isIncome` correto. *(O `prisma/seed.ts`, usado apenas para popular o usuário demo em desenvolvimento, cria um conjunto mais antigo de 8 categorias — 7 de despesa + "Renda" como única categoria de receita.)*

### 5.5 Módulo de Contas — `/api/accounts`

Todas as rotas exigem `JwtAuthGuard`.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/types` | Lista estática dos 6 tipos de conta (`{ label, value }` em PT) |
| `GET` | `/` | Lista as contas do usuário, ordenadas por criação; `balance` serializado como `number` |
| `POST` | `/` | Cria conta (`CreateAccountDto`) |
| `PATCH` | `/:id` | Atualização parcial — verifica posse antes de aplicar |
| `DELETE` | `/:id` | Remove a conta; se ela tiver transações vinculadas, o Postgres rejeita por FK (`onDelete: Restrict`) e o serviço traduz isso em `409 Conflict` |

**DTOs**: `CreateAccountDto { label, type: AccountType, balance (≥0), color? (hex) }`. `UpdateAccountDto` é um `PartialType(CreateAccountDto)` (todos os campos opcionais).

### 5.6 Módulo de Categorias — `/api/categories`

`GET /` retorna cada categoria do usuário já com **agregados calculados** — `valor` (soma de `amount` de todas as transações daquela categoria) e `transacoes` (contagem) — via `transaction.groupBy({ by: ['categoryId'], _sum: { amount: true }, _count: { _all: true } })`. `POST /` cria uma categoria (`CreateCategoryDto { label, value, isIncome? }`).

### 5.7 Módulo de Transações — `/api/transactions`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/?limit=N` | Lista transações do usuário (com `account` e `category` incluídos via `join`), ordenadas por `date desc`; `limit` opcional |
| `POST` | `/` | Cria transação **e ajusta o saldo da conta atomicamente** |
| `PATCH` | `/:id` | Atualiza; reverte o efeito antigo no saldo e aplica o novo (inclusive se a conta ou o tipo mudarem) |
| `DELETE` | `/:id` | Remove a transação e reverte seu efeito no saldo |

Todas as operações de escrita rodam dentro de `prisma.$transaction(async (db) => { ... })`, o que garante duas coisas ao mesmo tempo:

1. **Sem gap TOCTOU (time-of-check-to-time-of-use)**: a checagem "essa conta/categoria pertence a esse usuário?" acontece **dentro** da mesma transação de banco que o `update`/`create`/`delete` — se a conta for apagada por outra requisição concorrente entre a checagem e a escrita, o Postgres bloqueia/reverte, em vez de deixar passar uma escrita órfã.
2. **Saldo sempre consistente**: o delta é `+amount` para `RECEITA` e `-amount` para `DESPESA`. Em uma edição, o serviço primeiro reverte o delta antigo na conta antiga (`increment: -oldDelta`) e depois aplica o novo delta na conta nova (`increment: +newDelta`) — cobrindo inclusive o caso de o usuário trocar a transação de conta.

**DTOs**: `CreateTransactionDto { title, amount (>0), type: RECEITA|DESPESA, accountId, categoryId, date (ISO string) }`; `QueryTransactionDto { limit? (inteiro ≥1) }`.

### 5.8 Módulo de Orçamentos — `/api/budgets`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Lista orçamentos com `gasto` **derivado** (soma de `DESPESA` da categoria vinculada) |
| `POST` | `/` | Cria orçamento — valida que a categoria pertence ao usuário e que não existe outro orçamento para a mesma categoria (`409` se sim) |
| `PATCH` | `/:id` | Atualiza título/descrição/limite, checando posse |
| `DELETE` | `/:id` | Remove, checando posse |

A resposta é serializada em português: `{ id, title, descricao, categoriaId, limite, gasto }`. **DTO**: `CreateBudgetDto { title, description?, limit (>0), categoryId }`.

### 5.9 Módulo de Dashboard — `/api/dashboard`

`GET /` executa **6 consultas em paralelo** (`Promise.all`) mais uma consulta condicional, e devolve:

```ts
{
  saldoTotal,          // soma do balance de todas as contas do usuário
  receitaTotal,        // soma de amount de todas as transações RECEITA
  gastoTotal,          // soma de amount de todas as transações DESPESA
  gastoOrcaTotal,      // soma de DESPESA restrita às categorias que têm orçamento
  limiteOrcTotal,      // soma do limit de todos os orçamentos
  orcAtivos,           // quantidade de orçamentos cadastrados
  ultimasTransacoes,   // as 5 transações mais recentes, com account e category já incluídos
}
```

Esse payload alimenta o `Header` (saldo/receitas/gastos), o `GastCateg` (donut) e o `UltTransac` (lista) na Home, através do hook `useDashboard`.

### 5.10 Health check — `/api/health`

`GET /api/health` retorna `{ status: "ok", timestamp, uptime }` — sem autenticação, pensado para checagens de infraestrutura/monitoramento (não é um endpoint de negócio).

### 5.11 Dinheiro sem drift de ponto flutuante

`src/common/money.ts` concentra toda a conversão entre `Prisma.Decimal` (como o valor é armazenado, coluna `Decimal(14,2)`) e `number` (como o valor trafega em JSON para o frontend):

```ts
toDecimal(value: number): Prisma.Decimal   // arredonda para 2 casas ANTES de virar Decimal
toNumber(value: Decimal | null | undefined): number  // 0 para null/undefined
```

O arredondamento acontece **na borda**, antes de o valor ser gravado — assim, um drift de ponto flutuante do JavaScript (como `0.1 + 0.2 = 0.30000000000000004`) nunca chega a ser persistido; o valor gravado é sempre canônico com 2 casas decimais.

### 5.12 Testes do backend

**Unitários** (`src/**/*.spec.ts`, rodam com `npm test`, não precisam de banco):
- `auth.service.spec.ts` — rejeita senha errada com `401`; emite tokens em login válido.
- `money.spec.ts` — conversão Decimal↔number, incluindo o caso `0.1 + 0.2 → "0.3"` sem drift, e `null/undefined → 0`.
- `env.validation.spec.ts` — falha sem `DATABASE_URL`/com URL inválida; confirma o default `PORT = 3000`.

**End-to-end** (`test/*.e2e-spec.ts`, rodam com `npm run test:e2e`, **exigem um Postgres vivo**):
- `auth` — registro seguido de login; rejeita registro duplicado (`409`); **rotação de refresh token** (o token antigo é invalidado ao emitir um novo); logout revoga o refresh; rota protegida sem token retorna `401`.
- `accounts` — cria, lista, atualiza e remove uma conta.
- `categories` — exige autenticação; cria e lista categorias com os campos agregados.
- `transactions` — uma `DESPESA` decrementa o saldo da conta; rejeita transação apontando para conta de outro usuário (`404`); lista com `account`/`category` já unidos; deletar uma despesa restaura o saldo; atualizar o valor rebalanceia a conta.
- `budgets` — deriva `gasto` corretamente a partir das despesas da categoria; rejeita orçamento duplicado para a mesma categoria (`409`).
- `dashboard` — confirma o formato e os totais do resumo agregado.

---

## 6. Frontend — como foi construído

### 6.1 Configuração do Expo

App **Expo SDK 54** com a **nova arquitetura do React Native** habilitada (`newArchEnabled: true`) e `edgeToEdgeEnabled` no Android. Entry point `expo-router/entry`; rotas tipadas (`typedRoutes: true`, gera tipos para `router.push("/Rota")`). Ícone/splash sobre fundo `#222222`. Plugins registrados: `expo-router`, `expo-secure-store`, `expo-font`. Alias de import `@/*` → `./src/*` (usado em todos os imports do projeto). Suporte a atualizações OTA via `expo-updates` (canal apontando para o projeto EAS `51b1d990-...`).

```env
# .env / .env.example do frontend
EXPO_PUBLIC_API_URL=http://localhost:3333/api
```

> Em dispositivo físico, troque `localhost` pelo IP da sua rede local (ex.: `http://192.168.0.10:3333/api`) — variáveis `EXPO_PUBLIC_*` são embutidas no bundle **em build time**, então não são segredos e não podem ser trocadas em runtime sem rebuild.

### 6.2 Camada de API (cliente HTTP + endpoints)

Já detalhada na [seção 4](#4-como-o-frontend-e-o-backend-se-comunicam) — `src/api/client.ts` (fetch + tokens + auto-refresh) e `src/api/endpoints.ts` (`Auth`, `Accounts`, `Categories`, `Transactions`, `Budgets`, `Dashboard`).

### 6.3 Autenticação e roteamento protegido

- **`src/context/AuthContext.tsx`** expõe `{ ready, signedIn, user, login, register, logout }`. No mount, verifica se existe um `accessToken` salvo; se sim, chama `Auth.me()` para validar o token e recuperar os dados do usuário — se a chamada falhar (token inválido/expirado sem refresh), limpa o storage e marca como deslogado. `login`/`register` chamam o endpoint correspondente (que já salva os tokens) e em seguida buscam `Auth.me()` para popular `user` antes de marcar `signedIn = true`.
- **`src/app/_layout.tsx`** envolve toda a árvore em `<AuthProvider>` e contém o componente `Guard`:
  - Enquanto `!ready`, mostra um `ActivityIndicator` de tela cheia (evita "piscar" a tela de login antes de saber se o usuário está autenticado).
  - Quando pronto: redireciona para `/Login` se `!signedIn` e não estiver lá; redireciona para `/` se `signedIn` e ainda estiver em `/Login`.
  - Renderiza `<Stack screenOptions={{ headerShown: false }}>` (sem cabeçalho nativo — cada tela desenha o próprio header) e um `<Toast>` global por cima de tudo.

### 6.4 Telas (rotas do expo-router)

| Rota | Arquivo | Fundo | O que mostra |
|---|---|---|---|
| `/Login` | `Login.tsx` | `#F8F8F8` | Formulário único que alterna entre login/cadastro; campos de e-mail/senha vêm pré-preenchidos com a conta demo |
| `/` | `index.tsx` | claro | Home: `Header` (avatar, saldo total, receitas/gastos do mês) + `GastCateg` (donut das 3 maiores categorias) + `UltTransac` (últimas 5 transações do mês) |
| `/Contas` | `Contas.tsx` | `#F8F8F8` | Saldo consolidado + cards coloridos por conta (ícone por tipo); editar (`EditarContaModal`) e excluir (com confirmação e tratamento do erro 409 se houver transações vinculadas); botão para `NovaContaModal` |
| `/Categorias` | `Categorias.tsx` | `#222222` | Total de gastos do mês + lista de categorias de despesa com barra de progresso proporcional ao gasto total |
| `/Transferencias` | `Transferencias.tsx` | `#222222` | Histórico completo de transações do mês selecionado, com filtro mensal, resumo (receitas/despesas/saldo), modal de detalhes e edição |
| `/Orcamentos` | `Orcamentos.tsx` | claro, header escuro | Cards de progresso por orçamento (verde/amarelo/vermelho conforme %), modal "Ver detalhes", criação (`NovoOrcamentoModal`) e edição (`EditarOrcamentoModal`) |
| `/Estatisticas` | `Estatisticas.tsx` | `#222222` | Filtro mensal + cards de resumo + gráficos de linha (progressão de saldo, receitas e despesas acumuladas, receitas vs. despesas) e gráficos de pizza (gastos por categoria, distribuição por conta), usando `react-native-chart-kit` |

Navegação entre todas elas acontece pelo `BottomNav`, presente em toda tela autenticada.

### 6.5 Hooks de dados

Toda a lógica de busca/derivação de dados fica em hooks, mantendo as telas focadas em apresentação:

- **`useTransacoes(limit?)`** — busca `Transactions.list()` e mapeia os campos do inglês (API) para o português usado na UI (`title→titulo`, `amount→valor`, `type→tipo` como `"receita"|"despesa"`, `date→data`). Também expõe `receitas`/`despesas` já filtrados.
- **`useTransacoesFiltradas({ mes, ano, tipo })`** — usa `useTransacoes()` por baixo e filtra por mês/ano/tipo em memória (`useMemo`), retornando também os totais (`totalReceitas`, `totalDespesas`, `saldo`) do recorte.
- **`useFiltroMes({ transacoes, mesInicial, anoInicial, aoMudarMes })`** — hook "puro" de UI que controla o mês/ano selecionado em um filtro, calculando se existe mês anterior/próximo com transações (para habilitar/desabilitar as setas) e formatando o rótulo (`"JULHO 2026"`).
- **`useDashboard({ mesInicial?, anoInicial?, aoMudarMes? })`** — combina o resumo global (`Dashboard.summary()`) com `useFiltroMes` + `useTransacoesFiltradas` para also expor `mesAtual`/`exibicaoMes`/`mesAnterior`/`proximoMes` e os totais **do mês selecionado** (`receitaTotal`/`gastoTotal` recalculados no cliente a partir das transações filtradas, não do endpoint `/dashboard`, que é sempre "total geral").
- **`useCategorias({ mes, ano })`** — agrupa as despesas filtradas por categoria, calculando `valor`, `transacoes` (contagem), `progresso` (0–1) e `porcentagem` (0–100) de participação no total gasto — usado em `/Categorias` e no donut da Home.
- **`useOrcamentos(mes?, ano?)`** — carrega `Categories.list()` e cruza com as despesas filtradas para expor helpers (`getGasto`, `getLimite`, `getDescricao`, `getCategoriaNome/Icon/Cor`, `obterPorcentagem`, `obterCor`) usados pela tela e pelo modal de orçamentos. `obterCor`: verde (`progressGreen`) abaixo de 80%, amarelo (`warning`) entre 80–99%, vermelho (`error`) a partir de 100%.
- **`useEstatisticas(mes?, ano?)`** — o hook mais elaborado: busca contas (`Accounts.list()`) e reaproveita `useTransacoesFiltradas` para montar os datasets do `react-native-chart-kit` — saldo acumulado, despesas acumuladas, receitas acumuladas (linha), receitas-vs-despesas por dia (duas linhas) e a distribuição de gastos por categoria / saldo por conta (pizza).

Todos os hooks de busca (exceto `useFiltroMes`, que é puro) se inscrevem em `onDataChanged` (ver 6.7) para recarregar automaticamente quando qualquer tela cria/edita/apaga um registro.

### 6.6 Componentes reutilizáveis

- **`BottomNav`** — `BottomNavigation.Bar` do React Native Paper com 7 destinos: Início, Contas, Orçamentos, **"+" central** (abre `NovaTransacaoModal` diretamente, sem navegar), Categorias, Estatísticas, Transferências. Detecta a aba ativa comparando o `pathname` atual do `expo-router`.
- **`Header`** — card escuro no topo da Home com avatar (inicial do nome), botão de logout, saldo total em destaque e dois mini-cards (Receitas/Gastos).
- **`GastCateg`** — donut SVG desenhado à mão (`react-native-svg`, sem lib de gráfico) com as 3 maiores categorias de despesa do mês + legenda com valor e percentual; link "Ver tudo" para `/Categorias`.
- **`UltTransac`** — lista das 5 transações mais recentes do mês na Home; link "Ver tudo" para `/Transferencias`.
- **`FiltroMensal`** — seta esquerda/direita + rótulo do mês/ano + contagem de transações daquele mês; usado em `/Transferencias` e `/Estatisticas`. As setas desabilitam automaticamente quando não há transações no mês adjacente (via `useFiltroMes`).
- **`EmptyCont`** — estado vazio genérico (título + texto), reaproveitado em `GastCateg`, `UltTransac`, `/Categorias` e `/Transferencias` quando não há dados no recorte selecionado.
- **Modais de criação** — `NovaContaModal`, `NovaTransacaoModal`, `NovoOrcamentoModal`: bottom-sheets (72–80% da altura da tela) com máscara de valor monetário, seletores em sub-modal (tipo de conta, conta, categoria) e seletor de cor (`react-native-wheel-color-picker`) para contas.
- **Modais de edição** — `EditarContaModal`, `EditarTransacaoModal`, `EditarOrcamentoModal`: mesmo padrão visual das modais de criação, pré-preenchidos com o registro selecionado, chamando `PATCH` no respectivo endpoint.
- **`DetalhesTransacaoModal`** — modal somente-leitura com os detalhes de uma transação, com atalhos para editar (abre `EditarTransacaoModal`) ou excluir.
- **`Toast/`** — configuração do `react-native-toast-message` (`toastConfig.tsx`) com variantes `success`/`error`/`info` e helpers `showSuccess`/`showError`/`showInfo` (`toast.ts`), usados por praticamente toda ação de escrita (criar/editar/excluir) para dar feedback imediato ao usuário.

### 6.7 Sincronização de dados sem store global

Em vez de Redux/Zustand/React Query, o app usa um **event bus minimalista** (`src/utils/events.ts`, ~20 linhas):

```ts
onDataChanged(listener)   // qualquer hook se inscreve para saber quando refetchar
emitDataChanged()         // qualquer mutação (criar/editar/excluir) chama isso depois de um sucesso
```

O fluxo é: uma modal cria/edita/apaga um registro → chama `emitDataChanged()` → todo hook de dados atualmente montado (Home, Contas, Categorias, Transferências, Orçamentos, Estatísticas — não importa em qual tela o usuário está) recebe o evento e refaz sua própria chamada à API. Isso mantém a UI inteira consistente após qualquer escrita, sem precisar de um estado global compartilhado nem de invalidação manual de cache por tela.

Outros utilitários pequenos e usados em todo o app:
- **`formatCurrency(value)`** — formata em `pt-BR`/BRL (`"R$ 1.234,56"`), tratando `null`/`undefined`/`NaN` como `0`.
- **`parseMoney(text)`** — o inverso: extrai um `number` de uma string mascarada em BRL, usado nos inputs monetários das modais.
- **`formatDate(isoString)`** — formata como `"22 de jul."` (dia + mês abreviado, `pt-BR`).

> `src/data/data.ts` contém os mocks originais do protótipo. O arquivo permanece por referência histórica, mas **nenhum código em runtime o importa** — todos os dados exibidos vêm da API.

---

## 7. Design system / identidade visual

Paleta central em **`frontend/src/constants/colors.ts`**:

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#9CFF19` | verde-limão neon — acento principal, aba ativa, botão "+", header de orçamentos, destaques em gráficos |
| `darkBackground` | `#222222` | header da Home, bottom nav, telas escuras (Categorias, Transferências, Estatísticas), splash screen |
| `background` | `#F8F8F8` | fundo das telas claras, inputs, modais |
| `white` / `black` | `#FFFFFF` / `#1A1A1A` | superfícies e texto principal |
| `gray` · `lightGray` · `darkGray` · `borderGray` | `#AAAAAA` · `#D9D9D9` · `#383A39` · `#EFEFEF` | textos secundários, bordas, divisores |
| `success` / `danger` | `#116E1F` / `rgb(167, 2, 5)` | valores de receita / despesa em listas |
| `chart_income` / `chart_expense` | `#16A34A` / `#DC2626` | cores de receita/despesa especificamente em gráficos e ícones de transação |
| `progressGreen` · `warning` · `error` | `#1F7A3D` · `#D8A300` · `#B00000` | barra de progresso de orçamento: <80% / 80–99% / ≥100% |

`CATEGORY_COLORS` mapeia cada categoria padrão (Alimentação, Transporte, Moradia, Assinaturas, Renda, Saúde, Lazer, Educação) para uma cor fixa, usada nos gráficos de pizza da tela de Estatísticas.

**Tipografia:** fontes do sistema (sem fonte customizada carregada). Escala aproximada: títulos de tela 28–36px bold, títulos de seção 16–18px bold/semibold, corpo 13–16px, labels/legendas 11–13px, valores monetários em destaque 16–36px.

**Padrões de UX:**
- Navegação por arquivo (`expo-router`) com bottom nav persistente em todas as telas autenticadas.
- Inputs monetários sempre mascarados em BRL (`parseMoney`/`formatCurrency`).
- Seletores (tipo de conta, categoria, conta) resolvidos como sub-modais inline, nunca como `<Picker>` nativo isolado.
- Toda criação passa por um bottom-sheet (modal deslizando de baixo), nunca por uma tela cheia separada.
- Toda exclusão destrutiva passa por um `Alert.alert` de confirmação nativo antes de chamar a API.
- Erros de API sempre viram um toast (`showError`) com a mensagem vinda do backend — nunca um alerta genérico silencioso.

---

## 8. Como rodar o projeto

### Pré-requisitos
- Node.js ≥ 20
- Docker (para o Postgres) — ou um Postgres 16 próprio
- Um dispositivo/emulador Android ou iOS, ou navegador (para `expo start --web`)

### Backend

```bash
cd backend
cp .env.example .env          # preencha JWT_ACCESS_SECRET e JWT_REFRESH_SECRET
                               # gerar um segredo: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
docker compose up -d          # sobe o PostgreSQL 16 (host :5433 → container :5432)
# ajuste DATABASE_URL no .env para a porta 5433, já que é a que o compose expõe no host
npm install
npx prisma migrate deploy     # aplica as migrations no banco
npx prisma db seed            # cria o usuário demo + categorias
npm run start:dev             # API em http://localhost:3333/api  (Swagger em /api/docs)
```

Scripts úteis do backend (`backend/package.json`):

| Script | Ação |
|---|---|
| `npm run start:dev` | NestJS em watch mode |
| `npm run start:prod` | `node dist/main.js` (após `npm run build`) |
| `npm run build` | `nest build` |
| `npm test` | testes unitários (`*.spec.ts`, não precisam de banco) |
| `npm run test:cov` | testes unitários com relatório de cobertura |
| `npm run test:e2e` | testes e2e (`test/jest-e2e.json`, **exige banco vivo**) |
| `npm run lint` | ESLint (`--fix`) + Prettier |
| `npx prisma studio` | UI visual para inspecionar o banco |
| `npx prisma db seed` | popula usuário demo + categorias (idempotente) |

### Frontend

```bash
cd frontend
cp .env.example .env          # ajuste EXPO_PUBLIC_API_URL se for usar um dispositivo físico
npm install
npm run start                 # abre o Metro/Expo Dev Tools — pressione a / i / w para Android/iOS/Web
```

Scripts do frontend (`frontend/package.json`): `npm run start`, `npm run android`, `npm run ios`, `npm run web`.

### Conta de demonstração

Depois do seed do backend, use:

**`demo@fintrack.app`** / **`demo1234`**

(esses valores já vêm pré-preenchidos nos campos da tela de login).

---

## 9. Fluxos de ponta a ponta (exemplos)

**Registrar uma nova despesa:**
1. Usuário toca no "+" central do `BottomNav` → abre `NovaTransacaoModal`.
2. Preenche título, valor (mascarado em BRL), escolhe tipo (receita/despesa), conta e categoria, data.
3. Modal chama `Transactions.create(...)` → `POST /api/transactions`.
4. No backend, `TransactionsService.create` roda dentro de `prisma.$transaction`: valida posse da conta/categoria, decrementa (despesa) ou incrementa (receita) o `Account.balance`, cria a `Transaction`, retorna tudo serializado (`amount` como `number`).
5. Modal fecha, dispara `emitDataChanged()`.
6. Todo hook ativo (Home, Contas, Transferências, Estatísticas etc.) refaz sua busca — o saldo na Home, o card da conta em `/Contas` e a lista em `/Transferencias` atualizam sozinhos, sem navegação ou reload manual.

**Token de acesso expira em uso:**
1. Usuário está navegando; o `accessToken` (TTL de 15 min) expira.
2. Uma chamada qualquer (ex.: `Accounts.list()`) recebe `401` do backend.
3. `api()` em `client.ts` detecta o `401`, chama `POST /auth/refresh` com o `refreshToken` salvo.
4. Backend valida o hash do refresh, emite **novo** par de tokens (rotação), o cliente salva ambos.
5. `client.ts` repete a requisição original com o novo `accessToken` — o usuário não percebe nada, nenhuma tela de erro aparece.
6. Se o refresh também falhar (ex.: token revogado por logout em outro dispositivo), os tokens são limpos e o `Guard` do `_layout.tsx` redireciona para `/Login` no próximo render.

---

## 10. Decisões de arquitetura e por quê

Estes princípios (definidos originalmente no plano TDD em `docs/superpowers/plans/2026-05-29-fintrack-backend.md`) guiam o código do backend até hoje:

- **Um módulo NestJS por entidade de domínio** (`auth`, `users`, `accounts`, `categories`, `transactions`, `budgets`, `dashboard`, `health`) — cada um com seu `Controller`, `Service` e `Module`, sem lógica de negócio vazando para fora do service.
- **Tudo escopado ao usuário autenticado** — nenhuma query do Prisma roda sem um `where: { userId }` (ou uma checagem de posse equivalente antes de atualizar/apagar). O `userId` nunca vem do corpo da requisição, sempre do JWT via `@CurrentUser()`.
- **A tabela de transações é a única fonte de verdade** — totais de categoria, gasto de orçamento e os totais do dashboard são sempre recalculados via `groupBy`/`aggregate`, nunca duplicados em uma coluna própria. Isso torna impossível esses agregados "dessincronizarem" da lista real de transações.
- **Saldo de conta é a exceção** — é o único valor derivado que é mantido de forma incremental (por custo de performance), sempre dentro de uma `prisma.$transaction` para garantir atomicidade entre a escrita da transação e o ajuste do saldo.
- **Dinheiro é sempre `Decimal(14,2)`** no banco, convertido para `number` só na borda da API (`toDecimal`/`toNumber`), nunca manipulado como `float` em cálculos financeiros.
- **JWT de vida curta + refresh rotativo** — minimiza a janela de uso de um access token vazado, e o hash do refresh atual salvo no usuário permite tanto invalidar sessões (`logout`) quanto detectar reuso de um refresh token já rotacionado.

No frontend, a escolha consciente por **não usar uma lib de estado global** (Redux/Zustand/React Query) veio do tamanho do app: um event bus de ~20 linhas resolve a necessidade real (repropagar "algo mudou, refaça sua busca") sem a complexidade de cache/invalidação de uma lib maior — uma troca deliberada de robustez teórica por simplicidade prática, dado o escopo atual do projeto.
