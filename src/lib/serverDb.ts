import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { MenuItem } from "@/data/initialMenu";
import { CompletedOrder, OrderStatusType } from "@/store/usePosStore";

export interface ServerPosDatabase {
  menuItems: MenuItem[];
  recentOrders: CompletedOrder[];
  updatedAt: number;
}

const DB_FILE_PATH = path.join(process.cwd(), "prisma", "pos-database.json");

export const DEFAULT_RECENT_ORDERS: CompletedOrder[] = [];

// Global in-memory fallback in case offline or DB unreachable
const globalForDb = globalThis as unknown as {
  posMemoryDb: ServerPosDatabase | undefined;
};

const BARCODE_PREFIX = "__BARCODE__:";

export function encodeServingOptionsWithBarcode(
  servingOptions?: string[],
  barcode?: string
): string[] {
  const cleanOptions = Array.isArray(servingOptions)
    ? servingOptions.filter(
        (opt) => typeof opt === "string" && !opt.startsWith(BARCODE_PREFIX)
      )
    : [];
  const trimmedBarcode = barcode?.trim();
  if (trimmedBarcode) {
    return [...cleanOptions, `${BARCODE_PREFIX}${trimmedBarcode}`];
  }
  return cleanOptions;
}

export function decodeServingOptionsAndBarcode(raw: unknown): {
  servingOptions?: string[];
  barcode?: string;
} {
  if (!Array.isArray(raw)) return {};
  const cleanOptions: string[] = [];
  let barcode: string | undefined;
  for (const entry of raw) {
    if (typeof entry === "string") {
      if (entry.startsWith(BARCODE_PREFIX)) {
        const code = entry.slice(BARCODE_PREFIX.length).trim();
        if (code) barcode = code;
      } else {
        cleanOptions.push(entry);
      }
    }
  }
  return {
    ...(cleanOptions.length > 0 ? { servingOptions: cleanOptions } : {}),
    ...(barcode ? { barcode } : {}),
  };
}

function mapDbRowToMenuItem(row: {
  id: string;
  name: string;
  category: string;
  group: string;
  costPrice?: number | null;
  price: number;
  discountPercent: number | null;
  discountedPrice: number | null;
  stock: number;
  soldCount: number;
  featured: boolean;
  description: string;
  servingOptions: unknown;
  imageUrl: string;
}): MenuItem {
  const decoded = decodeServingOptionsAndBarcode(row.servingOptions);
  return {
    id: row.id,
    name: row.name,
    category: row.category as MenuItem["category"],
    group: row.group as MenuItem["group"],
    costPrice: row.costPrice ?? 0,
    price: row.price,
    ...(row.discountPercent ? { discountPercent: row.discountPercent } : {}),
    ...(row.discountedPrice ? { discountedPrice: row.discountedPrice } : {}),
    stock: row.stock,
    soldCount: row.soldCount,
    featured: row.featured,
    description: row.description,
    ...(decoded.servingOptions ? { servingOptions: decoded.servingOptions } : {}),
    ...(decoded.barcode ? { barcode: decoded.barcode } : {}),
    imageUrl: row.imageUrl,
  };
}

function mapDbRowToOrder(row: {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  items: unknown;
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  paymentMethod: string;
  createdAtText: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}): CompletedOrder {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    status: (row.status as OrderStatusType) || "Preparing",
    items: Array.isArray(row.items) ? (row.items as CompletedOrder["items"]) : [],
    itemCount: row.itemCount,
    subtotal: row.subtotal,
    discountTotal: row.discountTotal,
    taxTotal: row.taxTotal,
    totalAmount: row.totalAmount,
    paymentMethod:
      (row.paymentMethod as CompletedOrder["paymentMethod"]) || "QRIS",
    createdAt: row.createdAtText,
    ...(row.createdAt ? { createdAtIso: row.createdAt.toISOString() } : {}),
    ...(row.updatedAt ? { updatedAtIso: row.updatedAt.toISOString() } : {}),
  };
}

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

export interface ReadDbOptions {
  ordersLimit?: number;
  ordersSkip?: number;
  allOrders?: boolean;
  menuOnly?: boolean;
  trackedOrderId?: string;
}

export interface PaginatedPosDatabase extends ServerPosDatabase {
  totalOrdersCount: number;
  trackedOrder?: {
    id: string;
    orderNumber: string;
    status: OrderStatusType;
  } | null;
}

function pickTrackedOrder(
  orders: CompletedOrder[],
  trackedOrderId?: string
): PaginatedPosDatabase["trackedOrder"] {
  const targetId = trackedOrderId?.trim();
  if (!targetId) return null;
  const found = orders.find((o) => o.id === targetId);
  if (!found) return null;
  return {
    id: found.id,
    orderNumber: found.orderNumber,
    status: found.status || "Preparing",
  };
}

export async function readNeonDbOrFallback(
  options?: ReadDbOptions
): Promise<PaginatedPosDatabase> {
  const limit = options?.ordersLimit ?? 50;
  const skip = options?.ordersSkip ?? 0;
  const fetchAll = Boolean(options?.allOrders);
  const menuOnly = Boolean(options?.menuOnly);
  const trackedId = options?.trackedOrderId?.trim();

  try {
    if (menuOnly) {
      const [menuRows, trackedRow] = await Promise.all([
        prisma.posMenuItem.findMany({
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        }),
        trackedId
          ? prisma.posOrder.findUnique({
              where: { id: trackedId },
              select: { id: true, orderNumber: true, status: true },
            })
          : Promise.resolve(null),
      ]);

      return {
        menuItems: menuRows.map(mapDbRowToMenuItem),
        recentOrders: [],
        totalOrdersCount: 0,
        trackedOrder: trackedRow
          ? {
              id: trackedRow.id,
              orderNumber: trackedRow.orderNumber,
              status: (trackedRow.status as OrderStatusType) || "Preparing",
            }
          : null,
        updatedAt: Date.now(),
      };
    }

    const [menuRows, orderRows, totalOrdersCount] = await Promise.all([
      prisma.posMenuItem.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      fetchAll
        ? prisma.posOrder.findMany({
            orderBy: { createdAt: "desc" },
          })
        : prisma.posOrder.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
            skip,
          }),
      prisma.posOrder.count(),
    ]);

    const mappedOrders = orderRows.map(mapDbRowToOrder);
    let mappedMenu = menuRows.map(mapDbRowToMenuItem);

    // Sinkronkan soldCount produk berdasarkan transaksi aktif (agar transaksi yang sudah dihapus tidak ikut terhitung)
    if (fetchAll || (skip === 0 && orderRows.length >= totalOrdersCount)) {
      const actualSoldMap = new Map<string, number>();
      for (const ord of mappedOrders) {
        for (const line of ord.items) {
          const pid = line?.product?.id;
          if (pid) {
            actualSoldMap.set(
              pid,
              (actualSoldMap.get(pid) || 0) + (Number(line.quantity) || 0)
            );
          }
        }
      }

      const staleItems: { id: string; actualSold: number }[] = [];
      mappedMenu = mappedMenu.map((item) => {
        const actualSold = actualSoldMap.get(item.id) || 0;
        if (item.soldCount !== actualSold) {
          staleItems.push({ id: item.id, actualSold });
          return { ...item, soldCount: actualSold };
        }
        return item;
      });

      if (staleItems.length > 0) {
        void Promise.all(
          staleItems.map((st) =>
            prisma.posMenuItem
              .update({
                where: { id: st.id },
                data: { soldCount: st.actualSold },
              })
              .catch(() => {})
          )
        );
      }
    }

    const result: PaginatedPosDatabase = {
      menuItems: mappedMenu,
      recentOrders: mappedOrders,
      totalOrdersCount,
      updatedAt: Date.now(),
    };

    // Simpan cadangan lokal hanya jika data transaksi lengkap (agar file cadangan tidak terpotong)
    if (fetchAll || (skip === 0 && orderRows.length >= totalOrdersCount)) {
      writeLocalFallbackDb(result);
    }
    return result;
  } catch {
    return readLocalFallbackDb(options);
  }
}

function buildLocalFallbackResponse(
  source: ServerPosDatabase,
  options?: ReadDbOptions
): PaginatedPosDatabase {
  const limit = options?.ordersLimit ?? 50;
  const skip = options?.ordersSkip ?? 0;
  const fetchAll = Boolean(options?.allOrders);
  const menuOnly = Boolean(options?.menuOnly);
  const trackedOrder = pickTrackedOrder(
    source.recentOrders,
    options?.trackedOrderId
  );

  if (menuOnly) {
    return {
      menuItems: source.menuItems,
      recentOrders: [],
      totalOrdersCount: 0,
      trackedOrder,
      updatedAt: source.updatedAt || Date.now(),
    };
  }

  const total = source.recentOrders.length;
  const slice = fetchAll
    ? source.recentOrders
    : source.recentOrders.slice(skip, skip + limit);
  return {
    menuItems: source.menuItems,
    recentOrders: slice,
    totalOrdersCount: total,
    trackedOrder,
    updatedAt: source.updatedAt || Date.now(),
  };
}

export function readLocalFallbackDb(
  options?: ReadDbOptions
): PaginatedPosDatabase {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as ServerPosDatabase;
      if (
        parsed &&
        Array.isArray(parsed.menuItems) &&
        Array.isArray(parsed.recentOrders)
      ) {
        globalForDb.posMemoryDb = parsed;
        return buildLocalFallbackResponse(parsed, options);
      }
    }
  } catch {
    // Fallback to memory or initial data
  }

  if (globalForDb.posMemoryDb) {
    return buildLocalFallbackResponse(globalForDb.posMemoryDb, options);
  }

  const initialDb: ServerPosDatabase = {
    menuItems: [],
    recentOrders: [],
    updatedAt: Date.now(),
  };

  writeLocalFallbackDb(initialDb);
  return {
    ...initialDb,
    totalOrdersCount: 0,
    trackedOrder: null,
  };
}

export function writeLocalFallbackDb(data: ServerPosDatabase): ServerPosDatabase {
  const nextData: ServerPosDatabase = {
    ...data,
    updatedAt: Date.now(),
  };
  globalForDb.posMemoryDb = nextData;

  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(nextData, null, 2), "utf-8");
  } catch {
    // Kept in globalForDb.posMemoryDb if disk write is restricted
  }

  return nextData;
}
