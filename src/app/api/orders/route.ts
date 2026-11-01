import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch orders",
        error: error instanceof Error ? error.message : "Unknown error",
        orders: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderNumber,
      customerName = "Pelanggan Kantin",
      personCount = 1,
      items = [],
      subtotal = 0,
      discountTotal = 0,
      taxTotal = 0,
      totalAmount = 0,
      paymentMethod = "Cash",
    } = body;

    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: orderNumber || `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName,
          personCount,
          subtotal,
          discountTotal,
          taxTotal,
          totalAmount,
          paymentMethod,
          status: "COMPLETED",
          items: {
            create: items.map(
              (item: {
                productId: string;
                productName: string;
                quantity: number;
                originalPrice?: number;
                discountPercent?: number;
                unitPrice?: number;
                lineTotal: number;
              }) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                originalPrice: item.originalPrice || item.lineTotal,
                discountPercent: item.discountPercent || 0,
                finalUnitPrice: item.unitPrice || Math.round(item.lineTotal / item.quantity),
                lineTotal: item.lineTotal,
              })
            ),
          },
        },
        include: {
          items: true,
        },
      });

      // Deduct stock in database
      for (const item of items) {
        if (!item.productId) continue;
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
              reason: `Penjualan Kasir #${order.orderNumber}`,
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
        success: false,
        message: "Failed to create order",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
