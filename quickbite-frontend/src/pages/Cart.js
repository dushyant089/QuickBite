import React, { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";

const DELIVERY_FEE = 40;
const TAX_RATE = 0.05;

const FOOD_VIDEO =
  "https://cdn.coverr.co/videos/coverr-a-chef-preparing-food-1578/1080p.mp4";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=90";

const fallbackFoodImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80";

function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRestaurants, setExpandedRestaurants] = useState({});
  const [updatingItem, setUpdatingItem] = useState(null);
  const [videoFailed, setVideoFailed] = useState(false);

  // =========================================
  // LOAD CART
  // =========================================

  useEffect(() => {
    loadCart();

    const handleStorage = () => {
      loadCart();
    };

    window.addEventListener("storage", handleStorage);

    const interval = setInterval(loadCart, 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const loadCart = () => {
    try {
      const savedCart =
        localStorage.getItem("quickbite-cart");

      const parsedCart = savedCart
        ? JSON.parse(savedCart)
        : [];

      const safeCart = Array.isArray(parsedCart)
        ? parsedCart
        : [];

      const normalizedCart = safeCart.map((item) => ({
        ...item,

        menuItemId:
          item.menuItemId ??
          item.id,

        itemName:
          item.itemName ??
          item.name ??
          "Food Item",

        imageUrl:
          item.imageUrl ??
          item.image ??
          "",

        price: Number(
          item.price || 0
        ),

        quantity: Math.max(
          1,
          Number(item.quantity || 1)
        ),

        category:
          item.category || "",

        restaurantId:
          item.restaurantId ??
          item.restaurant?.id ??
          "unknown",

        restaurantName:
          item.restaurantName ??
          item.restaurant?.name ??
          "QuickBite Restaurant",
      }));

      setCart(normalizedCart);
    } catch (err) {
      console.error(
        "Cart loading error:",
        err
      );

      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // SAVE CART
  // =========================================

  const saveCart = (updatedCart) => {
    const normalizedCart =
      updatedCart.map((item) => ({
        ...item,

        menuItemId:
          item.menuItemId ??
          item.id,

        itemName:
          item.itemName ??
          item.name ??
          "Food Item",

        imageUrl:
          item.imageUrl ??
          item.image ??
          "",

        price: Number(
          item.price || 0
        ),

        quantity: Math.max(
          1,
          Number(item.quantity || 1)
        ),
      }));

    setCart(normalizedCart);

    localStorage.setItem(
      "quickbite-cart",
      JSON.stringify(normalizedCart)
    );
  };

  // =========================================
  // UPDATE QUANTITY
  // =========================================

  const updateQuantity = (
    item,
    change
  ) => {
    const itemKey =
      item.menuItemId ??
      item.id;

    setUpdatingItem(itemKey);

    const updatedCart = cart
      .map((cartItem) => {
        const cartItemKey =
          cartItem.menuItemId ??
          cartItem.id;

        const sameRestaurant =
          String(
            cartItem.restaurantId
          ) ===
          String(item.restaurantId);

        if (
          String(cartItemKey) !==
            String(itemKey) ||
          !sameRestaurant
        ) {
          return cartItem;
        }

        return {
          ...cartItem,

          quantity:
            Number(
              cartItem.quantity || 1
            ) + change,
        };
      })
      .filter(
        (cartItem) =>
          Number(
            cartItem.quantity || 0
          ) > 0
      );

    saveCart(updatedCart);

    setTimeout(() => {
      setUpdatingItem(null);
    }, 200);
  };

  // =========================================
  // REMOVE ITEM
  // =========================================

  const removeItem = (item) => {
    const itemKey =
      item.menuItemId ??
      item.id;

    const updatedCart =
      cart.filter((cartItem) => {
        const cartItemKey =
          cartItem.menuItemId ??
          cartItem.id;

        const sameItem =
          String(cartItemKey) ===
          String(itemKey);

        const sameRestaurant =
          String(
            cartItem.restaurantId
          ) ===
          String(item.restaurantId);

        return !(
          sameItem &&
          sameRestaurant
        );
      });

    saveCart(updatedCart);
  };

  // =========================================
  // CLEAR CART
  // =========================================

  const clearCart = () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to clear your entire cart?"
      );

    if (!confirmed) {
      return;
    }

    saveCart([]);
  };

  // =========================================
  // GROUP BY RESTAURANT
  // =========================================

  const restaurantGroups =
    useMemo(() => {
      const groups = {};

      cart.forEach((item) => {
        const restaurantId =
          item.restaurantId ||
          "unknown";

        const restaurantName =
          item.restaurantName ||
          "QuickBite Restaurant";

        if (!groups[restaurantId]) {
          groups[restaurantId] = {
            id: restaurantId,
            name: restaurantName,
            items: [],
          };
        }

        groups[restaurantId].items.push(
          item
        );
      });

      return Object.values(groups);
    }, [cart]);

  // =========================================
  // TOTAL ITEMS
  // =========================================

  const totalItems =
    useMemo(() => {
      return cart.reduce(
        (sum, item) =>
          sum +
          Number(
            item.quantity || 0
          ),
        0
      );
    }, [cart]);

  // =========================================
  // SUBTOTAL
  // =========================================

  const subtotal =
    useMemo(() => {
      return cart.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Number(
              item.quantity || 0
            ),
        0
      );
    }, [cart]);

  // =========================================
  // TAXES
  // =========================================

  const taxes =
    subtotal * TAX_RATE;

  // =========================================
  // DELIVERY
  // =========================================

  const deliveryFee =
    cart.length > 0
      ? DELIVERY_FEE
      : 0;

  // =========================================
  // TOTAL
  // =========================================

  const total =
    subtotal +
    deliveryFee +
    taxes;

  // =========================================
  // TOGGLE RESTAURANT
  // =========================================

  const toggleRestaurant = (
    restaurantId
  ) => {
    setExpandedRestaurants(
      (previous) => ({
        ...previous,

        [restaurantId]:
          !previous[
            restaurantId
          ],
      })
    );
  };

  // =========================================
  // NAVIGATION
  // =========================================

  const goTo = (path) => {
    window.location.href =
      path;
  };

  // =========================================
  // CHECKOUT
  // =========================================

  const proceedToCheckout =
    () => {
      if (cart.length === 0) {
        return;
      }

      window.location.href =
        "/checkout";
    };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-white">

        {/* BACKGROUND */}

        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage:
              `url(${HERO_FALLBACK})`,
          }}
        />

        {!videoFailed && (
          <video
            autoPlay
            muted
            loop
            playsInline
            onError={() =>
              setVideoFailed(true)
            }
            className="pointer-events-none fixed inset-0 z-[1] h-full w-full object-cover"
          >
            <source
              src={FOOD_VIDEO}
              type="video/mp4"
            />
          </video>
        )}

        <div
          className="pointer-events-none fixed inset-0 z-[2]"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.58) 48%, rgba(0,0,0,0.25) 100%)",
          }}
        />

        <div
          className="pointer-events-none fixed right-[-150px] top-[-100px] z-[3] h-[500px] w-[500px] rounded-full"
          style={{
            background:
              "rgba(255,77,109,0.20)",
            filter:
              "blur(80px)",
          }}
        />

        <div className="relative z-10">
          <Navbar />

          <main className="flex min-h-[70vh] items-center justify-center px-4">

            <div className="rounded-3xl border border-white/10 bg-black/30 px-10 py-10 text-center shadow-2xl backdrop-blur-xl">

              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500" />

              <p className="font-semibold text-slate-300">
                Loading your cart...
              </p>

            </div>

          </main>
        </div>

      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-white">

      {/* =====================================
          GLOBAL FOOD BACKGROUND
      ====================================== */}

      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            `url(${HERO_FALLBACK})`,
        }}
      />

      {!videoFailed && (
        <video
          autoPlay
          muted
          loop
          playsInline
          onError={() =>
            setVideoFailed(true)
          }
          className="pointer-events-none fixed inset-0 z-[1] h-full w-full object-cover"
        >
          <source
            src={FOOD_VIDEO}
            type="video/mp4"
          />
        </video>
      )}

      {/* DARK OVERLAY */}

      <div
        className="pointer-events-none fixed inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.58) 48%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* PINK GLOW */}

      <div
        className="pointer-events-none fixed right-[-150px] top-[-100px] z-[3] h-[500px] w-[500px] rounded-full"
        style={{
          background:
            "rgba(255,77,109,0.20)",
          filter:
            "blur(80px)",
        }}
      />

      {/* =====================================
          PAGE CONTENT
      ====================================== */}

      <div className="relative z-10">

        <Navbar />

        {/* =====================================
            HEADER
        ====================================== */}

        <section className="relative overflow-hidden border-b border-white/10 bg-black/25 backdrop-blur-md">

          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

            <button
              onClick={() =>
                goTo("/restaurants")
              }
              className="mb-6 text-sm font-bold text-orange-400 transition hover:text-orange-300"
            >
              ← Continue Shopping
            </button>

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

              <div>

                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-black text-orange-400 backdrop-blur-md">
                  🛒 QUICKBITE CART
                </div>

                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                  Your Cart
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                  Review your favourite food,
                  adjust quantities and place your
                  order when you're ready.
                </p>

              </div>

              {cart.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/30 px-6 py-4 shadow-xl backdrop-blur-xl">

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Items
                  </p>

                  <p className="mt-1 text-3xl font-black text-orange-400">
                    {totalItems}
                  </p>

                </div>
              )}

            </div>

          </div>

        </section>

        {/* =====================================
            MAIN
        ====================================== */}

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {cart.length === 0 ? (

            /* ===================================
               EMPTY CART
            ==================================== */

            <section className="rounded-3xl border border-white/10 bg-black/35 px-5 py-20 text-center shadow-2xl backdrop-blur-xl">

              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-500/10 text-5xl">
                🛒
              </div>

              <h2 className="text-3xl font-black">
                Your Cart is Empty
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300">
                Looks like you haven't added
                anything yet. Explore restaurants
                and discover something delicious.
              </p>

              <button
                onClick={() =>
                  goTo("/restaurants")
                }
                className="mt-7 rounded-xl bg-orange-500 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
              >
                🍽️ Explore Restaurants
              </button>

            </section>

          ) : (

            <div className="grid items-start gap-7 lg:grid-cols-3">

              {/* =================================
                  CART ITEMS
              ================================== */}

              <div className="space-y-5 lg:col-span-2">

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-2xl font-black">
                      Cart Items
                    </h2>

                    <p className="mt-1 text-sm text-slate-300">
                      {restaurantGroups.length}{" "}
                      restaurant
                      {restaurantGroups.length !==
                      1
                        ? "s"
                        : ""}{" "}
                      • {totalItems} item
                      {totalItems !== 1
                        ? "s"
                        : ""}
                    </p>

                  </div>

                  <button
                    onClick={clearCart}
                    className="rounded-lg px-3 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    Clear Cart
                  </button>

                </div>

                {/* =================================
                    RESTAURANT GROUPS
                ================================== */}

                {restaurantGroups.map(
                  (restaurant) => {

                    const restaurantSubtotal =
                      restaurant.items.reduce(
                        (
                          sum,
                          item
                        ) =>
                          sum +
                          Number(
                            item.price || 0
                          ) *
                            Number(
                              item.quantity ||
                                0
                            ),
                        0
                      );

                    const isExpanded =
                      expandedRestaurants[
                        restaurant.id
                      ] !== false;

                    return (
                      <section
                        key={
                          restaurant.id
                        }
                        className="overflow-hidden rounded-3xl border border-white/10 bg-black/35 shadow-2xl shadow-black/20 backdrop-blur-xl"
                      >

                        {/* RESTAURANT HEADER */}

                        <button
                          onClick={() =>
                            toggleRestaurant(
                              restaurant.id
                            )
                          }
                          className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-white/[0.05] md:p-6"
                        >

                          <div className="min-w-0">

                            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
                              Restaurant
                            </p>

                            <h3 className="truncate text-lg font-black sm:text-xl">
                              {restaurant.name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-400">
                              {
                                restaurant
                                  .items
                                  .length
                              }{" "}
                              food item
                              {restaurant
                                .items
                                .length !==
                              1
                                ? "s"
                                : ""}
                            </p>

                          </div>

                          <div className="shrink-0 text-right">

                            <p className="font-black text-orange-400">
                              ₹
                              {restaurantSubtotal.toFixed(
                                0
                              )}
                            </p>

                            <p className="mt-1 text-lg text-slate-400">
                              {isExpanded
                                ? "⌃"
                                : "⌄"}
                            </p>

                          </div>

                        </button>

                        {/* RESTAURANT ITEMS */}

                        {isExpanded && (
                          <div className="border-t border-white/10">

                            {restaurant.items.map(
                              (item) => {

                                const itemKey =
                                  item.menuItemId ??
                                  item.id;

                                const itemTotal =
                                  Number(
                                    item.price ||
                                      0
                                  ) *
                                  Number(
                                    item.quantity ||
                                      0
                                  );

                                const image =
                                  item.imageUrl ||
                                  fallbackFoodImage;

                                const isUpdating =
                                  updatingItem ===
                                  itemKey;

                                return (
                                  <div
                                    key={`${item.restaurantId}-${itemKey}`}
                                    className="border-b border-white/10 p-5 last:border-b-0 md:p-6"
                                  >

                                    <div className="flex gap-4">

                                      {/* IMAGE */}

                                      <img
                                        src={image}
                                        alt={
                                          item.itemName ||
                                          "Food Item"
                                        }
                                        className="h-24 w-24 shrink-0 rounded-2xl bg-slate-900 object-cover shadow-lg sm:h-28 sm:w-28"
                                        onError={(
                                          e
                                        ) => {
                                          e.currentTarget.src =
                                            fallbackFoodImage;
                                        }}
                                      />

                                      {/* DETAILS */}

                                      <div className="min-w-0 flex-1">

                                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">

                                          <div className="min-w-0">

                                            <h4 className="truncate text-base font-black sm:text-lg">
                                              {item.itemName ||
                                                "Food Item"}
                                            </h4>

                                            {item.category && (
                                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                                {item.category}
                                              </p>
                                            )}

                                            <p className="mt-2 text-sm font-semibold text-orange-400">
                                              ₹
                                              {Number(
                                                item.price ||
                                                  0
                                              ).toFixed(
                                                0
                                              )}{" "}
                                              each
                                            </p>

                                          </div>

                                          <p className="shrink-0 text-lg font-black text-white">
                                            ₹
                                            {itemTotal.toFixed(
                                              0
                                            )}
                                          </p>

                                        </div>

                                        {/* ACTIONS */}

                                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">

                                          <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md">

                                            <button
                                              onClick={() =>
                                                updateQuantity(
                                                  item,
                                                  -1
                                                )
                                              }
                                              disabled={
                                                isUpdating
                                              }
                                              className="flex h-10 w-10 items-center justify-center text-lg font-black text-white transition hover:bg-white/[0.08] disabled:opacity-40"
                                            >
                                              −
                                            </button>

                                            <span className="flex h-10 w-10 items-center justify-center border-x border-white/10 text-sm font-black">
                                              {
                                                item.quantity
                                              }
                                            </span>

                                            <button
                                              onClick={() =>
                                                updateQuantity(
                                                  item,
                                                  1
                                                )
                                              }
                                              disabled={
                                                isUpdating
                                              }
                                              className="flex h-10 w-10 items-center justify-center bg-orange-500 text-lg font-black text-white transition hover:bg-orange-600 disabled:opacity-40"
                                            >
                                              +
                                            </button>

                                          </div>

                                          <button
                                            onClick={() =>
                                              removeItem(
                                                item
                                              )
                                            }
                                            className="rounded-lg px-3 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                                          >
                                            🗑️ Remove
                                          </button>

                                        </div>

                                      </div>

                                    </div>

                                  </div>
                                );
                              }
                            )}

                          </div>
                        )}

                      </section>
                    );
                  }
                )}

                {/* CONTINUE SHOPPING */}

                <button
                  onClick={() =>
                    goTo("/restaurants")
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/35 py-4 text-sm font-bold text-slate-300 shadow-xl backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white"
                >
                  ← Continue Shopping
                </button>

              </div>

              {/* =================================
                  BILL SUMMARY
              ================================== */}

              <aside className="lg:sticky lg:top-5">

                <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">

                  <div className="mb-6 flex items-center justify-between">

                    <h2 className="text-xl font-black">
                      Bill Summary
                    </h2>

                    <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
                      {totalItems} item
                      {totalItems !== 1
                        ? "s"
                        : ""}
                    </span>

                  </div>

                  {/* BILL */}

                  <div className="space-y-4 text-sm">

                    <div className="flex justify-between">

                      <span className="text-slate-400">
                        Subtotal
                      </span>

                      <span className="font-bold">
                        ₹
                        {subtotal.toFixed(
                          0
                        )}
                      </span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-slate-400">
                        Delivery Fee
                      </span>

                      <span className="font-bold">
                        ₹
                        {deliveryFee.toFixed(
                          0
                        )}
                      </span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-slate-400">
                        Taxes
                      </span>

                      <span className="font-bold">
                        ₹
                        {taxes.toFixed(
                          0
                        )}
                      </span>

                    </div>

                  </div>

                  {/* TOTAL */}

                  <div className="mt-6 border-t border-white/10 pt-5">

                    <div className="flex items-center justify-between">

                      <span className="text-lg font-black">
                        Total
                      </span>

                      <span className="text-2xl font-black text-orange-500">
                        ₹
                        {total.toFixed(
                          0
                        )}
                      </span>

                    </div>

                  </div>

                  {/* CHECKOUT */}

                  <button
                    onClick={
                      proceedToCheckout
                    }
                    className="mt-6 w-full rounded-xl bg-orange-500 py-4 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 hover:shadow-orange-500/30"
                  >
                    ⚡ Proceed to Checkout
                  </button>

                  {/* TRUST */}

                  <div className="mt-6 space-y-4">

                    <div className="flex items-start gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                        🔒
                      </div>

                      <div>

                        <p className="text-sm font-bold">
                          Secure Checkout
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Your order details are
                          securely processed.
                        </p>

                      </div>

                    </div>

                    <div className="flex items-start gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                        🚚
                      </div>

                      <div>

                        <p className="text-sm font-bold">
                          Fast Delivery
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Track your order after
                          checkout.
                        </p>

                      </div>

                    </div>

                    <div className="flex items-start gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                        📦
                      </div>

                      <div>

                        <p className="text-sm font-bold">
                          Order Tracking
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Follow your order status
                          in real time.
                        </p>

                      </div>

                    </div>

                  </div>

                </section>

              </aside>

            </div>

          )}

        </main>

        {/* =====================================
            FOOTER
        ====================================== */}

        <footer className="mt-12 border-t border-white/10 bg-black/60 px-6 py-10 backdrop-blur-xl">

          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">

            <div>

              <h2 className="text-2xl font-black text-white">
                Quick
                <span className="text-orange-500">
                  Bite
                </span>
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Fast food delivery made simple,
                delicious and convenient.
              </p>

            </div>

            <div>

              <h3 className="mb-3 font-bold text-white">
                Quick Links
              </h3>

              <div className="space-y-2 text-sm">

                <button
                  onClick={() =>
                    goTo("/")
                  }
                  className="block transition hover:text-white"
                >
                  Home
                </button>

                <button
                  onClick={() =>
                    goTo("/restaurants")
                  }
                  className="block transition hover:text-white"
                >
                  Restaurants
                </button>

                <button
                  onClick={() =>
                    goTo("/menu")
                  }
                  className="block transition hover:text-white"
                >
                  Menu
                </button>

              </div>

            </div>

            <div>

              <h3 className="mb-3 font-bold text-white">
                Orders
              </h3>

              <div className="space-y-2 text-sm">

                <button
                  onClick={() =>
                    goTo("/orders")
                  }
                  className="block transition hover:text-white"
                >
                  My Orders
                </button>

                <button
                  onClick={() =>
                    goTo("/track-order")
                  }
                  className="block transition hover:text-white"
                >
                  Track Order
                </button>

                <button
                  onClick={() =>
                    goTo("/cart")
                  }
                  className="block transition hover:text-white"
                >
                  Cart
                </button>

              </div>

            </div>

            <div>

              <h3 className="mb-3 font-bold text-white">
                Support
              </h3>

              <p className="text-sm text-slate-400">
                Need help with your order?
              </p>

              <button
                onClick={() =>
                  goTo("/support")
                }
                className="mt-2 text-sm font-semibold text-orange-400 transition hover:text-orange-300"
              >
                Open Support →
              </button>

            </div>

          </div>

          <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-6 text-center text-xs text-slate-500">
            © 2026 QuickBite. All rights reserved.
          </div>

        </footer>

      </div>

    </div>
  );
}

export default Cart;