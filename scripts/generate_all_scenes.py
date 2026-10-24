"""
PNP CRM — Automated Screen-by-Screen Video Generation & Assembly Pipeline
Generates all 41 scene video clips from actual CRM screenshots with cinematic pan/zoom,
applies professional titles and lower-third overlays using textfile inputs,
stitches them into a final portfolio video, and restores the database.
"""

import os
import sys
import subprocess
import shutil

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TEMP_DIR = "_temp_video_build"
SCENES_DIR = os.path.join(TEMP_DIR, "scenes")
FINAL_DIR = "final_portfolio_video"
OUTPUT_VIDEO = os.path.join(FINAL_DIR, "PNP_CRM_Portfolio_Demo_FullHD.mp4")
FONT_BOLD = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_REGULAR = r"C\:/Windows/Fonts/arial.ttf"

SCENES_CONFIG = [
    # Phase 0: Intro
    {
        "id": "scene_01",
        "img": r"screenshots\Dark_Mode\Phase_01_Auth_and_Entry\01_Login_Page_Dark.png",
        "title": "PNP CRM V2.0",
        "subtitle": "PREMIUM CRM DASHBOARD - Full-Stack Operating System",
        "motion": "zoom_in",
        "duration": 4
    },
    # Phase 1: Authentication
    {
        "id": "scene_02",
        "img": r"screenshots\Dark_Mode\Phase_01_Auth_and_Entry\01_Login_Page_Dark.png",
        "title": "01. SECURE LOGIN GATEWAY",
        "subtitle": "Session-Based Authentication | Role-Based Access Controls",
        "motion": "zoom_in",
        "duration": 4
    },
    {
        "id": "scene_03",
        "img": r"screenshots\Dark_Mode\Phase_01_Auth_and_Entry\02_Login_ForgotPassword_Modal_Dark.png",
        "title": "02. IDENTITY VERIFICATION FLOW",
        "subtitle": "Zero-Exposure WhatsApp Dispatch Password Recovery",
        "motion": "zoom_in",
        "duration": 4
    },
    {
        "id": "scene_04",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\03_Lead_Pipeline_Kanban_Board_Dark.png",
        "title": "03. AUTHENTICATED DASHBOARD HANDSHAKE",
        "subtitle": "Session Initialized - Welcome Super Admin",
        "motion": "pan_down",
        "duration": 3.5
    },
    # Phase 2: Lead Pipeline
    {
        "id": "scene_05",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\03_Lead_Pipeline_Kanban_Board_Dark.png",
        "title": "04. LEAD PIPELINE KANBAN BOARD",
        "subtitle": "Drag-and-Drop Stages - Live Mobile Sync Telemetry",
        "motion": "pan_right",
        "duration": 4
    },
    {
        "id": "scene_06",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\04_Lead_Pipeline_List_View_Dark.png",
        "title": "05. PIPELINE LIST VIEW & ATTRIBUTION",
        "subtitle": "WhatsApp & Facebook Attribution - Hot Lead Prioritization",
        "motion": "pan_down",
        "duration": 4
    },
    {
        "id": "scene_07",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\05_Lead_Pipeline_Advanced_Filters_Dark.png",
        "title": "06. MULTIDIMENSIONAL SMART FILTERS",
        "subtitle": "Filter by Lead Source, Active Status, and Service Context",
        "motion": "zoom_in",
        "duration": 3.5
    },
    {
        "id": "scene_08",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\06_Lead_Pipeline_New_Lead_Modal_Dark.png",
        "title": "07. RAPID LEAD CAPTURE MODAL",
        "subtitle": "Quick Site Visit Scheduling - Immediate Pipeline Insertion",
        "motion": "zoom_in",
        "duration": 4
    },
    {
        "id": "scene_09",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\07_Lead_Details_Overview_Dark.png",
        "title": "08. LEAD COMMAND CENTER & ACTION HUB",
        "subtitle": "One-Click Telephony Outcomes - Real-Time Event Audit Log",
        "motion": "pan_down",
        "duration": 4.5
    },
    {
        "id": "scene_10",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\08_Lead_Details_Edit_Profile_Modal_Dark.png",
        "title": "09. ZERO-RELOAD INLINE FIELD EDITING",
        "subtitle": "Instant In-Place Record Modification & Verification",
        "motion": "zoom_in",
        "duration": 3.5
    },
    {
        "id": "scene_11",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\09_Lead_Details_Call_Picked_Modal_Dark.png",
        "title": "10. TELEPHONY DISPOSITION & OUTCOMES",
        "subtitle": "6 Automated Disposition Workflows - Conversation Notes",
        "motion": "zoom_in",
        "duration": 4
    },
    {
        "id": "scene_12",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\11_Lead_Details_Convert_Modal_Dark.png",
        "title": "11. IRREVERSIBLE CUSTOMER CONVERSION",
        "subtitle": "Data Integrity Guard - Permanent Client Workspace Creation",
        "motion": "zoom_in",
        "duration": 3.5
    },
    {
        "id": "scene_13",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\13_Lead_Details_Schedule_Inspection_Modal_Dark.png",
        "title": "12. SITE INSPECTION LOGISTICS SCHEDULER",
        "subtitle": "Geo-Coordinates - Field Consultant Briefing & Prep Notes",
        "motion": "zoom_in",
        "duration": 4
    },
    {
        "id": "scene_14",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\14_Lead_Details_Live_Activity_Dark.png",
        "title": "13. LIFETIME RECORD RETENTION & REACTIVATION",
        "subtitle": "Zero Data Loss - Instant Opportunity Revival with One Click",
        "motion": "pan_down",
        "duration": 4
    },
    {
        "id": "scene_15",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\19_Follow_Up_Queue_Active_Dark.png",
        "title": "14. DAILY FOLLOW-UP EXECUTION QUEUE",
        "subtitle": "Real-Time Overdue SLA Alerts - Scheduled Task Execution",
        "motion": "pan_down",
        "duration": 4
    },
    {
        "id": "scene_16",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\21_Interested_Leads_Active_Tab_Dark.png",
        "title": "15. HIGH-INTENT PROSPECT SHORTLIST",
        "subtitle": "Curated Priority Inquiries - Direct WhatsApp Dispatch",
        "motion": "zoom_in",
        "duration": 3.5
    },
    {
        "id": "scene_17",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\24_Site_Visits_Schedule_Modal_Dark.png",
        "title": "16. SITE VISITS & CONSULTATIONS ROSTER",
        "subtitle": "Territory Logistics - Consultant Schedule & Tunnel Status",
        "motion": "pan_down",
        "duration": 3.5
    },
    # Phase 3: Customer Operations
    {
        "id": "scene_18",
        "img": r"screenshots\Dark_Mode\Phase_03_Customer_Operations\25_Customer_Directory_Dark.png",
        "title": "17. MASTER CUSTOMER DIRECTORY",
        "subtitle": "Active Client Database - Conversion History & Staff Assignments",
        "motion": "pan_down",
        "duration": 4
    },
    {
        "id": "scene_19",
        "img": r"screenshots\Dark_Mode\Phase_03_Customer_Operations\27_Customer_Workspace_Hub_Dark.png",
        "title": "18. UNIFIED CUSTOMER WORKSPACE HUB",
        "subtitle": "6 Integrated Modules: Quotations, Costs, Financials, Gantt",
        "motion": "zoom_in",
        "duration": 4.5
    },
    {
        "id": "scene_20",
        "img": r"screenshots\Dark_Mode\Phase_03_Customer_Operations\29_Customer_Hub_Design_Studio_Dark.png",
        "title": "19. STUDIO DESIGN EXPENSE TRACKER",
        "subtitle": "Internal Cost Isolation - 3D Renders & Gross Margin Protection",
        "motion": "pan_down",
        "duration": 4.5
    },
    {
        "id": "scene_21",
        "img": r"screenshots\Dark_Mode\Phase_03_Customer_Operations\30_Customer_Hub_Financials_Ledger_Dark.png",
        "title": "20. COMMERCIAL FINANCIALS LEDGER",
        "subtitle": "Staggered Installments - Subcontractor Disbursements - PDF Export",
        "motion": "pan_down",
        "duration": 4.5
    },
    {
        "id": "scene_22",
        "img": r"screenshots\Dark_Mode\Phase_03_Customer_Operations\34_Customer_Hub_Work_Progress_Dark.png",
        "title": "21. GANTT PROJECT PROGRESSION TIMELINE",
        "subtitle": "Phase Milestones - Active TODAY Marker - Site Schedule",
        "motion": "pan_right",
        "duration": 4.5
    },
    {
        "id": "scene_23",
        "img": r"screenshots\Dark_Mode\Phase_03_Customer_Operations\37_Customer_Hub_Quotations_Dark.png",
        "title": "22. DRAG-TO-ORDER QUOTATION BUILDER",
        "subtitle": "Trade Prioritization - Drag-and-Drop - Scope Lock Mode",
        "motion": "pan_down",
        "duration": 4.5
    },
    {
        "id": "scene_24",
        "img": r"screenshots\Dark_Mode\Phase_03_Customer_Operations\41_Vendor_Directory_Dark.png",
        "title": "23. SUBCONTRACTOR & VENDOR DIRECTORY",
        "subtitle": "Categorized Supplier Database - Phone Numbers Securely Masked",
        "motion": "zoom_in",
        "duration": 3.5
    },
    {
        "id": "scene_25",
        "img": r"screenshots\Dark_Mode\Phase_03_Customer_Operations\43_Work_Fields_Management_Dark.png",
        "title": "24. REUSABLE TRADE WORK FIELDS",
        "subtitle": "Global Work Classifications - Automated Vendor Association",
        "motion": "zoom_in",
        "duration": 3.5
    },
    {
        "id": "scene_26",
        "img": r"screenshots\Dark_Mode\Phase_03_Customer_Operations\39_Complete_Projects_Archive_Dark.png",
        "title": "25. COMPLETED PROJECTS ARCHIVE",
        "subtitle": "Permanent Delivery Records - Financial Closure & Reactivation",
        "motion": "pan_down",
        "duration": 3.5
    },
    # Phase 4: Analytics & PIN
    {
        "id": "scene_27",
        "img": r"screenshots\Dark_Mode\Phase_04_Analytics_Security_PIN_and_Reports\44_Business_Intelligence_Dashboard_Days_Dark.png",
        "title": "26. REAL-TIME BUSINESS INTELLIGENCE",
        "subtitle": "10 Live KPI Cards - Weekly Lead Acquisition Velocity Chart",
        "motion": "pan_down",
        "duration": 4.5
    },
    {
        "id": "scene_28",
        "img": r"screenshots\Dark_Mode\Phase_04_Analytics_Security_PIN_and_Reports\46_Analytics_PIN_Before_Input_Dark.png",
        "title": "27. AIR-GAPPED SECURITY PIN GATE",
        "subtitle": "4-Digit PIN Verification for Sensitive Financial Governance",
        "motion": "zoom_in",
        "duration": 3.5
    },
    {
        "id": "scene_29",
        "img": r"screenshots\Dark_Mode\Phase_04_Analytics_Security_PIN_and_Reports\49_Business_Analytics_Unlocked_Dark.png",
        "title": "28. EXECUTIVE FINANCIAL ANALYTICS",
        "subtitle": "Consolidated Net Profit - Per-Customer Inflow - 66.4% Efficiency",
        "motion": "pan_down",
        "duration": 4.5
    },
    {
        "id": "scene_30",
        "img": r"screenshots\Dark_Mode\Phase_04_Analytics_Security_PIN_and_Reports\50_Reports_and_Analytics_Dark.png",
        "title": "29. SYSTEM CONVERSION TELEMETRY",
        "subtitle": "Global Pulse Monthly Trends - 66.7% Global Conversion Rate",
        "motion": "pan_down",
        "duration": 4.5
    },
    # Phase 5: Notifications & Navigation
    {
        "id": "scene_31",
        "img": r"screenshots\Dark_Mode\Phase_05_Notifications_and_Navigation\51_Notification_Center_All_Tab_Dark.png",
        "title": "30. REAL-TIME NOTIFICATION CENTER",
        "subtitle": "4 Filtered Drawers - Follow-Ups, Site Visits, and Overdue SLA",
        "motion": "zoom_in",
        "duration": 4
    },
    {
        "id": "scene_32",
        "img": r"screenshots\Dark_Mode\Phase_05_Notifications_and_Navigation\55_Topbar_Global_Search_Results_Dark.png",
        "title": "31. UNIVERSAL OMNI-SEARCH ENGINE",
        "subtitle": "Instant Cross-Module Record Resolution - Direct Jump Links",
        "motion": "zoom_in",
        "duration": 4
    },
    {
        "id": "scene_33",
        "img": r"screenshots\Dark_Mode\Phase_02_Lead_Pipeline\03_Lead_Pipeline_Kanban_Board_Dark.png",
        "title": "32. ANDROID MOBILE SYNC TUNNEL",
        "subtitle": "Real-Time WebSocket Sync with Capacitor Field Companion App",
        "motion": "zoom_in",
        "duration": 3.5
    },
    # Phase 6: System Configuration
    {
        "id": "scene_34",
        "img": r"screenshots\Dark_Mode\Phase_06_System_and_Settings\59_Settings_Identity_Profile_Dark.png",
        "title": "33. SYSTEM CONFIGURATION & SECURITY",
        "subtitle": "6 Enterprise Control Modules - PIN-Protected Administrative Tabs",
        "motion": "zoom_in",
        "duration": 4
    },
    {
        "id": "scene_35",
        "img": r"screenshots\Dark_Mode\Phase_06_System_and_Settings\60_Settings_System_Config_Dark.png",
        "title": "34. MASTER WHATSAPP GATEWAY",
        "subtitle": "Dual-Use Recovery & Lead Dispatch Gateway Configuration",
        "motion": "zoom_in",
        "duration": 4
    },
    {
        "id": "scene_36",
        "img": r"screenshots\Dark_Mode\Phase_06_System_and_Settings\61_Settings_Theme_and_Appearance_Dark.png",
        "title": "35. MULTI-THEME ENGINE & F3 SHORTCUT",
        "subtitle": "Light, Dark, OS Sync, and Automated Day/Night Scheduling",
        "motion": "zoom_in",
        "duration": 4
    },
    {
        "id": "scene_37",
        "img": r"screenshots\Dark_Mode\Phase_06_System_and_Settings\63_Settings_Advanced_Security_Dark.png",
        "title": "36. ACTIVE SESSIONS & DEVICE TERMINATION",
        "subtitle": "Configurable Inactivity Timeout - Remote Session Killswitch",
        "motion": "pan_down",
        "duration": 4
    },
    {
        "id": "scene_38",
        "img": r"screenshots\Dark_Mode\Phase_06_System_and_Settings\68_Settings_Backup_and_Restore_Dark.png",
        "title": "37. AES-256 CLOUD DISASTER RECOVERY",
        "subtitle": "Encrypted .pnpcrm Files - Automated Cloudflare R2 Offsite Vault",
        "motion": "zoom_in",
        "duration": 4
    },
    # Phase 7: Light Mode
    {
        "id": "scene_39",
        "img": r"screenshots\Light_Mode\Phase_01_Auth_and_Entry\01_Login_Page_Light.png",
        "title": "38. CRISP STUDIO LIGHT MODE",
        "subtitle": "Daylight-Optimized Contrast - 100% Feature & UI Parity",
        "motion": "zoom_in",
        "duration": 4
    },
    {
        "id": "scene_40",
        "img": r"screenshots\Light_Mode\Phase_02_Lead_Pipeline\04_Lead_Pipeline_List_View_Light.png",
        "title": "39. DAYLIGHT PIPELINE WORKSPACE",
        "subtitle": "Effortless Daylight Operations - Clean Typography & Accents",
        "motion": "pan_down",
        "duration": 4
    },
    # Phase 8: Closing
    {
        "id": "scene_41",
        "img": r"screenshots\Dark_Mode\Phase_01_Auth_and_Entry\01_Login_Page_Dark.png",
        "title": "PNP CRM - PRODUCTION READY",
        "subtitle": "Built with Next.js 15 | React 19 | SQLite | Capacitor | Tailwind 4",
        "motion": "zoom_in",
        "duration": 5
    }
]

def render_scene(cfg):
    scene_id = cfg["id"]
    out_file = f"{SCENES_DIR}/{scene_id}.mp4".replace("\\", "/")
    img_path = cfg["img"]
    duration = cfg["duration"]
    motion = cfg["motion"]

    title_file = f"{TEMP_DIR}/{scene_id}_title.txt"
    sub_file = f"{TEMP_DIR}/{scene_id}_sub.txt"

    with open(title_file, "w", encoding="utf-8") as f:
        f.write(cfg["title"])
    with open(sub_file, "w", encoding="utf-8") as f:
        f.write(cfg["subtitle"])

    fps = 30
    total_frames = int(duration * fps)

    if motion == "zoom_in":
        zoom_expr = "min(zoom+0.0012,1.12)"
        x_expr = "iw/2-(iw/zoom/2)"
        y_expr = "ih/2-(ih/zoom/2)"
    elif motion == "pan_down":
        zoom_expr = "1.08"
        x_expr = "iw/2-(iw/zoom/2)"
        y_expr = f"(ih-ih/zoom)*(on/{total_frames})"
    elif motion == "pan_right":
        zoom_expr = "1.08"
        x_expr = f"(iw-iw/zoom)*(on/{total_frames})"
        y_expr = "ih/2-(ih/zoom/2)"
    else:
        zoom_expr = "1.05"
        x_expr = "iw/2-(iw/zoom/2)"
        y_expr = "ih/2-(ih/zoom/2)"

    vf = (
        f"scale=1920:1080:force_original_aspect_ratio=decrease,"
        f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2,"
        f"zoompan=z='{zoom_expr}':x='{x_expr}':y='{y_expr}':d={total_frames}:s=1920x1080:fps={fps},"
        f"drawbox=y=ih-135:color=black@0.75:width=iw:height=135:t=fill,"
        f"drawbox=y=ih-135:color=0x9333ea:width=iw:height=4:t=fill,"
        f"drawtext=fontfile='{FONT_BOLD}':textfile='{title_file}':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=h-100,"
        f"drawtext=fontfile='{FONT_REGULAR}':textfile='{sub_file}':fontcolor=0xc084fc:fontsize=22:x=(w-text_w)/2:y=h-50"
    )

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", img_path,
        "-vf", vf,
        "-c:v", "libx264",
        "-t", str(duration),
        "-pix_fmt", "yuv420p",
        "-preset", "faster",
        out_file
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        size_kb = os.path.getsize(out_file) // 1024
        print(f"  [+] {scene_id}.mp4 generated ({size_kb} KB)")
        return True
    else:
        print(f"  [!] Error generating {scene_id}: {res.stderr[-200:]}")
        return False

def combine_all_scenes():
    clips = sorted([f for f in os.listdir(SCENES_DIR) if f.endswith(".mp4")])
    if not clips:
        print("[!] No clips to combine.")
        return False

    concat_file = f"{TEMP_DIR}/concat_list.txt"
    with open(concat_file, "w", encoding="utf-8") as f:
        for c in clips:
            f.write(f"file '{c}'\n")

    print(f"\n[*] Combining {len(clips)} scenes into final output video...")
    print(f"    Output Destination: {OUTPUT_VIDEO}")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", f"../{concat_file}",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "medium",
        "-crf", "18",
        f"../../{OUTPUT_VIDEO}"
    ]

    res = subprocess.run(cmd, cwd=SCENES_DIR, capture_output=True, text=True)
    if res.returncode == 0:
        size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
        print(f"\n[+] FINAL COMBINED VIDEO SUCCESSFULLY CREATED!")
        print(f"    Path: {OUTPUT_VIDEO}")
        print(f"    Size: {size_mb:.2f} MB")
        return True
    else:
        print(f"[!] Combining failed: {res.stderr[-300:]}")
        return False

def main():
    os.makedirs(SCENES_DIR, exist_ok=True)
    os.makedirs(FINAL_DIR, exist_ok=True)
    print("=" * 65)
    print("PNP CRM - BATCH SCENE GENERATION ENGINE (41 SCENES)")
    print("=" * 65)

    success_count = 0
    for idx, cfg in enumerate(SCENES_CONFIG, 1):
        print(f"[{idx:02d}/{len(SCENES_CONFIG)}] Generating {cfg['id']}: {cfg['title']}...")
        if render_scene(cfg):
            success_count += 1

    print("\n" + "=" * 65)
    print(f"[+] Scene Rendering Complete! {success_count}/{len(SCENES_CONFIG)} scenes created.")
    print("=" * 65)

    if success_count == len(SCENES_CONFIG):
        if combine_all_scenes():
            print("\n[*] Purging temporary build directory (_temp_video_build)...")
            shutil.rmtree(TEMP_DIR)
            print("[+] Temp directory purged cleanly.")
            print(f"[+] ONLY the final video remains in:\n    {FINAL_DIR}")

            print("\n[*] Restoring database to original clean state...")
            import scripts.demo_data_manager as db_mgr
            db_mgr.restore()
            db_mgr.status()
    else:
        print(f"[!] Some scenes failed. Missing: {len(SCENES_CONFIG) - success_count}")

if __name__ == "__main__":
    main()
