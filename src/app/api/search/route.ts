import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 1) {
      return NextResponse.json([]);
    }

    const searchTerm = query.trim().toLowerCase();

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
      let type = "LEAD";

      if (lead.isCancelled) {
        location = "Canceled Records";
        href = `/leads/${lead.id}`;
        type = "CANCELED";
      } else if (lead.isProjectCompleted) {
        location = "Complete Projects";
        href = `/customers/${lead.id}`;
        type = "CUSTOMER";
      } else if (lead.status === "WON_ORDER") {
        location = "Customer Hub";
        href = `/customers/${lead.id}`;
        type = "CUSTOMER";
      } else if (lead.status === "FOLLOW_UP") {
        location = "Interested Leads";
        href = `/leads/${lead.id}`;
      } else if (lead.status === "MEETING_SCHEDULED") {
        location = "Site Visits";
        href = `/leads/${lead.id}`;
      }

      const title = lead.project?.name || lead.customerName;
      const subtitle = (lead.serviceType || "").replace(/_/g, " ");
      const phone = lead.contactNumber || "";

      // Priority scoring: 1 = title prefix, 2 = subtitle prefix, 3 = phone prefix, 4 = substring
      let score = 4;
      if (title.toLowerCase().startsWith(searchTerm)) {
        score = 1;
      } else if (subtitle.toLowerCase().startsWith(searchTerm)) {
        score = 2;
      } else if (phone.startsWith(searchTerm)) {
        score = 3;
      }

      results.push({
        id: lead.id,
        type: type,
        title: title,
        subtitle: subtitle,
        phone: phone,
        location: location,
        href: href,
        score: score
      });
    });

    // Format Suppliers
    suppliers.forEach(s => {
      const title = s.name;
      const phone = s.phone || "";
      let score = 4;
      if (title.toLowerCase().startsWith(searchTerm)) {
        score = 1;
      } else if (phone.startsWith(searchTerm)) {
        score = 3;
      }

      results.push({
        id: s.id,
        type: "SUPPLIER",
        title: title,
        subtitle: "Global Supplier",
        phone: phone,
        location: "Vendor Directory",
        href: "/suppliers",
        score: score
      });
    });

    // Format Project Vendors
    projectVendors.forEach(v => {
      const title = v.name;
      const phone = v.phone || "";
      let score = 4;
      if (title.toLowerCase().startsWith(searchTerm)) {
        score = 1;
      } else if (phone.startsWith(searchTerm)) {
        score = 3;
      }

      results.push({
        id: v.id,
        type: "VENDOR",
        title: title,
        subtitle: "Project Vendor",
        phone: phone,
        location: "Vendor Directory",
        href: "/fields",
        score: score
      });
    });

    // Sort by prefix priority score, then alphabetically
    results.sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      return a.title.localeCompare(b.title);
    });

    // Cleanly cap to top 10 results and remove internal score before responding
    const capped = results.slice(0, 10).map(({ score, ...item }) => item);

    return NextResponse.json(capped);
  } catch (error) {
    console.error("[GLOBAL_SEARCH_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
