import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN" && (session.user as any).role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // leads, revenue, profit

    let csvData = "";

    if (type === "leads") {
      const leads = await prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        include: { assignedStaff: { select: { name: true } } }
      });
      csvData = "Name,Phone,Email,Source,Service,Status,Staff,Date\n";
      leads.forEach(l => {
        csvData += `"${l.customerName}","${l.contactNumber}","${l.inquirySource}","${l.serviceType}","${l.status}","${l.assignedStaff?.name || 'Unassigned'}","${l.createdAt.toISOString()}"\n`;
      });
    } else if (type === "profit") {
      const orders = await prisma.order.findMany({
        include: {
          lead: { 
            select: { 
              customerName: true,
              transactions: { select: { amount: true, type: true } }
            } 
          }
        }
      });
      csvData = "Order No,Customer,Revenue,Expenses,Net Profit,Margin %\n";
      orders.forEach((o: any) => {
        const rev = o.lead.transactions
          .filter((t: any) => t.type === "RECEIVED")
          .reduce((s: number, p: any) => s + p.amount, 0);
        const exp = o.lead.transactions
          .filter((t: any) => t.type === "EXPENSE")
          .reduce((s: number, e: any) => s + e.amount, 0);
        const profit = rev - exp;
        const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;
        csvData += `"${o.orderNo}","${o.lead.customerName}",${rev},${exp},${profit},${margin}%\n`;
      });
    } else {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=pnp_report_${type}_${new Date().toISOString().split('T')[0]}.csv`
      }
    });
  } catch (error) {
    console.error("[REPORTS_EXPORT]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
