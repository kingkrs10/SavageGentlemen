import { Router, Request, Response } from "express";
import { db } from "../db";
import { committeeProposals, insertCommitteeProposalSchema } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export const committeeRouter = Router();

// Committee Access Key (defaults to EUPHORIA2027)
const COMMITTEE_PASSCODE = (process.env.COMMITTEE_ACCESS_KEY || "EUPHORIA2027").trim().toUpperCase();

// In-memory fallback cache to ensure uninterrupted committee workflow
let fallbackProposals: any[] = [];
let nextFallbackId = 100;

// POST /api/committee/verify - Verify committee passcode
committeeRouter.post("/verify", (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== "string") {
    return res.status(400).json({ success: false, message: "Access code is required" });
  }

  const normalizedInput = code.trim().toUpperCase();
  if (normalizedInput === COMMITTEE_PASSCODE) {
    return res.json({ success: true, message: "Authorized" });
  }

  return res.status(401).json({ success: false, message: "Invalid Committee Access Key" });
});

// GET /api/committee/proposals - Fetch all saved proposals
committeeRouter.get("/proposals", async (req: Request, res: Response) => {
  try {
    if (db) {
      try {
        const list = await db.select().from(committeeProposals).orderBy(desc(committeeProposals.createdAt));
        return res.json(list);
      } catch (dbErr) {
        console.warn("[CommitteeRouter] DB fetch failed, falling back to memory store:", (dbErr as Error).message);
      }
    }
    return res.json(fallbackProposals);
  } catch (err: any) {
    console.error("[CommitteeRouter] Error fetching proposals:", err);
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
});

// POST /api/committee/proposals - Save proposal
committeeRouter.post("/proposals", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const validated = insertCommitteeProposalSchema.parse(data);

    if (!validated.slug) {
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      validated.slug = (validated.title || "proposal")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") + `-${randomSuffix}`;
    }

    if (db) {
      try {
        const [inserted] = await db.insert(committeeProposals).values(validated).returning();
        return res.status(201).json(inserted);
      } catch (dbErr) {
        console.warn("[CommitteeRouter] DB insert failed, storing in memory:", (dbErr as Error).message);
      }
    }

    const fallbackItem = {
      id: nextFallbackId++,
      ...validated,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    fallbackProposals.unshift(fallbackItem);
    return res.status(201).json(fallbackItem);
  } catch (err: any) {
    console.error("[CommitteeRouter] Error saving proposal:", err);
    res.status(400).json({ error: err.message || "Failed to save proposal" });
  }
});

// PUT /api/committee/proposals/:id - Update proposal
committeeRouter.put("/proposals/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const updateData = { ...req.body, updatedAt: new Date() };

    if (db) {
      try {
        const [updated] = await db
          .update(committeeProposals)
          .set(updateData)
          .where(eq(committeeProposals.id, id))
          .returning();
        if (updated) return res.json(updated);
      } catch (dbErr) {
        console.warn("[CommitteeRouter] DB update failed, falling back:", (dbErr as Error).message);
      }
    }

    const index = fallbackProposals.findIndex((p) => p.id === id);
    if (index !== -1) {
      fallbackProposals[index] = { ...fallbackProposals[index], ...updateData };
      return res.json(fallbackProposals[index]);
    }

    res.status(404).json({ error: "Proposal not found" });
  } catch (err: any) {
    console.error("[CommitteeRouter] Error updating proposal:", err);
    res.status(400).json({ error: err.message || "Failed to update proposal" });
  }
});

// DELETE /api/committee/proposals/:id - Delete proposal
committeeRouter.delete("/proposals/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    if (db) {
      try {
        await db.delete(committeeProposals).where(eq(committeeProposals.id, id));
      } catch (dbErr) {
        console.warn("[CommitteeRouter] DB delete failed:", (dbErr as Error).message);
      }
    }

    fallbackProposals = fallbackProposals.filter((p) => p.id !== id);
    return res.json({ success: true, message: "Proposal deleted" });
  } catch (err: any) {
    console.error("[CommitteeRouter] Error deleting proposal:", err);
    res.status(500).json({ error: "Failed to delete proposal" });
  }
});

// POST /api/committee/generate - Synthesizes inputs into complete deliverables
committeeRouter.post("/generate", (req: Request, res: Response) => {
  try {
    const {
      title,
      category = "event",
      author = "NJ/NY Committee",
      targetDate = "May 21, 2027 (Guyana Independence Weekend)",
      venue = "AC Hotel by Marriott (Ogle, Guyana) Outdoor Pool & Event Lounge",
      concept = "",
      talentWishlist = "",
      capacity = 450,
      earlyBirdPrice = 45,
      tier1Price = 65,
      vipCabanaPrice = 1250,
      merchTitle = "",
      merchPrice = 68,
      estimatedProductionCost = 14000,
    } = req.body;

    const eventTitle = title || (category === "merch" ? "Amazonian Botanical Apparel Drop" : "Oasis: The AC Marriott Welcome Pool Party");
    const numCapacity = Number(capacity) || 450;
    const numEarlyBird = Number(earlyBirdPrice) || 45;
    const numTier1 = Number(tier1Price) || 65;
    const numVipCabana = Number(vipCabanaPrice) || 1250;
    const numProdCost = Number(estimatedProductionCost) || 14000;

    // Projected revenue calculation
    const earlyBirdTickets = Math.round(numCapacity * 0.4);
    const tier1Tickets = Math.round(numCapacity * 0.5);
    const cabanaPackages = 8;
    const ticketRevenue = earlyBirdTickets * numEarlyBird + tier1Tickets * numTier1 + cabanaPackages * numVipCabana;
    const projectedNetProfit = ticketRevenue - numProdCost;
    const breakEvenTickets = Math.ceil(numProdCost / numTier1);

    // Parse talent list
    const talentList = talentWishlist
      ? talentWishlist.split(",").map((s: string) => s.trim()).filter(Boolean)
      : ["DJ Private Ryan", "Dr. Esan", "DJ Kevin", "Savage Soundsystem"];

    const generatedOutput = {
      summary: `Comprehensive operational proposal for ${eventTitle} during Guyana Carnival 2027 Independence Weekend.`,
      microsite: {
        headline: eventTitle,
        subheadline: `Official Guyana Carnival 2027 Poolside Experience | ${venue}`,
        countdownTarget: "2027-05-21T14:00:00-04:00",
        dateBadge: targetDate,
        venueBadge: venue,
        checkoutUrl: "https://www.carnival-planner.com",
        highlights: [
          "Curated Poolside Lounge & Cabana Bottle Service",
          "International DJ Lineup & Live Percussion",
          "Amazonian Bioluminescent Botanical Decor Theme",
          "Seamless 2-minute proximity to Eugene F. Correia (Ogle) International Airport",
        ],
        lineup: talentList,
        ticketTiers: [
          {
            name: "Early Bird General Pass",
            price: numEarlyBird,
            quantity: earlyBirdTickets,
            perks: ["Entry before 4:00 PM", "Welcome Rum Punch", "Access to main pool area"],
          },
          {
            name: "Tier 1 Sunset Pass",
            price: numTier1,
            quantity: tier1Tickets,
            perks: ["All-day expedited entry", "Commemorative pool wristband", "Access to sun deck"],
          },
          {
            name: "Ultra VIP Cabana (8 Guests)",
            price: numVipCabana,
            quantity: cabanaPackages,
            perks: ["8 VIP Wristbands", "2 Premium Bottles + Mixers", "Dedicated Server & Shaded Daybed", "Exclusive Poolside Deck Access"],
          },
        ],
        merchIntegration: {
          active: category === "merch" || Boolean(merchTitle),
          title: merchTitle || "Amazonian Botanical AOP Basketball Jersey & Shorts",
          price: merchPrice,
          checkoutUrl: "https://www.carnival-planner.com",
        },
      },
      runOfShow: {
        date: targetDate,
        venue: venue,
        schedule: [
          { time: "1:00 PM - 2:00 PM", activity: "Staff Briefing, Staging Final Checks & Poolside Audio Calibration" },
          { time: "2:00 PM", activity: "Doors Open | Welcome Cocktails & Ambient Tropical Warmup" },
          { time: "3:30 PM - 5:00 PM", activity: `Opening DJ Set (${talentList[0] || "DJ Kevin"}) | Sun Deck Warmup` },
          { time: "5:00 PM - 6:30 PM", activity: `Golden Hour Sunset Session (${talentList[1] || "Dr. Esan"})` },
          { time: "6:30 PM - 8:30 PM", activity: `Headline Peak Time Set (${talentList[2] || "DJ Private Ryan"})` },
          { time: "8:30 PM - 10:00 PM", activity: "Night Swim Finale & Glow Canopy Lighting Activation" },
          { time: "10:00 PM", activity: "Event Conclusion & Secure Venue Load-Out" },
        ],
        technicalChecklist: [
          "Pool-rated waterproof audio speaker arrays & ground subwoofers",
          "Dedicated electrical tie-in with AC Marriott engineering",
          "Covered DJ booth positioned under shaded pergola",
          "Lifeguards on duty + Private Security team at cabana entrances",
          "Carnival-Planner QR scanner station at check-in desk",
        ],
      },
      promoKit: {
        instagramCaption: `🌴 GUYANA CARNIVAL 2027 EXCLUSIVE 🇬🇾✨\n\nExperience ${eventTitle} at the premier AC Hotel by Marriott Ogle Pool & Event Lounge during Independence Weekend!\n\n🗓️ ${targetDate}\n📍 AC Hotel by Marriott, Ogle, Guyana\n🎵 Sounds by ${talentList.join(", ")}\n\n🎟️ Passes & Cabanas exclusively on: carnival-planner.com\n\n#GuyanaCarnival2027 #GuyanaIndependence #OglePoolParty #CarnivalPlanner #CaribbeanTravel`,
        teaserHookScript: `[Hook Visual: Aerial pan over AC Marriott Ogle Pool]\n"If you thought you knew Guyana Carnival... think again."\n[Beat drops, quick cuts of tropical cocktails and sun loungers]\n"Independence Weekend 2027. ${eventTitle}. The pool deck is reserved."\n"Only at carnival-planner.com."`,
        emailBlastSubject: `[Exclusive] Your 2027 Guyana Carnival Poolside Itinerary is Ready 🇬🇾`,
        emailBlastBody: `Dear Carnival Connoisseur,\n\nWe are proud to unveil ${eventTitle}, taking place at the pristine AC Hotel by Marriott Ogle Pool during Guyana Carnival 2027 Independence Weekend.\n\nSpace is strictly limited to maintain a luxury, high-energy pool experience. Early access registration and private cabana reservations are now live exclusively via Carnival-Planner:\n\nReserve Now: https://www.carnival-planner.com\n\nSee you poolside.`,
      },
      financialModel: {
        capacity: numCapacity,
        earlyBirdTickets,
        tier1Tickets,
        cabanaPackages,
        projectedGrossRevenue: ticketRevenue,
        estimatedProductionCost: numProdCost,
        projectedNetProfit,
        breakEvenTickets,
      },
    };

    return res.json({
      success: true,
      title: eventTitle,
      category,
      author,
      venue,
      targetDate,
      inputData: req.body,
      generatedOutput,
    });
  } catch (err: any) {
    console.error("[CommitteeRouter] Error generating output:", err);
    res.status(500).json({ error: "Failed to generate output" });
  }
});
