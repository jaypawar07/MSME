import { prisma } from "@/lib/prisma";
import { MSME_STATUTORY_ANNUAL_RATE } from "@/lib/msme-calculator";

/**
 * The supplier's Section 16 rate (% p.a.) from Company Settings, or the statutory
 * default when they have never saved Settings. Every server path that computes or
 * quotes interest for a supplier must use this, so amounts and quoted rates agree.
 */
export async function getSupplierInterestRate(userId: string): Promise<number> {
  const settings = await prisma.companySettings.findUnique({
    where: { userId },
    select: { effectiveAnnualRate: true },
  });
  return settings?.effectiveAnnualRate ?? MSME_STATUTORY_ANNUAL_RATE;
}
