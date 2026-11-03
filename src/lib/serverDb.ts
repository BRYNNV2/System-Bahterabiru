import fs from "fs";
import path from "path";
import { INITIAL_MENU_ITEMS, MenuItem } from "@/data/initialMenu";
import { CompletedOrder } from "@/store/usePosStore";

export interface ServerPosDatabase {
  menuItems: MenuItem[];
  recentOrders: CompletedOrder[];
  updatedAt: number;
}

const DB_FILE_PATH = path.join(process.cwd(), "prisma", "pos-database.json");

const DEFAULT_RECENT_ORDERS: CompletedOrder[] = [
  {
    id: "ord-prev-1",
    orderNumber: "#F8371",
    customerName: "Rizky Pratama (Table 04)",
    status: "Preparing",
    items: [
      {
        product: INITIAL_MENU_ITEMS[0],
        quantity: 2,
        unitPrice: 35000,
        lineTotal: 70000,
      },
      {
        product: INITIAL_MENU_ITEMS[3],
        quantity: 1,
        unitPrice: 19000,
        lineTotal: 19000,
      },
    ],
    itemCount: 3,
    subtotal: 89000,
    discountTotal: 0,
    taxTotal: 8900,
    totalAmount: 97900,
    paymentMethod: "QRIS",
    createdAt: "Today, 13:45",
  },
  {
    id: "ord-prev-2",
    orderNumber: "#F8377",
    customerName: "Nadia Putri (Table 02)",
    status: "Completed",
    items: [
      {
        product: INITIAL_MENU_ITEMS[1],
        quantity: 1,
        unitPrice: 25000,
        lineTotal: 25000,
      },
      {
        product: INITIAL_MENU_ITEMS[12],
        quantity: 2,
        unitPrice: 18500,
        lineTotal: 37000,
      },
    ],
    itemCount: 3,
    subtotal: 62000,
    discountTotal: 0,
    taxTotal: 6200,
    totalAmount: 68200,
    paymentMethod: "Cash",
    createdAt: "Today, 13:20",
  },
];

// Global in-memory fallback in case filesystem is read-only in some cloud environments
const globalForDb = globalThis as unknown as {
  posMemoryDb: ServerPosDatabase | undefined;
};

export function readServerDb(): ServerPosDatabase {
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
    menuItems: INITIAL_MENU_ITEMS,
    recentOrders: DEFAULT_RECENT_ORDERS,
    updatedAt: Date.now(),
  };

  writeServerDb(initialDb);
  return initialDb;
}

export function writeServerDb(data: ServerPosDatabase): ServerPosDatabase {
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

