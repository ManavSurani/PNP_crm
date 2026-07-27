# Full Mobile CRM Audit & Implementation Plan
## Desktop CRM Parity — Lead, Customer, Visit & Follow-Up Flows

---

## 🐛 Bug #1 — Quick Visit Navigation (AddLead.tsx)

### Problem
When user taps **Quick Visit** in Capture New Lead form, it navigates to the `add-visit` screen (which is the Schedule Site Visit form). This is correct by code, **but the user experiences it as going straight to a visit detail page** because:
- The `AddVisit` form renders with the lead already pre-selected (via `selectedLeadId`)
- After saving, `AddVisit` calls `goBack()` which returns to `add-lead` (the form they just came from)
- The correct desktop behavior is: Quick Visit creates the lead → immediately opens the **Lead Detail page** (so user can see the full profile and take further actions from there)

### Fix
Change `handleQuickVisit` in `AddLead.tsx` to:
1. Save the lead
2. Set `selectedLeadId` to the new lead's ID
3. Navigate to **`lead-detail`** (not `add-visit`)

This matches the **exact desktop behavior**: *"creates the lead AND immediately redirects the user to the lead's detail page"* — from which they can press "Schedule Site Visit" in the Action Center.

---

## 🔒 ABSOLUTE STRICT RULES (Carry Over from Previous Plan)

> [!CAUTION]
> **RULE 1 — ZERO DUMMY/MOCK DATA:** No hardcoded names (Rajesh Patel, Priya Shah, Vastrapur, Bodakdev, demo-1), no fallback arrays, no placeholder records. All pages must show empty state when DB is empty.

> [!CAUTION]
> **RULE 2 — ZERO HARDCODED COUNTS:** Notification badge must always reflect real SQLite records only.

> [!IMPORTANT]
> **RULE 3 — STATUS VALUES MUST MATCH DESKTOP EXACTLY:**
> - `NEW_INQUIRY`, `FOLLOW_UP`, `MEETING_SCHEDULED`, `WON_ORDER`, `CANCELLED` only.
> - Never use `VISIT_BOOKED`, `WON`, `LOST`, `INTERESTED`, `ACTIVE` in any status field.

> [!IMPORTANT]
> **RULE 4 — SOURCE VALUES MUST MATCH DESKTOP EXACTLY:**
> `WHATSAPP`, `FACEBOOK`, `INSTAGRAM`, `WEBSITE`, `DIRECT_CALL`, `WALK_IN`, `THROUGH_REFERENCE`

> [!IMPORTANT]
> **RULE 5 — SERVICE VALUES MUST MATCH DESKTOP EXACTLY:**
> `Interior Design`, `2BHK Interior`, `3BHK Interior`, `4BHK Interior`, `Raw house`, `Office`, `Other`

> [!CAUTION]
> **RULE 6 — NO BOTTOMNAV ON SUB-SCREENS:** All detail, form, and modal screens must use `<MobileLayout hideBottomNav>`.

---

## 🔍 Full Gap Analysis: Mobile vs Desktop

### GAP 1 — `AddLead.tsx` (Capture New Lead)

| Feature | Desktop | Mobile (Current) | Fix? |
|---|---|---|---|
| Quick Visit button behavior | Creates lead → opens **Lead Detail page** | Creates lead → opens **Add Visit form** | ✅ Fix |
| Service Required default | `Interior Design` (pre-selected, no --Select--) | `--Select--` (already fixed) | ✅ Already done |
| Form validation on service | Service has a fallback to `Interior Design` if empty | ✅ Already done | — |

---

### GAP 2 — `LeadPipeline.tsx` (Lead List)

| Feature | Desktop | Mobile (Current) | Fix? |
|---|---|---|---|
| Sort options | 5 sorts (Newest, Oldest, Pipeline, A-Z, Z-A) | None | ✅ Add sort dropdown |
| Source filter | Full source filter | None | ✅ Add |
| Service filter | Full service filter | None | ✅ Add |
| Archive lead from list | Yes — 3-dot menu | Not present | ✅ Add 3-dot menu with Archive |
| Delete lead from list | Yes — hard delete | Not present | ✅ Add to 3-dot menu |
| Edit lead from list | Yes — 3-dot menu | Not present | ✅ Add to 3-dot menu (opens LeadDetail edit modal) |

---

### GAP 3 — `LeadDetail.tsx` (Lead Detail Page)

| Feature | Desktop | Mobile (Current) | Fix? |
|---|---|---|---|
| All 7 Modals | ✅ All implemented | ✅ All implemented | — |
| Activity Timeline | ✅ Full (notes only) | ✅ Notes timeline | Enhance — also show visits |
| Visit items in timeline | Shows visits as timeline items | Only shows notes | ✅ Add visits to timeline |
| Follow-up items in timeline | Shows follow-ups in timeline | Only shows notes | ✅ Add follow-ups to timeline |
| Complete Site Visit modal | When visit is pending, user can mark it complete | Not present | ✅ Add "Complete Visit" button on pending visits in timeline |
| Customer link after Convert | After converting, navigates to Customer Detail | Just shows toast | ✅ Add navigate to customer-detail after convert |
| Call attempts card | Shows last 3 call attempts (partial) | ✅ Implemented | — |

---

### GAP 4 — `CustomerDetail.tsx` (Customer Detail Page)

| Feature | Desktop | Mobile (Current) | Fix? |
|---|---|---|---|
| Demo data fallback in catch block | N/A | Hardcoded `Rajesh Patel` fallback | ✅ Remove — show empty state |
| SERVICE_LABELS mapping | Desktop service values | Old service codes (`INTERIOR`, `EXTERIOR`) | ✅ Fix to map desktop values |
| Follow-up lookup | By `leadId` | By `leadContactNumber` (fragile) | ✅ Fix to use `leadMobileId` |
| Visit history shown | Yes | Partial | ✅ Verify/fix |

---

### GAP 5 — `FollowUps.tsx` (Follow-Up Queue)

| Feature | Desktop | Mobile (Current) | Fix? |
|---|---|---|---|
| Tap row → opens Lead Detail | Yes | Yes | — |
| Customer name display | Yes | ✅ Fixed in Phase 5 | — |
| Attempt count | Yes | ✅ Fixed in Phase 5 | — |
| Sort options (4) | Nearest First, Furthest First, A-Z, Z-A | None | ✅ Add sort |
| Date range filter | From/To date range | None | ✅ Add |
| Overdue count badge | Header counter card | None | ✅ Add |
| Today count badge | Header counter card | None | ✅ Add |
| Upcoming count badge | Header counter card | None | ✅ Add |

---

### GAP 6 — `Visits.tsx` (Site Visits)

| Feature | Desktop | Mobile (Current) | Fix? |
|---|---|---|---|
| Google Maps "Launch Navigation" link | Yes | Not present | ✅ Add |
| Today/Overdue/Upcoming header counter cards | Yes | None | ✅ Add |
| Overdue badge on cards | "Missed Visit" badge | None | ✅ Add |
| Active Today badge | "Active Today" badge | None | ✅ Add |
| "Mark Complete" action on visit | From visit detail | Check VisitDetail | ✅ Verify |

---

### GAP 7 — `VisitDetail.tsx` (Visit Detail)

| Feature | Desktop (via timeline) | Mobile (Current) | Fix? |
|---|---|---|---|
| Mark visit as completed | Yes — complete modal with outcome | Needs verification | ✅ Verify/fix |
| Google Maps link | Yes | Needs check | ✅ Add if missing |
| Complete Visit modal (outcomes) | 5 outcomes: Want Recall, Reschedule, No Answer, Not Interested, Convert | Not present | ✅ Add |

---

### GAP 8 — `Notifications.tsx`

| Feature | Desktop | Mobile (Current) | Fix? |
|---|---|---|---|
| Notification taps → opens Lead Detail | Yes | Goes to FollowUps/Visits screen | ✅ Fix — tap should open lead detail directly |
| Customer name in title | Yes | ✅ Fixed in Phase 5 | — |
| Lead name link | Yes | Missing | ✅ Add navigate to lead detail on tap |

---

## 📁 Proposed Changes

### Fix 1 — `mobile/src/pages/AddLead.tsx`
**[MODIFY]** Change `handleQuickVisit` to navigate to `'lead-detail'` instead of `'add-visit'`

```
setSelectedLeadId(newLead.mobileId);
navigate('lead-detail');  // was: 'add-visit'
```

---

### Fix 2 — `mobile/src/pages/LeadPipeline.tsx`
**[MODIFY]** Add:
- Sort dropdown (Newest First, Oldest First, A-Z, Z-A, Pipeline Order)
- Source filter chip bar
- Service filter chip bar
- 3-dot menu on lead cards (Archive, Delete, Edit)
- Archive/Delete confirm modals

---

### Fix 3 — `mobile/src/pages/LeadDetail.tsx`
**[MODIFY]** Add:
- Visits shown in the Activity Timeline tab (with address, date, status)
- Follow-ups also shown in the Activity Timeline tab
- "Complete Visit" action button on SCHEDULED visits in the timeline
- Complete Visit bottom sheet modal (5 outcome options)
- After "Convert to Customer" → navigate to `customer-detail` with the new customer's ID

---

### Fix 4 — `mobile/src/pages/CustomerDetail.tsx`
**[MODIFY]**:
- Remove `Rajesh Patel` demo data in catch block → show empty state
- Fix `SERVICE_LABELS` to map desktop service values correctly (not old codes)
- Fix follow-up association to use `leadMobileId` where possible

---

### Fix 5 — `mobile/src/pages/FollowUps.tsx`
**[MODIFY]** Add:
- 3 counter header cards (Today count, Overdue count, Upcoming count) — clickable to filter
- Sort dropdown (Nearest First, Furthest First, A-Z, Z-A)
- Date range inputs (From Date, To Date)

---

### Fix 6 — `mobile/src/pages/Visits.tsx`
**[MODIFY]** Add:
- 3 counter header cards (Today, Overdue, Upcoming)
- "Active Today" badge on today's visit cards
- "Missed Visit" badge on overdue visit cards
- Google Maps launch link on each visit card

---

### Fix 7 — `mobile/src/pages/VisitDetail.tsx`
**[MODIFY]** Add:
- "Mark Complete" button that opens a Complete Visit modal
- Complete Visit modal with 5 outcome options:
  1. Want Recall → date + time pickers
  2. Reschedule Visit → date + time pickers (marks old as COMPLETE, creates new)
  3. No Answer → just marks complete
  4. Not Interested → cancel reason dropdown, cancels lead
  5. Convert to Customer → confirms and converts
- Google Maps link on address

---

### Fix 8 — `mobile/src/pages/Notifications.tsx`
**[MODIFY]**:
- Tapping an overdue follow-up notification → navigates to `lead-detail` for that lead
- Tapping a today's visit notification → navigates to `lead-detail` for that lead

---

### Fix 9 — `mobile/src/db/sqlite.ts`
**[MODIFY]** Add helper:
- `getLeadByContactNumber(phone: string): Promise<LocalLead | null>` — used by CustomerDetail to look up original lead

---

## ✅ Verification Plan

1. **TypeScript check:** `npx tsc --noEmit` (must show 0 errors)
2. **Vite build:** `npm run build` (must succeed)
3. **Capacitor sync:** `npx cap sync android`
4. **Gradle APK:** `gradlew.bat assembleDebug` → `PNP_CRM_Mobile_v5_Final.apk`

## 📋 Execution Order

1. Fix 1 — AddLead Quick Visit (10 min, 1-line change)
2. Fix 4 — CustomerDetail bugs (15 min, cleanup)
3. Fix 8 — Notifications tap navigation (15 min)
4. Fix 3 — LeadDetail timeline (visits + follow-ups) + Complete Visit modal + Convert navigation (60 min)
5. Fix 7 — VisitDetail Complete Visit modal + Maps link (45 min)
6. Fix 5 — FollowUps header cards + sort + date range (30 min)
7. Fix 6 — Visits header cards + badges + Maps link (30 min)
8. Fix 9 — SQLite helper (10 min)
9. Fix 2 — LeadPipeline sort + filters + 3-dot menu (45 min)
10. TypeScript → Build → APK
