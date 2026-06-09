# PNP CRM

A modern, full-stack Customer Relationship Management (CRM) application built to seamlessly manage leads, projects, meetings, and customer interactions.

## 🚀 Tech Stack

This project is built with a cutting-edge web development stack:

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js v5](https://next-auth.js.org/) (Auth.js)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts & Data Visualization:** [Recharts](https://recharts.org/)
- **Drag & Drop (Kanban):** [dnd-kit](https://dndkit.com/)
- **Document Export:** [jsPDF](https://github.com/parallax/jsPDF)

## ✨ Core Features

- **Authentication & Security:** Secure user login and role-based access control using NextAuth.js.
- **Lead Management:** Track and convert prospective leads efficiently.
- **Project Tracking:** Manage active projects and track detailed project logs.
- **Meetings & Scheduling:** Schedule and view upcoming meetings.
- **Interactive Dashboards:** Visual data representations using Recharts.
- **Kanban Boards:** Drag-and-drop interfaces for lead and project pipelines using dnd-kit.
- **Data Export:** Generate and download PDF reports on the fly.
- **Rate Limiting:** Built-in API rate limiting to ensure platform stability and security.

## 🛠️ Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- Node.js (v20 or higher recommended)
- A relational database (e.g., PostgreSQL or MySQL) depending on your Prisma configuration

### Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd pnp_crm
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add the necessary environment variables. Example variables might include:
   ```env
   DATABASE_URL="your-database-connection-string"
   AUTH_SECRET="your-nextauth-secret"
   # Add Google Maps API keys or other necessary secrets here
   ```

4. **Database Setup:**
   Push the Prisma schema to your database and generate the Prisma Client:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server:**
   Start the application with Turbopack enabled for faster compilation:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- `/src/app/` - Next.js App Router pages (e.g., `(auth)`, `(dashboard)`, `api`)
- `/src/app/api/` - Backend API routes (Leads, Meetings, Projects)
- `/src/components/` - Reusable React components
- `/src/lib/` - Utility functions (e.g., Prisma client, rate limiting logic)
- `/prisma/` - Database schema and migration files

## 📜 License

This project is proprietary and confidential. All rights reserved.
