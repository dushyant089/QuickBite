import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Navbar from "./components/Navbar";
import API_BASE_URL from "../config";

const API_URL = `${API_BASE_URL}/orders`;

const FOOD_VIDEO =
  "https://cdn.coverr.co/videos/coverr-a-chef-preparing-food-1578/1080p.mp4";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=90";

const STATUS_CONFIG = {
  CONFIRMED: {
    label: "Confirmed",
    icon: "✓",
    className:
      "bg-blue-50/90 text-blue-700 border-blue-100",
  },
  PREPARING: {
    label: "Preparing",
    icon: "🍳",
    className:
      "bg-yellow-50/90 text-yellow-700 border-yellow-100",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    icon: "🛵",
    className:
      "bg-orange-50/90 text-orange-700 border-orange-100",
  },
  DELIVERED: {
    label: "Delivered",
    icon: "✓",
    className:
      "bg-green-50/90 text-green-700 border-green-100",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: "✕",
    className:
      "bg-red-50/90 text-red-700 border-red-100",
  },
};

function normalizeStatus(status) {
  if (!status) return "CONFIRMED";

  const value = String(status)
    .toUpperCase()
    .trim();

  if (value === "OUT FOR DELIVERY") {
    return "OUT_FOR_DELIVERY";
  }

  return value;
}

function getStatusConfig(status) {
  const normalized = normalizeStatus(status);

  return (
    STATUS_CONFIG[normalized] || {
      label: normalized.replaceAll("_", " "),
      icon: "📦",
      className:
        "bg-gray-50/90 text-gray-700 border-gray-100",
    }
  );
}

function formatPaymentMethod(paymentMethod) {
  if (!paymentMethod) {
    return "Cash on Delivery";
  }

  if (
    paymentMethod
      .toLowerCase()
      .includes("cash")
  ) {
    return "Cash on Delivery";
  }

  return paymentMethod;
}

function canCancelOrder(status) {
  const normalized = normalizeStatus(status);

  return (
    normalized === "CONFIRMED" ||
    normalized === "PREPARING"
  );
}

function getAuthToken() {
  const possibleTokenKeys = [
    "quickbite-user-token",
    "quickbite-token",
    "token",
    "jwtToken",
    "jwt",
    "accessToken",
    "authToken",
  ];

  for (const key of possibleTokenKeys) {
    const value =
      localStorage.getItem(key);

    if (value && value.trim()) {
      return value
        .trim()
        .replace(/^Bearer\s+/i, "");
    }
  }

  return null;
}

/* ===============================
   GLOBAL FOOD BACKGROUND
================================ */
function PageBackground({ children }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gray-950"
      style={{
        backgroundImage: `url("${HERO_FALLBACK}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Food Video */}
      <video
        className="fixed inset-0 w-full h-full object-cover -z-20"
        autoPlay
        muted
        loop
        playsInline
        poster={HERO_FALLBACK}
        onError={(event) => {
          event.currentTarget.style.display =
            "none";
        }}
      >
        <source
          src={FOOD_VIDEO}
          type="video/mp4"
        />
      </video>

      {/* Dark Overlay */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.72) 48%, rgba(0,0,0,0.52) 100%)",
        }}
      />

      {/* Pink Glow */}
      <div
        className="fixed pointer-events-none -z-10"
        style={{
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          right: "-150px",
          top: "-100px",
          background:
            "rgba(255,77,109,0.20)",
          filter: "blur(80px)",
        }}
      />

      {/* Bottom Glow */}
      <div
        className="fixed pointer-events-none -z-10"
        style={{
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          left: "-180px",
          bottom: "-180px",
          background:
            "rgba(255,140,66,0.12)",
          filter: "blur(90px)",
        }}
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState("");
  const [expandedOrder, setExpandedOrder] =
    useState(null);
  const [reorderingId, setReorderingId] =
    useState(null);
  const [cancellingId, setCancellingId] =
    useState(null);

  const getCurrentUser = () => {
    try {
      const savedUser =
        localStorage.getItem(
          "quickbite-user"
        );

      if (!savedUser) {
        return null;
      }

      return JSON.parse(savedUser);
    } catch (err) {
      console.error(
        "User read error:",
        err
      );

      return null;
    }
  };

  const loadLocalOrders = () => {
    try {
      const savedOrders =
        localStorage.getItem(
          "quickbite-orders"
        );

      if (!savedOrders) {
        return [];
      }

      const parsed =
        JSON.parse(savedOrders);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (err) {
      console.error(
        "Local orders read error:",
        err
      );

      return [];
    }
  };

  const saveLocalOrders = (
    orderList
  ) => {
    try {
      localStorage.setItem(
        "quickbite-orders",
        JSON.stringify(orderList)
      );
    } catch (err) {
      console.error(
        "Local orders save error:",
        err
      );
    }
  };

  const mergeOrders = (
    backendOrders,
    localOrders,
    userEmail
  ) => {
    const email = String(
      userEmail || ""
    ).toLowerCase();

    const customerBackendOrders =
      backendOrders.filter(
        (order) =>
          String(
            order.customerEmail || ""
          ).toLowerCase() === email
      );

    const backendMap = new Map(
      customerBackendOrders.map(
        (order) => [
          String(order.id),
          order,
        ]
      )
    );

    const localMap = new Map(
      localOrders
        .filter(
          (order) =>
            !email ||
            String(
              order.customerEmail || ""
            ).toLowerCase() === email
        )
        .map((order) => [
          String(order.id),
          order,
        ])
    );

    const allIds = new Set([
      ...backendMap.keys(),
      ...localMap.keys(),
    ]);

    const merged = Array.from(
      allIds
    ).map((id) => {
      const backendOrder =
        backendMap.get(id);

      const localOrder =
        localMap.get(id);

      if (!backendOrder) {
        return localOrder;
      }

      return {
        ...localOrder,
        ...backendOrder,
        orderItems:
          backendOrder.orderItems ||
          localOrder?.orderItems ||
          [],
      };
    });

    return merged.sort((a, b) => {
      const aId = Number(
        a?.id || 0
      );

      const bId = Number(
        b?.id || 0
      );

      return bId - aId;
    });
  };

  const fetchOrders = useCallback(
    async (showRefresh = false) => {
      const user =
        getCurrentUser();

      const localOrders =
        loadLocalOrders();

      if (showRefresh) {
        setRefreshing(true);
      }

      try {
        const token =
          getAuthToken();

        if (!token) {
          throw new Error(
            "Authentication token not found."
          );
        }

        const response =
          await fetch(API_URL, {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
              Accept:
                "application/json",
            },
          });

        const responseText =
          await response.text();

        let responseData = null;

        try {
          responseData =
            responseText
              ? JSON.parse(
                  responseText
                )
              : null;
        } catch {
          responseData =
            responseText;
        }

        if (!response.ok) {
          console.error(
            "Orders backend error:",
            {
              status:
                response.status,
              response:
                responseData,
            }
          );

          if (
            response.status ===
              401 ||
            response.status ===
              403
          ) {
            throw new Error(
              "Your login session is not authorized. Please login again."
            );
          }

          throw new Error(
            responseData?.message ||
              `Could not load orders. Status ${response.status}`
          );
        }

        const backendOrders =
          Array.isArray(
            responseData
          )
            ? responseData
            : [];

        const userEmail =
          user?.email || "";

        const mergedOrders =
          mergeOrders(
            backendOrders,
            localOrders,
            userEmail
          );

        setOrders(
          mergedOrders
        );

        if (
          mergedOrders.length > 0
        ) {
          saveLocalOrders(
            mergedOrders
          );
        }

        setError("");
      } catch (err) {
        console.error(
          "Orders fetch error:",
          err
        );

        const userEmail =
          user?.email || "";

        const fallbackOrders =
          localOrders.filter(
            (order) =>
              !userEmail ||
              String(
                order.customerEmail ||
                  ""
              ).toLowerCase() ===
                String(
                  userEmail
                ).toLowerCase()
          );

        setOrders(
          fallbackOrders
        );

        setError(
          err.message ||
            "Unable to connect to the server. Showing saved orders."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  const stats = useMemo(() => {
    const totalOrders =
      orders.length;

    const delivered =
      orders.filter(
        (order) =>
          normalizeStatus(
            order.status
          ) === "DELIVERED"
      ).length;

    const cancelled =
      orders.filter(
        (order) =>
          normalizeStatus(
            order.status
          ) === "CANCELLED"
      ).length;

    const active =
      orders.filter((order) => {
        const status =
          normalizeStatus(
            order.status
          );

        return (
          status !== "DELIVERED" &&
          status !== "CANCELLED"
        );
      }).length;

    const totalSpent =
      orders.reduce(
        (sum, order) => {
          const status =
            normalizeStatus(
              order.status
            );

          if (
            status ===
            "CANCELLED"
          ) {
            return sum;
          }

          return (
            sum +
            Number(
              order.totalPrice ||
                0
            )
          );
        },
        0
      );

    return {
      totalOrders,
      delivered,
      cancelled,
      active,
      totalSpent,
    };
  }, [orders]);

  const calculateSubtotal = (
    order
  ) => {
    if (!order?.orderItems) {
      return Math.max(
        0,
        Number(
          order?.totalPrice || 0
        ) - 50
      );
    }

    return order.orderItems.reduce(
      (sum, item) => {
        const price = Number(
          item.price ??
            item.menuItem?.price ??
            item.menuItem?.itemPrice ??
            0
        );

        const quantity =
          Number(
            item.quantity || 1
          );

        return (
          sum +
          price * quantity
        );
      },
      0
    );
  };

  const getRestaurantName = (
    order
  ) => {
    const firstItem =
      order?.orderItems?.[0];

    return (
      firstItem?.menuItem
        ?.restaurant?.name ||
      firstItem?.restaurantName ||
      order?.restaurantName ||
      "QuickBite Restaurant"
    );
  };

  const trackOrder = (
    order
  ) => {
    try {
      localStorage.setItem(
        "quickbite-tracking-order",
        JSON.stringify(order)
      );
    } catch (err) {
      console.error(
        "Tracking order save error:",
        err
      );
    }

    window.location.href =
      "/track-order";
  };

  const cancelOrder = async (
    order
  ) => {
    if (!order?.id) {
      alert(
        "Invalid order."
      );
      return;
    }

    if (
      !canCancelOrder(
        order.status
      )
    ) {
      alert(
        "This order can no longer be cancelled."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to cancel Order #${order.id}?`
      );

    if (!confirmed) {
      return;
    }

    setCancellingId(
      order.id
    );

    try {
      const token =
        getAuthToken();

      if (!token) {
        throw new Error(
          "Your login session has expired. Please login again."
        );
      }

      const response =
        await fetch(
          `${API_URL}/${order.id}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              status:
                "CANCELLED",
            }),
          }
        );

      const responseText =
        await response.text();

      let responseData =
        null;

      try {
        responseData =
          responseText
            ? JSON.parse(
                responseText
              )
            : null;
      } catch {
        responseData =
          responseText;
      }

      if (!response.ok) {
        console.error(
          "Cancel order backend error:",
          {
            status:
              response.status,
            response:
              responseData,
          }
        );

        throw new Error(
          responseData?.message ||
            `Unable to cancel order. Status ${response.status}`
        );
      }

      const updatedOrder =
        responseData?.order ||
        (typeof responseData ===
        "object"
          ? responseData
          : {
              ...order,
              status:
                "CANCELLED",
            });

      setOrders(
        (previousOrders) =>
          previousOrders.map(
            (currentOrder) =>
              String(
                currentOrder.id
              ) ===
              String(order.id)
                ? {
                    ...currentOrder,
                    ...updatedOrder,
                    status:
                      updatedOrder.status ||
                      "CANCELLED",
                    orderItems:
                      updatedOrder.orderItems ||
                      currentOrder.orderItems ||
                      [],
                  }
                : currentOrder
          )
      );

      const localOrders =
        loadLocalOrders();

      const updatedLocalOrders =
        localOrders.map(
          (currentOrder) =>
            String(
              currentOrder.id
            ) ===
            String(order.id)
              ? {
                  ...currentOrder,
                  ...updatedOrder,
                  status:
                    updatedOrder.status ||
                    "CANCELLED",
                }
              : currentOrder
        );

      saveLocalOrders(
        updatedLocalOrders
      );

      try {
        const trackingOrder =
          localStorage.getItem(
            "quickbite-tracking-order"
          );

        if (trackingOrder) {
          const parsedTracking =
            JSON.parse(
              trackingOrder
            );

          if (
            String(
              parsedTracking?.id
            ) ===
            String(order.id)
          ) {
            localStorage.setItem(
              "quickbite-tracking-order",
              JSON.stringify({
                ...parsedTracking,
                ...updatedOrder,
                status:
                  "CANCELLED",
              })
            );
          }
        }

        const lastOrder =
          localStorage.getItem(
            "quickbite-last-order"
          );

        if (lastOrder) {
          const parsedLast =
            JSON.parse(
              lastOrder
            );

          if (
            String(
              parsedLast?.id
            ) ===
            String(order.id)
          ) {
            localStorage.setItem(
              "quickbite-last-order",
              JSON.stringify({
                ...parsedLast,
                ...updatedOrder,
                status:
                  "CANCELLED",
              })
            );
          }
        }
      } catch (storageError) {
        console.error(
          "Order storage update error:",
          storageError
        );
      }

      alert(
        `Order #${order.id} has been cancelled successfully.`
      );
    } catch (err) {
      console.error(
        "Cancel order error:",
        err
      );

      alert(
        err.message ||
          "Unable to cancel the order right now."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const reorder = async (
    order
  ) => {
    if (
      !order?.orderItems?.length
    ) {
      alert(
        "This order does not contain enough item information to reorder."
      );
      return;
    }

    setReorderingId(
      order.id
    );

    try {
      const existingCart =
        JSON.parse(
          localStorage.getItem(
            "quickbite-cart"
          ) || "[]"
        );

      const cart =
        Array.isArray(
          existingCart
        )
          ? existingCart
          : [];

      order.orderItems.forEach(
        (item) => {
          const menuItem =
            item.menuItem || {};

          const menuItemId =
            menuItem.id ||
            item.menuItemId ||
            item.id;

          const itemName =
            menuItem.itemName ||
            item.name ||
            "Food Item";

          const price = Number(
            item.price ??
              menuItem.price ??
              0
          );

          const image =
            menuItem.imageUrl ||
            item.image ||
            "";

          const category =
            menuItem.category ||
            item.category ||
            "Food";

          const restaurantId =
            menuItem.restaurant
              ?.id ||
            item.restaurantId ||
            "";

          const restaurantName =
            menuItem.restaurant
              ?.name ||
            item.restaurantName ||
            "QuickBite Restaurant";

          const quantity =
            Number(
              item.quantity || 1
            );

          const existingIndex =
            cart.findIndex(
              (cartItem) =>
                String(
                  cartItem.id
                ) ===
                String(
                  menuItemId
                )
            );

          if (
            existingIndex >= 0
          ) {
            cart[
              existingIndex
            ].quantity =
              Number(
                cart[
                  existingIndex
                ].quantity || 0
              ) + quantity;
          } else {
            cart.push({
              id: menuItemId,
              menuItemId:
                menuItemId,
              name: itemName,
              price,
              image,
              category,
              restaurantId,
              restaurantName,
              quantity,
            });
          }
        }
      );

      localStorage.setItem(
        "quickbite-cart",
        JSON.stringify(cart)
      );

      window.location.href =
        "/cart";
    } catch (err) {
      console.error(
        "Reorder error:",
        err
      );

      alert(
        "Unable to reorder this item right now."
      );
    } finally {
      setReorderingId(
        null
      );
    }
  };

  const goTo = (path) => {
    window.location.href =
      path;
  };

  /* ===============================
     LOADING SCREEN
  ================================ */
  if (loading) {
    return (
      <PageBackground>
        <Navbar />

        <main className="min-h-[75vh] flex items-center justify-center px-4">
          <div className="text-center bg-white/85 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl px-10 py-10">
            <div className="w-14 h-14 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-5"></div>

            <p className="text-gray-800 font-bold">
              Loading your orders...
            </p>
          </div>
        </main>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
          <div className="bg-black/35 backdrop-blur-md rounded-3xl p-5 md:p-6 border border-white/10">
            <p className="text-orange-400 font-bold text-sm mb-2">
              QUICKBITE ORDERS
            </p>

            <h1 className="text-3xl md:text-4xl font-black text-white">
              My Orders
            </h1>

            <p className="text-gray-200 mt-2">
              Track your orders and reorder your favourite food.
            </p>
          </div>

          <button
            onClick={() =>
              fetchOrders(true)
            }
            disabled={refreshing}
            className="self-start md:self-auto px-5 py-3 rounded-xl bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl hover:bg-white font-bold text-gray-900 transition disabled:opacity-60"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Orders"}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-yellow-50/95 backdrop-blur-xl border border-yellow-200 text-yellow-800 rounded-2xl px-4 py-3 mb-7 text-sm shadow-lg">
            {error}
          </div>
        )}

        {/* STATS */}
        {orders.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

            <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-5">
              <p className="text-sm text-gray-500">
                Total Orders
              </p>

              <p className="text-2xl font-black mt-1 text-gray-900">
                {stats.totalOrders}
              </p>
            </div>

            <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-5">
              <p className="text-sm text-gray-500">
                Active
              </p>

              <p className="text-2xl font-black text-orange-500 mt-1">
                {stats.active}
              </p>
            </div>

            <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-5">
              <p className="text-sm text-gray-500">
                Delivered
              </p>

              <p className="text-2xl font-black text-green-600 mt-1">
                {stats.delivered}
              </p>
            </div>

            <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-5">
              <p className="text-sm text-gray-500">
                Cancelled
              </p>

              <p className="text-2xl font-black text-red-500 mt-1">
                {stats.cancelled}
              </p>
            </div>

            <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-5">
              <p className="text-sm text-gray-500">
                Total Spent
              </p>

              <p className="text-2xl font-black mt-1 text-gray-900">
                ₹{stats.totalSpent.toFixed(0)}
              </p>
            </div>

          </div>
        )}

        {/* NO ORDERS */}
        {orders.length === 0 ? (
          <section className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl p-10 md:p-16 text-center">

            <div className="text-7xl mb-6">
              📦
            </div>

            <h2 className="text-2xl md:text-3xl font-black mb-3 text-gray-900">
              No Orders Yet
            </h2>

            <p className="text-gray-500 max-w-md mx-auto mb-7">
              Looks like you haven't placed an order yet.
              Discover restaurants and order something delicious.
            </p>

            <button
              onClick={() =>
                goTo(
                  "/restaurants"
                )
              }
              className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-bold transition shadow-lg"
            >
              🍽️ Explore Restaurants
            </button>

          </section>
        ) : (
          <div className="space-y-6">

            {orders.map(
              (order) => {
                const status =
                  getStatusConfig(
                    order.status
                  );

                const normalizedStatus =
                  normalizeStatus(
                    order.status
                  );

                const isExpanded =
                  String(
                    expandedOrder
                  ) ===
                  String(
                    order.id
                  );

                const subtotal =
                  calculateSubtotal(
                    order
                  );

                const deliveryFee =
                  Number(
                    order.deliveryFee ??
                      40
                  );

                const taxes =
                  Number(
                    order.taxes ??
                      Math.max(
                        0,
                        Number(
                          order.totalPrice ||
                            0
                        ) -
                          subtotal -
                          deliveryFee
                      )
                  );

                return (
                  <section
                    key={order.id}
                    className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden"
                  >

                    {/* ORDER HEADER */}
                    <div className="p-5 md:p-6 border-b border-gray-200/80 bg-white/40">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                        <div>
                          <div className="flex flex-wrap items-center gap-3">

                            <h2 className="text-lg md:text-xl font-black text-gray-900">
                              Order #{order.id}
                            </h2>

                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${status.className}`}
                            >
                              <span>
                                {status.icon}
                              </span>

                              {status.label}
                            </span>

                          </div>

                          <p className="text-sm text-gray-500 mt-2">
                            {getRestaurantName(
                              order
                            )}
                          </p>
                        </div>

                        <div className="text-left lg:text-right">

                          <p className="text-xs text-gray-500">
                            Order Total
                          </p>

                          <p className="text-2xl font-black text-orange-500">
                            ₹
                            {Number(
                              order.totalPrice ||
                                0
                            ).toFixed(0)}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            {formatPaymentMethod(
                              order.paymentMethod
                            )}
                          </p>

                        </div>
                      </div>
                    </div>

                    {/* ORDER CONTENT */}
                    <div className="p-5 md:p-6">

                      <div className="space-y-4">
                        {(order.orderItems ||
                          []).map(
                          (
                            item,
                            index
                          ) => {
                            const menuItem =
                              item.menuItem ||
                              {};

                            const itemName =
                              menuItem.itemName ||
                              item.name ||
                              "Food Item";

                            const price =
                              Number(
                                item.price ??
                                  menuItem.price ??
                                  0
                              );

                            const quantity =
                              Number(
                                item.quantity ||
                                  1
                              );

                            const image =
                              menuItem.imageUrl ||
                              item.image ||
                              DEFAULT_IMAGE;

                            return (
                              <div
                                key={
                                  item.id ||
                                  item.menuItemId ||
                                  `${order.id}-${index}`
                                }
                                className="flex gap-4"
                              >
                                <img
                                  src={
                                    image
                                  }
                                  alt={
                                    itemName
                                  }
                                  className="w-20 h-20 rounded-2xl object-cover bg-gray-100 shadow-sm"
                                  onError={(
                                    e
                                  ) => {
                                    e.currentTarget.src =
                                      DEFAULT_IMAGE;
                                  }}
                                />

                                <div className="flex-1 min-w-0">

                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">

                                    <div>
                                      <h3 className="font-bold text-gray-900">
                                        {
                                          itemName
                                        }
                                      </h3>

                                      {menuItem.category && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {
                                            menuItem.category
                                          }
                                        </p>
                                      )}
                                    </div>

                                    <p className="font-black text-gray-900">
                                      ₹
                                      {(
                                        price *
                                        quantity
                                      ).toFixed(
                                        0
                                      )}
                                    </p>

                                  </div>

                                  <p className="text-sm text-gray-500 mt-2">
                                    ₹
                                    {price.toFixed(
                                      0
                                    )}{" "}
                                    ×{" "}
                                    {
                                      quantity
                                    }
                                  </p>

                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>

                      {/* DETAILS BUTTON */}
                      <button
                        onClick={() =>
                          setExpandedOrder(
                            isExpanded
                              ? null
                              : order.id
                          )
                        }
                        className="mt-5 text-sm text-orange-500 hover:text-orange-600 font-bold"
                      >
                        {isExpanded
                          ? "Hide Order Details ↑"
                          : "View Order Details ↓"}
                      </button>

                      {/* EXPANDED DETAILS */}
                      {isExpanded && (
                        <div className="mt-5 pt-5 border-t border-gray-200 grid md:grid-cols-2 gap-6">

                          <div className="bg-gray-50/70 backdrop-blur-md rounded-2xl p-5">
                            <h3 className="font-black mb-4 text-gray-900">
                              Delivery Details
                            </h3>

                            <div className="space-y-3 text-sm">

                              <div>
                                <p className="text-gray-400 text-xs">
                                  Customer
                                </p>

                                <p className="font-semibold">
                                  {order.customerName ||
                                    "QuickBite Customer"}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-400 text-xs">
                                  Phone
                                </p>

                                <p className="font-semibold">
                                  {order.phone ||
                                    "Not available"}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-400 text-xs">
                                  Address
                                </p>

                                <p className="font-semibold">
                                  {order.address ||
                                    "Not available"}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-400 text-xs">
                                  City / Pincode
                                </p>

                                <p className="font-semibold">
                                  {order.city ||
                                    "Not available"}

                                  {order.pincode
                                    ? ` - ${order.pincode}`
                                    : ""}
                                </p>
                              </div>

                            </div>
                          </div>

                          <div className="bg-gray-50/70 backdrop-blur-md rounded-2xl p-5">
                            <h3 className="font-black mb-4 text-gray-900">
                              Price Breakdown
                            </h3>

                            <div className="space-y-3 text-sm">

                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Subtotal
                                </span>

                                <span className="font-semibold">
                                  ₹
                                  {subtotal.toFixed(
                                    0
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Delivery Fee
                                </span>

                                <span className="font-semibold">
                                  ₹
                                  {deliveryFee.toFixed(
                                    0
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Taxes
                                </span>

                                <span className="font-semibold">
                                  ₹
                                  {taxes.toFixed(
                                    0
                                  )}
                                </span>
                              </div>

                              <div className="border-t border-gray-200 pt-3 flex justify-between">
                                <span className="font-black">
                                  Total
                                </span>

                                <span className="font-black text-orange-500">
                                  ₹
                                  {Number(
                                    order.totalPrice ||
                                      0
                                  ).toFixed(
                                    0
                                  )}
                                </span>
                              </div>

                            </div>
                          </div>

                        </div>
                      )}

                      {/* ACTIONS */}
                      <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t border-gray-200">

                        {normalizedStatus !==
                          "DELIVERED" &&
                          normalizedStatus !==
                            "CANCELLED" && (
                            <button
                              onClick={() =>
                                trackOrder(
                                  order
                                )
                              }
                              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition shadow-md"
                            >
                              🛵 Track Order
                            </button>
                          )}

                        <button
                          onClick={() =>
                            reorder(
                              order
                            )
                          }
                          disabled={
                            reorderingId ===
                            order.id
                          }
                          className="flex-1 bg-white/80 border border-gray-200 hover:bg-gray-50 py-3 rounded-xl font-bold transition disabled:opacity-60"
                        >
                          {reorderingId ===
                          order.id
                            ? "Adding..."
                            : "🔁 Reorder"}
                        </button>

                        {canCancelOrder(
                          order.status
                        ) && (
                          <button
                            onClick={() =>
                              cancelOrder(
                                order
                              )
                            }
                            disabled={
                              cancellingId ===
                              order.id
                            }
                            className="flex-1 border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50 py-3 rounded-xl font-bold transition disabled:opacity-60"
                          >
                            {cancellingId ===
                            order.id
                              ? "Cancelling..."
                              : "✕ Cancel Order"}
                          </button>
                        )}

                        {normalizedStatus ===
                          "DELIVERED" && (
                          <button
                            onClick={() =>
                              goTo(
                                "/restaurants"
                              )
                            }
                            className="flex-1 bg-white/80 border border-gray-200 hover:bg-gray-50 py-3 rounded-xl font-bold transition"
                          >
                            🍽️ Order Again
                          </button>
                        )}

                      </div>

                      {/* CANCELLED */}
                      {normalizedStatus ===
                        "CANCELLED" && (
                        <div className="mt-5 bg-red-50/90 border border-red-100 rounded-2xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-xl">
                              ✕
                            </div>

                            <div>
                              <p className="font-black text-red-700">
                                Order Cancelled
                              </p>

                              <p className="text-sm text-red-600 mt-1">
                                This order has been cancelled successfully.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </section>
                );
              }
            )}

          </div>
        )}

        {/* CTA */}
        <section className="mt-10 bg-gradient-to-r from-orange-500/95 to-orange-600/95 backdrop-blur-xl rounded-3xl p-7 md:p-9 text-white shadow-2xl border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>
              <h2 className="text-2xl font-black">
                Hungry again?
              </h2>

              <p className="text-orange-50 mt-1">
                Discover your next favourite meal on QuickBite.
              </p>
            </div>

            <button
              onClick={() =>
                goTo(
                  "/restaurants"
                )
              }
              className="bg-white text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-xl font-black transition shadow-lg"
            >
              Explore Food →
            </button>

          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-950/95 backdrop-blur-xl text-gray-400 px-6 py-10 mt-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">

          <div>
            <h2 className="text-2xl font-black text-white mb-3">
              QuickBite
            </h2>

            <p className="text-sm leading-6">
              Fast food delivery made simple, delicious and
              convenient.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">
              Quick Links
            </h3>

            <div className="space-y-2 text-sm">

              <button
                onClick={() =>
                  goTo("/")
                }
                className="block hover:text-white"
              >
                Home
              </button>

              <button
                onClick={() =>
                  goTo(
                    "/restaurants"
                  )
                }
                className="block hover:text-white"
              >
                Restaurants
              </button>

              <button
                onClick={() =>
                  goTo("/menu")
                }
                className="block hover:text-white"
              >
                Menu
              </button>

            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">
              Orders
            </h3>

            <div className="space-y-2 text-sm">

              <button
                onClick={() =>
                  goTo("/orders")
                }
                className="block hover:text-white"
              >
                My Orders
              </button>

              <button
                onClick={() =>
                  goTo(
                    "/track-order"
                  )
                }
                className="block hover:text-white"
              >
                Track Order
              </button>

              <button
                onClick={() =>
                  goTo("/cart")
                }
                className="block hover:text-white"
              >
                Cart
              </button>

            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">
              Support
            </h3>

            <p className="text-sm">
              Need help with your order?
            </p>

            <p className="text-sm mt-2">
              support@quickbite.com
            </p>
          </div>

        </div>

        <div className="max-w-6xl mx-auto border-t border-gray-800 mt-8 pt-6 text-sm text-center">
          © 2026 QuickBite. All rights reserved.
        </div>
      </footer>
    </PageBackground>
  );
}

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80";

export default Orders;