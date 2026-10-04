import React, { useEffect, useState } from "react";
import API_BASE_URL from "../config";

const API_URL = API_BASE_URL;

const FOOD_VIDEO =
  "https://cdn.coverr.co/videos/coverr-a-chef-preparing-food-1578/1080p.mp4";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=90";

const STATUS_FLOW = [
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const STATUS_LABELS = {
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_ICONS = {
  CONFIRMED: "✅",
  PREPARING: "👨‍🍳",
  OUT_FOR_DELIVERY: "🛵",
  DELIVERED: "🏠",
  CANCELLED: "❌",
};

function PageBackground({ children }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-black text-white"
      style={{
        backgroundImage: `url("${HERO_FALLBACK}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <video
        className="fixed inset-0 -z-20 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      >
        <source src={FOOD_VIDEO} type="video/mp4" />
      </video>

      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.58) 48%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      <div
        className="pointer-events-none fixed"
        style={{
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          right: "-150px",
          top: "-100px",
          background: "rgba(255,77,109,0.20)",
          filter: "blur(80px)",
          zIndex: -5,
        }}
      />

      <div
        className="pointer-events-none fixed"
        style={{
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          left: "-180px",
          bottom: "-180px",
          background: "rgba(249,115,22,0.14)",
          filter: "blur(90px)",
          zIndex: -5,
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  // Get JWT token
  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("jwtToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };

  // Common authenticated headers
  const getAuthHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Load orders
  const loadOrders = async () => {
    try {
      setError("");

      const token = getToken();

      if (!token) {
        setOrders([]);
        setError("Login required. JWT token nahi mila.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/orders`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        throw new Error(
          "Authentication failed. Please login again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "Access denied. Aapke account ko orders dekhne ki permission nahi hai."
        );
      }

      if (!response.ok) {
        throw new Error(
          `Failed to load orders. HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setOrders(data);
      } else if (Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Load orders error:", err);
      setError(
        err.message ||
          "Orders load nahi ho rahe. Backend check karo."
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load + auto refresh
  useEffect(() => {
    loadOrders();

    const interval = setInterval(() => {
      loadOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Get next status
  const getNextStatus = (status) => {
    const index = STATUS_FLOW.indexOf(status);

    if (index === -1 || index === STATUS_FLOW.length - 1) {
      return null;
    }

    return STATUS_FLOW[index + 1];
  };

  // Update order status
  const updateStatus = async (orderId, currentStatus) => {
    const nextStatus = getNextStatus(currentStatus);

    if (!nextStatus) {
      return;
    }

    try {
      setUpdatingId(orderId);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Login required. JWT token nahi mila."
        );
      }

      const response = await fetch(
        `${API_URL}/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error(
          "Authentication failed. Please login again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "Access denied. Sirf Restaurant Owner ya Admin order status update kar sakte hain."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Status update failed. HTTP ${response.status}`
        );
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          String(order.id) === String(orderId)
            ? {
                ...order,
                status: nextStatus,
              }
            : order
        )
      );
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.message || "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Status styling
  const getStatusClass = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-500/10 text-blue-300 border-blue-400/20";

      case "PREPARING":
        return "bg-orange-500/10 text-orange-300 border-orange-400/20";

      case "OUT_FOR_DELIVERY":
        return "bg-purple-500/10 text-purple-300 border-purple-400/20";

      case "DELIVERED":
        return "bg-green-500/10 text-green-300 border-green-400/20";

      case "CANCELLED":
        return "bg-red-500/10 text-red-300 border-red-400/20";

      default:
        return "bg-gray-500/10 text-gray-300 border-gray-400/20";
    }
  };

  // Format date
  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Format price
  const formatPrice = (price) => {
    const value = Number(price || 0);

    return `₹${value.toFixed(2)}`;
  };

  // Get order items
  const getOrderItems = (order) => {
    if (Array.isArray(order.orderItems)) {
      return order.orderItems;
    }

    if (Array.isArray(order.items)) {
      return order.items;
    }

    return [];
  };

  return (
    <PageBackground>
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-orange-400">
                QuickBite Management
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Order Management
              </h1>

              <p className="mt-2 text-sm text-gray-300">
                Restaurant aur delivery orders ka status manage karo.
              </p>
            </div>

            <button
              onClick={loadOrders}
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold shadow-lg backdrop-blur-md transition hover:bg-white/20"
            >
              🔄 Refresh Orders
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/15 p-4 text-sm text-red-200 shadow-xl backdrop-blur-xl">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="rounded-3xl border border-white/20 bg-black/40 p-10 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />

              <p className="mt-4 text-gray-300">
                Orders loading...
              </p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          /* No Orders */
          <div className="rounded-3xl border border-white/20 bg-white/10 p-12 text-center shadow-2xl backdrop-blur-xl">
            <div className="text-5xl">📦</div>

            <h2 className="mt-5 text-2xl font-bold">
              No Orders Found
            </h2>

            <p className="mt-2 text-gray-300">
              Abhi koi order available nahi hai.
            </p>
          </div>
        ) : (
          /* Orders */
          <div className="space-y-6">
            {orders.map((order) => {
              const orderId = order.id;

              const status = String(
                order.status || "CONFIRMED"
              ).toUpperCase();

              const nextStatus = getNextStatus(status);
              const items = getOrderItems(order);

              return (
                <div
                  key={orderId}
                  className="overflow-hidden rounded-3xl border border-white/20 bg-black/45 shadow-2xl shadow-black/30 backdrop-blur-xl"
                >
                  {/* Order Header */}
                  <div className="border-b border-white/10 p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-bold">
                            Order #{orderId}
                          </h2>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                              status
                            )}`}
                          >
                            {STATUS_ICONS[status] || "📦"}{" "}
                            {STATUS_LABELS[status] || status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-gray-400">
                          {formatDate(
                            order.createdAt ||
                              order.orderDate ||
                              order.created_at
                          )}
                        </p>
                      </div>

                      {nextStatus && status !== "CANCELLED" ? (
                        <button
                          onClick={() =>
                            updateStatus(orderId, status)
                          }
                          disabled={updatingId === orderId}
                          className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingId === orderId
                            ? "Updating..."
                            : `Move to ${STATUS_LABELS[nextStatus]}`}
                        </button>
                      ) : (
                        <span className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-400">
                          {status === "DELIVERED"
                            ? "✓ Order Completed"
                            : status === "CANCELLED"
                            ? "Order Cancelled"
                            : "No Further Update"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Progress */}
                  <div className="border-b border-white/10 p-5 sm:p-6">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {STATUS_FLOW.map((step, index) => {
                        const currentIndex =
                          STATUS_FLOW.indexOf(status);

                        const completed =
                          currentIndex >= index;

                        return (
                          <div key={step}>
                            <div
                              className={`rounded-2xl border p-4 transition ${
                                completed
                                  ? "border-orange-500/30 bg-orange-500/10 shadow-lg shadow-orange-500/5"
                                  : "border-white/10 bg-white/[0.03]"
                              }`}
                            >
                              <div className="text-2xl">
                                {STATUS_ICONS[step]}
                              </div>

                              <p
                                className={`mt-2 text-sm font-bold ${
                                  completed
                                    ? "text-orange-300"
                                    : "text-gray-500"
                                }`}
                              >
                                {STATUS_LABELS[step]}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Step {index + 1}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer + Payment */}
                  <div className="grid gap-6 border-b border-white/10 p-5 sm:p-6 md:grid-cols-2">
                    {/* Customer */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
                        Customer
                      </h3>

                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-gray-500">
                            Name:
                          </span>{" "}
                          {order.customerName || "N/A"}
                        </p>

                        <p>
                          <span className="text-gray-500">
                            Email:
                          </span>{" "}
                          {order.customerEmail || "N/A"}
                        </p>

                        <p>
                          <span className="text-gray-500">
                            Phone:
                          </span>{" "}
                          {order.phone || "N/A"}
                        </p>

                        <p>
                          <span className="text-gray-500">
                            Address:
                          </span>{" "}
                          {order.address || "N/A"}
                        </p>

                        <p>
                          <span className="text-gray-500">
                            City:
                          </span>{" "}
                          {order.city || "N/A"}
                        </p>

                        <p>
                          <span className="text-gray-500">
                            Pincode:
                          </span>{" "}
                          {order.pincode || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Payment */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
                        Payment
                      </h3>

                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-gray-500">
                            Method:
                          </span>{" "}
                          {order.paymentMethod || "N/A"}
                        </p>

                        <p>
                          <span className="text-gray-500">
                            Status:
                          </span>{" "}
                          <span className="font-semibold text-green-400">
                            {order.paymentStatus || "N/A"}
                          </span>
                        </p>

                        {order.razorpayOrderId && (
                          <p className="break-all">
                            <span className="text-gray-500">
                              Razorpay Order:
                            </span>{" "}
                            {order.razorpayOrderId}
                          </p>
                        )}

                        {order.razorpayPaymentId && (
                          <p className="break-all">
                            <span className="text-gray-500">
                              Payment ID:
                            </span>{" "}
                            {order.razorpayPaymentId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-b border-white/10 p-5 sm:p-6">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">
                      Order Items
                    </h3>

                    {items.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No item details available.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item, index) => (
                          <div
                            key={item.id || index}
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md"
                          >
                            <div>
                              <p className="font-semibold">
                                {item.name ||
                                  item.productName ||
                                  `Item ${index + 1}`}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Qty:{" "}
                                {item.quantity ||
                                  item.qty ||
                                  1}
                              </p>
                            </div>

                            <p className="font-bold text-orange-400">
                              {formatPrice(
                                item.totalPrice ||
                                  item.price ||
                                  0
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between bg-white/[0.03] p-5 sm:p-6">
                    <span className="text-sm font-semibold text-gray-400">
                      Order Total
                    </span>

                    <span className="text-2xl font-black text-orange-400">
                      {formatPrice(order.totalPrice)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </PageBackground>
  );
}

export default OrderManagement;