export interface MenuItem {
  id: string;
  name: string;
  category:
    | "Main Course"
    | "Appetizer"
    | "Dessert"
    | "Side Dishes"
    | "Beverages"
    | "Kids";
  price: number; // Original price in IDR
  discountedPrice?: number; // Explicit discounted price if on special discount
  discountPercent: number; // e.g., 15 for 15%
  isSpecialDiscount: boolean;
  stock: number; // Available count
  imageUrl: string;
}

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // === SPECIAL DISCOUNT TODAY ===
  {
    id: "disc-1",
    name: "Tomato with Tofu Salad",
    category: "Appetizer",
    price: 115000,
    discountedPrice: 97750,
    discountPercent: 15,
    isSpecialDiscount: true,
    stock: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "disc-2",
    name: "Japanese Chicken Gyoza",
    category: "Side Dishes",
    price: 95000,
    discountedPrice: 81700,
    discountPercent: 15,
    isSpecialDiscount: true,
    stock: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "disc-3",
    name: "2pcs of Amazing Avocado",
    category: "Side Dishes",
    price: 80000,
    discountedPrice: 68000,
    discountPercent: 15,
    isSpecialDiscount: true,
    stock: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "disc-4",
    name: "Lettuce with Stuff",
    category: "Appetizer",
    price: 200000,
    discountedPrice: 170000,
    discountPercent: 15,
    isSpecialDiscount: true,
    stock: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
  },

  // === EXPLORE OUR BEST MENU ===
  {
    id: "menu-1",
    name: "Biscuit Mama with Susu",
    category: "Dessert",
    price: 60000,
    discountPercent: 0,
    isSpecialDiscount: false,
    stock: 21,
    imageUrl:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "menu-2",
    name: "Krosang Thats It",
    category: "Appetizer",
    price: 78000,
    discountPercent: 0,
    isSpecialDiscount: false,
    stock: 19,
    imageUrl:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "menu-3",
    name: "Strawberry Float",
    category: "Beverages",
    price: 45000,
    discountPercent: 0,
    isSpecialDiscount: false,
    stock: 56,
    imageUrl:
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "menu-4",
    name: "Healthy Kids Meal",
    category: "Kids",
    price: 83000,
    discountPercent: 0,
    isSpecialDiscount: false,
    stock: 16,
    imageUrl:
      "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "menu-5",
    name: "Mangoo Cereal Milk",
    category: "Dessert",
    price: 95000,
    discountPercent: 0,
    isSpecialDiscount: false,
    stock: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "menu-6",
    name: "Smoothie Brown Berry",
    category: "Beverages",
    price: 95000,
    discountPercent: 0,
    isSpecialDiscount: false,
    stock: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "menu-7",
    name: "Rainbow Cupcake",
    category: "Dessert",
    price: 95000,
    discountPercent: 0,
    isSpecialDiscount: false,
    stock: 11,
    imageUrl:
      "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "menu-8",
    name: "Mie Gocengan Spicy",
    category: "Main Course",
    price: 95000,
    discountPercent: 0,
    isSpecialDiscount: false,
    stock: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "menu-9",
    name: "Green Garden Salad Bowl",
    category: "Side Dishes",
    price: 72000,
    discountPercent: 0,
    isSpecialDiscount: false,
    stock: 14,
    imageUrl:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "menu-10",
    name: "Sesame Brioche Burger",
    category: "Main Course",
    price: 88000,
    discountPercent: 0,
    isSpecialDiscount: false,
    stock: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "menu-11",
    name: "Creamy Corn Soup",
    category: "Appetizer",
    price: 55000,
    discountPercent: 0,
    isSpecialDiscount: false,
    stock: 22,
    imageUrl:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "menu-12",
    name: "Nasi Ayam Katsu Kampus",
    category: "Main Course",
    price: 65000,
    discountPercent: 0,
    isSpecialDiscount: false,
    stock: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80",
  },
];

export const CATEGORIES = [
  "All",
  "Main Course",
  "Appetizer",
  "Dessert",
  "Side Dishes",
  "Beverages",
  "Kids",
] as const;

export type CategoryFilter = (typeof CATEGORIES)[number];

export function getEffectivePrice(item: MenuItem): number {
  if (item.isSpecialDiscount) {
    if (item.discountedPrice) return item.discountedPrice;
    return Math.round(item.price * (1 - item.discountPercent / 100));
  }
  return item.price;
}

export function formatRupiah(amount: number, withDecimals = false): string {
  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const prefix = amount < 0 ? "-Rp " : "Rp ";
  return withDecimals ? `${prefix}${formatted},00` : `${prefix}${formatted}`;
}

