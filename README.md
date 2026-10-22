<div align="center">

<img src="public/logo.png" alt="PNP CRM Logo" width="120" />

# PNP CRM

**A full-stack CRM and project-operations platform for interior-design and construction teams.**

Connect lead capture, follow-ups, site visits, customer projects, quotations, expenses, financial records, milestones, notifications, and reporting — all in one local-first workspace.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?logo=prisma)](https://www.prisma.io)
[![SQLite](https://img.shields.io/badge/SQLite-local--first-003B57?logo=sqlite)](https://sqlite.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

> **Status:** The core CRM is implemented and can be run with the existing `.env` and npm workflow. The Windows installer/distribution path is present in the repository, but its final release readiness still depends on environment-specific testing described in [Known limitations](#roadmap-and-known-limitations).

---

## 📑 Table of Contents

- [What's Inside](#whats-inside)
- [How the CRM Works](#how-the-crm-works)
- [Design and Presentation](#design-and-presentation)
- [Feature Overview](#feature-overview)
- [📸 Screenshots and Page Guide](#-screenshots-and-page-guide)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Developer Installation](#developer-installation)
- [Windows Installer Installation](#windows-installer-installation)
- [First-run /setup Wizard](#first-run-setup-wizard)
- [Daily Operations](#daily-operations)
- [Backup and Restore](#backup-and-restore)
- [Security and Data Protection](#security-and-data-protection)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Mobile App](#mobile-app)
- [Troubleshooting](#troubleshooting)
- [Quality Gates and Release Validation](#quality-gates-and-release-validation)
- [Roadmap and Known Limitations](#roadmap-and-known-limitations)
- [Contributing Boundaries](#contributing-boundaries)
- [License and Confidentiality](#license-and-confidentiality)

---

## What's Inside

The repository contains two related applications:

| App | Technology | Description |
|-----|-----------|-------------|
| 🖥️ **Desktop/web CRM** | Next.js App Router + Prisma SQLite | Full CRM UI with leads, customers, projects, analytics |
| 📱 **Companion Android App** | Capacitor + Vite + on-device SQLite | Mobile client with offline support and authenticated sync |

---

## Current Status and Scope

### ✅ Implemented

- Authenticated Next.js CRM UI with lead, customer, project, financial, quotation, reporting, notification, and settings areas.
- SQLite persistence through `prisma/schema.prisma` and Prisma Client.
- Light/dark/system/scheduled theme settings with persisted configuration.
- Customer Hub modules for details, design expenses, financials, progress, and quotations.
- Local encrypted backup files containing a SQLite-safe snapshot and uploads.
- Optional Cloudflare R2 upload for backup files when credentials are configured.
- Android companion app under `mobile/`, including local SQLite storage and `/api/mobile/sync`.
- Windows distribution files under `installer/`, `packaging/`, and `tools/`.

### ⚙️ Optional or Conditional

- Cloudflare R2 backups require an R2 account, bucket, endpoint credentials, and environment/configuration values.
- Mobile remote sync requires a reachable CRM URL/tunnel and matching mobile sync secrets.
- The packaged Windows port defaults to **43100**. The existing developer launcher continues to use port **3000**.
- The installer can register a Windows Task Scheduler backup only when the required Windows/Node environment is available.

### ⚠️ Not Claimed as Universally Production-Ready

The repository includes distribution and mobile build assets, but a release should not be described as production-ready for every machine until the Inno Setup compiler, bundled `node.exe` payload, Task Scheduler registration, live R2 upload/restore, and a clean Windows installation have each been tested in the target environment.

---

## How the CRM Works

PNP CRM follows a simple, clear business flow:

1. 📋 A new inquiry is captured and checked for duplicates.
2. 🔄 The team works the inquiry through the Lead Pipeline.
3. 📞 Follow-ups and site visits keep the next action visible.
4. ✅ A successful consultation converts the lead into a Customer Hub project.
5. 💰 The project receives quotations, design expenses, financial entries, and execution milestones.
6. 🏁 Final payment and completion move the project into the completed-project view.
7. 📊 Dashboard, reports, notifications, and backups help the team operate safely.

```mermaid
flowchart LR
    Inquiry["New inquiry"] --> Pipeline["Lead Pipeline"]
    Pipeline --> FollowUp["Follow-ups"]
    Pipeline --> Visit["Site visit"]
    FollowUp --> Visit
    Visit -->|successful conversion| Customer["Customer Hub"]
    Customer --> Quote["Quotation"]
    Customer --> Finance["Financial ledger"]
    Customer --> Progress["Project progress"]
    Quote --> Finance
    Finance --> Complete["Completed project"]
    Pipeline -. passive .-> Archive["Interested / Archived"]
    Pipeline -. closed .-> Canceled["Canceled Records"]
```

> This is a workflow explanation, not a promise that every transition is automatic. The exact outcome depends on the action selected by the user and the route/business rules in the repository.

---

## Design and Presentation

The interface is organized as a **desktop-first operations workspace**:

| Design Principle | Description |
|-----------------|-------------|
| 🧭 **Navigation** | Sidebar modules and a topbar provide consistent movement between sales, customers, operations, reports, and settings |
| 📊 **Information hierarchy** | Dashboard KPI cards summarize work first; tables and detail panels provide the records behind each number |
| 🏷️ **Operational states** | Overdue, today, upcoming, archived, canceled, completed, and financial states use distinct badges and labels |
| 🗂️ **Customer context** | The Customer Hub keeps quotations, design, financials, progress, and details under one project-centered destination |
| 🔐 **Protected areas** | Analytics and cleanup workflows use PIN and authentication gates |
| 🌙 **Theme support** | Light, dark, system, and scheduled theme settings |
| 📱 **Responsive behavior** | Forms, filters, tables, cards, modals, and customer modules are implemented as responsive React/Tailwind surfaces |

---

## Feature Overview

### 🎯 Lead and Sales Operations

- Lead capture with duplicate checking, source, service type, address, budget, priority, and assigned staff.
- Lead Pipeline with status filters, date filters, sorting, hot-lead marking, action menus, and lead details.
- Follow-Up Queue with scheduled dates/times, outcomes, missed-call tracking, long-distance marking, and overdue/today/upcoming views.
- Interested Leads for warm opportunities and a separate passive Archived Leads view.
- Canceled Records with reactivation support.
- Site Visits/Meetings with scheduling, completion outcomes, notes, and address-based navigation.
- Conversion safeguards for naming and irreversible lead-to-customer conversion.

### 👤 Customer and Project Operations

- Customer Directory ordered by conversion/project context.
- Customer Hub with project name and customer identity.
- Customer Logistics/details and activity history.
- Design Expenses with project-specific cost and profit calculations.
- Financial Ledger with income, expenses, installment/final-payment handling, remaining due, and financial closure state.
- Project Progress milestones, phases, subcategories, completion checks, logs, and delay tracking.
- Completed Projects archive and project reactivation flows.
- Supplier/Vendor directory and Work Fields catalog.

### 📊 Quotations and Reporting

- Project quotation creation, editing, ordering, itemized pricing, milestones, and payments.
- PDF quotation/report generation using jsPDF and AutoTable.
- Dashboard KPIs, reports, service-demand views, system-pulse charts, and business analytics.
- PIN-protected analytics and customer-cleanup areas.
- Notification center for active follow-ups, site visits, milestones, and related activity.

### ⚙️ Administration and Operations

- Settings for identity, security, sessions, theme appearance, schedule, backups, restore, system configuration, and customer cleanup.
- Auth.js credentials sessions with role-aware access checks.
- Local launcher, hidden production start, stop support, desktop shortcut assets, and optional tunnel integration.
- Windows Program Files/ProgramData separation for immutable application files and mutable data.

---

## 📸 Screenshots and Page Guide

> Screenshots are shown in **Dark Mode** (Light Mode versions also available in `screenshots/Light_Mode/`). Each entry explains the screen's purpose and where it fits in the workflow.

---

### 🔐 Phase 1 — Authentication and Entry

<table>
<tr>
<td align="center" width="50%">

**Login Page**

![Login Page Dark](screenshots/Dark_Mode/Phase_01_Auth_and_Entry/01_Login_Page_Dark.png)

The protected entry point. Auth.js credentials sessions control access to the dashboard.

</td>
<td align="center" width="50%">

**Forgot Password Modal**

![Forgot Password Modal Dark](screenshots/Dark_Mode/Phase_01_Auth_and_Entry/02_Login_ForgotPassword_Modal_Dark.png)

Password recovery follows the existing authentication routes.

</td>
</tr>
</table>

---

### 🔄 Phase 2 — Lead Pipeline

<table>
<tr>
<td align="center" width="50%">

**Kanban Board View**

![Lead Pipeline Kanban Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/03_Lead_Pipeline_Kanban_Board_Dark.png)

Visual drag-and-drop pipeline view. Hot-lead indicators and status columns give an instant overview.

</td>
<td align="center" width="50%">

**List View**

![Lead Pipeline List Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/04_Lead_Pipeline_List_View_Dark.png)

The working list for active inquiries — search, filters, sorting, hot-lead indicators, and row actions.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Advanced Filters**

![Lead Pipeline Filters Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/05_Lead_Pipeline_Advanced_Filters_Dark.png)

Filter by date range, source, service type, priority, status, and assigned staff.

</td>
<td align="center" width="50%">

**New Lead Modal**

![New Lead Modal Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/06_Lead_Pipeline_New_Lead_Modal_Dark.png)

Capture inquiries with duplicate checking, source, budget, and assignment.

</td>
</tr>
</table>

<table>
<tr>
<td align="center" width="50%">

**Lead Details — Overview**

![Lead Details Overview Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/07_Lead_Details_Overview_Dark.png)

Profile information, requirements, activity, follow-ups, meetings, notes, and conversion actions in one place.

</td>
<td align="center" width="50%">

**Lead Details — Live Activity**

![Lead Details Activity Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/14_Lead_Details_Live_Activity_Dark.png)

Real-time activity history and audit trail for every lead record.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Requirement Analysis**

![Requirement Analysis Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/15_Lead_Details_Requirement_Analysis_Dark.png)

Structured requirements collection and package selection for each lead.

</td>
<td align="center" width="50%">

**Create Quotation Modal**

![Create Quotation Modal Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/18_Lead_Details_Create_Quotation_Modal_Dark.png)

Directly create quotations from within the lead detail view.

</td>
</tr>
</table>

<table>
<tr>
<td align="center" width="50%">

**Follow-Up Queue**

![Follow-Up Queue Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/19_Follow_Up_Queue_Active_Dark.png)

Turns planned contact into a daily task list — overdue, today, and upcoming views with outcomes and notes.

</td>
<td align="center" width="50%">

**Schedule Follow-Up Modal**

![Follow-Up Schedule Modal Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/20_Follow_Up_Schedule_Modal_Dark.png)

Set scheduled date/time, type, notes, and outcomes for each follow-up action.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Interested Leads**

![Interested Leads Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/21_Interested_Leads_Active_Tab_Dark.png)

Separates warm opportunities from the main active queue.

</td>
<td align="center" width="50%">

**Archived Leads**

![Archived Leads Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/22_Interested_Leads_Archived_Tab_Dark.png)

Passive leads that should not create active follow-up noise until reactivated.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Site Visits Directory**

![Site Visits Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/23_Site_Visits_Directory_Dark.png)

Tracks consultation dates, times, addresses, notes, and completion outcomes.

</td>
<td align="center" width="50%">

**Schedule Site Visit**

![Site Visit Schedule Dark](screenshots/Dark_Mode/Phase_02_Lead_Pipeline/24_Site_Visits_Schedule_Modal_Dark.png)

Schedule site visits/meetings with address-based navigation support.

</td>
</tr>
</table>

---

### 👤 Phase 3 — Customer and Project Operations

<table>
<tr>
<td align="center" width="50%">

**Customer Directory**

![Customer Directory Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/25_Customer_Directory_Dark.png)

Lists converted customer projects and provides the entry point into project-specific work.

</td>
<td align="center" width="50%">

**Customer Directory Filters**

![Customer Directory Filters Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/26_Customer_Directory_Filters_Dark.png)

Filter customers by project status, date, and assigned staff.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Customer Workspace Hub**

![Customer Workspace Hub Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/27_Customer_Workspace_Hub_Dark.png)

The project-centered navigation layer — connects details, quotations, design, financials, and progress without losing context.

</td>
<td align="center" width="50%">

**Customer Hub Details**

![Customer Hub Details Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/28_Customer_Hub_Details_Dark.png)

Full customer profile, project identity, and activity history.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Design Studio / Expenses**

![Design Studio Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/29_Customer_Hub_Design_Studio_Dark.png)

Project-specific design cost tracking and profit calculations.

</td>
<td align="center" width="50%">

**Financial Ledger**

![Financials Ledger Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/30_Customer_Hub_Financials_Ledger_Dark.png)

Income, expenses, installments, final-payment handling, remaining due, and financial closure state.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Add Payment Modal**

![Add Payment Modal Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/31_Financials_Add_Payment_Modal_Dark.png)

Record income payments with type, amount, date, and reference.

</td>
<td align="center" width="50%">

**Record Expense Modal**

![Record Expense Modal Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/32_Financials_Record_Expense_Modal_Dark.png)

Log project expenses with category, vendor, and receipt reference.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Work Progress Tracker**

![Work Progress Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/34_Customer_Hub_Work_Progress_Dark.png)

Project milestones, phases, subcategories, completion checks, logs, and delay tracking.

</td>
<td align="center" width="50%">

**Add New Phase Drawer**

![Add Phase Drawer Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/36_Progress_Add_New_Phase_Drawer_Dark.png)

Create project execution phases with sub-tasks and completion tracking.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Quotations Module**

![Quotations Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/37_Customer_Hub_Quotations_Dark.png)

Project quotation list with creation, ordering, itemized pricing, milestones, and payments.

</td>
<td align="center" width="50%">

**Quotation Detail Drawer**

![Quotations Drawer Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/38_Quotations_Detail_Drawer_Dark.png)

Full quotation detail with line items, payment schedule, and PDF export.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Completed Projects Archive**

![Completed Projects Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/39_Complete_Projects_Archive_Dark.png)

Historical view for delivered work, separate from the active customer workspace.

</td>
<td align="center" width="50%">

**Vendor Directory**

![Vendor Directory Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/41_Vendor_Directory_Dark.png)

Supplier/vendor records used by the operational side of interior projects.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Work Fields Management**

![Work Fields Dark](screenshots/Dark_Mode/Phase_03_Customer_Operations/43_Work_Fields_Management_Dark.png)

Reusable catalog for service and work categories used across CRM forms.

</td>
<td></td>
</tr>
</table>

---

### 📊 Phase 4 — Analytics, Security PIN, and Reports

<table>
<tr>
<td align="center" width="50%">

**Business Intelligence Dashboard**

![BI Dashboard Days Dark](screenshots/Dark_Mode/Phase_04_Analytics_Security_PIN_and_Reports/44_Business_Intelligence_Dashboard_Days_Dark.png)

KPI cards summarize pipeline, follow-ups, site visits, customers, and financials.

</td>
<td align="center" width="50%">

**Dashboard — Monthly View**

![BI Dashboard Months Dark](screenshots/Dark_Mode/Phase_04_Analytics_Security_PIN_and_Reports/45_Business_Intelligence_Dashboard_Months_Dark.png)

Monthly trend charts for pipeline health and operational activity.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Analytics PIN Entry**

![Analytics PIN Dark](screenshots/Dark_Mode/Phase_04_Analytics_Security_PIN_and_Reports/46_Analytics_PIN_Before_Input_Dark.png)

A deliberate security boundary before sensitive business analytics are shown. Not a replacement for the authenticated session.

</td>
<td align="center" width="50%">

**Business Analytics Unlocked**

![Business Analytics Dark](screenshots/Dark_Mode/Phase_04_Analytics_Security_PIN_and_Reports/49_Business_Analytics_Unlocked_Dark.png)

Full analytics dashboard — pipeline trends, service demand, revenue, and conversion metrics.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Reports and Analytics**

![Reports Dark](screenshots/Dark_Mode/Phase_04_Analytics_Security_PIN_and_Reports/50_Reports_and_Analytics_Dark.png)

Available chart and reporting views for pipeline, service demand, system activity, and business analysis.

</td>
<td></td>
</tr>
</table>

---

### 🔔 Phase 5 — Notifications and Navigation

<table>
<tr>
<td align="center" width="50%">

**Notification Center — All Tab**

![Notification Center Dark](screenshots/Dark_Mode/Phase_05_Notifications_and_Navigation/51_Notification_Center_All_Tab_Dark.png)

Active operational reminders — follow-ups, site visits, milestones, and overdue work. Archived/canceled records are excluded.

</td>
<td align="center" width="50%">

**Notification Center — Overdue**

![Notifications Overdue Dark](screenshots/Dark_Mode/Phase_05_Notifications_and_Navigation/54_Notification_Center_Overdue_Tab_Dark.png)

Instantly surfaces all overdue actions needing immediate attention.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Global Search**

![Global Search Dark](screenshots/Dark_Mode/Phase_05_Notifications_and_Navigation/55_Topbar_Global_Search_Results_Dark.png)

Search across leads, customers, projects, and records from the topbar.

</td>
<td align="center" width="50%">

**Canceled Records**

![Canceled Records Dark](screenshots/Dark_Mode/Phase_05_Notifications_and_Navigation/57_Canceled_Records_Leads_Tab_Dark.png)

Preserves closed inquiries separately from active work. Supports reactivation and deletion.

</td>
</tr>
</table>

---

### ⚙️ Phase 6 — System and Settings

<table>
<tr>
<td align="center" width="50%">

**Identity and Profile Settings**

![Settings Identity Dark](screenshots/Dark_Mode/Phase_06_System_and_Settings/59_Settings_Identity_Profile_Dark.png)

User identity, display name, and profile management.

</td>
<td align="center" width="50%">

**System Configuration**

![Settings System Config Dark](screenshots/Dark_Mode/Phase_06_System_and_Settings/60_Settings_System_Config_Dark.png)

Port, tunnel, system-level CRM configuration options.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Theme and Appearance**

![Settings Theme Dark](screenshots/Dark_Mode/Phase_06_System_and_Settings/61_Settings_Theme_and_Appearance_Dark.png)

Light, dark, system, and scheduled theme behavior with time-based switching.

</td>
<td align="center" width="50%">

**Scheduled Theme Clock Picker**

![Theme Clock Dark](screenshots/Dark_Mode/Phase_06_System_and_Settings/62_Settings_Theme_ClockTimePicker_Dark.png)

Set exact times for automatic light/dark mode switching throughout the day.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Advanced Security**

![Settings Security Dark](screenshots/Dark_Mode/Phase_06_System_and_Settings/63_Settings_Advanced_Security_Dark.png)

PIN setup, session management, and security controls.

</td>
<td align="center" width="50%">

**Customer Cleanup**

![Settings Cleanup Dark](screenshots/Dark_Mode/Phase_06_System_and_Settings/67_Settings_Customer_Cleanup_Dark.png)

PIN-protected cleanup workflows for removing stale or test customer data.

</td>
</tr>
<tr>
<td align="center" width="50%">

**Backup and Restore**

![Settings Backup Dark](screenshots/Dark_Mode/Phase_06_System_and_Settings/68_Settings_Backup_and_Restore_Dark.png)

AES-256-GCM encrypted local backups and optional Cloudflare R2 cloud backups.

</td>
<td align="center" width="50%">

**Cloud Restore Modal**

![Cloud Restore Dark](screenshots/Dark_Mode/Phase_06_System_and_Settings/70_Settings_Cloud_Restore_Modal_Dark.png)

Restore from a cloud-stored `.pnpcrm` backup file with confirmation flow.

</td>
</tr>
</table>

---

> **Screenshot maintenance:** Screenshots are documentation assets, not generated during installation. When a page changes, recapture the affected image and keep the existing filename when the page meaning is unchanged. Do not place real customer credentials or sensitive records in new screenshots.

---

## Architecture

```mermaid
flowchart TD
    Browser["Browser or packaged desktop window"]
    Next["Next.js 16 App Router\nReact 19 + TypeScript"]
    Auth["Auth.js / NextAuth credentials sessions"]
    Prisma["Prisma Client"]
    SQLite[("SQLite database\nDATABASE_URL=file:...")]
    Uploads["Local uploads directory"]
    Backups["Encrypted .pnpcrm backups"]
    R2["Optional Cloudflare R2"]
    Mobile["Capacitor Android app"]
    MobileDB[("Mobile SQLite")]
    Sync["POST /api/mobile/sync\nx-mobile-sync-key"]

    Browser --> Next
    Next --> Auth
    Next --> Prisma
    Prisma --> SQLite
    Next --> Uploads
    SQLite --> Backups
    Uploads --> Backups
    Backups -. optional upload .-> R2
    Mobile --> MobileDB
    Mobile --> Sync
    Sync --> Next
```

The source of truth for the desktop database is `prisma/schema.prisma`, whose datasource provider is `sqlite`. Prisma does not connect this project to PostgreSQL.

### Data Locations

Developer mode normally uses the `DATABASE_URL` from `.env` (for example `file:./_data/crm.db`). Packaged mode uses the generated configuration under:

```text
C:\ProgramData\PNP CRM\
├── config\app-config.json
├── data\crm.db
├── uploads\
├── logs\
└── backups\
```

The installed application files are placed under:

```text
C:\Program Files\PNP CRM\
```

The packaged configuration defaults to port **43100** and persists the selected port in `app-config.json`. The developer workflow is not replaced or disabled.

---

## Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| 🌐 Web framework | Next.js `16.2.4` App Router | Desktop/web application and API routes |
| ⚛️ UI runtime | React `19.2.4` | Client interaction and server-rendered UI |
| 🔷 Language | TypeScript | Typed UI, route handlers, and shared utilities |
| 🎨 Styling | Tailwind CSS `4.x` + PostCSS | Responsive design and theme tokens |
| 💾 Database | SQLite | Local relational persistence |
| 🗄️ ORM | Prisma `6.19.3` | Schema, client generation, and database access |
| 🔐 Authentication | Auth.js/NextAuth `5.0.0-beta.31` | Credentials authentication and sessions |
| ✅ Validation | Zod | Request/form validation where used |
| 📊 Charts | Recharts | Dashboard, reports, and analytics charts |
| 🖱️ Interaction | dnd-kit, Framer Motion | Drag/drop and selected UI motion |
| 📄 Documents | jsPDF + jspdf-autotable | Quotation and report PDFs |
| 🖥️ Desktop runtime | Node.js + PowerShell | Developer and Windows launchers |
| 📱 Mobile runtime | Vite + React + Capacitor 7 | Android client |
| 📦 Mobile storage | `@capacitor-community/sqlite` | Offline mobile records |
| ☁️ Optional object storage | AWS SDK S3 against Cloudflare R2 | Off-device backup copy |

---

## Prerequisites

### 🖥️ Desktop Developer Workflow

- Windows PowerShell for the supplied scripts.
- Node.js/npm compatible with the current Next.js 16 project.
- A writable local directory for the SQLite file.
- Git, if cloning the repository.

### 📱 Optional Mobile Workflow

- Android Studio and Android SDK.
- Java/Gradle requirements expected by the Capacitor Android project.
- A reachable CRM URL for remote sync, or local/offline operation for development.

### 📦 Optional Distribution Workflow

- Inno Setup to compile `installer/PNP CRM.iss`.
- A tested Node.js runtime or a verified bundled `node.exe` release payload.
- Administrator rights for installation, ProgramData directories, and Task Scheduler registration.

---

## Developer Installation

This is the existing developer path. The Windows installer is additive and does not require changing this workflow.

```powershell
git clone https://github.com/ManavSurani/PNP_crm.git
Set-Location PNP_crm
npm install
```

Create `.env` in the repository root. Keep secrets private and choose a SQLite path that exists or can be created:

```dotenv
DATABASE_URL="file:./_data/crm.db"
AUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Required only for mobile sync:
MOBILE_SYNC_SECRET="replace-with-a-mobile-sync-secret"

# Optional Cloudflare R2:
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="pnp-crm-backup"
```

Initialize Prisma and the SQLite schema:

```powershell
npx prisma generate
npx prisma db push
```

The repository includes `seed.mjs`, which creates the development Super Admin account and global settings:

```powershell
node seed.mjs
```

Run the development server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The existing `npm run build` command runs `prisma generate`, `prisma db push`, and a webpack production build; review that behavior before using it against a shared database.

---

## Windows Installer Installation

The distribution path is intentionally separate from the developer path:

1. Build or obtain a tested release payload in `packaging/release/`.
2. Compile `installer/PNP CRM.iss` with Inno Setup.
3. Run the generated installer as an administrator.
4. The installer places immutable application files in `C:\Program Files\PNP CRM\`.
5. It creates mutable directories in `C:\ProgramData\PNP CRM\` for configuration, SQLite data, uploads, logs, and backups.
6. `tools/pnp-crm-install-config.ps1` creates `app-config.json` with port `43100` and generates internal auth/backup secrets.
7. The installer attempts to register the daily backup task through `tools/pnp-crm-register-backup.ps1`.
8. The launcher starts the packaged production server and opens the desktop shortcut.

> The installer does not replace a developer `.env`. When no packaged `app-config.json` exists, the existing environment-based behavior remains available. The final installer must still be validated on a clean Windows machine, especially the runtime payload and scheduled task.

---

## First-run /setup Wizard

The route [`/setup`](src/app/setup/page.tsx) is the distribution configuration screen. It reads [`/api/setup/status`](src/app/api/setup/status/route.ts) and saves through [`POST /api/setup`](src/app/api/setup/route.ts).

The wizard can:

- Show whether the ProgramData configuration and SQLite file exist.
- Choose a port, defaulting to `43100`.
- Optionally save Cloudflare R2 account ID, access key ID, secret access key, and bucket name.
- Create the ProgramData directory layout and generated internal secrets through the config adapter.

Setup write access is restricted: it is allowed before any user exists, or for an authenticated administrator after initialization. The rest of the dashboard remains protected by Auth.js. R2 fields are optional; leaving them empty keeps backups local.

After saving a new packaged port, restart the launcher so the server reads the persisted configuration.

---

## Daily Operations

### ▶️ Start the Developer App

```powershell
npm run dev
```

The repository also includes `start-crm.ps1`, `start-crm.bat`, and `launch-pnp.vbs` for the existing local Windows workflow. `start-crm.ps1` prepares `_data\crm.db`, uses port `3000`, and starts a production server when `.next\BUILD_ID` exists; otherwise it can start development mode.

### 🚀 Start the Packaged App

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Program Files\PNP CRM\tools\pnp-crm-launch.ps1"
```

Use `-BackgroundOnly` for a silent start. The script reads the persisted ProgramData port and configuration.

### ⏹️ Stop the Packaged App

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Program Files\PNP CRM\tools\pnp-crm-launch.ps1" -Stop
```

This targets the configured CRM port. Do not terminate unrelated Node.js processes.

### 🔑 Reset an Administrator

```powershell
node "C:\Program Files\PNP CRM\tools\pnp-crm-reset-admin.mjs" `
  --reset-admin `
  --confirm=PNP-CRM-RESET `
  --email=admin@example.com `
  --password="use-a-new-password"
```

The password must be at least eight characters. The command updates the user to `ADMIN` and invalidates that user's sessions. Keep the command and credentials private.

---

## Backup and Restore

### 💾 Local Backup Behavior

`tools/pnp-crm-backup.mjs` is the packaged backup utility. It:

1. Uses SQLite `VACUUM INTO` with a busy timeout to create a consistent snapshot.
2. Adds the snapshot, `app-config.json`, and files under the uploads directory to an archive.
3. Writes an encrypted `.pnpcrm` file under `C:\ProgramData\PNP CRM\backups\`.
4. Uses AES-256-GCM with the configured backup secret.
5. Writes `last-backup.json`.

The legacy `scripts/auto-backup.mjs` and `scripts/run-auto-backup.vbs` remain in the repository for the existing developer/automation workflow. The settings UI also exposes backup and restore routes.

### 🕐 Scheduled Backup

`tools/pnp-crm-register-backup.ps1` registers **PNP CRM Daily Backup** with Windows Task Scheduler. Its settings allow battery execution, do not stop when power changes, and enable missed-run recovery (`StartWhenAvailable`). Registration can be skipped when Node.js is unavailable; verify the task on the target machine.

### ☁️ Optional Cloudflare R2

If R2 credentials are configured in `.env` or the `/setup` wizard, the backup utility uploads `latest.pnpcrm` to the configured bucket. R2 is not required for local backups. Test credentials, permissions, region/endpoint behavior, and restore before relying on off-device recovery.

### 🔄 Restore

The application exposes restore functionality through Settings and [`POST /api/settings/restore`](src/app/api/settings/restore/route.ts). Restore is destructive to the current data set: make and verify a current backup first, stop writes if possible, and follow the confirmation flow. Do not manually replace a live SQLite database while the server is running.

---

## Security and Data Protection

| Control | Description |
|---------|-------------|
| 🗄️ **Local-first SQLite** | No hosted database required; data stays on your machine |
| 🔐 **Auth.js sessions** | Credentials sessions protect all dashboard routes |
| 🔒 **Password hashing** | Passwords are hashed with `bcryptjs` |
| 📌 **Analytics PIN** | Admin-only PIN gate before sensitive analytics |
| 📱 **Mobile sync key** | `x-mobile-sync-key` header matching `MOBILE_SYNC_SECRET` |
| 🛡️ **Security headers** | Clickjacking, MIME-sniffing, referrer, permissions, and HSTS in `next.config.ts` |
| 🔑 **Generated secrets** | Packaged auth, backup, and internal secrets generated into ProgramData |
| 🔒 **AES-256-GCM encryption** | Backups are encrypted before local storage or R2 upload |

> Keep `.env`, `app-config.json`, database files, `.pnpcrm` backups, R2 credentials, and mobile sync keys out of source control and support tickets.

These controls do not remove the need for Windows account security, disk encryption, least-privilege access, secure tunnel configuration, and tested recovery procedures.

---

## Project Structure

```text
PNP_crm/
├── src/
│   ├── app/
│   │   ├── (auth)/login/             # Login and password recovery
│   │   ├── (dashboard)/              # Authenticated CRM pages
│   │   ├── api/                     # Next.js route handlers
│   │   └── setup/                   # Distribution setup wizard
│   ├── components/                  # Layout, analytics, quotation, and UI components
│   ├── hooks/                       # Theme, reduced-motion, count-up, and session hooks
│   └── lib/                         # Auth, Prisma, configuration, RBAC, and utilities
├── prisma/
│   ├── schema.prisma                # SQLite schema
│   └── seed.js                      # Prisma seed implementation
├── mobile/                          # Capacitor/Vite Android application
├── installer/                       # Inno Setup definition
├── packaging/                       # Release payload/build documentation
├── tools/                           # Packaged launcher, backup, setup, and reset tools
├── scripts/                         # Existing backup, icon, notifier, and setup scripts
├── screenshots/                     # Repository screenshots (Dark_Mode / Light_Mode)
│   ├── Dark_Mode/
│   │   ├── Phase_01_Auth_and_Entry/
│   │   ├── Phase_02_Lead_Pipeline/
│   │   ├── Phase_03_Customer_Operations/
│   │   ├── Phase_04_Analytics_Security_PIN_and_Reports/
│   │   ├── Phase_05_Notifications_and_Navigation/
│   │   └── Phase_06_System_and_Settings/
│   └── Light_Mode/
│       └── (mirrored structure)
├── public/                          # Logo, icon, and static assets
├── package.json                     # Root scripts and dependencies
├── next.config.ts                   # Security headers and Next.js configuration
└── LICENSE                          # Proprietary license
```

---

## API Reference

All paths below are relative to the CRM origin, normally `http://localhost:3000` in developer mode or `http://localhost:43100` in packaged mode. Authentication and role requirements are enforced by individual handlers.

### 🔧 Health, Setup, Auth, and Discovery

| Methods | Route | Purpose |
|---------|-------|---------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/setup/status` | Read distribution setup status |
| `POST` | `/api/setup` | Create/update distribution configuration |
| `GET`, `POST` | `/api/auth/[...nextauth]` | Auth.js session handlers |
| `POST` | `/api/auth/reset-password` | Password reset flow |
| `GET` | `/api/search` | Global CRM search |
| `GET` | `/api/stats` | Dashboard metrics |

### 🎯 Leads, Follow-ups, Meetings, and Notifications

| Methods | Route | Purpose |
|---------|-------|---------|
| `GET`, `POST` | `/api/leads` | List and create leads |
| `GET`, `PUT`, `DELETE` | `/api/leads/[id]` | Read, update, or remove a lead |
| `GET` | `/api/leads/check-duplicate` | Check duplicate lead data |
| `POST` | `/api/leads/[id]/archive` | Archive a lead |
| `POST` | `/api/leads/[id]/reactivate` | Reactivate a canceled/archived lead |
| `POST` | `/api/leads/[id]/convert` | Convert a lead to a customer |
| `PATCH` | `/api/leads/[id]/hot` | Toggle hot-lead state |
| `GET`, `POST` | `/api/follow-ups` | Follow-up queue and creation |
| `PATCH`, `DELETE` | `/api/follow-ups/[id]` | Update/delete a follow-up |
| `GET`, `POST` | `/api/meetings` | Site visits and scheduling |
| `PATCH`, `DELETE` | `/api/meetings/[id]` | Update/delete a meeting |
| `POST` | `/api/meetings/[id]/complete` | Complete a site visit |
| `GET` | `/api/notifications` | Notification center data |
| `GET` | `/api/canceled` | Canceled Records |
| `DELETE` | `/api/canceled` | Permanently remove a canceled record |

### 👤 Customers, Projects, Quotations, and Finance

| Methods | Route | Purpose |
|---------|-------|---------|
| `GET` | `/api/customers` | Customer directory |
| `GET` | `/api/customers/completed` | Completed projects |
| `GET` | `/api/projects` | Project data |
| `POST` | `/api/projects/[id]/complete` | Complete a project |
| `GET`, `POST` | `/api/projects/[id]/logs` | Project execution logs |
| `POST` | `/api/projects/[id]/milestones` | Add a project milestone |
| `GET`, `POST` | `/api/milestones` | Milestone data |
| `PATCH`, `DELETE` | `/api/milestones/[id]` | Update/delete a milestone |
| `PATCH` | `/api/milestones/[id]/complete` | Complete a milestone |
| `GET`, `POST`, `PATCH` | `/api/project-quotations` | Project quotations |
| `GET`, `PATCH`, `DELETE` | `/api/project-quotations/[id]` | One project quotation |
| `GET`, `POST` | `/api/project-quotations/[id]/payments` | Quotation payments |
| `GET` | `/api/project-quotations/overview` | Quotation overview |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/transactions` | Financial transactions |
| `PUT`, `DELETE` | `/api/transactions/[id]` | One transaction |
| `GET` | `/api/financials` | Financial summary |
| `GET` | `/api/reports` | Report data |
| `GET` | `/api/reports/export` | Report export |

### 📝 Notes, Requirements, Vendors, and Fields

| Methods | Route | Purpose |
|---------|-------|---------|
| `GET`, `POST` | `/api/notes` | Lead/customer notes |
| `PATCH`, `DELETE` | `/api/notes/[id]` | One note |
| `GET`, `POST` | `/api/fields` | Work Fields catalog |
| `PATCH`, `DELETE` | `/api/fields/[id]` | One work field |
| `GET`, `POST` | `/api/vendors` | Vendor data |
| `PATCH`, `DELETE` | `/api/vendors/[id]` | One vendor |
| `GET`, `POST` | `/api/suppliers` | Supplier data |
| `POST`, `GET` | `/api/leads/[id]/requirement` | Lead requirements |
| `GET` | `/api/leads/[id]/financial-logs` | Lead financial logs |

### ⚙️ Settings, Backup, Mobile, and Tunnel

| Methods | Route | Purpose |
|---------|-------|---------|
| `GET`, `PATCH` | `/api/settings` | System settings |
| `GET`, `POST`, `DELETE` | `/api/settings/schedule` | Backup schedule |
| `GET` | `/api/settings/backup` | Create/download backup behavior |
| `POST` | `/api/settings/restore` | Restore a backup |
| `GET` | `/api/settings/backup-cloud` | Cloud backup status |
| `GET`, `DELETE` | `/api/settings/sessions` | Active sessions |
| `POST` | `/api/analytics/verify-pin` | Verify analytics PIN |
| `GET` | `/api/analytics` | Analytics data |
| `POST` | `/api/mobile/sync` | Authenticated mobile payload sync |
| `GET` | `/api/mobile/sync` | Mobile sync status/handshake |
| `GET`, `POST` | `/api/system/tunnel` | Tunnel status/reconnect behavior |

> Route handlers can add authentication, validation, or business-rule checks beyond the method/route summary above. Treat the source files under `src/app/api/` as authoritative.

---

## Mobile App

The mobile client is in `mobile/` and uses Vite, React, Capacitor 7, and `@capacitor-community/sqlite`.

```powershell
Set-Location mobile
npm install
npm run build
npx cap sync android
npx cap open android
```

The Android project can be built from Android Studio. The repository also contains APK artifacts, but a new build should be produced and tested for the target device.

For sync, configure the same secret on both sides:

```dotenv
# mobile/.env
NEXT_PUBLIC_MOBILE_SYNC_SECRET="same-secret-as-the-server"

# CRM .env
MOBILE_SYNC_SECRET="same-secret-as-the-mobile-app"
```

The mobile app queues local work in SQLite when offline and sends it to `/api/mobile/sync` when connectivity returns. Remote use also requires a reachable CRM URL/tunnel; a local desktop CRM does not automatically become internet-accessible.

---

## Troubleshooting

<details>
<summary><strong>🔴 The app cannot find the database</strong></summary>

Check `DATABASE_URL`, confirm the parent directory is writable, then run:

```powershell
npx prisma generate
npx prisma db push
```

Do not point two unrelated environments at the same live SQLite file while writes are occurring.

</details>

<details>
<summary><strong>🔴 Port 3000 or 43100 is already in use</strong></summary>

Stop the matching CRM process with the supplied launcher or select a different valid port in `/setup`. Do not kill unrelated Node.js services. Packaged mode reads its persisted port from `C:\ProgramData\PNP CRM\config\app-config.json`.

</details>

<details>
<summary><strong>🔴 Auth.js reports an invalid/decryption session</strong></summary>

Ensure `AUTH_SECRET` and `NEXTAUTH_SECRET` are stable and consistent for the environment. Sign out and sign in again after changing secrets; old cookies cannot be decrypted with a different secret.

</details>

<details>
<summary><strong>🔴 /setup is forbidden</strong></summary>

After the first user exists, setup writes require an authenticated `ADMIN` session. The initial setup exception is intentionally closed after initialization.

</details>

<details>
<summary><strong>🔴 Backups do not upload to R2</strong></summary>

Local backup creation does not require R2. Verify the account ID, access key, secret key, bucket name, permissions, and endpoint configuration. Test a local `.pnpcrm` file before diagnosing cloud upload.

</details>

<details>
<summary><strong>🔴 The Windows scheduled task is missing</strong></summary>

Run `tools/pnp-crm-register-backup.ps1` as an administrator and confirm that `node.exe` is discoverable. The script intentionally skips registration when Node.js is unavailable.

</details>

<details>
<summary><strong>🔴 The mobile app does not sync</strong></summary>

Check that the server is running, the mobile URL/tunnel is reachable, `MOBILE_SYNC_SECRET` matches the mobile environment value, and the endpoint is not being blocked by a tunnel or firewall.

</details>

---

## Quality Gates and Release Validation

Before sharing a developer build:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

`npm run build` currently includes Prisma generation, `prisma db push`, and `next build --webpack`; run it only with an intentional database target. Verify the result with `npm start` and [http://localhost:3000/api/health](http://localhost:3000/api/health).

Before a Windows release, additionally verify:

1. ✅ Inno Setup compiles `installer/PNP CRM.iss`.
2. ✅ The release payload contains the required Next.js output, Prisma Windows query engine, static assets, and a tested Node.js runtime.
3. ✅ A clean machine installs into Program Files and creates ProgramData directories.
4. ✅ `/setup` creates configuration and generated secrets.
5. ✅ The desktop shortcut starts and stops only the CRM service.
6. ✅ Port 43100 (or a saved custom port) is reachable locally.
7. ✅ The scheduled task is registered and survives battery/sleep scenarios.
8. ✅ SQLite `VACUUM INTO` backup and restore work with representative uploads.
9. ✅ Optional R2 upload and restore work with real credentials.
10. ✅ Mobile sync works through the intended local/tunnel network.

---

## Roadmap and Known Limitations

- [ ] Finish repeatable clean-Windows installer testing and document the supported Node.js/runtime payload.
- [ ] Verify Inno Setup compiler output and release artifact checksums.
- [ ] Test Task Scheduler registration under the intended Windows account and sleep/wake policies.
- [ ] Test encrypted backup restore, uploads, and optional R2 against a real isolated bucket.
- [ ] Test the mobile app on supported Android versions and network conditions.
- [ ] Continue improving operational observability for packaged logs and recovery.
- [ ] Consider formal release automation after the packaging path is validated.

> These are release-validation items, not claims that the current repository lacks the corresponding source files.

---

## Contributing Boundaries

This is a private CRM with business-specific workflows. Before changing code:

- Preserve the SQLite/Prisma data model and existing `.env`/npm developer workflow.
- Do not silently migrate the project to PostgreSQL or another hosted database.
- Keep installer/distribution changes isolated to `installer/`, `packaging/`, `tools/`, and explicitly related configuration.
- Keep mobile-only changes under `mobile/`.
- Do not commit secrets, customer data, SQLite databases, backup archives, or generated credentials.
- Run the relevant type, lint, build, and environment checks before proposing a release.

---

## License and Confidentiality

This repository is **proprietary software**. The root [`LICENSE`](LICENSE) reserves all rights to PNP CRM. Do not copy, modify, publish, distribute, sublicense, sell, or disclose the source code or business data without written permission from the owner.

Customer records, credentials, `.env` files, ProgramData configuration, R2 keys, mobile sync keys, and backup files are confidential and must be handled as private operational data.

---

<div align="center">

Made with ❤️ for interior design and construction teams.

</div>
