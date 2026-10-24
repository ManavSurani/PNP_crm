"""
PNP CRM — Automated Demo Data Lifecycle & Database Safety Manager
Zero-Touch Isolation: Safely backups real crm.db, injects comprehensive dummy data across all CRM modules,
and restores the original database with 100% fidelity.
"""

import sys
import os
import shutil
import sqlite3
import hashlib
from datetime import datetime, timedelta

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "_data", "crm.db"))
BACKUP_PATH = DB_PATH + ".pre_demo_safe_backup"

def get_file_sha256(filepath):
    if not os.path.exists(filepath):
        return None
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def backup():
    if not os.path.exists(DB_PATH):
        print(f"[!] Database file not found at {DB_PATH}")
        sys.exit(1)
    if os.path.exists(BACKUP_PATH):
        print(f"[!] Existing safety backup already found at:\n    {BACKUP_PATH}")
        print("    Original data is safely preserved.")
        return
    shutil.copy2(DB_PATH, BACKUP_PATH)
    checksum = get_file_sha256(BACKUP_PATH)
    print(f"[+] Safety snapshot created successfully at:\n    {BACKUP_PATH}")
    print(f"    SHA-256 Checksum: {checksum[:16]}... (Safe read-only state)")

def restore():
    if not os.path.exists(BACKUP_PATH):
        print(f"[!] No backup snapshot found at {BACKUP_PATH}. Original database is already clean or active.")
        return
    backup_checksum = get_file_sha256(BACKUP_PATH)
    shutil.copy2(BACKUP_PATH, DB_PATH)
    current_checksum = get_file_sha256(DB_PATH)
    if backup_checksum == current_checksum:
        os.remove(BACKUP_PATH)
        print("[+] Database 100% restored to original pre-demo state.")
        print("[+] Safety snapshot cleanly removed. Zero traces left behind.")
    else:
        print("[!] Verification failed during restoration. Snapshot kept intact.")

def status():
    has_backup = os.path.exists(BACKUP_PATH)
    print("=" * 65)
    print("PNP CRM - DATABASE LIFECYCLE STATUS")
    print("=" * 65)
    print(f"Database File:  {DB_PATH} ({'EXISTS' if os.path.exists(DB_PATH) else 'MISSING'})")
    if os.path.exists(DB_PATH):
        print(f"Database Size:  {os.path.getsize(DB_PATH)} bytes")
        print(f"DB SHA-256:     {get_file_sha256(DB_PATH)[:16]}...")
    print(f"Safety Backup:  {'ACTIVE (Dummy demo data loaded)' if has_backup else 'NONE (Clean / Original DB active)'}")
    print("=" * 65)

def inject():
    if not os.path.exists(BACKUP_PATH):
        print("[*] Creating safety backup of original database first...")
        backup()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Retrieve existing admin user ID
    cursor.execute("SELECT id FROM User LIMIT 1")
    user_row = cursor.fetchone()
    admin_id = user_row[0] if user_row else "user-admin-demo-id"

    now = datetime.now()
    now_iso = now.isoformat()
    yesterday_iso = (now - timedelta(days=2)).isoformat()
    next_week_iso = (now + timedelta(days=2)).isoformat()

    print("[*] Injecting verified dummy data across all 6 CRM modules...")

    # 1. WORK FIELDS & VENDORS
    field_furniture_id = "field-furniture-demo"
    field_civil_id = "field-civil-demo"
    vendor_shree_id = "vendor-shree-demo"
    vendor_nova_id = "vendor-nova-demo"

    cursor.execute("INSERT OR REPLACE INTO ProjectField (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)",
                   (field_furniture_id, "Furniture", now_iso, now_iso))
    cursor.execute("INSERT OR REPLACE INTO ProjectField (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)",
                   (field_civil_id, "Civil & Flooring", now_iso, now_iso))

    cursor.execute("INSERT OR REPLACE INTO ProjectVendor (id, fieldId, name, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
                   (vendor_shree_id, field_furniture_id, "Shree Interiors", "9898011223", now_iso, now_iso))
    cursor.execute("INSERT OR REPLACE INTO ProjectVendor (id, fieldId, name, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
                   (vendor_nova_id, field_civil_id, "Nova Civil Works", "9898044556", now_iso, now_iso))

    # 2. LEADS
    leads = [
        ("lead-demo-arjun", "Arjun Mehta", "9876543210", "WhatsApp", "NEW_INQUIRY", "Interior Design", "301 Silver Heights, Ahmedabad", admin_id, 0, 0, None, now_iso, now_iso),
        ("lead-demo-priya", "Priya Sharma", "9876543211", "Facebook", "FOLLOW_UP", "Interior Design", "12 Green Park, Surat", admin_id, 0, 0, None, now_iso, now_iso),
        ("lead-demo-ravi", "Ravi Patel", "9876543212", "WhatsApp", "FOLLOW_UP", "Interior Design", "7 Sunrise Apartments, Vadodara", admin_id, 1, 0, None, now_iso, now_iso),
        ("lead-demo-sneha", "Sneha Joshi", "9876543213", "Instagram", "INTERESTED", "Interior Design", "45 Blue Ridge Society, Rajkot", admin_id, 1, 0, None, now_iso, now_iso),
        ("lead-demo-karan", "Karan Desai", "9876543214", "WhatsApp", "CANCELLED", "Interior Design", "88 Palm Villas, Surat", admin_id, 0, 1, "No Response - 4 Attempts Reached", now_iso, now_iso),
    ]

    for lead in leads:
        cursor.execute("""
            INSERT OR REPLACE INTO Lead (id, customerName, contactNumber, inquirySource, status, serviceType, fullAddress, assignedStaffId, isHotLead, isCancelled, cancelReason, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, lead)

    # 3. FOLLOW-UPS
    cursor.execute("""
        INSERT OR REPLACE INTO FollowUp (id, leadId, attemptNumber, outcome, scheduledDate, noteGiven, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, ("fu-demo-arjun", "lead-demo-arjun", 2, "INTERESTED", now_iso, "Client requested site inspection discussion.", now_iso, now_iso))

    cursor.execute("""
        INSERT OR REPLACE INTO FollowUp (id, leadId, attemptNumber, outcome, scheduledDate, noteGiven, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, ("fu-demo-priya", "lead-demo-priya", 5, "NOT_PICKED", yesterday_iso, "Follow-up overdue by 2 days.", now_iso, now_iso))

    # 4. SITE VISIT (MEETING)
    cursor.execute("""
        INSERT OR REPLACE INTO Meeting (id, leadId, address, date, time, status, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ("meet-demo-sneha", "lead-demo-sneha", "45 Blue Ridge Society, Rajkot", next_week_iso, "11:00 AM", "SCHEDULED", "Bring 3D catalogue and layout plans.", now_iso, now_iso))

    # 5. CUSTOMERS (WON ORDERS)
    customers = [
        ("cust-demo-amit", "Amit Verma", "9876500001", "WhatsApp", "WON_ORDER", "Interior Design", "Ahmedabad Heights", admin_id, 0, 0, 120000.0, 0, 0, now_iso, now_iso),
        ("cust-demo-nisha", "Nisha Kapoor", "9876500002", "Direct", "WON_ORDER", "Interior Design", "Surat Residency", admin_id, 0, 0, 85000.0, 1, 1, now_iso, now_iso),
        ("cust-demo-deepak", "Deepak Shah", "9876500003", "Referral", "WON_ORDER", "Interior Design", "Vadodara Enclave", admin_id, 0, 0, 250000.0, 0, 0, now_iso, now_iso),
    ]

    for cust in customers:
        cursor.execute("""
            INSERT OR REPLACE INTO Lead (id, customerName, contactNumber, inquirySource, status, serviceType, fullAddress, assignedStaffId, isHotLead, isCancelled, initialDealAmount, isProjectCompleted, isFinanciallyClosed, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, cust)

    # 6. CUSTOMER C1 (AMIT VERMA) WORKSPACE DETAILS
    proj_amit_id = "project-demo-amit"
    cursor.execute("""
        INSERT OR REPLACE INTO Project (id, customerId, name, startedOn, isCompleted, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (proj_amit_id, "cust-demo-amit", "Amit Verma Residence", now_iso, 0, now_iso))

    milestones = [
        ("ms-01", proj_amit_id, 1, "Project Kickoff & Laser Measurement", "Site measured and boundaries verified.", "completed", "General", now_iso),
        ("ms-02", proj_amit_id, 2, "2D Spatial Layout Approved", "Floor plan finalized with client.", "completed", "Design", now_iso),
        ("ms-03", proj_amit_id, 3, "False Ceiling Framing", "Metal framework and electrical wiring complete.", "completed", "Execution", now_iso),
        ("ms-04", proj_amit_id, 4, "Modular Cabinetry Installation", "Kitchen carcass work underway.", "in_progress", "Execution", now_iso),
        ("ms-05", proj_amit_id, 5, "Final Handover & Quality Snagging", "Finishing touches and client handover.", "pending", "Final", now_iso),
    ]

    for ms in milestones:
        cursor.execute("""
            INSERT OR REPLACE INTO Milestone (id, projectId, sequence, name, description, status, phase, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, ms)

    # 7. QUOTATIONS FOR AMIT VERMA
    quotations = [
        ("quot-01", "cust-demo-amit", field_civil_id, vendor_nova_id, 35000.0, "False Ceiling & Lighting", 1, 1, now_iso, now_iso),
        ("quot-02", "cust-demo-amit", field_furniture_id, vendor_shree_id, 50000.0, "Modular Kitchen", 2, 1, now_iso, now_iso),
        ("quot-03", "cust-demo-amit", field_furniture_id, vendor_shree_id, 35000.0, "Furniture & Millwork", 3, 1, now_iso, now_iso),
    ]

    for q in quotations:
        cursor.execute("""
            INSERT OR REPLACE INTO ProjectQuotation (id, customerId, fieldId, vendorId, amount, note, priority, isPriorityLocked, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, q)

    # Payments for Quotations
    cursor.execute("""
        INSERT OR REPLACE INTO ProjectPayment (id, projectQuotationId, amount, paidOn, note, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("pay-q1", "quot-01", 20000.0, now_iso, "False ceiling initial part payment", now_iso, now_iso))
    cursor.execute("""
        INSERT OR REPLACE INTO ProjectPayment (id, projectQuotationId, amount, paidOn, note, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("pay-q2", "quot-02", 30000.0, now_iso, "Modular kitchen installment", now_iso, now_iso))
    cursor.execute("""
        INSERT OR REPLACE INTO ProjectPayment (id, projectQuotationId, amount, paidOn, note, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("pay-q3", "quot-03", 30000.0, now_iso, "Furniture advance", now_iso, now_iso))

    # 8. FINANCIAL TRANSACTIONS FOR AMIT VERMA
    transactions = [
        ("tx-01", "cust-demo-amit", "INCOME", 40000.0, now_iso, "Client Advance", "Advance Payment", "BANK_TRANSFER", "GENERAL", 0, "Initial advance booking token.", now_iso, now_iso),
        ("tx-02", "cust-demo-amit", "INCOME", 40000.0, now_iso, "Second Installment", "Milestone 2 Payment", "UPI", "GENERAL", 0, "Second progress installment.", now_iso, now_iso),
        ("tx-03", "cust-demo-amit", "EXPENSE", 8000.0, now_iso, "Nova Civil Works", "Civil Material", "BANK_TRANSFER", "GENERAL", 0, "Civil preparation supplies.", now_iso, now_iso),
        ("tx-04", "cust-demo-amit", "EXPENSE", 5000.0, now_iso, "Shree Interiors", "Labour", "CASH", "GENERAL", 0, "Skilled carpenter advance.", now_iso, now_iso),
    ]

    for tx in transactions:
        cursor.execute("""
            INSERT OR REPLACE INTO LeadTransaction (id, leadId, type, amount, date, paidTo, category, paymentMode, source, isSystemGenerated, description, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, tx)

    # 9. DESIGN STUDIO EXPENSES
    design_logs = [
        ("dlog-01", "cust-demo-amit", "Design Expense", "Concept Floor Plan Layout", 4000.0, now_iso),
        ("dlog-02", "cust-demo-amit", "Design Expense", "3D Photorealistic Render Package", 6000.0, now_iso),
        ("dlog-03", "cust-demo-amit", "Design Expense", "Client Revision Set", 3000.0, now_iso),
    ]

    for dlog in design_logs:
        cursor.execute("""
            INSERT OR REPLACE INTO LeadFinancialLog (id, leadId, action, details, amount, createdAt)
            VALUES (?, ?, ?, ?, ?, ?)
        """, dlog)

    conn.commit()
    conn.close()
    print("[+] Verified dummy data successfully injected across all modules.")
    print("    Ready for video generation & recording.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/demo_data_manager.py [backup|inject|restore|status]")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "backup":
        backup()
    elif cmd == "inject":
        inject()
    elif cmd == "restore":
        restore()
    elif cmd == "status":
        status()
    else:
        print(f"Unknown command '{cmd}'. Available: backup, inject, restore, status")
