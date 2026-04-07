import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { affiliates, affiliateClicks } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    // As per the requirement to track Soca Noir and preserve site structure,
    // we set a default destination URL for the product, which can be extended later.
    const destinationUrl = url.searchParams.get("dest") || "/products/soca-noir-rose";
    const targetUrl = new URL(destinationUrl, req.url);

    if (!code) {
      return NextResponse.redirect(targetUrl);
    }

    // Look up affiliate by code
    const affiliateResult = await db.select()
      .from(affiliates)
      .where(eq(affiliates.referralCode, code))
      .limit(1);

    const affiliate = affiliateResult[0];

    // Log the click if valid affiliate is found
    if (affiliate) {
      const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
      
      await db.insert(affiliateClicks).values({
        affiliateId: affiliate.id,
        ipAddress: ipAddress,
      });
    }

    // Redirect to final destination
    return NextResponse.redirect(targetUrl);

  } catch (error) {
    console.error("Error processing affiliate link:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
