import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const searchTerm = query.toLowerCase();

    // 1. Search Leads (includes Customers, Canceled, Completed)
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { customerName: { contains: searchTerm } },
          { contactNumber: { contains: searchTerm } },
          { alternateNumber: { contains: searchTerm } },
          { serviceType: { contains: searchTerm } },
          { project: { name: { contains: searchTerm } } }
        ]
      },
      take: 10,
      include: {
        project: {
          select: { name: true }
        }
      }
    });

    // 2. Search Vendors/Suppliers
    const suppliers = await prisma.supplier.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { phone: { contains: searchTerm } }
        ]
      },
      take: 5
    });

    // 3. Search Project Vendors
    const projectVendors = await prisma.projectVendor.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { phone: { contains: searchTerm } }
        ]
      },
      take: 5
    });

    const results: any[] = [];

    // Format Leads/Customers
    leads.forEach(lead => {
      let location = "Lead Pipeline";
      let href = `/leads/${lead.id}`;

      if (lead.isCancelled) {
        location = "Canceled Archive";
        href = `/leads/${lead.id}`; // Navigates to the specific record detail
      } else if (lead.isProjectCompleted) {
        location = "Complete Projects";
        href = `/customers/${lead.id}`;
      } else if (lead.status === "WON_ORDER") {
        location = "Customer Hub";
        href = `/customers/${lead.id}`;
      } else if (lead.status === "FOLLOW_UP") {
        location = "Interested Leads";
        href = `/leads/${lead.id}`;
      } else if (lead.status === "MEETING_SCHEDULED") {
        location = "Site Visits";
        href = `/leads/${lead.id}`;
      }

      results.push({
        id: lead.id,
        type: "LEAD",
        title: lead.project?.name || lead.customerName,
        subtitle: lead.serviceType.replace(/_/g, " "),
        phone: lead.contactNumber,
        location: location,
        href: href
      });
    });

    // Format Suppliers
    suppliers.forEach(s => {
      results.push({
        id: s.id,
        type: "SUPPLIER",
        title: s.name,
        subtitle: "Global Supplier",
        phone: s.phone,
        location: "Vendor Directory",
        href: "/suppliers"
      });
    });

    // Format Project Vendors
    projectVendors.forEach(v => {
      results.push({
        id: v.id,
        type: "VENDOR",
        title: v.name,
        subtitle: "Project Vendor",
        phone: v.phone,
        location: "Vendor Directory",
        href: "/fields"
      });
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("[GLOBAL_SEARCH_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
