import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  readNeonDbOrFallback,
  readLocalFallbackDb,
  writeLocalFallbackDb,
} from "@/lib/serverDb";
import { MenuItem } from "@/data/initialMenu";
import { CompletedOrder, OrderStatusType } from "@/store/usePosStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(
    100,
    Math.max(5, Number(searchParams.get("limit")) || 50)
  );
  const skip = (page - 1) * limit;

  const db = await readNeonDbOrFallback(
    all ? { allOrders: true } : { ordersLimit: limit, ordersSkip: skip }
  );

  return NextResponse.json({
    success: true,
    menuItems: db.menuItems,
    recentOrders: db.recentOrders,
    totalOrdersCount: db.totalOrdersCount,
    currentPage: page,
    pageSize: limit,
    totalPages: Math.max(1, Math.ceil(db.totalOrdersCount / limit)),
    updatedAt: db.updatedAt,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case "CREATE_ORDER": {
        const order = payload.order as CompletedOrder;
        if (!order) break;

        try {
          // Ensure DB is initialized
          await readNeonDbOrFallback();

          // Deduct stock and increment soldCount in Neon Postgres
          for (const line of order.items) {
            const existing = await prisma.posMenuItem.findUnique({
              where: { id: line.product.id },
            });
            if (existing) {
              await prisma.posMenuItem.update({
                where: { id: line.product.id },
                data: {
                  stock: Math.max(0, existing.stock - line.quantity),
                  soldCount: existing.soldCount + line.quantity,
                },
              });
            }
          }

          await prisma.posOrder.upsert({
            where: { id: order.id },
            update: {},
            create: {
              id: order.id,
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              status: order.status || "Preparing",
              items: JSON.parse(JSON.stringify(order.items)),
              itemCount: order.itemCount,
              subtotal: order.subtotal,
              discountTotal: order.discountTotal,
              taxTotal: order.taxTotal,
              totalAmount: order.totalAmount,
              paymentMethod: order.paymentMethod,
              createdAtText: order.createdAt,
            },
          });

          const saved = await readNeonDbOrFallback();
          return NextResponse.json({ success: true, ...saved });
        } catch {
          const db = readLocalFallbackDb();
          const updatedMenu = db.menuItems.map((item) => {
            const line = order.items.find((i) => i.product.id === item.id);
            if (!line) return item;
            return {
              ...item,
              stock: Math.max(0, item.stock - line.quantity),
              soldCount: item.soldCount + line.quantity,
            };
          });
          const exists = db.recentOrders.some((o) => o.id === order.id);
          const updatedOrders = exists
            ? db.recentOrders
            : [order, ...db.recentOrders];
          const saved = writeLocalFallbackDb({
            menuItems: updatedMenu,
            recentOrders: updatedOrders,
            updatedAt: Date.now(),
          });
          return NextResponse.json({ success: true, ...saved });
        }
      }

      case "UPDATE_STOCK": {
        const { productId, newStock } = payload as {
          productId: string;
          newStock: number;
        };
        const safeStock = Math.max(0, Number(newStock) || 0);
        try {
          await prisma.posMenuItem.update({
            where: { id: productId },
            data: { stock: safeStock },
          });
          const saved = await readNeonDbOrFallback();
          return NextResponse.json({ success: true, ...saved });
        } catch {
          const db = readLocalFallbackDb();
          const saved = writeLocalFallbackDb({
            ...db,
            menuItems: db.menuItems.map((item) =>
              item.id === productId ? { ...item, stock: safeStock } : item
            ),
          });
          return NextResponse.json({ success: true, ...saved });
        }
      }

      case "ADD_MENU": {
        const newItem = payload.item as MenuItem;
        if (!newItem) break;
        try {
          await prisma.posMenuItem.upsert({
            where: { id: newItem.id },
            update: {
              name: newItem.name,
              category: newItem.category,
              group: newItem.group,
              costPrice: newItem.costPrice ?? 0,
              price: newItem.price,
              discountPercent: newItem.discountPercent ?? null,
              discountedPrice: newItem.discountedPrice ?? null,
              stock: newItem.stock,
              soldCount: newItem.soldCount,
              featured: Boolean(newItem.featured),
              description: newItem.description,
              servingOptions: newItem.servingOptions ?? [],
              imageUrl: newItem.imageUrl,
            },
            create: {
              id: newItem.id,
              name: newItem.name,
              category: newItem.category,
              group: newItem.group,
              costPrice: newItem.costPrice ?? 0,
              price: newItem.price,
              discountPercent: newItem.discountPercent ?? null,
              discountedPrice: newItem.discountedPrice ?? null,
              stock: newItem.stock,
              soldCount: newItem.soldCount,
              featured: Boolean(newItem.featured),
              description: newItem.description,
              servingOptions: newItem.servingOptions ?? [],
              imageUrl: newItem.imageUrl,
              sortOrder: -1,
            },
          });
          const saved = await readNeonDbOrFallback();
          return NextResponse.json({ success: true, ...saved });
        } catch {
          const db = readLocalFallbackDb();
          const saved = writeLocalFallbackDb({
            ...db,
            menuItems: [newItem, ...db.menuItems],
          });
          return NextResponse.json({ success: true, ...saved });
        }
      }

      case "UPDATE_MENU": {
        const { id, updates } = payload as {
          id: string;
          updates: Partial<MenuItem>;
        };
        try {
          await prisma.posMenuItem.update({
            where: { id },
            data: {
              ...(updates.name !== undefined ? { name: updates.name } : {}),
              ...(updates.category !== undefined
                ? { category: updates.category }
                : {}),
              ...(updates.group !== undefined ? { group: updates.group } : {}),
              ...(updates.costPrice !== undefined
                ? { costPrice: updates.costPrice }
                : {}),
              ...(updates.price !== undefined ? { price: updates.price } : {}),
              ...(updates.discountPercent !== undefined
                ? { discountPercent: updates.discountPercent }
                : {}),
              ...(updates.discountedPrice !== undefined
                ? { discountedPrice: updates.discountedPrice }
                : {}),
              ...(updates.stock !== undefined ? { stock: updates.stock } : {}),
              ...(updates.soldCount !== undefined
                ? { soldCount: updates.soldCount }
                : {}),
              ...(updates.featured !== undefined
                ? { featured: Boolean(updates.featured) }
                : {}),
              ...(updates.description !== undefined
                ? { description: updates.description }
                : {}),
              ...(updates.servingOptions !== undefined
                ? { servingOptions: updates.servingOptions }
                : {}),
              ...(updates.imageUrl !== undefined
                ? { imageUrl: updates.imageUrl }
                : {}),
            },
          });
          const saved = await readNeonDbOrFallback();
          return NextResponse.json({ success: true, ...saved });
        } catch {
          const db = readLocalFallbackDb();
          const saved = writeLocalFallbackDb({
            ...db,
            menuItems: db.menuItems.map((item) =>
              item.id === id ? { ...item, ...updates } : item
            ),
          });
          return NextResponse.json({ success: true, ...saved });
        }
      }

      case "DELETE_MENU": {
        const { id } = payload as { id: string };
        try {
          await prisma.posMenuItem.delete({
            where: { id },
          });
          const saved = await readNeonDbOrFallback();
          return NextResponse.json({ success: true, ...saved });
        } catch {
          const db = readLocalFallbackDb();
          const saved = writeLocalFallbackDb({
            ...db,
            menuItems: db.menuItems.filter((item) => item.id !== id),
          });
          return NextResponse.json({ success: true, ...saved });
        }
      }

      case "UPDATE_ORDER_STATUS": {
        const { orderId, status } = payload as {
          orderId: string;
          status: OrderStatusType;
        };
        try {
          const existingOrder = await prisma.posOrder.findUnique({
            where: { id: orderId },
          });
          if (existingOrder && existingOrder.status !== "Completed") {
            await prisma.posOrder.update({
              where: { id: orderId },
              data: { status },
            });
          }
          const saved = await readNeonDbOrFallback();
          return NextResponse.json({ success: true, ...saved });
        } catch {
          const db = readLocalFallbackDb();
          const saved = writeLocalFallbackDb({
            ...db,
            recentOrders: db.recentOrders.map((ord) =>
              ord.id === orderId && ord.status !== "Completed"
                ? { ...ord, status }
                : ord
            ),
          });
          return NextResponse.json({ success: true, ...saved });
        }
      }

      case "DELETE_ORDER": {
        const { orderId } = payload as { orderId: string };
        try {
          await prisma.posOrder.delete({
            where: { id: orderId },
          });
          const saved = await readNeonDbOrFallback();
          return NextResponse.json({ success: true, ...saved });
        } catch {
          const db = readLocalFallbackDb();
          const saved = writeLocalFallbackDb({
            ...db,
            recentOrders: db.recentOrders.filter((ord) => ord.id !== orderId),
          });
          return NextResponse.json({ success: true, ...saved });
        }
      }

      default:
        break;
    }

    const currentDb = await readNeonDbOrFallback();
    return NextResponse.json({ success: true, ...currentDb });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Sync error",
      },
      { status: 500 }
    );
  }
}
