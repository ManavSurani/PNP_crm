import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

function sanitizeCsvText(val: string | null | undefined): string {
  if (val == null) return "";
  const str = String(val);
  // Do not alter pure phone numbers like "+91 98765-43210"
  if (/^\+?[\d\s\-()]+$/.test(str)) {
    return str.replace(/"/g, '""');
  }
  // Neutralize formula injection characters
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str.replace(/"/g, '""')}`;
  }
  return str.replace(/"/g, '""');
}

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
        csvData += `"${sanitizeCsvText(l.customerName)}","${sanitizeCsvText(l.contactNumber)}","${sanitizeCsvText(l.inquirySource)}","${sanitizeCsvText(l.serviceType)}","${sanitizeCsvText(l.status)}","${sanitizeCsvText(l.assignedStaff?.name || 'Unassigned')}","${l.createdAt.toISOString()}"\n`;
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
        csvData += `"${sanitizeCsvText(o.orderNo)}","${sanitizeCsvText(o.lead.customerName)}",${rev},${exp},${profit},${margin}%\n`;
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
