import { NextRequest, NextResponse } from "next/server";
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

    return NextResponse.json({ success: true, total: products.length, products });
  } catch {
    return NextResponse.json({
      success: true,
      total: INITIAL_MENU_ITEMS.length,
      products: INITIAL_MENU_ITEMS,
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { productId, stock } = await req.json();
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { stock: Math.max(0, Number(stock)) },
    });
    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}
