import React, { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80";

const FOOD_VIDEO =
  "https://cdn.coverr.co/videos/coverr-a-chef-preparing-food-1578/1080p.mp4";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=90";

const DELIVERY_FEE = 40;
const TAX_RATE = 0.05;

function PageBackground({ children }) {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gray-950 text-gray-900">
      {/* =========================================
          GLOBAL FOOD BACKGROUND
      ========================================== */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${HERO_FALLBACK})`,
        }}
      />

      {!videoFailed && (
        <video
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
          className="pointer-events-none fixed inset-0 z-[1] h-full w-full object-cover"
        >
          <source src={FOOD_VIDEO} type="video/mp4" />
        </video>
      )}

      {/* Home.js style dark overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.58) 48%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* Pink glow */}
      <div
        className="pointer-events-none fixed right-[-150px] top-[-100px] z-[3] h-[500px] w-[500px] rounded-full"
        style={{
          background: "rgba(255,77,109,0.20)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

function OrderSuccess() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem("quickbite-last-order");

      if (savedOrder) {
        setOrder(JSON.parse(savedOrder));
      }
    } catch (error) {
      console.error("Order loading error:", error);
    }
  }, []);

  const goTo = (path) => {
    window.location.href = path;
  };

  const formatPrice = (price) => {
    return `₹${Number(price || 0).toFixed(0)}`;
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "Just now";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Just now";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const orderItems = Array.isArray(order?.orderItems)
    ? order.orderItems
    : [];

  const totalItems = useMemo(() => {
    return orderItems.reduce(
      (sum, item) => sum + Number(item?.quantity || 0),
      0
    );
  }, [orderItems]);

  const subtotal = useMemo(() => {
    if (order?.subtotal !== undefined && order?.subtotal !== null) {
      return Number(order.subtotal || 0);
    }

    return orderItems.reduce((sum, item) => {
      const price = Number(
        item?.price || item?.menuItem?.price || 0
      );

      const quantity = Number(item?.quantity || 1);

      return sum + price * quantity;
    }, 0);
  }, [order, orderItems]);

  const deliveryFee = Number(
    order?.deliveryFee !== undefined
      ? order.deliveryFee
      : orderItems.length > 0
      ? DELIVERY_FEE
      : 0
  );

  const taxes = Number(
    order?.taxes !== undefined
      ? order.taxes
      : subtotal * TAX_RATE
  );

  const calculatedTotal = subtotal + deliveryFee + taxes;

  const total = Number(
    order?.totalPrice !== undefined
      ? order.totalPrice
      : calculatedTotal
  );

  const paymentMethod =
    order?.paymentMethod || "Cash on Delivery";

  const status = String(order?.status || "CONFIRMED")
    .trim()
    .toUpperCase()
    .replace(/ /g, "_");

  const statusConfig = {
    CONFIRMED: {
      label: "Confirmed",
      badge: "✓ Confirmed",
      description: "Your order has been confirmed.",
      badgeClass: "bg-green-100 text-green-700",
      estimate: "Preparing soon",
    },

    PREPARING: {
      label: "Preparing",
      badge: "👨‍🍳 Preparing",
      description: "The restaurant is preparing your food.",
      badgeClass: "bg-orange-100 text-orange-700",
      estimate: "Being prepared",
    },

    OUT_FOR_DELIVERY: {
      label: "Out for Delivery",
      badge: "🛵 Out for Delivery",
      description: "Your order is on the way.",
      badgeClass: "bg-blue-100 text-blue-700",
      estimate: "On the way",
    },

    DELIVERED: {
      label: "Delivered",
      badge: "✓ Delivered",
      description: "Your order has been delivered.",
      badgeClass: "bg-green-100 text-green-700",
      estimate: "Delivered",
    },

    CANCELLED: {
      label: "Cancelled",
      badge: "✕ Cancelled",
      description: "This order has been cancelled.",
      badgeClass: "bg-red-100 text-red-700",
      estimate: "Cancelled",
    },
  };

  const currentStatus =
    statusConfig[status] || statusConfig.CONFIRMED;

  const getItemImage = (item) => {
    return (
      item?.menuItem?.imageUrl ||
      item?.menuItem?.image ||
      item?.imageUrl ||
      item?.image ||
      FALLBACK_IMAGE
    );
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

  const getItemCategory = (item) => {
    return (
      item?.menuItem?.category ||
      item?.category ||
      ""
    );
  };

  const getRestaurantName = (item) => {
    return (
      item?.menuItem?.restaurant?.name ||
      item?.restaurantName ||
      "QuickBite Restaurant"
    );
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleTrackOrder = () => {
    if (order) {
      localStorage.setItem(
        "quickbite-tracking-order",
        JSON.stringify(order)
      );
    }

    goTo("/track-order");
  };

  const handleViewOrders = () => {
    goTo("/orders");
  };

  const steps = [
    {
      icon: "✓",
      title: "Confirmed",
      active: [
        "CONFIRMED",
        "PREPARING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(status),
    },

    {
      icon: "👨‍🍳",
      title: "Preparing",
      active: [
        "PREPARING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(status),
    },

    {
      icon: "🛵",
      title: "On the Way",
      active: [
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(status),
    },

    {
      icon: "🏠",
      title: "Delivered",
      active: status === "DELIVERED",
    },
  ];

  return (
    <PageBackground>
      <Navbar />

      {/* =========================================
          SUCCESS HERO
      ========================================== */}
      <section className="bg-gradient-to-br from-orange-500/90 via-orange-500/85 to-red-500/90 text-white backdrop-blur-md print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
          <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-4xl text-white font-black">
                ✓
              </span>
            </div>
          </div>

          <p className="text-orange-100 text-sm font-bold tracking-[0.3em] mb-3">
            QUICKBITE
          </p>

          <h1 className="text-3xl md:text-5xl font-black">
            {status === "CANCELLED"
              ? "Order Cancelled"
              : "Order Confirmed! 🎉"}
          </h1>

          <p className="text-orange-50 mt-3 text-base md:text-lg">
            {status === "CANCELLED"
              ? "This order is no longer active."
              : "Your delicious food is being prepared for you."}
          </p>

          {order?.id && (
            <div className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-full px-5 py-2.5 mt-6">
              <span className="text-orange-100 text-sm">
                Order ID
              </span>

              <span className="font-black">
                #{order.id}
              </span>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {!order ? (
          /* =========================================
             NO ORDER
          ========================================== */
          <section className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl p-10 md:p-14 text-center">
            <div className="text-6xl mb-5">
              📦
            </div>

            <h2 className="text-2xl md:text-3xl font-black mb-3">
              Order Details Not Found
            </h2>

            <p className="text-gray-600 mb-7">
              We couldn't find the latest order details on this device.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleViewOrders}
                className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-bold transition shadow-lg"
              >
                View My Orders
              </button>

              <button
                onClick={() => goTo("/restaurants")}
                className="border border-gray-300 bg-white/70 hover:bg-white px-7 py-3.5 rounded-xl font-bold transition"
              >
                Order More Food
              </button>
            </div>
          </section>
        ) : (
          <div className="space-y-6">

            {/* =====================================
                QUICK ACTIONS
            ====================================== */}
            <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">

              <button
                onClick={handleTrackOrder}
                className="bg-orange-500/90 hover:bg-orange-600 text-white rounded-2xl p-5 text-left shadow-xl backdrop-blur transition"
              >
                <div className="text-2xl mb-3">
                  🚚
                </div>

                <p className="font-black">
                  Track Order
                </p>

                <p className="text-sm text-orange-100 mt-1">
                  See live order status
                </p>
              </button>

              <button
                onClick={handleViewOrders}
                className="bg-white/85 hover:bg-white backdrop-blur-xl border border-white/40 rounded-2xl p-5 text-left shadow-xl transition"
              >
                <div className="text-2xl mb-3">
                  📋
                </div>

                <p className="font-black">
                  My Orders
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  View complete history
                </p>
              </button>

              <button
                onClick={handlePrintInvoice}
                className="bg-white/85 hover:bg-white backdrop-blur-xl border border-white/40 rounded-2xl p-5 text-left shadow-xl transition"
              >
                <div className="text-2xl mb-3">
                  🧾
                </div>

                <p className="font-black">
                  Print Invoice
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Save or print receipt
                </p>
              </button>

              <button
                onClick={() => goTo("/restaurants")}
                className="bg-white/85 hover:bg-white backdrop-blur-xl border border-white/40 rounded-2xl p-5 text-left shadow-xl transition"
              >
                <div className="text-2xl mb-3">
                  🍔
                </div>

                <p className="font-black">
                  Order More
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Discover more food
                </p>
              </button>
            </section>

            {/* =====================================
                ORDER META
            ====================================== */}
            <section className="grid sm:grid-cols-3 gap-4 print:hidden">

              <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl p-5">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                  Order Date
                </p>

                <p className="font-black mt-2">
                  {formatDateTime(
                    order.createdAt ||
                      order.orderDate ||
                      order.createdOn ||
                      order.date
                  )}
                </p>
              </div>

              <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl p-5">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                  Items
                </p>

                <p className="font-black text-lg mt-2">
                  {totalItems}{" "}
                  {totalItems === 1 ? "item" : "items"}
                </p>
              </div>

              <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl p-5">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                  Payment
                </p>

                <p className="font-black mt-2">
                  {paymentMethod}
                </p>
              </div>
            </section>

            {/* =====================================
                ORDER STATUS
            ====================================== */}
            <section className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl p-6 md:p-7 print:hidden">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
                <div>
                  <p className="text-xs uppercase tracking-wider text-orange-500 font-bold">
                    Order Status
                  </p>

                  <h2 className="text-2xl font-black mt-1">
                    {currentStatus.label}
                  </h2>

                  <p className="text-sm text-gray-600 mt-1">
                    {currentStatus.description}
                  </p>
                </div>

                <div
                  className={`px-4 py-2 rounded-full text-sm font-black w-fit ${currentStatus.badgeClass}`}
                >
                  {currentStatus.badge}
                </div>
              </div>

              {status === "CANCELLED" ? (
                <div className="rounded-2xl bg-red-50/90 border border-red-100 p-5 text-red-700">
                  <p className="font-black">
                    This order was cancelled.
                  </p>

                  <p className="text-sm mt-1">
                    Please check My Orders for other orders.
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1 bg-gray-200 rounded-full" />

                    <div className="grid grid-cols-4 gap-2 relative">
                      {steps.map((step) => (
                        <div
                          key={step.title}
                          className="text-center"
                        >
                          <div
                            className={`mx-auto w-11 h-11 rounded-full flex items-center justify-center text-lg relative z-10 ${
                              step.active
                                ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                                : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {step.icon}
                          </div>

                          <p
                            className={`text-[11px] sm:text-xs mt-2 font-bold ${
                              step.active
                                ? "text-orange-500"
                                : "text-gray-400"
                            }`}
                          >
                            {step.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-7 bg-orange-50/90 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      ⏱️
                    </div>

                    <div>
                      <p className="text-xs text-orange-600 font-bold uppercase tracking-wide">
                        Delivery Update
                      </p>

                      <p className="font-black text-gray-900 mt-0.5">
                        {currentStatus.estimate}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* =====================================
                INVOICE / RECEIPT
            ====================================== */}
            <section
              id="quickbite-invoice"
              className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden"
            >

              {/* Invoice Header */}
              <div className="bg-gray-950/95 text-white p-6 md:p-8">

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                  <div>
                    <div className="text-3xl font-black">
                      <span className="text-orange-500">
                        Quick
                      </span>

                      <span className="text-white">
                        Bite
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm mt-2">
                      Food Delivery & Restaurant Service
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-xs uppercase tracking-widest text-gray-400">
                      Order Receipt
                    </p>

                    <p className="text-xl font-black mt-1">
                      #{order.id || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-800">

                  <div>
                    <p className="text-xs text-gray-500">
                      Order ID
                    </p>

                    <p className="font-bold mt-1">
                      #{order.id || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Status
                    </p>

                    <p className="font-bold mt-1">
                      {currentStatus.label}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Items
                    </p>

                    <p className="font-bold mt-1">
                      {totalItems}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Payment
                    </p>

                    <p className="font-bold mt-1">
                      {paymentMethod}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="p-6 md:p-8 border-b border-gray-200">

                <div className="grid md:grid-cols-2 gap-6">

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                      Billed To
                    </p>

                    <p className="font-black text-lg mt-2">
                      {order.customerName || "Customer"}
                    </p>

                    <p className="text-sm text-gray-500 mt-1 break-all">
                      {order.customerEmail ||
                        "Email unavailable"}
                    </p>

                    {order.phone && (
                      <p className="text-sm text-gray-500 mt-1">
                        {order.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                      Delivery Address
                    </p>

                    <p className="font-bold mt-2 leading-relaxed">
                      {order.address ||
                        "Address unavailable"}
                    </p>

                    {(order.city || order.pincode) && (
                      <p className="text-sm text-gray-500 mt-1">
                        {order.city || ""}
                        {order.city && order.pincode
                          ? " - "
                          : ""}
                        {order.pincode || ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="p-6 md:p-8">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">

                  <div>
                    <h2 className="text-xl font-black">
                      Order Items
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      {totalItems}{" "}
                      {totalItems === 1
                        ? "item"
                        : "items"}{" "}
                      in this order
                    </p>
                  </div>

                  <span className="text-2xl">
                    🧾
                  </span>
                </div>

                {orderItems.length === 0 ? (
                  <div className="rounded-2xl bg-gray-100/80 p-8 text-center text-gray-500">
                    No item details available.
                  </div>
                ) : (
                  <div className="space-y-3">

                    {orderItems.map((item, index) => {

                      const itemName =
                        getItemName(item);

                      const price = Number(
                        item?.price ||
                          item?.menuItem?.price ||
                          0
                      );

                      const quantity = Math.max(
                        1,
                        Number(item?.quantity || 1)
                      );

                      const itemKey =
                        item?.id ||
                        item?.menuItem?.id ||
                        `${itemName}-${index}`;

                      return (
                        <div
                          key={itemKey}
                          className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
                        >

                          <img
                            src={getItemImage(item)}
                            alt={itemName}
                            className="w-16 h-16 rounded-xl object-cover bg-gray-100 print:hidden"
                            onError={(event) => {
                              if (
                                event.currentTarget.src !==
                                FALLBACK_IMAGE
                              ) {
                                event.currentTarget.src =
                                  FALLBACK_IMAGE;
                              }
                            }}
                          />

                          <div className="flex-1 min-w-0">

                            <p className="font-black truncate">
                              {itemName}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              {getRestaurantName(item)}
                            </p>

                            {getItemCategory(item) && (
                              <p className="text-xs text-gray-400 mt-1">
                                {getItemCategory(item)}
                              </p>
                            )}

                            <p className="text-sm text-gray-500 mt-1">
                              {formatPrice(price)} ×{" "}
                              {quantity}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-black text-lg">
                              {formatPrice(
                                price * quantity
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Price Summary */}
                <div className="mt-8 ml-auto max-w-sm border-t border-gray-200 pt-5">

                  <div className="space-y-3 text-sm">

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Subtotal
                      </span>

                      <span className="font-bold">
                        {formatPrice(subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Delivery Fee
                      </span>

                      <span className="font-bold">
                        {formatPrice(deliveryFee)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Taxes
                      </span>

                      <span className="font-bold">
                        {formatPrice(taxes)}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-4 flex justify-between items-center">

                      <span className="text-lg font-black">
                        Total
                      </span>

                      <span className="text-2xl font-black text-orange-500">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Footer */}
              <div className="bg-gray-100/80 border-t border-gray-200 px-6 md:px-8 py-6">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                  <div>
                    <p className="font-black">
                      Thank you for ordering with QuickBite! ❤️
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Please keep this receipt for your records.
                    </p>
                  </div>

                  <div className="text-left sm:text-right">

                    <p className="text-xs text-gray-400">
                      Payment Method
                    </p>

                    <p className="font-black mt-1">
                      {paymentMethod}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* =====================================
                DELIVERY DETAILS
            ====================================== */}
            <section className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl p-6 md:p-7 print:hidden">

              <div className="flex items-center gap-4 mb-6">

                <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-xl">
                  📍
                </div>

                <div>
                  <h2 className="text-xl font-black">
                    Delivery Details
                  </h2>

                  <p className="text-sm text-gray-600">
                    Your food will be delivered here.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">

                <div className="bg-gray-100/75 rounded-2xl p-5">
                  <p className="text-xs text-gray-500 mb-1">
                    Customer
                  </p>

                  <p className="font-black">
                    {order.customerName || "Customer"}
                  </p>

                  {order.phone && (
                    <p className="text-sm text-gray-600 mt-1">
                      📞 {order.phone}
                    </p>
                  )}
                </div>

                <div className="bg-gray-100/75 rounded-2xl p-5">
                  <p className="text-xs text-gray-500 mb-1">
                    Email
                  </p>

                  <p className="font-bold break-all">
                    {order.customerEmail ||
                      "Not available"}
                  </p>
                </div>

                <div className="md:col-span-2 bg-gray-100/75 rounded-2xl p-5">

                  <p className="text-xs text-gray-500 mb-1">
                    Delivery Address
                  </p>

                  <p className="font-bold">
                    {order.address ||
                      "Address not available"}
                  </p>

                  {(order.city || order.pincode) && (
                    <p className="text-sm text-gray-600 mt-1">
                      {order.city || ""}
                      {order.city && order.pincode
                        ? " - "
                        : ""}
                      {order.pincode || ""}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* =====================================
                BOTTOM CTA
            ====================================== */}
            <section className="bg-gradient-to-r from-gray-950/90 to-gray-800/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 text-white border border-white/10 shadow-2xl print:hidden">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                <div>
                  <p className="text-orange-400 text-sm font-bold">
                    HUNGRY AGAIN?
                  </p>

                  <h2 className="text-2xl font-black mt-1">
                    Discover more delicious food.
                  </h2>

                  <p className="text-gray-400 text-sm mt-2">
                    Fresh meals from your favorite restaurants.
                  </p>
                </div>

                <button
                  onClick={() => goTo("/restaurants")}
                  className="bg-orange-500 hover:bg-orange-600 px-7 py-3.5 rounded-xl font-black transition whitespace-nowrap"
                >
                  🍔 Order More Food
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* =========================================
          FOOTER
      ========================================== */}
      <footer className="bg-gray-950/90 backdrop-blur-xl text-gray-400 px-6 py-10 mt-12 print:hidden">

        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">

          <div>
            <h2 className="text-2xl font-black text-white mb-3">
              QuickBite
            </h2>

            <p className="text-sm leading-6">
              Fast food delivery made simple, delicious and convenient.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">
              Quick Links
            </h3>

            <div className="space-y-2 text-sm">

              <button
                onClick={() => goTo("/")}
                className="block hover:text-white"
              >
                Home
              </button>

              <button
                onClick={() => goTo("/restaurants")}
                className="block hover:text-white"
              >
                Restaurants
              </button>

              <button
                onClick={() => goTo("/menu")}
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
                onClick={handleViewOrders}
                className="block hover:text-white"
              >
                My Orders
              </button>

              <button
                onClick={handleTrackOrder}
                className="block hover:text-white"
              >
                Track Order
              </button>

              <button
                onClick={() => goTo("/cart")}
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

      {/* =========================================
          PRINT STYLES
      ========================================== */}
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }

            body {
              background: white !important;
            }

            #quickbite-invoice {
              box-shadow: none !important;
              border: 1px solid #e5e7eb !important;
              border-radius: 0 !important;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>
    </PageBackground>
  );
}

export default OrderSuccess;