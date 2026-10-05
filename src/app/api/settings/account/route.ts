import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
        { error: "Only the Company Owner can delete the company account." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { confirmCompanyName } = body;

    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const expectedName = (user.businessName || user.name || "").trim().toLowerCase();
    const providedName = (confirmCompanyName || "").trim().toLowerCase();

    if (expectedName !== providedName) {
      return NextResponse.json(
        {
          error: `Confirmation mismatch. Please type exactly "${user.businessName || user.name}" to confirm deletion.`,
        },
        { status: 400 }
      );
    }

    // Delete user (Cascades to Invoices, Reminders, Leads, Settings via Prisma onDelete: Cascade)
    await (prisma as any).user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Company account and all associated data have been permanently deleted.",
    });
  } catch (error: any) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
