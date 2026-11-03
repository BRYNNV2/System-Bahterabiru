export interface MenuItem {
  id: string;
  name: string;
  category:
    | "Chicken"
    | "Seafood"
    | "Pasta"
    | "Rice bowl"
    | "Coffee"
    | "Beverages"
    | "Appetizer"
    | "Bread"
    | "Snack";
  group: "Food" | "Coffee" | "Beverages" | "Appetizer" | "Bread" | "Snack";
  price: number;
  discountPercent?: number;
  discountedPrice?: number;
  stock: number;
  soldCount: number;
  imageUrl: string;
}

export const SIDEBAR_GROUPS = [
  { id: "Food", label: "Food" },
  { id: "Coffee", label: "Coffee" },
  { id: "Beverages", label: "Beverages" },
  { id: "Appetizer", label: "Appetizer" },
  { id: "Bread", label: "Bread" },
  { id: "Snack", label: "Snack" },
] as const;

export type SidebarGroupType = (typeof SIDEBAR_GROUPS)[number]["id"];

export const CATEGORIES_WITH_META = [
  { id: "All Menu", label: "All", count: 18, icon: "utensils" },
  { id: "Chicken", label: "Chicken", count: 4, icon: "chicken" },
  { id: "Seafood", label: "Seafood", count: 4, icon: "fish" },
  { id: "Pasta", label: "Pasta", count: 4, icon: "soup" },
  { id: "Rice bowl", label: "Rice bowl", count: 4, icon: "bowl" },
  { id: "Coffee", label: "Coffee", count: 3, icon: "coffee" },
  { id: "Beverages", label: "Beverages", count: 3, icon: "cup-soda" },
  { id: "Snack", label: "Snack", count: 4, icon: "cookie" },
] as const;

export type CategoryType = (typeof CATEGORIES_WITH_META)[number]["id"];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: "prod-1",
    name: "Steak sapi bakar",
    category: "Rice bowl",
    group: "Food",
    price: 35000,
    stock: 24,
    soldCount: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-2",
    name: "Ayam kentang",
    category: "Chicken",
    group: "Food",
    price: 25000,
    stock: 18,
    soldCount: 14,
    imageUrl:
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-3",
    name: "Ikan santan",
    category: "Seafood",
    group: "Food",
    price: 22000,
    stock: 15,
    soldCount: 11,
    imageUrl:
      "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-4",
    name: "Mie kuah pedas",
    category: "Pasta",
    group: "Food",
    price: 19000,
    stock: 28,
    soldCount: 22,
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-5",
    name: "Kuah santan",
    category: "Appetizer",
    group: "Appetizer",
    price: 15000,
    stock: 20,
    soldCount: 9,
    imageUrl:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-6",
    name: "Mie gepeng telor",
    category: "Pasta",
    group: "Food",
    price: 21000,
    stock: 22,
    soldCount: 16,
    imageUrl:
      "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-7",
    name: "Nasi steak ayam",
    category: "Chicken",
    group: "Food",
    price: 26500,
    stock: 16,
    soldCount: 19,
    imageUrl:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-8",
    name: "Steak ikan santan",
    category: "Seafood",
    group: "Food",
    price: 24500,
    stock: 14,
    soldCount: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-9",
    name: "Nasi goreng putih",
    category: "Rice bowl",
    group: "Food",
    price: 18000,
    stock: 30,
    soldCount: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-10",
    name: "Nasi ayam salad",
    category: "Chicken",
    group: "Food",
    price: 21500,
    stock: 19,
    soldCount: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-11",
    name: "Mie putih ayam pedas",
    category: "Pasta",
    group: "Food",
    price: 20000,
    stock: 21,
    soldCount: 17,
    imageUrl:
      "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-12",
    name: "Cumi-cumi",
    category: "Seafood",
    group: "Food",
    price: 23000,
    stock: 12,
    soldCount: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-13",
    name: "Caramel Coffee Latte",
    category: "Coffee",
    group: "Coffee",
    price: 18500,
    stock: 35,
    soldCount: 28,
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-14",
    name: "Iced Americano",
    category: "Coffee",
    group: "Coffee",
    price: 15000,
    stock: 40,
    soldCount: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-15",
    name: "Tropical Berry Refresher",
    category: "Beverages",
    group: "Beverages",
    price: 17500,
    stock: 25,
    soldCount: 14,
    imageUrl:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-16",
    name: "Artisan Butter Croissant",
    category: "Snack",
    group: "Bread",
    price: 16000,
    stock: 15,
    soldCount: 11,
    imageUrl:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-17",
    name: "Crispy Potato Wedges",
    category: "Snack",
    group: "Snack",
    price: 14500,
    stock: 26,
    soldCount: 19,
    imageUrl:
      "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
  },
];

export function getEffectivePrice(item: MenuItem): number {
  if (item.discountedPrice) return item.discountedPrice;
  if (item.discountPercent) {
    return Math.round(item.price * (1 - item.discountPercent / 100));
  }
  return item.price;
}

export function formatRupiah(amount: number): string {
  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}
