import React, { useCallback, useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../config";

const API_URL = API_BASE_URL;

const normalizeStatus = (status) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/ /g, "_");

const getOrderDate = (order) => {
  const value =
    order?.createdAt ||
    order?.orderDate ||
    order?.createdOn ||
    order?.date;

  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const formatDate = (value) => {
  const date =
    value instanceof Date
      ? value
      : getOrderDate(value);

  if (!date) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  const date =
    value instanceof Date
      ? value
      : getOrderDate(value);

  if (!date) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD DATA
  // ==========================================
  const loadData = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [
          customersResponse,
          ordersResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/users`),
          fetch(`${API_URL}/orders`),
        ]);

        if (
          !customersResponse.ok ||
          !ordersResponse.ok
        ) {
          throw new Error(
            "Unable to load customer data."
          );
        }

        const [
          customersData,
          ordersData,
        ] = await Promise.all([
          customersResponse.json(),
          ordersResponse.json(),
        ]);

        setCustomers(
          Array.isArray(customersData)
            ? customersData
            : []
        );

        setOrders(
          Array.isArray(ordersData)
            ? ordersData
            : []
        );
      } catch (err) {
        console.error(
          "Admin customers error:",
          err
        );

        setError(
          err.message ||
            "Failed to load customers."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // ==========================================
  // CUSTOMER STATS
  // ==========================================
  const customerStats = useMemo(() => {
    const orderCustomerEmails =
      new Set(
        orders
          .map((order) =>
            String(
              order?.customerEmail || ""
            )
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      );

    const totalRevenue = orders.reduce(
      (sum, order) =>
        sum +
        Number(
          order?.totalPrice || 0
        ),
      0
    );

    const activeCustomers =
      customers.filter((customer) =>
        orderCustomerEmails.has(
          String(customer?.email || "")
            .trim()
            .toLowerCase()
        )
      ).length;

    const averageCustomerValue =
      customers.length > 0
        ? totalRevenue / customers.length
        : 0;

    return {
      total: customers.length,
      active: activeCustomers,
      totalOrders: orders.length,
      totalRevenue,
      averageCustomerValue,
    };
  }, [customers, orders]);

  // ==========================================
  // CUSTOMER ORDER MAP
  // ==========================================
  const customerData = useMemo(() => {
    return customers.map((customer) => {
      const email = String(
        customer?.email || ""
      )
        .trim()
        .toLowerCase();

      const customerOrders =
        orders.filter(
          (order) =>
            String(
              order?.customerEmail || ""
            )
              .trim()
              .toLowerCase() === email
        );

      const totalSpent =
        customerOrders.reduce(
          (sum, order) =>
            sum +
            Number(
              order?.totalPrice || 0
            ),
          0
        );

      const deliveredOrders =
        customerOrders.filter(
          (order) =>
            normalizeStatus(
              order?.status
            ) === "DELIVERED"
        ).length;

      const activeOrders =
        customerOrders.filter(
          (order) =>
            [
              "CONFIRMED",
              "PREPARING",
              "OUT_FOR_DELIVERY",
            ].includes(
              normalizeStatus(
                order?.status
              )
            )
        ).length;

      const latestOrder =
        [...customerOrders].sort(
          (a, b) =>
            (getOrderDate(b)?.getTime() ||
              0) -
            (getOrderDate(a)?.getTime() ||
              0)
        )[0] || null;

      return {
        ...customer,
        customerOrders,
        totalOrders:
          customerOrders.length,
        totalSpent,
        deliveredOrders,
        activeOrders,
        latestOrder,
      };
    });
  }, [customers, orders]);

  // ==========================================
  // SEARCH
  // ==========================================
  const filteredCustomers = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return customerData;
    }

    return customerData.filter(
      (customer) =>
        String(
          customer?.name || ""
        )
          .toLowerCase()
          .includes(value) ||
        String(
          customer?.email || ""
        )
          .toLowerCase()
          .includes(value) ||
        String(
          customer?.phone || ""
        )
          .toLowerCase()
          .includes(value) ||
        String(
          customer?.address || ""
        )
          .toLowerCase()
          .includes(value)
    );
  }, [customerData, search]);

  // ==========================================
  // LOGOUT
  // ==========================================
  const logout = () => {
    localStorage.removeItem(
      "quickbite-admin"
    );

    window.location.href =
      "/admin-login";
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-orange-500 text-3xl">
            👥
          </div>

          <p className="mt-4 font-bold text-slate-600">
            Loading Customers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* =====================================
          SIDEBAR
      ====================================== */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">

          <div className="border-b border-slate-100 px-6 py-6">
            <button
              onClick={() => {
                window.location.href =
                  "/admin";
              }}
              className="text-left"
            >
              <div className="text-2xl font-black">
                <span className="text-orange-500">
                  Quick
                </span>
                <span className="text-slate-900">
                  Bite
                </span>
              </div>

              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                Admin Panel
              </p>
            </button>
          </div>

          <nav className="flex-1 space-y-2 p-4">

            <button
              onClick={() => {
                window.location.href =
                  "/admin";
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-orange-500"
            >
              <span>📊</span>
              Dashboard
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/admin/orders";
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-orange-500"
            >
              <span>📦</span>
              Orders
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-600"
            >
              <span>👥</span>
              Customers
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/admin/restaurants";
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-orange-500"
            >
              <span>🍽️</span>
              Restaurants
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/admin/menu-items";
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-orange-500"
            >
              <span>🍔</span>
              Menu Items
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/";
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-orange-500"
            >
              <span>🌐</span>
              View Website
            </button>
          </nav>

          <div className="border-t border-slate-100 p-4">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-500 transition hover:bg-red-50"
            >
              <span>🚪</span>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================
          MAIN
      ====================================== */}
      <main className="lg:pl-64">

        {/* HEADER */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                QuickBite
              </p>

              <h1 className="text-xl font-black sm:text-2xl">
                Customer Management
              </h1>
            </div>

            <div className="flex items-center gap-2">

              <button
                onClick={() =>
                  loadData(true)
                }
                disabled={refreshing}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 sm:px-4"
              >
                <span
                  className={
                    refreshing
                      ? "inline-block animate-spin"
                      : ""
                  }
                >
                  🔄
                </span>

                <span className="ml-2 hidden sm:inline">
                  Refresh
                </span>
              </button>

              <button
                onClick={logout}
                className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-500 transition hover:bg-red-100"
              >
                <span className="sm:hidden">
                  🚪
                </span>

                <span className="hidden sm:inline">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* ERROR */}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* =================================
              STATS
          ================================= */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Total Customers
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {customerStats.total}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                  👥
                </div>
              </div>

              <p className="mt-4 text-xs font-bold text-blue-600">
                Registered accounts
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Active Customers
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {customerStats.active}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-xl">
                  🟢
                </div>
              </div>

              <p className="mt-4 text-xs font-bold text-green-600">
                Customers with orders
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Total Orders
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {customerStats.totalOrders}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                  📦
                </div>
              </div>

              <p className="mt-4 text-xs font-bold text-orange-600">
                Across all customers
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Customer Revenue
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    ₹
                    {customerStats.totalRevenue.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits: 0,
                      }
                    )}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-xl">
                  💰
                </div>
              </div>

              <p className="mt-4 text-xs font-bold text-purple-600">
                Total order value
              </p>
            </div>
          </section>

          {/* =================================
              SEARCH + INFO
          ================================= */}
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="text-xl font-black">
                  All Customers
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Search and view customer activity.
                </p>
              </div>

              <div className="relative w-full lg:max-w-md">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  🔎
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search name, email, phone..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                {filteredCustomers.length} shown
              </span>

              {search && (
                <button
                  onClick={() =>
                    setSearch("")
                  }
                  className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600"
                >
                  Clear Search ✕
                </button>
              )}
            </div>
          </section>

          {/* =================================
              DESKTOP TABLE
          ================================= */}
          <section className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                      Contact
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-400">
                      Orders
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-400">
                      Delivered
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-400">
                      Spent
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                      Last Order
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-5 py-14 text-center"
                      >
                        <div className="text-4xl">
                          👥
                        </div>

                        <p className="mt-3 font-black text-slate-700">
                          No customers found
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Try a different search.
                        </p>
                      </td>
                    </tr>
                  )}

                  {filteredCustomers.map(
                    (customer) => (
                      <tr
                        key={customer.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 font-black text-orange-600">
                              {String(
                                customer?.name ||
                                  customer?.email ||
                                  "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-800">
                                {customer?.name ||
                                  "Unnamed User"}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                ID #{customer.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <p className="max-w-[220px] truncate text-sm font-bold text-slate-700">
                            {customer?.email ||
                              "—"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {customer?.phone ||
                              "No phone"}
                          </p>
                        </td>

                        <td className="px-5 py-5 text-center">
                          <span className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
                            {customer.totalOrders}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-center">
                          <span className="rounded-xl bg-green-50 px-3 py-1.5 text-xs font-black text-green-600">
                            {customer.deliveredOrders}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-right">
                          <p className="font-black text-slate-800">
                            ₹
                            {customer.totalSpent.toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits: 0,
                              }
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <p className="text-sm font-bold text-slate-700">
                            {customer.latestOrder
                              ? `#${customer.latestOrder.id}`
                              : "No orders"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {customer.latestOrder
                              ? formatDate(
                                  customer.latestOrder
                                )
                              : "—"}
                          </p>
                        </td>

                        <td className="px-5 py-5 text-right">
                          <button
                            onClick={() =>
                              setSelectedCustomer(
                                customer
                              )
                            }
                            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-orange-500"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* =================================
              MOBILE CARDS
          ================================= */}
          <section className="mt-6 space-y-4 lg:hidden">

            {filteredCustomers.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="text-4xl">
                  👥
                </div>

                <p className="mt-3 font-black text-slate-700">
                  No customers found
                </p>
              </div>
            )}

            {filteredCustomers.map(
              (customer) => (
                <div
                  key={customer.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 font-black text-orange-600">
                        {String(
                          customer?.name ||
                            customer?.email ||
                            "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-black text-slate-800">
                          {customer?.name ||
                            "Unnamed User"}
                        </h3>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {customer?.email ||
                            "No email"}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-black text-green-600">
                      {customer.totalOrders > 0
                        ? "ACTIVE"
                        : "NEW"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">

                    <div className="rounded-2xl bg-slate-50 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Orders
                      </p>

                      <p className="mt-1 text-lg font-black">
                        {customer.totalOrders}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Delivered
                      </p>

                      <p className="mt-1 text-lg font-black text-green-600">
                        {customer.deliveredOrders}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Spent
                      </p>

                      <p className="mt-1 truncate text-lg font-black">
                        ₹
                        {customer.totalSpent.toFixed(
                          0
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">
                        Phone
                      </span>

                      <span className="font-bold text-slate-700">
                        {customer?.phone ||
                          "—"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">
                        Last Order
                      </span>

                      <span className="font-bold text-slate-700">
                        {customer.latestOrder
                          ? `#${customer.latestOrder.id}`
                          : "None"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedCustomer(
                        customer
                      )
                    }
                    className="mt-5 w-full rounded-2xl bg-slate-900 py-3 text-sm font-black text-white transition hover:bg-orange-500"
                  >
                    View Customer Details
                  </button>
                </div>
              )
            )}
          </section>

          {/* =================================
              CUSTOMER DETAIL MODAL
          ================================= */}
          {selectedCustomer && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
              onClick={() =>
                setSelectedCustomer(null)
              }
            >
              <div
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >

                {/* MODAL HEADER */}
                <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-5 sm:p-6">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-xl font-black text-orange-600">
                        {String(
                          selectedCustomer?.name ||
                            selectedCustomer?.email ||
                            "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h2 className="text-xl font-black sm:text-2xl">
                          {selectedCustomer?.name ||
                            "Unnamed User"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                          Customer ID #
                          {selectedCustomer.id}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedCustomer(
                          null
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="space-y-6 p-5 sm:p-6">

                  {/* CUSTOMER INFO */}
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                      Customer Information
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-400">
                          Email
                        </p>

                        <p className="mt-1 break-all font-bold text-slate-800">
                          {selectedCustomer?.email ||
                            "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-400">
                          Phone
                        </p>

                        <p className="mt-1 font-bold text-slate-800">
                          {selectedCustomer?.phone ||
                            "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                        <p className="text-xs font-bold text-slate-400">
                          Address
                        </p>

                        <p className="mt-1 font-bold leading-relaxed text-slate-800">
                          {selectedCustomer?.address ||
                            "No address saved"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CUSTOMER STATS */}
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                      Customer Statistics
                    </h3>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

                      <div className="rounded-2xl bg-blue-50 p-4">
                        <p className="text-xs font-bold text-blue-500">
                          Orders
                        </p>

                        <p className="mt-1 text-2xl font-black text-blue-700">
                          {
                            selectedCustomer.totalOrders
                          }
                        </p>
                      </div>

                      <div className="rounded-2xl bg-green-50 p-4">
                        <p className="text-xs font-bold text-green-500">
                          Delivered
                        </p>

                        <p className="mt-1 text-2xl font-black text-green-700">
                          {
                            selectedCustomer.deliveredOrders
                          }
                        </p>
                      </div>

                      <div className="rounded-2xl bg-orange-50 p-4">
                        <p className="text-xs font-bold text-orange-500">
                          Active
                        </p>

                        <p className="mt-1 text-2xl font-black text-orange-700">
                          {
                            selectedCustomer.activeOrders
                          }
                        </p>
                      </div>

                      <div className="rounded-2xl bg-purple-50 p-4">
                        <p className="text-xs font-bold text-purple-500">
                          Spent
                        </p>

                        <p className="mt-1 text-xl font-black text-purple-700">
                          ₹
                          {selectedCustomer.totalSpent.toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 0,
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ORDER HISTORY */}
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                          Order History
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Previous orders placed by this customer
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">
                        {
                          selectedCustomer
                            .customerOrders
                            .length
                        }{" "}
                        orders
                      </span>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">

                      {selectedCustomer.customerOrders.length ===
                        0 && (
                        <div className="p-8 text-center text-sm text-slate-400">
                          This customer has not placed any orders yet.
                        </div>
                      )}

                      <div className="divide-y divide-slate-100">

                        {[...selectedCustomer.customerOrders]
                          .sort(
                            (a, b) =>
                              (getOrderDate(
                                b
                              )?.getTime() ||
                                0) -
                              (getOrderDate(
                                a
                              )?.getTime() ||
                                0)
                          )
                          .map(
                            (order) => {
                              const status =
                                normalizeStatus(
                                  order?.status
                                );

                              const statusInfo =
                                {
                                  CONFIRMED: {
                                    label:
                                      "Confirmed",
                                    className:
                                      "bg-blue-50 text-blue-700",
                                  },
                                  PREPARING: {
                                    label:
                                      "Preparing",
                                    className:
                                      "bg-yellow-50 text-yellow-700",
                                  },
                                  OUT_FOR_DELIVERY: {
                                    label:
                                      "Out for Delivery",
                                    className:
                                      "bg-purple-50 text-purple-700",
                                  },
                                  DELIVERED: {
                                    label:
                                      "Delivered",
                                    className:
                                      "bg-green-50 text-green-700",
                                  },
                                  CANCELLED: {
                                    label:
                                      "Cancelled",
                                    className:
                                      "bg-red-50 text-red-700",
                                  },
                                }[
                                  status
                                ] || {
                                  label:
                                    status ||
                                    "Unknown",
                                  className:
                                    "bg-slate-100 text-slate-600",
                                };

                              return (
                                <div
                                  key={
                                    order.id
                                  }
                                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div>
                                    <p className="font-black text-slate-800">
                                      Order #
                                      {
                                        order.id
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                      {formatDateTime(
                                        order
                                      )}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                      {order
                                        ?.orderItems
                                        ?.length ||
                                        0}{" "}
                                      item(s)
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                                    <span
                                      className={`rounded-full px-3 py-1.5 text-[11px] font-black ${statusInfo.className}`}
                                    >
                                      {
                                        statusInfo.label
                                      }
                                    </span>

                                    <span className="font-black text-slate-900">
                                      ₹
                                      {Number(
                                        order?.totalPrice ||
                                          0
                                      ).toFixed(
                                        0
                                      )}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="border-t border-slate-100 bg-slate-50 p-5 sm:p-6">
                  <button
                    onClick={() =>
                      setSelectedCustomer(
                        null
                      )
                    }
                    className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-black text-white transition hover:bg-orange-500"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminCustomers;