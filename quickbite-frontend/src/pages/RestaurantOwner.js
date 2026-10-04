import React, { useEffect, useState } from "react";
import API_BASE_URL from "../config";

const API_URL = `${API_BASE_URL}/orders`;

const statusFlow = {
  CONFIRMED: "PREPARING",
  PREPARING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

const statusLabels = {
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const statusIcons = {
  CONFIRMED: "✓",
  PREPARING: "◉",
  OUT_FOR_DELIVERY: "➜",
  DELIVERED: "✓",
  CANCELLED: "×",
};

const statusStyles = {
  CONFIRMED:
    "border-blue-400/20 bg-blue-500/10 text-blue-300",
  PREPARING:
    "border-amber-400/20 bg-amber-500/10 text-amber-300",
  OUT_FOR_DELIVERY:
    "border-purple-400/20 bg-purple-500/10 text-purple-300",
  DELIVERED:
    "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  CANCELLED:
    "border-red-400/20 bg-red-500/10 text-red-300",
};

function PageBackground({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090d] text-white">

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "#f97316" }}
      />

      <div
        className="pointer-events-none fixed -bottom-48 -left-40 h-[520px] w-[520px] rounded-full opacity-15 blur-[120px]"
        style={{ background: "#ec4899" }}
      />

      <div
        className="pointer-events-none fixed left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-[0.06] blur-[120px]"
        style={{ background: "#ffffff" }}
      />

      {/* Subtle grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

function RestaurantOwner() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const owner = JSON.parse(
    localStorage.getItem("quickbite-owner") || "null"
  );

  const getToken = () => {
    return localStorage.getItem("quickbite-owner-token") || "";
  };

  const getHeaders = () => {
    const token = getToken();

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  const fetchOrders = async () => {
    try {
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Your session has expired. Please login again."
        );
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please login again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You are not authorized to access this dashboard."
          );
        }

        throw new Error(
          `Failed to load orders. HTTP ${response.status}`
        );
      }

      const data = await response.json();

      setOrders(
        Array.isArray(data)
          ? data
          : Array.isArray(data.orders)
          ? data.orders
          : []
      );
    } catch (err) {
      console.error("Owner orders error:", err);
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Your session has expired. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/${orderId}/status`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please login again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You are not authorized to update this order."
          );
        }

        throw new Error(
          data.message ||
            `Unable to update order status. HTTP ${response.status}`
        );
      }

      await fetchOrders();
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.message || "Unable to update order.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("quickbite-owner");
    localStorage.removeItem("quickbite-owner-token");
    localStorage.removeItem("quickbite-owner-role");

    window.location.href = "/restaurant-owner-login";
  };

  const filteredOrders =
    filter === "ALL"
      ? orders
      : orders.filter((order) => order.status === filter);

  const totalOrders = orders.length;

  const confirmedOrders = orders.filter(
    (order) => order.status === "CONFIRMED"
  ).length;

  const preparingOrders = orders.filter(
    (order) => order.status === "PREPARING"
  ).length;

  const deliveryOrders = orders.filter(
    (order) => order.status === "OUT_FOR_DELIVERY"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  if (loading) {
    return (
      <PageBackground>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#111318]/90 p-10 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-orange-500" />
            </div>

            <h2 className="mt-6 text-lg font-bold">
              Loading Dashboard
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Fetching your restaurant orders...
            </p>
          </div>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#08090d]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 text-xl shadow-lg shadow-orange-500/20">
              🍔
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight">
                QuickBite
              </h1>

              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Restaurant Panel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-200">
                {owner?.name || "Restaurant Owner"}
              </p>

              <p className="text-xs text-gray-500">
                {owner?.email || ""}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HERO */}
        <section className="relative mb-8 overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-[#17191f] via-[#111318] to-[#0d0e12] p-7 shadow-2xl sm:p-9">

          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-[80px]" />

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-400/15 bg-orange-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-300">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
              Restaurant Dashboard
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                {owner?.name?.split(" ")[0] || "Owner"}
              </span>
              .
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Manage incoming orders, track preparation progress,
              and keep your customers updated in real time.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-2.5 text-xs text-gray-400">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                System Online
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-2.5 text-xs text-gray-400">
                Auto refresh every 10 sec
              </div>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/15 bg-red-500/[0.08] p-4 text-sm text-red-300">
            <span className="text-lg">!</span>
            <div>
              <p className="font-semibold">
                Something went wrong
              </p>
              <p className="mt-1 text-red-300/70">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* STATS */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Orders"
            value={totalOrders}
            icon="▦"
            accent="orange"
          />

          <StatCard
            title="Confirmed"
            value={confirmedOrders}
            icon="✓"
            accent="blue"
          />

          <StatCard
            title="Preparing"
            value={preparingOrders}
            icon="◉"
            accent="amber"
          />

          <StatCard
            title="Out for Delivery"
            value={deliveryOrders}
            icon="➜"
            accent="purple"
          />

          <StatCard
            title="Delivered"
            value={deliveredOrders}
            icon="✓"
            accent="green"
          />
        </section>

        {/* FILTER */}
        <section className="mb-8 rounded-2xl border border-white/[0.07] bg-[#111318]/80 p-2 shadow-xl backdrop-blur-xl">
          <div className="flex flex-wrap gap-1.5">
            {[
              ["ALL", "All Orders"],
              ["CONFIRMED", "Confirmed"],
              ["PREPARING", "Preparing"],
              ["OUT_FOR_DELIVERY", "Delivery"],
              ["DELIVERED", "Delivered"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  filter === value
                    ? "bg-white text-black shadow-lg"
                    : "text-gray-500 hover:bg-white/[0.05] hover:text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ORDERS HEADER */}
        <section>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                Order Management
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Latest Orders
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredOrders.length} order
                {filteredOrders.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-xs text-gray-500">
              Live order monitoring
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-white/[0.07] bg-[#111318]/80 px-6 py-20 text-center shadow-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] text-3xl">
                📦
              </div>

              <h3 className="mt-5 text-xl font-bold">
                No orders found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Orders matching this filter will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {filteredOrders.map((order) => {
                const nextStatus = statusFlow[order.status];

                return (
                  <article
                    key={order.id}
                    className="group overflow-hidden rounded-3xl border border-white/[0.07] bg-[#111318]/90 shadow-xl transition duration-300 hover:border-white/[0.13] hover:shadow-2xl"
                  >

                    {/* ORDER TOP */}
                    <div className="border-b border-white/[0.06] p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-600">
                            Order ID
                          </p>

                          <h3 className="mt-1 text-xl font-black">
                            #{order.id}
                          </h3>

                          <div
                            className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                              statusStyles[order.status] ||
                              "border-white/10 bg-white/5 text-gray-300"
                            }`}
                          >
                            <span>
                              {statusIcons[order.status] || "•"}
                            </span>

                            {statusLabels[order.status] ||
                              order.status}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-600">
                            Total
                          </p>

                          <p className="mt-1 text-2xl font-black text-white">
                            ₹
                            {Number(
                              order.totalPrice || 0
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CUSTOMER */}
                    <div className="p-5 sm:p-6">
                      <InfoSection
                        title="Customer"
                        icon="👤"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <InfoItem
                            label="Name"
                            value={
                              order.customerName || "Customer"
                            }
                          />

                          <InfoItem
                            label="Phone"
                            value={order.phone || "N/A"}
                          />

                          <InfoItem
                            label="Email"
                            value={
                              order.customerEmail || "N/A"
                            }
                            full
                          />
                        </div>
                      </InfoSection>
                    </div>

                    {/* ADDRESS */}
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                      <InfoSection
                        title="Delivery Address"
                        icon="⌖"
                      >
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                          <p className="text-sm leading-6 text-gray-300">
                            {order.address || "N/A"}
                          </p>

                          {(order.city || order.pincode) && (
                            <p className="mt-1 text-xs text-gray-600">
                              {order.city || ""}
                              {order.pincode
                                ? ` • ${order.pincode}`
                                : ""}
                            </p>
                          )}
                        </div>
                      </InfoSection>
                    </div>

                    {/* PAYMENT */}
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                            Payment
                          </p>

                          <p className="mt-2 text-sm font-bold text-gray-300">
                            {order.paymentMethod || "N/A"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-emerald-400/10 bg-emerald-500/[0.04] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                            Status
                          </p>

                          <p className="mt-2 text-sm font-bold text-emerald-400">
                            {order.paymentStatus || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ACTION */}
                    <div className="border-t border-white/[0.06] bg-black/10 p-5 sm:p-6">
                      {nextStatus ? (
                        <button
                          disabled={updatingId === order.id}
                          onClick={() =>
                            updateStatus(
                              order.id,
                              nextStatus
                            )
                          }
                          className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/10 transition hover:shadow-orange-500/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingId === order.id
                            ? "Updating..."
                            : `Move to ${
                                statusLabels[nextStatus]
                              }`}

                          {updatingId !== order.id && (
                            <span className="transition-transform group-hover/btn:translate-x-1">
                              →
                            </span>
                          )}
                        </button>
                      ) : (
                        <div className="rounded-xl border border-emerald-400/10 bg-emerald-500/[0.05] px-4 py-3 text-center text-sm font-semibold text-emerald-300">
                          {order.status === "DELIVERED"
                            ? "✓ Order Delivered Successfully"
                            : order.status === "CANCELLED"
                            ? "× Order Cancelled"
                            : "✓ No Further Update"}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </PageBackground>
  );
}

function InfoSection({ title, icon, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm">{icon}</span>

        <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">
          {title}
        </h4>
      </div>

      {children}
    </div>
  );
}

function InfoItem({ label, value, full }) {
  return (
    <div
      className={`rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-1 break-all text-sm font-medium text-gray-300">
        {value}
      </p>
    </div>
  );
}

function StatCard({ title, value, icon, accent }) {
  const accents = {
    orange:
      "bg-orange-500/10 text-orange-400 border-orange-400/10",
    blue:
      "bg-blue-500/10 text-blue-400 border-blue-400/10",
    amber:
      "bg-amber-500/10 text-amber-400 border-amber-400/10",
    purple:
      "bg-purple-500/10 text-purple-400 border-purple-400/10",
    green:
      "bg-emerald-500/10 text-emerald-400 border-emerald-400/10",
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111318]/90 p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-white/[0.12]">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg font-black ${
            accents[accent]
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-black text-white">
            {value}
          </p>

          <p className="mt-1 truncate text-xs font-medium text-gray-500">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}

export default RestaurantOwner;