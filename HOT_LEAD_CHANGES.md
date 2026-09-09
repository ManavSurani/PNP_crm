# Hot Lead (⭐) Feature — Complete Code & File Reference

This document lists every file modified or created for the **Hot Lead** feature, including its exact location and copy-paste ready code with highlighted changes.

---

## Table of Contents

1. [Database Schema: `prisma/schema.prisma`](#1-database-schema-prismaschemaprisma)
2. [API Route (New): `src/app/api/leads/[id]/hot/route.ts`](#2-api-route-new-srcappapileadsidhotroutets)
3. [API Route: `src/app/api/leads/route.ts`](#3-api-route-srcappapileadsroutets)
4. [API Route: `src/app/api/leads/[id]/route.ts`](#4-api-route-srcappapileadsidroutets)
5. [Lead Detail Page: `src/app/(dashboard)/leads/[id]/page.tsx`](#5-lead-detail-page-srcappdashboardleadsidpagetsx)
6. [Lead Pipeline Page: `src/app/(dashboard)/leads/page.tsx`](#6-lead-pipeline-page-srcappdashboardleadspagetsx)
7. [Environment & Launcher Configuration](#7-environment--launcher-configuration)
8. [Database Sync Commands](#8-database-sync-commands)

---

## 1. Database Schema: `prisma/schema.prisma`

**File Location:** `prisma/schema.prisma`

### Change Description:
Add the `isHotLead` boolean field to the `Lead` model.

### Code Snippet:
```prisma
model Lead {
  id                  String             @id @default(uuid())
  customerName        String
  contactNumber       String
  normalizedPhone     String?
  alternateNumber     String?
  fullAddress         String?
  inquirySource       String             @default("OTHER")
  referenceName       String?
  serviceType         String             @default("OTHER")
  priority            String             @default("MEDIUM")
  status              String             @default("NEW_INQUIRY")
  assignedStaffId     String?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  budgetRange         String?
  requirementDetails  String?
  siteLocation        String?
  landmark            String?
  preferredVisitTime  String?
  isCancelled         Boolean            @default(false)
  isHotLead           Boolean            @default(false)   // <--- ADD THIS LINE
  cancelReason        String?
  isFinanciallyClosed Boolean            @default(false)
  isProjectCompleted  Boolean            @default(false)
  // ... rest of the model
}
```

---

## 2. API Route (New): `src/app/api/leads/[id]/hot/route.ts`

**File Location:** `src/app/api/leads/[id]/hot/route.ts`

### Change Description:
**NEW FILE**: Creates a dedicated lightweight `PATCH` endpoint to toggle `isHotLead` on a specific lead.

### Complete File Code:
```typescript
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { isHotLead } = await request.json();

    const updated = await (prisma.lead as any).update({
      where: { id },
      data: { isHotLead: Boolean(isHotLead) },
      select: { id: true, isHotLead: true },
    });

    return NextResponse.json({ isHotLead: updated.isHotLead });
  } catch (error) {
    console.error("[LEAD_HOT_PATCH]", error);
    return NextResponse.json({ error: "Failed to update hot lead status" }, { status: 500 });
  }
}
```

---

## 3. API Route: `src/app/api/leads/route.ts`

**File Location:** `src/app/api/leads/route.ts`

### Change Description:
Add `isHotLead: true` to the `select` projection of the `GET` query so the pipeline receives the hot lead flag.

### Code Snippet:
```typescript
// Inside export async function GET(request: Request)
const leads = await (prisma.lead as any).findMany({
  where: {
    ...(status ? { status: status as any } : {}),
    isCancelled: false
  },
  orderBy: { createdAt: "desc" },
  select: {
    id: true,
    customerName: true,
    contactNumber: true,
    alternateNumber: true,
    fullAddress: true,
    inquirySource: true,
    referenceName: true,
    serviceType: true,
    priority: true,
    status: true,
    isHotLead: true, // <--- ADD THIS LINE
    assignedStaffId: true,
    createdAt: true,
    updatedAt: true,
    assignedStaff: {
      select: { id: true, name: true }
    },
    followUps: {
      orderBy: { createdAt: "desc" },
      take: 1
    }
  }
});
```

---

## 4. API Route: `src/app/api/leads/[id]/route.ts`

**File Location:** `src/app/api/leads/[id]/route.ts`

### Change 1: In `GET` handler, add `isHotLead: true` to `select` projection:
```typescript
// Inside export async function GET:
const lead = await prisma.lead.findUnique({
  where: { id },
  select: {
    id: true,
    customerName: true,
    // ...
    isCancelled: true,
    cancelReason: true,
    isFinanciallyClosed: true,
    isProjectCompleted: true,
    isHotLead: true, // <--- ADD THIS LINE
  }
});
```

### Change 2: In `PUT` handler, destructure and update `isHotLead`:
```typescript
// Inside export async function PUT:
const { 
  customerName, projectName, contactNumber, alternateNumber, fullAddress, 
  landmark, requirementDetails, inquirySource, referenceName, serviceType, 
  status, priority, assignedStaffId, budgetRange,
  siteLocation, preferredVisitTime, initialDealAmount, initialDealNotes, isCancelled, cancelReason,
  isHotLead // <--- ADD THIS LINE
} = body;

const updateData: any = {};
// ... other fields
if (budgetRange !== undefined) updateData.budgetRange = budgetRange;
if (isHotLead !== undefined) updateData.isHotLead = Boolean(isHotLead); // <--- ADD THIS LINE
```

---

## 5. Lead Detail Page: `src/app/(dashboard)/leads/[id]/page.tsx`

**File Location:** `src/app/(dashboard)/leads/[id]/page.tsx`

### Change 1: Import `Star` from `lucide-react`
```typescript
import {
  Phone, MapPin, FileText, Clock, Zap, Loader2, Pencil, X, CheckCircle2,
  PhoneMissed, Calendar, Check, RotateCcw, Ban, AlertTriangle, ListTodo, Activity, Trash2,
  Banknote, MessageSquare, ChevronRight, ArrowLeft, Globe, User, Star // <--- ADD Star
} from "lucide-react";
```

### Change 2: Add `isHotLead` to `LeadDetails` type
```typescript
type LeadDetails = {
  id: string; customerName: string; contactNumber: string; alternateNumber: string | null;
  fullAddress: string | null; inquirySource: string; referenceName?: string | null; serviceType: string;
  status: string; isCancelled: boolean; cancelReason: string | null; 
  isHotLead: boolean; // <--- ADD THIS LINE
  createdAt: string; budgetRange: string | null; requirementDetails: string | null;
  siteLocation: string | null; landmark: string | null; preferredVisitTime: string | null;
  assignedStaff?: { id: string; name: string } | null;
  followUps: FollowUp[]; meetings: Meeting[];
  leadNotes: LeadNote[]; transactions: LeadTransaction[];
};
```

### Change 3: Add `handleToggleHotLead` function inside the component
```typescript
const handleToggleHotLead = async () => {
  if (!lead) return;
  const newVal = !lead.isHotLead;
  // Optimistic UI update for instant feedback
  setLead(prev => prev ? { ...prev, isHotLead: newVal } : prev);
  try {
    await fetch(`/api/leads/${id}/hot`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHotLead: newVal }),
    });
  } catch {
    // Revert if API fails
    setLead(prev => prev ? { ...prev, isHotLead: !newVal } : prev);
  }
};
```

### Change 4: Add star badge overlapping the bottom-right of avatar letter
Replace the avatar container:
```tsx
{/* Header Avatar Container */}
<div className="relative h-16 w-16 shrink-0">
  <div className="h-16 w-16 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
    <span className="text-2xl font-bold text-slate-800 uppercase">{lead.customerName ? lead.customerName.charAt(0) : "?"}</span>
  </div>
  {lead.isHotLead && (
    <span className="absolute -bottom-1.5 -right-1.5 bg-amber-400 rounded-full p-1 shadow-sm border-2 border-white">
      <Star className="h-3 w-3 text-white fill-white" />
    </span>
  )}
</div>
```

### Change 5: Add Star toggle button next to WhatsApp button
Inside the header actions section (right next to the WhatsApp button):
```tsx
{/* WhatsApp Button */}
<button
  onClick={() => {
    window.open(`https://wa.me/${lead.contactNumber.replace(/\D/g, "")}`, "_blank");
  }}
  className="h-9 w-9 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-md shadow-emerald-100 border border-emerald-200 group"
  title="WhatsApp Message"
>
  {/* WhatsApp SVG */}
</button>

{/* Hot Lead Toggle Button (NEW) */}
<button
  onClick={handleToggleHotLead}
  title={lead.isHotLead ? "Remove Hot Lead" : "Mark as Hot Lead"}
  className={cn(
    "h-9 w-9 rounded-xl flex items-center justify-center transition-all active:scale-90 border",
    lead.isHotLead
      ? "bg-amber-400 text-white border-amber-300 shadow-md shadow-amber-100"
      : "bg-white text-slate-400 border-slate-200 hover:border-amber-300 hover:text-amber-400"
  )}
>
  <Star className={cn("h-5 w-5", lead.isHotLead ? "fill-white" : "")} />
</button>
```

---

## 6. Lead Pipeline Page: `src/app/(dashboard)/leads/page.tsx`

**File Location:** `src/app/(dashboard)/leads/page.tsx`

### Change 1: Import `Star` from `lucide-react`
```typescript
import { 
  Plus, Search, MoreHorizontal, User, Phone, MapPin, Loader2, 
  Filter, ArrowUpDown, ChevronRight, Activity, Zap, X, CheckCircle2, Check,
  Trash2, Pencil, ExternalLink, AlertTriangle, RotateCcw, ArrowLeft, Star // <--- ADD Star
} from "lucide-react";
```

### Change 2: Add `isHotLead` to `Lead` type
```typescript
type Lead = {
  id: string;
  customerName: string;
  contactNumber: string;
  alternateNumber: string | null;
  fullAddress: string | null;
  inquirySource: string;
  referenceName?: string | null;
  serviceType: string;
  status: string;
  isHotLead: boolean; // <--- ADD THIS LINE
  createdAt: string;
  assignedStaff?: { name: string } | null;
};
```

### Change 3: Update `filteredLeads` for Status Filter & Sorting
```typescript
const filteredLeads = leads.filter((lead) => {
  const matchesSearch = 
    lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contactNumber.includes(searchTerm) ||
    lead.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
  
  // SUPPORT HOT_LEAD FILTER OPTION
  const matchesStatus = 
    filters.status === "HOT_LEAD" ? lead.isHotLead :
    filters.status === "ALL" ? (lead.status !== "WON_ORDER" && lead.status !== "CANCELLED") :
    lead.status === filters.status;

  const matchesSource = filters.source === "ALL" || lead.inquirySource === filters.source;
  const matchesService = filters.service === "ALL" || lead.serviceType?.toLowerCase().replace(/_/g, " ") === filters.service.toLowerCase().replace(/_/g, " ");

  return matchesSearch && matchesStatus && matchesSource && matchesService;
}).sort((a, b) => {
  if (sortBy === "NEWEST") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  if (sortBy === "OLDEST") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (sortBy === "A-Z") return a.customerName.localeCompare(b.customerName);
  if (sortBy === "Z-A") return b.customerName.localeCompare(a.customerName);
  if (sortBy === "STATUS") {
    // HOT LEADS ALWAYS APPEAR FIRST AT THE TOP
    if (a.isHotLead !== b.isHotLead) return a.isHotLead ? -1 : 1;

    const priority: Record<string, number> = {
      "NEW_INQUIRY": 1,
      "FOLLOW_UP": 2,
      "MEETING_SCHEDULED": 3,
      "WON_ORDER": 4,
      "CANCELLED": 5
    };
    const prioA = priority[a.status] || 99;
    const prioB = priority[b.status] || 99;
    if (prioA !== prioB) return prioA - prioB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
  return 0;
});
```

### Change 4: Add `⭐ Hot Lead` option in Filters Status Dropdown
```tsx
<select 
  className="w-full rounded-lg border border-slate-100 bg-slate-50/50 py-1.5 px-3 text-xs focus:bg-white focus:border-primary outline-none transition-all cursor-pointer"
  value={filters.status}
  onChange={e => setFilters({...filters, status: e.target.value})}
>
  <option value="ALL">Active Only</option>
  <option value="HOT_LEAD">⭐ Hot Lead</option> {/* <--- ADD THIS OPTION */}
  <option value="NEW_INQUIRY">New Inquiry</option>
  <option value="FOLLOW_UP">Follow Up</option>
  <option value="MEETING_SCHEDULED">Visit Scheduled</option>
</select>
```

### Change 5: Add star badge overlapping the bottom-right of avatar letter in table rows
Inside `filteredLeads.map((lead) => (`:
```tsx
<td 
  onClick={() => router.push(`/leads/${lead.id}`)} 
  className="whitespace-nowrap py-4 pl-0 pr-3"
>
  <div className="flex items-center h-full">
    <div className={cn("w-1 self-stretch shrink-0", getStatusBorder(lead.status).replace('border-l-', 'bg-'))} />
    <div className="flex items-center pl-7">
      {/* Avatar with overlapping Star badge */}
      <div className="relative h-10 w-10 flex-shrink-0">
        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-semibold border border-slate-200">
          {lead.customerName ? lead.customerName.charAt(0) : "?"}
        </div>
        {lead.isHotLead && (
          <span className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-0.5 border border-white shadow-sm">
            <Star className="h-2.5 w-2.5 text-white fill-white" />
          </span>
        )}
      </div>
      <div className="ml-4">
        {/* Customer name & info */}
      </div>
    </div>
  </div>
</td>
```

---

## 7. Environment & Launcher Configuration

### `.env` File:
Add `AUTH_TRUST_HOST="true"` so localhost is always trusted:
```env
DATABASE_URL="file:../_data/crm.db"
AUTH_SECRET="pnp_crm_secure_secret_789234123"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
```

### `start-crm.ps1` Launcher (line ~98 and ~102):
Ensure `call` is prefixed when running `.cmd` batch commands to prevent `cmd.exe` from exiting early:
```powershell
if (Test-Path (Join-Path $AppRoot ".next\BUILD_ID")) {
    Write-Host "Starting in PRODUCTION mode (Fast)..." -ForegroundColor Green
    "Production mode detected (Valid build found)." | Out-File $LogFile -Append
    $NextCommand = "call `"$NextCmd`" start -p $Port"
} else {
    Write-Host "Starting in DEVELOPMENT mode (Slow)..." -ForegroundColor Yellow
    "Development mode active (No valid production build found)." | Out-File $LogFile -Append
    $NextCommand = "call `"$NextCmd`" dev --turbopack -p $Port"
}
```

---

## 8. Database Sync Commands

After making schema edits, run:
```bash
# Push schema changes to the SQLite database
npx prisma db push

# Generate updated Prisma client
npx prisma generate

# Rebuild the production Next.js application
npx next build
```
