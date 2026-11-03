import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing all dummy data from Neon PostgreSQL database...");

  await prisma.posOrder.deleteMany({});
  await prisma.posMenuItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.stockLog.deleteMany({});
  await prisma.product.deleteMany({});

  const localFallbackPath = path.join(process.cwd(), "prisma", "pos-database.json");
  if (fs.existsSync(localFallbackPath)) {
    fs.writeFileSync(
      localFallbackPath,
      JSON.stringify({ menuItems: [], recentOrders: [], updatedAt: Date.now() }, null, 2),
      "utf-8"
    );
  }

  const menuCount = await prisma.posMenuItem.count();
  const orderCount = await prisma.posOrder.count();
  console.log(
    `Done! Neon DB is now clean (${menuCount} menu items, ${orderCount} orders).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
