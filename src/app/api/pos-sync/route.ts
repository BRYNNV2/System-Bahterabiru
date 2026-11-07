import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  readNeonDbOrFallback,
  readLocalFallbackDb,
  writeLocalFallbackDb,
} from "@/lib/serverDb";
import { MenuItem } from "@/data/initialMenu";
import { CompletedOrder, OrderStatusType } from "@/store/usePosStore";
import { isAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Aksi yang hanya boleh dijalankan admin yang sudah login
const ADMIN_ONLY_ACTIONS = new Set([
  "UPDATE_STOCK",
  "ADD_MENU",
  "UPDATE_MENU",
  "DELETE_MENU",
  "UPDATE_ORDER_STATUS",
  "DELETE_ORDER",
]);

/** Hapus data sensitif (harga modal) dari menu untuk pengunjung umum */
function toPublicMenu(items: MenuItem[]): MenuItem[] {
  return items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { costPrice, ...rest } = item;
    return rest;
  });
}

export async function GET(req: NextRequest) {
  const isAdmin = isAdminRequest(req);
  const { searchParams } = new URL(req.url);
  const all = isAdmin && searchParams.get("all") === "true";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(
    100,
    Math.max(5, Number(searchParams.get("limit")) || 50)
  );
  const skip = (page - 1) * limit;

  const db = await readNeonDbOrFallback(
    all ? { allOrders: true } : { ordersLimit: limit, ordersSkip: skip }
  );

  // Pengunjung umum hanya menerima katalog menu (tanpa harga modal & data transaksi orang lain)
  if (!isAdmin) {
    const trackedOrderId = searchParams.get("orderId")?.trim();
    const matchedOrder = trackedOrderId
      ? db.recentOrders.find((o) => o.id === trackedOrderId)
      : undefined;

    return NextResponse.json(
      {
        success: true,
        menuItems: toPublicMenu(db.menuItems),
        recentOrders: [],
        trackedOrder: matchedOrder
          ? {
              id: matchedOrder.id,
              orderNumber: matchedOrder.orderNumber,
              status: matchedOrder.status || "Preparing",
            }
          : null,
        totalOrdersCount: 0,
        currentPage: 1,
        pageSize: limit,
        totalPages: 1,
        updatedAt: db.updatedAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      success: true,
      menuItems: db.menuItems,
      recentOrders: db.recentOrders,
      totalOrdersCount: db.totalOrdersCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(db.totalOrdersCount / limit)),
      updatedAt: db.updatedAt,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (ADMIN_ONLY_ACTIONS.has(action) && !isAdminRequest(req)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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

          // Jangan kirim balik data seluruh transaksi ke pembeli
          return NextResponse.json({ success: true, orderId: order.id });
        } catch {
          const db = readLocalFallbackDb({ allOrders: true });
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
          writeLocalFallbackDb({
            menuItems: updatedMenu,
            recentOrders: updatedOrders,
            updatedAt: Date.now(),
          });
          return NextResponse.json({ success: true, orderId: order.id });
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
          const db = readLocalFallbackDb({ allOrders: true });
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
          const db = readLocalFallbackDb({ allOrders: true });
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
          const db = readLocalFallbackDb({ allOrders: true });
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
          const db = readLocalFallbackDb({ allOrders: true });
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
          const db = readLocalFallbackDb({ allOrders: true });
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
          const existingOrder = await prisma.posOrder.findUnique({
            where: { id: orderId },
          });

          if (existingOrder && Array.isArray(existingOrder.items)) {
            const lines =
              existingOrder.items as unknown as CompletedOrder["items"];
            for (const line of lines) {
              const pid = line?.product?.id;
              const qty = Number(line?.quantity) || 0;
              if (pid && qty > 0) {
                const menuRow = await prisma.posMenuItem.findUnique({
                  where: { id: pid },
                });
                if (menuRow) {
                  await prisma.posMenuItem.update({
                    where: { id: pid },
                    data: {
                      stock: menuRow.stock + qty,
                      soldCount: Math.max(0, menuRow.soldCount - qty),
                    },
                  });
                }
              }
            }
          }

          await prisma.posOrder.delete({
            where: { id: orderId },
          });
          const saved = await readNeonDbOrFallback();
          return NextResponse.json({ success: true, ...saved });
        } catch {
          const db = readLocalFallbackDb({ allOrders: true });
          const targetOrder = db.recentOrders.find((ord) => ord.id === orderId);
          const updatedMenu = targetOrder
            ? db.menuItems.map((item) => {
                const line = targetOrder.items.find(
                  (i) => i.product.id === item.id
                );
                if (!line) return item;
                return {
                  ...item,
                  stock: item.stock + line.quantity,
                  soldCount: Math.max(0, item.soldCount - line.quantity),
                };
              })
            : db.menuItems;

          const saved = writeLocalFallbackDb({
            ...db,
            menuItems: updatedMenu,
            recentOrders: db.recentOrders.filter((ord) => ord.id !== orderId),
          });
          return NextResponse.json({ success: true, ...saved });
        }
      }

      default:
        break;
    }

    const currentDb = await readNeonDbOrFallback();
    if (!isAdminRequest(req)) {
      return NextResponse.json({
        success: true,
        menuItems: toPublicMenu(currentDb.menuItems),
        recentOrders: [],
      });
    }
    return NextResponse.json({ success: true, ...currentDb });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Sync error",
      },
      { status: 500 }
    );
  }
}
