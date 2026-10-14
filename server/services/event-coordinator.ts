import { db } from "../db";
import { events, tickets, ticketPurchases, siteSettings, type Event, type Ticket } from "@shared/schema";
import { eq, and, sql, desc, asc, not } from "drizzle-orm";
import { sevenDayStrategyService } from "./seven-day-strategy";
import { sendEmail } from "../email-provider";

export interface CoordinatorStatus {
  isRunning: boolean;
  isLiveEnabled: boolean;
  activeEvent: {
    id: number;
    title: string;
    date: Date;
    location: string;
  } | null;
  liveTiers: Array<{
    id: number;
    name: string;
    priceFormatted: string;
    remaining: number | null;
    quantity: number;
    tierLevel: string | null;
    status: string;
  }>;
  queuedTiers: Array<{
    id: number;
    name: string;
    priceFormatted: string;
    quantity: number;
    status: string;
  }>;
  soldOutTiers: Array<{
    id: number;
    name: string;
    priceFormatted: string;
  }>;
  vipTablePackages: Array<{
    id: number;
    name: string;
    priceFormatted: string;
    remaining: number | null;
    status: string;
  }>;
  strategyStatus: any;
  lastCheckTime: string;
}

export class EventCoordinatorService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private readonly checkIntervalMs = 5 * 60 * 1000; // Check every 5 minutes

  async init(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[EventCoordinator] 🎩 Autonomous Event Coordinator & Connoisseur Engine starting...");

    // 1. Ensure tickets are live on boot
    try {
      await this.ensureTicketsLive();
    } catch (err: any) {
      console.error("[EventCoordinator] Initial live tickets check error:", err.message);
    }

    // 2. Check for any sold-out tiers needing progression
    try {
      await this.checkTierProgression();
    } catch (err: any) {
      console.error("[EventCoordinator] Initial tier progression check error:", err.message);
    }

    // 3. Coordinate with Seven-Day Social & Ticket Strategy
    try {
      await sevenDayStrategyService.init();
      await sevenDayStrategyService.checkAndAutoPost();
    } catch (err: any) {
      console.error("[EventCoordinator] Seven-Day Strategy coordination note:", err.message);
    }

    // 4. Start recurring maintenance loop
    this.timer = setInterval(() => {
      this.runPeriodicCheck().catch((err: any) => {
        console.error("[EventCoordinator] Periodic maintenance error:", err.message);
      });
    }, this.checkIntervalMs);

    console.log("[EventCoordinator] ✅ Engine online. Monitoring ticket sales, live tier auto-seeding, and 7-day campaigns.");
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log("[EventCoordinator] Engine stopped.");
  }

  private async runPeriodicCheck(): Promise<void> {
    console.log("[EventCoordinator] 🔄 Running automated periodic check (tickets inventory & strategy)...");
    await this.ensureTicketsLive();
    await this.checkTierProgression();
    await sevenDayStrategyService.checkAndAutoPost();
  }

  /**
   * Ensures that Tier 1 (or the first available admission tier) is LIVE (on_sale),
   * and that VIP table packages are also LIVE for upcoming events.
   */
  async ensureTicketsLive(targetEventId?: number): Promise<{ activatedCount: number; message: string }> {
    let activatedCount = 0;

    try {
      // Check if tickets live gate is enabled (defaults to false until user gives the green light)
      const liveGate = await db.select().from(siteSettings).where(eq(siteSettings.key, "tickets_live_enabled")).limit(1);
      const isLiveEnabled = liveGate.length > 0 && liveGate[0].value === "true";

      if (!isLiveEnabled) {
        console.log("[EventCoordinator] 🔒 Staging Mode Active: Tickets are locked off-sale until you command them to go live.");
        return {
          activatedCount: 0,
          message: "Staging Mode: Tickets remain off-sale until explicitly commanded to go live.",
        };
      }

      // Find all upcoming active events (or specific event)
      const targetEvents = targetEventId
        ? await db.select().from(events).where(eq(events.id, targetEventId))
        : await db.select().from(events);

      for (const event of targetEvents) {
        const allTickets = await db.select().from(tickets).where(eq(tickets.eventId, event.id)).orderBy(asc(tickets.price));

        // Separate admission tickets from table packages
        const isTable = (t: any) =>
          t.tierLevel === "vip" ||
          t.tierLevel === "ultra_vip" ||
          t.name.toLowerCase().includes("table") ||
          t.name.toLowerCase().includes("bottle") ||
          t.price >= 15000;

        const admissionTickets = allTickets.filter((t: any) => !isTable(t));
        const tablePackages = allTickets.filter((t: any) => isTable(t));

        // 1. Check admission tickets: Ensure initial Free Tier is on sale, or next queued tiers if free is sold out
        const liveAdmission = admissionTickets.filter((t: any) => t.isActive && t.status === "on_sale" && (t.remainingQuantity === null || t.remainingQuantity > 0));

        if (liveAdmission.length === 0) {
          // Check if Free Unisex tier is available
          const freeTier = admissionTickets.find(
            (t: any) => t.price === 0 && t.status !== "sold_out" && (t.remainingQuantity === null || t.remainingQuantity > 0)
          );

          if (freeTier) {
            console.log(`[EventCoordinator] 🎟️ Activating Free Member Tier: "${freeTier.name}" ($0) for Event "${event.title}"...`);
            await db
              .update(tickets)
              .set({
                isActive: true,
                status: "on_sale",
                remainingQuantity: freeTier.remainingQuantity ?? freeTier.quantity,
                updatedAt: new Date(),
              })
              .where(eq(tickets.id, freeTier.id));
            activatedCount++;
          } else {
            // Free tier already sold out: activate Early Bird Female & Male
            const earlyBirds = admissionTickets.filter(
              (t: any) => t.name.toLowerCase().includes("early bird") && t.status !== "sold_out" && (t.remainingQuantity === null || t.remainingQuantity > 0)
            );
            const toActivate = earlyBirds.length > 0 ? earlyBirds : admissionTickets.filter((t: any) => t.status !== "sold_out" && (t.remainingQuantity === null || t.remainingQuantity > 0)).slice(0, 2);
            for (const t of toActivate) {
              console.log(`[EventCoordinator] 🎟️ Activating Early Bird Tier: "${t.name}" ($${t.price / 100}) for Event "${event.title}"...`);
              await db
                .update(tickets)
                .set({
                  isActive: true,
                  status: "on_sale",
                  remainingQuantity: t.remainingQuantity ?? t.quantity,
                  updatedAt: new Date(),
                })
                .where(eq(tickets.id, t.id));
              activatedCount++;
            }
          }
        }

        // 2. Ensure VIP Table Packages are live
        for (const pkg of tablePackages) {
          if (!pkg.isActive || pkg.status === "off_sale") {
            if (pkg.status !== "sold_out" && (pkg.remainingQuantity === null || pkg.remainingQuantity > 0)) {
              console.log(`[EventCoordinator] 🍾 Activating VIP Table Package: "${pkg.name}" ($${pkg.price / 100}) for Event "${event.title}"...`);
              await db
                .update(tickets)
                .set({
                  isActive: true,
                  status: "on_sale",
                  remainingQuantity: pkg.remainingQuantity ?? pkg.quantity,
                  updatedAt: new Date(),
                })
                .where(eq(tickets.id, pkg.id));
              activatedCount++;
            }
          }
        }
      }

      return {
        activatedCount,
        message: `Verified live tickets across events. Activated ${activatedCount} tier(s)/package(s).`,
      };
    } catch (err: any) {
      console.error("[EventCoordinator] Error ensuring live tickets:", err);
      throw err;
    }
  }

  /**
   * Checks if any live tier has sold out.
   * Progression Chain:
   * 1. Free Unisex Admission (20 tickets) Sells Out -> Auto-activates BOTH Early Bird Female & Early Bird Male
   * 2. Early Bird Female Sells Out -> Auto-activates General Admission (Female)
   * 3. Early Bird Male Sells Out -> Auto-activates General Admission (Male)
   * 4. General Admission Sells Out -> Auto-activates Late Release (Female/Male)
   * 5. Late Release Sells Out -> Auto-activates Door Admission (Female/Male)
   * 6. Emails ticket holders celebrating their locked-in tickets
   */
  async checkTierProgression(ticketId?: number): Promise<{ progressed: boolean; soldOutTier?: string; nextTier?: string }> {
    try {
      let eventsToCheck: Event[] = [];

      if (ticketId) {
        const [targetTicket] = await db.select().from(tickets).where(eq(tickets.id, ticketId));
        if (targetTicket) {
          const [ev] = await db.select().from(events).where(eq(events.id, targetTicket.eventId));
          if (ev) eventsToCheck = [ev];
        }
      } else {
        eventsToCheck = await db.select().from(events);
      }

      let progressed = false;
      let lastSoldOutName = "";
      let lastNextTierName = "";

      for (const event of eventsToCheck) {
        const allTickets = await db.select().from(tickets).where(eq(tickets.eventId, event.id)).orderBy(asc(tickets.price));

        const isTable = (t: any) =>
          t.tierLevel === "vip" ||
          t.tierLevel === "ultra_vip" ||
          t.name.toLowerCase().includes("table") ||
          t.name.toLowerCase().includes("bottle") ||
          t.price >= 15000;

        const admissionTiers = allTickets.filter((t: any) => !isTable(t));

        // Mark any sold-out tiers in DB
        for (const tier of admissionTiers) {
          const isSoldOut = tier.remainingQuantity !== null && tier.remainingQuantity <= 0;
          if (isSoldOut && tier.status !== "sold_out") {
            console.log(`[EventCoordinator] 🚨 TIER SOLD OUT: "${tier.name}" for "${event.title}"!`);
            await db
              .update(tickets)
              .set({
                status: "sold_out",
                isActive: false,
                remainingQuantity: 0,
                updatedAt: new Date(),
              })
              .where(eq(tickets.id, tier.id));
            tier.status = "sold_out";
            tier.isActive = false;
          }
        }

        // Gender queues
        const isFemale = (t: any) => (t as any).gender === "female" || t.name.toLowerCase().includes("female");
        const isMale = (t: any) => (t as any).gender === "male" || t.name.toLowerCase().includes("male");
        const isFree = (t: any) => t.price === 0;

        const freeTier = admissionTiers.find(isFree);
        const femaleTiers = admissionTiers.filter(isFemale).sort((a: any, b: any) => a.price - b.price);
        const maleTiers = admissionTiers.filter(isMale).sort((a: any, b: any) => a.price - b.price);

        // CASE 1: Free Unisex Tier Just Sold Out -> Unlock BOTH Early Bird Female and Early Bird Male
        if (freeTier && (freeTier.status === "sold_out" || (freeTier.remainingQuantity !== null && freeTier.remainingQuantity <= 0))) {
          // Check if Female has an active on-sale tier
          const hasActiveFemale = femaleTiers.some((t: any) => t.isActive && t.status === "on_sale" && (t.remainingQuantity === null || t.remainingQuantity > 0));
          if (!hasActiveFemale) {
            const nextFemale = femaleTiers.find((t: any) => t.status !== "sold_out" && (t.remainingQuantity === null || t.remainingQuantity > 0));
            if (nextFemale) {
              console.log(`[EventCoordinator] 🚀 Free Tier Sold Out! Auto-activating Female Tier: "${nextFemale.name}" ($${nextFemale.price / 100})`);
              await db
                .update(tickets)
                .set({
                  isActive: true,
                  status: "on_sale",
                  remainingQuantity: nextFemale.remainingQuantity ?? nextFemale.quantity,
                  updatedAt: new Date(),
                })
                .where(eq(tickets.id, nextFemale.id));
              progressed = true;
              lastSoldOutName = freeTier.name;
              lastNextTierName = nextFemale.name;
              await this.emailTicketHoldersAboutNextTier(event, freeTier, nextFemale);
            }
          }

          // Check if Male has an active on-sale tier
          const hasActiveMale = maleTiers.some((t: any) => t.isActive && t.status === "on_sale" && (t.remainingQuantity === null || t.remainingQuantity > 0));
          if (!hasActiveMale) {
            const nextMale = maleTiers.find((t: any) => t.status !== "sold_out" && (t.remainingQuantity === null || t.remainingQuantity > 0));
            if (nextMale) {
              console.log(`[EventCoordinator] 🚀 Free Tier Sold Out! Auto-activating Male Tier: "${nextMale.name}" ($${nextMale.price / 100})`);
              await db
                .update(tickets)
                .set({
                  isActive: true,
                  status: "on_sale",
                  remainingQuantity: nextMale.remainingQuantity ?? nextMale.quantity,
                  updatedAt: new Date(),
                })
                .where(eq(tickets.id, nextMale.id));
              progressed = true;
              lastNextTierName = `${lastNextTierName} & ${nextMale.name}`;
            }
          }
        }

        // CASE 2: Female Tier Progression (Early Bird Female -> General Admission Female -> Late Release Female -> Door Female)
        const activeFemale = femaleTiers.find((t: any) => t.isActive && t.status === "on_sale" && (t.remainingQuantity === null || t.remainingQuantity > 0));
        if (!activeFemale && freeTier?.status === "sold_out") {
          const nextFemale = femaleTiers.find((t: any) => t.status !== "sold_out" && (t.remainingQuantity === null || t.remainingQuantity > 0));
          if (nextFemale) {
            console.log(`[EventCoordinator] 🚀 Female tier auto-transition: "${nextFemale.name}" ($${nextFemale.price / 100}) is now LIVE!`);
            await db
              .update(tickets)
              .set({
                isActive: true,
                status: "on_sale",
                remainingQuantity: nextFemale.remainingQuantity ?? nextFemale.quantity,
                updatedAt: new Date(),
              })
              .where(eq(tickets.id, nextFemale.id));
            progressed = true;
            lastNextTierName = nextFemale.name;
          }
        }

        // CASE 3: Male Tier Progression (Early Bird Male -> General Admission Male -> Late Release Male -> Door Male)
        const activeMale = maleTiers.find((t: any) => t.isActive && t.status === "on_sale" && (t.remainingQuantity === null || t.remainingQuantity > 0));
        if (!activeMale && freeTier?.status === "sold_out") {
          const nextMale = maleTiers.find((t: any) => t.status !== "sold_out" && (t.remainingQuantity === null || t.remainingQuantity > 0));
          if (nextMale) {
            console.log(`[EventCoordinator] 🚀 Male tier auto-transition: "${nextMale.name}" ($${nextMale.price / 100}) is now LIVE!`);
            await db
              .update(tickets)
              .set({
                isActive: true,
                status: "on_sale",
                remainingQuantity: nextMale.remainingQuantity ?? nextMale.quantity,
                updatedAt: new Date(),
              })
              .where(eq(tickets.id, nextMale.id));
            progressed = true;
            lastNextTierName = nextMale.name;
          }
        }
      }

      return {
        progressed,
        soldOutTier: lastSoldOutName,
        nextTier: lastNextTierName,
      };
    } catch (err: any) {
      console.error("[EventCoordinator] Error checking tier progression:", err);
      throw err;
    }
  }

  /**
   * Dispatches an automated email to all ticket holders when a tier sells out and next tier goes live.
   * Congratulates them on securing early rates and invites them to share with their crew.
   */
  async emailTicketHoldersAboutNextTier(
    event: Event,
    soldOutTier: Ticket,
    nextTier: Ticket
  ): Promise<number> {
    const settingKey = `tier_progression_email_${soldOutTier.id}_to_${nextTier.id}`;

    // Prevent duplicate blasts for the same tier transition
    try {
      const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, settingKey)).limit(1);
      if (existing.length > 0) {
        console.log(`[EventCoordinator] ⏭️ Notification already sent for transition ${soldOutTier.name} -> ${nextTier.name}. Skipping.`);
        return 0;
      }
    } catch (err: any) {
      console.warn("[EventCoordinator] Settings check note:", err.message);
    }

    // Fetch all confirmed ticket holders for this event
    const purchases = await db
      .select({
        email: ticketPurchases.attendeeEmail,
        name: ticketPurchases.attendeeName,
      })
      .from(ticketPurchases)
      .where(and(eq(ticketPurchases.eventId, event.id), eq(ticketPurchases.status, "valid")));

    const uniqueHolders = new Map<string, string>();
    for (const p of purchases) {
      if (p.email && p.email.includes("@")) {
        uniqueHolders.set(p.email.trim().toLowerCase(), p.name || "Savage VIP");
      }
    }

    if (uniqueHolders.size === 0) {
      console.log(`[EventCoordinator] No existing ticket holders found to notify for Event ${event.title}.`);
      // Save notification key to avoid re-running repeatedly
      try {
        await db.insert(siteSettings).values({
          key: settingKey,
          value: JSON.stringify({ sentCount: 0, timestamp: new Date().toISOString() }),
        });
      } catch {}
      return 0;
    }

    const siteUrl = process.env.SITE_URL || "https://www.savgent.com";
    const eventUrl = `${siteUrl}/events/${event.id}`;
    const soldOutPriceFormatted = `$${(soldOutTier.price / 100).toFixed(2)}`;
    const nextPriceFormatted = `$${(nextTier.price / 100).toFixed(2)}`;
    const eventDateFormatted = new Date(event.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    console.log(`[EventCoordinator] 📧 Broadcasting Tier Transition Alert to ${uniqueHolders.size} ticket holder(s)...`);
    let sentCount = 0;

    for (const [email, name] of Array.from(uniqueHolders.entries())) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0B0C; color: #FFFFFF; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #16161A 0%, #0B0B0C 100%); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 16px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
            .badge { display: inline-block; background: rgba(239, 68, 68, 0.2); border: 1px solid #EF4444; color: #EF4444; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; }
            .gold-badge { display: inline-block; background: rgba(212, 175, 55, 0.2); border: 1px solid #D4AF37; color: #D4AF37; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 4px 12px; border-radius: 20px; }
            h1 { color: #FFFFFF; font-size: 24px; font-weight: 800; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px; }
            .highlight { color: #D4AF37; }
            p { color: #CCCCCC; font-size: 15px; line-height: 1.6; margin: 12px 0; }
            .card { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin: 24px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 14px; }
            .detail-label { color: #888888; }
            .detail-value { color: #FFFFFF; font-weight: bold; }
            .btn { display: block; text-align: center; background: linear-gradient(135deg, #D4AF37 0%, #AA820A 100%); color: #000000 !important; font-weight: 800; text-decoration: none; padding: 16px 24px; border-radius: 10px; font-size: 15px; text-transform: uppercase; letter-spacing: 1.5px; margin: 24px 0; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3); }
            .footer { border-top: 1px solid rgba(255, 255, 255, 0.08); margin-top: 32px; padding-top: 20px; text-align: center; font-size: 12px; color: #666666; }
          </style>
        </head>
        <body>
          <div class="container">
            <span class="badge">🔥 TIER SOLD OUT UPDATE</span>
            <h1>You're In! <span class="highlight">${soldOutTier.name} is Sold Out</span></h1>
            <p>Wah gwan <strong>${name}</strong>,</p>
            <p>Congratulations! You secured your ticket for <strong>${event.title}</strong> at the lowest rate (<strong>${soldOutPriceFormatted}</strong>) before it completely sold out.</p>
            
            <p>Due to high demand, our autonomous coordinator has just officially activated <strong>${nextTier.name}</strong> at <strong>${nextPriceFormatted}</strong> for the general public.</p>

            <div class="card">
              <div style="margin-bottom: 12px;">
                <span class="gold-badge">EVENT DETAILS</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Event:</span>
                <span class="detail-value">${event.title}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${eventDateFormatted}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Venue:</span>
                <span class="detail-value">${event.location}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Next Live Tier:</span>
                <span class="detail-value" style="color: #D4AF37;">${nextTier.name} (${nextPriceFormatted})</span>
              </div>
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">Your Status:</span>
                <span class="detail-value" style="color: #10B981;">✓ Confirmed & Locked In</span>
              </div>
            </div>

            <p style="font-weight: bold; color: #FFFFFF;">Don't let your fete crew get left behind or pay door rates!</p>
            <p>Forward this email or send your team the direct event link below so they can grab <strong>${nextTier.name}</strong> passes before this next batch sells out too.</p>

            <a href="${eventUrl}" class="btn">Share Event Link With Crew</a>

            <div class="footer">
              <p>Savage Gentlemen | The Pulse of Caribbean Nightlife & Luxury Culture</p>
              <p>Questions or Bottle Service Reservations? Contact info@savgent.com</p>
              <p>&copy; ${new Date().getFullYear()} Savage Gentlemen. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const sent = await sendEmail({
          to: email,
          subject: `🚨 ${soldOutTier.name} SOLD OUT! You're In — ${nextTier.name} Is Now Live for ${event.title}`,
          html,
        });
        if (sent) sentCount++;
      } catch (err: any) {
        console.error(`[EventCoordinator] Failed sending email to ${email}:`, err.message);
      }
    }

    // Save state key to prevent re-sending
    try {
      await db.insert(siteSettings).values({
        key: settingKey,
        value: JSON.stringify({
          soldOutTier: soldOutTier.name,
          nextTier: nextTier.name,
          sentCount,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {}

    console.log(`[EventCoordinator] ✅ Tier transition email blast complete: Sent to ${sentCount}/${uniqueHolders.size} ticket holders.`);
    return sentCount;
  }

  /**
   * Returns live snapshot of event tickets and marketing strategy
   */
  async getStatus(): Promise<CoordinatorStatus> {
    try {
      // Find primary upcoming event
      const [primaryEvent] = await db.select().from(events).orderBy(desc(events.id)).limit(1);

      let liveTiers: any[] = [];
      let queuedTiers: any[] = [];
      let soldOutTiers: any[] = [];
      let vipTablePackages: any[] = [];

      if (primaryEvent) {
        const allTickets = await db
          .select()
          .from(tickets)
          .where(eq(tickets.eventId, primaryEvent.id))
          .orderBy(asc(tickets.price));

        const isTable = (t: Ticket) =>
          t.tierLevel === "vip" ||
          t.tierLevel === "ultra_vip" ||
          t.name.toLowerCase().includes("table") ||
          t.name.toLowerCase().includes("bottle") ||
          t.price >= 15000;

        for (const t of allTickets) {
          const item = {
            id: t.id,
            name: t.name,
            priceFormatted: `$${(t.price / 100).toFixed(2)}`,
            remaining: t.remainingQuantity,
            quantity: t.quantity,
            tierLevel: t.tierLevel,
            status: t.status || "on_sale",
          };

          if (isTable(t)) {
            vipTablePackages.push(item);
          } else if (t.status === "sold_out" || (t.remainingQuantity !== null && t.remainingQuantity <= 0)) {
            soldOutTiers.push(item);
          } else if (t.isActive && t.status === "on_sale") {
            liveTiers.push(item);
          } else {
            queuedTiers.push(item);
          }
        }
      }

      const strategyCalendar = await sevenDayStrategyService.getCalendar();
      const isLiveEnabled = await this.isLiveGateEnabled();

      return {
        isRunning: this.isRunning,
        isLiveEnabled,
        activeEvent: primaryEvent
          ? {
              id: primaryEvent.id,
              title: primaryEvent.title,
              date: primaryEvent.date,
              location: primaryEvent.location,
            }
          : null,
        liveTiers,
        queuedTiers,
        soldOutTiers,
        vipTablePackages,
        strategyStatus: strategyCalendar.state,
        lastCheckTime: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error("[EventCoordinator] Error getting status:", err);
      return {
        isRunning: this.isRunning,
        isLiveEnabled: false,
        activeEvent: null,
        liveTiers: [],
        queuedTiers: [],
        soldOutTiers: [],
        vipTablePackages: [],
        strategyStatus: null,
        lastCheckTime: new Date().toISOString(),
      };
    }
  }

  async isLiveGateEnabled(): Promise<boolean> {
    try {
      const liveGate = await db.select().from(siteSettings).where(eq(siteSettings.key, "tickets_live_enabled")).limit(1);
      return liveGate.length > 0 && liveGate[0].value === "true";
    } catch {
      return false;
    }
  }

  async setLiveEnabled(enabled: boolean): Promise<{ success: boolean; isLive: boolean; message: string }> {
    const val = enabled ? "true" : "false";
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, "tickets_live_enabled")).limit(1);
    if (existing.length > 0) {
      await db.update(siteSettings).set({ value: val, updatedAt: new Date() }).where(eq(siteSettings.key, "tickets_live_enabled"));
    } else {
      await db.insert(siteSettings).values({ key: "tickets_live_enabled", value: val });
    }

    if (enabled) {
      console.log("[EventCoordinator] 🟢 Live sales gate OPENED by user command. Activating live tickets...");
      await this.ensureTicketsLive();
      return { success: true, isLive: true, message: "Tickets are now LIVE and on sale." };
    } else {
      console.log("[EventCoordinator] 🔒 Live sales gate LOCKED. Reverting all tickets to off-sale staging mode...");
      await db.update(tickets).set({ isActive: false, status: "off_sale", updatedAt: new Date() });
      return { success: true, isLive: false, message: "Tickets are now locked in staging mode (off-sale)." };
    }
  }
}

export const eventCoordinatorService = new EventCoordinatorService();
