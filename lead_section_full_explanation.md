# PNP CRM — Complete Lead Section Explanation Report
## Desktop App vs Mobile App — Full Feature Audit

---

## PART 1 — THE "CAPTURE NEW LEAD" FORM (Desktop)

### What it is
The "Capture New Lead" form is a popup modal that opens when the user clicks the **"Add New Lead"** button on the Lead Pipeline page. Its title is **"Capture New Lead"** and its subtitle says **"Add a fresh inquiry to your sales pipeline."**

The form also doubles as an **"Edit Lead Profile"** modal — if you open it from the three-dot action menu of an existing lead, the same modal appears with the title **"Edit Lead Profile"** and all fields pre-filled with the existing data.

---

### Every Field Explained

#### 1. Customer Name (text box)
- **Label:** Customer Name
- **Placeholder:** Full name
- **Icon:** User icon on the left inside the input box
- **Required?** No — optional
- **What it does:** Accepts the full name of the customer. No character limit. Any text is accepted. If left blank, the lead is created as "Unknown Customer" and the avatar shows "?" on the pipeline list.

#### 2. Contact Phone (text box) — REQUIRED
- **Label:** Contact Phone *
- **Placeholder:** Phone number
- **Icon:** Phone icon on the left inside the input box
- **Required?** YES — the form cannot be submitted without it
- **What it does:**
  - Accepts only numeric digits (0–9). Any non-digit character typed is automatically stripped out.
  - Maximum length is exactly 10 digits. The system enforces this — you cannot type more than 10 characters.
  - **Duplicate Detection Logic:** Once 10 digits are entered, the system automatically waits 600 milliseconds (debounce timer), then silently calls the API endpoint `/api/leads/check-duplicate?phone=<number>`. A small spinning loader icon appears inside the phone field on the right side while checking.
    - If a lead already exists with that phone number, a **yellow warning panel** appears below the phone field.
    - The warning panel shows the title **"Record Already Exists"** with an alert icon.
    - Each matching lead is shown as a row with: the location name, the customer name + service type, and an **"Open →"** button that navigates directly to that lead's detail page.
    - A checkbox appears at the bottom of the warning panel: **"I understand, create duplicate lead anyway."** The user must check this box before the "Create Lead" button becomes active again.
    - The "Create Lead" button is grayed out and disabled as long as duplicates are found and the checkbox is unchecked.
  - This check only runs for new leads — not when editing.

#### 3. Inquiry Source (dropdown select) — REQUIRED
- **Label:** Inquiry Source *
- **Default placeholder value:** --Select--
- **Required?** YES
- **Available options:**
  - WhatsApp (value: WHATSAPP)
  - Facebook (value: FACEBOOK)
  - Instagram (value: INSTAGRAM)
  - Website (value: WEBSITE)
  - Direct Call (value: DIRECT_CALL)
  - Walk In (value: WALK_IN)
  - Reference (value: THROUGH_REFERENCE)
- **Special behavior:** If the user selects **"Reference"**, a new animated field slides in below it:
  - **Label:** Reference Person Name *
  - **Placeholder:** Name of reference person
  - **Required:** YES (the form will not submit without it if source is Reference)
  - This field disappears completely if any other source is selected.

#### 4. Service Required (dropdown select)
- **Label:** Service Required
- **Required?** No — defaults to "Interior Design"
- **Available options:**
  - Interior Design (default selected)
  - 2BHK Interior
  - 3BHK Interior
  - 4BHK Interior
  - Raw house
  - Office
  - Other

#### 5. Site Address (text box)
- **Label:** Site Address
- **Placeholder:** Full site address / location details
- **Icon:** Map pin icon on the left
- **Required?** No — optional
- **What it does:** Stores the full address of the property or site location.

---

### Buttons at the Bottom of the Form

#### Cancel (red text button)
- Closes the modal without saving anything.
- All form data is discarded.

#### Quick Visit (green button with external link icon)
- **Function name in code:** `handleSubmit(e, forceRedirect = true)`
- This button creates the lead AND immediately redirects the user to the lead's detail page upon success.
- It calls `POST /api/leads` with the form data, then on success calls `router.push('/leads/<id>')`.
- Useful when you want to immediately start logging activities (call outcomes, schedule a site visit) right after creating the lead.
- Has the same disabled/enabled rules as the Create Lead button regarding duplicates.

#### Create Lead (indigo/purple button with check icon)
- **Function name in code:** `handleSubmit(e, forceRedirect = false)`
- Creates the lead by calling `POST /api/leads`, then closes the modal and refreshes the pipeline list.
- The user stays on the Lead Pipeline page.
- **Disabled when:** A duplicate phone number is found and the "I understand" checkbox has NOT been checked. The button is visually grayed out with `disabled:grayscale disabled:cursor-not-allowed` styling.
- Shows a spinning loader icon while the API call is in progress.

---

### Error Handling
- If the API returns an error (e.g., validation failure), a **red error banner** appears at the top of the modal with an alert icon and the error message text.
- The error banner disappears as soon as any form field is changed.

---

## PART 2 — THE LEAD PIPELINE LIST (Desktop)

### What it is
The main screen accessed from the sidebar under **LEADS → Lead Pipeline**. It shows all leads that are not in WON_ORDER or CANCELLED status by default, in a scrollable table.

---

### Header Section
- **Title:** "Lead Pipeline"
- **Subtitle:** "Manage and track your service inquiries in real-time."
- **"Add New Lead" button** (indigo, top-right): Opens the Capture New Lead form modal.

---

### Search Bar
- **Placeholder:** "Search leads..."
- **Function:** Real-time filter. As you type, the lead list updates instantly.
- **Searches across:** Customer Name, Contact Number, Service Type
- **Case-insensitive:** Yes

---

### Filters Button
- **Label:** "Filters" (when hidden) / "Hide Filters" (when shown)
- **Behavior:** Clicking toggles a slide-in filter panel below the search bar with animation (`animate-in slide-in-from-top-2`).
- When any filter or sort is active AND different from defaults, a **"Reset" button** appears with a RotateCcw icon that clears everything back to default.

---

### Filter Panel (when expanded)

#### Status Filter (dropdown)
- **Label:** STATUS
- **Options:**
  - **Active Only** (value: ALL) — DEFAULT. Shows all leads where status is NOT WON_ORDER and NOT CANCELLED.
  - **New Inquiry** (value: NEW_INQUIRY) — Shows only fresh leads.
  - **Current Pipeline** (value: ACTIVE) — Shows leads in FOLLOW_UP or MEETING_SCHEDULED status.
  - **Follow Up** (value: FOLLOW_UP) — Shows only follow-up status leads.
  - **Visit Scheduled** (value: MEETING_SCHEDULED) — Shows only leads with a visit booked.
- **Logic:** When "ALL" is selected, it hides WON_ORDER and CANCELLED leads so the pipeline only shows active work. This is intentional — to view cancelled leads you go to the "Canceled" section.

#### Source Filter (dropdown)
- **Label:** SOURCE
- **Options:** All Sources, WhatsApp, Facebook, Instagram, Website, Direct Call, Walk In, Reference

#### Sort Filter (dropdown)
- **Label:** SORT
- **Options:**
  - **Newest First** (default) — Sorts by creation date descending
  - **Oldest First** — Sorts by creation date ascending
  - **Pipeline Order** — Groups by status priority: NEW_INQUIRY → FOLLOW_UP → MEETING_SCHEDULED → WON_ORDER → CANCELLED. Within same status, newest first.
  - **Name: A-Z** — Alphabetical by customer name
  - **Name: Z-A** — Reverse alphabetical

#### Service Context Filter (dropdown)
- **Label:** SERVICE CONTEXT
- **Options:** All Services, Interior Design, 2BHK Interior, 3BHK Interior, 4BHK Interior, Raw house, Office, Other

---

### Table Columns

The table has 5 columns with fixed widths:

**1. Customer (35% width)**
- Left-side colored status bar (1px wide vertical stripe) — color matches lead status:
  - Amber = NEW_INQUIRY
  - Sky blue = FOLLOW_UP
  - Indigo = MEETING_SCHEDULED
  - Emerald = WON_ORDER
  - Rose = CANCELLED
- Avatar square with the first letter of the customer name
- Customer Name in bold with a source badge (e.g., WHATSAPP, FACEBOOK, REFERENCE)
- Phone number below the name with a phone icon

**2. Service Context (30% width)**
- Zap icon (amber) + Service type in uppercase
- Map pin icon + Site address (truncated if too long, shows "Address not provided" if empty)

**3. Status (15% width) — clickable to sort**
- Colored pill badge showing the current lead status
  - Amber pill = NEW INQUIRY
  - Emerald pill = WON ORDER
  - Rose pill = CANCELLED
  - Indigo (primary) pill = FOLLOW UP or MEETING SCHEDULED
- Clicking the STATUS column header toggles between "Pipeline Order" sort and "Newest First" sort

**4. Assignment (15% width)**
- Shows the name of the assigned staff member with a user icon avatar, or "Unassigned"
- Shows the lead creation date below in format "dd MMM yyyy"

**5. Actions (5% width)**
- A **three-dot menu button** (MoreHorizontal icon): opens a floating dropdown with 4 options
  - **View Profile** — navigates to `/leads/<id>`
  - **Edit Lead** — opens the Edit Lead Profile modal with pre-filled data
  - **Archive Lead** — opens the Archive confirmation modal (soft delete, moves to Canceled Archive)
  - **Delete Lead** — opens the Permanent Delete confirmation modal (hard delete)
- A **ChevronRight arrow** that animates to indigo on row hover

---

### Row Click Behavior
- Clicking anywhere on a row (except the three-dot button) navigates to `/leads/<id>` — the lead detail page.

---

### Empty State
- If no leads match the current search/filter: Shows an Activity icon, "No leads found" title, and "Try adjusting your search criteria." hint.

---

### Archive Lead Modal (soft delete)
- **Triggered by:** "Archive Lead" in the three-dot menu
- **Title:** "Archive Lead"
- **Message:** "Are you sure you want to remove this lead? It will be moved to the Canceled Archive for safety. You can permanently delete it from there later."
- **Buttons:** "Move to Archive" (rose/red) and "Cancel"
- **API call:** `DELETE /api/leads/<id>` (without `?permanent=true`)
- The lead's status becomes CANCELLED and it moves to the Canceled section. It does NOT disappear from the database.

---

### Permanent Delete Modal (hard delete)
- **Triggered by:** "Delete Lead" in the three-dot menu
- **Title:** "Delete Lead Permanently?"
- **Warning:** "This action cannot be undone. The lead will be permanently removed from: Lead Pipeline, Follow-Ups, Site Visits, Analytics, Customer History"
- **Buttons:** "Permanently Delete" (rose/red) and "Cancel"
- **API call:** `DELETE /api/leads/<id>?permanent=true`
- The lead and ALL its related data (follow-ups, meetings, notes, transactions) are wiped from the database.

---

## PART 3 — THE LEAD DETAIL PAGE (Desktop) — `/leads/<id>`

### Navigation Bar
- **Back button** (top left): Arrow-left icon + "BACK" text. Uses `router.back()`.
- **Breadcrumb** (top right): "Lead Pipeline → Details" (or "Canceled Archive → Details" if the lead is cancelled). "Lead Pipeline" is a clickable link to go back.

---

### Lead Header Card (top banner)
- **Avatar:** Large square with first letter of customer name
- **Customer Name:** Displayed prominently. If lead is NOT locked (not cancelled, not won), you can:
  - **Double-click the name** to enter edit mode inline
  - **Click the pencil icon** that appears on hover next to the name
  - When in edit mode: an input box appears pre-filled with the name, a green check button (saves), and a grey X button (cancels).
  - Pressing **Enter** saves. Pressing **Escape** cancels.
  - On blur (clicking away), it also saves.
  - **API call:** `PUT /api/leads/<id>` with `{ customerName: newName }`
- **Contact number pill** — shown in a grey badge with phone icon
- **Service type pill** — shown in a grey badge with document icon
- **Reference name pill** — shown only if inquiry source is THROUGH_REFERENCE, with user icon and amber color

#### Top-Right Buttons (in the header)
- **Phone Call button** (grey rounded): Opens the "Direct Call" modal (see below)
- **WhatsApp button** (green rounded): Opens `https://wa.me/<contactNumber>` in a new browser tab
- **Status badge pill:** Color-coded badge showing current lead status:
  - Amber = "New Lead"
  - Sky = "In Pipeline"
  - Indigo = "Visit Booked"
  - Emerald = "Project Started"
  - Rose = "Cancelled" (when lead is cancelled, also shows cancel reason in italic text below)

---

### Left Column: Action Center + Profile Information

#### Action Center (dark panel, slate-900 background)
- **Label:** "Action Center" with Zap icon (amber)
- Shows different content depending on lead state:

**State 1 — Lead is LOCKED (CANCELLED or WON_ORDER):**
- Shows a rose-tinted box with a Ban icon: "Lead Deactivated"
- Shows a **"Reactivate Lead"** button (indigo) → opens REACTIVATE modal

**State 2 — There is a SCHEDULED site visit pending:**
- Shows an indigo-tinted box with Calendar icon: "Site Visit Pending"
- Message: "Please complete the pending site visit from the timeline before taking new actions."
- No other action buttons are available — the system forces you to resolve the site visit first.

**State 3 — Lead is ACTIVE (normal state):**
Shows 4 action buttons:
1. **Picked** (green button, CheckCircle2 icon) → opens PICKED modal
2. **No Answer** (rose button, PhoneMissed icon) → opens NOT_PICKED modal
3. **Schedule Site Visit** (white/outlined button, Calendar icon with indigo) → opens MEETING modal
4. **Convert to Customer** (indigo-light button, Zap icon) → opens CONVERT modal
5. **Cancel Lead** (text-only, small, Ban icon, slate to rose hover) → opens CANCEL modal

---

#### Profile Information Card (white card below Action Center)
- **Edit pencil button** (top-right corner): Opens the full EDIT modal
- Shows:
  - **Address:** Full site address or "Not specified"
  - **Requirement:** `requirementDetails` field or "No details provided"
  - **Area / City:** Currently hardcoded as "Surat"
  - **Source:** The inquiry source value in uppercase
  - **Interested Service:** The service type in uppercase

---

### Right Column (spans 2/3 of width): Activity Timeline

**Header:**
- Title: "Activity Timeline" with blue Activity icon
- Shows a count badge: "X Events" in a pill on the right

**The Timeline List:**
Every activity item is sorted from newest to oldest (by `createdAt` timestamp). The timeline combines 4 types of data:

1. **Follow-Ups** (only those with a `completedDate`)
2. **Meetings** (site visits)
3. **Lead Notes** (internal notes)
4. **Transactions** (financial logs — currently used for internal tracking)

---

#### Timeline Item Structure
Each item has:
- **Colored left border bar** (1.5px wide): color = green (PICKED/INTERESTED), rose (NOT_PICKED/CANCELLED), indigo (MEETING), amber (NOTE), emerald (TRANSACTION RECEIVED), rose (TRANSACTION EXPENSE)
- **Type icon** in a colored square: phone, calendar, message, banknote
- **Title label** (bold):
  - Meeting: "Site Visit"
  - Note: "Internal Note"
  - Transaction: "Payment In" or "Expense Out"
  - Follow-Up: "Call Attempt: PICKED" / "Call Attempt: NOT PICKED (#3)" / etc.
    - For NOT_PICKED outcomes, shows attempt number (#1, #2, #3...) counting consecutive unanswered calls
- **Timestamp:** "dd MMM, yyyy · h:mm a" with a clock icon
- **On hover:** 3 action buttons appear (opacity-0 → opacity-100 on hover):
  1. **Check/Complete button** (only visible on MEETING items that are NOT yet COMPLETED) — marks the meeting as done
  2. **Edit pencil button** — opens inline edit for that item
  3. **Trash/Delete button** — deletes this single activity item after confirmation dialog

---

#### Timeline Content by Type

**For MEETINGS (Site Visits):**
- White card inside showing:
  - Map pin icon + address in bold
  - Calendar icon + formatted date ("dd MMM, yyyy")
  - Clock icon + time (e.g., "3:00 PM")
  - Notes in italic, indigo-tinted box (if notes exist)

**For TRANSACTIONS:**
- White card showing:
  - Amount in bold (₹X,XXX)
  - "Paid to: <name>" below
  - Category badge on the right (Emerald if RECEIVED, Rose if EXPENSE)

**For NOTES:**
- Plain text paragraph showing the note content

**For FOLLOW-UPS:**
- If `nextCallDate` exists: An indigo pill shows "Next Call: dd MMM, yyyy @ time"
- The conversation note (`noteGiven`) is shown as a paragraph
- If no note: Shows "No conversation summary logged." in italic grey

---

### All Modal Forms on the Lead Detail Page

#### MODAL: Log Successful Call ("PICKED" modal)
- **Title:** "Log Successful Call" with CheckCircle2 icon
- **Previous Conversations Context:** If there are any previous follow-up notes or lead notes, they are shown in a scrollable panel at the top with the label "Previous Conversations & Notes". Each note is numbered from oldest to newest with #1, #2, etc.
- **Field 1 — Conversation Summary** (textarea):
  - **Label:** "Conversation Summary *" (required if this is the very first successful call) or "Conversation Summary (Optional)" on subsequent calls
  - **Placeholder:** "Mention specific requirements or customer mood..."
- **Field 2 — Pipeline Outcome** (button grid):
  - **Label:** Pipeline Outcome
  - These are toggle buttons in a 2-column grid:
    - **Interested** — Marks the lead as interested; a follow-up date picker appears below
    - **Book Site Visit** — Shows a full site visit scheduling form (date, time, address)
    - **Next Day** — Auto-sets follow-up to tomorrow; shows a time picker
    - **Wants Recall** — Shows a date picker for the next call date
    - **Not Interested** — Shows a cancel reason dropdown; lead will be cancelled
  - "Interested" option is disabled (grayed out) if there has already been a successful "PICKED" call before — preventing duplicate "interested" logs.
- **Field 3 — Follow-up Date** (date picker): Only appears if outcome is "Interested" or "Wants Recall"
- **Field 4 — Follow-up Time** (clock picker): Only appears if outcome is "Wants Recall" or "Next Day"
- **Field 5 — Site Visit Form** (only if "Book Site Visit" selected):
  - Visit Date * (date input, minimum today)
  - Visit Time (clock picker)
  - Site Address * (text input with map pin icon, pre-filled with lead's `fullAddress`)
- **Field 6 — Reason for Drop-off** (dropdown, only if "Not Interested"):
  - Options: No Response, Not Interested, Budget Issue, Already Purchased, Wrong Number, Project Postponed, Need Turnkey
- **Submit button disabled when:** No outcome selected, OR first call requires a note but none is typed, OR date-required outcomes missing date, OR "Book Site Visit" missing date/address
- **API call:** `POST /api/follow-ups` with fields including `leadId`, `outcome: "PICKED"`, `noteGiven`, `pickedStatus`, and conditional meeting/follow-up data

#### MODAL: Log Unanswered Call ("NOT_PICKED" modal)
- **Title:** "Log Unanswered Call" with PhoneMissed icon
- **Warning box (amber):** "System Note: Lead will be auto-scheduled for a recall tomorrow. Frequent misses lead to auto-archival."
- **Field — Brief Observation** (textarea, optional):
  - **Label:** Brief Observation (Optional)
  - **Placeholder:** "Ringing but no answer, switched off..."
- **Submit button label:** "Log Attempt"
- **API call:** `POST /api/follow-ups` with `{ leadId, outcome: "NOT_PICKED", noteGiven }`

#### MODAL: Cancel Lead ("CANCEL" modal)
- **Title:** "Cancel Lead" with Ban icon
- **Warning box (rose):** "Inquiry will be moved to the 'Cancelled' tab. You can reactivate this profile anytime."
- **Field 1 — Resolution Reason*** (dropdown): Same list as cancel reasons: No Response, Not Interested, Budget Issue, Already Purchased, Wrong Number, Project Postponed, Need Turnkey
- **Field 2 — Final Comment** (textarea, optional):
  - **Placeholder:** "Specify if there was any conflict or preference..."
- **API call:** `POST /api/follow-ups` with `{ leadId, outcome: "CANCELLED", cancelReason, noteGiven }`

#### MODAL: Restore Opportunity ("REACTIVATE" modal)
- **Title:** "Restore Opportunity" with RotateCcw icon
- **Info box (indigo):** "Resetting status to FOLLOW UP. This will appear as a fresh activity on your timeline."
- **Field — Reactivation Insight** (textarea):
  - **Label:** Reactivation Insight
  - **Placeholder:** "Why is this client back in the pipeline?"
- **API call:** `POST /api/leads/<id>/reactivate` with `{ reactivationNote }`

#### MODAL: Convert to Customer ("CONVERT" modal)
- **Title:** "Convert to Customer" with Zap icon (emerald)
- **Info box (emerald):** "Ready to formalize this relationship?" / "This will move the lead out of your active pipeline and into the Customer Directory."
- **Submit button:** "Confirm Conversion"
- **API call:** `POST /api/leads/<id>/convert`
- **On success:** Navigates to `/customers/<id>`

#### MODAL: Schedule Site Inspection ("MEETING" modal)
- **Title:** "Schedule Site Inspection" with Calendar icon
- **Fields:**
  - **Proposed Date*** (date input, top-left)
  - **Proposed Time (Optional)** (clock picker, top-right)
  - **Site Address*** — If the lead already has an address:
    - Shows the existing address in a display card with a pencil edit button
    - Clicking the pencil switches it to an editable text input + "Save" button
    - If no address exists: Shows empty text input directly
  - **Preparation Notes (Optional)** (textarea):
    - **Placeholder:** "Tools to bring, specific measurements to check..."
- **Submit disabled when:** Date or Address is missing
- **API call:** `POST /api/meetings` with `{ leadId, address, date, time, notes }`

#### MODAL: Complete Site Visit ("COMPLETE_MEETING" modal)
- **Title:** "Complete Site Visit" with CheckCircle2 icon (emerald)
- Opened by clicking the check button on a SCHEDULED meeting in the timeline
- **Field 1 — Visit Outcome*** (button grid, 3 columns):
  - **Want to recall** — Shows date + time pickers for recall
  - **Reschedule the visit** — Shows date + time pickers for new visit date
  - **No Answer** — Just completes the meeting as no-answer
  - **Not interested** — Shows cancel reason dropdown; lead is cancelled
  - **Convert to Customer** — Shows confirmation, then converts
- **Field 2 — Date/Time pickers** (only for "Want to recall" and "Reschedule"):
  - Recall Date / New Date * (date input)
  - Time (Optional) (clock picker)
- **Field 3 — Reason for Drop-off** (dropdown, only if "Not interested")
- **Field 4 — Summary Notes** (textarea, optional):
  - **Placeholder:** "Add any details about the outcome..."
- **Submit disabled when:** No outcome selected, OR date-required outcomes missing date
- **Logic for "Reschedule":** Marks old meeting as COMPLETED, creates a NEW meeting with the new date/time
- **API call:** `POST /api/meetings/<id>/complete`

#### MODAL: Edit Lead Profile ("EDIT" modal)
- **Title:** "Edit Lead" with Pencil icon
- **Fields (all editable):**
  - Phone * (max 10 digits, digits-only enforcement)
  - Customer Name
  - Address
  - Interested Service * (same service dropdown)
  - Inquiry Source * (same source dropdown)
  - Reference Person Name * (appears only if source = THROUGH_REFERENCE)
  - Requirement Details (textarea, 3 rows, spans full width)
- **Submit button:** "Update Profile"
- **API call:** `PUT /api/leads/<id>`

#### MODAL: Edit Activity Note (inline edit)
- **Title:** "Edit Site Visit" (for meetings) or "Edit Activity Note" (for follow-ups/notes) with Pencil icon
- **For Meetings:**
  - Visit Date * (date input)
  - Visit Time (clock picker)
  - Preparation Notes (textarea)
- **For Follow-Ups / Notes:**
  - Note Content (textarea, 5 rows)
- **Submit button:** "Save Changes"
- **API calls:**
  - Follow-up: `PATCH /api/follow-ups/<id>` with `{ noteGiven }`
  - Meeting: `PATCH /api/meetings/<id>` with `{ notes, date, time }`
  - Note: `PATCH /api/notes/<id>` with `{ content }`

#### MODAL: Direct Call ("CALL" modal)
- **Title:** "Initiating Direct Call" with Phone icon (indigo, pulsing animation)
- **Message:** "Click Dial Now to automatically place the call. Not connecting? Ensure your phone is linked to your PC."
- **Two buttons:**
  - **"Dial Now"** — An `<a>` tag with `href="tel:+91<contactNumber>"`. Clicking it triggers the PC's default calling app or linked phone (via Windows Phone Link / Android).
  - **"Check Phone Link on PC"** — An `<a>` tag with `href="ms-settings:mobile-devices-addphone-direct"` — opens Windows Settings to the phone linking screen.

---

## PART 4 — FOLLOW-UP QUEUE PAGE (Desktop) — `/follow-ups`

### What it is
Accessed from **LEADS → Follow-Up Queue** in the sidebar. This is a dedicated queue view showing all pending follow-ups (leads that have a `nextCallDate` set and have NOT been completed).

### Header Section with Live Counters
Three clickable counter cards in the header (work as quick-filter buttons):
- **Today** (indigo card): Number of follow-ups scheduled for today. Click to filter to Today only; click again to reset.
- **Overdue** (rose card): Number of follow-ups where the scheduled date has already passed. Click to filter to Overdue only.
- **Upcoming** (amber card): Number of follow-ups scheduled for a future date. Click to filter to Upcoming only.

### Search Bar
- **Placeholder:** "Search leads or engagement notes..."
- **Searches across:** Customer Name, note given (conversation notes)

### Filter Button + Filter Panel
- **"Filter Queue"** button toggles filter panel visibility
- When any non-default filter is active, a Reset (RotateCcw) button appears

**Filter Panel contains:**
- **Sort Queue** dropdown:
  - Schedule: Nearest First (default DATE_ASC — nearest upcoming first, with same-day sorted by time)
  - Schedule: Furthest First (DATE_DESC)
  - Customer: A-Z
  - Customer: Z-A
- **From Date / To Date** (two date inputs): Filter by scheduled date range
- **Queue Distance** (toggle button cycles): All Distances → Upcoming Only → Overdue Only → Today Only → back to All

### Table Columns
1. **Customer Name** — Avatar with first letter, name in bold, service type below in uppercase small text. Status color stripe on left edge.
2. **Follow-Up Date** — Shows the `nextCallDate` and `nextCallTime`.
   - Red calendar icon and red text if overdue
   - **"Urgent Overdue"** badge (rose) if past due date
   - **"Scheduled Today"** badge (amber) if today
   - **"Upcoming"** badge (amber/faded) if future
   - "No Target Set" in grey if no date is set
3. **Last Outcome** — Shows the most recent follow-up's `noteGiven` note text. If none, shows "No Response / Missed Call" for NOT_PICKED or "New Inquiry - Pending Initial Call".
4. **Attempts** — A number badge showing total `_count.followUps` — the total number of call attempts logged for this lead.
5. **Actions** — A "View Details →" button (indigo) that navigates to the lead detail page.

### Click Behavior
- Clicking any row navigates to `/leads/<leadId>`

### Filter Logic
- Excludes leads where `_count.followUps === 0` (no calls yet logged)
- Applies time-aware sorting with same-day items sorted by time (hours+minutes comparison)

---

## PART 5 — INTERESTED LEADS PAGE (Desktop) — `/interested`

### What it is
Accessed from **LEADS → Interested Leads** in the sidebar. Shows all leads that are in **FOLLOW_UP** status — meaning they have had at least one successful "Picked" call. Displayed in a card/grid layout rather than a table.

### Header
- Title: "Interested Leads" with a star icon (amber, filled)
- Subtitle: "Qualified prospects showing engagement and purchase intent."
- Count badge: "{X} Total Interested"

### Filters
- **Search bar:** Filters by customer name or phone number
- **Service filter chip bar:** Dynamic buttons generated from all unique service types in the list. Click a service type to filter. "ALL" is always the first option.

### Lead Cards (grid layout)
- 3 columns on desktop, 2 on tablet, 1 on mobile
- Each card shows:
  - Avatar square with first letter
  - Customer name (bold, purple on hover)
  - Service type (small caps)
  - Requirement details (if set) in italic quote style, grey background
  - **Estimated Budget** and **Next Follow-up** side by side
  - Two action buttons at bottom:
    - **Profile** button — navigates to `/leads/<id>`
    - **WhatsApp** icon button — sends a pre-written WhatsApp template message. The message says:
      > "Hello {name}, This is regarding your inquiry for {service}. We would like to know if you are still interested in proceeding further. If convenient, our team can also schedule a site visit based on your availability. Please feel free to reply to this message or contact us for any further discussion. Thank you, PNP Interior"

### Sort Order
Cards are sorted by `nextCallDate` ascending — the person whose follow-up is nearest comes first.

---

## PART 6 — SITE VISITS PAGE (Desktop) — `/meetings`

### What it is
Accessed from **LEADS → Site Visits** in the sidebar. Shows all meetings/site visits that have status = "SCHEDULED" (pending, not yet completed).

### Header
- Title: "Site Visits & Consultations"
- Subtitle: "Coordinate site visits, field measurements, and client discussions."
- Three quick-filter counter cards (same as Follow-Up Queue):
  - **Today** (indigo): Visits scheduled for today
  - **Overdue** (rose): Visits where date has passed
  - **Upcoming** (amber): Future visits

### Search Bar + Distance Filter
- **Search placeholder:** "Search by site location or entity identifier..."
- **Searches across:** Customer name, site address
- **Distance button** (cycles through): All Distances → Upcoming Only → Overdue Only → Today Only
- When any filter is active: a Reset button appears

### Table Columns
1. **Customer Name** — Avatar (green tinted if today's visit), customer name, phone number
2. **Scheduled Date** — Date formatted "dd MMM, yyyy", time below it. Shows "Active Today" badge (emerald) or "Missed Visit" badge (rose, with warning icon)
3. **Site Address** — Map pin icon + address. Below it: a **"Launch Navigation"** link that opens Google Maps with the address as search query
4. **Status** — Animated pulse dot + status text ("SCHEDULED" or "OVERDUE")
   - Amber pulsing dot = SCHEDULED
   - Rose pulsing dot = OVERDUE
5. **Actions** — "View Lead →" or "View Customer →" button (indigo). If lead has WON_ORDER status, it routes to `/customers/<id>` instead of `/leads/<id>`.

### Filter Logic
- Only shows meetings with `status === "SCHEDULED"` (excludes completed visits)
- `isToday` = today's date matches visit date
- `isOverdue` = visit date is in the past AND not today
- `isUpcoming` = visit date is in the future AND not today

---

## PART 7 — NOTIFICATION SYSTEM (Desktop)

### How Notifications Work

The notifications system is powered by the API endpoint `GET /api/notifications`.

It compiles 4 types of alerts:

**Type 1 — Follow-Up Notifications**
- Query: All follow-ups where `completedDate = null` and lead is not cancelled/won
- Filters: Only TODAY or OVERDUE follow-ups appear as notifications
- **Overdue follow-up:** type = "OVERDUE", title = "Overdue Follow-Up", priority = HIGH, category = "Overdue"
- **Today follow-up:** type = "FOLLOW_UP", title = "Today Follow-Up", priority = MEDIUM, category = "Follow-Ups"
- Description: "Call {customerName}: {note if any}"
- Each notification has a direct link to `/leads/<leadId>`

**Type 2 — Site Visit Notifications**
- Query: Meetings with `status = "SCHEDULED"` and `date <= todayEnd` and lead not cancelled/won
- **Overdue visit:** type = "OVERDUE", title = "Overdue Site Visit", priority = HIGH, category = "Overdue"
- **Today visit:** type = "SITE_VISIT", title = "Site Visit Today", priority = HIGH, category = "Site Visits"
- Description: "Visit {customerName} at {address}"

**Type 3 — High Priority Lead Notifications**
- Query: Leads with `priority = "HIGH"` and status in NEW_INQUIRY, FOLLOW_UP, MEETING_SCHEDULED, not cancelled
- Max 5 results
- Only shown if that lead doesn't already have a follow-up notification today (deduplication)
- type = "TASK", title = "High Priority Lead", priority = HIGH

**Type 4 — Payment Milestone Notifications**
- Query: QuotationMilestones with `status = "PENDING"` and `dueDate <= todayEnd`, related to non-cancelled leads
- type = "TASK", title = "Payment Pending"
- Description: "{customerName}: {description}"

**Sorting:** HIGH priority items always come first. Within same priority, sorted by date newest first.

**Authentication:** The endpoint checks for session auth OR accepts a special token `pnp_desktop_local_secret` for the desktop notifier PowerShell script.

**Refresh trigger:** Every time any action is taken on the lead detail page (picking, meeting, converting, etc.), the code fires `window.dispatchEvent(new CustomEvent("refresh-notifications"))` to refresh the notification panel in real-time.

---

---

## PART 8 — MOBILE APP — CURRENT FUNCTIONALITY

### Architecture
The mobile app is a **Capacitor-based web app** (React + Vite) that runs offline-first using **SQLite on the device**. It does NOT connect directly to the desktop CRM's Next.js API. Instead, it stores data locally and has a **Sync Hub** to push/pull data to the server when internet is available.

---

### Mobile: Lead Pipeline Screen (`LeadPipeline.tsx`)
- Title: "Lead Pipeline", subtitle: "{N} total leads"
- **Search bar:** Filters by name or phone number
- **Filter chips:** ALL | New Inquiry | Follow-up | Visit Booked | Won
- Lead cards in a vertical list
- Floating **+ button** (bottom right, indigo) to add a new lead
- Clicking a lead card navigates to the Lead Detail screen

### Mobile: Add Lead Screen (`AddLead.tsx`)
- **Section: Customer Info**
  - Customer Name* (text input)
  - Phone Number* (tel input, 10-digit validation)
  - Alternate Number (optional, tel input)
- **Section: Project Details**
  - Service Type* (select: Interior Design, Exterior Design, Full Home, Commercial, Other)
  - Inquiry Source (select: Reference/Word of Mouth, Social Media, Walk-in, Site Board, Other)
  - Priority (select: Medium, High, Low)
  - Site Location (text input)
  - Budget Range (text input, e.g. "5-10 Lakh")
  - Requirement Notes (textarea)
- **Save Lead Locally** button (indigo)
- **Note at bottom:** "Lead will be saved on this device. Sync to send it to the main CRM."
- No duplicate detection, no Quick Visit button, no Reference Person Name field
- Saves via SQLite `saveLead()` function — purely local

### Mobile: Lead Detail Screen (`LeadDetail.tsx`)
- Shows customer name, phone, status badge
- **Call button** — native `tel:` link (calls directly from phone)
- **WhatsApp button** — opens WhatsApp modal with template
- **Action Center:**
  - "Picked" button — shows a toast notification only ("Marked as Picked! Log a follow-up.")
  - "No Answer" button — shows a toast notification only ("Call logged as No Answer.")
  - "Log Follow-Up" button — navigates to Add Follow-Up screen
  - "Schedule Site Visit" button — shows toast "Site visit scheduling coming soon!" (not yet implemented)
- **Lead Information section:** Location, Service, Budget, Notes
- No Activity Timeline
- No Cancel Lead option
- No Convert to Customer option
- No Edit lead option
- No Reactivate option

### Mobile: Add Follow-Up Screen (`AddFollowUp.tsx`)
- **Call Outcome** (select: Not Picked, Picked-Interested, Very Interested, Not Interested, Call Back Later)
- **Notes** (textarea)
- **Schedule Next Call** section:
  - Date (date input, defaults to tomorrow)
  - Time (time input, defaults to 10:00)
- **Save Follow-Up** button
- Saves to local SQLite, schedules a device push notification (`scheduleFollowUpNotification`)
- Note: "Follow-up will be saved locally and synced to CRM on next sync."

### Mobile: Follow-Ups Screen (`FollowUps.tsx`)
- Title: "Follow-Ups", subtitle: "{N} pending follow-ups"
- **Filter chips:** All | Today | Overdue | Upcoming
- Shows follow-up cards with:
  - Left accent bar (red = overdue, amber = today, indigo = upcoming)
  - Date label ("Overdue · date", "Today · time", or future date)
  - Lead contact number
  - Outcome badge
- Clicking an item navigates to Lead Detail
- **Note:** Shows by contact number only — does NOT show customer name

### Mobile: Site Visits Screen (`Visits.tsx`)
- Title: "Site Visits", subtitle: "{N} total visits"
- **Today's summary banner:** Green banner "X visits today" if there are visits scheduled for today
- **Filter chips:** All | Today | Upcoming | Completed
- Visit cards shown via `VisitCard` component
- Floating **+ button** (bottom right, emerald green) to add a visit
- Clicking a visit card navigates to Visit Detail screen

### Mobile: Notifications Screen (`Notifications.tsx`)
- Shows 3 categories of notifications from local SQLite only:
  1. **Overdue Follow-Ups** — Clock icon, red border — follow-ups where `scheduledDate < now`
  2. **Today's Visits** — Map pin icon, green border — visits where date = today and status = SCHEDULED
  3. **Pending Sync** — Refresh icon, amber border — shows if there are unsynced leads or follow-ups
- Each notification taps to navigate to the relevant screen (followups / visits / sync-hub)
- Does NOT connect to the desktop server's notification API

---

## PART 9 — COMPARISON: Desktop vs Mobile

| Feature | Desktop | Mobile |
|---|---|---|
| **Create Lead — Customer Name** | Optional text box | Required text input |
| **Create Lead — Phone** | Required, 10-digit, duplicate detection | Required, 10-digit, unique SQLite constraint |
| **Create Lead — Source** | 7 options (WhatsApp, FB, IG, Website, Direct Call, Walk-In, Reference) | 5 options (Reference, Social Media, Walk-in, Site Board, Other) — DIFFERENT values |
| **Create Lead — Reference Person** | Appears when "Reference" selected | Not present |
| **Create Lead — Service** | 7 options (Interior Design, 2BHK, 3BHK, 4BHK, Raw house, Office, Other) | 5 options (Interior, Exterior, Full Home, Commercial, Other) — DIFFERENT values |
| **Create Lead — Duplicate Detection** | Real-time, shows warning with checkbox | Not present (only SQLite unique constraint) |
| **Create Lead — Quick Visit button** | YES — creates and immediately opens lead detail | NOT present |
| **Create Lead — Priority** | Not in create form (editable later) | YES — set during creation |
| **Create Lead — Alternate Number** | Not in create form | YES |
| **Create Lead — Budget Range** | Not in create form | YES |
| **Create Lead — Requirement Notes** | Not in create form | YES |
| **Lead Pipeline — Filters** | Status, Source, Service, Sort (4 filters, 5 sort options) | Only status chip filter (5 values) |
| **Lead Pipeline — Search** | Name, phone, service | Name, phone only |
| **Lead Pipeline — Status values** | NEW_INQUIRY, FOLLOW_UP, MEETING_SCHEDULED, WON_ORDER, CANCELLED | NEW_INQUIRY, FOLLOW_UP, VISIT_BOOKED, WON, LOST — DIFFERENT |
| **Lead Pipeline — Archive/Delete** | YES — 3-dot menu with Archive + Permanent Delete | Not present |
| **Lead Pipeline — Edit from list** | YES — via 3-dot menu | Not present |
| **Lead Detail — Activity Timeline** | YES — full timeline with follow-ups, visits, notes, transactions | NOT present |
| **Lead Detail — Action Center** | Full: Picked, No Answer, Schedule Visit, Convert, Cancel, Reactivate | Partial: Picked/No Answer are toast-only, Schedule Visit is stub only |
| **Lead Detail — Call Modal** | YES — PC phone link integration | Direct `tel:` link |
| **Lead Detail — WhatsApp** | Opens `wa.me` link | WhatsApp modal with template |
| **Lead Detail — Edit Lead** | YES — full edit modal from pencil button or 3-dot menu | Not present |
| **Lead Detail — Cancel Lead** | YES — with reason dropdown | Not present |
| **Lead Detail — Convert to Customer** | YES — moves lead to customer directory | Not present |
| **Lead Detail — Reactivate** | YES — re-opens cancelled leads | Not present |
| **Lead Detail — Inline Name Edit** | YES — double-click name | Not present |
| **Follow-Up Queue** | Full page with Today/Overdue/Upcoming counts, date range filter, sort options, notes preview, attempt count | Basic list with All/Today/Overdue/Upcoming chips, shows phone numbers only |
| **Interested Leads** | Dedicated page with card grid + WhatsApp template | Not present (no separate page) |
| **Site Visits** | Table with Google Maps link, navigation button | Card-based, no Maps link, Today banner |
| **Notifications — Source** | Server-side API — queries live database, includes follow-ups, visits, high-priority leads, payment milestones | Local SQLite only — includes overdue follow-ups, today's visits, pending sync items |
| **Notifications — Follow-Up Detail** | Shows customer name + note in notification | Shows contact phone number only |
| **Notifications — Payment Milestones** | YES | Not present |
| **Notifications — High Priority Leads** | YES | Not present |
| **Notifications — Pending Sync** | Not present | YES |
| **Data Storage** | PostgreSQL via Prisma ORM (server-side) | SQLite on device (offline-first) |
| **Data Sync** | Real-time (every action hits the API) | Manual sync via Sync Hub |
| **Status Labels** | NEW_INQUIRY, FOLLOW_UP, MEETING_SCHEDULED, WON_ORDER, CANCELLED | NEW_INQUIRY, FOLLOW_UP, VISIT_BOOKED, WON, LOST |

---

## PART 10 — SOLUTION RECOMMENDATIONS (Text Only, No Code Changes)

The core architectural problem is that the mobile app is **completely disconnected** from the desktop CRM's live database. It uses its own local SQLite, its own status vocabulary, its own source vocabulary, and has no way to do real-time operations. Here is what needs to happen to make the mobile app identical to the desktop in functionality:

### 1. Unify the Data Model
- **Lead statuses** must match: The mobile uses `VISIT_BOOKED` and `WON` but desktop uses `MEETING_SCHEDULED` and `WON_ORDER`. These must be the same values everywhere.
- **Inquiry sources** must match: Desktop uses `THROUGH_REFERENCE`, `DIRECT_CALL`, `WHATSAPP`, `FACEBOOK`, `INSTAGRAM`, `WEBSITE`, `WALK_IN`. Mobile uses `REFERENCE`, `SOCIAL_MEDIA`, `WALK_IN`, `SITE_BOARD`, `OTHER`. These are fundamentally different.
- **Service types** must match: Desktop uses `Interior Design`, `2BHK Interior`, `3BHK Interior`, `4BHK Interior`, `Raw house`, `Office`, `Other`. Mobile uses `INTERIOR`, `EXTERIOR`, `FULL_HOME`, `COMMERCIAL`, `OTHER`. Completely different.

### 2. Connect Mobile to the Desktop API (Most Critical)
Instead of saving everything locally to SQLite and syncing later, the mobile should call the same Next.js API endpoints the desktop uses. This means:
- `POST /api/leads` to create a lead
- `GET /api/leads` to fetch the pipeline
- `GET /api/leads/<id>` to get lead details with full timeline
- `POST /api/follow-ups` to log calls
- `POST /api/meetings` to schedule site visits
- `GET /api/notifications` to get real notifications from the server
- The mobile's `.env` file shows a `VITE_API_URL` — this is where the desktop server URL should be configured

### 3. Add Missing Features to Mobile Lead Detail
The mobile lead detail page needs to implement everything the desktop has:
- Full Activity Timeline (follow-ups, visits, notes, transactions — sorted by time)
- "Log Successful Call" modal with all outcome options (Interested, Book Site Visit, Next Day, Wants Recall, Not Interested) and the "Pipeline Outcome" button grid
- "Log Unanswered Call" modal with observation note
- "Schedule Site Visit" modal with date, time, address fields
- "Cancel Lead" modal with reason selection
- "Convert to Customer" button with confirmation
- "Reactivate Lead" button (for cancelled leads)
- Edit lead functionality

### 4. Add Missing Features to Mobile Lead Creation Form
- Duplicate phone number detection (call `/api/leads/check-duplicate?phone=<number>`)
- Reference Person Name field (appears when Source = THROUGH_REFERENCE)
- "Quick Visit" button option

### 5. Fix the Follow-Up Queue on Mobile
- Show customer name instead of just phone number
- Add date range filter
- Add sort options (nearest first, furthest first, A-Z, Z-A)
- Show attempt count
- Show last conversation note preview

### 6. Add Interested Leads Section to Mobile
- Create a filtered view of all FOLLOW_UP status leads
- Add the WhatsApp template sender button

### 7. Fix Notifications on Mobile
- The mobile notifications currently read from local SQLite. To show real notifications matching the desktop, the mobile must call `GET /api/notifications?token=pnp_desktop_local_secret` (or use session auth) and display the same types: overdue follow-ups, today's site visits, high-priority leads, payment milestones.

### 8. Site Visits on Mobile — Add Google Maps Link
- Each visit card should have a "Launch Navigation" button linking to `https://www.google.com/maps/search/?api=1&query=<address>`.

### 9. Add Lead Pipeline Filter Panel to Mobile
- Add Status, Source, Service, and Sort filters equivalent to the desktop.
- The current mobile has only basic status chip filter.

### 10. Add Archive and Delete to Mobile Lead Actions
- Three-dot menu on lead cards with "Archive Lead" and "Delete Lead" options.

---

*Report generated: 2026-07-21*
*Based on full code audit of: `src/app/(dashboard)/leads/page.tsx`, `src/app/(dashboard)/leads/[id]/page.tsx`, `src/app/(dashboard)/follow-ups/page.tsx`, `src/app/(dashboard)/interested/page.tsx`, `src/app/(dashboard)/meetings/page.tsx`, `src/app/api/notifications/route.ts`, `mobile/src/pages/LeadPipeline.tsx`, `mobile/src/pages/LeadDetail.tsx`, `mobile/src/pages/AddLead.tsx`, `mobile/src/pages/AddFollowUp.tsx`, `mobile/src/pages/FollowUps.tsx`, `mobile/src/pages/Visits.tsx`, `mobile/src/pages/Notifications.tsx`*
