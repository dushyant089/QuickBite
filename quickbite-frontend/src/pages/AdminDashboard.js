import React, { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../config";

const API_BASE = API_BASE_URL;

const STATUS_OPTIONS = [
  "ALL",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_OPTIONS = [
  "ALL",
  "COD",
  "PAID",
  "PENDING",
  "FAILED",
];

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const arrayFrom = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.users)) return value.users;
  if (Array.isArray(value?.orders)) return value.orders;
  if (Array.isArray(value?.restaurants)) return value.restaurants;
  if (Array.isArray(value?.menuItems)) return value.menuItems;
  return [];
};

const getStatus = (order) =>
  String(order?.status || "UNKNOWN").toUpperCase();

const getPaymentStatus = (order) =>
  String(
    order?.paymentStatus ||
      order?.payment_status ||
      (order?.paymentMode === "COD" ? "PENDING" : "") ||
      "UNKNOWN"
  ).toUpperCase();

const getOrderAmount = (order) =>
  Number(
    order?.totalPrice ??
      order?.totalAmount ??
      order?.amount ??
      order?.total ??
      0
  );

const getCustomerName = (order) =>
  order?.customerName ||
  order?.userName ||
  order?.customer?.name ||
  order?.user?.name ||
  order?.customerEmail ||
  "Customer";

const getCustomerEmail = (order) =>
  order?.customerEmail ||
  order?.email ||
  order?.customer?.email ||
  order?.user?.email ||
  "—";

const getRestaurantName = (order) =>
  order?.restaurantName ||
  order?.restaurant?.name ||
  "QuickBite Restaurant";

const getRole = (user) =>
  String(user?.role || "CUSTOMER").toUpperCase();

const getRestaurantImage = (restaurant) =>
  restaurant?.imageUrl ||
  restaurant?.image ||
  restaurant?.imageURL ||
  restaurant?.photoUrl ||
  restaurant?.photo ||
  "";

const initialRestaurant = {
  name: "",
  location: "",
  rating: 0,
  imageUrl: "",
};

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("ALL");

  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [showEditRestaurant, setShowEditRestaurant] = useState(false);

  const [restaurantForm, setRestaurantForm] =
    useState(initialRestaurant);

  const [editRestaurant, setEditRestaurant] = useState({
    id: null,
    ...initialRestaurant,
  });

  const [savingRestaurant, setSavingRestaurant] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [deletingRestaurantId, setDeletingRestaurantId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const showToast = (message) => {
    setToast(message);

    clearTimeout(window.__qbAdminToast);

    window.__qbAdminToast = setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const adminFetch = async (url, options = {}) => {
    const token = localStorage.getItem("quickbite-admin-token");

    if (!token) {
      throw new Error(
        "Admin session missing. Please login again."
      );
    }

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        `ADMIN API ERROR: ${url} → HTTP ${response.status}`
      );
    }

    const raw = await response.text();

    let data = null;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = raw;
    }

    if (!response.ok) {
      const message =
        typeof data === "string"
          ? data
          : data?.message ||
            data?.error ||
            `HTTP ${response.status}`;

      throw new Error(
        `ADMIN API ERROR: ${url} → ${message}`
      );
    }

    return data;
  };

  const loadUsers = async () => {
    const data = await adminFetch("/users");
    setUsers(arrayFrom(data));
  };

  const loadOrders = async () => {
    const data = await adminFetch("/orders/admin");
    setOrders(arrayFrom(data));
  };

  const loadRestaurants = async () => {
    const data = await adminFetch(
      "/restaurants/admin/all"
    );

    setRestaurants(arrayFrom(data));
  };

  const loadMenuItems = async () => {
    const data = await adminFetch("/menu-items");
    setMenuItems(arrayFrom(data));
  };

  const loadAllData = async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      loadUsers(),
      loadOrders(),
      loadRestaurants(),
      loadMenuItems(),
    ]);

    const failed = results.filter(
      (result) => result.status === "rejected"
    );

    if (failed.length > 0) {
      setError(
        failed[0]?.reason?.message ||
          "Some admin data could not be loaded."
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem(
      "quickbite-admin-token"
    );

    const role = localStorage.getItem(
      "quickbite-admin-role"
    );

    if (!token || role !== "ADMIN") {
      window.location.href = "/admin-login";
      return;
    }

    loadAllData();
  }, []);

  const logout = () => {
    localStorage.removeItem("quickbite-admin");
    localStorage.removeItem(
      "quickbite-admin-token"
    );
    localStorage.removeItem(
      "quickbite-admin-role"
    );

    window.location.href = "/admin-login";
  };

  // =========================================================
  // FILTERED USERS
  // =========================================================

  const filteredUsers = useMemo(() => {
    const search =
      userSearch.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !search ||
        String(user?.name || "")
          .toLowerCase()
          .includes(search) ||
        String(user?.email || "")
          .toLowerCase()
          .includes(search) ||
        String(user?.phone || "")
          .toLowerCase()
          .includes(search);

      const roleMatches =
        userRoleFilter === "ALL" ||
        getRole(user) === userRoleFilter;

      return (
        matchesSearch &&
        roleMatches
      );
    });
  }, [
    users,
    userSearch,
    userRoleFilter,
  ]);

  // =========================================================
  // FILTERED ORDERS
  // =========================================================

  const filteredOrders = useMemo(() => {
    const search =
      orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !search ||
        String(order?.id || "")
          .toLowerCase()
          .includes(search) ||
        getCustomerName(order)
          .toLowerCase()
          .includes(search) ||
        getCustomerEmail(order)
          .toLowerCase()
          .includes(search) ||
        getRestaurantName(order)
          .toLowerCase()
          .includes(search);

      const status = getStatus(order);
      const payment =
        getPaymentStatus(order);

      return (
        matchesSearch &&
        (orderStatusFilter === "ALL" ||
          status === orderStatusFilter) &&
        (orderPaymentFilter === "ALL" ||
          payment === orderPaymentFilter)
      );
    });
  }, [
    orders,
    orderSearch,
    orderStatusFilter,
    orderPaymentFilter,
  ]);

  // =========================================================
  // FILTERED RESTAURANTS
  // =========================================================

  const filteredRestaurants = useMemo(() => {
    const search =
      restaurantSearch.trim().toLowerCase();

    return restaurants.filter(
      (restaurant) => {
        return (
          !search ||
          String(
            restaurant?.name || ""
          )
            .toLowerCase()
            .includes(search) ||
          String(
            restaurant?.location || ""
          )
            .toLowerCase()
            .includes(search)
        );
      }
    );
  }, [
    restaurants,
    restaurantSearch,
  ]);

  // =========================================================
  // FILTERED MENU
  // =========================================================

  const filteredMenuItems = useMemo(() => {
    const search =
      menuSearch.trim().toLowerCase();

    return menuItems.filter((item) => {
      return (
        !search ||
        String(item?.name || "")
          .toLowerCase()
          .includes(search) ||
        String(item?.category || "")
          .toLowerCase()
          .includes(search) ||
        String(item?.description || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [menuItems, menuSearch]);

  // =========================================================
  // STATS
  // =========================================================

  const stats = useMemo(() => {
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

    const paidRevenue = orders
      .filter(
        (order) =>
          getStatus(order) !==
            "CANCELLED" &&
          [
            "PAID",
            "SUCCESS",
            "COMPLETED",
          ].includes(
            getPaymentStatus(order)
          )
      )
      .reduce(
        (sum, order) =>
          sum + getOrderAmount(order),
        0
      );

    return {
      totalOrders: orders.length,
      active,
      delivered,
      cancelled,
      paidRevenue,

      customers: users.filter(
        (user) =>
          getRole(user) === "CUSTOMER"
      ).length,

      owners: users.filter(
        (user) =>
          getRole(user) ===
          "RESTAURANT_OWNER"
      ).length,

      restaurants:
        restaurants.length,

      menuItems:
        menuItems.length,
    };
  }, [
    orders,
    users,
    restaurants,
    menuItems,
  ]);

  // =========================================================
  // RECENT ORDERS
  // =========================================================

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const first =
          new Date(
            a?.createdAt ||
              a?.orderDate ||
              0
          ).getTime();

        const second =
          new Date(
            b?.createdAt ||
              b?.orderDate ||
              0
          ).getTime();

        return second - first;
      })
      .slice(0, 5);
  }, [orders]);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "⌂",
    },
    {
      id: "orders",
      label: "Orders",
      icon: "▤",
    },
    {
      id: "users",
      label: "Users",
      icon: "◉",
    },
    {
      id: "restaurants",
      label: "Restaurants",
      icon: "◈",
    },
    {
      id: "menu",
      label: "Menu",
      icon: "✦",
    },
  ];

  // =========================================================
  // TONE HELPERS
  // =========================================================

  const statusTone = (status) => {
    if (status === "DELIVERED")
      return "green";

    if (status === "CANCELLED")
      return "red";

    if (status === "PREPARING")
      return "orange";

    if (
      status ===
      "OUT_FOR_DELIVERY"
    )
      return "blue";

    return "purple";
  };

  const paymentTone = (status) => {
    if (
      [
        "PAID",
        "SUCCESS",
        "COMPLETED",
      ].includes(status)
    ) {
      return "green";
    }

    if (
      [
        "FAILED",
        "CANCELLED",
      ].includes(status)
    ) {
      return "red";
    }

    return "orange";
  };

  const roleTone = (role) => {
    if (role === "ADMIN")
      return "red";

    if (
      role ===
      "RESTAURANT_OWNER"
    )
      return "orange";

    return "blue";
  };

  // =========================================================
  // ADD RESTAURANT
  // =========================================================

  const addRestaurant = async (event) => {
    event.preventDefault();

    if (
      !restaurantForm.name.trim()
    ) {
      showToast(
        "Restaurant name is required."
      );

      return;
    }

    if (
      !restaurantForm.location.trim()
    ) {
      showToast(
        "Restaurant location is required."
      );

      return;
    }

    setSavingRestaurant(true);

    try {
      await adminFetch(
        "/restaurants/admin/add",
        {
          method: "POST",

          body: JSON.stringify({
            name:
              restaurantForm.name.trim(),

            location:
              restaurantForm.location.trim(),

            rating: Math.max(
              0,
              Math.min(
                5,
                Number(
                  restaurantForm.rating || 0
                )
              )
            ),

            imageUrl:
              restaurantForm.imageUrl.trim(),
          }),
        }
      );

      showToast(
        "Restaurant added successfully."
      );

      setRestaurantForm(
        initialRestaurant
      );

      setShowAddRestaurant(false);

      await loadRestaurants();
    } catch (error) {
      setError(error.message);
      showToast(error.message);
    } finally {
      setSavingRestaurant(false);
    }
  };

  // =========================================================
  // EDIT RESTAURANT
  // =========================================================

  const openEditRestaurant = (
    restaurant
  ) => {
    setEditRestaurant({
      id: restaurant?.id,

      name:
        restaurant?.name || "",

      location:
        restaurant?.location || "",

      rating:
        Number(
          restaurant?.rating || 0
        ),

      imageUrl:
        getRestaurantImage(
          restaurant
        ),
    });

    setShowEditRestaurant(true);
  };

  const updateRestaurant =
    async (event) => {
      event.preventDefault();

      if (!editRestaurant.id)
        return;

      setSavingRestaurant(true);

      try {
        await adminFetch(
          `/restaurants/admin/update/${editRestaurant.id}`,
          {
            method: "PUT",

            body: JSON.stringify({
              name:
                editRestaurant.name.trim(),

              location:
                editRestaurant.location.trim(),

              rating: Math.max(
                0,
                Math.min(
                  5,
                  Number(
                    editRestaurant.rating ||
                      0
                  )
                )
              ),

              imageUrl:
                editRestaurant.imageUrl.trim(),
            }),
          }
        );

        showToast(
          "Restaurant updated successfully."
        );

        setShowEditRestaurant(false);

        await loadRestaurants();
      } catch (error) {
        setError(error.message);
        showToast(error.message);
      } finally {
        setSavingRestaurant(false);
      }
    };

  // =========================================================
  // DELETE RESTAURANT
  // =========================================================

  const deleteRestaurant =
    async (restaurant) => {
      const confirmed =
        window.confirm(
          `Delete "${
            restaurant?.name ||
            "this restaurant"
          }"?`
        );

      if (!confirmed)
        return;

      setDeletingRestaurantId(
        restaurant.id
      );

      try {
        await adminFetch(
          `/restaurants/admin/delete/${restaurant.id}`,
          {
            method: "DELETE",
          }
        );

        setSelectedRestaurant(null);

        showToast(
          "Restaurant deleted successfully."
        );

        await loadRestaurants();
      } catch (error) {
        setError(error.message);
        showToast(error.message);
      } finally {
        setDeletingRestaurantId(
          null
        );
      }
    };

  // =========================================================
  // UPDATE ORDER STATUS
  // =========================================================

  const updateOrderStatus =
    async (
      order,
      status
    ) => {
      if (!order?.id || !status)
        return;

      setUpdatingOrderId(
        order.id
      );

      try {
        await adminFetch(
          `/orders/${order.id}/status`,
          {
            method: "PUT",

            body: JSON.stringify({
              status,
            }),
          }
        );

        showToast(
          `Order #${order.id} updated.`
        );

        await loadOrders();
      } catch (error) {
        setError(error.message);
        showToast(error.message);
      } finally {
        setUpdatingOrderId(
          null
        );
      }
    };

  // =========================================================
  // DELETE USER
  // =========================================================

  const deleteUser = async (
    user
  ) => {
    if (
      getRole(user) === "ADMIN"
    ) {
      showToast(
        "Admin account cannot be deleted here."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${
          user?.name ||
          user?.email
        }"?`
      );

    if (!confirmed)
      return;

    setDeletingUserId(user.id);

    try {
      await adminFetch(
        `/users/${user.id}`,
        {
          method: "DELETE",
        }
      );

      setSelectedUser(null);

      showToast(
        "User deleted successfully."
      );

      await loadUsers();
    } catch (error) {
      setError(error.message);
      showToast(error.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <>
        <div className="qb-loading-screen">
          <div className="qb-loading-logo">
            Q
          </div>

          <h2>
            QuickBite Admin
          </h2>

          <p>
            Preparing your dashboard...
          </p>
        </div>

        <style>{styles}</style>
      </>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <>
      <div className="qb-app">

        <div className="qb-bg qb-bg-1" />
        <div className="qb-bg qb-bg-2" />

        {mobileSidebar && (
          <div
            className="qb-overlay"
            onClick={() =>
              setMobileSidebar(false)
            }
          />
        )}

        {/* ===================================================
            SIDEBAR
        ==================================================== */}

        <aside
          className={`qb-sidebar ${
            mobileSidebar
              ? "open"
              : ""
          }`}
        >

          <div className="qb-brand">

            <div className="qb-logo">
              Q
            </div>

            <div>

              <div className="qb-brand-title">
                Quick<span>Bite</span>
              </div>

              <div className="qb-brand-caption">
                ADMIN CENTER
              </div>

            </div>

            <button
              className="qb-close-sidebar"
              onClick={() =>
                setMobileSidebar(false)
              }
            >
              ×
            </button>

          </div>

          <div className="qb-side-heading">
            MAIN MENU
          </div>

          <div className="qb-nav">

            {navItems.map(
              (item) => {
                const active =
                  activeTab ===
                  item.id;

                return (
                  <button
                    key={item.id}
                    className={`qb-nav-btn ${
                      active
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {
                      setActiveTab(
                        item.id
                      );

                      setMobileSidebar(
                        false
                      );
                    }}
                  >

                    <span className="qb-nav-btn-icon">
                      {item.icon}
                    </span>

                    <span>
                      {item.label}
                    </span>

                  </button>
                );
              }
            )}

          </div>

          <div className="qb-sidebar-bottom">

            <div className="qb-online-card">

              <div className="qb-online-dot" />

              <div>
                <strong>
                  System Online
                </strong>

                <span>
                  All services are running
                </span>
              </div>

            </div>

            <button
              className="qb-sidebar-logout"
              onClick={logout}
            >
              ↪
              <span>
                Sign Out
              </span>
            </button>

          </div>

        </aside>

        {/* ===================================================
            MAIN
        ==================================================== */}

        <main className="qb-main">

          {/* HEADER */}

          <header className="qb-header">

            <div className="qb-header-left">

              <button
                className="qb-mobile-trigger"
                onClick={() =>
                  setMobileSidebar(true)
                }
              >
                ☰
              </button>

              <div>

                <div className="qb-breadcrumb">
                  QuickBite
                  <span>/</span>
                  Admin
                </div>

                <h1>
                  {
                    navItems.find(
                      (item) =>
                        item.id ===
                        activeTab
                    )?.label
                  }
                </h1>

              </div>

            </div>

            <div className="qb-header-right">

              <button
                className="qb-refresh-btn"
                onClick={
                  loadAllData
                }
                title="Refresh dashboard"
              >
                ↻
              </button>

              <div className="qb-profile">

                <div className="qb-avatar">
                  A
                </div>

                <div className="qb-profile-info">

                  <strong>
                    QuickBite Admin
                  </strong>

                  <span>
                    Administrator
                  </span>

                </div>

                <div className="qb-green-dot" />

              </div>

            </div>

          </header>

          {/* PAGE */}

          <div className="qb-page">

            {error && (
              <div className="qb-error">

                <div className="qb-error-mark">
                  !
                </div>

                <div className="qb-error-content">

                  <strong>
                    Admin API Error
                  </strong>

                  <span>
                    {error}
                  </span>

                </div>

                <button
                  onClick={() =>
                    setError("")
                  }
                >
                  ×
                </button>

              </div>
            )}

            {/* =================================================
                DASHBOARD
            ================================================== */}

            {activeTab ===
              "dashboard" && (
              <>

                <div className="qb-intro">

                  <div>

                    <span className="qb-eyebrow">
                      ADMIN OVERVIEW
                    </span>

                    <h2>
                      Good morning, Admin.
                    </h2>

                    <p>
                      Manage your QuickBite
                      platform from one
                      premium control center.
                    </p>

                  </div>

                  <div className="qb-live">
                    <span />
                    LIVE
                  </div>

                </div>

                {/* STATS */}

                <div className="qb-stats">

                  <StatCard
                    title="Total Orders"
                    value={
                      stats.totalOrders
                    }
                    note={`${stats.active} active orders`}
                    icon="▤"
                    color="blue"
                    onClick={() =>
                      setActiveTab(
                        "orders"
                      )
                    }
                  />

                  <StatCard
                    title="Customers"
                    value={
                      stats.customers
                    }
                    note={`${stats.owners} restaurant owners`}
                    icon="◉"
                    color="purple"
                    onClick={() =>
                      setActiveTab(
                        "users"
                      )
                    }
                  />

                  <StatCard
                    title="Restaurants"
                    value={
                      stats.restaurants
                    }
                    note={`${stats.menuItems} menu items`}
                    icon="◈"
                    color="green"
                    onClick={() =>
                      setActiveTab(
                        "restaurants"
                      )
                    }
                  />

                  <StatCard
                    title="Paid Revenue"
                    value={
                      money(
                        stats.paidRevenue
                      )
                    }
                    note={`${stats.delivered} delivered orders`}
                    icon="₹"
                    color="orange"
                  />

                </div>

                {/* DASHBOARD GRID */}

                <div className="qb-dashboard-grid">

                  <section className="qb-card">

                    <div className="qb-card-header">

                      <div>

                        <span className="qb-card-label">
                          ORDER ANALYTICS
                        </span>

                        <h3>
                          Order Performance
                        </h3>

                        <p>
                          Real-time distribution
                          of your orders
                        </p>

                      </div>

                      <div className="qb-card-badge">
                        {
                          stats.totalOrders
                        } Total
                      </div>

                    </div>

                    <div className="qb-performance">

                      <Performance
                        label="Active Orders"
                        value={
                          stats.active
                        }
                        total={
                          stats.totalOrders
                        }
                        color="blue"
                      />

                      <Performance
                        label="Delivered"
                        value={
                          stats.delivered
                        }
                        total={
                          stats.totalOrders
                        }
                        color="green"
                      />

                      <Performance
                        label="Cancelled"
                        value={
                          stats.cancelled
                        }
                        total={
                          stats.totalOrders
                        }
                        color="red"
                      />

                    </div>

                    <div className="qb-bottom-stats">

                      <div>
                        <span>
                          Paid Revenue
                        </span>

                        <strong>
                          {money(
                            stats.paidRevenue
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Delivery Rate
                        </span>

                        <strong>
                          {
                            stats.totalOrders
                              ? Math.round(
                                  (stats.delivered /
                                    stats.totalOrders) *
                                    100
                                )
                              : 0
                          }
                          %
                        </strong>
                      </div>

                    </div>

                  </section>

                  {/* ACTIONS */}

                  <section className="qb-card">

                    <div className="qb-card-header">

                      <div>

                        <span className="qb-card-label">
                          QUICK ACTIONS
                        </span>

                        <h3>
                          Control Center
                        </h3>

                        <p>
                          Access your main
                          workspaces
                        </p>

                      </div>

                    </div>

                    <div className="qb-actions">

                      <QuickAction
                        icon="▤"
                        title="Manage Orders"
                        onClick={() =>
                          setActiveTab(
                            "orders"
                          )
                        }
                      />

                      <QuickAction
                        icon="◉"
                        title="Manage Users"
                        onClick={() =>
                          setActiveTab(
                            "users"
                          )
                        }
                      />

                      <QuickAction
                        icon="◈"
                        title="Manage Restaurants"
                        onClick={() =>
                          setActiveTab(
                            "restaurants"
                          )
                        }
                      />

                      <QuickAction
                        icon="✦"
                        title="View Menu"
                        onClick={() =>
                          setActiveTab(
                            "menu"
                          )
                        }
                      />

                    </div>

                  </section>

                </div>

                {/* BOTTOM GRID */}

                <div className="qb-dashboard-grid bottom">

                  <section className="qb-card">

                    <div className="qb-card-header">

                      <div>

                        <span className="qb-card-label">
                          RECENT ACTIVITY
                        </span>

                        <h3>
                          Recent Orders
                        </h3>

                        <p>
                          Latest customer
                          transactions
                        </p>

                      </div>

                      <button
                        className="qb-link-button"
                        onClick={() =>
                          setActiveTab(
                            "orders"
                          )
                        }
                      >
                        View all →
                      </button>

                    </div>

                    <div className="qb-recent-list">

                      {recentOrders.length ===
                      0 ? (
                        <Empty
                          text="No recent orders available."
                        />
                      ) : (
                        recentOrders.map(
                          (order) => (
                            <div
                              key={order?.id}
                              className="qb-recent-row"
                            >

                              <div className="qb-order-number">
                                #{order?.id}
                              </div>

                              <div className="qb-recent-info">

                                <strong>
                                  {
                                    getCustomerName(
                                      order
                                    )
                                  }
                                </strong>

                                <span>
                                  {
                                    getRestaurantName(
                                      order
                                    )
                                  }
                                </span>

                              </div>

                              <StatusBadge
                                tone={statusTone(
                                  getStatus(
                                    order
                                  )
                                )}
                              >
                                {
                                  getStatus(
                                    order
                                  )
                                }
                              </StatusBadge>

                              <div className="qb-recent-amount">
                                {money(
                                  getOrderAmount(
                                    order
                                  )
                                )}
                              </div>

                            </div>
                          )
                        )
                      )}

                    </div>

                  </section>

                  {/* RESTAURANTS */}

                  <section className="qb-card">

                    <div className="qb-card-header">

                      <div>

                        <span className="qb-card-label">
                          RESTAURANT NETWORK
                        </span>

                        <h3>
                          Restaurants
                        </h3>

                        <p>
                          Your restaurant listings
                        </p>

                      </div>

                      <button
                        className="qb-link-button"
                        onClick={() =>
                          setActiveTab(
                            "restaurants"
                          )
                        }
                      >
                        Manage →
                      </button>

                    </div>

                    <div className="qb-mini-restaurants">

                      {restaurants.length ===
                      0 ? (
                        <Empty
                          text="No restaurants available."
                        />
                      ) : (
                        restaurants
                          .slice(0, 4)
                          .map(
                            (
                              restaurant
                            ) => (
                              <MiniRestaurant
                                key={
                                  restaurant?.id
                                }
                                restaurant={
                                  restaurant
                                }
                                onClick={() =>
                                  setSelectedRestaurant(
                                    restaurant
                                  )
                                }
                              />
                            )
                          )
                      )}

                    </div>

                  </section>

                </div>

              </>
            )}

            {/* =================================================
                ORDERS
            ================================================== */}

            {activeTab ===
              "orders" && (
              <>

                <WorkspaceHeader
                  eyebrow="ORDER MANAGEMENT"
                  title="Orders"
                  subtitle="Monitor, filter and update customer orders."
                  action={
                    <button
                      className="qb-main-button"
                      onClick={
                        loadOrders
                      }
                    >
                      ↻ Refresh Orders
                    </button>
                  }
                />

                <section className="qb-card qb-filter-card">

                  <div className="qb-filter-grid">

                    <SearchField
                      value={
                        orderSearch
                      }
                      onChange={(e) =>
                        setOrderSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search order, customer or restaurant..."
                    />

                    <select
                      className="qb-select"
                      value={
                        orderStatusFilter
                      }
                      onChange={(e) =>
                        setOrderStatusFilter(
                          e.target.value
                        )
                      }
                    >

                      {STATUS_OPTIONS.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}

                    </select>

                    <select
                      className="qb-select"
                      value={
                        orderPaymentFilter
                      }
                      onChange={(e) =>
                        setOrderPaymentFilter(
                          e.target.value
                        )
                      }
                    >

                      {PAYMENT_OPTIONS.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </section>

                <section className="qb-card qb-table-card">

                  <div className="qb-table-scroll">

                    <table className="qb-table">

                      <thead>

                        <tr>

                          <th>
                            ORDER
                          </th>

                          <th>
                            CUSTOMER
                          </th>

                          <th>
                            RESTAURANT
                          </th>

                          <th>
                            AMOUNT
                          </th>

                          <th>
                            PAYMENT
                          </th>

                          <th>
                            STATUS
                          </th>

                          <th>
                            ACTION
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {filteredOrders.length ===
                        0 ? (
                          <tr>
                            <td
                              colSpan="7"
                              className="qb-empty-cell"
                            >
                              No orders found.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map(
                            (order) => {
                              const status =
                                getStatus(
                                  order
                                );

                              const payment =
                                getPaymentStatus(
                                  order
                                );

                              return (
                                <tr
                                  key={
                                    order?.id
                                  }
                                >

                                  <td>
                                    <strong className="table-big">
                                      #{order?.id}
                                    </strong>

                                    <span className="table-small">
                                      {dateTime(
                                        order?.createdAt ||
                                          order?.orderDate
                                      )}
                                    </span>
                                  </td>

                                  <td>
                                    <strong className="table-big">
                                      {getCustomerName(
                                        order
                                      )}
                                    </strong>

                                    <span className="table-small">
                                      {getCustomerEmail(
                                        order
                                      )}
                                    </span>
                                  </td>

                                  <td>
                                    <span className="table-normal">
                                      {getRestaurantName(
                                        order
                                      )}
                                    </span>
                                  </td>

                                  <td>
                                    <strong className="table-money">
                                      {money(
                                        getOrderAmount(
                                          order
                                        )
                                      )}
                                    </strong>
                                  </td>

                                  <td>
                                    <StatusBadge
                                      tone={paymentTone(
                                        payment
                                      )}
                                    >
                                      {payment}
                                    </StatusBadge>
                                  </td>

                                  <td>
                                    <StatusBadge
                                      tone={statusTone(
                                        status
                                      )}
                                    >
                                      {status}
                                    </StatusBadge>
                                  </td>

                                  <td>

                                    <div className="table-actions">

                                      <button
                                        className="outline-blue"
                                        onClick={() =>
                                          setSelectedOrder(
                                            order
                                          )
                                        }
                                      >
                                        View
                                      </button>

                                      <select
                                        className="qb-mini-select"
                                        value={
                                          status
                                        }
                                        disabled={
                                          updatingOrderId ===
                                            order?.id ||
                                          status ===
                                            "DELIVERED" ||
                                          status ===
                                            "CANCELLED"
                                        }
                                        onChange={(e) =>
                                          updateOrderStatus(
                                            order,
                                            e.target.value
                                          )
                                        }
                                      >

                                        {[
                                          "CONFIRMED",
                                          "PREPARING",
                                          "OUT_FOR_DELIVERY",
                                          "DELIVERED",
                                          "CANCELLED",
                                        ].map(
                                          (
                                            item
                                          ) => (
                                            <option
                                              key={
                                                item
                                              }
                                              value={
                                                item
                                              }
                                            >
                                              {
                                                item
                                              }
                                            </option>
                                          )
                                        )}

                                      </select>

                                    </div>

                                  </td>

                                </tr>
                              );
                            }
                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </section>

              </>
            )}

            {/* =================================================
                USERS
            ================================================== */}

            {activeTab ===
              "users" && (
              <>

                <WorkspaceHeader
                  eyebrow="USER MANAGEMENT"
                  title="Users"
                  subtitle="Manage customers, restaurant owners and admin accounts."
                  action={
                    <button
                      className="qb-main-button"
                      onClick={
                        loadUsers
                      }
                    >
                      ↻ Refresh Users
                    </button>
                  }
                />

                <section className="qb-card qb-filter-card">

                  <div className="qb-filter-grid users">

                    <SearchField
                      value={
                        userSearch
                      }
                      onChange={(e) =>
                        setUserSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search by name, email or phone..."
                    />

                    <select
                      className="qb-select"
                      value={
                        userRoleFilter
                      }
                      onChange={(e) =>
                        setUserRoleFilter(
                          e.target.value
                        )
                      }
                    >

                      {[
                        "ALL",
                        "CUSTOMER",
                        "RESTAURANT_OWNER",
                        "ADMIN",
                      ].map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </section>

                <section className="qb-card qb-table-card">

                  <div className="qb-table-scroll">

                    <table className="qb-table">

                      <thead>

                        <tr>

                          <th>
                            USER
                          </th>

                          <th>
                            ROLE
                          </th>

                          <th>
                            EMAIL
                          </th>

                          <th>
                            PHONE
                          </th>

                          <th>
                            VERIFICATION
                          </th>

                          <th>
                            ACTION
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {filteredUsers.length ===
                        0 ? (
                          <tr>

                            <td
                              colSpan="6"
                              className="qb-empty-cell"
                            >
                              No users found.
                            </td>

                          </tr>
                        ) : (
                          filteredUsers.map(
                            (user) => {

                              const emailVerified =
                                user?.emailVerified ??
                                user?.email_verified;

                              const mobileVerified =
                                user?.mobileVerified ??
                                user?.mobile_verified;

                              const role =
                                getRole(
                                  user
                                );

                              return (
                                <tr
                                  key={
                                    user?.id
                                  }
                                >

                                  <td>

                                    <div className="table-user">

                                      <div className="table-user-avatar">
                                        {(
                                          user?.name ||
                                          "U"
                                        )
                                          .charAt(
                                            0
                                          )
                                          .toUpperCase()}
                                      </div>

                                      <div>

                                        <strong className="table-big">
                                          {user?.name ||
                                            "Unnamed User"}
                                        </strong>

                                        <span className="table-small">
                                          ID #
                                          {
                                            user?.id
                                          }
                                        </span>

                                      </div>

                                    </div>

                                  </td>

                                  <td>

                                    <StatusBadge
                                      tone={roleTone(
                                        role
                                      )}
                                    >
                                      {role}
                                    </StatusBadge>

                                  </td>

                                  <td>
                                    <span className="table-normal">
                                      {user?.email ||
                                        "—"}
                                    </span>
                                  </td>

                                  <td>
                                    <span className="table-normal">
                                      {user?.phone ||
                                        "—"}
                                    </span>
                                  </td>

                                  <td>

                                    <div className="verification-list">

                                      <StatusBadge
                                        tone={
                                          emailVerified
                                            ? "green"
                                            : "orange"
                                        }
                                      >
                                        {emailVerified
                                          ? "Email Verified"
                                          : "Email Pending"}
                                      </StatusBadge>

                                      <StatusBadge
                                        tone={
                                          mobileVerified
                                            ? "green"
                                            : "orange"
                                        }
                                      >
                                        {mobileVerified
                                          ? "Mobile Verified"
                                          : "Mobile Pending"}
                                      </StatusBadge>

                                    </div>

                                  </td>

                                  <td>

                                    <div className="table-actions">

                                      <button
                                        className="outline-blue"
                                        onClick={() =>
                                          setSelectedUser(
                                            user
                                          )
                                        }
                                      >
                                        View
                                      </button>

                                      <button
                                        className="outline-red"
                                        disabled={
                                          deletingUserId ===
                                          user?.id
                                        }
                                        onClick={() =>
                                          deleteUser(
                                            user
                                          )
                                        }
                                      >
                                        Delete
                                      </button>

                                    </div>

                                  </td>

                                </tr>
                              );
                            }
                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </section>

              </>
            )}

            {/* =================================================
                RESTAURANTS
            ================================================== */}

            {activeTab ===
              "restaurants" && (
              <>

                <WorkspaceHeader
                  eyebrow="RESTAURANT MANAGEMENT"
                  title="Restaurants"
                  subtitle="Manage restaurant profiles, images, ratings and locations."
                  action={
                    <button
                      className="qb-main-button"
                      onClick={() => {
                        setRestaurantForm(
                          initialRestaurant
                        );

                        setShowAddRestaurant(
                          true
                        );
                      }}
                    >
                      + Add Restaurant
                    </button>
                  }
                />

                <section className="qb-card qb-filter-card">

                  <SearchField
                    value={
                      restaurantSearch
                    }
                    onChange={(e) =>
                      setRestaurantSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search restaurant or location..."
                  />

                </section>

                <div className="qb-restaurant-grid">

                  {filteredRestaurants.length ===
                  0 ? (
                    <div className="qb-card qb-empty-big">
                      No restaurants found.
                    </div>
                  ) : (
                    filteredRestaurants.map(
                      (restaurant) => (
                        <RestaurantCard
                          key={
                            restaurant?.id
                          }
                          restaurant={
                            restaurant
                          }
                          onView={() =>
                            setSelectedRestaurant(
                              restaurant
                            )
                          }
                          onEdit={() =>
                            openEditRestaurant(
                              restaurant
                            )
                          }
                          onDelete={() =>
                            deleteRestaurant(
                              restaurant
                            )
                          }
                          deleting={
                            deletingRestaurantId ===
                            restaurant?.id
                          }
                        />
                      )
                    )
                  )}

                </div>

              </>
            )}

            {/* =================================================
                MENU
            ================================================== */}

            {activeTab ===
              "menu" && (
              <>

                <WorkspaceHeader
                  eyebrow="MENU MANAGEMENT"
                  title="Menu"
                  subtitle="Browse the food catalog currently connected to QuickBite."
                  action={
                    <button
                      className="qb-main-button"
                      onClick={
                        loadMenuItems
                      }
                    >
                      ↻ Refresh Menu
                    </button>
                  }
                />

                <section className="qb-card qb-filter-card">

                  <SearchField
                    value={
                      menuSearch
                    }
                    onChange={(e) =>
                      setMenuSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search item, category or description..."
                  />

                </section>

                <div className="qb-menu-grid">

                  {filteredMenuItems.length ===
                  0 ? (
                    <div className="qb-card qb-empty-big">
                      No menu items found.
                    </div>
                  ) : (
                    filteredMenuItems.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          className="qb-menu-card"
                          key={
                            item?.id ||
                            index
                          }
                        >

                          <div className="qb-menu-symbol">
                            ✦
                          </div>

                          <div className="qb-menu-info">

                            <div className="qb-menu-header-row">

                              <div>

                                <h3>
                                  {item?.itemName || item?.name || "Unnamed Item"}
                          
                                </h3>

                                <p className="mt-1 text-xs text-gray-500">
  {item?.restaurant?.name ||
    item?.restaurantName ||
    item?.restaurant?.restaurantName ||
    "QuickBite Restaurant"}
</p>

                                <span>
                                  {item?.category ||
                                    "Menu Course"}
                                </span>

                              </div>

                              {item?.price !==
                                undefined && (
                                <strong>
                                  {money(
                                    item.price
                                  )}
                                </strong>
                              )}

                            </div>

                            <p>
                            {item?.description || "Description not added yet."}
                          
                            </p>

                          </div>

                        </div>
                      )
                    )
                  )}

                </div>

              </>
            )}

          </div>

        </main>

      </div>

      {/* =====================================================
          ADD RESTAURANT MODAL
      ====================================================== */}

      {showAddRestaurant && (
        <Modal
          title="Create Restaurant"
          subtitle="Add a new restaurant to your QuickBite network."
          onClose={() =>
            setShowAddRestaurant(
              false
            )
          }
        >

          <form
            onSubmit={
              addRestaurant
            }
          >

            <FormField
              label="Restaurant Name"
              value={
                restaurantForm.name
              }
              onChange={(e) =>
                setRestaurantForm({
                  ...restaurantForm,
                  name:
                    e.target.value,
                })
              }
              placeholder="e.g. QuickBite Kitchen"
            />

            <FormField
              label="Location"
              value={
                restaurantForm.location
              }
              onChange={(e) =>
                setRestaurantForm({
                  ...restaurantForm,
                  location:
                    e.target.value,
                })
              }
              placeholder="e.g. Delhi"
            />

            <FormField
              label="Rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={
                restaurantForm.rating
              }
              onChange={(e) =>
                setRestaurantForm({
                  ...restaurantForm,
                  rating:
                    e.target.value,
                })
              }
              placeholder="0 - 5"
            />

            <FormField
              label="Restaurant Image URL"
              value={
                restaurantForm.imageUrl
              }
              onChange={(e) =>
                setRestaurantForm({
                  ...restaurantForm,
                  imageUrl:
                    e.target.value,
                })
              }
              placeholder="https://..."
            />

            {restaurantForm.imageUrl && (
              <ImagePreview
                src={
                  restaurantForm.imageUrl
                }
              />
            )}

            <button
              className="qb-modal-submit"
              type="submit"
              disabled={
                savingRestaurant
              }
            >
              {savingRestaurant
                ? "Creating Restaurant..."
                : "Create Restaurant"}
            </button>

          </form>

        </Modal>
      )}

      {/* =====================================================
          EDIT RESTAURANT MODAL
      ====================================================== */}

      {showEditRestaurant && (
        <Modal
          title="Edit Restaurant"
          subtitle="Update restaurant information and imagery."
          onClose={() =>
            setShowEditRestaurant(
              false
            )
          }
        >

          <form
            onSubmit={
              updateRestaurant
            }
          >

            <FormField
              label="Restaurant Name"
              value={
                editRestaurant.name
              }
              onChange={(e) =>
                setEditRestaurant({
                  ...editRestaurant,
                  name:
                    e.target.value,
                })
              }
            />

            <FormField
              label="Location"
              value={
                editRestaurant.location
              }
              onChange={(e) =>
                setEditRestaurant({
                  ...editRestaurant,
                  location:
                    e.target.value,
                })
              }
            />

            <FormField
              label="Rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={
                editRestaurant.rating
              }
              onChange={(e) =>
                setEditRestaurant({
                  ...editRestaurant,
                  rating:
                    e.target.value,
                })
              }
            />

            <FormField
              label="Restaurant Image URL"
              value={
                editRestaurant.imageUrl
              }
              onChange={(e) =>
                setEditRestaurant({
                  ...editRestaurant,
                  imageUrl:
                    e.target.value,
                })
              }
            />

            {editRestaurant.imageUrl && (
              <ImagePreview
                src={
                  editRestaurant.imageUrl
                }
              />
            )}

            <button
              className="qb-modal-submit"
              type="submit"
              disabled={
                savingRestaurant
              }
            >
              {savingRestaurant
                ? "Saving Changes..."
                : "Save Changes"}
            </button>

          </form>

        </Modal>
      )}

      {/* =====================================================
          ORDER MODAL
      ====================================================== */}

      {selectedOrder && (
        <Modal
          title={`Order #${selectedOrder.id}`}
          subtitle="Complete order and payment information."
          onClose={() =>
            setSelectedOrder(
              null
            )
          }
        >

          <DetailRow
            label="Customer"
            value={getCustomerName(
              selectedOrder
            )}
          />

          <DetailRow
            label="Email"
            value={getCustomerEmail(
              selectedOrder
            )}
          />

          <DetailRow
            label="Restaurant"
            value={getRestaurantName(
              selectedOrder
            )}
          />

          <DetailRow
            label="Amount"
            value={money(
              getOrderAmount(
                selectedOrder
              )
            )}
          />

          <DetailRow
            label="Status"
            value={
              <StatusBadge
                tone={statusTone(
                  getStatus(
                    selectedOrder
                  )
                )}
              >
                {getStatus(
                  selectedOrder
                )}
              </StatusBadge>
            }
          />

          <DetailRow
            label="Payment"
            value={
              <StatusBadge
                tone={paymentTone(
                  getPaymentStatus(
                    selectedOrder
                  )
                )}
              >
                {getPaymentStatus(
                  selectedOrder
                )}
              </StatusBadge>
            }
          />

          <DetailRow
            label="Created"
            value={dateTime(
              selectedOrder?.createdAt ||
                selectedOrder?.orderDate
            )}
          />

        </Modal>
      )}

      {/* =====================================================
          RESTAURANT MODAL
      ====================================================== */}

      {selectedRestaurant && (
        <Modal
          title={
            selectedRestaurant?.name ||
            "Restaurant"
          }
          subtitle="Restaurant profile and listing details."
          onClose={() =>
            setSelectedRestaurant(
              null
            )
          }
        >

          <RestaurantHero
            restaurant={
              selectedRestaurant
            }
          />

          <DetailRow
            label="Restaurant ID"
            value={`#${
              selectedRestaurant?.id ||
              "—"
            }`}
          />

          <DetailRow
            label="Location"
            value={
              selectedRestaurant?.location ||
              "—"
            }
          />

          <DetailRow
            label="Rating"
            value={`★ ${Number(
              selectedRestaurant?.rating ||
                0
            ).toFixed(1)} / 5`}
          />

          <button
            className="qb-modal-submit"
            onClick={() => {
              openEditRestaurant(
                selectedRestaurant
              );

              setSelectedRestaurant(
                null
              );
            }}
          >
            Edit Restaurant
          </button>

        </Modal>
      )}

      {/* =====================================================
          USER MODAL
      ====================================================== */}

      {selectedUser && (
        <Modal
          title={
            selectedUser?.name ||
            "User"
          }
          subtitle="Account profile and verification information."
          onClose={() =>
            setSelectedUser(null)
          }
        >

          <div className="qb-user-modal">

            <div className="qb-user-modal-avatar">
              {(
                selectedUser?.name ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <h3>
                {selectedUser?.name ||
                  "Unnamed User"}
              </h3>

              <StatusBadge
                tone={roleTone(
                  getRole(
                    selectedUser
                  )
                )}
              >
                {getRole(
                  selectedUser
                )}
              </StatusBadge>

            </div>

          </div>

          <DetailRow
            label="User ID"
            value={`#${
              selectedUser?.id ||
              "—"
            }`}
          />

          <DetailRow
            label="Email"
            value={
              selectedUser?.email ||
              "—"
            }
          />

          <DetailRow
            label="Phone"
            value={
              selectedUser?.phone ||
              "—"
            }
          />

          <DetailRow
            label="Address"
            value={
              selectedUser?.address ||
              "—"
            }
          />

        </Modal>
      )}

      {/* TOAST */}

      {toast && (
        <div className="qb-toast">
          <span>✓</span>
          {toast}
        </div>
      )}

      <style>{styles}</style>
    </>
  );
}

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function StatCard({
  title,
  value,
  note,
  icon,
  color,
  onClick,
}) {
  return (
    <button
      className={`qb-stat-card ${color}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <div className="qb-stat-icon">
        {icon}
      </div>

      <span className="qb-stat-label">
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        <span>●</span>
        {note}
      </small>
    </button>
  );
}

function Performance({
  label,
  value,
  total,
  color,
}) {
  const percent = total
    ? Math.min(
        100,
        (value / total) * 100
      )
    : 0;

  return (
    <div className="qb-performance-item">

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>

      <div className="qb-progress">

        <div
          className={`qb-progress-fill ${color}`}
          style={{
            width: `${percent}%`,
          }}
        />

      </div>

    </div>
  );
}

function QuickAction({
  icon,
  title,
  onClick,
}) {
  return (
    <button
      className="qb-action"
      onClick={onClick}
    >

      <span className="qb-action-icon">
        {icon}
      </span>

      <span>
        {title}
      </span>

      <strong>
        →
      </strong>

    </button>
  );
}

function MiniRestaurant({
  restaurant,
  onClick,
}) {
  const image =
    getRestaurantImage(
      restaurant
    );

  return (
    <button
      className="qb-mini-restaurant"
      onClick={onClick}
    >

      <div className="qb-mini-image">

        {image ? (
          <img
            src={image}
            alt={
              restaurant?.name ||
              "Restaurant"
            }
            onError={(e) => {
              e.currentTarget.style.display =
                "none";
            }}
          />
        ) : (
          <span>
            🍽️
          </span>
        )}

        <div className="qb-mini-rating">
          ★{" "}
          {Number(
            restaurant?.rating ||
              0
          ).toFixed(1)}
        </div>

      </div>

      <div className="qb-mini-copy">

        <strong>
          {restaurant?.name ||
            "Unnamed Restaurant"}
        </strong>

        <span>
          {restaurant?.location ||
            "Location unavailable"}
        </span>

      </div>

    </button>
  );
}

function RestaurantCard({
  restaurant,
  onView,
  onEdit,
  onDelete,
  deleting,
}) {
  const image =
    getRestaurantImage(
      restaurant
    );

  return (
    <div className="qb-restaurant-card">

      <div className="qb-restaurant-image">

        {image ? (
          <img
            src={image}
            alt={
              restaurant?.name ||
              "Restaurant"
            }
            onError={(e) => {
              e.currentTarget.style.display =
                "none";

              const fallback =
                e.currentTarget.parentElement?.querySelector(
                  ".restaurant-fallback"
                );

              if (fallback) {
                fallback.style.display =
                  "grid";
              }
            }}
          />
        ) : null}

        <div
          className="restaurant-fallback"
          style={{
            display:
              image
                ? "none"
                : "grid",
          }}
        >
          🍽️
        </div>

        <div className="qb-image-overlay" />

        <div className="qb-rating">
          ★{" "}
          {Number(
            restaurant?.rating ||
              0
          ).toFixed(1)}
        </div>

        <div className="qb-restaurant-title">

          <small>
            RESTAURANT #
            {restaurant?.id ||
              "—"}
          </small>

          <h3>
            {restaurant?.name ||
              "Unnamed Restaurant"}
          </h3>

        </div>

      </div>

      <div className="qb-restaurant-body">

        <div className="qb-location">
          <span>
            ⌖
          </span>

          {restaurant?.location ||
            "Location unavailable"}
        </div>

        <div className="qb-restaurant-buttons">

          <button
            className="restaurant-view"
            onClick={onView}
          >
            View
          </button>

          <button
            className="restaurant-edit"
            onClick={onEdit}
          >
            Edit
          </button>

          <button
            className="restaurant-delete"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting
              ? "..."
              : "Delete"}
          </button>

        </div>

      </div>

    </div>
  );
}

function StatusBadge({
  children,
  tone = "gray",
}) {
  return (
    <span
      className={`qb-status ${tone}`}
    >
      <i />
      {children}
    </span>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}) {
  return (
    <div className="qb-search">

      <span>
        ⌕
      </span>

      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />

      {value && (
        <button
          onClick={() =>
            onChange({
              target: {
                value: "",
              },
            })
          }
        >
          ×
        </button>
      )}

    </div>
  );
}

function WorkspaceHeader({
  eyebrow,
  title,
  subtitle,
  action,
}) {
  return (
    <div className="qb-workspace-header">

      <div>

        <span className="qb-eyebrow">
          {eyebrow}
        </span>

        <h2>
          {title}
        </h2>

        <p>
          {subtitle}
        </p>

      </div>

      {action}

    </div>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
}) {
  return (
    <div
      className="qb-modal-backdrop"
      onClick={onClose}
    >

      <div
        className="qb-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="qb-modal-head">

          <div>

            <span>
              QUICKBITE ADMIN
            </span>

            <h2>
              {title}
            </h2>

            <p>
              {subtitle}
            </p>

          </div>

          <button
            onClick={onClose}
          >
            ×
          </button>

        </div>

        <div className="qb-modal-content">
          {children}
        </div>

      </div>

    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  step,
}) {
  return (
    <label className="qb-form-field">

      <span>
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
      />

    </label>
  );
}

function ImagePreview({
  src,
}) {
  return (
    <div className="qb-image-preview">

      <img
        src={src}
        alt="Preview"
        onError={(e) => {
          e.currentTarget.style.display =
            "none";
        }}
      />

    </div>
  );
}

function RestaurantHero({
  restaurant,
}) {
  const image =
    getRestaurantImage(
      restaurant
    );

  if (!image) {
    return (
      <div className="qb-restaurant-modal-fallback">
        🍽️
      </div>
    );
  }

  return (
    <div className="qb-restaurant-modal-image">

      <img
        src={image}
        alt={
          restaurant?.name ||
          "Restaurant"
        }
      />

    </div>
  );
}

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="qb-detail">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function Empty({
  text,
}) {
  return (
    <div className="qb-empty">

      <div>
        ◌
      </div>

      <span>
        {text}
      </span>

    </div>
  );
}

/* =========================================================
   DARK PREMIUM STYLES
========================================================= */

const styles = `
* {
  box-sizing: border-box;
}

html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;

  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  background: #08090b;

  color: #f4f4f5;
}

button,
input,
select {
  font: inherit;
}

button {
  transition:
    transform .18s ease,
    background .18s ease,
    border-color .18s ease,
    box-shadow .18s ease,
    color .18s ease;
}

button:hover:not(:disabled) {
  transform:
    translateY(-1px);
}

button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

/* =========================================================
   APP
========================================================= */

.qb-app {
  position: relative;

  min-height: 100vh;

  overflow-x: hidden;

  background:
    radial-gradient(
      circle at 85% 0%,
      rgba(249,115,22,.11),
      transparent 25%
    ),

    radial-gradient(
      circle at 10% 90%,
      rgba(239,68,68,.07),
      transparent 25%
    ),

    linear-gradient(
      145deg,
      #08090b 0%,
      #0b0d10 50%,
      #111214 100%
    );
}

.qb-bg {
  position: fixed;

  pointer-events: none;

  border-radius: 50%;

  filter:
    blur(100px);

  opacity: .18;
}

.qb-bg-1 {
  width: 420px;
  height: 420px;

  top: -170px;
  right: -100px;

  background: #f97316;
}

.qb-bg-2 {
  width: 320px;
  height: 320px;

  bottom: -140px;
  left: 230px;

  background: #ef4444;
}

/* =========================================================
   LOADING
========================================================= */

.qb-loading-screen {
  min-height: 100vh;

  display: grid;
  place-items: center;

  align-content: center;

  background:
    radial-gradient(
      circle at 50% 30%,
      rgba(249,115,22,.12),
      transparent 25%
    ),

    #08090b;

  color: #f8fafc;
}

.qb-loading-logo {
  width: 72px;
  height: 72px;

  display: grid;
  place-items: center;

  border-radius: 22px;

  color: white;

  background:
    linear-gradient(
      135deg,
      #fb923c,
      #ef4444
    );

  box-shadow:
    0 25px 55px
      rgba(239,68,68,.25);

  font-size: 27px;
  font-weight: 950;
}

.qb-loading-screen h2 {
  margin:
    18px 0 0;

  color: #fff;

  font-size: 22px;
}

.qb-loading-screen p {
  margin:
    7px 0 0;

  color: #71717a;

  font-size: 12px;
}

/* =========================================================
   SIDEBAR
========================================================= */

.qb-sidebar {
  position: fixed;

  inset:
    0 auto 0 0;

  z-index: 100;

  width: 254px;

  display: flex;

  flex-direction: column;

  padding:
    24px 17px;

  background:
    linear-gradient(
      180deg,
      #090a0d 0%,
      #0d0f13 100%
    );

  border-right:
    1px solid
    rgba(255,255,255,.065);

  box-shadow:
    15px 0 45px
      rgba(0,0,0,.22);
}

.qb-brand {
  display: flex;

  align-items: center;

  gap: 12px;

  padding:
    2px 8px 30px;
}

.qb-logo {
  width: 46px;
  height: 46px;

  display: grid;
  place-items: center;

  border-radius: 15px;

  color: #fff;

  background:
    linear-gradient(
      135deg,
      #fb923c,
      #ef4444
    );

  box-shadow:
    0 16px 34px
      rgba(249,115,22,.24);

  font-size: 20px;
  font-weight: 950;
}

.qb-brand-title {
  color: #fafafa;

  font-size: 20px;

  font-weight: 950;

  letter-spacing:
    -.5px;
}

.qb-brand-title span {
  color: #fb923c;
}

.qb-brand-caption {
  margin-top: 4px;

  color: #52525b;

  font-size: 9px;

  letter-spacing:
    1.5px;

  font-weight: 850;
}

.qb-close-sidebar {
  display: none;
}

.qb-side-heading {
  margin:
    0 10px 12px;

  color: #52525b;

  font-size: 10px;

  font-weight: 900;

  letter-spacing:
    1.5px;
}

.qb-nav {
  display: grid;
  gap: 6px;
}

.qb-nav-btn {
  position: relative;

  min-height: 51px;

  width: 100%;

  padding:
    0 12px;

  display: flex;

  align-items: center;

  gap: 13px;

  border:
    1px solid transparent;

  border-radius: 14px;

  color: #8f929a;

  background:
    transparent;

  font-size: 13px;

  font-weight: 700;

  text-align: left;

  cursor: pointer;
}

.qb-nav-btn:hover {
  color: #f4f4f5;

  background:
    rgba(255,255,255,.035);
}

.qb-nav-btn.active {
  color: #fff7ed;

  border-color:
    rgba(251,146,60,.12);

  background:
    linear-gradient(
      90deg,
      rgba(249,115,22,.15),
      rgba(239,68,68,.055)
    );

  box-shadow:
    inset 0 1px 0
      rgba(255,255,255,.025);
}

.qb-nav-btn.active::before {
  content: "";

  position: absolute;

  left: -1px;

  top: 10px;

  bottom: 10px;

  width: 3px;

  border-radius: 4px;

  background:
    linear-gradient(
      #fb923c,
      #ef4444
    );
}

.qb-nav-btn-icon {
  width: 35px;
  height: 35px;

  display: grid;
  place-items: center;

  border-radius: 10px;

  color: #60636b;

  background:
    rgba(255,255,255,.03);

  font-size: 15px;
}

.qb-nav-btn.active
.qb-nav-btn-icon {
  color: #fb923c;

  background:
    rgba(249,115,22,.10);
}

.qb-sidebar-bottom {
  margin-top: auto;

  display: grid;

  gap: 12px;
}

.qb-online-card {
  display: flex;

  align-items: flex-start;

  gap: 10px;

  padding: 13px;

  border:
    1px solid
    rgba(255,255,255,.055);

  border-radius: 14px;

  background:
    rgba(255,255,255,.025);
}

.qb-online-dot {
  width: 8px;
  height: 8px;

  margin-top: 5px;

  flex: 0 0 8px;

  border-radius: 50%;

  background: #4ade80;

  box-shadow:
    0 0 0 5px
      rgba(74,222,128,.07);
}

.qb-online-card strong {
  display: block;

  color: #e4e4e7;

  font-size: 11px;
}

.qb-online-card span {
  display: block;

  margin-top: 3px;

  color: #52525b;

  font-size: 9px;
}

.qb-sidebar-logout {
  height: 43px;

  border:
    1px solid
    rgba(244,63,94,.13);

  border-radius: 12px;

  color: #fda4af;

  background:
    rgba(244,63,94,.05);

  cursor: pointer;

  font-size: 12px;

  font-weight: 800;
}

.qb-sidebar-logout:hover {
  background:
    rgba(244,63,94,.10);

  border-color:
    rgba(244,63,94,.25);
}

/* =========================================================
   MAIN HEADER
========================================================= */

.qb-main {
  margin-left: 254px;

  min-height: 100vh;

  position: relative;

  z-index: 2;
}

.qb-header {
  position: sticky;

  top: 0;

  z-index: 50;

  min-height: 84px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding:
    16px 34px;

  border-bottom:
    1px solid
    rgba(255,255,255,.065);

  background:
    rgba(8,9,11,.84);

  backdrop-filter:
    blur(22px);
}

.qb-header-left {
  display: flex;

  align-items: center;

  gap: 14px;
}

.qb-mobile-trigger {
  display: none;

  width: 42px;
  height: 42px;

  border:
    1px solid #27272a;

  border-radius: 11px;

  color: #d4d4d8;

  background:
    rgba(255,255,255,.035);

  cursor: pointer;

  font-size: 17px;
}

.qb-breadcrumb {
  color: #52525b;

  font-size: 11px;

  font-weight: 650;
}

.qb-breadcrumb span {
  margin:
    0 6px;

  color: #3f3f46;
}

.qb-header h1 {
  margin:
    5px 0 0;

  color: #f4f4f5;

  font-size: 25px;

  letter-spacing:
    -.6px;
}

.qb-header-right {
  display: flex;

  align-items: center;

  gap: 10px;
}

.qb-refresh-btn {
  width: 43px;
  height: 43px;

  border:
    1px solid #27272a;

  border-radius: 12px;

  color: #a1a1aa;

  background:
    rgba(255,255,255,.03);

  cursor: pointer;

  font-size: 18px;
}

.qb-refresh-btn:hover {
  color: #fb923c;

  border-color:
    rgba(251,146,60,.22);

  background:
    rgba(249,115,22,.05);
}

.qb-profile {
  display: flex;

  align-items: center;

  gap: 10px;

  padding:
    5px 10px 5px 5px;

  border:
    1px solid #27272a;

  border-radius: 14px;

  background:
    rgba(255,255,255,.035);
}

.qb-avatar {
  width: 35px;
  height: 35px;

  display: grid;
  place-items: center;

  border-radius: 10px;

  color: white;

  background:
    linear-gradient(
      135deg,
      #fb923c,
      #ef4444
    );

  font-size: 12px;
  font-weight: 950;
}

.qb-profile-info strong {
  color: #e4e4e7;

  font-size: 11px;
}

.qb-profile-info span {
  display: block;

  margin-top: 2px;

  color: #52525b;

  font-size: 9px;
}

.qb-green-dot {
  width: 7px;
  height: 7px;

  border-radius: 50%;

  background: #4ade80;

  box-shadow:
    0 0 10px
      rgba(74,222,128,.55);
}

/* =========================================================
   PAGE
========================================================= */

.qb-page {
  padding: 34px;
}

.qb-error {
  display: flex;

  align-items: flex-start;

  gap: 12px;

  margin-bottom: 22px;

  padding: 15px;

  border:
    1px solid
    rgba(244,63,94,.18);

  border-radius: 15px;

  background:
    rgba(244,63,94,.05);
}

.qb-error-mark {
  width: 30px;
  height: 30px;

  display: grid;
  place-items: center;

  border-radius: 9px;

  color: #fda4af;

  background:
    rgba(244,63,94,.09);

  font-weight: 900;
}

.qb-error-content strong {
  display: block;

  color: #fda4af;

  font-size: 12px;
}

.qb-error-content span {
  display: block;

  margin-top: 4px;

  color: #fb7185;

  font-size: 11px;

  line-height: 1.5;
}

.qb-error > button {
  margin-left: auto;

  border: 0;

  color: #71717a;

  background: transparent;

  cursor: pointer;

  font-size: 19px;
}

/* =========================================================
   INTRO
========================================================= */

.qb-intro {
  display: flex;

  justify-content: space-between;

  align-items: flex-end;

  gap: 20px;

  margin-bottom: 26px;
}

.qb-eyebrow {
  display: inline-block;

  color: #fb923c;

  font-size: 10px;

  font-weight: 900;

  letter-spacing: 1.3px;
}

.qb-intro h2 {
  margin:
    8px 0 0;

  color: #fafafa;

  font-size: 34px;

  line-height: 1.05;

  letter-spacing:
    -.9px;
}

.qb-intro p {
  margin:
    10px 0 0;

  color: #71717a;

  font-size: 14px;

  line-height: 1.6;
}

.qb-live {
  display: inline-flex;

  align-items: center;

  gap: 8px;

  padding:
    9px 13px;

  border:
    1px solid
    rgba(74,222,128,.18);

  border-radius: 999px;

  color: #86efac;

  background:
    rgba(34,197,94,.055);

  font-size: 10px;

  font-weight: 900;

  letter-spacing: .8px;
}

.qb-live span {
  width: 7px;
  height: 7px;

  border-radius: 50%;

  background: #4ade80;

  box-shadow:
    0 0 10px
      rgba(74,222,128,.65);
}

/* =========================================================
   STATS
========================================================= */

.qb-stats {
  display: grid;

  grid-template-columns:
    repeat(4,minmax(0,1fr));

  gap: 15px;

  margin-bottom: 18px;
}

.qb-stat-card {
  position: relative;

  overflow: hidden;

  min-height: 160px;

  padding: 21px;

  border:
    1px solid
    rgba(255,255,255,.07);

  border-radius: 19px;

  color: #f4f4f5;

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.065),
      rgba(255,255,255,.028)
    );

  box-shadow:
    0 24px 55px
      rgba(0,0,0,.18),

    inset 0 1px 0
      rgba(255,255,255,.025);

  text-align: left;
}

.qb-stat-card:not(:disabled) {
  cursor: pointer;
}

.qb-stat-card:hover:not(:disabled) {
  border-color:
    rgba(251,146,60,.18);

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.08),
      rgba(249,115,22,.035)
    );

  box-shadow:
    0 26px 65px
      rgba(0,0,0,.25);
}

.qb-stat-card::before {
  content: "";

  position: absolute;

  width: 160px;
  height: 160px;

  right: -75px;
  top: -75px;

  border-radius: 50%;

  opacity: .10;
}

.qb-stat-card.blue::before {
  background: #fb923c;
}

.qb-stat-card.purple::before {
  background: #ef4444;
}

.qb-stat-card.green::before {
  background: #22c55e;
}

.qb-stat-card.orange::before {
  background: #f97316;
}

.qb-stat-icon {
  width: 45px;
  height: 45px;

  display: grid;
  place-items: center;

  border-radius: 13px;

  color: #fff;

  font-size: 18px;

  font-weight: 900;

  box-shadow:
    0 12px 25px
      rgba(0,0,0,.18);
}

.qb-stat-card.blue .qb-stat-icon {
  background:
    linear-gradient(
      135deg,
      #fb923c,
      #f97316
    );
}

.qb-stat-card.purple .qb-stat-icon {
  background:
    linear-gradient(
      135deg,
      #fb7185,
      #ef4444
    );
}

.qb-stat-card.green .qb-stat-icon {
  background:
    linear-gradient(
      135deg,
      #22c55e,
      #16a34a
    );
}

.qb-stat-card.orange .qb-stat-icon {
  background:
    linear-gradient(
      135deg,
      #f59e0b,
      #f97316
    );
}

.qb-stat-label {
  display: block;

  margin-top: 16px;

  color: #71717a;

  font-size: 10px;

  font-weight: 850;

  letter-spacing: .75px;

  text-transform: uppercase;
}

.qb-stat-card > strong {
  display: block;

  margin-top: 7px;

  color: #fafafa;

  font-size: 29px;

  font-weight: 950;

  letter-spacing: -.8px;
}

.qb-stat-card > small {
  display: flex;

  align-items: center;

  gap: 6px;

  margin-top: 8px;

  color: #52525b;

  font-size: 10px;
}

.qb-stat-card > small span {
  color: #4ade80;
}

/* =========================================================
   CARDS
========================================================= */

.qb-dashboard-grid {
  display: grid;

  grid-template-columns:
    minmax(0,1.45fr)
    minmax(320px,.75fr);

  gap: 18px;

  margin-bottom: 18px;
}

.qb-dashboard-grid.bottom {
  grid-template-columns:
    minmax(0,1.35fr)
    minmax(330px,.8fr);
}

.qb-card {
  border:
    1px solid
    rgba(255,255,255,.07);

  border-radius: 20px;

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.055),
      rgba(255,255,255,.025)
    );

  box-shadow:
    0 28px 70px
      rgba(0,0,0,.19),

    inset 0 1px 0
      rgba(255,255,255,.025);

  backdrop-filter:
    blur(20px);
}

.qb-card-header {
  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  gap: 15px;

  padding:
    22px 22px 0;
}

.qb-card-label {
  color: #52525b;

  font-size: 9px;

  font-weight: 900;

  letter-spacing:
    1.1px;
}

.qb-card-header h3 {
  margin:
    7px 0 0;

  color: #f4f4f5;

  font-size: 20px;
}

.qb-card-header p {
  margin:
    5px 0 0;

  color: #62636b;

  font-size: 11px;
}

.qb-card-badge {
  padding:
    8px 11px;

  border:
    1px solid
    rgba(251,146,60,.18);

  border-radius: 10px;

  color: #fdba74;

  background:
    rgba(249,115,22,.07);

  font-size: 9px;

  font-weight: 900;
}

/* =========================================================
   PERFORMANCE
========================================================= */

.qb-performance {
  padding:
    24px 22px 20px;
}

.qb-performance-item +
.qb-performance-item {
  margin-top: 22px;
}

.qb-performance-item >
div:first-child {
  display: flex;

  justify-content: space-between;

  margin-bottom: 9px;
}

.qb-performance-item span {
  color: #8f929a;

  font-size: 12px;
}

.qb-performance-item strong {
  color: #e4e4e7;

  font-size: 12px;
}

.qb-progress {
  height: 9px;

  overflow: hidden;

  border-radius: 999px;

  background:
    rgba(255,255,255,.055);
}

.qb-progress-fill {
  height: 100%;

  border-radius: inherit;

  box-shadow:
    0 0 12px
      rgba(255,255,255,.10);
}

.qb-progress-fill.blue {
  background:
    linear-gradient(
      90deg,
      #fb923c,
      #f97316
    );
}

.qb-progress-fill.green {
  background:
    linear-gradient(
      90deg,
      #22c55e,
      #4ade80
    );
}

.qb-progress-fill.red {
  background:
    linear-gradient(
      90deg,
      #ef4444,
      #fb7185
    );
}

.qb-bottom-stats {
  display: grid;

  grid-template-columns:
    repeat(2,1fr);

  gap: 1px;

  margin:
    0 22px 22px;

  overflow: hidden;

  border:
    1px solid
    rgba(255,255,255,.06);

  border-radius: 13px;

  background:
    rgba(255,255,255,.04);
}

.qb-bottom-stats div {
  padding: 14px;

  background:
    rgba(255,255,255,.025);
}

.qb-bottom-stats span {
  display: block;

  color: #52525b;

  font-size: 10px;
}

.qb-bottom-stats strong {
  display: block;

  margin-top: 5px;

  color: #e4e4e7;

  font-size: 15px;
}

/* =========================================================
   ACTIONS
========================================================= */

.qb-actions {
  display: grid;

  gap: 10px;

  padding:
    20px 22px 22px;
}

.qb-action {
  min-height: 65px;

  display: flex;

  align-items: center;

  gap: 13px;

  padding: 10px;

  border:
    1px solid
    rgba(255,255,255,.06);

  border-radius: 13px;

  color: #d4d4d8;

  background:
    rgba(255,255,255,.025);

  cursor: pointer;

  font-size: 13px;

  font-weight: 750;

  text-align: left;
}

.qb-action:hover {
  background:
    rgba(249,115,22,.045);

  border-color:
    rgba(251,146,60,.16);

  color: #fff7ed;
}

.qb-action-icon {
  width: 40px;
  height: 40px;

  display: grid;
  place-items: center;

  border-radius: 11px;

  color: #fb923c;

  background:
    rgba(249,115,22,.09);

  font-size: 16px;
}

.qb-action strong {
  margin-left: auto;

  color: #52525b;

  font-size: 18px;
}

/* =========================================================
   RECENT ORDERS
========================================================= */

.qb-link-button {
  padding: 0;

  border: 0;

  color: #fb923c;

  background:
    transparent;

  cursor: pointer;

  font-size: 11px;

  font-weight: 850;
}

.qb-link-button:hover {
  color: #fdba74;
}

.qb-recent-list {
  padding:
    10px 22px 17px;
}

.qb-recent-row {
  min-height: 68px;

  display: grid;

  grid-template-columns:
    62px minmax(0,1fr)
    auto auto;

  align-items: center;

  gap: 13px;

  border-bottom:
    1px solid
    rgba(255,255,255,.05);
}

.qb-recent-row:last-child {
  border-bottom: 0;
}

.qb-order-number {
  color: #fb923c;

  font-size: 13px;

  font-weight: 900;
}

.qb-recent-info {
  min-width: 0;
}

.qb-recent-info strong {
  display: block;

  color: #e4e4e7;

  font-size: 12px;
}

.qb-recent-info span {
  display: block;

  margin-top: 4px;

  color: #52525b;

  font-size: 10px;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;
}

.qb-recent-amount {
  color: #e4e4e7;

  font-size: 12px;

  font-weight: 850;
}

/* =========================================================
   MINI RESTAURANTS
========================================================= */

.qb-mini-restaurants {
  display: grid;

  gap: 9px;

  padding:
    16px 22px 20px;
}

.qb-mini-restaurant {
  min-height: 72px;

  width: 100%;

  display: flex;

  align-items: center;

  gap: 12px;

  padding: 0;

  border:
    1px solid
    rgba(255,255,255,.06);

  border-radius: 13px;

  overflow: hidden;

  background:
    rgba(255,255,255,.025);

  cursor: pointer;

  text-align: left;
}

.qb-mini-restaurant:hover {
  border-color:
    rgba(251,146,60,.16);

  background:
    rgba(249,115,22,.035);
}

.qb-mini-image {
  position: relative;

  width: 74px;
  height: 72px;

  flex: 0 0 74px;

  display: grid;
  place-items: center;

  overflow: hidden;

  background:
    linear-gradient(
      135deg,
      #27272a,
      #18181b
    );

  font-size: 25px;
}

.qb-mini-image img {
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.qb-mini-rating {
  position: absolute;

  top: 6px;
  right: 6px;

  padding:
    4px 6px;

  border-radius: 6px;

  color: #fed7aa;

  background:
    rgba(15,15,15,.80);

  font-size: 8px;

  font-weight: 900;
}

.qb-mini-copy {
  min-width: 0;

  display: grid;

  gap: 6px;

  padding-right: 10px;
}

.qb-mini-copy strong {
  color: #e4e4e7;

  font-size: 12px;

  white-space: nowrap;

  text-overflow: ellipsis;

  overflow: hidden;
}

.qb-mini-copy span {
  color: #52525b;

  font-size: 10px;

  white-space: nowrap;

  text-overflow: ellipsis;

  overflow: hidden;
}

/* =========================================================
   WORKSPACE HEADER
========================================================= */

.qb-workspace-header {
  display: flex;

  align-items: flex-end;

  justify-content: space-between;

  gap: 20px;

  margin-bottom: 22px;
}

.qb-workspace-header h2 {
  margin:
    7px 0 0;

  color: #f4f4f5;

  font-size: 31px;

  letter-spacing:
    -.7px;
}

.qb-workspace-header p {
  margin:
    8px 0 0;

  color: #71717a;

  font-size: 13px;
}

.qb-main-button {
  min-height: 44px;

  padding:
    0 16px;

  border:
    1px solid
    rgba(251,146,60,.16);

  border-radius: 12px;

  color: #fff7ed;

  background:
    linear-gradient(
      135deg,
      rgba(249,115,22,.90),
      rgba(239,68,68,.90)
    );

  box-shadow:
    0 12px 25px
      rgba(239,68,68,.14);

  cursor: pointer;

  font-size: 11px;

  font-weight: 900;
}

/* =========================================================
   FILTERS
========================================================= */

.qb-filter-card {
  padding: 15px;

  margin-bottom: 17px;
}

.qb-filter-grid {
  display: grid;

  grid-template-columns:
    minmax(0,2fr)
    200px
    200px;

  gap: 11px;
}

.qb-filter-grid.users {
  grid-template-columns:
    minmax(0,2fr)
    220px;
}

.qb-search {
  position: relative;
}

.qb-search > span {
  position: absolute;

  left: 14px;

  top: 50%;

  transform:
    translateY(-50%);

  color: #52525b;

  font-size: 17px;
}

.qb-search input {
  width: 100%;

  height: 46px;

  padding:
    0 38px;

  border:
    1px solid #27272a;

  border-radius: 12px;

  outline: none;

  color: #e4e4e7;

  background:
    rgba(255,255,255,.025);

  font-size: 12px;
}

.qb-search input:focus {
  border-color:
    rgba(251,146,60,.30);

  box-shadow:
    0 0 0 3px
      rgba(251,146,60,.07);
}

.qb-search input::placeholder {
  color: #52525b;
}

.qb-search button {
  position: absolute;

  right: 10px;

  top: 50%;

  transform:
    translateY(-50%);

  border: 0;

  color: #71717a;

  background: transparent;

  cursor: pointer;

  font-size: 17px;
}

.qb-select {
  width: 100%;

  height: 46px;

  padding:
    0 12px;

  border:
    1px solid #27272a;

  border-radius: 12px;

  outline: none;

  color: #d4d4d8;

  background:
    rgba(255,255,255,.025);

  font-size: 11px;
}

.qb-select option,
.qb-mini-select option {
  color: #18181b;

  background: #fff;
}

/* =========================================================
   TABLE
========================================================= */

.qb-table-card {
  overflow: hidden;
}

.qb-table-scroll {
  width: 100%;

  overflow-x: auto;
}

.qb-table {
  width: 100%;

  min-width:
    1050px;

  border-collapse:
    collapse;
}

.qb-table th {
  padding:
    15px 18px;

  color: #52525b;

  background:
    rgba(255,255,255,.025);

  border-bottom:
    1px solid
    rgba(255,255,255,.06);

  text-align: left;

  font-size: 9px;

  letter-spacing:
    .9px;

  font-weight: 900;
}

.qb-table td {
  padding:
    16px 18px;

  border-bottom:
    1px solid
    rgba(255,255,255,.05);

  vertical-align:
    middle;
}

.qb-table tbody tr:hover {
  background:
    rgba(249,115,22,.025);
}

.table-big {
  display: block;

  color: #e4e4e7;

  font-size: 12px;
}

.table-normal {
  color: #a1a1aa;

  font-size: 12px;
}

.table-small {
  display: block;

  margin-top: 5px;

  color: #52525b;

  font-size: 9px;
}

.table-money {
  color: #86efac;

  font-size: 12px;
}

.table-actions {
  display: flex;

  align-items: center;

  flex-wrap: wrap;

  gap: 7px;
}

.outline-blue,
.outline-red {
  min-height: 34px;

  padding:
    0 11px;

  border-radius: 9px;

  cursor: pointer;

  font-size: 9px;

  font-weight: 800;
}

.outline-blue {
  border:
    1px solid
    rgba(251,146,60,.22);

  color: #fdba74;

  background:
    rgba(249,115,22,.045);
}

.outline-red {
  border:
    1px solid
    rgba(244,63,94,.20);

  color: #fda4af;

  background:
    rgba(244,63,94,.045);
}

.qb-mini-select {
  height: 34px;

  padding:
    0 9px;

  border:
    1px solid #27272a;

  border-radius: 9px;

  color: #a1a1aa;

  background:
    rgba(255,255,255,.025);

  font-size: 9px;
}

.qb-status {
  display: inline-flex;

  align-items: center;

  gap: 7px;

  min-height: 29px;

  padding:
    0 10px;

  border-radius: 999px;

  font-size: 9px;

  font-weight: 850;

  white-space: nowrap;
}

.qb-status i {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background:
    currentColor;
}

.qb-status.blue {
  color: #93c5fd;

  background:
    rgba(59,130,246,.09);
}

.qb-status.green {
  color: #86efac;

  background:
    rgba(34,197,94,.08);
}

.qb-status.red {
  color: #fda4af;

  background:
    rgba(244,63,94,.08);
}

.qb-status.orange {
  color: #fdba74;

  background:
    rgba(249,115,22,.08);
}

.qb-status.purple {
  color: #c4b5fd;

  background:
    rgba(124,58,237,.09);
}

.qb-empty-cell {
  height: 180px;

  text-align: center;

  color: #52525b;

  font-size: 12px;
}

/* USERS */

.table-user {
  display: flex;

  align-items: center;

  gap: 11px;
}

.table-user-avatar {
  width: 38px;
  height: 38px;

  display: grid;
  place-items: center;

  border-radius: 11px;

  color: #fdba74;

  background:
    rgba(249,115,22,.09);

  border:
    1px solid
    rgba(249,115,22,.12);

  font-size: 13px;

  font-weight: 900;
}

.verification-list {
  display: flex;

  flex-wrap: wrap;

  gap: 5px;
}

/* =========================================================
   RESTAURANTS
========================================================= */

.qb-restaurant-grid {
  display: grid;

  grid-template-columns:
    repeat(3,minmax(0,1fr));

  gap: 18px;
}

.qb-restaurant-card {
  overflow: hidden;

  border:
    1px solid
    rgba(255,255,255,.07);

  border-radius: 20px;

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.055),
      rgba(255,255,255,.025)
    );

  box-shadow:
    0 22px 55px
      rgba(0,0,0,.20);
}

.qb-restaurant-image {
  position: relative;

  height: 235px;

  overflow: hidden;

  display: grid;

  place-items: center;

  background:
    linear-gradient(
      135deg,
      #27272a,
      #18181b,
      #111214
    );

  font-size: 60px;
}

.qb-restaurant-image img,
.restaurant-fallback {
  position: absolute;

  inset: 0;

  width: 100%;

  height: 100%;
}

.qb-restaurant-image img {
  display: block;

  object-fit: cover;
}

.restaurant-fallback {
  display: grid;

  place-items: center;
}

.qb-image-overlay {
  position: absolute;

  inset: 0;

  background:
    linear-gradient(
      to bottom,
      rgba(0,0,0,.02),
      rgba(0,0,0,.08) 44%,
      rgba(0,0,0,.88)
    );
}

.qb-rating {
  position: absolute;

  top: 14px;
  right: 14px;

  padding:
    7px 10px;

  border-radius: 9px;

  color: #fed7aa;

  background:
    rgba(15,15,15,.82);

  border:
    1px solid
    rgba(255,255,255,.08);

  font-size: 9px;

  font-weight: 900;
}

.qb-restaurant-title {
  position: absolute;

  left: 18px;
  right: 18px;

  bottom: 16px;
}

.qb-restaurant-title small {
  color:
    rgba(255,255,255,.48);

  font-size: 8px;

  font-weight: 800;

  letter-spacing:
    1px;
}

.qb-restaurant-title h3 {
  margin:
    5px 0 0;

  color: #fafafa;

  font-size: 21px;

  line-height: 1.1;

  letter-spacing:
    -.4px;
}

.qb-restaurant-body {
  padding: 17px;
}

.qb-location {
  display: flex;

  align-items: center;

  gap: 7px;

  color: #71717a;

  font-size: 11px;
}

.qb-location span {
  color: #fb923c;

  font-size: 15px;
}

.qb-restaurant-buttons {
  display: grid;

  grid-template-columns:
    repeat(3,1fr);

  gap: 7px;

  margin-top: 15px;
}

.restaurant-view,
.restaurant-edit,
.restaurant-delete {
  min-height: 36px;

  border-radius: 9px;

  font-size: 9px;

  font-weight: 850;

  cursor: pointer;
}

.restaurant-view {
  color: #fdba74;

  border:
    1px solid
    rgba(249,115,22,.20);

  background:
    rgba(249,115,22,.045);
}

.restaurant-edit {
  color: #c4b5fd;

  border:
    1px solid
    rgba(124,58,237,.20);

  background:
    rgba(124,58,237,.045);
}

.restaurant-delete {
  color: #fda4af;

  border:
    1px solid
    rgba(244,63,94,.20);

  background:
    rgba(244,63,94,.045);
}

/* =========================================================
   MENU
========================================================= */

.qb-menu-grid {
  display: grid;

  grid-template-columns:
    repeat(3,minmax(0,1fr));

  gap: 16px;
}

.qb-menu-card {
  display: flex;

  gap: 13px;

  padding: 18px;

  border:
    1px solid
    rgba(255,255,255,.07);

  border-radius: 18px;

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.05),
      rgba(255,255,255,.02)
    );
}

.qb-menu-symbol {
  width: 44px;
  height: 44px;

  flex: 0 0 44px;

  display: grid;

  place-items: center;

  border-radius: 12px;

  color: #fb923c;

  background:
    rgba(249,115,22,.08);

  border:
    1px solid
    rgba(249,115,22,.12);

  font-size: 17px;
}

.qb-menu-info {
  min-width: 0;

  width: 100%;
}

.qb-menu-header-row {
  display: flex;

  justify-content: space-between;

  gap: 12px;
}

.qb-menu-header-row h3 {
  margin: 0;

  color: #e4e4e7;

  font-size: 14px;
}

.qb-menu-header-row span {
  display: block;

  margin-top: 5px;

  color: #52525b;

  font-size: 9px;
}

.qb-menu-header-row strong {
  color: #86efac;

  font-size: 13px;

  white-space: nowrap;
}

.qb-menu-info p {
  margin:
    10px 0 0;

  color: #71717a;

  font-size: 10px;

  line-height: 1.6;
}

/* =========================================================
   EMPTY
========================================================= */

.qb-empty {
  min-height: 150px;

  display: grid;

  place-items: center;

  align-content: center;

  gap: 8px;

  color: #52525b;

  text-align: center;
}

.qb-empty > div {
  font-size: 26px;

  color: #3f3f46;
}

.qb-empty > span {
  font-size: 11px;
}

.qb-empty-big {
  min-height: 300px;

  display: grid;

  place-items: center;

  color: #52525b;

  font-size: 13px;
}

/* =========================================================
   MODALS
========================================================= */

.qb-modal-backdrop {
  position: fixed;

  inset: 0;

  z-index: 200;

  display: grid;

  place-items: center;

  padding: 20px;

  background:
    rgba(0,0,0,.68);

  backdrop-filter:
    blur(9px);
}

.qb-modal {
  width: 100%;

  max-width: 590px;

  max-height:
    88vh;

  overflow-y: auto;

  border:
    1px solid
    rgba(255,255,255,.08);

  border-radius: 22px;

  background:
    linear-gradient(
      145deg,
      #161719,
      #0f1012
    );

  box-shadow:
    0 35px 100px
      rgba(0,0,0,.52);
}

.qb-modal-head {
  display: flex;

  justify-content: space-between;

  gap: 20px;

  padding:
    23px 23px 17px;

  border-bottom:
    1px solid
    rgba(255,255,255,.06);
}

.qb-modal-head span {
  color: #fb923c;

  font-size: 9px;

  font-weight: 900;

  letter-spacing: 1px;
}

.qb-modal-head h2 {
  margin:
    6px 0 0;

  color: #f4f4f5;

  font-size: 23px;
}

.qb-modal-head p {
  margin:
    6px 0 0;

  color: #71717a;

  font-size: 11px;
}

.qb-modal-head button {
  width: 36px;
  height: 36px;

  border:
    1px solid #27272a;

  border-radius: 10px;

  color: #a1a1aa;

  background:
    rgba(255,255,255,.035);

  cursor: pointer;

  font-size: 19px;
}

.qb-modal-content {
  padding:
    22px 23px 24px;
}

.qb-form-field {
  display: block;

  margin-bottom: 16px;
}

.qb-form-field > span {
  display: block;

  margin-bottom: 7px;

  color: #a1a1aa;

  font-size: 10px;

  font-weight: 800;
}

.qb-form-field input {
  width: 100%;

  height: 46px;

  padding:
    0 13px;

  border:
    1px solid #27272a;

  border-radius: 11px;

  outline: none;

  color: #e4e4e7;

  background:
    rgba(255,255,255,.025);

  font-size: 12px;
}

.qb-form-field input::placeholder {
  color: #52525b;
}

.qb-form-field input:focus {
  border-color:
    rgba(251,146,60,.30);

  box-shadow:
    0 0 0 3px
      rgba(251,146,60,.07);
}

.qb-image-preview {
  height: 175px;

  overflow: hidden;

  margin-bottom: 16px;

  border:
    1px solid #27272a;

  border-radius: 13px;

  background:
    #111214;
}

.qb-image-preview img {
  width: 100%;

  height: 100%;

  object-fit: cover;
}

.qb-modal-submit {
  width: 100%;

  height: 48px;

  margin-top: 6px;

  border: 0;

  border-radius: 11px;

  color: white;

  background:
    linear-gradient(
      135deg,
      #fb923c,
      #ef4444
    );

  cursor: pointer;

  font-size: 12px;

  font-weight: 900;

  box-shadow:
    0 14px 28px
      rgba(239,68,68,.16);
}

.qb-detail {
  min-height: 50px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;

  margin-bottom: 8px;

  padding:
    0 13px;

  border:
    1px solid #27272a;

  border-radius: 11px;

  background:
    rgba(255,255,255,.025);
}

.qb-detail span {
  color: #71717a;

  font-size: 10px;
}

.qb-detail strong {
  color: #e4e4e7;

  font-size: 11px;

  text-align: right;

  word-break:
    break-word;
}

.qb-restaurant-modal-image {
  height: 210px;

  overflow: hidden;

  margin-bottom: 15px;

  border-radius: 13px;

  border:
    1px solid #27272a;
}

.qb-restaurant-modal-image img {
  width: 100%;

  height: 100%;

  object-fit: cover;
}

.qb-restaurant-modal-fallback {
  height: 210px;

  display: grid;

  place-items: center;

  margin-bottom: 15px;

  border-radius: 13px;

  border:
    1px solid #27272a;

  background:
    linear-gradient(
      135deg,
      #27272a,
      #18181b
    );

  font-size: 60px;
}

.qb-user-modal {
  display: flex;

  align-items: center;

  gap: 12px;

  margin-bottom: 16px;

  padding-bottom: 16px;

  border-bottom:
    1px solid
    rgba(255,255,255,.06);
}

.qb-user-modal-avatar {
  width: 50px;
  height: 50px;

  display: grid;

  place-items: center;

  border-radius: 13px;

  color: white;

  background:
    linear-gradient(
      135deg,
      #fb923c,
      #ef4444
    );

  font-size: 17px;

  font-weight: 900;
}

.qb-user-modal h3 {
  margin:
    0 0 6px;

  color: #f4f4f5;

  font-size: 16px;
}

/* =========================================================
   TOAST
========================================================= */

.qb-toast {
  position: fixed;

  right: 22px;

  bottom: 22px;

  z-index: 500;

  display: flex;

  align-items: center;

  gap: 9px;

  padding:
    13px 15px;

  border:
    1px solid #27272a;

  border-radius: 12px;

  color: #e4e4e7;

  background:
    #151618;

  box-shadow:
    0 25px 55px
      rgba(0,0,0,.35);

  font-size: 11px;

  font-weight: 700;
}

.qb-toast > span {
  width: 24px;
  height: 24px;

  display: grid;

  place-items: center;

  border-radius: 8px;

  color: #86efac;

  background:
    rgba(34,197,94,.08);
}

/* =========================================================
   MOBILE
========================================================= */

.qb-overlay {
  display: none;
}

@media (max-width: 1200px) {

  .qb-stats {
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }

  .qb-dashboard-grid,
  .qb-dashboard-grid.bottom {
    grid-template-columns:
      1fr;
  }

  .qb-restaurant-grid,
  .qb-menu-grid {
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }
}

@media (max-width: 900px) {

  .qb-sidebar {
    transform:
      translateX(-101%);

    transition:
      transform .25s ease;
  }

  .qb-sidebar.open {
    transform:
      translateX(0);
  }

  .qb-close-sidebar {
    display: grid;

    place-items: center;

    margin-left: auto;

    width: 34px;
    height: 34px;

    border:
      1px solid
      rgba(255,255,255,.08);

    border-radius: 9px;

    color: #94a3b8;

    background:
      rgba(255,255,255,.03);

    font-size: 18px;

    cursor: pointer;
  }

  .qb-overlay {
    display: block;

    position: fixed;

    inset: 0;

    z-index: 90;

    background:
      rgba(0,0,0,.62);

    backdrop-filter:
      blur(4px);
  }

  .qb-main {
    margin-left: 0;
  }

  .qb-mobile-trigger {
    display: grid;

    place-items: center;
  }

  .qb-page {
    padding: 24px;
  }

  .qb-filter-grid,
  .qb-filter-grid.users {
    grid-template-columns:
      1fr;
  }

  .qb-restaurant-grid,
  .qb-menu-grid {
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }
}

@media (max-width: 680px) {

  .qb-header {
    padding:
      14px 16px;
  }

  .qb-page {
    padding:
      18px 14px 28px;
  }

  .qb-profile-info,
  .qb-green-dot {
    display: none;
  }

  .qb-intro {
    align-items:
      flex-start;

    flex-direction:
      column;
  }

  .qb-intro h2 {
    font-size: 28px;
  }

  .qb-intro p {
    font-size: 13px;
  }

  .qb-stats {
    grid-template-columns:
      1fr;
  }

  .qb-restaurant-grid,
  .qb-menu-grid {
    grid-template-columns:
      1fr;
  }

  .qb-recent-row {
    grid-template-columns:
      52px minmax(0,1fr) auto;
  }

  .qb-recent-row
  .qb-status {
    display: none;
  }

  .qb-recent-amount {
    font-size: 11px;
  }

  .qb-workspace-header {
    align-items:
      flex-start;

    flex-direction:
      column;
  }

  .qb-workspace-header h2 {
    font-size: 27px;
  }

  .qb-dashboard-grid {
    gap: 14px;
  }
}

@media (max-width: 480px) {

  .qb-header h1 {
    font-size: 20px;
  }

  .qb-breadcrumb {
    font-size: 9px;
  }

  .qb-refresh-btn {
    width: 38px;
    height: 38px;
  }

  .qb-intro h2 {
    font-size: 25px;
  }

  .qb-stat-card {
    min-height: 155px;
  }

  .qb-card-header {
    padding:
      18px 17px 0;
  }

  .qb-performance {
    padding:
      20px 17px;
  }

  .qb-bottom-stats {
    margin:
      0 17px 17px;
  }

  .qb-actions,
  .qb-mini-restaurants,
  .qb-recent-list {
    padding-left: 17px;
    padding-right: 17px;
  }

  .qb-modal-backdrop {
    padding: 10px;
  }

  .qb-modal-head {
    padding:
      18px 17px 14px;
  }

  .qb-modal-content {
    padding:
      18px 17px 20px;
  }
}
`;

export default AdminDashboard;