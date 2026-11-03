import { create } from "zustand";
import {
  INITIAL_MENU_ITEMS,
  MenuItem,
  CategoryType,
  SidebarGroupType,
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
  activeSidebarGroup: SidebarGroupType;
  menuItems: MenuItem[];
  cart: CartItem[];
  selectedCategory: CategoryType;
  searchQuery: string;
  sortBy: "default" | "price-asc" | "price-desc" | "stock-desc";
  paymentMethod: "Cash" | "Debit" | "QRIS";
  orderMode: "Buy" | "Reservation";
  customerName: string;
  selectedTable: string;
  orderNote: string;
  recentOrders: CompletedOrder[];
  isFilterOpen: boolean;
  isSidebarOpen: boolean;
  isMobileCartOpen: boolean;
  isModalBlurActive: boolean;

  // Actions
  setActiveTab: (tab: AppNavTab) => void;
  setActiveSidebarGroup: (group: SidebarGroupType) => void;
  setSelectedCategory: (category: CategoryType) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: "default" | "price-asc" | "price-desc" | "stock-desc") => void;
  setPaymentMethod: (method: "Cash" | "Debit" | "QRIS") => void;
  setOrderMode: (mode: "Buy" | "Reservation") => void;
  setCustomerName: (name: string) => void;
  setSelectedTable: (table: string) => void;
  setOrderNote: (note: string) => void;
  setIsFilterOpen: (open: boolean) => void;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setIsMobileCartOpen: (open: boolean) => void;
  setIsModalBlurActive: (active: boolean) => void;

  // Cart
  addToCart: (productId: string) => void;
  addToCartWithQty: (productId: string, qty: number) => void;
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
  activeSidebarGroup: "Food",
  menuItems: INITIAL_MENU_ITEMS,
  // Pre-populated matching the reference screenshot (Steak sapi bakar, Ayam kentang, Mie kuah pedas)
  cart: [
    { productId: "prod-1", quantity: 1 },
    { productId: "prod-2", quantity: 1 },
    { productId: "prod-4", quantity: 1 },
  ],
  selectedCategory: "All Menu",
  searchQuery: "",
  sortBy: "default",
  paymentMethod: "Cash",
  orderMode: "Buy",
  customerName: "",
  selectedTable: "",
  orderNote: "",
  recentOrders: [
    {
      id: "ord-prev-1",
      orderNumber: "TRX-8821",
      customerName: "Pelanggan Meja 04",
      items: [
        {
          product: INITIAL_MENU_ITEMS[0],
          quantity: 2,
          unitPrice: 35000,
          lineTotal: 70000,
        },
      ],
      itemCount: 2,
      subtotal: 70000,
      discountTotal: 0,
      taxTotal: 7000,
      totalAmount: 77000,
      paymentMethod: "QRIS",
      createdAt: "12:40",
    },
  ],
  isFilterOpen: false,
  isSidebarOpen: true,
  isMobileCartOpen: false,
  isModalBlurActive: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveSidebarGroup: (group) =>
    set({
      activeSidebarGroup: group,
      selectedCategory: "All Menu",
      activeTab: "pos",
    }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sortBy) => set({ sortBy }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setOrderMode: (orderMode) => set({ orderMode }),
  setCustomerName: (customerName) => set({ customerName }),
  setSelectedTable: (selectedTable) => set({ selectedTable }),
  setOrderNote: (orderNote) => set({ orderNote }),
  setIsFilterOpen: (isFilterOpen) => set({ isFilterOpen }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setIsMobileCartOpen: (isMobileCartOpen) => set({ isMobileCartOpen }),
  setIsModalBlurActive: (isModalBlurActive) => set({ isModalBlurActive }),

  addToCart: (productId) => {
    const { menuItems, cart } = get();
    const product = menuItems.find((p) => p.id === productId);
    if (!product || product.stock <= 0) return;

    const existing = cart.find((c) => c.productId === productId);
    if (existing) {
      set({
        cart: cart.map((c) =>
          c.productId === productId
            ? { ...c, quantity: Math.min(product.stock, c.quantity + 1) }
            : c
        ),
      });
    } else {
      set({ cart: [...cart, { productId, quantity: 1 }] });
    }
  },

  addToCartWithQty: (productId, qty) => {
    const { menuItems, cart } = get();
    const product = menuItems.find((p) => p.id === productId);
    if (!product || product.stock <= 0 || qty <= 0) return;

    const existing = cart.find((c) => c.productId === productId);
    if (existing) {
      set({
        cart: cart.map((c) =>
          c.productId === productId
            ? { ...c, quantity: Math.min(product.stock, c.quantity + qty) }
            : c
        ),
      });
    } else {
      set({
        cart: [
          ...cart,
          { productId, quantity: Math.min(product.stock, qty) },
        ],
      });
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
    const {
      cart,
      menuItems,
      paymentMethod,
      recentOrders,
      customerName,
      selectedTable,
    } = get();
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

    const netSubtotal = Math.max(0, subtotal - discountTotal);
    const taxTotal = Math.round(netSubtotal * 0.1);
    const totalAmount = netSubtotal + taxTotal;

    const formattedCustomer = customerName.trim()
      ? selectedTable
        ? `${customerName.trim()} (${selectedTable})`
        : customerName.trim()
      : selectedTable
      ? `Pelanggan (${selectedTable})`
      : "Pelanggan Kantin";

    const newOrder: CompletedOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: formattedCustomer,
      items: detailedItems,
      itemCount,
      subtotal: netSubtotal,
      discountTotal,
      taxTotal,
      totalAmount,
      paymentMethod,
      createdAt: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

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
      customerName: "",
      orderNote: "",
      recentOrders: [newOrder, ...recentOrders],
    });

    return newOrder;
  },
}));
