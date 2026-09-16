# Local Setup & Environment Configuration Guide

## Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **pnpm**: `v9.x` or `v12.x` (Corepack enabled)
- **Git**

## Step-by-Step Installation

### 1. Clone the Codebase
```bash
git clone https://github.com/your-username/autonomus_posts.git
cd autonomus_posts
```

### 2. Install Dependencies
```bash
pnpm install
```
*Note for pnpm v12+: If prompted to approve native build scripts for Prisma, esbuild, or msgpackr, execute `pnpm approve-builds --all`.*

### 3. Configure `.env`
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Review and adjust variables in `.env`:
```env
# Runtime
NODE_ENV="development"
LOG_LEVEL="info"

# Database (Default: local SQLite file)
DATABASE_URL="file:./dev.db"

# Queue (Leave empty for in-memory queue)
REDIS_URL=""

# Encryption Secret (64 hex characters for AES-256-GCM token storage)
ENCRYPTION_SECRET="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# AI Provider ("gemini", "anthropic", "openai", or "mock")
AI_PROVIDER="gemini"
GEMINI_API_KEY="AIzaSy..."

# Autonomous Publishing (Leave false for manual dashboard review)
AUTONOMOUS_PUBLISHING_ENABLED="false"
MAX_POSTS_PER_DAY="2"
```

### 4. Initialize Database & Seed Fixtures
Generate the Prisma ORM client, push the schema to SQLite, and seed initial topics and voice profiles:
```bash
# Generate Prisma Client
pnpm prisma:generate

# Sync schema with SQLite dev.db
pnpm prisma db push

# Seed default trend topics, 7 sources, voice profile, and system settings
pnpm db:seed
```

### 5. Launch the Application
Start the Next.js development server:
```bash
pnpm dev
```
Navigate to [http://localhost:3000](http://localhost:3000).

### 6. Launch the Standalone Background Worker (Optional)
To process scheduled background jobs and pipeline tasks in a separate terminal:
```bash
pnpm worker
```

### 7. Run Verification Tests
Ensure all unit and integration tests are passing:
```bash
pnpm test
```
