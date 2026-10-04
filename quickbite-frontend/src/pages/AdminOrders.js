import React, { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../config";

const API = `${API_BASE_URL}/orders`;

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // =========================
  // LOAD ORDERS
  // =========================
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API);

      if (!response.ok) {
        throw new Error("Failed to load orders");
      }

      const data = await response.json();

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Admin Orders Error:", err);
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // =========================
  // HELPERS
  // =========================
  const getStatus = (order) => {
    return String(order?.status || "CONFIRMED")
      .toUpperCase()
      .replaceAll(" ", "_");
  };

  const getOrderId = (order) => {
    return order?.id || order?.orderId || "—";
  };

  const getAmount = (order) => {
    return Number(order?.totalPrice || 0);
  };

  const getOrderDate = (order) => {
    const raw =
      order?.createdAt ||
      order?.orderDate ||
      order?.createdOn ||
      order?.date;

    if (!raw) return null;

    const date = new Date(raw);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  };

  const getCustomerName = (order) => {
    return (
      order?.customerName ||
      order?.name ||
      order?.customer?.name ||
      "Customer"
    );
  };

  const getCustomerEmail = (order) => {
    return (
      order?.customerEmail ||
      order?.email ||
      order?.customer?.email ||
      "—"
    );
  };

  const getCustomerPhone = (order) => {
    return (
      order?.customerPhone ||
      order?.phone ||
      order?.customer?.phone ||
      "—"
    );
  };

  const getAddress = (order) => {
    return (
      order?.deliveryAddress ||
      order?.address ||
      order?.customerAddress ||
      order?.customer?.address ||
      "Address not available"
    );
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 0,
      }
    )}`;
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getItems = (order) => {
    if (Array.isArray(order?.orderItems)) {
      return order.orderItems;
    }

    if (Array.isArray(order?.items)) {
      return order.items;
    }

    return [];
  };

  const getItemName = (item) => {
    return (
      item?.menuItem?.itemName ||
      item?.menuItem?.name ||
      item?.itemName ||
      item?.name ||
      "Food Item"
    );
  };

  const getItemQuantity = (item) => {
    return Number(
      item?.quantity ||
        item?.qty ||
        1
    );
  };

  const getItemPrice = (item) => {
    return Number(
      item?.price ||
        item?.menuItem?.price ||
        0
    );
  };

  // =========================
  // STATUS UPDATE
  // =========================
  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);

      const response = await fetch(
        `${API}/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Status update API is not available"
        );
      }

      const updatedOrder = await response.json();

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          getOrderId(order) === orderId
            ? updatedOrder
            : order
        )
      );

      setSelectedOrder((current) =>
        current &&
        getOrderId(current) === orderId
          ? updatedOrder
          : current
      );
    } catch (err) {
      console.error("Status update error:", err);

      alert(
        "Status update failed.\n\nBackend me status update endpoint check karo."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================
  // FILTER ORDERS
  // =========================
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Search
    if (search.trim()) {
      const value = search
        .trim()
        .toLowerCase();

      result = result.filter((order) => {
        const id = String(
          getOrderId(order)
        ).toLowerCase();

        const name =
          getCustomerName(order).toLowerCase();

        const email =
          getCustomerEmail(order).toLowerCase();

        const phone =
          getCustomerPhone(order).toLowerCase();

        return (
          id.includes(value) ||
          name.includes(value) ||
          email.includes(value) ||
          phone.includes(value)
        );
      });
    }

    // Status
    if (statusFilter !== "ALL") {
      result = result.filter(
        (order) =>
          getStatus(order) === statusFilter
      );
    }

    // Date
    if (dateFilter !== "ALL") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      result = result.filter((order) => {
        const orderDate = getOrderDate(order);

        if (!orderDate) return false;

        orderDate.setHours(0, 0, 0, 0);

        if (dateFilter === "TODAY") {
          return (
            orderDate.getTime() ===
            today.getTime()
          );
        }

        if (dateFilter === "7_DAYS") {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(
            today.getDate() - 6
          );

          return orderDate >= sevenDaysAgo;
        }

        if (dateFilter === "30_DAYS") {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(
            today.getDate() - 29
          );

          return orderDate >= thirtyDaysAgo;
        }

        return true;
      });
    }

    // Latest first
    result.sort((a, b) => {
      const dateA =
        getOrderDate(a)?.getTime() || 0;

      const dateB =
        getOrderDate(b)?.getTime() || 0;

      return dateB - dateA;
    });

    return result;
  }, [
    orders,
    search,
    statusFilter,
    dateFilter,
  ]);

  // =========================
  // STATS
  // =========================
  const stats = useMemo(() => {
    const revenue = orders.reduce(
      (sum, order) =>
        sum + getAmount(order),
      0
    );

    const active = orders.filter((order) =>
      [
        "CONFIRMED",
        "PREPARING",
        "OUT_FOR_DELIVERY",
      ].includes(getStatus(order))
    ).length;

    const delivered = orders.filter(
      (order) =>
        getStatus(order) === "DELIVERED"
    ).length;

    const cancelled = orders.filter(
      (order) =>
        getStatus(order) === "CANCELLED"
    ).length;

    return {
      total: orders.length,
      revenue,
      active,
      delivered,
      cancelled,
    };
  }, [orders]);

  // =========================
  // STATUS STYLE
  // =========================
  const statusStyle = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-700";

      case "CANCELLED":
        return "bg-red-100 text-red-700";

      case "PREPARING":
        return "bg-yellow-100 text-yellow-700";

      case "OUT_FOR_DELIVERY":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-purple-100 text-purple-700";
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-slate-300">
            Loading Orders...
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl p-7 text-center border border-red-500/30">

          <div className="text-5xl mb-4">
            ⚠️
          </div>

          <h2 className="text-xl font-bold">
            Orders Error
          </h2>

          <p className="text-red-300 text-sm mt-3">
            {error}
          </p>

          <button
            onClick={loadOrders}
            className="mt-6 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold"
          >
            🔄 Retry
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* =========================
          HEADER
      ========================= */}
      <header className="bg-slate-950 text-white shadow-xl">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <button
                onClick={() => {
                  window.location.href =
                    "/admin";
                }}
                className="text-purple-400 text-sm font-semibold hover:text-purple-300 mb-2"
              >
                ← Back to Dashboard
              </button>

              <h1 className="text-2xl sm:text-3xl font-bold">
                Order Management
              </h1>

              <p className="text-slate-400 text-sm mt-1">
                Manage and monitor all QuickBite orders.
              </p>
            </div>

            <div className="flex gap-3">

              <button
                onClick={loadOrders}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-semibold"
              >
                🔄 Refresh
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem(
                    "quickbite-admin"
                  );

                  window.location.href =
                    "/admin-login";
                }}
                className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-sm font-semibold"
              >
                Logout
              </button>

            </div>

          </div>

        </div>

      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* =========================
            STATS
        ========================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Orders
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.total}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              All orders
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Revenue
            </p>

            <p className="text-3xl font-bold mt-2">
              {formatCurrency(
                stats.revenue
              )}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Total order value
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active
            </p>

            <p className="text-3xl font-bold mt-2 text-blue-600">
              {stats.active}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              In progress
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Delivered
            </p>

            <p className="text-3xl font-bold mt-2 text-green-600">
              {stats.delivered}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Successfully delivered
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Cancelled
            </p>

            <p className="text-3xl font-bold mt-2 text-red-600">
              {stats.cancelled}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Cancelled orders
            </p>
          </div>

        </div>

        {/* =========================
            FILTERS
        ========================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* SEARCH */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Search Orders
              </label>

              <div className="relative">

                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  🔍
                </span>

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Order ID, name, email, phone..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                />

              </div>
            </div>

            {/* STATUS */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="ALL">
                  All Statuses
                </option>

                <option value="CONFIRMED">
                  Confirmed
                </option>

                <option value="PREPARING">
                  Preparing
                </option>

                <option value="OUT_FOR_DELIVERY">
                  Out for Delivery
                </option>

                <option value="DELIVERED">
                  Delivered
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            {/* DATE */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Date
              </label>

              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(
                    e.target.value
                  )
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="ALL">
                  All Dates
                </option>

                <option value="TODAY">
                  Today
                </option>

                <option value="7_DAYS">
                  Last 7 Days
                </option>

                <option value="30_DAYS">
                  Last 30 Days
                </option>
              </select>
            </div>

          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">

            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-900">
                {filteredOrders.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-900">
                {orders.length}
              </span>{" "}
              orders
            </p>

            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setDateFilter("ALL");
              }}
              className="text-sm font-semibold text-purple-600 hover:text-purple-800"
            >
              Clear Filters
            </button>

          </div>

        </div>

        {/* =========================
            ORDERS TABLE
        ========================= */}
        {filteredOrders.length === 0 ? (

          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">

            <div className="text-6xl mb-4">
              📦
            </div>

            <h2 className="text-xl font-bold">
              No Orders Found
            </h2>

            <p className="text-slate-500 text-sm mt-2">
              Try changing your search or filters.
            </p>

          </div>

        ) : (

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* DESKTOP */}
            <div className="hidden lg:block overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50 border-b border-slate-200">

                  <tr>

                    <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase">
                      Order
                    </th>

                    <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase">
                      Customer
                    </th>

                    <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase">
                      Items
                    </th>

                    <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase">
                      Amount
                    </th>

                    <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase">
                      Status
                    </th>

                    <th className="text-right px-5 py-4 text-xs font-bold text-slate-500 uppercase">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredOrders.map((order) => {

                    const id = getOrderId(order);
                    const status = getStatus(order);
                    const date = getOrderDate(order);
                    const items = getItems(order);

                    return (
                      <tr
                        key={id}
                        className="hover:bg-slate-50 transition"
                      >

                        <td className="px-5 py-4">

                          <p className="font-bold">
                            #{id}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(date)}
                          </p>

                          <p className="text-xs text-slate-400">
                            {formatTime(date)}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <p className="font-semibold">
                            {getCustomerName(order)}
                          </p>

                          <p className="text-xs text-slate-500">
                            {getCustomerEmail(order)}
                          </p>

                          <p className="text-xs text-slate-500">
                            {getCustomerPhone(order)}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <p className="font-semibold">
                            {items.length} item
                            {items.length !== 1
                              ? "s"
                              : ""}
                          </p>

                          <p className="text-xs text-slate-500 max-w-[220px] truncate">
                            {items
                              .slice(0, 2)
                              .map(
                                (item) =>
                                  `${getItemName(
                                    item
                                  )} × ${getItemQuantity(
                                    item
                                  )}`
                              )
                              .join(", ")}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <p className="font-bold">
                            {formatCurrency(
                              getAmount(order)
                            )}
                          </p>

                          <p className="text-xs text-slate-400">
                            {order?.paymentMethod ||
                              "Payment"}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${statusStyle(
                              status
                            )}`}
                          >
                            {status.replaceAll(
                              "_",
                              " "
                            )}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-right">

                          <button
                            onClick={() =>
                              setSelectedOrder(
                                order
                              )
                            }
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-sm font-semibold transition"
                          >
                            View
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

            {/* MOBILE / TABLET */}
            <div className="lg:hidden divide-y divide-slate-100">

              {filteredOrders.map((order) => {

                const id = getOrderId(order);
                const status = getStatus(order);
                const date = getOrderDate(order);
                const items = getItems(order);

                return (
                  <div
                    key={id}
                    className="p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="font-bold text-lg">
                          #{id}
                        </p>

                        <p className="text-sm font-semibold mt-1">
                          {getCustomerName(order)}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {getCustomerEmail(order)}
                        </p>

                      </div>

                      <span
                        className={`inline-flex px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap ${statusStyle(
                          status
                        )}`}
                      >
                        {status.replaceAll(
                          "_",
                          " "
                        )}
                      </span>

                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-5">

                      <div>
                        <p className="text-xs text-slate-400">
                          Items
                        </p>

                        <p className="font-semibold text-sm mt-1">
                          {items.length} item
                          {items.length !== 1
                            ? "s"
                            : ""}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Amount
                        </p>

                        <p className="font-bold mt-1">
                          {formatCurrency(
                            getAmount(order)
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Date
                        </p>

                        <p className="font-semibold text-sm mt-1">
                          {formatDate(date)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Payment
                        </p>

                        <p className="font-semibold text-sm mt-1">
                          {order?.paymentMethod ||
                            "—"}
                        </p>
                      </div>

                    </div>

                    <button
                      onClick={() =>
                        setSelectedOrder(
                          order
                        )
                      }
                      className="w-full mt-5 py-3 rounded-xl bg-slate-950 text-white font-semibold hover:bg-purple-700 transition"
                    >
                      View Order Details
                    </button>

                  </div>
                );
              })}

            </div>

          </div>
        )}

      </main>

      {/* =========================
          ORDER DETAILS MODAL
      ========================= */}
      {selectedOrder && (

        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >

          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">

            {/* MODAL HEADER */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 sm:px-6 py-5 flex items-center justify-between">

              <div>

                <p className="text-xs text-purple-600 font-bold uppercase">
                  QuickBite Order
                </p>

                <h2 className="text-2xl font-bold mt-1">
                  #{getOrderId(
                    selectedOrder
                  )}
                </h2>

              </div>

              <button
                onClick={() =>
                  setSelectedOrder(null)
                }
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-xl"
              >
                ×
              </button>

            </div>

            <div className="p-5 sm:p-6">

              {/* STATUS */}
              <div className="bg-slate-50 rounded-2xl p-5 mb-5">

                <div className="flex items-center justify-between gap-3 mb-4">

                  <div>
                    <p className="text-xs text-slate-500">
                      Current Status
                    </p>

                    <span
                      className={`inline-flex mt-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusStyle(
                        getStatus(
                          selectedOrder
                        )
                      )}`}
                    >
                      {getStatus(
                        selectedOrder
                      ).replaceAll(
                        "_",
                        " "
                      )}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      Total
                    </p>

                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(
                        getAmount(
                          selectedOrder
                        )
                      )}
                    </p>
                  </div>

                </div>

                {/* STATUS SELECT */}
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Update Status
                </label>

                <select
                  value={getStatus(
                    selectedOrder
                  )}
                  disabled={
                    updatingId ===
                    getOrderId(
                      selectedOrder
                    )
                  }
                  onChange={(e) =>
                    updateStatus(
                      getOrderId(
                        selectedOrder
                      ),
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="CONFIRMED">
                    Confirmed
                  </option>

                  <option value="PREPARING">
                    Preparing
                  </option>

                  <option value="OUT_FOR_DELIVERY">
                    Out for Delivery
                  </option>

                  <option value="DELIVERED">
                    Delivered
                  </option>

                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>

                {updatingId ===
                  getOrderId(
                    selectedOrder
                  ) && (
                  <p className="text-xs text-purple-600 mt-2">
                    Updating order status...
                  </p>
                )}

              </div>

              {/* CUSTOMER */}
              <div className="mb-6">

                <h3 className="font-bold text-lg mb-3">
                  👤 Customer Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400">
                      Name
                    </p>

                    <p className="font-semibold mt-1">
                      {getCustomerName(
                        selectedOrder
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400">
                      Phone
                    </p>

                    <p className="font-semibold mt-1">
                      {getCustomerPhone(
                        selectedOrder
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 sm:col-span-2">
                    <p className="text-xs text-slate-400">
                      Email
                    </p>

                    <p className="font-semibold mt-1 break-all">
                      {getCustomerEmail(
                        selectedOrder
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 sm:col-span-2">
                    <p className="text-xs text-slate-400">
                      Delivery Address
                    </p>

                    <p className="font-semibold mt-1">
                      📍{" "}
                      {getAddress(
                        selectedOrder
                      )}
                    </p>
                  </div>

                </div>

              </div>

              {/* ITEMS */}
              <div className="mb-6">

                <h3 className="font-bold text-lg mb-3">
                  🍔 Order Items
                </h3>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">

                  {getItems(
                    selectedOrder
                  ).length === 0 ? (

                    <div className="p-5 text-sm text-slate-500">
                      Item details unavailable.
                    </div>

                  ) : (

                    getItems(
                      selectedOrder
                    ).map((item, index) => (

                      <div
                        key={index}
                        className="flex items-center justify-between gap-4 p-4 border-b last:border-b-0 border-slate-100"
                      >

                        <div>

                          <p className="font-semibold">
                            {getItemName(
                              item
                            )}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            Quantity:{" "}
                            {getItemQuantity(
                              item
                            )}
                          </p>

                        </div>

                        <p className="font-bold">
                          {formatCurrency(
                            getItemPrice(
                              item
                            ) *
                              getItemQuantity(
                                item
                              )
                          )}
                        </p>

                      </div>

                    ))

                  )}

                </div>

              </div>

              {/* PAYMENT */}
              <div className="mb-6">

                <h3 className="font-bold text-lg mb-3">
                  💳 Payment
                </h3>

                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">

                  <div>
                    <p className="text-xs text-slate-400">
                      Payment Method
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedOrder?.paymentMethod ||
                        "Not specified"}
                    </p>
                  </div>

                  <p className="font-bold text-xl">
                    {formatCurrency(
                      getAmount(
                        selectedOrder
                      )
                    )}
                  </p>

                </div>

              </div>

              {/* DATE */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-6">

                <p className="text-xs text-slate-400">
                  Order Created
                </p>

                <p className="font-semibold mt-1">
                  {formatDate(
                    getOrderDate(
                      selectedOrder
                    )
                  )}{" "}
                  at{" "}
                  {formatTime(
                    getOrderDate(
                      selectedOrder
                    )
                  )}
                </p>

              </div>

              {/* ACTIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <button
                  onClick={() => {
                    window.location.href =
                      `/track-order?id=${getOrderId(
                        selectedOrder
                      )}`;
                  }}
                  className="py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition"
                >
                  🚚 Track Order
                </button>

                <button
                  onClick={() =>
                    setSelectedOrder(null)
                  }
                  className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold transition"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminOrders;