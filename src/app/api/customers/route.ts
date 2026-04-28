import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const customers = await prisma.lead.findMany({
      where: {
        status: "WON_ORDER"
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        assignedStaff: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("[CUSTOMERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
