import { NextResponse } from "next/server";
import { INITIAL_MENU_ITEMS } from "@/data/initialMenu";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.product.count();
    if (count === 0) {
      await prisma.product.createMany({
        data: INITIAL_MENU_ITEMS.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          discountPercent: item.discountPercent || 0,
          isSpecialDiscount: Boolean(item.discountPercent),
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
    return NextResponse.json({ products: INITIAL_MENU_ITEMS });
  }
}
