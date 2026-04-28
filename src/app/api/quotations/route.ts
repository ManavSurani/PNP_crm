import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

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
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

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
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Auto calculate totals
    const itemsTotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
    const subtotal = (
      designCost + 
      materialCost + 
      labourCost + 
      transportCost + 
      supervisionCharges + 
      siteVisitCharges + 
      itemsTotal
    );
    
    const amountAfterDiscount = subtotal - discount;
    const gstAmount = (amountAfterDiscount * gstPercentage) / 100;
    const finalTotal = amountAfterDiscount + gstAmount;

    // Generate unique Quotation Number
    const count = await prisma.quotation.count();
    const quotationNo = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const quotation = await prisma.quotation.create({
      data: {
        leadId,
        quotationNo,
        packageType,
        designCost,
        materialCost,
        labourCost,
        transportCost,
        supervisionCharges,
        siteVisitCharges,
        discount,
        gstPercentage,
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
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        },
        milestones: {
          create: milestones.map((m: any) => ({
            description: m.description,
            percentage: m.percentage,
            amount: m.amount,
            status: "PENDING",
            dueDate: m.dueDate ? new Date(m.dueDate) : null
          }))
        }
      } as any,
      include: { items: true, milestones: true, lead: true } as any
    });

    // Log this action to the Notes Timeline
    await prisma.note.create({
      data: {
        leadId,
        content: `Quotation ${quotationNo} generated for ₹${finalTotal.toFixed(2)}`
      }
    });

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("[QUOTATIONS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
