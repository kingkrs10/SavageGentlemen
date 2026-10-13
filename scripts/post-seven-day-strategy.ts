import "dotenv/config";
import { sevenDayStrategyService, SEVEN_DAY_CARIBBEAN_STRATEGY } from "../server/services/seven-day-strategy";

interface ScriptOptions {
  day: number;
  dryRun: boolean;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  let day = 1;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--day" || arg === "-d") {
      day = parseInt(args[++i], 10) || 1;
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }

  return { day, dryRun };
}

async function run() {
  const { day, dryRun } = parseArgs();

  console.log("================================================================================");
  console.log("🌴 SAVAGE GENTLEMEN: 7-DAY CARIBBEAN SOCIAL AUTO-POST STRATEGY");
  console.log("================================================================================");
  console.log(`📅 Target Day: Day ${day} of 7`);
  console.log(`🧪 Mode: ${dryRun ? "DRY RUN (Simulation)" : "LIVE DISPATCH (Webhooks & Social Channels)"}`);

  const plan = SEVEN_DAY_CARIBBEAN_STRATEGY.find(p => p.day === day);
  if (!plan) {
    console.error(`❌ Error: Day ${day} not found in 7-day strategy matrix.`);
    process.exit(1);
  }

  console.log(`📍 Island & Culture: ${plan.country} ${plan.flag}`);
  console.log(`🎭 Cultural Theme: ${plan.theme}`);
  console.log(`🛍️ Featured Product: ${plan.product.title} (${plan.product.priceFormatted})`);
  console.log(`🏷️ Promo Code: ${plan.promoCode} (10% off at ${plan.product.shopUrl})`);
  console.log(`🎯 Retention Hook: "${plan.hook}"`);
  console.log(`🚀 Growth Multiplier: ${plan.growthMultiplier}`);
  console.log("--------------------------------------------------------------------------------");
  console.log("📝 CAPTION PREVIEW:\n");
  console.log(plan.caption);
  console.log("\n🏷️ HASHTAGS:\n" + plan.hashtags.join(" "));
  console.log("--------------------------------------------------------------------------------");

  console.log(`\n[1/2] 📡 Executing Broadcast for Day ${day}...`);
  const result = await sevenDayStrategyService.executeDayPost(day, { dryRun });

  console.log(`\n[2/2] 📊 Dispatch Result:`);
  console.log(`   - Overall Success: ${result.success ? "✅ YES" : "⚠️ FAILED / SIMULATED"}`);
  console.log(`   - Media Asset URL: ${result.mediaUrl}`);
  console.log(`   - Platform Results:`);
  result.results.forEach((r: any) => {
    console.log(`     * [${r.platform.toUpperCase()}]: ${r.status.toUpperCase()} ${r.message ? `— ${r.message}` : ""} ${r.error ? `— Error: ${r.error}` : ""}`);
  });

  console.log(`   - Next Active Day Scheduled: Day ${result.nextDay}`);
  console.log("================================================================================");
  console.log(`🎉 DAY ${day} STRATEGY BROADCAST COMPLETED!`);
  console.log("================================================================================");
}

run().catch(err => {
  console.error("❌ Fatal error executing 7-day strategy:", err);
  process.exit(1);
});
