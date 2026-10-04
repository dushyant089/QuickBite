import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Navbar from "./components/Navbar";
import API_BASE_URL from "../config";

const API_URL = API_BASE_URL;

const FOOD_VIDEO =
  "https://cdn.coverr.co/videos/coverr-a-chef-preparing-food-1578/1080p.mp4";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=90";

const STATUS_STEPS = [
  {
    key: "CONFIRMED",
    title: "Order Confirmed",
    description:
      "Your order has been confirmed.",
    icon: "✓",
  },
  {
    key: "PREPARING",
    title: "Preparing Food",
    description:
      "The restaurant is preparing your food.",
    icon: "👨‍🍳",
  },
  {
    key: "OUT_FOR_DELIVERY",
    title: "Out for Delivery",
    description:
      "Your order is on the way.",
    icon: "🛵",
  },
  {
    key: "DELIVERED",
    title: "Delivered",
    description:
      "Enjoy your delicious meal!",
    icon: "✓",
  },
];

const normalizeStatus = (status) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/ /g, "_");

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getEstimatedText = (status) => {
  switch (status) {
    case "CONFIRMED":
      return "30–45 min";
    case "PREPARING":
      return "20–30 min";
    case "OUT_FOR_DELIVERY":
      return "10–20 min";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Calculating...";
  }
};

const getStatusTitle = (status) => {
  switch (status) {
    case "CONFIRMED":
      return "Order Confirmed";
    case "PREPARING":
      return "Preparing Your Food";
    case "OUT_FOR_DELIVERY":
      return "Out for Delivery";
    case "DELIVERED":
      return "Order Delivered";
    case "CANCELLED":
      return "Order Cancelled";
    default:
      return "Order Status";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "CONFIRMED":
      return "✓";
    case "PREPARING":
      return "👨‍🍳";
    case "OUT_FOR_DELIVERY":
      return "🛵";
    case "DELIVERED":
      return "🎉";
    case "CANCELLED":
      return "✕";
    default:
      return "📦";
  }
};

// ==========================================
// GLOBAL PAGE BACKGROUND
// ==========================================
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
      {/* FOOD VIDEO */}
      <video
        className="fixed inset-0 z-0 h-full w-full object-cover"
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

      {/* DARK OVERLAY */}
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.64) 48%, rgba(0,0,0,0.38) 100%)",
        }}
      />

      {/* PINK GLOW */}
      <div
        className="fixed z-10 pointer-events-none"
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

      {/* ORANGE GLOW */}
      <div
        className="fixed z-10 pointer-events-none"
        style={{
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          left: "-180px",
          bottom: "-180px",
          background:
            "rgba(255,140,66,0.12)",
          filter: "blur(90px)",
        }}
      />

      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
}

// ==========================================
// GET JWT TOKEN
// ==========================================
const getAuthToken = () => {
  const possibleTokenKeys = [
    "quickbite-token",
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

    if (value) {
      const cleanedValue =
        value.trim();

      if (
        cleanedValue &&
        cleanedValue !== "null" &&
        cleanedValue !== "undefined"
      ) {
        return cleanedValue.startsWith(
          "Bearer "
        )
          ? cleanedValue
              .substring(7)
              .trim()
          : cleanedValue;
      }
    }
  }

  const userKeys = [
    "quickbite-user",
    "user",
    "currentUser",
    "quickbiteUser",
  ];

  for (const key of userKeys) {
    try {
      const storedUser =
        JSON.parse(
          localStorage.getItem(
            key
          ) || "null"
        );

      if (!storedUser) continue;

      const possibleToken =
        storedUser.token ||
        storedUser.jwt ||
        storedUser.accessToken ||
        storedUser.authToken;

      if (
        possibleToken &&
        typeof possibleToken ===
          "string"
      ) {
        return possibleToken.startsWith(
          "Bearer "
        )
          ? possibleToken
              .substring(7)
              .trim()
          : possibleToken.trim();
      }
    } catch (error) {
      console.warn(
        `Unable to read ${key} from localStorage`
      );
    }
  }

  return null;
};

function TrackOrder() {
  const [orderId, setOrderId] =
    useState(null);

  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  // ==========================================
  // GET SAVED ORDER ID
  // ==========================================
  useEffect(() => {
    try {
      const savedOrder =
        JSON.parse(
          localStorage.getItem(
            "quickbite-tracking-order"
          )
        );

      if (savedOrder?.id) {
        setOrderId(
          savedOrder.id
        );
        return;
      }

      const lastOrder =
        JSON.parse(
          localStorage.getItem(
            "quickbite-last-order"
          )
        );

      if (lastOrder?.id) {
        setOrderId(
          lastOrder.id
        );
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error(
        "Tracking order read error:",
        err
      );

      setLoading(false);
    }
  }, []);

  // ==========================================
  // FETCH ORDER
  // ==========================================
  const fetchOrder = useCallback(
    async (manual = false) => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token =
          getAuthToken();

        if (!token) {
          throw new Error(
            "Your login session has expired. Please login again."
          );
        }

        const response =
          await fetch(
            `${API_URL}/orders/${orderId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept:
                  "application/json",
              },
            }
          );

        if (
          response.status === 401
        ) {
          throw new Error(
            "Your login session has expired. Please login again."
          );
        }

        if (
          response.status === 403
        ) {
          throw new Error(
            "You are not authorized to view this order. Please login again."
          );
        }

        if (
          response.status === 404
        ) {
          throw new Error(
            "Order not found."
          );
        }

        if (!response.ok) {
          throw new Error(
            `Unable to load order (${response.status})`
          );
        }

        const data =
          await response.json();

        setOrder(data);
        setLastUpdated(
          new Date()
        );

        localStorage.setItem(
          "quickbite-tracking-order",
          JSON.stringify(data)
        );

        localStorage.setItem(
          "quickbite-last-order",
          JSON.stringify(data)
        );

        const existingOrders =
          JSON.parse(
            localStorage.getItem(
              "quickbite-orders"
            ) || "[]"
          );

        const updatedOrders =
          existingOrders.map(
            (item) =>
              String(item.id) ===
              String(data.id)
                ? {
                    ...item,
                    ...data,
                  }
                : item
          );

        localStorage.setItem(
          "quickbite-orders",
          JSON.stringify(
            updatedOrders
          )
        );
      } catch (err) {
        console.error(
          "Tracking error:",
          err
        );

        setError(
          err.message ||
            "Unable to load your order."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId]
  );

  // ==========================================
  // INITIAL FETCH
  // ==========================================
  useEffect(() => {
    if (orderId) {
      fetchOrder(false);
    }
  }, [orderId, fetchOrder]);

  // ==========================================
  // AUTO REFRESH
  // ==========================================
  useEffect(() => {
    if (!orderId) return;

    const interval =
      setInterval(() => {
        fetchOrder(false);
      }, 10000);

    return () =>
      clearInterval(interval);
  }, [orderId, fetchOrder]);

  // ==========================================
  // CURRENT STATUS
  // ==========================================
  const currentStatus =
    useMemo(() => {
      return normalizeStatus(
        order?.status
      );
    }, [order]);

  const currentStepIndex =
    useMemo(() => {
      return STATUS_STEPS.findIndex(
        (step) =>
          step.key ===
          currentStatus
      );
    }, [currentStatus]);

  const totalPrice = Number(
    order?.totalPrice || 0
  );

  // ==========================================
  // RESTAURANT
  // ==========================================
  const restaurantName =
    useMemo(() => {
      const firstItem =
        order?.orderItems?.[0];

      return (
        firstItem?.menuItem
          ?.restaurant?.name ||
        firstItem?.menuItem
          ?.restaurantName ||
        "QuickBite Restaurant"
      );
    }, [order]);

  const isCancelled =
    currentStatus ===
    "CANCELLED";

  // ==========================================
  // EMPTY STATE
  // ==========================================
  if (!orderId && !loading) {
    return (
      <PageBackground>
        <Navbar />

        <main className="mx-auto flex min-h-[78vh] max-w-6xl items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/40 bg-white/90 text-center shadow-2xl backdrop-blur-xl">

            <div className="bg-gradient-to-br from-orange-500/95 to-amber-500/95 px-6 py-10 text-white">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 text-5xl backdrop-blur">
                📦
              </div>

              <h1 className="mt-5 text-3xl font-black">
                No Active Order
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-orange-50">
                Place an order first and
                you can track its progress
                here.
              </p>
            </div>

            <div className="p-7 sm:p-9">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => {
                    window.location.href =
                      "/restaurants";
                  }}
                  className="rounded-2xl bg-orange-500 px-6 py-3.5 font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  🍽️ Browse Restaurants
                </button>

                <button
                  onClick={() => {
                    window.location.href =
                      "/orders";
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 font-black text-slate-700 transition hover:bg-slate-50"
                >
                  📋 My Orders
                </button>
              </div>
            </div>
          </div>
        </main>
      </PageBackground>
    );
  }

  // ==========================================
  // LOADING
  // ==========================================
  if (loading && !order) {
    return (
      <PageBackground>
        <Navbar />

        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-[2rem] border border-white/20 bg-black/30 p-6 shadow-xl backdrop-blur-md">
            <div className="animate-pulse">
              <div className="h-5 w-40 rounded-full bg-white/20" />

              <div className="mt-4 h-10 w-72 rounded-xl bg-white/20" />

              <div className="mt-3 h-5 w-96 max-w-full rounded-lg bg-white/20" />

              <div className="mt-8 h-64 rounded-[2rem] bg-white/20" />

              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="h-96 rounded-[2rem] bg-white/20 lg:col-span-2" />
                <div className="h-96 rounded-[2rem] bg-white/20" />
              </div>
            </div>
          </div>
        </main>
      </PageBackground>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================
  if (error && !order) {
    return (
      <PageBackground>
        <Navbar />

        <main className="mx-auto flex min-h-[78vh] max-w-6xl items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl rounded-[2rem] border border-red-100 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-4xl">
              ⚠️
            </div>

            <h1 className="mt-5 text-2xl font-black">
              Unable to Load Order
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {error}
            </p>

            <button
              onClick={() =>
                fetchOrder(true)
              }
              className="mt-7 rounded-2xl bg-slate-900 px-7 py-3.5 font-black text-white transition hover:bg-slate-800"
            >
              🔄 Try Again
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/login";
              }}
              className="mt-3 rounded-2xl border border-slate-200 px-7 py-3.5 font-black text-slate-700 transition hover:bg-slate-50"
            >
              🔐 Login Again
            </button>
          </div>
        </main>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <Navbar />

      {/* =====================================
          PAGE HEADER
      ====================================== */}
      <section className="border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:py-9">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-500/15 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-orange-300 backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
                Live Order Tracking
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Track Your Order
              </h1>

              <p className="mt-2 text-sm text-gray-300 sm:text-base">
                Order #{order?.id || orderId}
                <span className="mx-2 text-gray-500">
                  •
                </span>
                {restaurantName}
              </p>
            </div>

            <button
              onClick={() =>
                fetchOrder(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-black text-white shadow-lg backdrop-blur-md transition hover:border-orange-300/40 hover:bg-orange-500/20 hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              >
                🔄
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh Status"}
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:py-10">

        {/* =====================================
            STATUS HERO
        ====================================== */}
        <section
          className={`relative overflow-hidden rounded-[2rem] border shadow-2xl ${
            isCancelled
              ? "border-red-300/40 bg-red-50/95 backdrop-blur-xl"
              : "border-orange-300/30 bg-gradient-to-br from-orange-500/95 via-orange-500/90 to-amber-500/90 backdrop-blur-xl"
          }`}
        >
          {!isCancelled && (
            <>
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            </>
          )}

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div
                  className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] ${
                    isCancelled
                      ? "text-red-500"
                      : "text-orange-100"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isCancelled
                        ? "bg-red-500"
                        : "animate-pulse bg-white"
                    }`}
                  />

                  Current Status
                </div>

                <h2
                  className={`mt-3 text-3xl font-black sm:text-4xl ${
                    isCancelled
                      ? "text-red-700"
                      : "text-white"
                  }`}
                >
                  {getStatusTitle(
                    currentStatus
                  )}
                </h2>

                <p
                  className={`mt-2 max-w-xl text-sm leading-6 sm:text-base ${
                    isCancelled
                      ? "text-red-600"
                      : "text-orange-50"
                  }`}
                >
                  {isCancelled
                    ? "This order has been cancelled."
                    : currentStatus ===
                      "DELIVERED"
                    ? "Your food has been delivered. Enjoy your meal! 🎉"
                    : currentStatus ===
                      "OUT_FOR_DELIVERY"
                    ? "Your order is on the way to your delivery address."
                    : currentStatus ===
                      "PREPARING"
                    ? "The restaurant is preparing your delicious food."
                    : "Your order has been confirmed and is being processed."}
                </p>
              </div>

              <div
                className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] text-5xl shadow-2xl ${
                  isCancelled
                    ? "bg-white text-red-500"
                    : "bg-white/20 text-white backdrop-blur-md"
                }`}
              >
                {getStatusIcon(
                  currentStatus
                )}
              </div>
            </div>

            {!isCancelled && (
              <div className="mt-8 grid gap-3 sm:grid-cols-3">

                <div className="rounded-2xl border border-white/10 bg-white/15 p-4 backdrop-blur-md">
                  <p className="text-xs font-bold text-orange-100">
                    Estimated Time
                  </p>

                  <p className="mt-1 text-xl font-black text-white">
                    {getEstimatedText(
                      currentStatus
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/15 p-4 backdrop-blur-md">
                  <p className="text-xs font-bold text-orange-100">
                    Payment
                  </p>

                  <p className="mt-1 truncate text-xl font-black text-white">
                    {order?.paymentMethod ||
                      "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/15 p-4 backdrop-blur-md">
                  <p className="text-xs font-bold text-orange-100">
                    Total
                  </p>

                  <p className="mt-1 text-xl font-black text-white">
                    ₹
                    {totalPrice.toFixed(
                      2
                    )}
                  </p>
                </div>

              </div>
            )}
          </div>
        </section>

        {/* ERROR BANNER */}
        {error && order && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/95 px-4 py-3 text-sm font-bold text-red-700 shadow-lg backdrop-blur-xl">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* =====================================
              ORDER JOURNEY
          ====================================== */}
          <section className="rounded-[2rem] border border-white/40 bg-white/90 p-5 shadow-2xl backdrop-blur-xl sm:p-7 lg:col-span-2">

            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Order Journey
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Follow your order from
                  restaurant to doorstep
                </p>
              </div>

              <div className="hidden rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-400 sm:block">
                Auto update · 10s
              </div>
            </div>

            {isCancelled ? (
              <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl shadow-sm">
                  ✕
                </div>

                <h4 className="mt-5 text-xl font-black text-red-700">
                  Order Cancelled
                </h4>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-600">
                  This order is no longer
                  being processed.
                </p>
              </div>
            ) : (
              <div className="mt-8">
                {STATUS_STEPS.map(
                  (step, index) => {
                    const completed =
                      currentStepIndex >=
                      index;

                    const active =
                      currentStatus ===
                      step.key;

                    const isLast =
                      index ===
                      STATUS_STEPS.length -
                        1;

                    return (
                      <div
                        key={step.key}
                        className="relative flex gap-4"
                      >
                        {!isLast && (
                          <div className="absolute left-[21px] top-12 h-[calc(100%-18px)] w-1 rounded-full bg-slate-100">
                            <div
                              className={`w-full rounded-full transition-all duration-500 ${
                                currentStepIndex >
                                index
                                  ? "h-full bg-orange-500"
                                  : "h-0"
                              }`}
                            />
                          </div>
                        )}

                        <div
                          className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black transition-all duration-300 ${
                            completed
                              ? "bg-orange-500 text-white shadow-lg shadow-orange-100"
                              : "bg-slate-100 text-slate-400"
                          } ${
                            active
                              ? "scale-110 ring-4 ring-orange-100"
                              : ""
                          }`}
                        >
                          {completed
                            ? step.icon
                            : index + 1}
                        </div>

                        <div className="min-w-0 flex-1 pb-9">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h4
                              className={`text-base font-black ${
                                completed
                                  ? "text-slate-900"
                                  : "text-slate-400"
                              }`}
                            >
                              {step.title}
                            </h4>

                            {active && (
                              <span className="w-fit rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600">
                                Current
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-1 text-sm leading-6 ${
                              completed
                                ? "text-slate-500"
                                : "text-slate-400"
                            }`}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}

            {lastUpdated && (
              <div className="mt-1 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Last updated{" "}
                {lastUpdated.toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }
                )}
              </div>
            )}
          </section>

          {/* =====================================
              DELIVERY DETAILS
          ====================================== */}
          <section className="rounded-[2rem] border border-white/40 bg-white/90 p-5 shadow-2xl backdrop-blur-xl sm:p-7">

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Delivery Details
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your delivery information
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                📍
              </div>
            </div>

            <div className="mt-7 space-y-5">

              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  👤
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 break-words font-bold text-slate-800">
                    {order?.customerName ||
                      "—"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  📞
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Phone
                  </p>

                  <p className="mt-1 break-words font-bold text-slate-800">
                    {order?.phone ||
                      "—"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50">
                  📍
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Delivery Address
                  </p>

                  <p className="mt-1 font-bold leading-relaxed text-slate-800">
                    {order?.address ||
                      "—"}

                    {order?.city
                      ? `, ${order.city}`
                      : ""}

                    {order?.pincode
                      ? ` - ${order.pincode}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                  💳
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Payment Method
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {order?.paymentMethod ||
                      "—"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50">
                  🕐
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Ordered On
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {formatDate(
                      order?.createdAt ||
                        order?.orderDate ||
                        order?.createdOn
                    )}
                  </p>
                </div>
              </div>

            </div>
          </section>
        </div>

        {/* =====================================
            ORDER ITEMS
        ====================================== */}
        <section className="mt-6 rounded-[2rem] border border-white/40 bg-white/90 p-5 shadow-2xl backdrop-blur-xl sm:p-7">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Your Order
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {order?.orderItems?.length ||
                  0}{" "}
                item(s)
              </p>
            </div>

            <div className="text-2xl font-black text-orange-500">
              ₹{totalPrice.toFixed(2)}
            </div>
          </div>

          <div className="mt-6 divide-y divide-slate-100">
            {order?.orderItems?.map(
              (item, index) => {
                const menuItem =
                  item?.menuItem;

                const quantity = Number(
                  item?.quantity || 1
                );

                const price = Number(
                  item?.price ??
                    menuItem?.price ??
                    0
                );

                const image =
                  menuItem?.imageUrl;

                return (
                  <div
                    key={
                      item?.id ||
                      `${menuItem?.id}-${index}`
                    }
                    className="flex gap-4 py-5 first:pt-0 last:pb-0"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-sm sm:h-24 sm:w-24">
                      {image ? (
                        <img
                          src={image}
                          alt={
                            menuItem?.itemName ||
                            "Food"
                          }
                          className="h-full w-full object-cover"
                          onError={(
                            event
                          ) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                        <div>
                          <h4 className="font-black text-slate-800">
                            {menuItem?.itemName ||
                              "Food Item"}
                          </h4>

                          {menuItem?.category && (
                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {
                                menuItem.category
                              }
                            </p>
                          )}
                        </div>

                        <p className="font-black text-slate-900">
                          ₹
                          {(
                            price *
                            quantity
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                          Qty:{" "}
                          {quantity}
                        </span>

                        <span className="text-xs font-semibold text-slate-400">
                          ₹
                          {price.toFixed(
                            2
                          )}{" "}
                          each
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}

            {(!order?.orderItems ||
              order.orderItems.length ===
                0) && (
              <div className="py-10 text-center">
                <div className="text-4xl">
                  🍽️
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No item details available.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =====================================
            SUMMARY + ACTIONS
        ====================================== */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">

          {/* SUMMARY */}
          <div className="rounded-[2rem] border border-white/40 bg-white/90 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
            <h3 className="text-xl font-black text-slate-900">
              Order Summary
            </h3>

            <div className="mt-6 space-y-4 text-sm">

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Order ID
                </span>

                <span className="font-bold text-slate-800">
                  #{order?.id ||
                    orderId}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Restaurant
                </span>

                <span className="text-right font-bold text-slate-800">
                  {restaurantName}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Status
                </span>

                <span className="font-black text-orange-500">
                  {getStatusTitle(
                    currentStatus
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Payment
                </span>

                <span className="font-bold text-slate-800">
                  {order?.paymentMethod ||
                    "—"}
                </span>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between gap-4">

                  <span className="font-black text-slate-700">
                    Total Amount
                  </span>

                  <span className="text-2xl font-black text-orange-500">
                    ₹
                    {totalPrice.toFixed(
                      2
                    )}
                  </span>

                </div>
              </div>

            </div>
          </div>

          {/* ACTIONS */}
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 p-5 text-white shadow-2xl backdrop-blur-xl sm:p-7">
            <div className="flex h-full flex-col justify-between">

              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl shadow-lg shadow-orange-950/30">
                  🚀
                </div>

                <h3 className="mt-5 text-2xl font-black">
                  Hungry Again?
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Explore more restaurants,
                  check your previous orders
                  or order something delicious
                  again.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3 md:grid-cols-1">

                <button
                  onClick={() => {
                    window.location.href =
                      "/restaurants";
                  }}
                  className="rounded-2xl bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  🍽️ Order More
                </button>

                <button
                  onClick={() => {
                    window.location.href =
                      "/orders";
                  }}
                  className="rounded-2xl bg-white/10 px-4 py-3.5 text-sm font-black text-white transition hover:bg-white/15"
                >
                  📋 My Orders
                </button>

                <button
                  onClick={() => {
                    window.location.href =
                      "/menu";
                  }}
                  className="rounded-2xl bg-white/10 px-4 py-3.5 text-sm font-black text-white transition hover:bg-white/15"
                >
                  🍔 Browse Menu
                </button>

              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================
          FOOTER
      ====================================== */}
      <footer className="mt-10 border-t border-white/10 bg-gray-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">

          <div>
            <div className="text-xl font-black">
              <span className="text-orange-500">
                Quick
              </span>
              <span className="text-white">
                Bite
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Fast food. Fresh moments.
              Delivered.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-400">

            <button
              onClick={() => {
                window.location.href =
                  "/";
              }}
              className="transition hover:text-orange-500"
            >
              Home
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/restaurants";
              }}
              className="transition hover:text-orange-500"
            >
              Restaurants
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/orders";
              }}
              className="transition hover:text-orange-500"
            >
              My Orders
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/profile";
              }}
              className="transition hover:text-orange-500"
            >
              Profile
            </button>

          </div>
        </div>
      </footer>
    </PageBackground>
  );
}

export default TrackOrder;