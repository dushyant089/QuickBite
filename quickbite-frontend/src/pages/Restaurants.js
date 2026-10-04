import React, { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import API_BASE_URL from "../config";

const API_BASE = API_BASE_URL.replace("/api", "");

const FOOD_VIDEO =
  "https://cdn.coverr.co/videos/coverr-a-chef-preparing-food-1578/1080p.mp4";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=90";

const restaurantImages = {
  "food factory":
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=90",

  "burger house":
    "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=90",

  "pizza point":
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=90",

  default:
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=90",
};

const getRestaurantImage = (restaurant) => {
  const name = String(restaurant?.name || "").toLowerCase();

  if (name.includes("food factory")) {
    return restaurantImages["food factory"];
  }

  if (name.includes("burger")) {
    return restaurantImages["burger house"];
  }

  if (name.includes("pizza")) {
    return restaurantImages["pizza point"];
  }

  return restaurantImages.default;
};

const getCategory = (restaurant) => {
  const name = String(restaurant?.name || "").toLowerCase();

  if (name.includes("pizza")) return "Pizza";
  if (name.includes("burger")) return "Burger";
  if (name.includes("chinese")) return "Chinese";
  if (name.includes("biryani")) return "Biryani";

  return "Restaurant";
};

const getCategoryIcon = (category) => {
  const icons = {
    Pizza: "🍕",
    Burger: "🍔",
    Chinese: "🥡",
    Biryani: "🍛",
    Restaurant: "🍽️",
  };

  return icons[category] || "🍽️";
};

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minRating, setMinRating] = useState("0");
  const [sortBy, setSortBy] = useState("default");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/api/restaurants`
        );

        if (!response.ok) {
          throw new Error("Unable to load restaurants");
        }

        const data = await response.json();

        setRestaurants(
          Array.isArray(data)
            ? data
            : data?.content || []
        );
      } catch (err) {
        console.error("Restaurant fetch error:", err);
        setError("Unable to load restaurants. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const categories = useMemo(() => {
    const unique = [];

    restaurants.forEach((restaurant) => {
      const category = getCategory(restaurant);

      if (!unique.includes(category)) {
        unique.push(category);
      }
    });

    return unique;
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants];

    const query = searchQuery.trim().toLowerCase();

    if (query) {
      result = result.filter((restaurant) => {
        const name = String(
          restaurant?.name || ""
        ).toLowerCase();

        const address = String(
          restaurant?.address || ""
        ).toLowerCase();

        const category = getCategory(
          restaurant
        ).toLowerCase();

        return (
          name.includes(query) ||
          address.includes(query) ||
          category.includes(query)
        );
      });
    }

    if (selectedCategory !== "All") {
      result = result.filter(
        (restaurant) =>
          getCategory(restaurant) ===
          selectedCategory
      );
    }

    const ratingValue =
      parseFloat(minRating) || 0;

    if (ratingValue > 0) {
      result = result.filter(
        (restaurant) =>
          Number(restaurant?.rating || 4.5) >=
          ratingValue
      );
    }

    if (sortBy === "ratingHigh") {
      result.sort(
        (a, b) =>
          Number(b?.rating || 4.5) -
          Number(a?.rating || 4.5)
      );
    }

    if (sortBy === "ratingLow") {
      result.sort(
        (a, b) =>
          Number(a?.rating || 4.5) -
          Number(b?.rating || 4.5)
      );
    }

    if (sortBy === "name") {
      result.sort((a, b) =>
        String(a?.name || "").localeCompare(
          String(b?.name || "")
        )
      );
    }

    return result;
  }, [
    restaurants,
    searchQuery,
    selectedCategory,
    minRating,
    sortBy,
  ]);

  const viewMenu = (restaurant) => {
    window.location.href =
      `/menu?restaurantId=${restaurant.id}`;
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setMinRating("0");
    setSortBy("default");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "#222",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        position: "relative",
        overflow: "hidden",
        background: "#111",
      }}
    >
      {/* =====================================================
          FULL PAGE BACKGROUND VIDEO
      ===================================================== */}

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
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

        {/* Home.js exact dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.58) 48%, rgba(0,0,0,0.25) 100%)",
          }}
        />

        {/* Pink glow */}
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

        <div
          style={{
            position: "absolute",
            width: "450px",
            height: "450px",
            borderRadius: "50%",
            left: "-180px",
            bottom: "-180px",
            background:
              "rgba(255,77,109,0.12)",
            filter: "blur(90px)",
          }}
        />
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div
        style={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <Navbar />

        {/* =====================================================
            HERO
        ===================================================== */}

        <section
          style={{
            minHeight: "650px",
            display: "flex",
            alignItems: "center",
            padding:
              "90px 28px 70px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1250px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                maxWidth: "800px",
              }}
            >
              {/* Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding:
                    "9px 15px",
                  borderRadius: "999px",
                  background:
                    "rgba(255,255,255,0.14)",
                  border:
                    "1px solid rgba(255,255,255,0.20)",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  backdropFilter:
                    "blur(12px)",
                  marginBottom: "22px",
                }}
              >
                <span>🍽️</span>
                <span>
                  DISCOVER GREAT FOOD
                </span>
              </div>

              <h1
                style={{
                  margin: 0,
                  color: "#fff",
                  fontSize:
                    "clamp(42px, 6vw, 76px)",
                  lineHeight: 1.05,
                  letterSpacing:
                    "-2.5px",
                  fontWeight: 900,
                }}
              >
                Explore{" "}
                <span
                  style={{
                    color: "#ff4d6d",
                  }}
                >
                  Restaurants
                </span>
                <br />
                near you
              </h1>

              <p
                style={{
                  margin:
                    "22px 0 30px",
                  color:
                    "rgba(255,255,255,0.86)",
                  fontSize: "18px",
                  lineHeight: 1.7,
                  maxWidth: "650px",
                }}
              >
                Discover delicious restaurants,
                explore amazing menus and order
                your favourite food with QuickBite.
              </p>

              {/* =================================================
                  HOME STYLE SEARCH BAR
              ================================================= */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background:
                    "rgba(255,255,255,0.97)",
                  borderRadius: "14px",
                  padding: "8px",
                  maxWidth: "700px",
                  boxShadow:
                    "0 20px 50px rgba(0,0,0,0.25)",
                }}
              >
                <span
                  style={{
                    fontSize: "21px",
                    paddingLeft: "12px",
                  }}
                >
                  🔎
                </span>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }
                  placeholder="Search restaurants, food or category..."
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: "none",
                    outline: "none",
                    background:
                      "transparent",
                    fontSize: "15px",
                    color: "#222",
                    padding:
                      "14px 5px",
                  }}
                />

                {searchQuery && (
                  <button
                    onClick={() =>
                      setSearchQuery("")
                    }
                    style={{
                      border: "none",
                      background:
                        "transparent",
                      color: "#777",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                  >
                    Clear
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
                    background:
                      "#ff4d6d",
                    color: "#fff",
                    padding:
                      "14px 22px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Search
                </button>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "28px",
                  marginTop: "30px",
                  color: "#fff",
                }}
              >
                <div>
                  <strong
                    style={{
                      fontSize: "24px",
                    }}
                  >
                    {restaurants.length}+
                  </strong>
                  <div
                    style={{
                      fontSize: "13px",
                      color:
                        "rgba(255,255,255,0.7)",
                      marginTop: "3px",
                    }}
                  >
                    Restaurants
                  </div>
                </div>

                <div>
                  <strong
                    style={{
                      fontSize: "24px",
                    }}
                  >
                    30 min
                  </strong>
                  <div
                    style={{
                      fontSize: "13px",
                      color:
                        "rgba(255,255,255,0.7)",
                      marginTop: "3px",
                    }}
                  >
                    Fast Delivery
                  </div>
                </div>

                <div>
                  <strong
                    style={{
                      fontSize: "24px",
                    }}
                  >
                    4.5★
                  </strong>
                  <div
                    style={{
                      fontSize: "13px",
                      color:
                        "rgba(255,255,255,0.7)",
                      marginTop: "3px",
                    }}
                  >
                    Average Rating
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            FILTER / CATEGORY AREA
        ===================================================== */}

        <section
          style={{
            background:
              "rgba(255,255,255,0.96)",
            padding:
              "55px 28px 25px",
            backdropFilter:
              "blur(12px)",
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
                color: "#ff4d6d",
                fontSize: "12px",
                fontWeight: 900,
                letterSpacing:
                  "1.5px",
                textTransform:
                  "uppercase",
                marginBottom: "8px",
              }}
            >
              Browse by category
            </div>

            <h2
              style={{
                margin:
                  "0 0 22px",
                fontSize:
                  "clamp(28px, 4vw, 42px)",
                letterSpacing:
                  "-1px",
              }}
            >
              Find what you're craving
            </h2>

            {/* Categories */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "28px",
              }}
            >
              <button
                onClick={() =>
                  setSelectedCategory(
                    "All"
                  )
                }
                style={{
                  border:
                    selectedCategory ===
                    "All"
                      ? "1px solid #ff4d6d"
                      : "1px solid #eee",
                  background:
                    selectedCategory ===
                    "All"
                      ? "#fff0f3"
                      : "#fff",
                  color:
                    selectedCategory ===
                    "All"
                      ? "#ff4d6d"
                      : "#333",
                  padding:
                    "12px 18px",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontWeight: 800,
                  boxShadow:
                    "0 6px 18px rgba(0,0,0,0.05)",
                }}
              >
                🍽️ All
              </button>

              {categories.map(
                (category) => (
                  <button
                    key={category}
                    onClick={() =>
                      setSelectedCategory(
                        category
                      )
                    }
                    style={{
                      border:
                        selectedCategory ===
                        category
                          ? "1px solid #ff4d6d"
                          : "1px solid #eee",
                      background:
                        selectedCategory ===
                        category
                          ? "#fff0f3"
                          : "#fff",
                      color:
                        selectedCategory ===
                        category
                          ? "#ff4d6d"
                          : "#333",
                      padding:
                        "12px 18px",
                      borderRadius:
                        "999px",
                      cursor: "pointer",
                      fontWeight: 800,
                      boxShadow:
                        "0 6px 18px rgba(0,0,0,0.05)",
                    }}
                  >
                    {getCategoryIcon(
                      category
                    )}{" "}
                    {category}
                  </button>
                )
              )}
            </div>

            {/* Filters */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <select
                value={minRating}
                onChange={(e) =>
                  setMinRating(
                    e.target.value
                  )
                }
                style={{
                  padding:
                    "12px 15px",
                  border:
                    "1px solid #eee",
                  borderRadius: "12px",
                  background: "#fff",
                  outline: "none",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <option value="0">
                  ⭐ Any Rating
                </option>
                <option value="4">
                  ⭐ 4.0+
                </option>
                <option value="4.5">
                  ⭐ 4.5+
                </option>
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value
                  )
                }
                style={{
                  padding:
                    "12px 15px",
                  border:
                    "1px solid #eee",
                  borderRadius: "12px",
                  background: "#fff",
                  outline: "none",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <option value="default">
                  Sort: Default
                </option>
                <option value="ratingHigh">
                  Rating: High to Low
                </option>
                <option value="ratingLow">
                  Rating: Low to High
                </option>
                <option value="name">
                  Name: A to Z
                </option>
              </select>

              {(searchQuery ||
                selectedCategory !==
                  "All" ||
                minRating !== "0" ||
                sortBy !==
                  "default") && (
                <button
                  onClick={
                    resetFilters
                  }
                  style={{
                    padding:
                      "12px 17px",
                    border:
                      "1px solid #ff4d6d",
                    background:
                      "#fff0f3",
                    color:
                      "#ff4d6d",
                    borderRadius:
                      "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            SEARCH STATUS
        ===================================================== */}

        <section
          id="restaurant-results"
          style={{
            background:
              "rgba(255,255,255,0.96)",
            padding:
              "0 28px 25px",
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
                background: "#fff7f8",
                border:
                  "1px solid #ffd7df",
                borderRadius: "16px",
                padding:
                  "16px 18px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background:
                      "#ff4d6d",
                    display: "inline-block",
                  }}
                />

                <span
                  style={{
                    fontWeight: 700,
                    color: "#444",
                  }}
                >
                  {searchQuery
                    ? `Showing results for "${searchQuery}"`
                    : "Explore our restaurant collection"}
                </span>
              </div>

              <span
                style={{
                  color: "#ff4d6d",
                  fontWeight: 900,
                  fontSize: "14px",
                }}
              >
                {filteredRestaurants.length}{" "}
                restaurants found
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            RESTAURANTS
        ===================================================== */}

        <section
          style={{
            background:
              "rgba(250,250,250,0.96)",
            padding:
              "30px 28px 80px",
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
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  color: "#ff4d6d",
                  fontSize: "12px",
                  fontWeight: 900,
                  letterSpacing:
                    "1.5px",
                  textTransform:
                    "uppercase",
                  marginBottom: "8px",
                }}
              >
                QuickBite restaurants
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize:
                    "clamp(28px, 4vw, 42px)",
                  letterSpacing:
                    "-1px",
                }}
              >
                Delicious places,
                <span
                  style={{
                    color: "#ff4d6d",
                  }}
                >
                  {" "}
                  ready for you
                </span>
              </h2>
            </div>

            {loading && (
              <div
                style={{
                  background:
                    "#fff",
                  border:
                    "1px solid #eee",
                  borderRadius: "22px",
                  padding: "50px",
                  textAlign: "center",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.07)",
                }}
              >
                <div
                  style={{
                    fontSize: "38px",
                    marginBottom:
                      "12px",
                  }}
                >
                  🍽️
                </div>

                <h3
                  style={{
                    margin:
                      "0 0 8px",
                  }}
                >
                  Loading restaurants...
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#777",
                  }}
                >
                  Finding delicious places
                  for you.
                </p>
              </div>
            )}

            {error && !loading && (
              <div
                style={{
                  background:
                    "#fff7f8",
                  border:
                    "1px solid #ffd7df",
                  borderRadius: "18px",
                  padding: "30px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "35px",
                  }}
                >
                  ⚠️
                </div>

                <h3>
                  Something went wrong
                </h3>

                <p
                  style={{
                    color: "#666",
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              filteredRestaurants.length ===
                0 && (
                <div
                  style={{
                    background:
                      "#fff",
                    border:
                      "1px solid #eee",
                    borderRadius: "22px",
                    padding: "55px 25px",
                    textAlign: "center",
                    boxShadow:
                      "0 10px 30px rgba(0,0,0,0.07)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "50px",
                      marginBottom:
                        "12px",
                    }}
                  >
                    🔍
                  </div>

                  <h3
                    style={{
                      margin:
                        "0 0 8px",
                    }}
                  >
                    No restaurants found
                  </h3>

                  <p
                    style={{
                      color: "#777",
                      margin:
                        "0 0 20px",
                    }}
                  >
                    Try another search or
                    reset your filters.
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
                        "13px 20px",
                      borderRadius:
                        "10px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}

            {!loading &&
              !error &&
              filteredRestaurants.length >
                0 && (
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
                      const category =
                        getCategory(
                          restaurant
                        );

                      const rating =
                        Number(
                          restaurant?.rating ||
                            4.5
                        );

                      return (
                        <div
                          key={
                            restaurant.id
                          }
                          style={{
                            background:
                              "rgba(255,255,255,0.98)",
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
                            e
                          ) => {
                            e.currentTarget.style.transform =
                              "translateY(-6px)";
                            e.currentTarget.style.boxShadow =
                              "0 18px 40px rgba(0,0,0,0.12)";
                          }}
                          onMouseLeave={(
                            e
                          ) => {
                            e.currentTarget.style.transform =
                              "translateY(0)";
                            e.currentTarget.style.boxShadow =
                              "0 10px 30px rgba(0,0,0,0.07)";
                          }}
                        >
                          {/* Image */}
                          <div
                            style={{
                              height:
                                "200px",
                              position:
                                "relative",
                              overflow:
                                "hidden",
                              backgroundImage: `url("${getRestaurantImage(
                                restaurant
                              )}")`,
                              backgroundSize:
                                "cover",
                              backgroundPosition:
                                "center",
                            }}
                          >
                            {/* Image overlay */}
                            <div
                              style={{
                                position:
                                  "absolute",
                                inset: 0,
                                background:
                                  "linear-gradient(180deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.72) 100%)",
                              }}
                            />

                            {/* Category badge */}
                            <div
                              style={{
                                position:
                                  "absolute",
                                top: "14px",
                                left: "14px",
                                background:
                                  "rgba(255,255,255,0.95)",
                                color:
                                  "#333",
                                padding:
                                  "7px 11px",
                                borderRadius:
                                  "999px",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  800,
                                backdropFilter:
                                  "blur(8px)",
                              }}
                            >
                              {
                                getCategoryIcon(
                                  category
                                )
                              }{" "}
                              {category}
                            </div>

                            {/* Rating */}
                            <div
                              style={{
                                position:
                                  "absolute",
                                top: "14px",
                                right: "14px",
                                background:
                                  "#1f9d55",
                                color:
                                  "#fff",
                                padding:
                                  "7px 10px",
                                borderRadius:
                                  "999px",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  900,
                              }}
                            >
                              ★{" "}
                              {rating.toFixed(
                                1
                              )}
                            </div>

                            {/* Fast delivery */}
                            <div
                              style={{
                                position:
                                  "absolute",
                                bottom: "14px",
                                left: "14px",
                                color:
                                  "#fff",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  800,
                                background:
                                  "rgba(0,0,0,0.45)",
                                padding:
                                  "7px 10px",
                                borderRadius:
                                  "999px",
                                backdropFilter:
                                  "blur(8px)",
                              }}
                            >
                              ⚡ FAST DELIVERY
                            </div>
                          </div>

                          {/* Card Content */}
                          <div
                            style={{
                              padding:
                                "20px",
                            }}
                          >
                            <h3
                              style={{
                                margin:
                                  "0 0 8px",
                                fontSize:
                                  "20px",
                                color:
                                  "#222",
                              }}
                            >
                              {
                                restaurant.name
                              }
                            </h3>

                            <p
                              style={{
                                margin:
                                  "0 0 8px",
                                color:
                                  "#666",
                                fontSize:
                                  "14px",
                                minHeight:
                                  "20px",
                              }}
                            >
                              {restaurant.address ||
                                "Delicious food & fast delivery"}
                            </p>

                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "8px",
                                color:
                                  "#777",
                                fontSize:
                                  "13px",
                                marginBottom:
                                  "18px",
                              }}
                            >
                              <span>
                                🕒
                              </span>
                              <span>
                                25–35 min
                              </span>

                              <span>
                                •
                              </span>

                              <span>
                                🚚 Free
                                delivery
                              </span>
                            </div>

                            <button
                              onClick={() =>
                                viewMenu(
                                  restaurant
                                )
                              }
                              style={{
                                width:
                                  "100%",
                                border:
                                  "none",
                                background:
                                  "#111",
                                color:
                                  "#fff",
                                padding:
                                  "13px 16px",
                                borderRadius:
                                  "10px",
                                fontWeight:
                                  800,
                                cursor:
                                  "pointer",
                                fontSize:
                                  "14px",
                              }}
                            >
                              View Restaurant
                              {" →"}
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
            OFFER CTA
        ===================================================== */}

        <section
          style={{
            background:
              "rgba(250,250,250,0.96)",
            padding:
              "0 28px 70px",
          }}
        >
          <div
            style={{
              maxWidth: "1250px",
              margin: "0 auto",
              background:
                "linear-gradient(135deg, #ff4d6d 0%, #ff758c 100%)",
              borderRadius: "28px",
              padding:
                "50px 40px",
              color: "#fff",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "25px",
              boxShadow:
                "0 20px 50px rgba(255,77,109,0.22)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 900,
                  letterSpacing:
                    "1.5px",
                  marginBottom: "10px",
                  opacity: 0.9,
                }}
              >
                QUICKBITE SPECIAL
              </div>

              <h2
                style={{
                  margin:
                    "0 0 10px",
                  fontSize:
                    "clamp(28px, 4vw, 42px)",
                }}
              >
                Hungry? Let's fix that.
              </h2>

              <p
                style={{
                  margin: 0,
                  opacity: 0.9,
                  fontSize: "16px",
                }}
              >
                Discover your next favourite
                restaurant with QuickBite.
              </p>
            </div>

            <button
              onClick={() =>
                window.location.href =
                  "/menu"
              }
              style={{
                border: "none",
                background:
                  "#fff",
                color: "#ff4d6d",
                padding:
                  "14px 22px",
                borderRadius: "12px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Explore Menu →
            </button>
          </div>
        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer
          style={{
            background:
              "rgba(8,8,8,0.97)",
            color: "#fff",
            padding:
              "45px 28px",
          }}
        >
          <div
            style={{
              maxWidth: "1250px",
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              justifyContent:
                "space-between",
              gap: "25px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  marginBottom:
                    "8px",
                }}
              >
                Quick
                <span
                  style={{
                    color: "#ff4d6d",
                  }}
                >
                  Bite
                </span>
              </div>

              <p
                style={{
                  margin: 0,
                  color:
                    "rgba(255,255,255,0.6)",
                  fontSize: "14px",
                }}
              >
                Good food. Fast delivery.
                Happy moments.
              </p>
            </div>

            <div
              style={{
                color:
                  "rgba(255,255,255,0.55)",
                fontSize: "13px",
              }}
            >
              © {new Date().getFullYear()}{" "}
              QuickBite. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Restaurants;