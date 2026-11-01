export interface MenuItem {
  id: string;
  name: string;
  category: "Coffee" | "Tea" | "Mocktail" | "Rice" | "Pasta" | "Burger";
  price: number; // Strikethrough / original price
  discountPercent?: number; // e.g. 25 for 25% Off
  discountedPrice?: number; // Price after discount
  stock: number; // Available count
  soldCount: number; // Sold count
  imageUrl: string;
}

export const CATEGORIES_WITH_META = [
  { id: "All Menu", label: "All Menu", count: 58, icon: "utensils" },
  { id: "Coffee", label: "Coffee", count: 20, icon: "coffee" },
  { id: "Tea", label: "Tea", count: 16, icon: "cup-soda" },
  { id: "Mocktail", label: "Mocktail", count: 8, icon: "glass-water" },
  { id: "Rice", label: "Rice", count: 6, icon: "bowl" },
  { id: "Pasta", label: "Pasta", count: 4, icon: "soup" },
  { id: "Burger", label: "Burger", count: 4, icon: "sandwich" },
] as const;

export type CategoryType = (typeof CATEGORIES_WITH_META)[number]["id"];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: "prod-1",
    name: "Coffee Latte",
    category: "Coffee",
    price: 26200,
    discountPercent: 25,
    discountedPrice: 21200,
    stock: 32,
    soldCount: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-2",
    name: "Bolognese Spaghetti",
    category: "Pasta",
    price: 21200,
    stock: 0,
    soldCount: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-3",
    name: "Thanos Burger",
    category: "Burger",
    price: 21200,
    stock: 12,
    soldCount: 13,
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-4",
    name: "Chamomile Tea",
    category: "Tea",
    price: 21200,
    stock: 24,
    soldCount: 6,
    imageUrl:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-5",
    name: "Neck Burner",
    category: "Mocktail",
    price: 26200,
    discountPercent: 25,
    discountedPrice: 21200,
    stock: 0,
    soldCount: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-6",
    name: "Black Tea",
    category: "Tea",
    price: 21200,
    stock: 24,
    soldCount: 6,
    imageUrl:
      "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-7",
    name: "Otak Udang",
    category: "Rice",
    price: 26500,
    discountPercent: 20,
    discountedPrice: 21200,
    stock: 3,
    soldCount: 21,
    imageUrl:
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-8",
    name: "Mie Sedap",
    category: "Pasta",
    price: 21200,
    stock: 0,
    soldCount: 34,
    imageUrl:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-9",
    name: "Cinnaple",
    category: "Coffee",
    price: 21200,
    stock: 15,
    soldCount: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-10",
    name: "Chicken Pop Matah",
    category: "Rice",
    price: 35000,
    stock: 18,
    soldCount: 14,
    imageUrl:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-11",
    name: "French Fries Cheese",
    category: "Mocktail",
    price: 23500,
    discountPercent: 10,
    discountedPrice: 21200,
    stock: 20,
    soldCount: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-12",
    name: "Garden Salad Bowl",
    category: "Rice",
    price: 25000,
    discountPercent: 15,
    discountedPrice: 21200,
    stock: 16,
    soldCount: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
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
