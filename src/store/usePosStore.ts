import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export type OrderStatusType = "Preparing" | "Ready" | "Completed";

export interface CompletedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  status?: OrderStatusType;
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
  isAdminAuthenticated: boolean;

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

  // Admin Auth
  loginAdmin: (username: string, password: string) => boolean;
  logoutAdmin: () => void;

  // Cart
  addToCart: (productId: string) => void;
  addToCartWithQty: (productId: string, qty: number) => void;
  decrementFromCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;

  // Admin Menu CRUD & Stock
  updateProductStock: (productId: string, newStock: number) => void;
  addMenuItem: (item: Omit<MenuItem, "id" | "soldCount">) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;

  // Admin Orders Management
  updateOrderStatus: (orderId: string, status: OrderStatusType) => void;
  deleteOrder: (orderId: string) => void;

  // Multi-Device Backend Sync
  syncFromServer: () => Promise<void>;

  // Checkout
  completeCheckout: () => CompletedOrder | null;
}

async function sendSyncMutation(action: string, payload: unknown) {
  try {
    await fetch("/api/pos-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
  } catch {
    // Fallback to local state if offline
  }
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      activeTab: "pos",
      activeSidebarGroup: "Food",
      menuItems: INITIAL_MENU_ITEMS,
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
      ],
      isFilterOpen: false,
      isSidebarOpen: true,
      isMobileCartOpen: false,
      isModalBlurActive: false,
      isAdminAuthenticated: false,

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
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setIsMobileCartOpen: (isMobileCartOpen) => set({ isMobileCartOpen }),
      setIsModalBlurActive: (isModalBlurActive) => set({ isModalBlurActive }),

      loginAdmin: (username, password) => {
        const cleanUser = username.trim().toLowerCase();
        if (
          (cleanUser === "admin" ||
            cleanUser === "admin@coca.com" ||
            cleanUser === "admin@bahterabiru.com") &&
          password === "admin123"
        ) {
          set({ isAdminAuthenticated: true });
          return true;
        }
        return false;
      },

      logoutAdmin: () => set({ isAdminAuthenticated: false }),

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
              c.productId === productId
                ? { ...c, quantity: c.quantity - 1 }
                : c
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
        const clamped = Math.max(0, newStock);
        set((state) => ({
          menuItems: state.menuItems.map((item) =>
            item.id === productId ? { ...item, stock: clamped } : item
          ),
        }));
        void sendSyncMutation("UPDATE_STOCK", {
          productId,
          newStock: clamped,
        });
      },

      addMenuItem: (newItem) => {
        const created: MenuItem = {
          ...newItem,
          id: `prod-${Date.now()}`,
          soldCount: 0,
        };
        set((state) => ({
          menuItems: [created, ...state.menuItems],
        }));
        void sendSyncMutation("ADD_MENU", { item: created });
      },

      updateMenuItem: (id, updates) => {
        set((state) => ({
          menuItems: state.menuItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
        void sendSyncMutation("UPDATE_MENU", { id, updates });
      },

      deleteMenuItem: (id) => {
        set((state) => ({
          menuItems: state.menuItems.filter((item) => item.id !== id),
          cart: state.cart.filter((c) => c.productId !== id),
        }));
        void sendSyncMutation("DELETE_MENU", { id });
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          recentOrders: state.recentOrders.map((o) =>
            o.id === orderId ? { ...o, status } : o
          ),
        }));
        void sendSyncMutation("UPDATE_ORDER_STATUS", { orderId, status });
      },

      deleteOrder: (orderId) => {
        set((state) => ({
          recentOrders: state.recentOrders.filter((o) => o.id !== orderId),
        }));
        void sendSyncMutation("DELETE_ORDER", { orderId });
      },

      syncFromServer: async () => {
        try {
          const res = await fetch("/api/pos-sync", { cache: "no-store" });
          if (!res.ok) return;
          const data = await res.json();
          if (
            data &&
            Array.isArray(data.menuItems) &&
            Array.isArray(data.recentOrders)
          ) {
            set({
              menuItems: data.menuItems,
              recentOrders: data.recentOrders,
            });
          }
        } catch {
          // Ignore network errors if offline
        }
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
          orderNumber: `#F${Math.floor(1000 + Math.random() * 9000)}`,
          customerName: formattedCustomer,
          status: "Preparing",
          items: detailedItems,
          itemCount,
          subtotal: netSubtotal,
          discountTotal,
          taxTotal,
          totalAmount,
          paymentMethod,
          createdAt: `Today, ${new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
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

        void sendSyncMutation("CREATE_ORDER", { order: newOrder });

        return newOrder;
      },
    }),
    {
      name: "coca-pos-storage-v2",
      partialize: (state) => ({
        menuItems: state.menuItems,
        recentOrders: state.recentOrders,
        isAdminAuthenticated: state.isAdminAuthenticated,
      }),
    }
  )
);
