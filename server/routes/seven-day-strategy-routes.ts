import { Router, Request, Response } from "express";
import { sevenDayStrategyService } from "../services/seven-day-strategy";

export const sevenDayStrategyRouter = Router();

// GET /api/seven-day-strategy - Fetch calendar, active day, and post history
sevenDayStrategyRouter.get("/", async (req: Request, res: Response) => {
  try {
    const data = await sevenDayStrategyService.getCalendar();
    res.json(data);
  } catch (err: any) {
    console.error("[SevenDayStrategyRouter] Error loading calendar:", err);
    res.status(500).json({ error: err.message || "Failed to load 7-day strategy" });
  }
});

// POST /api/seven-day-strategy/post/:day - Execute specific day post
sevenDayStrategyRouter.post("/post/:day", async (req: Request, res: Response) => {
  try {
    const day = parseInt(req.params.day, 10);
    if (isNaN(day) || day < 1 || day > 7) {
      return res.status(400).json({ error: "Invalid day. Must be an integer between 1 and 7." });
    }

    const dryRun = req.body?.dryRun === true;
    const result = await sevenDayStrategyService.executeDayPost(day, { dryRun });
    res.json(result);
  } catch (err: any) {
    console.error(`[SevenDayStrategyRouter] Error executing day post:`, err);
    res.status(500).json({ error: err.message || "Failed to execute day post" });
  }
});

// POST /api/seven-day-strategy/set-active-day - Update active day
sevenDayStrategyRouter.post("/set-active-day", async (req: Request, res: Response) => {
  try {
    const { day } = req.body;
    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 7) {
      return res.status(400).json({ error: "Invalid day number." });
    }

    const updated = await sevenDayStrategyService.setActiveDay(dayNum);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update active day" });
  }
});

// POST /api/seven-day-strategy/toggle-auto - Toggle auto progression
sevenDayStrategyRouter.post("/toggle-auto", async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const updated = await sevenDayStrategyService.toggleAutoProgression(enabled);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to toggle auto progression" });
  }
});
