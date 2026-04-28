import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    
    const requirement = await prisma.requirement.upsert({
      where: { leadId: id },
      update: { ...body },
      create: { 
        leadId: id,
        ...body 
      }
    });

    return NextResponse.json(requirement);
  } catch (error) {
    console.error("[REQUIREMENT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const requirement = await prisma.requirement.findUnique({
      where: { leadId: id }
    });

    return NextResponse.json(requirement);
  } catch (error) {
    console.error("[REQUIREMENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
