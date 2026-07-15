/**
 * PNP CRM — Mobile Sync API Route
 * Path: src/app/api/mobile/sync/route.ts
 *
 * RULES:
 * - This is a BRAND NEW file. No existing CRM file was modified.
 * - This endpoint accepts data from the mobile app and merges it safely into the CRM database.
 * - Protected by a secret API key (MOBILE_SYNC_SECRET in .env).
 * - Uses conflict-safe upsert — never overwrites existing data blindly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Types for incoming mobile sync payload ──────────────────────────────────

interface MobileLead {
  mobileId: string;         // UUID generated on the phone
  customerName: string;
  contactNumber: string;
  alternateNumber?: string;
  fullAddress?: string;
  inquirySource: string;
  referenceName?: string;
  serviceType: string;
  priority: string;
  status: string;
  requirementDetails?: string;
  siteLocation?: string;
  budgetRange?: string;
  createdAt: string;        // ISO string from phone
}

interface MobileFollowUp {
  mobileId: string;
  leadContactNumber: string; // Used to find the lead in CRM
  scheduledAt: string;
  outcome?: string;
  notes?: string;
  status: string;
}

interface SyncPayload {
  leads?: MobileLead[];
  followUps?: MobileFollowUp[];
  syncedAt: string;
  deviceId: string;
}

// ── POST /api/mobile/sync ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── 1. Authenticate the request with secret API key ──
    const authHeader = request.headers.get('x-mobile-sync-key');
    const expectedKey = process.env.MOBILE_SYNC_SECRET;

    if (!expectedKey) {
      return NextResponse.json(
        { error: 'Server not configured for mobile sync. Add MOBILE_SYNC_SECRET to .env' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid sync key.' },
        { status: 401 }
      );
    }

    // ── 2. Parse the payload ──
    const body: SyncPayload = await request.json();
    const { leads = [], followUps = [] } = body;

    const results = {
      leadsInserted: 0,
      leadsSkipped: 0,    // Already exist in CRM (by phone number)
      followUpsInserted: 0,
      followUpsSkipped: 0,
      errors: [] as string[],
    };

    // ── 3. Process Leads ──
    for (const lead of leads) {
      try {
        // Conflict check: if a lead with this phone number already exists, skip it
        const existing = await prisma.lead.findFirst({
          where: { contactNumber: lead.contactNumber },
        });

        if (existing) {
          results.leadsSkipped++;
          continue;
        }

        // Safe insert — only if no conflict
        await prisma.lead.create({
          data: {
            customerName:      lead.customerName,
            contactNumber:     lead.contactNumber,
            alternateNumber:   lead.alternateNumber ?? null,
            fullAddress:       lead.fullAddress ?? null,
            inquirySource:     lead.inquirySource || 'OTHER',
            referenceName:     lead.referenceName ?? null,
            serviceType:       lead.serviceType || 'OTHER',
            priority:          lead.priority || 'MEDIUM',
            status:            lead.status || 'NEW_INQUIRY',
            requirementDetails: lead.requirementDetails ?? null,
            siteLocation:      lead.siteLocation ?? null,
            budgetRange:       lead.budgetRange ?? null,
            // Tag the lead as coming from mobile for traceability
            normalizedPhone:   lead.contactNumber.replace(/\D/g, ''),
          },
        });

        results.leadsInserted++;
      } catch (err: any) {
        results.errors.push(`Lead ${lead.customerName}: ${err.message}`);
      }
    }

    // ── 4. Process Follow-Ups ──
    for (const fu of followUps) {
      try {
        // Find the lead by contact number
        const lead = await prisma.lead.findFirst({
          where: { contactNumber: fu.leadContactNumber },
        });

        if (!lead) {
          results.followUpsSkipped++;
          results.errors.push(`Follow-up: No lead found with number ${fu.leadContactNumber}`);
          continue;
        }

        await prisma.followUp.create({
          data: {
            leadId:       lead.id,
            scheduledDate: new Date(fu.scheduledAt),
            outcome:      fu.outcome || 'NOT_PICKED',
            noteGiven:    fu.notes ?? null,
          },
        });

        results.followUpsInserted++;
      } catch (err: any) {
        results.errors.push(`FollowUp for ${fu.leadContactNumber}: ${err.message}`);
      }
    }

    // ── 5. Return summary ──
    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      results,
    });

  } catch (error: any) {
    console.error('[Mobile Sync] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during sync', detail: error.message },
      { status: 500 }
    );
  }
}

// ── GET /api/mobile/sync — Health check ────────────────────────────────────
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('x-mobile-sync-key');
  const expectedKey = process.env.MOBILE_SYNC_SECRET;

  if (!expectedKey || authHeader !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return current CRM stats so the mobile app knows it is connected
  try {
    const [totalLeads, pendingFollowUps, scheduledMeetings] = await Promise.all([
      prisma.lead.count({ where: { isCancelled: false } }),
      prisma.followUp.count({ where: { outcome: 'PENDING' } }),
      prisma.meeting.count({ where: { status: 'SCHEDULED' } }),
    ]);

    return NextResponse.json({
      connected: true,
      serverTime: new Date().toISOString(),
      stats: { totalLeads, pendingFollowUps, scheduledMeetings },
    });
  } catch (error: any) {
    return NextResponse.json({ connected: false, error: error.message }, { status: 500 });
  }
}
