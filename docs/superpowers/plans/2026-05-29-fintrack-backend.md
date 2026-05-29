# FinTrack Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, secure, multi-user REST backend that powers every screen of the existing FinTrack Expo app (Dashboard, Contas, Categorias, Orçamentos, Transferências), replacing the mock data in `frontend/src/data/data.ts` with live, per-user data.

**Architecture:** NestJS (modular, one module per domain entity) over Prisma ORM and PostgreSQL. Authentication is JWT-based (short-lived access token + rotating refresh token), with every resource scoped to the authenticated user. Money is stored as `Decimal` (never float). All "aggregate" fields the frontend currently hardcodes (`categoria.valor`, `categoria.transacoes`, `orcamento.gasto`, dashboard totals) are **derived at query time** from the `Transaction` table — the transaction ledger is the single source of truth. Account balances are maintained transactionally on every write.

**Tech Stack:** Node 20, TypeScript, NestJS 11, Prisma 6, PostgreSQL 16, Jest + Supertest, `@nestjs/jwt` + Passport, Argon2 password hashing, `@nestjs/throttler` (rate limiting), Helmet, Zod-via-`nestjs-zod` (or class-validator), Docker + docker-compose, GitHub Actions CI.

---

## Conventions used in this plan

- **Repo layout:** the backend lives in a new top-level `backend/` directory, sibling to `frontend/`.
- **Commands** are run from `backend/` unless a path says otherwise.
- **TDD loop** per behavior: write failing test → run (red) → implement minimal code → run (green) → commit. Commit messages use Conventional Commits.
- **Money:** all monetary columns are `Decimal(14,2)`. API accepts/returns numbers (reais), Prisma maps them to `Decimal`. Conversion helper lives in `src/common/money.ts`.
- **User scoping:** every query for Account/Transaction/Budget filters by `userId` taken from the JWT. There is no endpoint that returns another user's data.
- **IDs:** `cuid()` strings (Prisma default), matching the string IDs the frontend already uses.

---

## File Structure (decomposition map)

```
backend/
├── docker-compose.yml              # local Postgres
├── Dockerfile                      # production image (multi-stage)
├── .env / .env.example             # DATABASE_URL, JWT secrets, etc.
├── .github/workflows/ci.yml        # lint + test + prisma validate
├── prisma/
│   ├── schema.prisma               # User, Account, Category, Transaction, Budget
│   └── seed.ts                     # default categories + tipos de conta + demo user
├── src/
│   ├── main.ts                     # bootstrap: helmet, CORS, global pipes, swagger
│   ├── app.module.ts               # wires all feature modules + ThrottlerModule
│   ├── config/
│   │   └── env.validation.ts       # validates process.env at boot
│   ├── prisma/
│   │   ├── prisma.module.ts        # global module exposing PrismaService
│   │   └── prisma.service.ts       # PrismaClient lifecycle
│   ├── common/
│   │   ├── money.ts                # toDecimal / toNumber helpers
│   │   ├── decorators/current-user.decorator.ts
│   │   └── dto/                    # shared pagination dto, etc.
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts      # POST /auth/register, /login, /refresh, /logout
│   │   ├── auth.service.ts
│   │   ├── dto/                    # register.dto.ts, login.dto.ts
│   │   ├── strategies/jwt.strategy.ts
│   │   ├── strategies/jwt-refresh.strategy.ts
│   │   └── guards/jwt-auth.guard.ts, jwt-refresh.guard.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   └── users.service.ts        # create, findByEmail, store refresh hash
│   ├── categories/
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts # GET /categories (with aggregates)
│   │   ├── categories.service.ts
│   │   └── dto/create-category.dto.ts
│   ├── accounts/
│   │   ├── accounts.module.ts
│   │   ├── accounts.controller.ts  # full CRUD /accounts
│   │   ├── accounts.service.ts
│   │   └── dto/ (create, update)
│   ├── transactions/
│   │   ├── transactions.module.ts
│   │   ├── transactions.controller.ts # CRUD /transactions
│   │   ├── transactions.service.ts # writes adjust account balance atomically
│   │   └── dto/ (create, update, query)
│   ├── budgets/
│   │   ├── budgets.module.ts
│   │   ├── budgets.controller.ts   # CRUD /budgets with derived "gasto"
│   │   ├── budgets.service.ts
│   │   └── dto/ (create, update)
│   └── dashboard/
│       ├── dashboard.module.ts
│       ├── dashboard.controller.ts # GET /dashboard summary
│       └── dashboard.service.ts
└── test/
    └── *.e2e-spec.ts               # Supertest e2e per module
```

Frontend changes (Phase 8) live under `frontend/src/`:
```
frontend/src/
├── api/client.ts                   # fetch wrapper + token storage
├── api/endpoints.ts                # typed calls
├── context/AuthContext.tsx         # login state + secure token storage
└── hooks/*                         # rewired to call the API
```

---

## Phase 0 — Project scaffolding & tooling

### Task 0.1: Scaffold the NestJS project

**Files:**
- Create: `backend/` (entire Nest skeleton)

- [ ] **Step 1: Create the project**

Run (from repo root `/home/dev/FinTrack`):
```bash
npx -y @nestjs/cli@11 new backend --package-manager npm --skip-git
```
Expected: `backend/` created with `src/main.ts`, `src/app.module.ts`, passing default test.

- [ ] **Step 2: Verify the skeleton builds and tests pass**

Run:
```bash
cd backend && npm run build && npm test
```
Expected: build succeeds; default `app.controller.spec.ts` passes.

- [ ] **Step 3: Pin Node engine & add scripts**

Edit `backend/package.json` — add:
```json
"engines": { "node": ">=20" },
```
and ensure these scripts exist (Nest adds most): `"start:dev"`, `"build"`, `"test"`, `"test:e2e"`, `"lint"`.

- [ ] **Step 4: Commit**

```bash
git add backend && git commit -m "chore(backend): scaffold NestJS project"
```

---

### Task 0.2: Add PostgreSQL via docker-compose + Prisma

**Files:**
- Create: `backend/docker-compose.yml`
- Create: `backend/.env`, `backend/.env.example`
- Create: `backend/prisma/schema.prisma` (initialized)

- [ ] **Step 1: Write docker-compose for local Postgres**

Create `backend/docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: fintrack
      POSTGRES_PASSWORD: fintrack
      POSTGRES_DB: fintrack
    ports:
      - "5432:5432"
    volumes:
      - fintrack_pgdata:/var/lib/postgresql/data
volumes:
  fintrack_pgdata:
```

- [ ] **Step 2: Start the database**

Run:
```bash
docker compose up -d db
```
Expected: container `backend-db-1` running; `docker compose ps` shows healthy.

- [ ] **Step 3: Install & init Prisma**

Run:
```bash
npm install -D prisma && npm install @prisma/client
npx prisma init --datasource-provider postgresql
```
Expected: `prisma/schema.prisma` and a root `.env` created.

- [ ] **Step 4: Configure env files**

Edit `backend/.env`:
```
DATABASE_URL="postgresql://fintrack:fintrack@localhost:5432/fintrack?schema=public"
JWT_ACCESS_SECRET="dev-access-change-me"
JWT_REFRESH_SECRET="dev-refresh-change-me"
JWT_ACCESS_TTL="900s"
JWT_REFRESH_TTL="7d"
PORT="3000"
CORS_ORIGINS="http://localhost:8081"
```
Create `backend/.env.example` with the same keys but empty/placeholder values. Confirm `.env` is in `backend/.gitignore` (Nest adds it).

- [ ] **Step 5: Commit**

```bash
git add backend/docker-compose.yml backend/prisma backend/.env.example backend/package.json backend/package-lock.json
git commit -m "chore(backend): add postgres compose and prisma init"
```

---

### Task 0.3: Environment validation + global config

**Files:**
- Create: `backend/src/config/env.validation.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Write failing test for env validation**

Create `backend/src/config/env.validation.spec.ts`:
```ts
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('throws when DATABASE_URL is missing', () => {
    expect(() => validateEnv({ JWT_ACCESS_SECRET: 'a', JWT_REFRESH_SECRET: 'b' })).toThrow();
  });

  it('returns parsed config when all required vars present', () => {
    const cfg = validateEnv({
      DATABASE_URL: 'postgresql://x',
      JWT_ACCESS_SECRET: 'a',
      JWT_REFRESH_SECRET: 'b',
    });
    expect(cfg.DATABASE_URL).toBe('postgresql://x');
    expect(cfg.PORT).toBe(3000); // default
  });
});
```

- [ ] **Step 2: Run test (red)**

Run: `npm test -- env.validation`
Expected: FAIL — `validateEnv` not defined.

- [ ] **Step 3: Implement env validation**

Install: `npm install zod`
Create `backend/src/config/env.validation.ts`:
```ts
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_TTL: z.string().default('900s'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:8081'),
});

export type Env = z.infer<typeof schema>;

export function validateEnv(env: Record<string, unknown>): Env {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    throw new Error('Invalid environment: ' + parsed.error.toString());
  }
  return parsed.data;
}
```

- [ ] **Step 4: Wire ConfigModule with validation**

Edit `backend/src/app.module.ts` imports array to include:
```ts
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
// ...
ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
```
Install: `npm install @nestjs/config`

- [ ] **Step 5: Run tests (green) & boot check**

Run: `npm test -- env.validation && npm run build`
Expected: PASS + build OK.

- [ ] **Step 6: Commit**

```bash
git add backend/src/config backend/src/app.module.ts backend/package.json backend/package-lock.json
git commit -m "feat(backend): validate environment at boot"
```

---

### Task 0.4: Global PrismaService (global module)

**Files:**
- Create: `backend/src/prisma/prisma.service.ts`, `backend/src/prisma/prisma.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Implement PrismaService**

Create `backend/src/prisma/prisma.service.ts`:
```ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 2: Implement global PrismaModule**

Create `backend/src/prisma/prisma.module.ts`:
```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 3: Register in AppModule**

Edit `backend/src/app.module.ts` — add `PrismaModule` to `imports`.

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/prisma backend/src/app.module.ts
git commit -m "feat(backend): add global PrismaService"
```

---

## Phase 1 — Database schema

### Task 1.1: Define the Prisma schema

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Write the full schema**

Replace `backend/prisma/schema.prisma` model section with:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TransactionType {
  RECEITA
  DESPESA
}

enum AccountType {
  CONTA_CORRENTE
  CONTA_POUPANCA
  CARTEIRA
  CARTAO_CREDITO
  INVESTIMENTOS
  OUTROS
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  refreshHash  String?  // hashed current refresh token (rotation)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  accounts     Account[]
  categories   Category[]
  transactions Transaction[]
  budgets      Budget[]
}

model Category {
  id     String  @id @default(cuid())
  userId String
  label  String
  value  String  // slug used by the frontend, unique per user
  isIncome Boolean @default(false) // "renda" is income, excluded from gastos

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]
  budgets      Budget[]

  @@unique([userId, value])
  @@index([userId])
}

model Account {
  id     String      @id @default(cuid())
  userId String
  label  String
  type   AccountType
  balance Decimal    @default(0) @db.Decimal(14, 2)
  color  String      @default("#AAAAAA")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@index([userId])
}

model Transaction {
  id         String          @id @default(cuid())
  userId     String
  title      String
  amount     Decimal         @db.Decimal(14, 2)
  type       TransactionType
  date       DateTime
  accountId  String
  categoryId String
  createdAt  DateTime        @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  account  Account  @relation(fields: [accountId], references: [id], onDelete: Restrict)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  @@index([userId, date])
  @@index([accountId])
  @@index([categoryId])
}

model Budget {
  id          String  @id @default(cuid())
  userId      String
  title       String
  description String  @default("")
  limit       Decimal @db.Decimal(14, 2)
  categoryId  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  @@unique([userId, categoryId]) // one budget per category per user
  @@index([userId])
}
```

- [ ] **Step 2: Validate schema**

Run: `npx prisma validate`
Expected: "The schema is valid 🎉".

- [ ] **Step 3: Create the migration**

Run:
```bash
npx prisma migrate dev --name init
```
Expected: migration applied; `@prisma/client` generated.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma
git commit -m "feat(backend): initial database schema"
```

---

### Task 1.2: Seed default categories, account types & a demo user

**Files:**
- Create: `backend/prisma/seed.ts`
- Modify: `backend/package.json` (prisma.seed config)

- [ ] **Step 1: Write the seed script**

Create `backend/prisma/seed.ts`:
```ts
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { label: 'Alimentação', value: 'alimentacao', isIncome: false },
  { label: 'Transporte', value: 'transporte', isIncome: false },
  { label: 'Moradia', value: 'moradia', isIncome: false },
  { label: 'Assinaturas', value: 'assinaturas', isIncome: false },
  { label: 'Renda', value: 'renda', isIncome: true },
  { label: 'Saúde', value: 'saude', isIncome: false },
  { label: 'Lazer', value: 'lazer', isIncome: false },
  { label: 'Educação', value: 'educacao', isIncome: false },
];

async function main() {
  const passwordHash = await argon2.hash('demo1234');
  const user = await prisma.user.upsert({
    where: { email: 'demo@fintrack.app' },
    update: {},
    create: { email: 'demo@fintrack.app', name: 'Fulano', passwordHash },
  });

  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_value: { userId: user.id, value: c.value } },
      update: {},
      create: { ...c, userId: user.id },
    });
  }
  console.log('Seeded user', user.email);
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Install argon2 & configure seed**

Run: `npm install argon2 && npm install -D ts-node`
Edit `backend/package.json` — add:
```json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```

- [ ] **Step 3: Run the seed**

Run: `npx prisma db seed`
Expected: "Seeded user demo@fintrack.app".

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/seed.ts backend/package.json backend/package-lock.json
git commit -m "feat(backend): seed default categories and demo user"
```

> **Account-type lookup:** the frontend's `tiposConta` dropdown maps to the `AccountType` enum. Expose it as a static list in `accounts.controller.ts` (Task 4) — no table needed.

---

## Phase 2 — Auth & security foundation

### Task 2.1: Users service + money helper

**Files:**
- Create: `backend/src/users/users.service.ts`, `backend/src/users/users.module.ts`
- Create: `backend/src/common/money.ts`

- [ ] **Step 1: Write failing test for money helper**

Create `backend/src/common/money.spec.ts`:
```ts
import { toNumber, toDecimal } from './money';
import { Prisma } from '@prisma/client';

describe('money', () => {
  it('converts Decimal to number with 2 places', () => {
    expect(toNumber(new Prisma.Decimal('39.90'))).toBe(39.9);
  });
  it('converts number to Decimal', () => {
    expect(toDecimal(2300).toString()).toBe('2300');
  });
});
```

- [ ] **Step 2: Run (red)**

Run: `npm test -- money`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement money helper**

Create `backend/src/common/money.ts`:
```ts
import { Prisma } from '@prisma/client';

export function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function toNumber(value: Prisma.Decimal | null | undefined): number {
  return value ? Number(value.toFixed(2)) : 0;
}
```

- [ ] **Step 4: Run (green)**

Run: `npm test -- money`
Expected: PASS.

- [ ] **Step 5: Implement UsersService**

Create `backend/src/users/users.service.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: { email: string; name: string; passwordHash: string }) {
    return this.prisma.user.create({ data });
  }

  setRefreshHash(userId: string, refreshHash: string | null) {
    return this.prisma.user.update({ where: { id: userId }, data: { refreshHash } });
  }
}
```

Create `backend/src/users/users.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({ providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/common/money.ts backend/src/common/money.spec.ts backend/src/users
git commit -m "feat(backend): users service and money helpers"
```

---

### Task 2.2: Auth service — register & login

**Files:**
- Create: `backend/src/auth/auth.service.ts`, `dto/register.dto.ts`, `dto/login.dto.ts`
- Create: `backend/src/auth/auth.module.ts`

- [ ] **Step 1: Write failing unit test**

Create `backend/src/auth/auth.service.spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  const users = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    setRefreshHash: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('tok') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('rejects login with wrong password', async () => {
    users.findByEmail.mockResolvedValue({
      id: '1', email: 'a@b.c', name: 'A',
      passwordHash: await argon2.hash('right'),
    });
    await expect(service.login({ email: 'a@b.c', password: 'wrong' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issues tokens on valid login', async () => {
    users.findByEmail.mockResolvedValue({
      id: '1', email: 'a@b.c', name: 'A',
      passwordHash: await argon2.hash('right'),
    });
    const res = await service.login({ email: 'a@b.c', password: 'right' });
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
  });
});
```

- [ ] **Step 2: Run (red)**

Run: `npm test -- auth.service`
Expected: FAIL — AuthService not implemented.

- [ ] **Step 3: Install auth deps & write DTOs**

Run: `npm install @nestjs/jwt @nestjs/passport passport passport-jwt && npm install -D @types/passport-jwt`
Run: `npm install class-validator class-transformer`

Create `backend/src/auth/dto/register.dto.ts`:
```ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(8) password: string;
}
```

Create `backend/src/auth/dto/login.dto.ts`:
```ts
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}
```

- [ ] **Step 4: Implement AuthService**

Create `backend/src/auth/auth.service.ts`:
```ts
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email já cadastrado');
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.users.create({ email: dto.email, name: dto.name, passwordHash });
    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');
    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.users.setRefreshHash(userId, null);
    return { success: true };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.users.findById(userId);
    if (!user || !user.refreshHash) throw new UnauthorizedException();
    const ok = await argon2.verify(user.refreshHash, refreshToken);
    if (!ok) throw new UnauthorizedException();
    return this.issueTokens(user.id, user.email);
  }

  private async issueTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email },
        {
          secret: this.config.get('JWT_ACCESS_SECRET'),
          expiresIn: this.config.get('JWT_ACCESS_TTL'),
        },
      ),
      this.jwt.signAsync(
        { sub: userId, email },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_TTL'),
        },
      ),
    ]);
    await this.users.setRefreshHash(userId, await argon2.hash(refreshToken));
    return { accessToken, refreshToken };
  }
}
```

- [ ] **Step 5: Run (green)**

Run: `npm test -- auth.service`
Expected: PASS (both cases).

- [ ] **Step 6: Commit**

```bash
git add backend/src/auth
git commit -m "feat(backend): auth service with register/login/refresh"
```

---

### Task 2.3: JWT strategies, guards & current-user decorator

**Files:**
- Create: `backend/src/auth/strategies/jwt.strategy.ts`, `jwt-refresh.strategy.ts`
- Create: `backend/src/auth/guards/jwt-auth.guard.ts`, `jwt-refresh.guard.ts`
- Create: `backend/src/common/decorators/current-user.decorator.ts`

- [ ] **Step 1: Implement access-token strategy**

Create `backend/src/auth/strategies/jwt.strategy.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }
  async validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

- [ ] **Step 2: Implement refresh-token strategy**

Create `backend/src/auth/strategies/jwt-refresh.strategy.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }
  validate(req: Request, payload: { sub: string; email: string }) {
    const refreshToken = (req.headers.authorization ?? '').replace('Bearer ', '').trim();
    return { userId: payload.sub, email: payload.email, refreshToken };
  }
}
```

- [ ] **Step 3: Implement guards**

Create `backend/src/auth/guards/jwt-auth.guard.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Create `backend/src/auth/guards/jwt-refresh.guard.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
```

- [ ] **Step 4: Implement current-user decorator**

Create `backend/src/common/decorators/current-user.decorator.ts`:
```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser { userId: string; email: string; refreshToken?: string }

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
```

- [ ] **Step 5: Build check**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/auth/strategies backend/src/auth/guards backend/src/common/decorators
git commit -m "feat(backend): jwt strategies, guards and current-user decorator"
```

---

### Task 2.4: Auth controller + AuthModule wiring + e2e

**Files:**
- Create: `backend/src/auth/auth.controller.ts`
- Create: `backend/src/auth/auth.module.ts`
- Modify: `backend/src/app.module.ts`
- Create: `backend/test/auth.e2e-spec.ts`

- [ ] **Step 1: Write the controller**

Create `backend/src/auth/auth.controller.ts`:
```ts
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(200)
  refresh(@CurrentUser() user: AuthUser) {
    return this.auth.refresh(user.userId, user.refreshToken!);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  logout(@CurrentUser() user: AuthUser) {
    return this.auth.logout(user.userId);
  }
}
```

- [ ] **Step 2: Wire AuthModule**

Create `backend/src/auth/auth.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [UsersModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
```
Edit `backend/src/app.module.ts` — add `AuthModule` and `UsersModule` to `imports`.

- [ ] **Step 3: Write e2e test**

Create `backend/test/auth.e2e-spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const email = `u${Date.now()}@t.com`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });
  afterAll(async () => app.close());

  it('registers then logs in', async () => {
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'Test', password: 'supersecret' })
      .expect(201);
    expect(reg.body.accessToken).toBeDefined();

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'supersecret' })
      .expect(200);
    expect(login.body.refreshToken).toBeDefined();
  });

  it('rejects duplicate registration', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'Test', password: 'supersecret' })
      .expect(409);
  });
});
```

- [ ] **Step 4: Run e2e (green)**

Run (db must be up): `npm run test:e2e -- auth`
Expected: PASS (register 201, login 200, duplicate 409).

- [ ] **Step 5: Commit**

```bash
git add backend/src/auth/auth.controller.ts backend/src/auth/auth.module.ts backend/src/app.module.ts backend/test/auth.e2e-spec.ts
git commit -m "feat(backend): auth endpoints with e2e coverage"
```

---

### Task 2.5: Global security hardening (helmet, CORS, throttler, pipes, Swagger)

**Files:**
- Modify: `backend/src/main.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Install security deps**

Run:
```bash
npm install helmet @nestjs/throttler
npm install @nestjs/swagger
```

- [ ] **Step 2: Configure main.ts**

Replace `backend/src/main.ts`:
```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS')!.split(','),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const swagger = new DocumentBuilder()
    .setTitle('FinTrack API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));

  await app.listen(config.get<number>('PORT')!);
}
bootstrap();
```

- [ ] **Step 3: Add global rate limiting**

Edit `backend/src/app.module.ts` — add to imports:
```ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
// imports:
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
// providers:
{ provide: APP_GUARD, useClass: ThrottlerGuard },
```

> **Note:** the global API prefix is now `/api`. Update the e2e test paths added so far to `/api/auth/...` (do this in Step 4), and use `/api` as the base URL in the frontend client (Phase 8). The `CORS_ORIGINS` default already allows the Expo web origin `http://localhost:8081`.

- [ ] **Step 4: Fix e2e paths & re-run**

Edit `backend/test/auth.e2e-spec.ts` — prefix routes with `/api`. Add `app.setGlobalPrefix('api')` in the test's `beforeAll`.
Run: `npm run test:e2e -- auth`
Expected: PASS.

- [ ] **Step 5: Manual smoke**

Run: `npm run start:dev` then in another shell:
```bash
curl -s http://localhost:3000/api/docs-json | head -c 80
```
Expected: JSON beginning `{"openapi":"3.0.0"...`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main.ts backend/src/app.module.ts backend/test/auth.e2e-spec.ts
git commit -m "feat(backend): helmet, cors, rate limiting, swagger, global prefix"
```

---

## Phase 3 — Categories module

> Powers `useCategorias` (list + per-category aggregates) and feeds the category dropdowns in the transaction/budget modals.

### Task 3.1: Categories service with derived aggregates

**Files:**
- Create: `backend/src/categories/categories.service.ts`, `categories.controller.ts`, `categories.module.ts`, `dto/create-category.dto.ts`
- Create: `backend/test/categories.e2e-spec.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Write failing e2e**

Create `backend/test/categories.e2e-spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const email = `cat${Date.now()}@t.com`;
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register').send({ email, name: 'Cat', password: 'supersecret' });
    token = reg.body.accessToken;
  });
  afterAll(async () => app.close());

  it('requires auth', async () => {
    await request(app.getHttpServer()).get('/api/categories').expect(401);
  });

  it('creates and lists categories with aggregate fields', async () => {
    await request(app.getHttpServer())
      .post('/api/categories').set('Authorization', `Bearer ${token}`)
      .send({ label: 'Mercado', value: 'mercado', isIncome: false }).expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/categories').set('Authorization', `Bearer ${token}`).expect(200);
    const cat = res.body.find((c: any) => c.value === 'mercado');
    expect(cat).toBeDefined();
    expect(cat).toHaveProperty('valor');       // derived spend
    expect(cat).toHaveProperty('transacoes');  // derived count
  });
});
```

- [ ] **Step 2: Run (red)**

Run: `npm run test:e2e -- categories`
Expected: FAIL — route 404 / module missing.

- [ ] **Step 3: Write DTO**

Create `backend/src/categories/dto/create-category.dto.ts`:
```ts
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString() @MinLength(1) label: string;
  @IsString() @MinLength(1) value: string;
  @IsOptional() @IsBoolean() isIncome?: boolean;
}
```

- [ ] **Step 4: Write the service (derived aggregates)**

Create `backend/src/categories/categories.service.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { toNumber } from '../common/money';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { userId, label: dto.label, value: dto.value, isIncome: dto.isIncome ?? false },
    });
  }

  async findAll(userId: string) {
    const categories = await this.prisma.category.findMany({ where: { userId } });
    // derive valor (sum of transaction amounts) + transacoes (count) per category
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId },
      _sum: { amount: true },
      _count: { _all: true },
    });
    const map = new Map(grouped.map((g) => [g.categoryId, g]));
    return categories.map((c) => {
      const agg = map.get(c.id);
      return {
        id: c.id,
        label: c.label,
        value: c.value,
        isIncome: c.isIncome,
        valor: toNumber(agg?._sum.amount ?? null),
        transacoes: agg?._count._all ?? 0,
      };
    });
  }
}
```

- [ ] **Step 5: Write controller & module**

Create `backend/src/categories/categories.controller.ts`:
```ts
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto) {
    return this.service.create(user.userId, dto);
  }
}
```

Create `backend/src/categories/categories.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({ controllers: [CategoriesController], providers: [CategoriesService] })
export class CategoriesModule {}
```
Edit `backend/src/app.module.ts` — add `CategoriesModule` to imports.

- [ ] **Step 6: Run (green)**

Run: `npm run test:e2e -- categories`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/categories backend/test/categories.e2e-spec.ts backend/src/app.module.ts
git commit -m "feat(backend): categories module with derived aggregates"
```

---

## Phase 4 — Accounts module (full CRUD + balance)

> Powers the `Contas` screen (cards, create via `NovaContaModal`, edit ✏️, delete 🗑️) and the consolidated `saldoTotal`.

### Task 4.1: Accounts CRUD

**Files:**
- Create: `backend/src/accounts/accounts.service.ts`, `accounts.controller.ts`, `accounts.module.ts`
- Create: `backend/src/accounts/dto/create-account.dto.ts`, `update-account.dto.ts`
- Create: `backend/test/accounts.e2e-spec.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Write failing e2e**

Create `backend/test/accounts.e2e-spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Accounts (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register').send({ email: `acc${Date.now()}@t.com`, name: 'Acc', password: 'supersecret' });
    token = reg.body.accessToken;
  });
  afterAll(async () => app.close());

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('creates, lists, updates and deletes an account', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/accounts').set(auth())
      .send({ label: 'Nubank', type: 'CONTA_CORRENTE', balance: 100.5, color: '#8A05BE' })
      .expect(201);
    const id = created.body.id;
    expect(created.body.balance).toBe(100.5);

    const list = await request(app.getHttpServer()).get('/api/accounts').set(auth()).expect(200);
    expect(list.body).toHaveLength(1);

    await request(app.getHttpServer())
      .patch(`/api/accounts/${id}`).set(auth()).send({ label: 'Nu' }).expect(200);

    await request(app.getHttpServer()).delete(`/api/accounts/${id}`).set(auth()).expect(200);
    const after = await request(app.getHttpServer()).get('/api/accounts').set(auth()).expect(200);
    expect(after.body).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run (red)**

Run: `npm run test:e2e -- accounts`
Expected: FAIL — route missing.

- [ ] **Step 3: Write DTOs**

Create `backend/src/accounts/dto/create-account.dto.ts`:
```ts
import { IsEnum, IsHexColor, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @IsString() @MinLength(1) label: string;
  @IsEnum(AccountType) type: AccountType;
  @IsNumber() @Min(0) balance: number;
  @IsOptional() @IsHexColor() color?: string;
}
```

Create `backend/src/accounts/dto/update-account.dto.ts`:
```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
```
Install: `npm install @nestjs/mapped-types`

- [ ] **Step 4: Write the service**

Create `backend/src/accounts/accounts.service.ts`:
```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { toDecimal, toNumber } from '../common/money';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  private serialize = (a: any) => ({ ...a, balance: toNumber(a.balance) });

  async create(userId: string, dto: CreateAccountDto) {
    const acc = await this.prisma.account.create({
      data: {
        userId,
        label: dto.label,
        type: dto.type,
        balance: toDecimal(dto.balance),
        color: dto.color ?? '#AAAAAA',
      },
    });
    return this.serialize(acc);
  }

  async findAll(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId }, orderBy: { createdAt: 'asc' },
    });
    return accounts.map(this.serialize);
  }

  private async assertOwned(userId: string, id: string) {
    const acc = await this.prisma.account.findFirst({ where: { id, userId } });
    if (!acc) throw new NotFoundException('Conta não encontrada');
    return acc;
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.assertOwned(userId, id);
    const acc = await this.prisma.account.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.balance !== undefined && { balance: toDecimal(dto.balance) }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
    });
    return this.serialize(acc);
  }

  async remove(userId: string, id: string) {
    await this.assertOwned(userId, id);
    await this.prisma.account.delete({ where: { id } });
    return { success: true };
  }
}
```

> **Delete semantics:** `Transaction.account` uses `onDelete: Restrict`, so deleting an account that still has transactions will throw a Prisma error. Catch it in the controller layer is unnecessary here because Step 5 maps it; if you want a friendlier message, wrap `remove` in try/catch and rethrow `ConflictException('Conta possui transações')`. Add that in Step 4 now:
```ts
// inside remove(), replace the delete line with:
try {
  await this.prisma.account.delete({ where: { id } });
} catch {
  throw new (require('@nestjs/common').ConflictException)('Conta possui transações vinculadas');
}
return { success: true };
```

- [ ] **Step 5: Write controller & module**

Create `backend/src/accounts/accounts.controller.ts`:
```ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AccountType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

const ACCOUNT_TYPES = [
  { label: 'Conta Corrente', value: 'CONTA_CORRENTE' },
  { label: 'Conta Poupança', value: 'CONTA_POUPANCA' },
  { label: 'Carteira', value: 'CARTEIRA' },
  { label: 'Cartão de Crédito', value: 'CARTAO_CREDITO' },
  { label: 'Investimentos', value: 'INVESTIMENTOS' },
  { label: 'Outros', value: 'OUTROS' },
];

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private service: AccountsService) {}

  @Get('types')
  types() {
    return ACCOUNT_TYPES;
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAccountDto) {
    return this.service.create(user.userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.service.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.userId, id);
  }
}
```

Create `backend/src/accounts/accounts.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({ controllers: [AccountsController], providers: [AccountsService], exports: [AccountsService] })
export class AccountsModule {}
```
Edit `backend/src/app.module.ts` — add `AccountsModule` to imports.

- [ ] **Step 6: Run (green)**

Run: `npm run test:e2e -- accounts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/accounts backend/test/accounts.e2e-spec.ts backend/src/app.module.ts backend/package.json backend/package-lock.json
git commit -m "feat(backend): accounts CRUD with user scoping"
```

---

## Phase 5 — Transactions module (CRUD + atomic balance updates)

> Powers `useTransacoes` (list with joined account+category), the `NovaTransacaoModal` create flow, and the `Transferencias` screen. Each transaction mutates the related account balance **inside a DB transaction** so balances never drift.

### Task 5.1: Transactions create/list with balance side-effects

**Files:**
- Create: `backend/src/transactions/transactions.service.ts`, `transactions.controller.ts`, `transactions.module.ts`
- Create: `backend/src/transactions/dto/create-transaction.dto.ts`, `update-transaction.dto.ts`, `query-transaction.dto.ts`
- Create: `backend/test/transactions.e2e-spec.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Write failing e2e (balance must change)**

Create `backend/test/transactions.e2e-spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Transactions (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let accountId: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register').send({ email: `tx${Date.now()}@t.com`, name: 'Tx', password: 'supersecret' });
    token = reg.body.accessToken;
    const acc = await request(app.getHttpServer()).post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Conta', type: 'CARTEIRA', balance: 1000, color: '#22C55E' });
    accountId = acc.body.id;
    const cat = await request(app.getHttpServer()).post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Mercado', value: 'mercado' });
    categoryId = cat.body.id;
  });
  afterAll(async () => app.close());
  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('despesa decreases account balance', async () => {
    await request(app.getHttpServer()).post('/api/transactions').set(auth())
      .send({ title: 'Compra', amount: 200, type: 'DESPESA', accountId, categoryId, date: '2025-06-03' })
      .expect(201);
    const accs = await request(app.getHttpServer()).get('/api/accounts').set(auth());
    expect(accs.body[0].balance).toBe(800);
  });

  it('lists transactions with joined account & category', async () => {
    const res = await request(app.getHttpServer()).get('/api/transactions').set(auth()).expect(200);
    expect(res.body[0]).toHaveProperty('account.label');
    expect(res.body[0]).toHaveProperty('category.label');
  });

  it('deleting a despesa restores the balance', async () => {
    const list = await request(app.getHttpServer()).get('/api/transactions').set(auth());
    const id = list.body[0].id;
    await request(app.getHttpServer()).delete(`/api/transactions/${id}`).set(auth()).expect(200);
    const accs = await request(app.getHttpServer()).get('/api/accounts').set(auth());
    expect(accs.body[0].balance).toBe(1000);
  });
});
```

- [ ] **Step 2: Run (red)**

Run: `npm run test:e2e -- transactions`
Expected: FAIL — route missing.

- [ ] **Step 3: Write DTOs**

Create `backend/src/transactions/dto/create-transaction.dto.ts`:
```ts
import { IsDateString, IsEnum, IsNumber, IsPositive, IsString, MinLength } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsString() @MinLength(1) title: string;
  @IsNumber() @IsPositive() amount: number;
  @IsEnum(TransactionType) type: TransactionType;
  @IsString() accountId: string;
  @IsString() categoryId: string;
  @IsDateString() date: string;
}
```

Create `backend/src/transactions/dto/update-transaction.dto.ts`:
```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}
```

Create `backend/src/transactions/dto/query-transaction.dto.ts`:
```ts
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTransactionDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
}
```

- [ ] **Step 4: Write the service (atomic balance logic)**

Create `backend/src/transactions/transactions.service.ts`:
```ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { toDecimal, toNumber } from '../common/money';

// receita adds to balance, despesa subtracts. Returns the signed delta.
function delta(type: TransactionType, amount: number): number {
  return type === 'RECEITA' ? amount : -amount;
}

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private serialize = (t: any) => ({
    ...t,
    amount: toNumber(t.amount),
    account: t.account ? { ...t.account, balance: toNumber(t.account.balance) } : undefined,
  });

  async create(userId: string, dto: CreateTransactionDto) {
    // verify account & category belong to the user
    const [account, category] = await Promise.all([
      this.prisma.account.findFirst({ where: { id: dto.accountId, userId } }),
      this.prisma.category.findFirst({ where: { id: dto.categoryId, userId } }),
    ]);
    if (!account) throw new NotFoundException('Conta não encontrada');
    if (!category) throw new NotFoundException('Categoria não encontrada');

    const tx = await this.prisma.$transaction(async (db) => {
      const created = await db.transaction.create({
        data: {
          userId,
          title: dto.title,
          amount: toDecimal(dto.amount),
          type: dto.type,
          date: new Date(dto.date),
          accountId: dto.accountId,
          categoryId: dto.categoryId,
        },
        include: { account: true, category: true },
      });
      await db.account.update({
        where: { id: dto.accountId },
        data: { balance: { increment: toDecimal(delta(dto.type, dto.amount)) } },
      });
      return created;
    });
    return this.serialize(tx);
  }

  async findAll(userId: string, limit?: number) {
    const list = await this.prisma.transaction.findMany({
      where: { userId },
      include: { account: true, category: true },
      orderBy: { date: 'desc' },
      ...(limit ? { take: limit } : {}),
    });
    return list.map(this.serialize);
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Transação não encontrada');
    await this.prisma.$transaction(async (db) => {
      await db.transaction.delete({ where: { id } });
      // reverse the original effect
      await db.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: toDecimal(-delta(existing.type, toNumber(existing.amount))) } },
      });
    });
    return { success: true };
  }
}
```

> **Note on update:** editing a transaction's amount/type/account is the trickiest balance case (reverse the old delta on the old account, apply the new delta on the new account, inside one `$transaction`). It is deferred to Task 5.2 to keep this task green and small. The frontend's `NovaTransacaoModal` only creates, so create+list+delete unblocks all current screens.

- [ ] **Step 5: Write controller & module**

Create `backend/src/transactions/transactions.controller.ts`:
```ts
import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private service: TransactionsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() q: QueryTransactionDto) {
    return this.service.findAll(user.userId, q.limit);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTransactionDto) {
    return this.service.create(user.userId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.userId, id);
  }
}
```

Create `backend/src/transactions/transactions.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({ controllers: [TransactionsController], providers: [TransactionsService], exports: [TransactionsService] })
export class TransactionsModule {}
```
Edit `backend/src/app.module.ts` — add `TransactionsModule` to imports.

- [ ] **Step 6: Run (green)**

Run: `npm run test:e2e -- transactions`
Expected: PASS (3 cases).

- [ ] **Step 7: Commit**

```bash
git add backend/src/transactions backend/test/transactions.e2e-spec.ts backend/src/app.module.ts
git commit -m "feat(backend): transactions create/list/delete with atomic balance updates"
```

---

### Task 5.2: Transaction update with balance rebalancing

**Files:**
- Modify: `backend/src/transactions/transactions.service.ts`
- Modify: `backend/src/transactions/transactions.controller.ts`
- Modify: `backend/test/transactions.e2e-spec.ts`

- [ ] **Step 1: Add failing test**

Append to `backend/test/transactions.e2e-spec.ts` (new `it` inside the describe):
```ts
it('updating amount rebalances the account', async () => {
  const created = await request(app.getHttpServer()).post('/api/transactions').set(auth())
    .send({ title: 'X', amount: 100, type: 'DESPESA', accountId, categoryId, date: '2025-06-05' });
  // balance now 1000 - 100 = 900
  await request(app.getHttpServer()).patch(`/api/transactions/${created.body.id}`).set(auth())
    .send({ amount: 250 }).expect(200);
  const accs = await request(app.getHttpServer()).get('/api/accounts').set(auth());
  expect(accs.body[0].balance).toBe(750); // 1000 - 250
});
```

- [ ] **Step 2: Run (red)**

Run: `npm run test:e2e -- transactions`
Expected: FAIL — PATCH route missing (404).

- [ ] **Step 3: Implement update in service**

Add to `TransactionsService`:
```ts
async update(userId: string, id: string, dto: import('./dto/update-transaction.dto').UpdateTransactionDto) {
  const existing = await this.prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundException('Transação não encontrada');

  const newAccountId = dto.accountId ?? existing.accountId;
  const newType = dto.type ?? existing.type;
  const newAmount = dto.amount ?? toNumber(existing.amount);

  if (dto.accountId) {
    const owns = await this.prisma.account.findFirst({ where: { id: dto.accountId, userId } });
    if (!owns) throw new NotFoundException('Conta não encontrada');
  }

  const oldDelta = delta(existing.type, toNumber(existing.amount));
  const newDelta = delta(newType, newAmount);

  const tx = await this.prisma.$transaction(async (db) => {
    // reverse old effect on old account
    await db.account.update({
      where: { id: existing.accountId },
      data: { balance: { increment: toDecimal(-oldDelta) } },
    });
    // apply new effect on (possibly new) account
    await db.account.update({
      where: { id: newAccountId },
      data: { balance: { increment: toDecimal(newDelta) } },
    });
    return db.transaction.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.amount !== undefined && { amount: toDecimal(dto.amount) }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
      },
      include: { account: true, category: true },
    });
  });
  return this.serialize(tx);
}
```
> Note: when `accountId` is unchanged, both updates hit the same row sequentially inside the transaction — net effect is `newDelta - oldDelta`, which is correct.

- [ ] **Step 4: Add PATCH route to controller**

Add to `TransactionsController`:
```ts
@Patch(':id')
update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateTransactionDto) {
  return this.service.update(user.userId, id, dto);
}
```
Add imports: `Patch` from `@nestjs/common`, `UpdateTransactionDto` from `./dto/update-transaction.dto`.

- [ ] **Step 5: Run (green)**

Run: `npm run test:e2e -- transactions`
Expected: PASS (4 cases).

- [ ] **Step 6: Commit**

```bash
git add backend/src/transactions backend/test/transactions.e2e-spec.ts
git commit -m "feat(backend): transaction update with balance rebalancing"
```

---

## Phase 6 — Budgets module (derived "gasto")

> Powers the `Orcamentos` screen: list, create (`NovoOrcamentoModal`), detail view. `gasto` is **derived** = sum of DESPESA transactions in the budget's category.

### Task 6.1: Budgets CRUD with derived spend

**Files:**
- Create: `backend/src/budgets/budgets.service.ts`, `budgets.controller.ts`, `budgets.module.ts`
- Create: `backend/src/budgets/dto/create-budget.dto.ts`, `update-budget.dto.ts`
- Create: `backend/test/budgets.e2e-spec.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Write failing e2e**

Create `backend/test/budgets.e2e-spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Budgets (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let accountId: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register').send({ email: `bud${Date.now()}@t.com`, name: 'Bud', password: 'supersecret' });
    token = reg.body.accessToken;
    const acc = await request(app.getHttpServer()).post('/api/accounts')
      .set('Authorization', `Bearer ${token}`).send({ label: 'C', type: 'CARTEIRA', balance: 5000 });
    accountId = acc.body.id;
    const cat = await request(app.getHttpServer()).post('/api/categories')
      .set('Authorization', `Bearer ${token}`).send({ label: 'Lazer', value: 'lazer' });
    categoryId = cat.body.id;
  });
  afterAll(async () => app.close());
  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('derives gasto from category despesas', async () => {
    await request(app.getHttpServer()).post('/api/transactions').set(auth())
      .send({ title: 'Cinema', amount: 90, type: 'DESPESA', accountId, categoryId, date: '2025-06-08' });
    await request(app.getHttpServer()).post('/api/budgets').set(auth())
      .send({ title: 'Lazer', description: 'Passeios', limit: 800, categoryId }).expect(201);

    const res = await request(app.getHttpServer()).get('/api/budgets').set(auth()).expect(200);
    expect(res.body[0].gasto).toBe(90);
    expect(res.body[0].limite).toBe(800);
  });
});
```

- [ ] **Step 2: Run (red)**

Run: `npm run test:e2e -- budgets`
Expected: FAIL — route missing.

- [ ] **Step 3: Write DTOs**

Create `backend/src/budgets/dto/create-budget.dto.ts`:
```ts
import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateBudgetDto {
  @IsString() @MinLength(1) title: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @IsPositive() limit: number;
  @IsString() categoryId: string;
}
```

Create `backend/src/budgets/dto/update-budget.dto.ts`:
```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetDto } from './create-budget.dto';

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {}
```

- [ ] **Step 4: Write the service**

Create `backend/src/budgets/budgets.service.ts`:
```ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { toDecimal, toNumber } from '../common/money';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto) {
    const cat = await this.prisma.category.findFirst({ where: { id: dto.categoryId, userId } });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    const dup = await this.prisma.budget.findFirst({ where: { userId, categoryId: dto.categoryId } });
    if (dup) throw new ConflictException('Já existe orçamento para esta categoria');
    return this.prisma.budget.create({
      data: {
        userId, title: dto.title, description: dto.description ?? '',
        limit: toDecimal(dto.limit), categoryId: dto.categoryId,
      },
    }).then((b) => ({ ...b, limite: toNumber(b.limit), gasto: 0 }));
  }

  async findAll(userId: string) {
    const budgets = await this.prisma.budget.findMany({ where: { userId } });
    const spend = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'DESPESA' },
      _sum: { amount: true },
    });
    const map = new Map(spend.map((s) => [s.categoryId, toNumber(s._sum.amount ?? null)]));
    return budgets.map((b) => ({
      id: b.id,
      title: b.title,
      descricao: b.description,
      categoriaId: b.categoryId,
      limite: toNumber(b.limit),
      gasto: map.get(b.categoryId) ?? 0,
    }));
  }

  private async assertOwned(userId: string, id: string) {
    const b = await this.prisma.budget.findFirst({ where: { id, userId } });
    if (!b) throw new NotFoundException('Orçamento não encontrado');
    return b;
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    await this.assertOwned(userId, id);
    const b = await this.prisma.budget.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.limit !== undefined && { limit: toDecimal(dto.limit) }),
      },
    });
    return { ...b, limite: toNumber(b.limit) };
  }

  async remove(userId: string, id: string) {
    await this.assertOwned(userId, id);
    await this.prisma.budget.delete({ where: { id } });
    return { success: true };
  }
}
```

- [ ] **Step 5: Write controller & module**

Create `backend/src/budgets/budgets.controller.ts`:
```ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private service: BudgetsService) {}

  @Get() findAll(@CurrentUser() user: AuthUser) { return this.service.findAll(user.userId); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateBudgetDto) { return this.service.create(user.userId, dto); }
  @Patch(':id') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateBudgetDto) { return this.service.update(user.userId, id, dto); }
  @Delete(':id') remove(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.service.remove(user.userId, id); }
}
```

Create `backend/src/budgets/budgets.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

@Module({ controllers: [BudgetsController], providers: [BudgetsService] })
export class BudgetsModule {}
```
Edit `backend/src/app.module.ts` — add `BudgetsModule` to imports.

- [ ] **Step 6: Run (green)**

Run: `npm run test:e2e -- budgets`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/budgets backend/test/budgets.e2e-spec.ts backend/src/app.module.ts
git commit -m "feat(backend): budgets CRUD with derived gasto"
```

---

## Phase 7 — Dashboard aggregations

> Powers `useDashboard`: `saldoTotal`, `gastoTotal`, `receitaTotal`, `gastoOrcaTotal`, `limiteOrcTotal`, `ultimasTransacoes` (5), `orcAtivos`.

### Task 7.1: Dashboard summary endpoint

**Files:**
- Create: `backend/src/dashboard/dashboard.service.ts`, `dashboard.controller.ts`, `dashboard.module.ts`
- Create: `backend/test/dashboard.e2e-spec.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Write failing e2e**

Create `backend/test/dashboard.e2e-spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register').send({ email: `dash${Date.now()}@t.com`, name: 'D', password: 'supersecret' });
    token = reg.body.accessToken;
    const auth = { Authorization: `Bearer ${token}` };
    const acc = await request(app.getHttpServer()).post('/api/accounts').set(auth)
      .send({ label: 'C', type: 'CARTEIRA', balance: 1000 });
    const cat = await request(app.getHttpServer()).post('/api/categories').set(auth)
      .send({ label: 'Renda', value: 'renda', isIncome: true });
    await request(app.getHttpServer()).post('/api/transactions').set(auth)
      .send({ title: 'Salário', amount: 500, type: 'RECEITA', accountId: acc.body.id, categoryId: cat.body.id, date: '2025-06-01' });
  });
  afterAll(async () => app.close());

  it('returns aggregated dashboard summary', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.saldoTotal).toBe(1500);   // 1000 initial + 500 receita
    expect(res.body.receitaTotal).toBe(500);
    expect(res.body.gastoTotal).toBe(0);
    expect(Array.isArray(res.body.ultimasTransacoes)).toBe(true);
    expect(res.body).toHaveProperty('orcAtivos');
  });
});
```

- [ ] **Step 2: Run (red)**

Run: `npm run test:e2e -- dashboard`
Expected: FAIL — route missing.

- [ ] **Step 3: Write the service**

Create `backend/src/dashboard/dashboard.service.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/money';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(userId: string) {
    const [accAgg, receitaAgg, gastoAgg, budgetAgg, orcAtivos, ultimas] = await Promise.all([
      this.prisma.account.aggregate({ where: { userId }, _sum: { balance: true } }),
      this.prisma.transaction.aggregate({ where: { userId, type: 'RECEITA' }, _sum: { amount: true } }),
      this.prisma.transaction.aggregate({ where: { userId, type: 'DESPESA' }, _sum: { amount: true } }),
      this.prisma.budget.aggregate({ where: { userId }, _sum: { limit: true } }),
      this.prisma.budget.count({ where: { userId } }),
      this.prisma.transaction.findMany({
        where: { userId }, include: { account: true, category: true },
        orderBy: { date: 'desc' }, take: 5,
      }),
    ]);

    // gastoOrcaTotal = total despesa within categories that have a budget
    const budgets = await this.prisma.budget.findMany({ where: { userId }, select: { categoryId: true } });
    const budgetCatIds = budgets.map((b) => b.categoryId);
    const gastoOrca = budgetCatIds.length
      ? await this.prisma.transaction.aggregate({
          where: { userId, type: 'DESPESA', categoryId: { in: budgetCatIds } },
          _sum: { amount: true },
        })
      : { _sum: { amount: null } };

    return {
      saldoTotal: toNumber(accAgg._sum.balance),
      receitaTotal: toNumber(receitaAgg._sum.amount),
      gastoTotal: toNumber(gastoAgg._sum.amount),
      gastoOrcaTotal: toNumber(gastoOrca._sum.amount),
      limiteOrcTotal: toNumber(budgetAgg._sum.limit),
      orcAtivos,
      ultimasTransacoes: ultimas.map((t) => ({
        ...t,
        amount: toNumber(t.amount),
        account: { ...t.account, balance: toNumber(t.account.balance) },
      })),
    };
  }
}
```

- [ ] **Step 4: Write controller & module**

Create `backend/src/dashboard/dashboard.controller.ts`:
```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get()
  summary(@CurrentUser() user: AuthUser) {
    return this.service.getSummary(user.userId);
  }
}
```

Create `backend/src/dashboard/dashboard.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({ controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
```
Edit `backend/src/app.module.ts` — add `DashboardModule` to imports.

- [ ] **Step 5: Run (green)**

Run: `npm run test:e2e -- dashboard`
Expected: PASS.

- [ ] **Step 6: Run the full suite**

Run: `npm test && npm run test:e2e`
Expected: all unit + e2e suites PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/dashboard backend/test/dashboard.e2e-spec.ts backend/src/app.module.ts
git commit -m "feat(backend): dashboard aggregation endpoint"
```

---

## Phase 8 — Frontend integration (replace mocks with the API)

> Rewire the Expo app to the live API, add login, and store tokens securely on device. This is where "mobile security" lands on the client.

### Task 8.1: Secure API client + token storage

**Files:**
- Create: `frontend/src/api/client.ts`, `frontend/src/api/endpoints.ts`
- Create: `frontend/src/context/AuthContext.tsx`
- Modify: `frontend/src/app/_layout.tsx`
- Modify: `frontend/.env` (or `app.json` extra) for `EXPO_PUBLIC_API_URL`

- [ ] **Step 1: Install secure storage**

Run (from `frontend/`): `npx expo install expo-secure-store`

- [ ] **Step 2: Configure API base URL**

Add to `frontend/.env` (Expo reads `EXPO_PUBLIC_*` at build):
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```
> On a physical device the API host must be your machine's LAN IP, not `localhost`.

- [ ] **Step 3: Implement the token-aware fetch client**

Create `frontend/src/api/client.ts`:
```ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE = process.env.EXPO_PUBLIC_API_URL!;
const ACCESS = 'ft_access';
const REFRESH = 'ft_refresh';

// SecureStore is unavailable on web — fall back to localStorage there.
const store = {
  async get(key: string) {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') return void globalThis.localStorage?.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  async del(key: string) {
    if (Platform.OS === 'web') return void globalThis.localStorage?.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

export const tokens = {
  save: async (a: string, r: string) => { await store.set(ACCESS, a); await store.set(REFRESH, r); },
  clear: async () => { await store.del(ACCESS); await store.del(REFRESH); },
  access: () => store.get(ACCESS),
  refresh: () => store.get(REFRESH),
};

async function raw(path: string, init: RequestInit, useRefresh = false): Promise<Response> {
  const token = await (useRefresh ? tokens.refresh() : tokens.access());
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await raw(path, init);
  if (res.status === 401 && (await tokens.refresh())) {
    // try one refresh
    const r = await raw('/auth/refresh', { method: 'POST' }, true);
    if (r.ok) {
      const data = await r.json();
      await tokens.save(data.accessToken, data.refreshToken);
      res = await raw(path, init);
    }
  }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? `HTTP ${res.status}`);
  return res.status === 204 ? (undefined as T) : res.json();
}
```

- [ ] **Step 4: Typed endpoints**

Create `frontend/src/api/endpoints.ts`:
```ts
import { api, tokens } from './client';

export const Auth = {
  async login(email: string, password: string) {
    const d = await api<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    await tokens.save(d.accessToken, d.refreshToken);
  },
  async register(email: string, name: string, password: string) {
    const d = await api<{ accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST', body: JSON.stringify({ email, name, password }),
    });
    await tokens.save(d.accessToken, d.refreshToken);
  },
  logout: () => api('/auth/logout', { method: 'POST' }).finally(tokens.clear),
};

export const Accounts = {
  list: () => api<any[]>('/accounts'),
  types: () => api<{ label: string; value: string }[]>('/accounts/types'),
  create: (b: any) => api('/accounts', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: any) => api(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  remove: (id: string) => api(`/accounts/${id}`, { method: 'DELETE' }),
};

export const Categories = {
  list: () => api<any[]>('/categories'),
  create: (b: any) => api('/categories', { method: 'POST', body: JSON.stringify(b) }),
};

export const Transactions = {
  list: (limit?: number) => api<any[]>(`/transactions${limit ? `?limit=${limit}` : ''}`),
  create: (b: any) => api('/transactions', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: any) => api(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  remove: (id: string) => api(`/transactions/${id}`, { method: 'DELETE' }),
};

export const Budgets = {
  list: () => api<any[]>('/budgets'),
  create: (b: any) => api('/budgets', { method: 'POST', body: JSON.stringify(b) }),
  update: (id: string, b: any) => api(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  remove: (id: string) => api(`/budgets/${id}`, { method: 'DELETE' }),
};

export const Dashboard = {
  summary: () => api<any>('/dashboard'),
};
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api frontend/.env
git commit -m "feat(frontend): secure API client and typed endpoints"
```

---

### Task 8.2: Auth context + login screen + route guard

**Files:**
- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/app/Login.tsx`
- Modify: `frontend/src/app/_layout.tsx`

- [ ] **Step 1: Implement AuthContext**

Create `frontend/src/context/AuthContext.tsx`:
```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { tokens } from '@/api/client';
import { Auth } from '@/api/endpoints';

type AuthState = {
  ready: boolean;
  signedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    tokens.access().then((t) => { setSignedIn(!!t); setReady(true); });
  }, []);

  const value: AuthState = {
    ready, signedIn,
    login: async (e, p) => { await Auth.login(e, p); setSignedIn(true); },
    register: async (e, n, p) => { await Auth.register(e, n, p); setSignedIn(true); },
    logout: async () => { await Auth.logout(); setSignedIn(false); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
```

- [ ] **Step 2: Wrap the app + redirect unauthenticated users**

Replace `frontend/src/app/_layout.tsx`:
```tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/Toast/toastConfig';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function Guard() {
  const { ready, signedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const onLogin = segments[0] === 'Login';
    if (!signedIn && !onLogin) router.replace('/Login');
    if (signedIn && onLogin) router.replace('/');
  }, [ready, signedIn, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <Guard />
      <Toast config={toastConfig} topOffset={60} />
    </AuthProvider>
  );
}
```

- [ ] **Step 3: Build a minimal login screen**

Create `frontend/src/app/Login.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants/colors';
import { showError } from '@/components/Toast/toast';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@fintrack.app');
  const [password, setPassword] = useState('demo1234');

  const submit = async () => {
    try { await login(email, password); }
    catch (e: any) { showError(e.message ?? 'Falha no login'); }
  };

  return (
    <SafeAreaView style={s.c}>
      <Text style={s.title}>FinTrack</Text>
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={s.btn} onPress={submit}><Text style={s.btnText}>Entrar</Text></TouchableOpacity>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', padding: 24, gap: 14, backgroundColor: COLORS.background },
  title: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: COLORS.black },
  input: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 16 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10 },
  btnText: { fontWeight: 'bold', fontSize: 16, color: COLORS.black },
});
```

- [ ] **Step 4: Manual verification**

Run backend (`cd backend && npm run start:dev`) and frontend (`cd frontend && npm run web`). Expected: app redirects to `/Login`; logging in with the seeded `demo@fintrack.app / demo1234` lands on the dashboard.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/context frontend/src/app/Login.tsx frontend/src/app/_layout.tsx
git commit -m "feat(frontend): auth context, login screen and route guard"
```

---

### Task 8.3: Rewire hooks & screens to the API

**Files:**
- Modify: `frontend/src/hooks/useDashboard.ts`, `useTransacoes.ts`, `useCategorias.ts`
- Modify: `frontend/src/app/Contas.tsx`, `Orcamentos.tsx`, `Categorias.tsx`, `Transferencias.tsx`
- Modify: `frontend/src/components/NovaContaModal.tsx`, `NovaTransacaoModal.tsx`, `NovoOrcamentoModal.tsx`
- Delete (eventually): reliance on `frontend/src/data/data.ts`

- [ ] **Step 1: Convert `useDashboard` to fetch live data**

Replace `frontend/src/hooks/useDashboard.ts`:
```ts
import { useEffect, useState, useCallback } from 'react';
import { Dashboard } from '@/api/endpoints';

export function useDashboard() {
  const [data, setData] = useState({
    saldoTotal: 0, gastoTotal: 0, receitaTotal: 0,
    gastoOrcaTotal: 0, limiteOrcTotal: 0, orcAtivos: 0, ultimasTransacoes: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    Dashboard.summary().then(setData).finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { ...data, loading, reload };
}
```

- [ ] **Step 2: Convert `useTransacoes`**

Replace `frontend/src/hooks/useTransacoes.ts`:
```ts
import { useEffect, useState, useCallback } from 'react';
import { Transactions } from '@/api/endpoints';

export function useTransacoes(limit?: number) {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    Transactions.list(limit)
      // backend returns title/amount/account/category; map to the shape the UI expects
      .then((rows) => rows.map((t) => ({
        id: t.id,
        titulo: t.title,
        valor: t.amount,
        tipo: t.type === 'RECEITA' ? 'receita' : 'despesa',
        data: t.date,
        categoria: t.category ? { label: t.category.label, value: t.category.value } : undefined,
        conta: t.account ? { label: t.account.label } : undefined,
      })))
      .then(setTransacoes)
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => { reload(); }, [reload]);
  return { transacoes, loading, reload };
}
```
> This removes the broken `transacoes.find(cat => cat.id === item.categoriaId)` lookups in `Transferencias.tsx` because `categoria`/`conta` now arrive joined. Update `Transferencias.tsx` Step 4.

- [ ] **Step 3: Convert `useCategorias`**

Replace `frontend/src/hooks/useCategorias.ts`:
```ts
import { useEffect, useState } from 'react';
import { Categories } from '@/api/endpoints';

export function useCategorias() {
  const [raw, setRaw] = useState<any[]>([]);
  useEffect(() => { Categories.list().then(setRaw); }, []);

  const categoriasGastos = raw.filter((c) => !c.isIncome);
  const totalGastos = categoriasGastos.reduce((t, c) => t + c.valor, 0) || 0;
  const categoriasComPorcentagem = categoriasGastos
    .map((c) => ({
      ...c,
      porcentagem: totalGastos ? Number(((c.valor / totalGastos) * 100).toFixed(1)) : 0,
      progresso: totalGastos ? c.valor / totalGastos : 0,
    }))
    .sort((a, b) => b.valor - a.valor);

  return { categoriasComPorcentagem, totalGastos };
}
```

- [ ] **Step 4: Update screens that imported from `data.ts`**

In `Contas.tsx`, `Orcamentos.tsx`, `Transferencias.tsx`: replace `import { contas } ... from "@/data/data"` etc. with state loaded from `Accounts.list()` / `Budgets.list()` via `useEffect`. Pattern for `Contas.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Accounts } from '@/api/endpoints';
// ...inside component:
const [contas, setContas] = useState<any[]>([]);
const reload = () => Accounts.list().then(setContas);
useEffect(() => { reload(); }, []);
// pass reload() into NovaContaModal onClose and into Trash2 onPress (Accounts.remove(id).then(reload))
```
Apply the analogous change in `Orcamentos.tsx` (`Budgets.list`) and remove the buggy self-`find` in `Transferencias.tsx` (use `item.categoria?.label` / `item.conta?.label` directly).

- [ ] **Step 5: Wire the create modals to POST**

`NovaContaModal.tsx` — in `handleConfirmar`, replace the local object + toast with:
```tsx
import { Accounts } from '@/api/endpoints';
// map UI fields → API. saldo is a formatted string like "R$ 1.234,56":
const parseMoney = (s: string) => Number(s.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
await Accounts.create({
  label: nome,
  type: tipo.toUpperCase(),           // 'conta_corrente' → 'CONTA_CORRENTE'
  balance: parseMoney(saldo),
  color: cor,
});
showInfo('Conta criada com sucesso!');
props.onClose?.();   // and trigger parent reload via a prop callback
```
`NovaTransacaoModal.tsx` — map `tipo` `'entrada'|'saida'` → `'RECEITA'|'DESPESA'`, send `{ title: titulo, amount, type, accountId, categoryId, date }`. Note the modal currently stores `conta`/`categoria` as the `value` slug — switch the pickers to store the **id** instead (load via `Accounts.list()` / `Categories.list()`).
`NovoOrcamentoModal.tsx` — send `{ title, description: descricao, limit: parseMoney(limite), categoryId }`.

- [ ] **Step 6: Manual end-to-end verification**

With backend + frontend running and logged in as the demo user:
1. Create an account → appears on Contas, `saldoTotal` updates.
2. Add a despesa → account balance drops, dashboard `gastoTotal` rises, category `valor` rises.
3. Create a budget for that category → `Orcamentos` shows correct `gasto`/`limite`/%.
4. Delete the transaction → balance restored.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/hooks frontend/src/app frontend/src/components
git commit -m "feat(frontend): rewire hooks, screens and modals to live API"
```

---

## Phase 9 — Production hardening & deployment

### Task 9.1: Health check + structured logging

**Files:**
- Create: `backend/src/health/health.controller.ts`, `health.module.ts`
- Modify: `backend/src/app.module.ts`, `backend/src/main.ts`

- [ ] **Step 1: Install Terminus & pino logger**

Run: `npm install @nestjs/terminus nestjs-pino pino-http`

- [ ] **Step 2: Add health endpoint**

Create `backend/src/health/health.controller.ts`:
```ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck('database', this.prisma)]);
  }
}
```
Create `backend/src/health/health.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({ imports: [TerminusModule], controllers: [HealthController] })
export class HealthModule {}
```
Edit `backend/src/app.module.ts` — add `HealthModule` and `LoggerModule.forRoot()` from `nestjs-pino`. In `main.ts` add `app.useLogger(app.get(Logger))` (import `Logger` from `nestjs-pino`).

- [ ] **Step 3: Verify**

Run: `npm run start:dev` then `curl -s http://localhost:3000/api/health`
Expected: `{"status":"ok","info":{"database":{"status":"up"}}...}`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/health backend/src/app.module.ts backend/src/main.ts backend/package.json backend/package-lock.json
git commit -m "feat(backend): health check and structured logging"
```

---

### Task 9.2: Production Dockerfile + .dockerignore

**Files:**
- Create: `backend/Dockerfile`, `backend/.dockerignore`

- [ ] **Step 1: Write multi-stage Dockerfile**

Create `backend/Dockerfile`:
```dockerfile
# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

Create `backend/.dockerignore`:
```
node_modules
dist
.env
test
```

- [ ] **Step 2: Build the image**

Run: `docker build -t fintrack-backend ./backend`
Expected: image builds without error.

- [ ] **Step 3: Commit**

```bash
git add backend/Dockerfile backend/.dockerignore
git commit -m "chore(backend): production Dockerfile"
```

---

### Task 9.3: CI pipeline

**Files:**
- Create: `backend/.github/workflows/ci.yml` (or repo-root `.github/workflows/backend-ci.yml`)

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/backend-ci.yml`:
```yaml
name: backend-ci
on:
  push: { paths: ['backend/**'] }
  pull_request: { paths: ['backend/**'] }
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_USER: fintrack, POSTGRES_PASSWORD: fintrack, POSTGRES_DB: fintrack }
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
    env:
      DATABASE_URL: postgresql://fintrack:fintrack@localhost:5432/fintrack?schema=public
      JWT_ACCESS_SECRET: ci-access
      JWT_REFRESH_SECRET: ci-refresh
    defaults: { run: { working-directory: backend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: backend/package-lock.json }
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run lint
      - run: npm test
      - run: npm run test:e2e
```

- [ ] **Step 2: Validate YAML locally (optional)**

Run: `npx --yes yaml-lint .github/workflows/backend-ci.yml` (or just push and check Actions).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/backend-ci.yml
git commit -m "ci: backend test pipeline with postgres service"
```

---

### Task 9.4: Security checklist (verification task, no new feature code)

- [ ] Passwords hashed with Argon2 (never stored/loggable in plaintext). — verify `auth.service.ts`.
- [ ] Refresh tokens stored only as Argon2 hashes (`User.refreshHash`), rotated on every refresh. — verify `issueTokens`.
- [ ] Access tokens short-lived (`JWT_ACCESS_TTL=900s`); refresh long-lived & revocable via logout. — verify `.env`.
- [ ] Every Account/Transaction/Budget query filters by `userId`. — grep: `grep -rn "userId" backend/src | grep -i "where"` and confirm no resource read/write omits it.
- [ ] Global `ValidationPipe({ whitelist: true })` strips unknown fields. — verify `main.ts`.
- [ ] Helmet enabled; CORS limited to known origins. — verify `main.ts`.
- [ ] Rate limiting active (`ThrottlerGuard`), with a stricter limit on `/auth/login` & `/auth/register` via a route-level `@Throttle`. — add `@Throttle({ default: { limit: 5, ttl: 60000 } })` on the auth controller.
- [ ] Secrets only via env; `.env` git-ignored; `.env.example` documents required keys. — verify `.gitignore`.
- [ ] Frontend stores tokens in `expo-secure-store` (Keychain/Keystore) on device, never in plain AsyncStorage. — verify `client.ts`.
- [ ] Production runs `prisma migrate deploy` (not `migrate dev`) and `NODE_ENV=production`. — verify `Dockerfile`.

- [ ] **Commit any fixes**

```bash
git add -A && git commit -m "chore(backend): security hardening pass"
```

---

## Self-Review (performed against the frontend spec)

**Spec coverage — every frontend data dependency is implemented:**
- `useDashboard` (saldoTotal, gastoTotal, receitaTotal, gastoOrcaTotal, limiteOrcTotal, ultimasTransacoes, orcAtivos) → **Phase 7** ✅
- `useTransacoes` (list w/ joined conta+categoria) → **Phase 5 + 8.2** ✅
- `useCategorias` (list + valor + transacoes aggregates) → **Phase 3 + 8.3** ✅
- `useOrcamentos`/`Orcamentos` (list, gasto, limite, create) → **Phase 6 + 8.3** ✅
- `Contas` (list, create, edit, delete, saldoTotal) → **Phase 4 + 8.3** ✅
- `NovaContaModal` fields (nome, saldo, tipo, cor) → `CreateAccountDto` ✅
- `NovaTransacaoModal` fields (tipo, valor, conta, categoria, titulo, data) → `CreateTransactionDto` ✅
- `NovoOrcamentoModal` fields (categoria, limite, descricao) → `CreateBudgetDto` ✅
- `tiposConta` dropdown → `GET /accounts/types` + `AccountType` enum ✅
- Login/multi-user/security → **Phase 2 + 8.1/8.2 + 9.4** ✅

**Type consistency:** `delta()`, `toDecimal`/`toNumber`, `AuthUser`, `JwtAuthGuard`, DTO property names (`label`, `type`, `balance`, `color`, `title`, `amount`, `accountId`, `categoryId`, `date`, `limit`) are used identically across tasks. Frontend mapping layer (Phase 8) translates API names (`title`/`amount`/`limit`) to the Portuguese UI names (`titulo`/`valor`/`limite`) so screens need minimal change.

**Known deferrals (intentional, non-blocking):** category edit/delete endpoints (frontend has no UI for it yet); budget edit UI wiring (endpoint exists, modal is create-only today). Add when the UI grows.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-29-fintrack-backend.md`.
