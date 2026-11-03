import { NextRequest, NextResponse } from "next/server";
import { readServerDb, writeServerDb } from "@/lib/serverDb";
import { MenuItem } from "@/data/initialMenu";
import { CompletedOrder, OrderStatusType } from "@/store/usePosStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = readServerDb();
  return NextResponse.json({
    success: true,
    menuItems: db.menuItems,
    recentOrders: db.recentOrders,
    updatedAt: db.updatedAt,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const db = readServerDb();

    switch (action) {
      case "CREATE_ORDER": {
        const order = payload.order as CompletedOrder;
        if (!order) break;

        // Deduct stock and increment soldCount for each ordered item
        const updatedMenu = db.menuItems.map((item) => {
          const line = order.items.find((i) => i.product.id === item.id);
          if (!line) return item;
          return {
            ...item,
            stock: Math.max(0, item.stock - line.quantity),
            soldCount: item.soldCount + line.quantity,
          };
        });

        // Prevent duplicate order IDs
        const exists = db.recentOrders.some((o) => o.id === order.id);
        const updatedOrders = exists
          ? db.recentOrders
          : [order, ...db.recentOrders];

        const saved = writeServerDb({
          menuItems: updatedMenu,
          recentOrders: updatedOrders,
          updatedAt: Date.now(),
        });

        return NextResponse.json({ success: true, ...saved });
      }

      case "UPDATE_STOCK": {
        const { productId, newStock } = payload as {
          productId: string;
          newStock: number;
        };
        const updatedMenu = db.menuItems.map((item) =>
          item.id === productId
            ? { ...item, stock: Math.max(0, Number(newStock) || 0) }
            : item
        );
        const saved = writeServerDb({
          ...db,
          menuItems: updatedMenu,
        });
        return NextResponse.json({ success: true, ...saved });
      }

      case "ADD_MENU": {
        const newItem = payload.item as MenuItem;
        if (!newItem) break;
        const saved = writeServerDb({
          ...db,
          menuItems: [newItem, ...db.menuItems],
        });
        return NextResponse.json({ success: true, ...saved });
      }

      case "UPDATE_MENU": {
        const { id, updates } = payload as {
          id: string;
          updates: Partial<MenuItem>;
        };
        const updatedMenu = db.menuItems.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        );
        const saved = writeServerDb({
          ...db,
          menuItems: updatedMenu,
        });
        return NextResponse.json({ success: true, ...saved });
      }

      case "DELETE_MENU": {
        const { id } = payload as { id: string };
        const updatedMenu = db.menuItems.filter((item) => item.id !== id);
        const saved = writeServerDb({
          ...db,
          menuItems: updatedMenu,
        });
        return NextResponse.json({ success: true, ...saved });
      }

      case "UPDATE_ORDER_STATUS": {
        const { orderId, status } = payload as {
          orderId: string;
          status: OrderStatusType;
        };
        const updatedOrders = db.recentOrders.map((ord) =>
          ord.id === orderId ? { ...ord, status } : ord
        );
        const saved = writeServerDb({
          ...db,
          recentOrders: updatedOrders,
        });
        return NextResponse.json({ success: true, ...saved });
      }

      case "DELETE_ORDER": {
        const { orderId } = payload as { orderId: string };
        const updatedOrders = db.recentOrders.filter(
          (ord) => ord.id !== orderId
        );
        const saved = writeServerDb({
          ...db,
          recentOrders: updatedOrders,
        });
        return NextResponse.json({ success: true, ...saved });
      }

      default:
        break;
    }

    return NextResponse.json({ success: true, ...db });
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

