import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const quotations = await prisma.quotation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        lead: {
          select: { customerName: true, contactNumber: true, serviceType: true, fullAddress: true }
        },
        items: true,
        milestones: true
      } as any
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error("[QUOTATIONS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch quotations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { 
      leadId, 
      packageType,
      designCost = 0,
      materialCost = 0, 
      labourCost = 0, 
      transportCost = 0,
      supervisionCharges = 0,
      siteVisitCharges = 0,
      discount = 0,
      gstPercentage = 18, 
      items,
      milestones = [],
      workScope = "",
      milestoneTerms = "",
      projectTimeline = ""
    } = body;

    if (!leadId || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing required fields (leadId, items)" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Auto calculate totals
      const itemsTotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
      const subtotal = (
        parseFloat(designCost) + 
        parseFloat(materialCost) + 
        parseFloat(labourCost) + 
        parseFloat(transportCost) + 
        parseFloat(supervisionCharges) + 
        parseFloat(siteVisitCharges) + 
        itemsTotal
      );
      
      const amountAfterDiscount = subtotal - parseFloat(discount);
      const gstAmount = (amountAfterDiscount * parseFloat(gstPercentage)) / 100;
      const finalTotal = amountAfterDiscount + gstAmount;

      // 2. Generate unique Quotation Number
      const count = await tx.quotation.count();
      const quotationNo = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      // 3. Create Quotation with Items and Milestones
      const quotation = await tx.quotation.create({
        data: {
          leadId,
          quotationNo,
          packageType,
          designCost: parseFloat(designCost),
          materialCost: parseFloat(materialCost),
          labourCost: parseFloat(labourCost),
          transportCost: parseFloat(transportCost),
          supervisionCharges: parseFloat(supervisionCharges),
          siteVisitCharges: parseFloat(siteVisitCharges),
          discount: parseFloat(discount),
          gstPercentage: parseFloat(gstPercentage),
          gstAmount,
          finalTotal,
          status: "SENT",
          workScope,
          milestoneTerms,
          projectTimeline,
          version: 1,
          items: {
            create: items.map((item: any) => ({
              section: item.section || "GENERAL",
              description: item.description,
              quantity: parseFloat(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
              totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice)
            }))
          },
          milestones: {
            create: milestones.map((m: any) => ({
              description: m.description,
              percentage: parseFloat(m.percentage),
              amount: parseFloat(m.amount),
              status: "PENDING",
              dueDate: m.dueDate ? new Date(m.dueDate) : null
            }))
          }
        } as any,
        include: { items: true, milestones: true, lead: true } as any
      });

      // 4. Log this action to the Notes Timeline
      await tx.leadNote.create({
        data: {
          leadId,
          content: `📄 Quotation ${quotationNo} generated for ₹${finalTotal.toLocaleString()}`
        }
      });

      return quotation;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[QUOTATIONS_POST]", error);
    return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 });
  }
}
