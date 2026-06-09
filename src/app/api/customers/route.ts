import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customers = await prisma.lead.findMany({
      where: {
        status: "WON_ORDER",
        isCancelled: false,
        // @ts-ignore - newly added
        isProjectCompleted: false
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        assignedStaff: {
          select: { name: true }
        },
        project: {
          // @ts-ignore - name field exists in schema but IDE lag
          select: { id: true, name: true, startedOn: true }
        }
      }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("[CUSTOMERS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
