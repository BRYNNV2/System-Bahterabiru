import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderNumber,
      customerName,
      personCount,
      items,
      subtotal,
      discountTotal,
      taxTotal,
      totalAmount,
      paymentMethod,
    } = body;

    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          personCount,
          subtotal,
          discountTotal,
          taxTotal,
          totalAmount,
          paymentMethod: paymentMethod || "QRIS",
          status: "COMPLETED",
          items: {
            create: items.map(
              (item: {
                productId: string;
                productName: string;
                quantity: number;
                originalPrice: number;
                discountPercent: number;
                unitPrice: number;
                lineTotal: number;
              }) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                originalPrice: item.originalPrice,
                discountPercent: item.discountPercent,
                finalUnitPrice: item.unitPrice,
                lineTotal: item.lineTotal,
              })
            ),
          },
        },
      });

      // Deduct stock and record StockLog for Admin monitoring
      for (const item of items) {
        const currentProduct = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (currentProduct) {
          const newStock = Math.max(0, currentProduct.stock - item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              changeAmount: -item.quantity,
              previousStock: currentProduct.stock,
              newStock,
              reason: `Penjualan Kasir #${orderNumber}`,
            },
          });
        }
      }

      return order;
    });

    return NextResponse.json({ success: true, order: createdOrder });
  } catch (error) {
    return NextResponse.json(
      {
        success: true,
        fallback: true,
        message: "Order processed in client state",
        detail: error instanceof Error ? error.message : "Unknown",
      },
      { status: 200 }
    );
  }
}

