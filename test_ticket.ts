import "dotenv/config";
import { storage } from "./server/storage";

async function main() {
  try {
    const fakeTicket = {
      eventId: 1, // Change me
      name: "Soca Noir Rose",
      price: 0,
      quantity: 100,
      description: "",
      maxPerPurchase: 4,
      isActive: true,
      priceType: "standard",
      minPerOrder: 31,
      displayRemainingQuantity: true,
      status: "on_sale",
      hideIfSoldOut: false,
      hidePriceIfSoldOut: false,
      secretCode: "",
      salesStartDate: new Date("2026-03-30"),
      salesStartTime: "--:-- --",
      salesEndDate: null,
      salesEndTime: "--:-- --",
      hideBeforeSalesStart: false,
      hideAfterSalesEnd: false,
      lockMinQuantity: null,
      lockTicketTypeId: null,
      remainingQuantity: 100
    };

    console.log("Saving ticket...");
    const created = await storage.createTicket(fakeTicket as any);
    console.log("Success:", created);
    process.exit(0);
  } catch (err) {
    console.error("Failed:", err);
    process.exit(1);
  }
}

main();
