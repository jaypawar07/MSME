import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let body: any = {};

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { event, properties } = body;

    if (!event || typeof event !== "string") {
      return NextResponse.json({ error: "Event name is required" }, { status: 400 });
    }

    const userId = (session?.user as any)?.id || (properties?.userId as string) || null;

    const loggedEvent = await prisma.analyticsEvent.create({
      data: {
        userId,
        event,
        properties: properties ? JSON.stringify(properties) : null,
      },
    });

    return NextResponse.json({ success: true, id: loggedEvent.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to log analytics event:", error);
    return NextResponse.json(
      { error: "Internal server error logging event" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return aggregate counts for the logged in user or admin summary
    const events = await prisma.analyticsEvent.findMany({
      take: 100,
      orderBy: { timestamp: "desc" },
    });

    const counts = await prisma.analyticsEvent.groupBy({
      by: ["event"],
      _count: { _all: true },
    });

    return NextResponse.json({
      recentEvents: events,
      eventSummary: counts.map((c: any) => ({
        event: c.event,
        count: c._count._all,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch analytics events:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
