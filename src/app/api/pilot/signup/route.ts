import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessName,
      contactName,
      email,
      phone,
      monthlyOverdueAmount,
      industry,
      udyamNumber,
    } = body;

    if (!businessName || !contactName || !email || !phone) {
      return NextResponse.json(
        { error: "Business name, contact person, email, and phone are required." },
        { status: 400 }
      );
    }

    const signup = await prisma.pilotSignup.create({
      data: {
        businessName: businessName.trim(),
        contactName: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        monthlyOverdueAmount: monthlyOverdueAmount ? parseFloat(monthlyOverdueAmount) : null,
        industry: industry?.trim() || null,
        udyamNumber: udyamNumber?.trim() || null,
        source: "LANDING_PAGE",
      },
    });

    // Also log an analytics event
    await prisma.analyticsEvent.create({
      data: {
        event: "pilot_lead_signup",
        properties: JSON.stringify({
          businessName,
          email,
          monthlyOverdueAmount,
          industry,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for joining the Settlr Pilot Program! Our team will reach out within 24 hours.",
        pilotId: signup.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Pilot signup error:", error);
    return NextResponse.json(
      { error: "Failed to submit pilot registration. Please try again." },
      { status: 500 }
    );
  }
}
