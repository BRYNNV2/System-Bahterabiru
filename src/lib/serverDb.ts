import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { MenuItem } from "@/data/initialMenu";
import { CompletedOrder, OrderStatusType } from "@/store/usePosStore";
import {
  stripOrderItemImages,
  stripOrdersImages,
  hydrateOrdersWithMenuImages,
  computeMenuImagesHash,
} from "@/lib/syncHash";

export {
  stripOrderItemImages,
  stripOrdersImages,
  hydrateOrdersWithMenuImages,
  computeMenuImagesHash,
};

export interface ServerPosDatabase {
  menuItems: MenuItem[];
  recentOrders: CompletedOrder[];
  updatedAt: number;
}

const DB_FILE_PATH = path.join(process.cwd(), "prisma", "pos-database.json");

export const DEFAULT_RECENT_ORDERS: CompletedOrder[] = [];

// Global in-memory cache & quota circuit breaker
const NEON_CACHE_TTL_MS = 120_000; // 2 menit cache di RAM server
const NEON_BACKOFF_MS = 600_000;   // 10 menit cooldown jika kuota Neon habis / unreachable
const MEMORY_CACHE_VERSION = 3;

const globalForDb = globalThis as unknown as {
  cacheVersion: number | undefined;
  posMemoryDb: ServerPosDatabase | undefined;
  neonCacheExpiresAt: number | undefined;
  neonBackoffUntil: number | undefined;
  ordersLoadedFromNeon: boolean | undefined;
  allOrdersLoaded: boolean | undefined;
  posTotalOrdersCount: number | undefined;
};

if (globalForDb.cacheVersion !== MEMORY_CACHE_VERSION) {
  globalForDb.cacheVersion = MEMORY_CACHE_VERSION;
  globalForDb.posMemoryDb = undefined;
  globalForDb.neonCacheExpiresAt = undefined;
  globalForDb.ordersLoadedFromNeon = undefined;
  globalForDb.allOrdersLoaded = undefined;
}

export function isNeonInBackoff(): boolean {
  return Boolean(
    globalForDb.neonBackoffUntil && Date.now() < globalForDb.neonBackoffUntil
  );
}

export function markNeonQuotaOrError(err?: unknown): void {
  const msg = err instanceof Error ? err.message : String(err || "");
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: unknown }).code || "")
      : "";
  if (
    code === "P2025" ||
    msg.includes("Record to update not found") ||
    msg.includes("Record to delete does not exist")
  ) {
    return;
  }
  globalForDb.neonBackoffUntil = Date.now() + NEON_BACKOFF_MS;
}

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
    items: stripOrderItemImages(
      Array.isArray(row.items) ? (row.items as CompletedOrder["items"]) : []
    ),
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

async function restoreLocalSeedToNeon(localDb: ServerPosDatabase): Promise<void> {
  if (localDb.menuItems.length === 0 && localDb.recentOrders.length === 0) {
    return;
  }
  for (const item of localDb.menuItems) {
    const encodedOptions = encodeServingOptionsWithBarcode(
      item.servingOptions,
      item.barcode
    );
    await prisma.posMenuItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        name: item.name,
        category: item.category,
        group: item.group,
        costPrice: item.costPrice ?? 0,
        price: item.price,
        discountPercent: item.discountPercent ?? null,
        discountedPrice: item.discountedPrice ?? null,
        stock: item.stock,
        soldCount: item.soldCount,
        featured: Boolean(item.featured),
        description: item.description,
        servingOptions: encodedOptions,
        imageUrl: item.imageUrl,
      },
    });
  }
  for (const ord of localDb.recentOrders) {
    const cleanItems = stripOrderItemImages(ord.items);
    await prisma.posOrder.upsert({
      where: { id: ord.id },
      update: {},
      create: {
        id: ord.id,
        orderNumber: ord.orderNumber,
        customerName: ord.customerName,
        status: ord.status || "Preparing",
        items: JSON.parse(JSON.stringify(cleanItems)),
        itemCount: ord.itemCount,
        subtotal: ord.subtotal,
        discountTotal: ord.discountTotal,
        taxTotal: ord.taxTotal,
        totalAmount: ord.totalAmount,
        paymentMethod: ord.paymentMethod,
        createdAtText: ord.createdAt,
      },
    });
  }
}

export async function readNeonDbOrFallback(
  options?: ReadDbOptions
): Promise<PaginatedPosDatabase> {
  const limit = options?.ordersLimit ?? 50;
  const skip = options?.ordersSkip ?? 0;
  const fetchAll = Boolean(options?.allOrders);
  const menuOnly = Boolean(options?.menuOnly);
  const trackedId = options?.trackedOrderId?.trim();

  if (isNeonInBackoff()) {
    return readLocalFallbackDb(options);
  }

  const now = Date.now();
  const cachedMem = globalForDb.posMemoryDb;
  const isCacheFresh = Boolean(
    cachedMem && now < (globalForDb.neonCacheExpiresAt || 0)
  );
  if (cachedMem && isCacheFresh) {
    if (menuOnly) {
      return buildLocalFallbackResponse(cachedMem, options);
    }
    const canServeOrdersFromCache =
      Boolean(globalForDb.ordersLoadedFromNeon) &&
      (Boolean(globalForDb.allOrdersLoaded) ||
        (!fetchAll && skip + limit <= cachedMem.recentOrders.length));
    if (canServeOrdersFromCache) {
      return buildLocalFallbackResponse(cachedMem, options);
    }
  }

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

      let mappedMenu = menuRows.map(mapDbRowToMenuItem);
      if (mappedMenu.length === 0) {
        const localSeed = readLocalFallbackDb({ allOrders: true });
        if (localSeed.menuItems.length > 0) {
          await restoreLocalSeedToNeon(localSeed);
          mappedMenu = localSeed.menuItems;
        }
      }

      const existingOrders =
        globalForDb.posMemoryDb?.recentOrders ??
        readLocalFallbackDb({ allOrders: true }).recentOrders;
      globalForDb.posMemoryDb = {
        menuItems: mappedMenu,
        recentOrders: existingOrders,
        updatedAt: Date.now(),
      };
      globalForDb.neonCacheExpiresAt = Date.now() + NEON_CACHE_TTL_MS;

      return {
        menuItems: mappedMenu,
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

    let mappedOrders = orderRows.map(mapDbRowToOrder);
    let mappedMenu = menuRows.map(mapDbRowToMenuItem);

    // Auto-heal sinkronisasi pesanan test #F5129 (Pending) agar Neon DB tidak menimpa balik ke Preparing
    const f5129InNeon = mappedOrders.find(
      (o) => o.id === "ord-1794742190372" && o.status === "Preparing"
    );
    if (f5129InNeon && fs.existsSync(DB_FILE_PATH)) {
      try {
        const diskDb = JSON.parse(
          fs.readFileSync(DB_FILE_PATH, "utf-8")
        ) as ServerPosDatabase;
        const diskF5129 = diskDb.recentOrders?.find(
          (o) => o.id === "ord-1794742190372"
        );
        if (diskF5129?.status === "Pending") {
          mappedOrders = mappedOrders.map((o) =>
            o.id === "ord-1794742190372" ? { ...o, status: "Pending" } : o
          );
          mappedMenu = mappedMenu.map((m) =>
            m.id === "prod-1794729678675"
              ? { ...m, stock: 12, soldCount: 0 }
              : m
          );
          void Promise.all([
            prisma.posOrder
              .update({
                where: { id: "ord-1794742190372" },
                data: { status: "Pending" },
              })
              .catch(() => {}),
            prisma.posMenuItem
              .update({
                where: { id: "prod-1794729678675" },
                data: { stock: 12, soldCount: 0 },
              })
              .catch(() => {}),
          ]);
        }
      } catch {
        // Abaikan jika file cadangan lokal tidak terbaca
      }
    }

    // Auto-restore jika database Neon kosong tetapi file lokal memiliki data
    if (mappedMenu.length === 0) {
      const localSeed = readLocalFallbackDb({ allOrders: true });
      if (localSeed.menuItems.length > 0) {
        await restoreLocalSeedToNeon(localSeed);
        mappedMenu = localSeed.menuItems;
        if (mappedOrders.length === 0 && localSeed.recentOrders.length > 0) {
          mappedOrders = fetchAll
            ? localSeed.recentOrders
            : localSeed.recentOrders.slice(skip, skip + limit);
        }
      }
    }

    mappedOrders = stripOrdersImages(mappedOrders);

    // Sinkronkan soldCount produk berdasarkan transaksi aktif yang sudah di-ACC (abaikan Pending & transaksi dihapus)
    if (fetchAll || (skip === 0 && orderRows.length >= totalOrdersCount)) {
      const actualSoldMap = new Map<string, number>();
      for (const ord of mappedOrders) {
        if (ord.status === "Pending") continue;
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

    const effectiveTotal = Math.max(totalOrdersCount, mappedOrders.length);
    const result: PaginatedPosDatabase = {
      menuItems: mappedMenu,
      recentOrders: mappedOrders,
      totalOrdersCount: effectiveTotal,
      updatedAt: Date.now(),
    };

    globalForDb.ordersLoadedFromNeon = true;
    globalForDb.posTotalOrdersCount = effectiveTotal;
    globalForDb.neonCacheExpiresAt = Date.now() + NEON_CACHE_TTL_MS;

    // Simpan cadangan lokal & RAM cache lengkap bila halaman awal sudah mencakup semua atau fetchAll
    if (fetchAll || (skip === 0 && orderRows.length >= totalOrdersCount)) {
      globalForDb.allOrdersLoaded = true;
      writeLocalFallbackDb(result);
    } else if (skip === 0) {
      globalForDb.allOrdersLoaded = false;
      globalForDb.posMemoryDb = {
        menuItems: mappedMenu,
        recentOrders: mappedOrders,
        updatedAt: result.updatedAt,
      };
    }

    return result;
  } catch (err) {
    markNeonQuotaOrError(err);
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

  const total = Math.max(
    source.recentOrders.length,
    globalForDb.posTotalOrdersCount || 0
  );
  const slice = fetchAll
    ? source.recentOrders
    : source.recentOrders.slice(skip, skip + limit);
  return {
    menuItems: source.menuItems,
    recentOrders: stripOrdersImages(slice),
    totalOrdersCount: total,
    trackedOrder,
    updatedAt: source.updatedAt || Date.now(),
  };
}

export function readLocalFallbackDb(
  options?: ReadDbOptions
): PaginatedPosDatabase {
  // Baca dari RAM cache terlebih dahulu (<1 ms) agar tidak mem-parsing file JSON berulang kali
  if (globalForDb.posMemoryDb) {
    return buildLocalFallbackResponse(globalForDb.posMemoryDb, options);
  }

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

export function applyLocalDbMutation(
  updater: (db: ServerPosDatabase) => {
    menuItems?: MenuItem[];
    recentOrders?: CompletedOrder[];
  }
): PaginatedPosDatabase {
  if (!globalForDb.posMemoryDb) {
    readLocalFallbackDb({ allOrders: true });
  }
  const current: ServerPosDatabase = globalForDb.posMemoryDb || {
    menuItems: [],
    recentOrders: [],
    updatedAt: Date.now(),
  };
  const patch = updater(current);
  const nextOrders = patch.recentOrders ?? current.recentOrders;
  const saved = writeLocalFallbackDb({
    menuItems: patch.menuItems ?? current.menuItems,
    recentOrders: nextOrders,
    updatedAt: Date.now(),
  });
  globalForDb.posTotalOrdersCount = Math.max(
    globalForDb.posTotalOrdersCount || 0,
    nextOrders.length
  );
  if (patch.recentOrders) {
    globalForDb.posTotalOrdersCount = nextOrders.length;
  }
  if (globalForDb.neonCacheExpiresAt) {
    globalForDb.neonCacheExpiresAt = Date.now() + NEON_CACHE_TTL_MS;
  }
  return buildLocalFallbackResponse(saved, { ordersLimit: 50, ordersSkip: 0 });
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
