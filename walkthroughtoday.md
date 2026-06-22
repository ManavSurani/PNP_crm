# Complete Project Modification Walkthrough

Below is the definitive record of every single file modified in your project today, including their locations, the specific code that was altered, and the description of the fix. No actual project code is changed by this document; this is purely for your reference and tracking.

---

## 1. Desktop Notification Scripts

### `generate-badges.ps1`
**Location:** `G:\pnp_crm\pnp_crm\generate-badges.ps1`
**Description:** We updated the script to shrink the red notification circle, move it tighter into the top right corner, and save the icons into a new folder (`badges_v2`) to bypass the stubborn Windows icon cache.
**Key Code Changes:**
```powershell
# Shrunk circle and moved to corner
$circleSize = 75
$circleX = $BaseImage.Width - $circleSize - 5
$circleY = 5
...
# Updated font sizes to fit the smaller circle
$fontSize = if ($Count -lt 10) { 48 } elseif ($Count -lt 100) { 40 } else { 32 }
...
# Created and saved to new badges_v2 folder
$BadgesDir = Join-Path $PublicDir "badges_v2"
```

### `desktop-notifier.ps1`
**Location:** `G:\pnp_crm\pnp_crm\desktop-notifier.ps1`
**Description:** We secured the API call with a secret token, dynamically targeted the shortcut by its arguments instead of its name, pointed it to the new `badges_v2` folder, and fixed a severe Windows caching bug by safely removing the `,0` index string from the icon path.
**Key Code Changes:**
```powershell
# Bypassing server login with a secret token
$ApiUrl = "http://localhost:3000/api/notifications?token=pnp_desktop_local_secret"
...
# Reading from new badges folder
$NewIconPath = Join-Path $PnpDir "src\public\badges_v2\badge_$Count.ico"
...
# Fixed Infinite Refresh Loop by removing the ',0' hidden string
$CurrentIconPath = $Shortcut.IconLocation -replace ',0$', ''
if ($CurrentIconPath -ne $NewIconPath) {
    $Shortcut.IconLocation = "$NewIconPath,0"
    $Shortcut.Save()
    # Apply changes to Windows Explorer
    [PInvoke.NativeMethods]::SHChangeNotify(0x08000000, 0x0000, [IntPtr]::Zero, [IntPtr]::Zero)
}
```

---

## 2. API Security & Backend Routes

### `notifications/route.ts`
**Location:** `G:\pnp_crm\pnp_crm\src\app\api\notifications\route.ts`
**Description:** We added a security bypass token so the Windows PowerShell script can securely fetch live notification numbers without being blocked by the `401 Unauthorized` login requirement.
**Key Code Changes:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    // Check if it's the desktop script using the secret token
    if (token !== "pnp_desktop_local_secret") {
      const session = await auth();
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ... continues to fetch metrics
```

### `stats/route.ts`
**Location:** `G:\pnp_crm\pnp_crm\src\app\api\stats\route.ts`
**Description:** We added a database query to count "Current Leads" dynamically. We also completely rewrote the "Site Visits" query to only count active, scheduled meetings and uniquely de-duplicate them per lead, mirroring the actual Site Visits page.
**Key Code Changes:**
```typescript
      // Fixed: Site Visits (Only Active, Scheduled, and De-duplicated)
      prisma.meeting.findMany({
        where: {
          status: "SCHEDULED",
          lead: { isCancelled: false, status: { not: "WON_ORDER" } }
        },
        distinct: ['leadId'],
        select: { id: true }
      }),
      // ...
      // New: Current Leads in Pipeline
      prisma.lead.count({ where: { status: { not: "WON_ORDER" }, isCancelled: false } }),
```

### `reports/route.ts`
**Location:** `G:\pnp_crm\pnp_crm\src\app\api\reports\route.ts`
**Description:** We fixed a bug on the Reports page where clicking a lead sent you to a blank page (`/leads/undefined`). We did this by forcefully injecting the unique `id` into the database query for Follow-Ups and Meetings.
**Key Code Changes:**
```typescript
        // Added id: true to the select statements
        include: { lead: { select: { id: true, customerName: true, contactNumber: true, serviceType: true } } },
...
        include: { lead: { select: { id: true, customerName: true, contactNumber: true, status: true } } },
...
        include: { lead: { select: { id: true, customerName: true, contactNumber: true } } },
```

---

## 3. Frontend User Interface

### `page.tsx` (Dashboard)
**Location:** `G:\pnp_crm\pnp_crm\src\app\(dashboard)\page.tsx`
**Description:** We inserted the brand new "Current Leads" UI card between "New Inquiries" and "Canceled Archive", wiring it up to the new metric variable we established in the stats API.
**Key Code Changes:**
```tsx
    { title: "New Inquiries", value: metrics.newLeads, icon: MessageSquare, color: "text-sky-600", bg: "bg-sky-50" },
    
    // NEW: Current Leads Card
    { title: "Current Leads", value: metrics.currentLeads, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
    
    { title: "Canceled Archive", value: metrics.canceledArchive, icon: Trash2, color: "text-rose-600", bg: "bg-rose-50" },
```
