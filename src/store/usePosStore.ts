import { create } from "zustand";
import {
  INITIAL_MENU_ITEMS,
  MenuItem,
  CategoryFilter,
  getEffectivePrice,
} from "@/data/initialMenu";

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CompletedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  personCount: number;
  items: {
    product: MenuItem;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  paymentMethod: "QRIS" | "TUNAI" | "KARTU_MAHASISWA";
  createdAt: string;
}

interface PosState {
  menuItems: MenuItem[];
  cart: CartItem[];
  customerName: string;
  personCount: number;
  searchQuery: string;
  selectedCategory: CategoryFilter;
  sortBy: "default" | "price-asc" | "price-desc" | "stock-desc";
  onlyAvailable: boolean;
  recentOrders: CompletedOrder[];

  // Actions
  setMenuItems: (items: MenuItem[]) => void;
  setCustomerName: (name: string) => void;
  setPersonCount: (count: number) => void;
  incrementPerson: () => void;
  decrementPerson: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: CategoryFilter) => void;
  setSortBy: (sort: "default" | "price-asc" | "price-desc" | "stock-desc") => void;
  setOnlyAvailable: (only: boolean) => void;

  // Cart Actions
  addToCart: (productId: string) => void;
  decrementFromCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;

  // Checkout Action
  completeCheckout: (
    paymentMethod: "QRIS" | "TUNAI" | "KARTU_MAHASISWA"
  ) => CompletedOrder | null;
}

export const usePosStore = create<PosState>((set, get) => ({
  menuItems: INITIAL_MENU_ITEMS,
  // Pre-populated with the exact items shown in the reference design
  cart: [
    { productId: "disc-2", quantity: 2 }, // Japanese Chicken Gyoza
    { productId: "disc-3", quantity: 2 }, // 2pcs of Amazing Avocado
    { productId: "menu-4", quantity: 4 }, // Healthy Kids Meal
    { productId: "menu-2", quantity: 2 }, // Krosang Thats It
    { productId: "menu-5", quantity: 6 }, // Mangoo Cereal Milk
    { productId: "menu-7", quantity: 10 }, // Rainbow Cupcake
  ],
  customerName: "Emir Abiyyu",
  personCount: 12,
  searchQuery: "",
  selectedCategory: "All",
  sortBy: "default",
  onlyAvailable: false,
  recentOrders: [],

  setMenuItems: (items) => set({ menuItems: items }),
  setCustomerName: (name) => set({ customerName: name }),
  setPersonCount: (count) => set({ personCount: Math.max(1, count) }),
  incrementPerson: () =>
    set((state) => ({ personCount: state.personCount + 1 })),
  decrementPerson: () =>
    set((state) => ({ personCount: Math.max(1, state.personCount - 1) })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSortBy: (sortBy) => set({ sortBy }),
  setOnlyAvailable: (onlyAvailable) => set({ onlyAvailable }),

  addToCart: (productId) => {
    const { menuItems, cart } = get();
    const product = menuItems.find((item) => item.id === productId);
    if (!product || product.stock <= 0) return;

    const existing = cart.find((c) => c.productId === productId);
    if (existing) {
      if (existing.quantity >= product.stock) return; // Prevent ordering more than stock
      set({
        cart: cart.map((c) =>
          c.productId === productId ? { ...c, quantity: c.quantity + 1 } : c
        ),
      });
    } else {
      set({ cart: [...cart, { productId, quantity: 1 }] });
    }
  },

  decrementFromCart: (productId) => {
    const { cart } = get();
    const existing = cart.find((c) => c.productId === productId);
    if (!existing) return;

    if (existing.quantity <= 1) {
      set({ cart: cart.filter((c) => c.productId !== productId) });
    } else {
      set({
        cart: cart.map((c) =>
          c.productId === productId ? { ...c, quantity: c.quantity - 1 } : c
        ),
      });
    }
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((c) => c.productId !== productId),
    }));
  },

  clearCart: () => set({ cart: [] }),

  getItemQuantity: (productId) => {
    const found = get().cart.find((c) => c.productId === productId);
    return found ? found.quantity : 0;
  },

  completeCheckout: (paymentMethod) => {
    const { cart, menuItems, customerName, personCount, recentOrders } = get();
    if (cart.length === 0) return null;

    let subtotal = 0;
    let discountTotal = 0;

    const detailedItems = cart
      .map((cartItem) => {
        const product = menuItems.find((m) => m.id === cartItem.productId);
        if (!product) return null;
        const effectiveUnit = getEffectivePrice(product);
        const origLine = product.price * cartItem.quantity;
        const finalLine = effectiveUnit * cartItem.quantity;
        const itemDiscount = origLine - finalLine;

        subtotal += origLine;
        discountTotal += itemDiscount;

        return {
          product,
          quantity: cartItem.quantity,
          unitPrice: effectiveUnit,
          lineTotal: finalLine,
        };
      })
      .filter(Boolean) as CompletedOrder["items"];

    // Extra promotional discount if subtotal >= 1.000.000 to mirror the design's Rp 120.000 discount feel
    if (discountTotal < 120000 && subtotal >= 1000000) {
      discountTotal = 120000;
    }

    const taxTotal = detailedItems.length > 0 ? 40000 : 0;
    const totalAmount = Math.max(0, subtotal - discountTotal + taxTotal);

    const newOrder: CompletedOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `KNS-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName.trim() || "Pelanggan Kantin",
      personCount,
      items: detailedItems,
      subtotal,
      discountTotal,
      taxTotal,
      totalAmount,
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    // Deduct stock from menuItems in real-time
    const updatedMenuItems = menuItems.map((item) => {
      const ordered = cart.find((c) => c.productId === item.id);
      if (!ordered) return item;
      return {
        ...item,
        stock: Math.max(0, item.stock - ordered.quantity),
      };
    });

    set({
      menuItems: updatedMenuItems,
      cart: [],
      recentOrders: [newOrder, ...recentOrders],
    });

    return newOrder;
  },
}));
