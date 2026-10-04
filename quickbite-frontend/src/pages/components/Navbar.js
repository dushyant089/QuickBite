import React, { useEffect, useState } from "react";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);

  const currentPath = window.location.pathname;

  useEffect(() => {
    loadNavbarData();

    const handleStorageChange = () => {
      loadNavbarData();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const loadNavbarData = () => {
    try {
      const savedCart = localStorage.getItem("quickbite-cart");

      const parsedCart = savedCart ? JSON.parse(savedCart) : [];

      const safeCart = Array.isArray(parsedCart) ? parsedCart : [];

      const count = safeCart.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );

      setCartCount(count);

      const savedUser = localStorage.getItem("quickbite-user");

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Navbar data error:", error);

      setCartCount(0);
      setUser(null);
    }
  };

  const goTo = (path) => {
    setMenuOpen(false);
    window.location.href = path;
  };

  const isActive = (path) => {
    if (path === "/") {
      return currentPath === "/";
    }

    return currentPath.startsWith(path);
  };

  const logout = () => {
    localStorage.removeItem("quickbite-user");

    setUser(null);
    setMenuOpen(false);

    window.location.href = "/";
  };

  const navItems = [
    {
      label: "Home",
      path: "/",
      icon: "⌂",
    },
    {
      label: "Restaurants",
      path: "/restaurants",
      icon: "🍽️",
    },
    {
      label: "Menu",
      path: "/menu",
      icon: "🍔",
    },
    {
      label: "My Orders",
      path: "/orders",
      icon: "📦",
    },
    {
      label: "Track Order",
      path: "/track-order",
      icon: "🚚",
    },
    {
      label: "Support",
      path: "/support",
      icon: "🎧",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 md:h-[72px] flex items-center justify-between gap-4">
            {/* Logo */}
            <button
              onClick={() => goTo("/")}
              className="flex items-center gap-2.5 shrink-0 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md shadow-orange-100 group-hover:scale-105 transition-transform">
                <span className="text-xl">🍴</span>
              </div>

              <div className="text-left">
                <div className="text-xl md:text-2xl font-black tracking-tight text-gray-900">
                  Quick<span className="text-orange-500">Bite</span>
                </div>

                <div className="hidden sm:block text-[9px] uppercase tracking-[0.18em] text-gray-400 font-bold -mt-1">
                  Food Delivery
                </div>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => goTo(item.path)}
                    className={`relative px-3.5 py-2.5 rounded-xl text-sm font-bold transition ${
                      active
                        ? "text-orange-500 bg-orange-50"
                        : "text-gray-600 hover:text-orange-500 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}

                    {active && (
                      <span className="absolute left-1/2 -bottom-1 transform -translate-x-1/2 w-5 h-1 bg-orange-500 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <button
                onClick={() => goTo("/cart")}
                className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition ${
                  isActive("/cart")
                    ? "bg-orange-100 text-orange-500"
                    : "bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                }`}
                aria-label="Cart"
              >
                <span className="text-xl">🛒</span>

                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              {/* User Desktop */}
              <div className="hidden md:block">
                {user ? (
                  <div className="relative group">
                    <button
                      onClick={() => goTo("/profile")}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${
                        isActive("/profile")
                          ? "bg-orange-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center font-black">
                        {(
                          user.name ||
                          user.fullName ||
                          user.email ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="text-left hidden xl:block">
                        <p className="text-xs text-gray-400 font-semibold">
                          Welcome
                        </p>

                        <p className="text-sm font-black text-gray-800 max-w-[100px] truncate">
                          {user.name || user.fullName || "User"}
                        </p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => goTo("/login")}
                    className="bg-gray-900 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-black transition"
                  >
                    Login
                  </button>
                )}
              </div>

              {/* Mobile Menu */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden w-11 h-11 rounded-xl bg-gray-50 hover:bg-orange-50 flex items-center justify-center text-gray-800 transition"
                aria-label="Open menu"
                aria-expanded={menuOpen}
              >
                <span className="text-2xl leading-none">
                  {menuOpen ? "×" : "☰"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4">
              {/* User Card */}
              {user ? (
                <div className="flex items-center justify-between bg-orange-50 rounded-2xl p-4 mb-3">
                  <button
                    onClick={() => goTo("/profile")}
                    className="flex items-center gap-3 text-left"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center font-black">
                      {(
                        user.name ||
                        user.fullName ||
                        user.email ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Welcome back</p>

                      <p className="font-black text-gray-900">
                        {user.name || user.fullName || "User"}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={logout}
                    className="text-xs font-bold text-red-500 hover:text-red-600"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => goTo("/login")}
                  className="w-full mb-3 bg-gray-900 hover:bg-orange-500 text-white py-3.5 rounded-xl font-black transition"
                >
                  Login / Sign Up
                </button>
              )}

              {/* Mobile Nav Links */}
              <div className="space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item.path);

                  return (
                    <button
                      key={item.path}
                      onClick={() => goTo(item.path)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left font-bold transition ${
                        active
                          ? "bg-orange-50 text-orange-500"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="w-7 text-center text-lg">
                        {item.icon}
                      </span>

                      <span>{item.label}</span>

                      {active && (
                        <span className="ml-auto">✓</span>
                      )}
                    </button>
                  );
                })}

                {/* Cart Mobile */}
                <button
                  onClick={() => goTo("/cart")}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left font-bold transition ${
                    isActive("/cart")
                      ? "bg-orange-50 text-orange-500"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="w-7 text-center text-lg">🛒</span>

                  <span>Cart</span>

                  {cartCount > 0 && (
                    <span className="ml-auto bg-orange-500 text-white text-xs font-black min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </button>

                {/* Profile Mobile */}
                {user && (
                  <button
                    onClick={() => goTo("/profile")}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left font-bold transition ${
                      isActive("/profile")
                        ? "bg-orange-50 text-orange-500"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-7 text-center text-lg">👤</span>

                    <span>Profile</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export default Navbar;