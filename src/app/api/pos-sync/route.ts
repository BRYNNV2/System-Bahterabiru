import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  readNeonDbOrFallback,
  encodeServingOptionsWithBarcode,
  computeMenuImagesHash,
  isNeonInBackoff,
  markNeonQuotaOrError,
  applyLocalDbMutation,
  stripOrderItemImages,
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

/** Hilangkan payload base64 imageUrl ketika hash gambar di client sudah sama */
function prepareMenuResponse(items: MenuItem[], reqImgHash: string) {
  const imagesHash = computeMenuImagesHash(items);
  const imagesOmitted = Boolean(reqImgHash && reqImgHash === imagesHash);
  const menuItems = imagesOmitted
    ? items.map((item) => ({ ...item, imageUrl: "" }))
    : items;
  return { menuItems, imagesHash, imagesOmitted };
}

export async function GET(req: NextRequest) {
  const isAdmin = isAdminRequest(req);
  const { searchParams } = new URL(req.url);
  const reqImgHash = searchParams.get("imgHash")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(
    100,
    Math.max(5, Number(searchParams.get("limit")) || 50)
  );

  // Pengunjung umum hanya membaca katalog menu + 1 status order miliknya (hemat query transaksi)
  if (!isAdmin) {
    const trackedOrderId = searchParams.get("orderId")?.trim() || undefined;
    const db = await readNeonDbOrFallback({
      menuOnly: true,
      trackedOrderId,
    });
    const publicMenu = toPublicMenu(db.menuItems);
    const { menuItems, imagesHash, imagesOmitted } = prepareMenuResponse(
      publicMenu,
      reqImgHash
    );

    return NextResponse.json(
      {
        success: true,
        menuItems,
        imagesHash,
        imagesOmitted,
        recentOrders: [],
        trackedOrder: db.trackedOrder ?? null,
        totalOrdersCount: 0,
        currentPage: 1,
        pageSize: limit,
        totalPages: 1,
        updatedAt: db.updatedAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const all = searchParams.get("all") === "true";
  const skip = (page - 1) * limit;
  const db = await readNeonDbOrFallback(
    all ? { allOrders: true } : { ordersLimit: limit, ordersSkip: skip }
  );
  const { menuItems, imagesHash, imagesOmitted } = prepareMenuResponse(
    db.menuItems,
    reqImgHash
  );

  return NextResponse.json(
    {
      success: true,
      menuItems,
      imagesHash,
      imagesOmitted,
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

        const cleanItems = stripOrderItemImages(order.items);
        const cleanOrder: CompletedOrder = { ...order, items: cleanItems };

        applyLocalDbMutation((db) => {
          const updatedMenu = db.menuItems.map((item) => {
            const line = cleanOrder.items.find((i) => i.product.id === item.id);
            if (!line) return item;
            return {
              ...item,
              stock: Math.max(0, item.stock - line.quantity),
              soldCount: item.soldCount + line.quantity,
            };
          });
          const exists = db.recentOrders.some((o) => o.id === cleanOrder.id);
          const updatedOrders = exists
            ? db.recentOrders
            : [cleanOrder, ...db.recentOrders];
          return { menuItems: updatedMenu, recentOrders: updatedOrders };
        });

        if (!isNeonInBackoff()) {
          try {
            // Deduct stock and increment soldCount in Neon Postgres
            for (const line of cleanOrder.items) {
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
              where: { id: cleanOrder.id },
              update: {},
              create: {
                id: cleanOrder.id,
                orderNumber: cleanOrder.orderNumber,
                customerName: cleanOrder.customerName,
                status: cleanOrder.status || "Preparing",
                items: JSON.parse(JSON.stringify(cleanItems)),
                itemCount: cleanOrder.itemCount,
                subtotal: cleanOrder.subtotal,
                discountTotal: cleanOrder.discountTotal,
                taxTotal: cleanOrder.taxTotal,
                totalAmount: cleanOrder.totalAmount,
                paymentMethod: cleanOrder.paymentMethod,
                createdAtText: cleanOrder.createdAt,
              },
            });
          } catch (err) {
            markNeonQuotaOrError(err);
          }
        }

        // Jangan kirim balik data seluruh transaksi ke pembeli
        return NextResponse.json({ success: true, orderId: cleanOrder.id });
      }

      case "UPDATE_STOCK": {
        const { productId, newStock } = payload as {
          productId: string;
          newStock: number;
        };
        const safeStock = Math.max(0, Number(newStock) || 0);
        const saved = applyLocalDbMutation((db) => ({
          menuItems: db.menuItems.map((item) =>
            item.id === productId ? { ...item, stock: safeStock } : item
          ),
        }));

        if (!isNeonInBackoff()) {
          try {
            await prisma.posMenuItem.update({
              where: { id: productId },
              data: { stock: safeStock },
            });
          } catch (err) {
            markNeonQuotaOrError(err);
          }
        }
        return NextResponse.json({ success: true, ...saved });
      }

      case "ADD_MENU": {
        const newItem = payload.item as MenuItem;
        if (!newItem) break;
        const encodedOptions = encodeServingOptionsWithBarcode(
          newItem.servingOptions,
          newItem.barcode
        );
        const saved = applyLocalDbMutation((db) => ({
          menuItems: db.menuItems.some((m) => m.id === newItem.id)
            ? db.menuItems.map((m) => (m.id === newItem.id ? newItem : m))
            : [newItem, ...db.menuItems],
        }));

        if (!isNeonInBackoff()) {
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
                servingOptions: encodedOptions,
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
                servingOptions: encodedOptions,
                imageUrl: newItem.imageUrl,
                sortOrder: -1,
              },
            });
          } catch (err) {
            markNeonQuotaOrError(err);
          }
        }
        return NextResponse.json({ success: true, ...saved });
      }

      case "UPDATE_MENU": {
        const { id, updates } = payload as {
          id: string;
          updates: Partial<MenuItem>;
        };
        const saved = applyLocalDbMutation((db) => ({
          menuItems: db.menuItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));

        if (!isNeonInBackoff()) {
          try {
            const updatedLocal = saved.menuItems.find((item) => item.id === id);
            const nextServingOptions =
              (updates.servingOptions !== undefined ||
                updates.barcode !== undefined) &&
              updatedLocal
                ? encodeServingOptionsWithBarcode(
                    updatedLocal.servingOptions,
                    updatedLocal.barcode
                  )
                : undefined;

            await prisma.posMenuItem.update({
              where: { id },
              data: {
                ...(updates.name !== undefined ? { name: updates.name } : {}),
                ...(updates.category !== undefined
                  ? { category: updates.category }
                  : {}),
                ...(updates.group !== undefined
                  ? { group: updates.group }
                  : {}),
                ...(updates.costPrice !== undefined
                  ? { costPrice: updates.costPrice }
                  : {}),
                ...(updates.price !== undefined
                  ? { price: updates.price }
                  : {}),
                ...(updates.discountPercent !== undefined
                  ? { discountPercent: updates.discountPercent }
                  : {}),
                ...(updates.discountedPrice !== undefined
                  ? { discountedPrice: updates.discountedPrice }
                  : {}),
                ...(updates.stock !== undefined
                  ? { stock: updates.stock }
                  : {}),
                ...(updates.soldCount !== undefined
                  ? { soldCount: updates.soldCount }
                  : {}),
                ...(updates.featured !== undefined
                  ? { featured: Boolean(updates.featured) }
                  : {}),
                ...(updates.description !== undefined
                  ? { description: updates.description }
                  : {}),
                ...(nextServingOptions !== undefined
                  ? { servingOptions: nextServingOptions }
                  : {}),
                ...(updates.imageUrl !== undefined
                  ? { imageUrl: updates.imageUrl }
                  : {}),
              },
            });
          } catch (err) {
            markNeonQuotaOrError(err);
          }
        }
        return NextResponse.json({ success: true, ...saved });
      }

      case "DELETE_MENU": {
        const { id } = payload as { id: string };
        const saved = applyLocalDbMutation((db) => ({
          menuItems: db.menuItems.filter((item) => item.id !== id),
        }));

        if (!isNeonInBackoff()) {
          try {
            await prisma.posMenuItem.delete({
              where: { id },
            });
          } catch (err) {
            markNeonQuotaOrError(err);
          }
        }
        return NextResponse.json({ success: true, ...saved });
      }

      case "UPDATE_ORDER_STATUS": {
        const { orderId, status } = payload as {
          orderId: string;
          status: OrderStatusType;
        };
        const saved = applyLocalDbMutation((db) => ({
          recentOrders: db.recentOrders.map((ord) =>
            ord.id === orderId && ord.status !== "Completed"
              ? { ...ord, status }
              : ord
          ),
        }));

        if (!isNeonInBackoff()) {
          try {
            await prisma.posOrder.updateMany({
              where: { id: orderId, status: { not: "Completed" } },
              data: { status },
            });
          } catch (err) {
            markNeonQuotaOrError(err);
          }
        }
        return NextResponse.json({ success: true, ...saved });
      }

      case "DELETE_ORDER": {
        const { orderId } = payload as { orderId: string };
        let deletedLines: CompletedOrder["items"] = [];
        const saved = applyLocalDbMutation((db) => {
          const targetOrder = db.recentOrders.find((ord) => ord.id === orderId);
          deletedLines = targetOrder?.items ?? [];
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
          return {
            menuItems: updatedMenu,
            recentOrders: db.recentOrders.filter((ord) => ord.id !== orderId),
          };
        });

        if (!isNeonInBackoff()) {
          try {
            if (deletedLines.length === 0) {
              const existingOrder = await prisma.posOrder.findUnique({
                where: { id: orderId },
              });
              if (existingOrder && Array.isArray(existingOrder.items)) {
                deletedLines =
                  existingOrder.items as unknown as CompletedOrder["items"];
              }
            }

            for (const line of deletedLines) {
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

            await prisma.posOrder.delete({
              where: { id: orderId },
            });
          } catch (err) {
            markNeonQuotaOrError(err);
          }
        }
        return NextResponse.json({ success: true, ...saved });
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
