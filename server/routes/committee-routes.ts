import { Router, Request, Response } from "express";
import { db } from "../db";
import { committeeProposals, insertCommitteeProposalSchema, siteSettings } from "@shared/schema";
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

// -------------------------------------------------------------
// Interactive Committee Master Visual Timeline & Roadmap
// -------------------------------------------------------------
export interface TimelineMilestone {
  id: string;
  phase: string;
  title: string;
  date: string;
  hub: "NJ/NY Committee" | "Guyana Operations" | "UK Logistics" | "All Committee";
  venue: string;
  status: "planned" | "in_progress" | "completed";
  description: string;
  checklist: string[];
}

const DEFAULT_TIMELINE_MILESTONES: TimelineMilestone[] = [
  {
    id: "m-1",
    phase: "Phase 1: Concept & Production",
    title: "Apparel Sampling: Amazonian Botanical Jerseys & Shorts",
    date: "Q3-Q4 2026",
    hub: "UK Logistics",
    venue: "Printify Production Suite",
    status: "in_progress",
    description: "Finalize 300 DPI full-bleed sublimation proofs for the Amazonian basketball jersey and swim shorts.",
    checklist: ["Verify decal coordinates", "Review sample fabric weight", "Lock in pre-order pricing on carnival-planner.com"]
  },
  {
    id: "m-2",
    phase: "Phase 1: Concept & Production",
    title: "AC Hotel by Marriott Ogle Pool Venue Lock-In",
    date: "November 2026",
    hub: "Guyana Operations",
    venue: "AC Hotel by Marriott (Ogle, Guyana) Outdoor Pool & Event Lounge",
    status: "in_progress",
    description: "Confirmed event venue execution agreement, electrical load assessment, and poolside cabana layout reservation.",
    checklist: ["Contract sign-off", "Pergola DJ booth allocation", "Security and check-in desk layout"]
  },
  {
    id: "m-3",
    phase: "Phase 2: Tri-State Buildup & Teaser Launch",
    title: "Carnival-Planner Registration & Ticket Tier Launch",
    date: "January 2027",
    hub: "All Committee",
    venue: "https://www.carnival-planner.com",
    status: "planned",
    description: "Publish Early Bird passes ($45), Sunset Tier 1 ($65), and VIP Cabana packages ($1,250) on Carnival-Planner checkout.",
    checklist: ["Map direct checkout API links", "Configure QR ticket scanner accounts", "Announce exclusive registration window"]
  },
  {
    id: "m-4",
    phase: "Phase 2: Tri-State Buildup & Teaser Launch",
    title: "NJ / NY Tri-State Pop-Up Launch & Diaspora Warmup Fete",
    date: "March 2027",
    hub: "NJ/NY Committee",
    venue: "Tri-State Metro Lounge / Event Space",
    status: "planned",
    description: "Exclusive promotional evening in NY/NJ for diaspora masqueraders, carnival travelers, and committee stakeholders.",
    checklist: ["Apparel showcase display", "Early pool pass ticket incentives", "Live Caribbean DJ set & travel briefing"]
  },
  {
    id: "m-5",
    phase: "Phase 2: Tri-State Buildup & Teaser Launch",
    title: "Headline DJ & Talent Lineup Announcement",
    date: "April 15, 2027",
    hub: "NJ/NY Committee",
    venue: "Social Distribution & Carnival-Planner Hub",
    status: "planned",
    description: "Announce premier talent (DJ Private Ryan, Dr. Esan, DJ Kevin, Savage Soundsystem) and launch high-energy teaser reels.",
    checklist: ["Sign talent riders", "Coordinate Ogle flight arrivals", "Publish social video kits"]
  },
  {
    id: "m-6",
    phase: "Phase 3: Logistics & Arrivals",
    title: "Diaspora Travel & Airport Transfer Coordination",
    date: "May 10, 2027",
    hub: "Guyana Operations",
    venue: "Eugene F. Correia (Ogle) Airport & Cheddi Jagan (GEO)",
    status: "planned",
    description: "Finalize express shuttle logistics between AC Hotel Marriott Ogle (2 mins from OGL airport) and hotel zones.",
    checklist: ["VIP guest welcome list", "Concierge luggage & hotel check-in dispatch", "Ogle pool pass digital delivery"]
  },
  {
    id: "m-7",
    phase: "Phase 4: Carnival Week Execution (May 19–26, 2027)",
    title: "Committee Hub Arrival & On-Site Reconnaissance",
    date: "Wednesday, May 19, 2027",
    hub: "All Committee",
    venue: "AC Hotel by Marriott (Ogle Pool & Lounge)",
    status: "planned",
    description: "NJ/NY, UK, and Guyana operations teams convene at AC Marriott for venue walkthrough and registration station setup.",
    checklist: ["Radio communications check", "Wristband inventory audit", "Bar package & bottle service delivery"]
  },
  {
    id: "m-8",
    phase: "Phase 4: Carnival Week Execution (May 19–26, 2027)",
    title: "Technical Load-in & Poolside Acoustic Soundcheck",
    date: "Thursday, May 20, 2027",
    hub: "Guyana Operations",
    venue: "AC Hotel by Marriott (Ogle Pool Deck)",
    status: "planned",
    description: "Erect covered DJ booth, tune waterproof speaker arrays, test ambient glow lighting, and inspect cabana daybeds.",
    checklist: ["Electrical load safety sign-off", "Carnival-Planner scanner stress test", "Lifeguard & security orientation"]
  },
  {
    id: "m-9",
    phase: "Phase 4: Carnival Week Execution (May 19–26, 2027)",
    title: "OASIS: The AC Marriott Welcome Pool Party",
    date: "Friday, May 21, 2027 (2:00 PM – 10:00 PM)",
    hub: "All Committee",
    venue: "AC Hotel by Marriott (Ogle, Guyana) Outdoor Pool & Event Lounge",
    status: "planned",
    description: "Flagship luxury daytime pool fete bridging international arrivals with local VIPs. High-energy soca, cabana bottle service, and Amazonian botanical atmosphere.",
    checklist: ["Doors open 2:00 PM", "Golden hour sunset headline set", "Night swim glow canopy activation", "Secure venue load-out at 10:00 PM"]
  },
  {
    id: "m-10",
    phase: "Phase 4: Carnival Week Execution (May 19–26, 2027)",
    title: "Guyana Independence Carnival Road March",
    date: "Sunday, May 23, 2027",
    hub: "All Committee",
    venue: "Georgetown Carnival Parade Route",
    status: "planned",
    description: "Full costume street parade with band truck coordination and diaspora masqueraders.",
    checklist: ["Hydration truck sync", "Costume repair crew dispatch", "Masquerader safety zone protocol"]
  },
  {
    id: "m-11",
    phase: "Phase 4: Carnival Week Execution (May 19–26, 2027)",
    title: "Re-Charge: Post-Carnival Pool & Recovery Lounge",
    date: "Monday, May 24, 2027",
    hub: "Guyana Operations",
    venue: "AC Hotel by Marriott (Ogle Pool Deck)",
    status: "planned",
    description: "Chill recovery daytime pool lounge with acoustic tropical rhythms, fresh coconut water, and relaxed cabana hospitality.",
    checklist: ["Sun lounger reserved seating", "Recovery brunch service", "Merch commemorative gifts"]
  },
  {
    id: "m-12",
    phase: "Phase 4: Carnival Week Execution (May 19–26, 2027)",
    title: "Financial Reconciliation & Executive Debrief",
    date: "Wednesday, May 26, 2027",
    hub: "All Committee",
    venue: "Executive Suite / Virtual Bridge",
    status: "planned",
    description: "Complete post-event ticket sales tally on Carnival-Planner, vendor settlements, and 2028 planning review.",
    checklist: ["Reconcile ticket revenue & cabana gross", "Vendor invoice clearance", "Committee report archive"]
  }
];

let fallbackTimeline: TimelineMilestone[] = [...DEFAULT_TIMELINE_MILESTONES];

// GET /api/committee/timeline - Fetch master committee timeline
committeeRouter.get("/timeline", async (req: Request, res: Response) => {
  try {
    if (db) {
      try {
        const [record] = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, "committee_timeline_2027"))
          .limit(1);

        if (record && record.value) {
          const parsed = JSON.parse(record.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            fallbackTimeline = parsed;
            return res.json(parsed);
          }
        }
      } catch (dbErr) {
        console.warn("[CommitteeRouter] DB timeline fetch failed, using fallback:", (dbErr as Error).message);
      }
    }
    return res.json(fallbackTimeline);
  } catch (err: any) {
    console.error("[CommitteeRouter] Error fetching timeline:", err);
    res.status(500).json({ error: "Failed to fetch timeline" });
  }
});

// POST /api/committee/timeline - Update master committee timeline
committeeRouter.post("/timeline", async (req: Request, res: Response) => {
  try {
    const { milestones } = req.body;
    if (!Array.isArray(milestones)) {
      return res.status(400).json({ error: "Milestones must be an array" });
    }

    fallbackTimeline = milestones;

    if (db) {
      try {
        const jsonValue = JSON.stringify(milestones);
        const [existing] = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, "committee_timeline_2027"))
          .limit(1);

        if (existing) {
          await db
            .update(siteSettings)
            .set({ value: jsonValue, updatedAt: new Date() })
            .where(eq(siteSettings.key, "committee_timeline_2027"));
        } else {
          await db.insert(siteSettings).values({
            key: "committee_timeline_2027",
            value: jsonValue,
            updatedAt: new Date(),
          });
        }
      } catch (dbErr) {
        console.warn("[CommitteeRouter] DB timeline update failed, saved to memory cache:", (dbErr as Error).message);
      }
    }

    return res.json({ success: true, count: milestones.length, milestones: fallbackTimeline });
  } catch (err: any) {
    console.error("[CommitteeRouter] Error updating timeline:", err);
    res.status(500).json({ error: "Failed to update timeline" });
  }
});

