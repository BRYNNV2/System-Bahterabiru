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

function mapDbRowToMenuItem(row: {
  id: string;
  name: string;
  category: string;
  group: string;
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
  return {
    id: row.id,
    name: row.name,
    category: row.category as MenuItem["category"],
    group: row.group as MenuItem["group"],
    price: row.price,
    ...(row.discountPercent ? { discountPercent: row.discountPercent } : {}),
    ...(row.discountedPrice ? { discountedPrice: row.discountedPrice } : {}),
    stock: row.stock,
    soldCount: row.soldCount,
    featured: row.featured,
    description: row.description,
    ...(Array.isArray(row.servingOptions)
      ? { servingOptions: row.servingOptions as string[] }
      : {}),
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
  };
}

export async function readNeonDbOrFallback(): Promise<ServerPosDatabase> {
  try {
    const [menuRows, orderRows] = await Promise.all([
      prisma.posMenuItem.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.posOrder.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const result: ServerPosDatabase = {
      menuItems: menuRows.map(mapDbRowToMenuItem),
      recentOrders: orderRows.map(mapDbRowToOrder),
      updatedAt: Date.now(),
    };

    writeLocalFallbackDb(result);
    return result;
  } catch {
    return readLocalFallbackDb();
  }
}

export function readLocalFallbackDb(): ServerPosDatabase {
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
        return parsed;
      }
    }
  } catch {
    // Fallback to memory or initial data
  }

  if (globalForDb.posMemoryDb) {
    return globalForDb.posMemoryDb;
  }

  const initialDb: ServerPosDatabase = {
    menuItems: [],
    recentOrders: [],
    updatedAt: Date.now(),
  };

  writeLocalFallbackDb(initialDb);
  return initialDb;
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
