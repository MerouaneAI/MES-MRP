<div align="center">

# 🏭 AurumMES

### Manufacturing Execution System & MRP

**A full-stack, open-source MES/MRP platform built for small-to-medium factories.**\
Manage production, inventory, purchasing, invoicing, and quality — all from one dark-themed, premium dashboard.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-C9A961.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-30%20passed-5FD08A)]()

</div>

---

<div align="center">

![Dashboard](docs/screenshots/dashboard.png)

</div>

## ✨ Features

| Module | Capabilities |
|---|---|
| **📊 Dashboard** | Real-time KPIs, production output charts, yield trend analysis, active work orders, recent inventory |
| **🏭 Work Orders** | Plan → Release (MRP explosion) → Complete (atomic FEFO consumption + lot production) |
| **📦 Inventory** | Lot-based tracking, FEFO expiry management, quantity on hand, lot genealogy |
| **📋 Bills of Materials** | Multi-level BOMs with versioning, component quantities per unit of output |
| **🛒 Purchasing** | Purchase orders with line items, supplier management, receiving workflow |
| **🧾 Invoices** | Gapless invoice numbering per fiscal year, DZD currency, PDF generation |
| **👥 Parties** | Customer and supplier directory with contact details |
| **🔧 ECOs** | Engineering Change Orders for BOM revisions with full audit trail |
| **🏪 Shop Floor** | Barcode scanning for lot/SKU lookup, real-time SSE streaming |
| **📄 Documents** | Background PDF generation via BullMQ worker |
| **👤 User Management** | Role-based access control (Admin / Operator / Viewer) |
| **📝 Audit Log** | Every mutation is recorded with user, timestamp, and metadata |

## 📸 Screenshots

<details>
<summary><strong>Click to expand all screenshots</strong></summary>

### Login
![Login](docs/screenshots/login.png)

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Items Catalog
![Items](docs/screenshots/items.png)

### Inventory (Lots)
![Lots](docs/screenshots/lots.png)

### Bills of Materials
![BOMs](docs/screenshots/boms.png)

### Work Orders
![Work Orders](docs/screenshots/work-orders.png)

### Purchasing
![Purchasing](docs/screenshots/purchasing.png)

### Parties Directory
![Parties](docs/screenshots/parties.png)

</details>

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org) |
| **Database** | [PostgreSQL 16](https://www.postgresql.org) via [Drizzle ORM](https://orm.drizzle.team) |
| **Cache / Queues** | [Redis 7](https://redis.io) via [ioredis](https://github.com/redis/ioredis) + [BullMQ](https://bullmq.io) |
| **Auth** | [NextAuth v5](https://authjs.dev) (Credentials + JWT + bcrypt) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com) with custom dark theme + design tokens |
| **Charts** | [Recharts](https://recharts.org) |
| **Animations** | [GSAP](https://gsap.com) + CSS transitions |
| **PDF** | [PDFKit](http://pdfkit.org) |
| **Testing** | [Vitest](https://vitest.dev) (30 tests across 13 files) |
| **Validation** | [Zod](https://zod.dev) |

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** 16+
- **Redis** 7+
- **Docker** (optional, for one-command setup)

### Option 1: Docker (recommended)

```bash
# Clone the repo
git clone https://github.com/MerouaneAI/MES-MRP.git
cd MES-MRP

# Start everything (PostgreSQL + Redis + App + Worker)
docker compose up --build

# In another terminal, run migrations and seed
docker compose run --rm app npx drizzle-kit migrate
docker compose run --rm app npx tsx db/seed.ts
docker compose run --rm app npx tsx --env-file=.env db/seed-dashboard.ts
```

Open **http://localhost:3000** and log in.

### Option 2: Local Development

```bash
# Clone the repo
git clone https://github.com/MerouaneAI/MES-MRP.git
cd MES-MRP

# Install dependencies
npm install

# Set up your environment (edit .env with your DB/Redis credentials)
cp .env.example .env

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Seed dashboard demo data (optional)
npx tsx --env-file=.env db/seed-dashboard.ts

# Start the dev server
npm run dev

# In another terminal, start the background worker (for PDF generation)
npm run worker:dev
```

Open **http://localhost:3000**.

### Default Credentials

| Field | Value |
|---|---|
| Email | `admin@factory.local` |
| Password | `ChangeMe123!` |

> ⚠️ **Change the default password immediately in production.**

## ⚙️ Configuration

All configuration is via environment variables in `.env`:

```env
# Database
DATABASE_URL=postgres://erp:changeme@localhost:5432/erp

# Redis
REDIS_URL=redis://localhost:6379

# Auth (generate with: openssl rand -base64 32)
AUTH_SECRET=your-secret-here
AUTH_TRUST_HOST=true
AUTH_URL=http://localhost:3000

# Login rate limiting
LOGIN_MAX_ATTEMPTS=5
LOGIN_WINDOW_SECONDS=900
```

## 📁 Project Structure

```
├── app/
│   ├── (app)/              # Authenticated routes (shell layout)
│   │   ├── dashboard/      # KPI cards, charts, recent activity
│   │   ├── items/          # Item catalog (CRUD)
│   │   ├── lots/           # Lot-based inventory
│   │   ├── boms/           # Bills of Materials
│   │   ├── work-orders/    # Production work orders
│   │   ├── purchasing/     # Purchase orders
│   │   ├── invoices/       # Invoice management
│   │   ├── parties/        # Customers & suppliers
│   │   ├── eco/            # Engineering Change Orders
│   │   ├── shopfloor/      # Barcode scanning
│   │   ├── documents/      # Generated documents
│   │   ├── users/          # User management (admin)
│   │   └── audit/          # Audit log viewer
│   ├── actions/            # Server Actions (Zod-validated mutations)
│   ├── api/                # API routes (health, documents, SSE)
│   └── login/              # Authentication page
├── components/
│   ├── ui/                 # Design system (barrel exports)
│   ├── shell/              # App shell (sidebar, topbar, nav)
│   ├── charts/             # Recharts wrappers
│   └── motion/             # Animation components (Reveal, CountUp)
├── db/
│   ├── schema/             # Drizzle schema definitions
│   ├── seed.ts             # Base seed data
│   └── seed-dashboard.ts   # Rich demo data for dashboard
├── lib/                    # Shared utilities (authz, format, MRP, roles)
├── drizzle/                # Generated migrations
└── docker-compose.yml      # One-command deployment
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

**Test coverage:** 13 test files, 30 tests covering:
- Server Actions (CRUD, authorization, validation)
- MRP explosion logic
- Gapless invoice numbering (concurrent safety)
- Role-based authorization
- Schema validation
- UI component logic

## 🔐 Security

- **Authentication:** NextAuth v5 with Credentials provider, bcrypt password hashing, JWT sessions
- **Authorization:** Three-tier RBAC (Admin > Operator > Viewer) with server-side enforcement
- **Rate Limiting:** Redis-backed login throttling (5 attempts per 15 minutes per email)
- **Input Validation:** Zod schemas on every server action
- **CSRF Protection:** Built-in via Next.js Server Actions
- **Audit Trail:** Every mutation logged with user identity and timestamp

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest test suite |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Seed base data (admin, items, parties) |
| `npm run worker:dev` | Start PDF generation worker (watch mode) |
| `npm run create-admin` | Bootstrap admin user |

## 🗺️ Roadmap

- [ ] Multi-factory / multi-tenant support
- [ ] Barcode label printing (ZPL)
- [ ] Quality control checklists per work order
- [ ] Mobile-optimized shop floor terminal
- [ ] Scheduled backup automation
- [ ] Email notifications (order status, low stock alerts)
- [ ] REST API with API key authentication
- [ ] Dashboard customization (drag-and-drop widgets)
- [ ] Export to Excel/CSV
- [ ] i18n support (French, Arabic)

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org), [Drizzle ORM](https://orm.drizzle.team), and [Tailwind CSS](https://tailwindcss.com)
- Icons by [Lucide](https://lucide.dev)
- Charts by [Recharts](https://recharts.org)

---

<div align="center">

**Made with ❤️ by [MerouaneAI](https://github.com/MerouaneAI)**

⭐ Star this repo if you find it useful!

</div>
