import { NextResponse } from "next/server";
import { INITIAL_MENU_ITEMS } from "@/data/initialMenu";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.product.count();
    if (count === 0) {
      // Auto-seed initial kantin menu items on first load
      await prisma.product.createMany({
        data: INITIAL_MENU_ITEMS.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          discountPercent: item.discountPercent,
          isSpecialDiscount: item.isSpecialDiscount,
          stock: item.stock,
          imageUrl: item.imageUrl,
          isActive: true,
        })),
      });
    }

    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ products });
  } catch {
    // Fallback to initial static items if SQLite DB is not initialized yet
    return NextResponse.json({ products: INITIAL_MENU_ITEMS });
  }
}

