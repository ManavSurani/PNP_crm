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
        items: true
      }
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error("[QUOTATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const { 
      leadId, 
      materialCost, 
      labourCost, 
      transportCost, 
      gstPercentage, 
      items 
    } = body;

    if (!leadId || !items || !Array.isArray(items)) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    // Auto calculate totals
    const subtotal = materialCost + labourCost + transportCost + items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
    const gstAmount = (subtotal * gstPercentage) / 100;
    const finalTotal = subtotal + gstAmount;

    // Generate unique Quotation Number
    const count = await prisma.quotation.count();
    const quotationNo = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const quotation = await prisma.quotation.create({
      data: {
        leadId,
        quotationNo,
        materialCost,
        labourCost,
        transportCost,
        gstPercentage,
        gstAmount,
        finalTotal,
        status: "SENT",
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        }
      },
      include: { items: true, lead: true }
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
    return new NextResponse("Internal Error", { status: 500 });
  }
}
