import React, { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import API_BASE_URL from "../config";

const MENU_API = `${API_BASE_URL}/menu-items`;
const RESTAURANT_API = `${API_BASE_URL}/restaurants`;

const FOOD_VIDEO =
  "https://cdn.coverr.co/videos/coverr-a-chef-preparing-food-1578/1080p.mp4";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=90";

const fallbackRestaurantImage =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85";

const categoryImages = {
  pizza:
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80",

  burger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",

  chicken:
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=900&q=80",

  biryani:
    "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=80",

  rice:
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",

  noodles:
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",

  momos:
    "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=900&q=80",

  sandwich:
    "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=900&q=80",

  dessert:
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80",

  drink:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",

  snacks:
    "https://images.unsplash.com/photo-1520201163981-8cc95007dd2f?auto=format&fit=crop&w=900&q=80",

  default:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
};

const getCategoryImage = (category) => {
  const value = String(category || "").toLowerCase();

  if (value.includes("pizza")) return categoryImages.pizza;
  if (value.includes("burger")) return categoryImages.burger;
  if (value.includes("chicken")) return categoryImages.chicken;
  if (value.includes("biryani")) return categoryImages.biryani;
  if (value.includes("rice")) return categoryImages.rice;
  if (value.includes("noodle")) return categoryImages.noodles;
  if (value.includes("momo")) return categoryImages.momos;
  if (value.includes("sandwich")) return categoryImages.sandwich;

  if (
    value.includes("dessert") ||
    value.includes("sweet")
  ) {
    return categoryImages.dessert;
  }

  if (
    value.includes("drink") ||
    value.includes("beverage")
  ) {
    return categoryImages.drink;
  }

  if (value.includes("snack")) {
    return categoryImages.snacks;
  }

  return categoryImages.default;
};

const getCategoryIcon = (category) => {
  const value = String(category || "").toLowerCase();

  if (value.includes("pizza")) return "🍕";
  if (value.includes("burger")) return "🍔";
  if (value.includes("chicken")) return "🍗";
  if (value.includes("biryani")) return "🍛";
  if (value.includes("rice")) return "🍚";
  if (value.includes("noodle")) return "🍜";
  if (value.includes("momo")) return "🥟";
  if (value.includes("sandwich")) return "🥪";
  if (value.includes("dessert")) return "🍰";
  if (value.includes("sweet")) return "🍩";
  if (value.includes("drink")) return "🥤";
  if (value.includes("beverage")) return "🥤";
  if (value.includes("snack")) return "🍟";

  return "🍽️";
};

function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);

  const params = new URLSearchParams(
    window.location.search
  );

  const restaurantId = params.get("restaurantId");

  // =========================================
  // LOAD CART
  // =========================================

  const loadCart = () => {
    try {
      const cart = JSON.parse(
        localStorage.getItem(
          "quickbite-cart"
        ) || "[]"
      );

      const safeCart = Array.isArray(cart)
        ? cart
        : [];

      const count = safeCart.reduce(
        (total, item) =>
          total + Number(item.quantity || 1),
        0
      );

      setCartCount(count);
      setCartItems(safeCart);
    } catch (err) {
      console.error(err);
      setCartCount(0);
      setCartItems([]);
    }
  };

  useEffect(() => {
    loadCart();

    const handleStorage = () => {
      loadCart();
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    const interval = setInterval(
      loadCart,
      1000
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );

      clearInterval(interval);
    };
  }, []);

  // =========================================
  // FETCH DATA
  // =========================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          menuResponse,
          restaurantResponse,
        ] = await Promise.all([
          fetch(MENU_API),
          fetch(RESTAURANT_API),
        ]);

        if (!menuResponse.ok) {
          throw new Error(
            "Menu items load nahi ho pa rahe."
          );
        }

        if (!restaurantResponse.ok) {
          throw new Error(
            "Restaurants load nahi ho pa rahe."
          );
        }

        const menuData =
          await menuResponse.json();

        const restaurantData =
          await restaurantResponse.json();

        setMenuItems(
          Array.isArray(menuData)
            ? menuData
            : []
        );

        setRestaurants(
          Array.isArray(restaurantData)
            ? restaurantData
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Something went wrong while loading menu."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // =========================================
  // SELECTED RESTAURANT
  // =========================================

  const selectedRestaurant = useMemo(() => {
    if (!restaurantId) {
      return null;
    }

    return restaurants.find(
      (restaurant) =>
        String(restaurant.id) ===
        String(restaurantId)
    );
  }, [restaurants, restaurantId]);

  // =========================================
  // RESTAURANT MENU
  // =========================================

  const restaurantMenu = useMemo(() => {
    if (!restaurantId) {
      return menuItems;
    }

    return menuItems.filter((item) => {
      const itemRestaurantId =
        item.restaurant?.id ??
        item.restaurantId;

      return (
        String(itemRestaurantId) ===
        String(restaurantId)
      );
    });
  }, [menuItems, restaurantId]);

  // =========================================
  // CATEGORIES
  // =========================================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        restaurantMenu
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ];

    return ["All", ...uniqueCategories];
  }, [restaurantMenu]);

  // =========================================
  // FILTER MENU
  // =========================================

  const filteredMenu = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return restaurantMenu.filter((item) => {
      const itemName = String(
        item.itemName || ""
      ).toLowerCase();

      const category = String(
        item.category || ""
      ).toLowerCase();

      const matchesSearch =
        !keyword ||
        itemName.includes(keyword) ||
        category.includes(keyword);

      const matchesCategory =
        selectedCategory === "All" ||
        item.category === selectedCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    restaurantMenu,
    search,
    selectedCategory,
  ]);

  // =========================================
  // CART ITEM QUANTITY
  // =========================================

  const getCartQuantity = (item) => {
    const itemRestaurantId =
      item.restaurant?.id ??
      restaurantId ??
      null;

    const cartItem = cartItems.find(
      (cartItem) =>
        String(cartItem.menuItemId) ===
          String(item.id) &&
        String(cartItem.restaurantId) ===
          String(itemRestaurantId)
    );

    return Number(
      cartItem?.quantity || 0
    );
  };

  // =========================================
  // SAVE CART
  // =========================================

  const saveCart = (updatedCart) => {
    localStorage.setItem(
      "quickbite-cart",
      JSON.stringify(updatedCart)
    );

    setCartItems(updatedCart);

    const count = updatedCart.reduce(
      (total, item) =>
        total + Number(item.quantity || 1),
      0
    );

    setCartCount(count);
  };

  // =========================================
  // ADD TO CART
  // =========================================

  const addToCart = (
    item,
    goToCheckout = false
  ) => {
    try {
      const existingCart = JSON.parse(
        localStorage.getItem(
          "quickbite-cart"
        ) || "[]"
      );

      const safeCart = Array.isArray(
        existingCart
      )
        ? existingCart
        : [];

      const itemRestaurantId =
        item.restaurant?.id ??
        restaurantId ??
        null;

      const restaurantName =
        selectedRestaurant?.name ||
        item.restaurant?.name ||
        "QuickBite Restaurant";

      const existingIndex =
        safeCart.findIndex(
          (cartItem) =>
            String(
              cartItem.menuItemId
            ) === String(item.id) &&
            String(
              cartItem.restaurantId
            ) === String(itemRestaurantId)
        );

      let updatedCart;

      if (existingIndex >= 0) {
        updatedCart = [...safeCart];

        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],

          quantity:
            Number(
              updatedCart[existingIndex]
                .quantity || 1
            ) + 1,
        };
      } else {
        updatedCart = [
          ...safeCart,
          {
            menuItemId: item.id,
            itemName: item.itemName,
            price: Number(
              item.price || 0
            ),
            category:
              item.category || "",
            imageUrl:
              item.imageUrl || "",
            quantity: 1,
            restaurantId:
              itemRestaurantId,
            restaurantName,
          },
        ];
      }

      saveCart(updatedCart);

      if (goToCheckout) {
        window.location.href =
          "/checkout";

        return;
      }
    } catch (err) {
      console.error(err);

      alert(
        "Item cart me add nahi ho paaya."
      );
    }
  };

  // =========================================
  // DECREASE CART QUANTITY
  // =========================================

  const decreaseQuantity = (item) => {
    try {
      const existingCart = JSON.parse(
        localStorage.getItem(
          "quickbite-cart"
        ) || "[]"
      );

      const safeCart = Array.isArray(
        existingCart
      )
        ? existingCart
        : [];

      const itemRestaurantId =
        item.restaurant?.id ??
        restaurantId ??
        null;

      const existingIndex =
        safeCart.findIndex(
          (cartItem) =>
            String(
              cartItem.menuItemId
            ) === String(item.id) &&
            String(
              cartItem.restaurantId
            ) === String(itemRestaurantId)
        );

      if (existingIndex === -1) {
        return;
      }

      const currentQuantity = Number(
        safeCart[existingIndex]
          .quantity || 1
      );

      let updatedCart;

      if (currentQuantity <= 1) {
        updatedCart = safeCart.filter(
          (_, index) =>
            index !== existingIndex
        );
      } else {
        updatedCart = [...safeCart];

        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity:
            currentQuantity - 1,
        };
      }

      saveCart(updatedCart);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================================
  // RESTAURANT IMAGE
  // =========================================

  const restaurantImage =
    selectedRestaurant?.imageUrl ||
    fallbackRestaurantImage;

  // =========================================
  // CATEGORY COUNT
  // =========================================

  const categoryCount =
    categories.length > 0
      ? categories.length - 1
      : 0;

  return (
    <div
      className="min-h-screen text-white"
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundImage: `url("${HERO_FALLBACK}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* =====================================================
          GLOBAL FOOD BACKGROUND
      ===================================================== */}

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
          backgroundImage: `url("${HERO_FALLBACK}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_FALLBACK}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        >
          <source
            src={FOOD_VIDEO}
            type="video/mp4"
          />
        </video>

        {/* Home.js style overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.64) 48%, rgba(0,0,0,0.38) 100%)",
          }}
        />

        {/* Pink glow - top right */}
        <div
          style={{
            position: "absolute",
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

        {/* Pink glow - bottom left */}
        <div
          style={{
            position: "absolute",
            width: "450px",
            height: "450px",
            borderRadius: "50%",
            left: "-180px",
            bottom: "-180px",
            background:
              "rgba(255,77,109,0.14)",
            filter: "blur(90px)",
          }}
        />
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div
        style={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <Navbar />

        {/* =====================================================
            RESTAURANT HERO
        ===================================================== */}

        {selectedRestaurant ? (
          <section className="relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("${restaurantImage}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

            <div className="absolute inset-0 bg-black/65" />

            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/25" />

            <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
              <button
                onClick={() => {
                  window.location.href =
                    "/restaurants";
                }}
                className="mb-7 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/20"
              >
                ← All Restaurants
              </button>

              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-pink-500/10 px-3 py-1.5 text-xs font-bold text-pink-400 backdrop-blur">
                    🍽️ QUICKBITE RESTAURANT
                  </div>

                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                    {selectedRestaurant.name}
                  </h1>

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                    <span className="rounded-full bg-yellow-500/15 px-3 py-1.5 font-bold text-yellow-400 backdrop-blur">
                      ⭐{" "}
                      {Number(
                        selectedRestaurant.rating ||
                          0
                      ).toFixed(1)}
                    </span>

                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-slate-300 backdrop-blur">
                      📍{" "}
                      {selectedRestaurant.location ||
                        "Available location"}
                    </span>
                  </div>

                  <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    Explore the menu, choose your
                    favourite dishes and get your
                    order delivered through QuickBite.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                    <p className="text-xs font-medium text-slate-400">
                      Menu Items
                    </p>

                    <p className="mt-1 text-3xl font-black">
                      {restaurantMenu.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                    <p className="text-xs font-medium text-slate-400">
                      Categories
                    </p>

                    <p className="mt-1 text-3xl font-black">
                      {categoryCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* =================================================
             ALL MENU HERO
          ================================================= */

          <section className="relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-pink-500/10 px-3 py-1.5 text-xs font-bold text-pink-400 backdrop-blur-xl">
                  🍴 QUICKBITE MENU
                </div>

                <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Explore{" "}
                  <span className="text-[#ff4d6d]">
                    Delicious Food
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Discover delicious dishes from
                  QuickBite restaurants and add your
                  favourites directly to your cart.
                </p>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                  <p className="text-xs text-slate-400">
                    Food Items
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {menuItems.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                  <p className="text-xs text-slate-400">
                    Categories
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {categoryCount}
                  </p>
                </div>

                <div className="hidden rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl sm:block">
                  <p className="text-xs text-slate-400">
                    Cart Items
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {cartCount}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            MAIN GLASS PANEL
        ===================================================== */}

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* SEARCH + CART */}

          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-2xl">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                  🔍
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search dishes, categories..."
                  className="w-full rounded-2xl border border-white/15 bg-white/10 py-4 pl-12 pr-12 text-sm text-white outline-none placeholder:text-slate-400 backdrop-blur-xl transition focus:border-[#ff4d6d]/60 focus:bg-white/15"
                />

                {search && (
                  <button
                    onClick={() =>
                      setSearch("")
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                window.location.href =
                  "/cart";
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#ff4d6d] px-6 py-4 text-sm font-black text-white shadow-lg shadow-pink-500/20 transition hover:-translate-y-0.5 hover:bg-[#ff365d]"
            >
              🛒 View Cart

              {cartCount > 0 && (
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-[#ff4d6d]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* RESULT INFO */}

          {!loading && !error && (
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-300">
                Showing{" "}
                <span className="font-bold text-white">
                  {filteredMenu.length}
                </span>{" "}
                food item
                {filteredMenu.length !== 1
                  ? "s"
                  : ""}
                {selectedCategory !==
                  "All" && (
                  <>
                    {" "}
                    in{" "}
                    <span className="font-semibold text-[#ff4d6d]">
                      {selectedCategory}
                    </span>
                  </>
                )}
              </p>

              {search && (
                <p className="text-xs text-slate-400">
                  Search: "{search}"
                </p>
              )}
            </div>
          )}

          {/* CATEGORIES */}

          {!loading &&
            categories.length > 1 && (
              <div className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">
                    Food Categories
                  </h2>

                  {selectedCategory !==
                    "All" && (
                    <button
                      onClick={() =>
                        setSelectedCategory(
                          "All"
                        )
                      }
                      className="text-xs font-bold text-[#ff4d6d] hover:text-pink-300"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="flex min-w-max gap-2">
                    {categories.map(
                      (category) => (
                        <button
                          key={category}
                          onClick={() =>
                            setSelectedCategory(
                              category
                            )
                          }
                          className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                            selectedCategory ===
                            category
                              ? "bg-[#ff4d6d] text-white shadow-lg shadow-pink-500/20"
                              : "border border-white/10 bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                          }`}
                        >
                          <span>
                            {category ===
                            "All"
                              ? "🍽️"
                              : getCategoryIcon(
                                  category
                                )}
                          </span>

                          <span>
                            {category}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* ERROR */}

          {error && (
            <div className="mb-8 rounded-3xl border border-red-400/20 bg-red-500/10 p-6 backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-red-300">
                    Unable to load menu
                  </p>

                  <p className="mt-1 text-sm text-red-200/70">
                    {error}
                  </p>
                </div>

                <button
                  onClick={() =>
                    window.location.reload()
                  }
                  className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-600"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* LOADING */}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({
                length: 8,
              }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl"
                >
                  <div className="h-56 animate-pulse bg-white/10" />

                  <div className="space-y-4 p-5">
                    <div className="h-5 animate-pulse rounded-lg bg-white/10" />

                    <div className="h-4 w-2/3 animate-pulse rounded-lg bg-white/10" />

                    <div className="h-10 animate-pulse rounded-xl bg-white/10" />

                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-11 animate-pulse rounded-xl bg-white/10" />

                      <div className="h-11 animate-pulse rounded-xl bg-white/10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMenu.length === 0 ? (
            /* EMPTY */

            <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-20 text-center backdrop-blur-xl">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#ff4d6d]/10 text-4xl">
                🍽️
              </div>

              <h2 className="text-2xl font-black">
                No Food Found
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                {search
                  ? `No dishes found for "${search}". Try another search.`
                  : selectedRestaurant
                  ? "Is restaurant ke liye abhi menu items available nahi hain."
                  : "Abhi menu items available nahi hain."}
              </p>

              {(search ||
                selectedCategory !==
                  "All") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory(
                      "All"
                    );
                  }}
                  className="mt-6 rounded-xl bg-[#ff4d6d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ff365d]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            /* MENU GRID */

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMenu.map((item) => {
                const image =
                  item.imageUrl ||
                  getCategoryImage(
                    item.category
                  );

                const quantity =
                  getCartQuantity(item);

                return (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-xl shadow-black/20 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#ff4d6d]/40 hover:bg-white/15"
                  >
                    {/* IMAGE */}

                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={image}
                        alt={item.itemName}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src =
                            categoryImages.default;
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

                      {/* CATEGORY */}

                      {item.category && (
                        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                          {getCategoryIcon(
                            item.category
                          )}

                          {item.category}
                        </span>
                      )}

                      {/* PRICE */}

                      <span className="absolute bottom-3 right-3 rounded-xl bg-white px-3 py-1.5 text-sm font-black text-slate-900 shadow-xl">
                        ₹
                        {Number(
                          item.price || 0
                        ).toFixed(0)}
                      </span>

                      {/* CART QUANTITY */}

                      {quantity > 0 && (
                        <span className="absolute bottom-3 left-3 rounded-xl bg-[#ff4d6d] px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-pink-500/20">
                          {quantity} in cart
                        </span>
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="line-clamp-1 text-lg font-black text-white">
                          {item.itemName}
                        </h2>

                        <span className="shrink-0 text-lg">
                          {getCategoryIcon(
                            item.category
                          )}
                        </span>
                      </div>

                      <p className="mt-2 min-h-[40px] text-xs leading-5 text-slate-400">
                        Delicious food prepared for
                        your QuickBite order.
                      </p>

                      {/* QUANTITY CONTROL */}

                      {quantity > 0 ? (
                        <div className="mt-5 flex items-center justify-between rounded-xl border border-[#ff4d6d]/20 bg-[#ff4d6d]/10 p-1.5">
                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-lg font-black text-white transition hover:bg-white/20"
                          >
                            −
                          </button>

                          <div className="text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Quantity
                            </p>

                            <p className="text-sm font-black text-[#ff4d6d]">
                              {quantity}
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              addToCart(item)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff4d6d] text-lg font-black text-white transition hover:bg-[#ff365d]"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            addToCart(item)
                          }
                          className="mt-5 w-full rounded-xl border border-[#ff4d6d]/30 bg-[#ff4d6d]/10 px-3 py-3 text-sm font-black text-[#ff4d6d] transition hover:bg-[#ff4d6d] hover:text-white"
                        >
                          🛒 Add to Cart
                        </button>
                      )}

                      {/* ORDER BUTTON */}

                      <button
                        onClick={() =>
                          addToCart(
                            item,
                            true
                          )
                        }
                        className="mt-2 w-full rounded-xl bg-[#ff4d6d] px-3 py-3 text-sm font-black text-white transition hover:bg-[#ff365d] hover:shadow-lg hover:shadow-pink-500/20"
                      >
                        ⚡ Order Now
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* =====================================================
            FLOATING CART
        ===================================================== */}

        {cartCount > 0 && (
          <button
            onClick={() => {
              window.location.href =
                "/cart";
            }}
            className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/15 bg-[#ff4d6d] px-6 py-3.5 text-sm font-black text-white shadow-2xl shadow-pink-500/30 backdrop-blur-xl transition hover:scale-105 hover:bg-[#ff365d]"
          >
            <span>🛒</span>

            <span>
              View Cart
            </span>

            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-[#ff4d6d]">
              {cartCount}
            </span>
          </button>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="mt-16 border-t border-white/10 bg-black/75 py-10 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <p className="text-xl font-black">
                Quick
                <span className="text-[#ff4d6d]">
                  Bite
                </span>
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Delicious food. Delivered fast.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-400">
              <button
                onClick={() => {
                  window.location.href =
                    "/";
                }}
                className="transition hover:text-white"
              >
                Home
              </button>

              <button
                onClick={() => {
                  window.location.href =
                    "/restaurants";
                }}
                className="transition hover:text-white"
              >
                Restaurants
              </button>

              <button
                onClick={() => {
                  window.location.href =
                    "/menu";
                }}
                className="transition hover:text-white"
              >
                Menu
              </button>

              <button
                onClick={() => {
                  window.location.href =
                    "/orders";
                }}
                className="transition hover:text-white"
              >
                My Orders
              </button>

              <button
                onClick={() => {
                  window.location.href =
                    "/track-order";
                }}
                className="transition hover:text-white"
              >
                Track Order
              </button>

              <button
                onClick={() => {
                  window.location.href =
                    "/support";
                }}
                className="transition hover:text-white"
              >
                Support
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Menu;