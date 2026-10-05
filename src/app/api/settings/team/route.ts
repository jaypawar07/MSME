import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role || "OWNER";

    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only the Company Owner can invite team members." },
        { status: 403 }
      );
    }

    const { name, email, role } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required to send an invitation." },
        { status: 400 }
      );
    }

    const memberRole = role === "STAFF" ? "STAFF" : "ACCOUNTANT";

    const member = await (prisma as any).teamMember.create({
      data: {
        ownerUserId: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: memberRole,
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      member,
      message: `Invitation sent to ${email} as ${memberRole}.`,
    });
  } catch (error: any) {
    console.error("Team invitation error:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role || "OWNER";

    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only the Company Owner can remove team members." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    // Verify ownership before deleting
    await (prisma as any).teamMember.deleteMany({
      where: {
        id: memberId,
        ownerUserId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully.",
    });
  } catch (error: any) {
    console.error("Remove team member error:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
