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
export type PaymentMethod = "Cash" | "Debit" | "QRIS";

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
  /** Timestamp ISO asli (dipakai untuk History Transaksi & filter tanggal) */
  createdAtIso?: string;
  /** Timestamp ISO terakhir status diubah */
  updatedAtIso?: string;
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
  lastBuyerOrder: CompletedOrder | null;
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
  setLastBuyerOrder: (order: CompletedOrder | null) => void;
  setIsFilterOpen: (open: boolean) => void;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setIsMobileCartOpen: (open: boolean) => void;
  setIsModalBlurActive: (active: boolean) => void;

  // Admin Auth (diverifikasi di server, sesi via cookie httpOnly)
  loginAdmin: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  checkAdminSession: () => Promise<boolean>;

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

let pendingMutations = 0;
let mutationEpoch = 0;
let lastSyncedImagesHash = "";

function mergeMenuItemsPreservingImages(
  incoming: MenuItem[],
  existing: MenuItem[],
  imagesOmitted?: boolean
): MenuItem[] {
  if (!imagesOmitted && existing.length === 0) return incoming;
  const existingImgMap = new Map(existing.map((m) => [m.id, m.imageUrl]));
  return incoming.map((item) => {
    if (item.imageUrl) return item;
    const cachedUrl = existingImgMap.get(item.id);
    return cachedUrl ? { ...item, imageUrl: cachedUrl } : item;
  });
}

async function sendSyncMutation(
  action: string,
  payload: unknown,
  onSuccess?: (data: {
    menuItems?: MenuItem[];
    recentOrders?: CompletedOrder[];
    imagesOmitted?: boolean;
  }) => void
) {
  pendingMutations += 1;
  mutationEpoch += 1;
  if (action === "ADD_MENU" || action === "UPDATE_MENU" || action === "DELETE_MENU") {
    lastSyncedImagesHash = "";
  }
  try {
    const res = await fetch("/api/pos-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action, payload }),
    });
    if (res.status === 401) {
      // Sesi admin habis / tidak valid → paksa login ulang
      usePosStore.setState({ isAdminAuthenticated: false });
      void usePosStore.getState().syncFromServer();
      return;
    }
    if (res.ok && pendingMutations === 1 && onSuccess) {
      const data = await res.json();
      if (Array.isArray(data.menuItems)) {
        data.menuItems = mergeMenuItemsPreservingImages(
          data.menuItems,
          usePosStore.getState().menuItems,
          Boolean(data.imagesOmitted)
        );
      }
      onSuccess(data);
    }
  } catch {
    // Fallback to local state if offline
  } finally {
    pendingMutations = Math.max(0, pendingMutations - 1);
  }
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      activeTab: "pos",
      activeSidebarGroup: "All",
      menuItems: [],
      cart: [],
      selectedCategory: "All Menu",
      searchQuery: "",
      sortBy: "default",
      paymentMethod: "Cash",
      orderMode: "Buy",
      customerName: "",
      selectedTable: "",
      orderNote: "",
      recentOrders: [],
      lastBuyerOrder: null,
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
      setSelectedCategory: (category) =>
        set((state) => ({
          selectedCategory: category,
          activeSidebarGroup:
            category === "All Menu" ? "All" : state.activeSidebarGroup,
        })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortBy: (sortBy) => set({ sortBy }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setOrderMode: (orderMode) => set({ orderMode }),
      setCustomerName: (customerName) => set({ customerName }),
      setSelectedTable: (selectedTable) => set({ selectedTable }),
      setOrderNote: (orderNote) => set({ orderNote }),
      setLastBuyerOrder: (lastBuyerOrder) => set({ lastBuyerOrder }),
      setIsFilterOpen: (isFilterOpen) => set({ isFilterOpen }),
      setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setIsMobileCartOpen: (isMobileCartOpen) => set({ isMobileCartOpen }),
      setIsModalBlurActive: (isModalBlurActive) => set({ isModalBlurActive }),

      loginAdmin: async (username, password) => {
        try {
          const res = await fetch("/api/admin-auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ username, password }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            success?: boolean;
            error?: string;
          };
          if (res.ok && data.success) {
            set({ isAdminAuthenticated: true });
            void get().syncFromServer();
            return { ok: true };
          }
          set({ isAdminAuthenticated: false });
          return { ok: false, error: data.error || "Login gagal." };
        } catch {
          return { ok: false, error: "Tidak dapat terhubung ke server." };
        }
      },

      logoutAdmin: async () => {
        set({ isAdminAuthenticated: false, recentOrders: [] });
        try {
          await fetch("/api/admin-auth", {
            method: "DELETE",
            credentials: "same-origin",
          });
        } catch {
          // abaikan
        }
      },

      checkAdminSession: async () => {
        try {
          const res = await fetch("/api/admin-auth", {
            cache: "no-store",
            credentials: "same-origin",
          });
          const data = (await res.json()) as { authenticated?: boolean };
          const ok = Boolean(data.authenticated);
          set({ isAdminAuthenticated: ok });
          return ok;
        } catch {
          set({ isAdminAuthenticated: false });
          return false;
        }
      },

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
        const currentOrder = get().recentOrders.find((o) => o.id === orderId);
        if (currentOrder?.status === "Completed") return;
        set((state) => ({
          recentOrders: state.recentOrders.map((o) =>
            o.id === orderId && o.status !== "Completed"
              ? { ...o, status, updatedAtIso: new Date().toISOString() }
              : o
          ),
        }));
        void sendSyncMutation("UPDATE_ORDER_STATUS", { orderId, status });
      },

      deleteOrder: (orderId) => {
        set((state) => {
          const targetOrder = state.recentOrders.find((o) => o.id === orderId);
          const remainingOrders = state.recentOrders.filter(
            (o) => o.id !== orderId
          );

          // Hitung ulang soldCount dari sisa transaksi aktif & kembalikan stok pesanan yang dibatalkan/dihapus
          const actualSoldMap = new Map<string, number>();
          for (const ord of remainingOrders) {
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

          const updatedMenu = state.menuItems.map((item) => {
            const cancelledLine = targetOrder?.items.find(
              (i) => i.product.id === item.id
            );
            const restoredStock = cancelledLine
              ? item.stock + cancelledLine.quantity
              : item.stock;
            return {
              ...item,
              stock: restoredStock,
              soldCount: actualSoldMap.get(item.id) || 0,
            };
          });

          return {
            menuItems: updatedMenu,
            recentOrders: remainingOrders,
          };
        });
        void sendSyncMutation("DELETE_ORDER", { orderId });
      },

      syncFromServer: async () => {
        if (pendingMutations > 0) return;
        const epochAtStart = mutationEpoch;
        try {
          const currentState = get();
          const trackedId = currentState.lastBuyerOrder?.id;
          const hasFullImagesInMemory =
            currentState.menuItems.length > 0 &&
            currentState.menuItems.every((m) => Boolean(m.imageUrl));

          const params = new URLSearchParams();
          if (trackedId) params.set("orderId", trackedId);
          if (hasFullImagesInMemory && lastSyncedImagesHash) {
            params.set("imgHash", lastSyncedImagesHash);
          }
          const qs = params.toString();
          const url = qs ? `/api/pos-sync?${qs}` : "/api/pos-sync";

          const res = await fetch(url, { cache: "no-store" });
          if (
            !res.ok ||
            pendingMutations > 0 ||
            mutationEpoch !== epochAtStart
          ) {
            return;
          }
          const data = await res.json();
          if (pendingMutations > 0 || mutationEpoch !== epochAtStart) return;
          if (
            data &&
            Array.isArray(data.menuItems) &&
            Array.isArray(data.recentOrders)
          ) {
            const imagesOmitted = Boolean(data.imagesOmitted);
            if (typeof data.imagesHash === "string") {
              lastSyncedImagesHash = data.imagesHash;
            }

            let mergedMenuSnapshot: MenuItem[] = [];
            set((state) => {
              const mergedMenu = mergeMenuItemsPreservingImages(
                data.menuItems as MenuItem[],
                state.menuItems,
                imagesOmitted
              );
              mergedMenuSnapshot = mergedMenu;

              let updatedBuyerOrder = state.lastBuyerOrder;
              if (updatedBuyerOrder) {
                const fromTracked = data.trackedOrder as
                  | { id: string; status: OrderStatusType }
                  | null
                  | undefined;
                const fromRecent = (data.recentOrders as CompletedOrder[]).find(
                  (o) => o.id === updatedBuyerOrder?.id
                );
                const latestStatus =
                  fromTracked?.status || fromRecent?.status;
                if (latestStatus && latestStatus !== updatedBuyerOrder.status) {
                  updatedBuyerOrder = {
                    ...updatedBuyerOrder,
                    status: latestStatus,
                  };
                }
              }
              return {
                menuItems: mergedMenu,
                recentOrders: data.recentOrders,
                lastBuyerOrder: updatedBuyerOrder,
              };
            });

            if (imagesOmitted && mergedMenuSnapshot.some((m) => !m.imageUrl)) {
              lastSyncedImagesHash = "";
            }
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
        const taxTotal = 0;
        const totalAmount = netSubtotal;

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
          createdAtIso: new Date().toISOString(),
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
          lastBuyerOrder: newOrder,
        });

        void sendSyncMutation("CREATE_ORDER", { order: newOrder });

        return newOrder;
      },
    }),
    {
      name: "coca-pos-storage-v3",
      partialize: (state) => {
        const totalImageChars = state.menuItems.reduce(
          (sum, item) => sum + (item.imageUrl?.length || 0),
          0
        );
        const stripDataUrl = (url?: string) =>
          url && url.startsWith("data:") ? "" : url || "";

        const persistedMenuItems =
          totalImageChars > 2_500_000
            ? state.menuItems.map((item) => ({
                ...item,
                imageUrl: stripDataUrl(item.imageUrl),
              }))
            : state.menuItems;

        const persistedLastBuyerOrder = state.lastBuyerOrder
          ? {
              ...state.lastBuyerOrder,
              items: state.lastBuyerOrder.items.map((line) => ({
                ...line,
                product: {
                  ...line.product,
                  imageUrl: stripDataUrl(line.product.imageUrl),
                },
              })),
            }
          : null;

        return {
          menuItems: persistedMenuItems,
          lastBuyerOrder: persistedLastBuyerOrder,
        };
      },
      // Status login admin TIDAK pernah dipulihkan dari localStorage (hanya dari cookie server)
      merge: (persisted, current) => {
        const p = (persisted || {}) as Partial<PosState>;
        return {
          ...current,
          ...(Array.isArray(p.menuItems) ? { menuItems: p.menuItems } : {}),
          ...(p.lastBuyerOrder ? { lastBuyerOrder: p.lastBuyerOrder } : {}),
          isAdminAuthenticated: false,
        };
      },
    }
  )
);
