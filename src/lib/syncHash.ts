import type { MenuItem } from "@/data/initialMenu";
import type { CompletedOrder, OrderStatusType } from "@/store/usePosStore";

/** Hapus imageUrl bertipe data: URI dari setiap item order agar payload tetap ringan */
export function stripOrderItemImages(
  items: CompletedOrder["items"]
): CompletedOrder["items"] {
  if (!Array.isArray(items)) return [];
  return items.map((line) => {
    if (!line?.product) return line;
    const url = line.product.imageUrl || "";
    if (!url.startsWith("data:")) return line;
    return {
      ...line,
      product: {
        ...line.product,
        imageUrl: "",
      },
    };
  });
}

/** Terapkan stripOrderItemImages ke seluruh daftar order */
export function stripOrdersImages(orders: CompletedOrder[]): CompletedOrder[] {
  if (!Array.isArray(orders) || orders.length === 0) return [];
  return orders.map((ord) => ({
    ...ord,
    items: stripOrderItemImages(ord.items),
  }));
}

/** Pulihkan imageUrl item order di sisi client dari katalog menu yang sudah ada di memori */
export function hydrateOrdersWithMenuImages(
  orders: CompletedOrder[],
  menuItems: MenuItem[]
): CompletedOrder[] {
  if (!Array.isArray(orders) || orders.length === 0) return [];
  const imgMap = new Map(menuItems.map((m) => [m.id, m.imageUrl]));
  return orders.map((ord) => ({
    ...ord,
    items: Array.isArray(ord.items)
      ? ord.items.map((line) => {
          if (!line?.product || line.product.imageUrl) return line;
          const restored = imgMap.get(line.product.id);
          return restored
            ? { ...line, product: { ...line.product, imageUrl: restored } }
            : line;
        })
      : [],
  }));
}

/** Hitung FNV-1a hash deterministik dari seluruh imageUrl katalog menu */
export function computeMenuImagesHash(items: MenuItem[]): string {
  let hash = 2166136261;
  const feed = (str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  };
  feed(`${items.length}|`);
  for (const item of items) {
    const url = item.imageUrl || "";
    feed(`${item.id}:${url.length}:${url.slice(0, 16)}:${url.slice(-16)}|`);
  }
  return (hash >>> 0).toString(36);
}

export interface PosStateHashInput {
  isAdmin: boolean;
  menuItems: MenuItem[];
  imagesHash: string;
  recentOrders?: CompletedOrder[];
  totalOrdersCount?: number;
  trackedOrder?: {
    id: string;
    orderNumber: string;
    status: OrderStatusType;
  } | null;
}

/** Hitung FNV-1a hash deterministik dari state menu & order untuk respons unchanged */
export function computePosStateHash({
  isAdmin,
  menuItems,
  imagesHash,
  recentOrders = [],
  totalOrdersCount = 0,
  trackedOrder = null,
}: PosStateHashInput): string {
  let hash = 2166136261;
  const feed = (str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  };

  feed(`${isAdmin ? "admin" : "public"}|img:${imagesHash}|m:${menuItems.length}|`);
  for (const item of menuItems) {
    feed(
      `${item.id}|${item.name}|${item.category}|${item.group}|${isAdmin ? item.costPrice ?? 0 : ""}|${item.price}|${item.discountPercent ?? ""}|${item.discountedPrice ?? ""}|${item.stock}|${item.soldCount}|${Boolean(item.featured)}|${item.description}|${item.barcode ?? ""}|${(item.servingOptions || []).join(",")};`
    );
  }

  if (isAdmin) {
    feed(`tot:${totalOrdersCount}|o:${recentOrders.length}|`);
    for (const ord of recentOrders) {
      const itemsSig = Array.isArray(ord.items)
        ? ord.items
            .map((l) => `${l?.product?.id || ""}:${l?.quantity || 0}:${l?.lineTotal || 0}`)
            .join(",")
        : "";
      feed(
        `${ord.id}|${ord.orderNumber}|${ord.customerName}|${ord.status || ""}|${ord.itemCount}|${ord.subtotal}|${ord.discountTotal}|${ord.taxTotal}|${ord.totalAmount}|${ord.paymentMethod}|${ord.createdAt}|${ord.updatedAtIso || ""}|${itemsSig};`
      );
    }
  } else {
    feed(
      trackedOrder
        ? `tr:${trackedOrder.id}|${trackedOrder.orderNumber}|${trackedOrder.status}`
        : "tr:none"
    );
  }

  return (hash >>> 0).toString(36);
}
