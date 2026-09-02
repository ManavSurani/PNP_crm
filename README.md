# 🏢 PNP CRM — Interior Design Enterprise Operating System

<div align="center">

![PNP CRM Banner](https://img.shields.io/badge/PNP_CRM-Enterprise_Interior_ERP-0f172a?style=for-the-badge&logo=blueprint&logoColor=38bdf8)

**A production-ready, full-stack CRM and turnkey project management platform custom-engineered for an interior design enterprise.**  
*Managing high-ticket residential & commercial design cycles from initial customer acquisition to on-site execution, milestones, and final ledger auditing.*

<br/>

[![Next.js 16](https://img.shields.io/badge/Next.js_16-App_Router_Turbopack-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React_19-Modern_UI-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.8-Strict_Typing-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma_ORM-6.x-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS_4-Responsive_Design-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Capacitor Android](https://img.shields.io/badge/Capacitor-Android_Native_APK-119EFF?style=flat-square&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![SQLite Offline](https://img.shields.io/badge/SQLite-Offline_First_Mobile-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![NextAuth.js v5](https://img.shields.io/badge/NextAuth_v5-RBAC_Session_Security-7B3FE4?style=flat-square&logo=auth0&logoColor=white)](https://authjs.dev/)
[![Cloudflare Tunnel](https://img.shields.io/badge/Cloudflare-Encrypted_Sync_Tunnel-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)

</div>

---

## 📑 Table of Contents

- [🌟 Executive Overview](#-executive-overview)
- [📸 Visual Showcase & UI Gallery](#-visual-showcase--ui-gallery)
- [🏗️ System Architecture](#️-system-architecture)
- [⚡ Complete Feature Breakdown](#-complete-feature-breakdown)
  - [📋 1. Lead Pipeline & Acquisition Engine](#-1-lead-pipeline--acquisition-engine)
  - [📞 2. Scheduled Follow-Up & Call Center Queue](#-2-scheduled-follow-up--call-center-queue)
  - [📍 3. Site Consultations & GPS Navigation](#-3-site-consultations--gps-navigation)
  - [👥 4. Customer Directory & Workspace Command Center](#-4-customer-directory--workspace-command-center)
  - [📝 5. Dynamic Quotation Builder & PDF Exporter](#-5-dynamic-quotation-builder--pdf-exporter)
  - [💰 6. Dual-Entry Financial Ledger & Design Expenses](#-6-dual-entry-financial-ledger--design-expenses)
  - [📊 7. Executive Business Intelligence & Analytics](#-7-executive-business-intelligence--analytics)
  - [🔔 8. Multi-Trigger Notification Dispatch Engine](#-8-multi-trigger-notification-dispatch-engine)
  - [📱 9. Companion Android Mobile App (Offline SQLite + Sync)](#-9-companion-android-mobile-app-offline-sqlite--sync)
  - [⚙️ 10. System Administration, Archive & Disaster Recovery](#️-10-system-administration-archive--disaster-recovery)
- [🛡️ Enterprise Security & Rate Limiting](#️-enterprise-security--rate-limiting)
- [💻 Tech Stack Matrix](#-tech-stack-matrix)
- [📁 Project Directory Anatomy](#-project-directory-anatomy)
- [🔌 REST API Reference](#-rest-api-reference)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [📜 License & Confidentiality](#-license--confidentiality)

---

## 🌟 Executive Overview

**PNP CRM** is a dedicated enterprise software suite purpose-built for an active interior design and architectural execution firm. Interior design projects involve complex, multi-month workflows: initial client consultations, on-site structural measurements, iterative quotation revisions, custom 3D design approvals, procurement of raw materials across hundreds of vendors, subcontractor coordination (carpenters, electricians, fabricators, painters), and milestone-staged payment installments.

Generic CRMs (Salesforce, HubSpot) fail to address the unified operational requirements of interior firms. **PNP CRM bridges this divide by delivering:**

1. **End-to-End Sales-to-Site Execution:** Unifies top-of-funnel lead intake directly with customer project hubs, financial ledgers, and site milestone trackers.
2. **On-Premise Deployment with Encrypted Cloud Sync:** Deployed locally on client hardware to maximize data privacy and zero cloud hosting overhead, while utilizing secure encrypted Cloudflare Tunnels for outside access.
3. **True Offline-First Mobile Operations:** Site supervisors frequently operate in basements and concrete high-rises with zero cellular connectivity; the companion Android mobile app captures measurements, inquiries, and follow-ups offline in local SQLite and auto-syncs with conflict resolution upon reconnecting.

---

## 📸 Visual Showcase & UI Gallery

<div align="center">

| 📊 Executive Business Intelligence | 🏢 Customer Workspace Command Center |
| :---: | :---: |
| <img src="screenshots/02_dashboard.png" width="470" alt="Executive Dashboard" /> | <img src="screenshots/09_customer_workspace_hub.png" width="470" alt="Customer Workspace Hub" /> |
| *Real-time revenue charts, active inquiries & conversion telemetry* | *Dedicated 5-module workspace hub for converted customer projects* |

| 📋 Lead Pipeline (Multi-Stage & Sorting) | 📞 Follow-Up Queue & Reminders |
| :---: | :---: |
| <img src="screenshots/03_lead_pipeline.png" width="470" alt="Lead Pipeline" /> | <img src="screenshots/05_follow_up_queue.png" width="470" alt="Follow-Up Queue" /> |
| *5-stage status pipeline, multi-field filters & 3-dot action menus* | *Overdue, Today & Upcoming call lists with attempt logging* |

| 📍 Site Consultations with Maps Navigation | 👥 Customer Directory & Filter Suite |
| :---: | :---: |
| <img src="screenshots/07_site_visits.png" width="470" alt="Site Visits" /> | <img src="screenshots/08_customer_directory.png" width="470" alt="Customer Directory" /> |
| *Location-aware site visits with direct Google Maps turn-by-turn routing* | *Full client directory with project linkage and timeline sorting* |

| 🔒 PIN-Protected Executive Analytics Gate | 📈 Automated Financial & PDF Reporting |
| :---: | :---: |
| <img src="screenshots/13_analytics_pin_entry.png" width="470" alt="PIN Protection Gate" /> | <img src="screenshots/14_reports_analytics.png" width="470" alt="Reports & Analytics" /> |
| *Biometric/PIN layer safeguarding proprietary business numbers* | *Custom date-range report compiler with instantaneous PDF exports* |

</div>

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client_Workspace["🏢 On-Premise Client Host (Local Machine)"]
        NextServer["Next.js 16 App Router Engine\n(React 19 + Turbopack)"]
        LocalDB[("PostgreSQL Database\n(Prisma ORM Managed)")]
        LocalBackup["Automated Backup Scheduler\n(Hourly Snapshots -> Local .zip)"]
        NextServer --> LocalDB
        LocalBackup -.-> LocalDB
    end

    subgraph Security_Layer["🛡️ Perimeter Security & Tunnels"]
        CF_Tunnel["Cloudflare / Ngrok Encrypted Tunnel\n(Dynamic Public HTTPS Gateway)"]
        RateLimit["Network & Application Rate Limiter\n(Brute-force protection + IP throttle)"]
        RBAC["NextAuth.js v5 RBAC Engine\n(Admin & Staff Role Sessions)"]
        CF_Tunnel <--> NextServer
        RateLimit --> NextServer
        RBAC --> NextServer
    end

    subgraph Mobile_Ecosystem["📱 Field Supervisor Mobile App (Android APK v5)"]
        MobileUI["Vite + React Mobile Client\n(Capacitor Framework)"]
        LocalSQLite[("Embedded SQLite DB\n(@capacitor-community/sqlite)")]
        SyncEngine["Two-Way Sync Engine\n(5-Phase Sync State Machine)"]
        ConflictResolver["Intelligent Conflict Resolver\n(Phone Deduplication + Timestamp Wins)"]

        MobileUI <--> LocalSQLite
        MobileUI --> SyncEngine
        SyncEngine <--> ConflictResolver
    end

    subgraph Remote_Services["☁️ External Cloud Integrations"]
        GoogleMaps["Google Maps Navigation API"]
        CloudR2["Cloudflare R2 / AWS S3\n(Encrypted Off-Site Cold Storage)"]
    end

    SyncEngine <== "Encrypted REST with x-mobile-sync-key" ==> CF_Tunnel
    LocalBackup -- "Nightly Cloud Mirror" --> CloudR2
    NextServer -- "Launch Turn-by-Turn GPS" --> GoogleMaps
```

---

## ⚡ Complete Feature Breakdown

### 📋 1. Lead Pipeline & Acquisition Engine
- **5-Tier State Machine:** Strictly enforced transition lifecycle:
  `NEW_INQUIRY` ➔ `FOLLOW_UP` ➔ `MEETING_SCHEDULED` ➔ `WON_ORDER` ➔ `CANCELLED`.
- **Granular Lead Profiles:** Stores primary client name, verified mobile, alternate telephone, site address, service typology (`2BHK Interior`, `3BHK Interior`, `4BHK Interior`, `Raw House`, `Office`, `Commercial`, `Other`), acquisition channel (`WhatsApp`, `Facebook`, `Instagram`, `Website`, `Direct Call`, `Walk-in`, `Reference`), priority ranking (`HIGH`, `MEDIUM`, `LOW`), and assigned team member.
- **Dynamic Search & Multi-Param Filtering:** Real-time client-side substring search across names, phone numbers, and service types; multi-select filters by status, acquisition origin, and project typology.
- **5-Way Sorting Logic:** Sorts leads instantaneously by `Newest First`, `Oldest First`, Alphabetical `A-Z`, Alphabetical `Z-A`, and `Pipeline Priority Order`.
- **Visual Kanban Board:** Integrated `dnd-kit` drag-and-drop board allowing quick column relocation with instant database synchronization.
- **Quick Action Bar:** 3-dot contextual menu offering instant profile editing, soft archiving, or permanent purging.
- **Unified Activity Timeline:** Chronological event stream on every lead detail page combining call records, site notes, meeting transcripts, and status transitions into a single auditable feed.

---

### 📞 2. Scheduled Follow-Up & Call Center Queue
- **Tri-State Counter Metric Cards:** Prominently highlights `Overdue`, `Today`, and `Upcoming` follow-ups at the top of the queue; clicking any metric card immediately filters the visible table.
- **Call Attempt Logging:** Enables representatives to log outcomes of every contact attempt (`Answered`, `Busy`, `Switched Off`, `Invalid Number`, `Requested Callback`) with custom timestamped notes.
- **Date Range Query Engine:** Allows filtering follow-up commitments by exact dates or historical spans to prevent any prospective lead from falling through the cracks.
- **Instant Deep-Linking:** Tapping any record from the queue immediately loads the complete lead workspace without loss of context.

---

### 📍 3. Site Consultations & GPS Navigation
- **Turn-by-Turn Navigation:** Direct integration with Google Maps API. A single tap on "Launch Navigation" opens coordinates or address directly in Google Maps for on-site measurement teams.
- **5 Consultation Closure Outcomes:**
  1. `Convert to Customer` — Instantly marks the lead as won and initializes a customer project hub.
  2. `Reschedule` — Prompts date/time picker to set a revised appointment with automated notification queuing.
  3. `Want Recall` — Pushes client back into the priority follow-up queue.
  4. `No Answer` — Logs a missed appointment event on the timeline.
  5. `Not Interested` — Prompts exit reason and moves inquiry to the Canceled Archive.
- **Automated Chrono-Badging:** Highlights appointments with dynamic visual pills (`Today`, `Overdue`, `Upcoming`).

---

### 👥 4. Customer Directory & Workspace Command Center
- **Seamless Elevation:** When a prospective lead is won (`WON_ORDER`), the system automatically provisions an isolated **Customer Project Hub**.
- **Customer Directory:** Filterable client catalog showing project title, service classification, conversion date, assigned project lead, and financial snapshot.
- **5 Modular Workspace Command Tabs:**
  1. **📄 Quotations:** Draft, revise, duplicate, and publish cost proposals with live item totals and client sign-offs.
  2. **🎨 Design Expenses:** Track specific design expenditures including 3D rendering fees, 2D architectural CAD drafts, floor layout expenses, material sample purchases, and mood boards.
  3. **💳 Financials & Ledger:** Live accounting ledger displaying total billed, payments collected, pending balance, payment method records, and audit sync flags.
  4. **🏗️ Project Progress:** Interactive milestone tracker with site execution logs, completion percentages, delay notes, and subcontractor sign-offs.
  5. **👤 Customer Logistics:** Architectural specifications, client contact directory, physical site blueprints, and historical pre-sales lead records.

---

### 📝 5. Dynamic Quotation Builder & PDF Exporter
- **Itemized Work Specifications:** Build room-by-room quotations (Living Room, Master Bedroom, Modular Kitchen, False Ceiling, Electrical, Plumbing, Painting).
- **Drag-and-Drop Reordering:** Move line items and work packages using drag handles for intuitive proposal organization.
- **Automatic Calculations:** Calculates square-footage rates, material costs, labor overhead, taxes, and net profit margins in real time.
- **Instant jsPDF Generation:** Generates client-ready, beautifully formatted quotation PDFs with brand watermark, company details, itemized tables, payment terms, and signature blocks.
- **WhatsApp Share Direct Link:** One-click generation of customized WhatsApp message text including itemized total and approved proposal download link.

---

### 💰 6. Dual-Entry Financial Ledger & Design Expenses
- **Milestone-Based Installment Tracking:** Configure progressive payment milestones (e.g., 10% Booking, 40% Woodwork Start, 30% Finishings, 20% Handover).
- **Automated Due-Date Monitor:** Watches upcoming installment due dates and surfaces alerts across the notification matrix.
- **Expense Categorization:** Distinctly separates general business overhead from client-specific site material purchases and vendor disbursements.

---

### 📊 7. Executive Business Intelligence & Analytics
- **🔒 PIN-Protected Executive Gate:** Business owners require a secure cryptographic PIN before gaining access to profitability figures, sensitive revenue charts, and staff productivity reports.
- **Real-Time KPI Radar:** Tracks aggregate pipeline valuation, conversion rate percentage, average revenue per project, active follow-up volumes, and overdue liabilities.
- **Interactive Visualizations:** Toggleable **Bar Charts, Area Graphs, and Line Trends** powered by `recharts` with dynamic time-horizon toggling (`Day`, `Month`, `Year`).
- **Acquisition Channel ROI:** Visual breakdowns revealing which marketing channels yield the highest conversion-to-closed ratios.

---

### 🔔 8. Multi-Trigger Notification Dispatch Engine
- **4 Distinct Real-Time Alert Classes:**
  - 🚨 **Overdue Follow-Ups:** Any active prospective client whose callback schedule has lapsed.
  - 📅 **Today's Follow-Ups:** Real-time agenda of scheduled phone outreach for the business day.
  - 📍 **Site Consultation Alerts:** Upcoming or overdue on-site measurement appointments with client addresses.
  - 💵 **Payment Milestone Alerts:** Uncollected project installments whose due date has passed or is due today.
- **Sidebar Badge Counter:** Dynamic notification pill that updates live without full-page reloads.
- **Direct Context Deep-Linking:** Clicking any notification takes the user directly to the relevant lead profile or customer project hub.

---

### 📱 9. Companion Android Mobile App (Offline SQLite + Sync)
- **Engineered with Capacitor & Vite:** High-performance native Android application packaging web technologies with native hardware access.
- **100% Offline-First SQLite Engine:**
  - Leverages `@capacitor-community/sqlite` directly on the device.
  - Field personnel can create inquiries, update follow-ups, and log site consultation notes deep inside basements or rural job sites with zero cellular data.
- **5-Stage Synchronization Engine:**
  1. *Connectivity Check:* Pings tunnel heartbeat to verify network presence.
  2. *Credential Handshake:* Validates custom `x-mobile-sync-key` secret header against the desktop server.
  3. *Pending Queue Serialization:* Aggregates local offline inserts and modifications from SQLite.
  4. *Atomic Payload Transmission:* Dispatches transaction bundle to `/api/mobile/sync`.
  5. *Receipt Acknowledgment & Queue Clearance:* Clears synced local pending flags only upon verified HTTP 200 server commit.
- **Heuristic Conflict Resolver:**
  - **Phone Deduplication:** Normalizes phone formats (strips `+91`, `91`, leading `0`) and catches duplicate submissions without data loss.
  - **Timestamp Resolution:** Resolves follow-up conflicts by prioritizing the most recent `scheduledAt` timestamp.
- **Native APK Distribution:** Shipped directly as an optimized, signed release APK installed on client Android hardware.

---

### ⚙️ 10. System Administration, Archive & Disaster Recovery
- **🗃️ Canceled Archive:** Safeguards client relationships by preserving canceled inquiries rather than performing hard deletes. Staff can record exit interview reasons and reactivate prospects in one click if budgets or timing change.
- **👥 Role-Based Access Control (RBAC):** NextAuth.js v5 permissions differentiating between `ADMIN` (unrestricted access) and `STAFF` (restricted financial visibility).
- **📦 Automated Dual-Layer Backup Engine:**
  - Scheduled background routine (`auto-backup.mjs`) generating timestamped ZIP archives containing database dumps and media assets.
  - Automatic retention policy balancing local storage while mirroring critical backups to encrypted cloud object storage (Cloudflare R2 / AWS S3).
- **🌐 Smart Tunnel Manager:** Background orchestration for Cloudflare Tunnels / Ngrok with offline detection and a one-click reconnect widget embedded in the dashboard sidebar.

---

## 🛡️ Enterprise Security & Rate Limiting

```
Incoming Request ──> IP Rate Limiter ──> Account Lockout Guard ──> NextAuth v5 Session ──> Zod Input Validation ──> Prisma ORM
                      (Network Layer)       (Application Layer)       (Session Layer)          (Data Layer)           (Database)
```

1. **Multi-Layer Brute-Force Defense:**
   - **Network Layer:** IP-based sliding window rate limiter (`rate-limit.ts`) prevents automated credential stuffing.
   - **Application Layer:** Account lockout enforcement locks out users after 5 consecutive failed login attempts for 15 minutes.
2. **Session Hardening:**
   - NextAuth.js v5 utilizing encrypted JWTs paired with active database session verification.
   - Session auto-repair logic reconciles ghost sessions upon server restarts.
3. **API & Sync Perimeter:**
   - Mobile sync endpoints require cryptographically secure `x-mobile-sync-key` headers.
   - All external client submissions are sanitized and validated against strict `Zod` schemas before touching Prisma models.

---

## 💻 Tech Stack Matrix

| Layer | Technology | Version / Tool | Purpose & Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Core** | Next.js App Router | `v16.x` (Turbopack) | High-performance server/client components, zero waterfall loading |
| **UI Library** | React | `v19.x` | Modern reactive UI state primitives and concurrent rendering |
| **Language** | TypeScript | `v5.8.x` | Strict end-to-end type safety across frontend, backend, and DB |
| **Styling** | Tailwind CSS | `v4.x` | Modern, responsive CSS utilities with custom design tokens |
| **Icons & Visuals** | Lucide React | Latest | Clean, consistent SVG icon set across all 14 CRM modules |
| **Database** | PostgreSQL | `v16.x` | High-integrity relational database with ACID transactional guarantees |
| **ORM** | Prisma | `v6.x` | Type-safe query client, automated schema migrations & seeders |
| **Authentication** | NextAuth.js | `v5.x` (Auth.js) | Session & JWT security, credential provider, lockout callbacks |
| **Charts & Visuals**| Recharts | `v2.x` | Composable SVG data visualizations (Area, Bar, Line) |
| **Drag & Drop** | dnd-kit | `v6.x` | Accessible, performant drag-and-drop primitives for Kanban |
| **PDF Generation** | jsPDF + AutoTable | `v2.5.x` | Client-side pixel-perfect quotation & financial report compilation |
| **Form Validation** | React Hook Form + Zod | Latest | Declarative form state with compile-time schema validation |
| **Mobile Shell** | Capacitor | `v7.x` | Native Android wrapper bridging web client with device hardware |
| **Mobile Storage** | SQLite Plugin | `@capacitor-community/sqlite` | Embedded local relational storage for zero-connectivity field work |
| **Tunnel Gateway** | Cloudflare / Ngrok | Latest | Encrypted public HTTPS gateway for mobile app sync |

---

## 📁 Project Directory Anatomy

```
pnp_crm/
├── mobile/                          # 📱 Companion Android Mobile Application
│   ├── android/                     # Native Android Studio Project & Gradle Config
│   ├── src/
│   │   ├── db/                      # Native SQLite Database Models & Migrations
│   │   ├── pages/                   # Mobile Lead Capture, Follow-Up & Sync Screens
│   │   └── sync/
│   │       ├── sync-engine.ts       # 5-Phase Sync State Machine
│   │       └── conflict-resolver.ts # Heuristic Deduplication & Timestamp Resolution
│   └── capacitor.config.ts          # Native Capacitor Platform Configuration
│
├── prisma/
│   ├── schema.prisma                # Full Relational Entity Schema (24+ Models)
│   └── seed.ts                      # Development Database Seeder Script
│
├── screenshots/                     # 📸 High-Resolution System UI Screenshots
│   ├── 01_login_page.png
│   ├── 02_dashboard.png
│   ├── 03_lead_pipeline.png
│   ├── 04_lead_detail.png
│   ├── 05_follow_up_queue.png
│   ├── 07_site_visits.png
│   ├── 08_customer_directory.png
│   ├── 09_customer_workspace_hub.png
│   ├── 13_analytics_pin_entry.png
│   └── 14_reports_analytics.png
│
├── src/
│   ├── app/
│   │   ├── (auth)/login/            # Secure Authentication Screen
│   │   ├── (dashboard)/             # Authenticated Dashboard Application
│   │   │   ├── page.tsx             # Main Executive KPI Radar & Analytics
│   │   │   ├── leads/               # Lead Pipeline & Unified Activity Timeline
│   │   │   ├── follow-ups/          # Scheduled Follow-Up & Call Queue
│   │   │   ├── interested/          # Priority Warm Lead Workspace
│   │   │   ├── meetings/            # Site Visits & Google Maps GPS Integration
│   │   │   ├── customers/           # Customer Directory & Workspace Hub Modules
│   │   │   │   └── [id]/            # 5-Module Command Center (Quotes, Financials, etc.)
│   │   │   ├── analytics/           # PIN-Protected Business Intelligence
│   │   │   ├── reports/             # PDF Report Generator & Export Engine
│   │   │   ├── canceled/            # Soft-Delete Canceled Archive & Recovery
│   │   │   ├── suppliers/           # Material Vendor Directory & Ledger
│   │   │   ├── fields/              # Service Typology & Work Catalog Setup
│   │   │   └── settings/            # System Config, RBAC, Backups & Tunnels
│   │   └── api/                     # 🌐 27+ RESTful API Backend Microservices
│   │       ├── auth/                # NextAuth Session & Credentials Handlers
│   │       ├── leads/               # Lead CRUD, Status Transitions & Notes
│   │       ├── customers/           # Customer Workspace Data Endpoints
│   │       ├── follow-ups/          # Queue Management & Call Attempt Logging
│   │       ├── meetings/            # Consultation Scheduling & Outcome Actions
│   │       ├── notifications/       # Real-Time Multi-Trigger Alert Engine
│   │       ├── mobile/sync/         # Atomic Two-Way Sync Endpoint
│   │       ├── reports/             # Financial & Quotation PDF Aggregators
│   │       └── system/              # Cloud Backups & Tunnel Telemetry
│   │
│   ├── components/                  # Reusable UI & Layout Components
│   │   ├── layout/                  # Sidebar, Header, BrandLogo, TunnelWidget
│   │   └── ui/                      # Modals, Dropdowns, Badges, DatePickers
│   └── lib/                         # Core Utilities (Prisma, RateLimit, AuthConfig)
│
├── auto-backup.mjs                  # 💾 Disaster Recovery Backup Scheduler
├── start-crm.ps1                    # 🚀 PowerShell Master Launcher Script
└── package.json                     # Workspace Dependencies & Script Configurations
```

---

## 🔌 REST API Reference

The backend exposes **27+ structured RESTful endpoints** designed for high throughput, strict payload validation, and robust session security:

| Method | Endpoint Route | Description & Payload Responsibility |
| :--- | :--- | :--- |
| `POST` | `/api/auth/[...nextauth]` | Session establishment, credentials verification & token refresh |
| `GET/POST` | `/api/leads` | Query filterable leads list / Ingest new prospective inquiries |
| `GET/PUT/DEL` | `/api/leads/[id]` | Fetch unified profile / Update lead metadata / Soft archive lead |
| `GET/POST` | `/api/follow-ups` | Fetch tri-state call queue / Log new follow-up appointment |
| `PATCH` | `/api/follow-ups/[id]` | Log call attempt outcomes (`Answered`, `Busy`, `Callback`) |
| `GET/POST` | `/api/meetings` | Query upcoming site consultations / Book new GPS site visit |
| `PATCH` | `/api/meetings/[id]` | Finalize site visit with 1 of 5 closure outcomes |
| `GET` | `/api/customers` | Query converted customer project directory |
| `GET/PUT` | `/api/customers/[id]` | Query 5-module workspace hub data / Update project parameters |
| `POST` | `/api/project-quotations`| Create, duplicate, or revise itemized customer quotations |
| `POST` | `/api/project-payments`  | Record milestone payments into dual-entry financial ledger |
| `GET` | `/api/notifications` | Fetch priority-sorted multi-trigger system notifications |
| `POST` | `/api/mobile/sync` | Receive and reconcile atomic offline SQLite mobile payloads |
| `GET` | `/api/stats` | Aggregate high-level executive KPIs and charts for dashboard |
| `POST` | `/api/system/backup` | Trigger instantaneous database snapshot and cloud archive |
| `GET/POST` | `/api/system/tunnel` | Telemetry on Cloudflare Tunnel status with auto-reconnect |

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: `v20.x` or higher (LTS recommended)
- **PostgreSQL**: `v15.x` or higher
- **Android Studio / SDK** (only required if building the mobile APK locally)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/ManavSurani/PNP_crm.git
cd PNP_crm

# Install project dependencies
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database Connection URL
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/pnp_crm?schema=public"

# NextAuth.js Cryptographic Secret & URL
AUTH_SECRET="your_generated_cryptographic_auth_secret_key"
NEXTAUTH_URL="http://localhost:3000"

# Mobile App Companion Authentication Key
MOBILE_SYNC_SECRET="pnp_mobile_sync_secret_key"

# Optional Cloud Storage (Disaster Recovery Backups)
R2_ACCESS_KEY_ID="your_cloudflare_r2_key"
R2_SECRET_ACCESS_KEY="your_cloudflare_r2_secret"
R2_BUCKET_NAME="pnp-crm-backups"
R2_ENDPOINT="https://your_account_id.r2.cloudflarestorage.com"
```

### 3. Database Migration & Initialization
```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations to PostgreSQL
npx prisma db push

# (Optional) Seed demo dummy data
npx prisma db seed
```

### 4. Launch Development Server
```bash
# Run Next.js Turbopack development server
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) in your browser. Default administrative credentials will prompt for initialization upon first launch.

### 5. Compiling the Companion Mobile App (Optional)
```bash
cd mobile
npm install

# Build web distribution and sync to native Android layer
npm run build
npx cap sync android

# Open in Android Studio to compile APK
npx cap open android
```

---

## 📜 License & Confidentiality

**Confidential & Proprietary Architecture.**  
Engineered by **[Manav Surani](https://github.com/ManavSurani)**.  
All intellectual rights and proprietary codebase rights reserved for commercial usage by the designated client firm. Unauthorized copying, distribution, or public replication of proprietary business logic is strictly prohibited.

---

<div align="center">

**Built with pride by Manav Surani**  
*Turning complex interior design operations into seamless, software-driven execution.*

</div>
