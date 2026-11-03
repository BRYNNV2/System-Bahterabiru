import { create } from "zustand";
import {
  INITIAL_MENU_ITEMS,
  MenuItem,
  CategoryType,
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
  items: {
    product: MenuItem;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  paymentMethod: "Cash" | "Debit" | "QRIS";
  createdAt: string;
}

export type AppNavTab =
  | "pos"
  | "analytics"
  | "feedback"
  | "message"
  | "history"
  | "inventory"
  | "settings";

interface PosState {
  activeTab: AppNavTab;
  menuItems: MenuItem[];
  cart: CartItem[];
  selectedCategory: CategoryType;
  searchQuery: string;
  sortBy: "default" | "price-asc" | "price-desc" | "stock-desc";
  paymentMethod: "Cash" | "Debit" | "QRIS";
  recentOrders: CompletedOrder[];
  isFilterOpen: boolean;
  isSidebarOpen: boolean;
  isMobileCartOpen: boolean;

  // Actions
  setActiveTab: (tab: AppNavTab) => void;
  setSelectedCategory: (category: CategoryType) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: "default" | "price-asc" | "price-desc" | "stock-desc") => void;
  setPaymentMethod: (method: "Cash" | "Debit" | "QRIS") => void;
  setIsFilterOpen: (open: boolean) => void;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setIsMobileCartOpen: (open: boolean) => void;

  // Cart
  addToCart: (productId: string) => void;
  decrementFromCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;

  // Inventory / Admin
  updateProductStock: (productId: string, newStock: number) => void;

  // Checkout
  completeCheckout: () => CompletedOrder | null;
}

export const usePosStore = create<PosState>((set, get) => ({
  activeTab: "pos",
  menuItems: INITIAL_MENU_ITEMS,
  // Pre-populated matching the exact reference image
  cart: [
    { productId: "prod-9", quantity: 2 }, // Cinnaple
    { productId: "prod-10", quantity: 1 }, // Chicken Pop Matah
    { productId: "prod-2", quantity: 2 }, // Bolognese Spaghetti
  ],
  selectedCategory: "All Menu",
  searchQuery: "",
  sortBy: "default",
  paymentMethod: "Cash",
  recentOrders: [
    {
      id: "ord-prev-1",
      orderNumber: "TRX-8821",
      customerName: "Pelanggan Kantin",
      items: [
        {
          product: INITIAL_MENU_ITEMS[0],
          quantity: 2,
          unitPrice: 21200,
          lineTotal: 42400,
        },
      ],
      itemCount: 2,
      subtotal: 52400,
      discountTotal: 10000,
      taxTotal: 6360,
      totalAmount: 48760,
      paymentMethod: "QRIS",
      createdAt: "2026-11-01 14:20",
    },
  ],
  isFilterOpen: false,
  isSidebarOpen: true,
  isMobileCartOpen: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sortBy) => set({ sortBy }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setIsFilterOpen: (isFilterOpen) => set({ isFilterOpen }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setIsMobileCartOpen: (isMobileCartOpen) => set({ isMobileCartOpen }),

  addToCart: (productId) => {
    const { menuItems, cart } = get();
    const product = menuItems.find((p) => p.id === productId);
    if (!product) return;

    const existing = cart.find((c) => c.productId === productId);
    if (existing) {
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

  updateProductStock: (productId, newStock) => {
    set((state) => ({
      menuItems: state.menuItems.map((item) =>
        item.id === productId ? { ...item, stock: Math.max(0, newStock) } : item
      ),
    }));
  },

  completeCheckout: () => {
    const { cart, menuItems, paymentMethod, recentOrders } = get();
    if (cart.length === 0) return null;

    let subtotal = 0;
    let discountTotal = 0;
    let itemCount = 0;

    const detailedItems = cart
      .map((cartItem) => {
        const product = menuItems.find((m) => m.id === cartItem.productId);
        if (!product) return null;
        const effectiveUnit = getEffectivePrice(product);
        const originalLine = product.price * cartItem.quantity;
        const lineTotal = effectiveUnit * cartItem.quantity;

        subtotal += originalLine;
        discountTotal += originalLine - lineTotal;
        itemCount += cartItem.quantity;

        return {
          product,
          quantity: cartItem.quantity,
          unitPrice: effectiveUnit,
          lineTotal,
        };
      })
      .filter(Boolean) as CompletedOrder["items"];

    const taxTotal = Math.round((subtotal - discountTotal) * 0.15);
    const totalAmount = Math.max(0, subtotal - discountTotal + taxTotal);

    const newOrder: CompletedOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: "Pelanggan Kantin",
      items: detailedItems,
      itemCount,
      subtotal,
      discountTotal,
      taxTotal,
      totalAmount,
      paymentMethod,
      createdAt: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Update real-time stocks and sold counts
    const updatedMenu = menuItems.map((item) => {
      const inCart = cart.find((c) => c.productId === item.id);
      if (!inCart) return item;
      return {
        ...item,
        stock: Math.max(0, item.stock - inCart.quantity),
        soldCount: item.soldCount + inCart.quantity,
      };
    });

    set({
      menuItems: updatedMenu,
      cart: [],
      recentOrders: [newOrder, ...recentOrders],
    });

    return newOrder;
  },
}));
