# Platform Workflow Orchestrator

A platform engineering workflow orchestrator with a React UI, TypeScript backend, workflow state management, and local execution.

## Tech Stack

- **Next.js 15** (App Router)
- **React** + **TypeScript**
- **Tailwind CSS**
- **Prisma** + **SQLite**

## Workflow Lifecycle

```
Pending → Validating → Building → Testing → Deploying → Health Check → Completed
                                                                    ↘ Failed
```

## Project Structure

```
├── app/                  # Next.js App Router — pages, layouts, API routes
├── components/           # React UI components
│   ├── ui/               # Reusable primitives
│   └── workflows/        # Workflow-specific components
├── lib/                  # Shared infrastructure (Prisma client, utilities)
├── services/             # Business logic and orchestration layer
├── types/                # Shared TypeScript types and constants
└── prisma/               # Database schema and migrations
```

## Getting Started

```bash
cp .env.example .env
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command           | Description                |
| ----------------- | -------------------------- |
| `npm run dev`     | Start development server   |
| `npm run build`   | Production build           |
| `npm run lint`    | Run ESLint                 |
| `npm run db:push` | Sync Prisma schema to DB   |
| `npm run db:studio` | Open Prisma Studio     |
