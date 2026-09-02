# PNP CRM

> A production-grade, full-stack **Customer Relationship Management** platform built for a real **interior design business** — managing their entire sales workflow from first inquiry to final payment. Deployed directly on the client's local machine and used daily.

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)

---

## 📋 Features

### LEADS
| Module | Description |
|--------|-------------|
| **Lead Pipeline** | 5-stage pipeline (New Inquiry → Follow-Up → Meeting Scheduled → Won → Cancelled). Multi-filter by status, source & service. Kanban drag-and-drop view. |
| **Follow-Up Queue** | Scheduled call queue with Overdue / Today / Upcoming counters. Date range filters, 4 sort options, call attempt logging. |
| **Interested Leads** | Dedicated warm-lead view for high-priority prospects needing immediate attention. |
| **Site Visits** | Schedule on-site visits with Google Maps navigation. 5 completion outcomes: Convert, Reschedule, Recall, No Answer, Not Interested. |

### CUSTOMERS
| Module | Description |
|--------|-------------|
| **Customer Directory** | Converted leads with search, source/service filters & date range sort. |
| **Workspace Hub** | Per-customer hub with 5 project modules: Quotations, Design Expenses, Financials, Project Progress & Logistics. |
| **Complete Projects** | Archive of fully delivered projects with payment history & milestone logs. Reactivation support. |
| **Vendor Directory** | Supplier management with work category & transaction history. |
| **Work Fields** | Configurable catalog of service & work types used across quotations and projects. |

### ANALYTICS
| Module | Description |
|--------|-------------|
| **Business Intelligence** | PIN-protected executive dashboard with live KPI cards + Bar/Area/Line charts switchable by Day/Month/Year. |
| **Business Analytics** | Lead source, service-wise performance & staff activity insights. |
| **Reports & Analytics** | PDF report generation with date-range filtering for quotations & financials. |

### SYSTEM
| Module | Description |
|--------|-------------|
| **Cancelled Archive** | Soft-deleted leads with cancellation reason tracking & one-click reactivation. |
| **General Settings** | Role-based permissions, session management, API rate limiting & automated cloud + local database backup. |

### NOTIFICATIONS
Smart notification engine surfacing 4 alert types — Overdue Follow-Ups, Today's Follow-Ups, Site Visit Alerts, Payment Milestone Alerts — sorted by priority and deep-linked to lead detail.

---

## 📱 Mobile App (Android — In Progress)

Native Android APK built with **Capacitor + Vite + TypeScript**.

- **Offline-first** — Works without internet using SQLite local storage
- **Sync Engine** — Packages local data and pushes to CRM via Cloudflare Tunnel when online
- **Conflict Resolver** — Prevents duplicates by detecting matching phone numbers; keeps latest follow-up per lead
- **Installed** on client's Android device (APK v5)

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | NextAuth.js v5 (JWT + DB sessions) |
| Charts | Recharts |
| Drag & Drop | dnd-kit |
| PDF Export | jsPDF + jsPDF-AutoTable |
| Forms | React Hook Form + Zod |
| Mobile Framework | Capacitor + Vite |
| Mobile Storage | SQLite (@capacitor-community/sqlite) |
| Mobile Platform | Android (native APK) |
| Tunnel | Cloudflare Tunnel |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js v20+
- PostgreSQL database

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/ManavSurani/PNP_crm.git
cd PNP_crm

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Fill in your DATABASE_URL and AUTH_SECRET

# 4. Setup database
npx prisma generate
npx prisma db push

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login page
│   ├── (dashboard)/     # All CRM pages
│   │   ├── leads/       # Lead Pipeline, Follow-ups, Site Visits
│   │   ├── customers/   # Customer Directory, Workspace Hub
│   │   ├── analytics/   # Business Intelligence, Reports
│   │   └── settings/    # General Settings
│   └── api/             # 27+ REST API routes
├── components/          # Reusable React components
├── lib/                 # Prisma client, auth, rate limiting
└── types/               # TypeScript type definitions

mobile/
├── src/pages/           # Mobile screens
├── src/db/              # SQLite local database
└── sync/                # Sync engine + conflict resolver

prisma/
└── schema.prisma        # Full database schema
```

---

## 📜 License

This project is proprietary and confidential. All rights reserved.
