import React, { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import API_BASE_URL from "../config";

const API_URL = `${API_BASE_URL}/restaurants`;

const FOOD_VIDEO =
  "https://cdn.coverr.co/videos/coverr-a-chef-preparing-food-1578/1080p.mp4";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=90";

const restaurantImages = {
  pizza:
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=90",

  burger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=90",

  biryani:
    "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=1200&q=90",

  chicken:
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=90",

  chinese:
    "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=90",

  cafe:
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=90",

  dessert:
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=90",

  default: HERO_FALLBACK,
};

const getRestaurantImage = (restaurant) => {
  if (
    restaurant?.imageUrl &&
    String(restaurant.imageUrl).trim()
  ) {
    return restaurant.imageUrl;
  }

  const name = String(
    restaurant?.name || ""
  ).toLowerCase();

  if (name.includes("pizza")) {
    return restaurantImages.pizza;
  }

  if (
    name.includes("burger") ||
    name.includes("mcd") ||
    name.includes("kfc")
  ) {
    return restaurantImages.burger;
  }

  if (
    name.includes("biryani") ||
    name.includes("rice")
  ) {
    return restaurantImages.biryani;
  }

  if (
    name.includes("chicken") ||
    name.includes("bbq")
  ) {
    return restaurantImages.chicken;
  }

  if (
    name.includes("chinese") ||
    name.includes("noodle") ||
    name.includes("momo")
  ) {
    return restaurantImages.chinese;
  }

  if (
    name.includes("cafe") ||
    name.includes("coffee")
  ) {
    return restaurantImages.cafe;
  }

  if (
    name.includes("dessert") ||
    name.includes("sweet") ||
    name.includes("cake")
  ) {
    return restaurantImages.dessert;
  }

  return restaurantImages.default;
};

const getCategory = (name = "") => {
  const value = String(name).toLowerCase();

  if (value.includes("pizza")) {
    return "Pizza";
  }

  if (
    value.includes("burger") ||
    value.includes("mcd") ||
    value.includes("kfc")
  ) {
    return "Burgers";
  }

  if (
    value.includes("biryani") ||
    value.includes("rice")
  ) {
    return "Biryani";
  }

  if (
    value.includes("chicken") ||
    value.includes("bbq")
  ) {
    return "Chicken";
  }

  if (
    value.includes("chinese") ||
    value.includes("noodle") ||
    value.includes("momo")
  ) {
    return "Chinese";
  }

  if (
    value.includes("cafe") ||
    value.includes("coffee")
  ) {
    return "Cafe";
  }

  if (
    value.includes("dessert") ||
    value.includes("sweet") ||
    value.includes("cake")
  ) {
    return "Desserts";
  }

  return "Other";
};

const getCategoryIcon = (category) => {
  switch (category) {
    case "Pizza":
      return "🍕";

    case "Burgers":
      return "🍔";

    case "Biryani":
      return "🍛";

    case "Chicken":
      return "🍗";

    case "Chinese":
      return "🥡";

    case "Cafe":
      return "☕";

    case "Desserts":
      return "🍰";

    default:
      return "🍽️";
  }
};

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [selectedRating, setSelectedRating] =
    useState("All");
  const [sortBy, setSortBy] =
    useState("default");
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [videoFailed, setVideoFailed] =
    useState(false);

  // =========================
  // FETCH RESTAURANTS
  // =========================

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(
            "Restaurants load nahi ho pa rahe."
          );
        }

        const data = await response.json();

        setRestaurants(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(
          "Restaurant fetch error:",
          err
        );

        setError(
          "Restaurants load nahi ho pa rahe. Backend check karo."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // =========================
  // CATEGORIES
  // =========================

  const categories = useMemo(() => {
    const values = restaurants.map(
      (restaurant) =>
        getCategory(restaurant?.name)
    );

    return [
      "All",
      ...new Set(values),
    ];
  }, [restaurants]);

  // =========================
  // FILTER + SORT
  // =========================

  const filteredRestaurants = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    let result = restaurants.filter(
      (restaurant) => {
        const name = String(
          restaurant?.name || ""
        ).toLowerCase();

        const location = String(
          restaurant?.location || ""
        ).toLowerCase();

        const cuisine = String(
          restaurant?.cuisine || ""
        ).toLowerCase();

        const category = getCategory(
          restaurant?.name
        );

        const rating = Number(
          restaurant?.rating || 0
        );

        const matchesSearch =
          !keyword ||
          name.includes(keyword) ||
          location.includes(keyword) ||
          cuisine.includes(keyword) ||
          category
            .toLowerCase()
            .includes(keyword);

        const matchesCategory =
          selectedCategory === "All" ||
          category === selectedCategory;

        const matchesRating =
          selectedRating === "All" ||
          rating >= Number(selectedRating);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesRating
        );
      }
    );

    if (sortBy === "rating-high") {
      result = [...result].sort(
        (a, b) =>
          Number(b?.rating || 0) -
          Number(a?.rating || 0)
      );
    }

    if (sortBy === "rating-low") {
      result = [...result].sort(
        (a, b) =>
          Number(a?.rating || 0) -
          Number(b?.rating || 0)
      );
    }

    if (sortBy === "name") {
      result = [...result].sort(
        (a, b) =>
          String(a?.name || "").localeCompare(
            String(b?.name || "")
          )
      );
    }

    return result;
  }, [
    restaurants,
    search,
    selectedCategory,
    selectedRating,
    sortBy,
  ]);

  // =========================
  // VIEW MENU
  // =========================

  const viewMenu = (restaurant) => {
    if (!restaurant?.id) {
      return;
    }

    window.location.href =
      `/menu?restaurantId=${restaurant.id}`;
  };

  // =========================
  // RESET
  // =========================

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedRating("All");
    setSortBy("default");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "All" ||
    selectedRating !== "All" ||
    sortBy !== "default";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        color: "#222",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <Navbar />

      {/* =====================================================
          HERO - HOME.JS STYLE
      ===================================================== */}

      <section
        style={{
          position: "relative",
          minHeight: "580px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          backgroundImage: `url("${HERO_FALLBACK}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!videoFailed && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setVideoFailed(true)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
            }}
          >
            <source
              src={FOOD_VIDEO}
              type="video/mp4"
            />
          </video>
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.58) 48%, rgba(0,0,0,0.25) 100%)",
            zIndex: 1,
          }}
        />

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
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: "1250px",
            margin: "0 auto",
            padding: "80px 28px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              borderRadius: "999px",
              background:
                "rgba(255,255,255,0.14)",
              border:
                "1px solid rgba(255,255,255,0.20)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: "800",
              marginBottom: "22px",
            }}
          >
            🍴 DISCOVER • ORDER • ENJOY
          </div>

          <h1
            style={{
              margin: 0,
              maxWidth: "850px",
              color: "#fff",
              fontSize:
                "clamp(44px, 7vw, 76px)",
              lineHeight: "0.98",
              fontWeight: "900",
              letterSpacing: "-3px",
            }}
          >
            Find your next
            <span
              style={{
                display: "block",
                color: "#ff4d6d",
                marginTop: "12px",
              }}
            >
              favourite restaurant.
            </span>
          </h1>

          <p
            style={{
              maxWidth: "650px",
              margin:
                "24px 0 0",
              color:
                "rgba(255,255,255,0.88)",
              fontSize: "17px",
              lineHeight: "1.7",
            }}
          >
            Explore amazing restaurants, discover
            delicious cuisines and order your
            favourite food with QuickBite.
          </p>

          {/* HERO SEARCH - HOME STYLE */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              maxWidth: "760px",
              marginTop: "28px",
              padding: "7px",
              background:
                "rgba(255,255,255,0.97)",
              borderRadius: "14px",
              boxShadow:
                "0 18px 45px rgba(0,0,0,0.20)",
            }}
          >
            <span
              style={{
                fontSize: "21px",
                paddingLeft: "12px",
              }}
            >
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search restaurant, cuisine or location..."
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                padding: "13px 7px",
                fontSize: "14px",
                background:
                  "transparent",
                color: "#222",
              }}
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  width: "32px",
                  height: "32px",
                  flexShrink: 0,
                  border: "none",
                  borderRadius: "50%",
                  background: "#f3f3f3",
                  color: "#666",
                  cursor: "pointer",
                  fontWeight: "900",
                }}
              >
                ×
              </button>
            )}

            <button
              onClick={() => {
                document
                  .getElementById(
                    "restaurant-results"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
              }}
              style={{
                border: "none",
                background: "#ff4d6d",
                color: "#fff",
                padding:
                  "13px 22px",
                borderRadius: "10px",
                fontWeight: "800",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Search
            </button>
          </div>

          {/* HERO STATS */}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "22px",
            }}
          >
            <span
              style={{
                padding:
                  "8px 13px",
                borderRadius: "999px",
                background:
                  "rgba(255,255,255,0.10)",
                border:
                  "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              🍕 Multiple cuisines
            </span>

            <span
              style={{
                padding:
                  "8px 13px",
                borderRadius: "999px",
                background:
                  "rgba(255,255,255,0.10)",
                border:
                  "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              ⚡ Fast delivery
            </span>

            <span
              style={{
                padding:
                  "8px 13px",
                borderRadius: "999px",
                background:
                  "rgba(255,255,255,0.10)",
                border:
                  "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              ⭐ Top rated
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          CATEGORY SECTION - HOME.JS STYLE
      ===================================================== */}

      <section
        style={{
          background: "#fff",
          padding:
            "65px 28px 25px",
        }}
      >
        <div
          style={{
            maxWidth: "1250px",
            margin: "0 auto",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#ff4d6d",
              fontSize: "13px",
              fontWeight: "900",
              letterSpacing: "1px",
              textTransform:
                "uppercase",
            }}
          >
            Explore cuisines
          </p>

          <h2
            style={{
              margin:
                "7px 0 8px",
              fontSize:
                "clamp(28px, 4vw, 38px)",
              fontWeight: "900",
              letterSpacing:
                "-1px",
            }}
          >
            What are you craving?
          </h2>

          <p
            style={{
              margin: 0,
              color: "#777",
              fontSize: "14px",
            }}
          >
            Choose a category and discover
            restaurants serving your favourite food.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "14px",
              marginTop: "28px",
            }}
          >
            {categories.map(
              (category) => {
                const active =
                  selectedCategory ===
                  category;

                return (
                  <button
                    key={category}
                    onClick={() =>
                      setSelectedCategory(
                        category
                      )
                    }
                    style={{
                      border: active
                        ? "1px solid #ff4d6d"
                        : "1px solid #eee",
                      background: active
                        ? "#fff0f3"
                        : "#fff",
                      borderRadius: "18px",
                      padding:
                        "18px 12px",
                      cursor: "pointer",
                      boxShadow:
                        "0 8px 25px rgba(0,0,0,0.06)",
                      transition:
                        "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        margin:
                          "0 auto 10px",
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        borderRadius:
                          "14px",
                        background:
                          active
                            ? "#ff4d6d"
                            : "#fff5f7",
                        fontSize: "23px",
                      }}
                    >
                      {category === "All"
                        ? "🍽️"
                        : getCategoryIcon(
                            category
                          )}
                    </div>

                    <div
                      style={{
                        color: active
                          ? "#ff4d6d"
                          : "#333",
                        fontWeight:
                          "800",
                        fontSize:
                          "13px",
                      }}
                    >
                      {category}
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          RESULTS
      ===================================================== */}

      <section
        id="restaurant-results"
        style={{
          background: "#fafafa",
          padding:
            "55px 28px 75px",
        }}
      >
        <div
          style={{
            maxWidth: "1250px",
            margin: "0 auto",
          }}
        >
          {/* SECTION HEADER */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-end",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom:
                "25px",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: "#ff4d6d",
                  fontSize: "13px",
                  fontWeight: "900",
                  letterSpacing:
                    "1px",
                  textTransform:
                    "uppercase",
                }}
              >
                QuickBite restaurants
              </p>

              <h2
                style={{
                  margin:
                    "6px 0 0",
                  fontSize:
                    "clamp(28px, 4vw, 38px)",
                  fontWeight: "900",
                  letterSpacing:
                    "-1px",
                }}
              >
                {selectedCategory ===
                "All"
                  ? "Restaurants near you"
                  : `${selectedCategory} restaurants`}
              </h2>
            </div>

            {!loading && (
              <div
                style={{
                  color: "#777",
                  fontSize: "13px",
                  fontWeight: "700",
                }}
              >
                {filteredRestaurants.length}{" "}
                found
              </div>
            )}
          </div>

          {/* FILTER BAR */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "30px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: "900",
                color: "#777",
              }}
            >
              Rating
            </span>

            {["All", "4", "4.5"].map(
              (rating) => {
                const active =
                  selectedRating ===
                  rating;

                return (
                  <button
                    key={rating}
                    onClick={() =>
                      setSelectedRating(
                        rating
                      )
                    }
                    style={{
                      border: active
                        ? "1px solid #ff4d6d"
                        : "1px solid #e8e8e8",
                      background: active
                        ? "#ff4d6d"
                        : "#fff",
                      color: active
                        ? "#fff"
                        : "#666",
                      padding:
                        "9px 14px",
                      borderRadius:
                        "999px",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    {rating ===
                    "All"
                      ? "All"
                      : `⭐ ${rating}+`}
                  </button>
                );
              }
            )}

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value
                )
              }
              style={{
                marginLeft:
                  "auto",
                border:
                  "1px solid #e8e8e8",
                background: "#fff",
                borderRadius:
                  "999px",
                padding:
                  "10px 15px",
                outline: "none",
                color: "#444",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              <option value="default">
                Sort: Default
              </option>

              <option value="rating-high">
                Rating: High to Low
              </option>

              <option value="rating-low">
                Rating: Low to High
              </option>

              <option value="name">
                Name: A to Z
              </option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                style={{
                  border: "none",
                  background:
                    "transparent",
                  color: "#ff4d6d",
                  fontWeight: "800",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* ERROR */}

          {error && (
            <div
              style={{
                background: "#fff",
                border:
                  "1px solid #ffd7df",
                borderRadius: "18px",
                padding: "22px",
                marginBottom:
                  "25px",
                boxShadow:
                  "0 8px 25px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  color: "#d33",
                  fontWeight: "900",
                }}
              >
                ⚠️ Something went wrong
              </div>

              <p
                style={{
                  margin:
                    "7px 0 15px",
                  color: "#777",
                  fontSize: "13px",
                }}
              >
                {error}
              </p>

              <button
                onClick={() =>
                  window.location.reload()
                }
                style={{
                  border: "none",
                  background:
                    "#ff4d6d",
                  color: "#fff",
                  padding:
                    "10px 17px",
                  borderRadius:
                    "9px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* LOADING */}

          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
              }}
            >
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <div
                  key={index}
                  style={{
                    background: "#fff",
                    borderRadius:
                      "22px",
                    overflow:
                      "hidden",
                    border:
                      "1px solid #eee",
                    boxShadow:
                      "0 10px 30px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      height:
                        "200px",
                      background:
                        "#eeeeee",
                    }}
                  />

                  <div
                    style={{
                      padding:
                        "20px",
                    }}
                  >
                    <div
                      style={{
                        height:
                          "20px",
                        width:
                          "70%",
                        background:
                          "#eee",
                        borderRadius:
                          "6px",
                      }}
                    />

                    <div
                      style={{
                        height:
                          "13px",
                        width:
                          "45%",
                        background:
                          "#eee",
                        borderRadius:
                          "6px",
                        marginTop:
                          "12px",
                      }}
                    />

                    <div
                      style={{
                        height:
                          "42px",
                        width:
                          "100%",
                        background:
                          "#eee",
                        borderRadius:
                          "10px",
                        marginTop:
                          "20px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length ===
            0 ? (
            /* EMPTY */

            <div
              style={{
                background: "#fff",
                borderRadius:
                  "22px",
                border:
                  "1px solid #eee",
                padding:
                  "70px 25px",
                textAlign:
                  "center",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  fontSize:
                    "52px",
                  marginBottom:
                    "10px",
                }}
              >
                🔎
              </div>

              <h3
                style={{
                  margin: 0,
                  fontSize:
                    "25px",
                  fontWeight:
                    "900",
                }}
              >
                No restaurants found
              </h3>

              <p
                style={{
                  color: "#777",
                  fontSize:
                    "14px",
                  margin:
                    "8px 0 20px",
                }}
              >
                Try another search or
                clear the filters.
              </p>

              <button
                onClick={
                  resetFilters
                }
                style={{
                  border: "none",
                  background:
                    "#ff4d6d",
                  color: "#fff",
                  padding:
                    "12px 22px",
                  borderRadius:
                    "10px",
                  fontWeight:
                    "800",
                  cursor:
                    "pointer",
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            /* RESTAURANT CARDS */

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
              }}
            >
              {filteredRestaurants.map(
                (restaurant) => {
                  const image =
                    getRestaurantImage(
                      restaurant
                    );

                  const rating =
                    Number(
                      restaurant?.rating ||
                        0
                    );

                  const category =
                    getCategory(
                      restaurant?.name
                    );

                  return (
                    <div
                      key={
                        restaurant.id
                      }
                      style={{
                        background:
                          "#fff",
                        border:
                          "1px solid #eee",
                        borderRadius:
                          "22px",
                        overflow:
                          "hidden",
                        boxShadow:
                          "0 10px 30px rgba(0,0,0,0.07)",
                        transition:
                          "transform 0.25s ease, box-shadow 0.25s ease",
                      }}
                      onMouseEnter={(
                        event
                      ) => {
                        event.currentTarget.style.transform =
                          "translateY(-6px)";

                        event.currentTarget.style.boxShadow =
                          "0 18px 40px rgba(0,0,0,0.12)";
                      }}
                      onMouseLeave={(
                        event
                      ) => {
                        event.currentTarget.style.transform =
                          "translateY(0)";

                        event.currentTarget.style.boxShadow =
                          "0 10px 30px rgba(0,0,0,0.07)";
                      }}
                    >
                      {/* IMAGE */}

                      <div
                        style={{
                          height:
                            "205px",
                          position:
                            "relative",
                          overflow:
                            "hidden",
                        }}
                      >
                        <img
                          src={image}
                          alt={
                            restaurant?.name ||
                            "Restaurant"
                          }
                          loading="lazy"
                          onError={(
                            event
                          ) => {
                            event.currentTarget.src =
                              restaurantImages.default;
                          }}
                          style={{
                            width:
                              "100%",
                            height:
                              "100%",
                            objectFit:
                              "cover",
                            display:
                              "block",
                            transition:
                              "transform 0.5s ease",
                          }}
                          onMouseEnter={(
                            event
                          ) => {
                            event.currentTarget.style.transform =
                              "scale(1.06)";
                          }}
                          onMouseLeave={(
                            event
                          ) => {
                            event.currentTarget.style.transform =
                              "scale(1)";
                          }}
                        />

                        <div
                          style={{
                            position:
                              "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(transparent 45%, rgba(0,0,0,0.58))",
                            pointerEvents:
                              "none",
                          }}
                        />

                        {/* CATEGORY BADGE */}

                        <div
                          style={{
                            position:
                              "absolute",
                            top:
                              "14px",
                            left:
                              "14px",
                            padding:
                              "8px 11px",
                            borderRadius:
                              "10px",
                            background:
                              "rgba(255,255,255,0.95)",
                            color:
                              "#222",
                            fontSize:
                              "11px",
                            fontWeight:
                              "900",
                          }}
                        >
                          {getCategoryIcon(
                            category
                          )}{" "}
                          {category}
                        </div>

                        {/* RATING */}

                        <div
                          style={{
                            position:
                              "absolute",
                            bottom:
                              "14px",
                            left:
                              "14px",
                            padding:
                              "8px 11px",
                            borderRadius:
                              "10px",
                            background:
                              "#fff",
                            color:
                              "#222",
                            fontSize:
                              "12px",
                            fontWeight:
                              "900",
                          }}
                        >
                          ⭐{" "}
                          {rating >
                          0
                            ? rating.toFixed(
                                1
                              )
                            : "New"}
                        </div>

                        {/* FAST */}

                        <div
                          style={{
                            position:
                              "absolute",
                            bottom:
                              "14px",
                            right:
                              "14px",
                            padding:
                              "8px 11px",
                            borderRadius:
                              "10px",
                            background:
                              "#168b3a",
                            color:
                              "#fff",
                            fontSize:
                              "10px",
                            fontWeight:
                              "900",
                          }}
                        >
                          ⚡ FAST DELIVERY
                        </div>
                      </div>

                      {/* CONTENT */}

                      <div
                        style={{
                          padding:
                            "20px",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize:
                              "21px",
                            fontWeight:
                              "900",
                            letterSpacing:
                              "-0.4px",
                          }}
                        >
                          {restaurant?.name ||
                            "QuickBite Restaurant"}
                        </h3>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "6px",
                            marginTop:
                              "9px",
                            color:
                              "#777",
                            fontSize:
                              "13px",
                          }}
                        >
                          📍

                          <span
                            style={{
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {restaurant?.location ||
                              "Location unavailable"}
                          </span>
                        </div>

                        <p
                          style={{
                            margin:
                              "11px 0 0",
                            color:
                              "#888",
                            fontSize:
                              "13px",
                            lineHeight:
                              "1.5",
                          }}
                        >
                          Delicious meals •
                          Fast delivery •
                          Quality food
                        </p>

                        {/* CARD INFO */}

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            marginTop:
                              "16px",
                            paddingTop:
                              "15px",
                            borderTop:
                              "1px solid #eee",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color:
                                  "#aaa",
                                fontSize:
                                  "9px",
                                fontWeight:
                                  "900",
                                textTransform:
                                  "uppercase",
                              }}
                            >
                              Cuisine
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "3px",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  "800",
                              }}
                            >
                              {getCategoryIcon(
                                category
                              )}{" "}
                              {category}
                            </div>
                          </div>

                          <div
                            style={{
                              textAlign:
                                "right",
                            }}
                          >
                            <div
                              style={{
                                color:
                                  "#aaa",
                                fontSize:
                                  "9px",
                                fontWeight:
                                  "900",
                                textTransform:
                                  "uppercase",
                              }}
                            >
                              Rating
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "3px",
                                color:
                                  "#168b3a",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  "900",
                              }}
                            >
                              ⭐{" "}
                              {rating >
                              0
                                ? rating.toFixed(
                                    1
                                  )
                                : "New"}
                            </div>
                          </div>
                        </div>

                        {/* VIEW BUTTON */}

                        <button
                          onClick={() =>
                            viewMenu(
                              restaurant
                            )
                          }
                          style={{
                            width:
                              "100%",
                            marginTop:
                              "17px",
                            border:
                              "none",
                            borderRadius:
                              "10px",
                            padding:
                              "13px",
                            background:
                              "#111",
                            color:
                              "#fff",
                            fontSize:
                              "14px",
                            fontWeight:
                              "900",
                            cursor:
                              "pointer",
                            transition:
                              "all 0.2s ease",
                          }}
                          onMouseEnter={(
                            event
                          ) => {
                            event.currentTarget.style.background =
                              "#ff4d6d";
                          }}
                          onMouseLeave={(
                            event
                          ) => {
                            event.currentTarget.style.background =
                              "#111";
                          }}
                        >
                          View Restaurant →
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          HOME.JS STYLE OFFER SECTION
      ===================================================== */}

      <section
        style={{
          background: "#fff",
          padding:
            "20px 28px 70px",
        }}
      >
        <div
          style={{
            maxWidth: "1250px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "28px",
              padding:
                "45px 50px",
              background:
                "linear-gradient(135deg, #ff4d6d 0%, #ff758c 100%)",
              color: "#fff",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: "30px",
            }}
          >
            <div
              style={{
                position:
                  "absolute",
                width: "250px",
                height: "250px",
                borderRadius:
                  "50%",
                background:
                  "rgba(255,255,255,0.10)",
                right: "-70px",
                top: "-80px",
              }}
            />

            <div
              style={{
                position:
                  "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "900",
                  letterSpacing:
                    "1px",
                }}
              >
                QUICKBITE OFFER
              </div>

              <h2
                style={{
                  margin:
                    "8px 0 10px",
                  fontSize:
                    "clamp(28px, 4vw, 42px)",
                  lineHeight:
                    "1.1",
                  fontWeight:
                    "900",
                }}
              >
                Great food is
                <br />
                just one click away.
              </h2>

              <p
                style={{
                  margin: 0,
                  color:
                    "rgba(255,255,255,0.90)",
                  fontSize:
                    "14px",
                }}
              >
                Find a restaurant, choose your meal
                and enjoy a delicious QuickBite.
              </p>
            </div>

            <div
              style={{
                position:
                  "relative",
                zIndex: 1,
                fontSize:
                  "85px",
                transform:
                  "rotate(-8deg)",
              }}
            >
              🍕
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER - HOME.JS STYLE
      ===================================================== */}

      <footer
        style={{
          background: "#080808",
          color: "#fff",
          padding:
            "45px 28px 25px",
        }}
      >
        <div
          style={{
            maxWidth: "1250px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: "30px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize:
                    "28px",
                  fontWeight:
                    "900",
                }}
              >
                Quick
                <span
                  style={{
                    color:
                      "#ff4d6d",
                  }}
                >
                  Bite
                </span>
              </div>

              <p
                style={{
                  margin:
                    "8px 0 0",
                  color:
                    "#777",
                  fontSize:
                    "13px",
                }}
              >
                Delicious food. Delivered fast.
              </p>
            </div>

            <div>
              <div
                style={{
                  fontSize:
                    "12px",
                  color:
                    "#666",
                  fontWeight:
                    "900",
                  textTransform:
                    "uppercase",
                  marginBottom:
                    "10px",
                }}
              >
                Quick Links
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap:
                    "16px",
                }}
              >
                <button
                  onClick={() =>
                    (window.location.href =
                      "/")
                  }
                  style={{
                    border:
                      "none",
                    background:
                      "transparent",
                    color:
                      "#888",
                    cursor:
                      "pointer",
                    padding:
                      0,
                  }}
                >
                  Home
                </button>

                <button
                  onClick={() =>
                    (window.location.href =
                      "/orders")
                  }
                  style={{
                    border:
                      "none",
                    background:
                      "transparent",
                    color:
                      "#888",
                    cursor:
                      "pointer",
                    padding:
                      0,
                  }}
                >
                  My Orders
                </button>

                <button
                  onClick={() =>
                    (window.location.href =
                      "/track-order")
                  }
                  style={{
                    border:
                      "none",
                    background:
                      "transparent",
                    color:
                      "#888",
                    cursor:
                      "pointer",
                    padding:
                      0,
                  }}
                >
                  Track Order
                </button>

                <button
                  onClick={() =>
                    (window.location.href =
                      "/support")
                  }
                  style={{
                    border:
                      "none",
                    background:
                      "transparent",
                    color:
                      "#888",
                    cursor:
                      "pointer",
                    padding:
                      0,
                  }}
                >
                  Support
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop:
                "30px",
              paddingTop:
                "20px",
              borderTop:
                "1px solid rgba(255,255,255,0.08)",
              color:
                "#555",
              fontSize:
                "12px",
            }}
          >
            © {new Date().getFullYear()} QuickBite.
            All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Restaurants;