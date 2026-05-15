import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const leadId = req.nextUrl.searchParams.get("leadId");
    const type = req.nextUrl.searchParams.get("type") as "RECEIVED" | "EXPENSE" | null;
    
    const where: any = {};
    if (leadId) {
      where.leadId = leadId;
    } else {
      where.OR = [
        { leadId: null },
        { lead: { isCancelled: false } }
      ];
    }
    if (type) where.type = type;

    const transactions = await prisma.leadTransaction.findMany({
      where,
      include: {
        lead: {
          select: { customerName: true }
        }
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { 
      leadId, type, amount, date, paidTo, category, paymentMode, description, 
      source = "GENERAL", isSystemGenerated = false 
    } = body;

    if (!leadId || !type || !amount || !date || !paidTo || !category || !paymentMode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return NextResponse.json({ error: "Invalid amount format" }, { status: 400 });
    }

    // CREATE THE PRIMARY TRANSACTION
    const transaction = await prisma.leadTransaction.create({
      data: {
        leadId,
        type,
        amount: parsedAmount,
        date: new Date(date),
        paidTo,
        category,
        paymentMode,
        description: description || null,
        // @ts-ignore
        source,
        // @ts-ignore
        isSystemGenerated
      },
    });

    // LOG FINANCIAL EVENT
    // @ts-ignore
    await prisma.leadFinancialLog.create({
      data: {
        leadId,
        action: type === "RECEIVED" ? "INCOME_ADDED" : "EXPENSE_ADDED",
        details: `${type === "RECEIVED" ? "Income" : "Expense"} of ₹${parsedAmount.toLocaleString()} added (${category} - ${paidTo})`,
        amount: parsedAmount
      }
    });

    // --- UNIFIED FINANCIAL SYNC LOGIC ---
    const hasFinal = await prisma.leadTransaction.findFirst({
      where: { leadId, category: "Final Payment" }
    });
    
    await prisma.lead.update({
      where: { id: leadId },
      data: { isFinanciallyClosed: !!hasFinal }
    });

    if (!hasFinal) {
      const existingAdj = await prisma.leadTransaction.findFirst({
        where: { leadId, category: "Adjustment", isSystemGenerated: true, source: "DESIGN" }
      });
      if (existingAdj) {
        await prisma.leadTransaction.delete({ where: { id: existingAdj.id } });
        // @ts-ignore
        await prisma.leadFinancialLog.create({
          data: { leadId, action: "AUTO_EXPENSE_DELETED", details: "System adjustment removed (Project reopened)" }
        });
      }
    } else {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { transactions: true }
      });
      if (lead) {
        // @ts-ignore
        const initialDeal = lead.initialDealAmount || 0;
        const totalReceived = lead.transactions.filter(t => t.type === "RECEIVED").reduce((sum, t) => sum + t.amount, 0);
        // @ts-ignore
        const totalGeneralExpenses = lead.transactions.filter(t => t.type === "EXPENSE" && t.source !== "DESIGN").reduce((sum, t) => sum + t.amount, 0);
        const remainingDue = (initialDeal + totalGeneralExpenses) - totalReceived;

        const existingAdj = await prisma.leadTransaction.findFirst({
          where: { leadId, category: "Adjustment", isSystemGenerated: true, source: "DESIGN" }
        });

        if (remainingDue > 0) {
          if (!existingAdj) {
            await prisma.leadTransaction.create({
              data: {
                leadId, type: "EXPENSE", amount: remainingDue, date: new Date(),
                paidTo: "Design Module", category: "Adjustment", paymentMode: "SYSTEM",
                description: "Auto transferred from Final Payment remaining due",
                // @ts-ignore
                source: "DESIGN", isSystemGenerated: true
              }
            });
            // @ts-ignore
            await prisma.leadFinancialLog.create({
              data: { leadId, action: "AUTO_EXPENSE_GENERATED", details: `Remaining due auto-adjusted — ₹${remainingDue.toLocaleString()}`, amount: remainingDue }
            });
          } else if (existingAdj.amount !== remainingDue) {
            await prisma.leadTransaction.update({
              where: { id: existingAdj.id },
              data: { amount: remainingDue }
            });
            // @ts-ignore
            await prisma.leadFinancialLog.create({
              data: { leadId, action: "AUTO_EXPENSE_UPDATED", details: `System adjustment updated — ₹${remainingDue.toLocaleString()}`, amount: remainingDue }
            });
          }
        } else if (existingAdj) {
          await prisma.leadTransaction.delete({ where: { id: existingAdj.id } });
        }
      }
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS_POST]", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });

    const existing = await prisma.leadTransaction.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.leadTransaction.delete({ where: { id } });

    if (existing.leadId) {
      // @ts-ignore
      await prisma.leadFinancialLog.create({
        data: {
          leadId: existing.leadId,
          action: "TRANSACTION_DELETED",
          details: `${existing.type === "RECEIVED" ? "Income" : "Expense"} of ₹${existing.amount.toLocaleString()} deleted (${existing.category})`,
          amount: existing.amount
        }
      });

      // --- UNIFIED FINANCIAL SYNC LOGIC ---
      const hasFinal = await prisma.leadTransaction.findFirst({
        where: { leadId: existing.leadId, category: "Final Payment" }
      });
      
      await prisma.lead.update({
        where: { id: existing.leadId },
        data: { isFinanciallyClosed: !!hasFinal }
      });

      if (!hasFinal) {
        const existingAdj = await prisma.leadTransaction.findFirst({
          where: { leadId: existing.leadId, category: "Adjustment", isSystemGenerated: true, source: "DESIGN" }
        });
        if (existingAdj) {
          await prisma.leadTransaction.delete({ where: { id: existingAdj.id } });
          // @ts-ignore
          await prisma.leadFinancialLog.create({
            data: { leadId: existing.leadId, action: "AUTO_EXPENSE_DELETED", details: "System adjustment removed (Project reopened)" }
          });
        }
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TRANSACTIONS_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, amount, date, paidTo, category, paymentMode, description, source, isSystemGenerated } = body;

    if (!id) return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });

    const existing = await prisma.leadTransaction.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.leadTransaction.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        date: date ? new Date(date) : undefined,
        paidTo,
        category,
        paymentMode,
        description,
        // @ts-ignore
        source,
        // @ts-ignore
        isSystemGenerated
      },
    });

    // Log financial event
    if (existing.leadId) {
      // @ts-ignore
      await prisma.leadFinancialLog.create({
        data: {
          leadId: existing.leadId,
          action: "TRANSACTION_UPDATED",
          details: `${existing.type === "RECEIVED" ? "Income" : "Expense"} record updated. New amount: ₹${updated.amount.toLocaleString()}`,
          amount: updated.amount
        }
      });

      // --- UNIFIED FINANCIAL SYNC LOGIC ---
      const hasFinal = await prisma.leadTransaction.findFirst({
        where: { leadId: existing.leadId, category: "Final Payment" }
      });
      
      await prisma.lead.update({
        where: { id: existing.leadId },
        data: { isFinanciallyClosed: !!hasFinal }
      });

      if (!hasFinal) {
        const existingAdj = await prisma.leadTransaction.findFirst({
          where: { leadId: existing.leadId, category: "Adjustment", isSystemGenerated: true, source: "DESIGN" }
        });
        if (existingAdj) {
          await prisma.leadTransaction.delete({ where: { id: existingAdj.id } });
          // @ts-ignore
          await prisma.leadFinancialLog.create({
            data: { leadId: existing.leadId, action: "AUTO_EXPENSE_DELETED", details: "System adjustment removed (Project reopened)" }
          });
        }
      } else {
        const lead = await prisma.lead.findUnique({
          where: { id: existing.leadId },
          include: { transactions: true }
        });
        if (lead) {
          // @ts-ignore
          const initialDeal = lead.initialDealAmount || 0;
          const totalReceived = lead.transactions.filter(t => t.type === "RECEIVED").reduce((sum, t) => sum + t.amount, 0);
          // @ts-ignore
          const totalGeneralExpenses = lead.transactions.filter(t => t.type === "EXPENSE" && t.source !== "DESIGN").reduce((sum, t) => sum + t.amount, 0);
          const remainingDue = (initialDeal + totalGeneralExpenses) - totalReceived;

          const existingAdj = await prisma.leadTransaction.findFirst({
            where: { leadId: existing.leadId, category: "Adjustment", isSystemGenerated: true, source: "DESIGN" }
          });

          if (remainingDue > 0) {
            if (!existingAdj) {
              await prisma.leadTransaction.create({
                data: {
                  leadId: existing.leadId, type: "EXPENSE", amount: remainingDue, date: new Date(),
                  paidTo: "Design Module", category: "Adjustment", paymentMode: "SYSTEM",
                  description: "Auto transferred from Final Payment remaining due (via Edit)",
                  // @ts-ignore
                  source: "DESIGN", isSystemGenerated: true
                }
              });
              // @ts-ignore
              await prisma.leadFinancialLog.create({
                data: { leadId: existing.leadId, action: "AUTO_EXPENSE_GENERATED", details: `Remaining due auto-adjusted — ₹${remainingDue.toLocaleString()}`, amount: remainingDue }
              });
            } else if (existingAdj.amount !== remainingDue) {
              await prisma.leadTransaction.update({
                where: { id: existingAdj.id },
                data: { amount: remainingDue }
              });
              // @ts-ignore
              await prisma.leadFinancialLog.create({
                data: { leadId: existing.leadId, action: "AUTO_EXPENSE_UPDATED", details: `System adjustment updated — ₹${remainingDue.toLocaleString()}`, amount: remainingDue }
              });
            }
          } else if (existingAdj) {
            await prisma.leadTransaction.delete({ where: { id: existingAdj.id } });
          }
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[TRANSACTIONS_PUT]", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}
