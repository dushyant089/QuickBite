import React, { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../config";

const API_URL = `${API_BASE_URL}/restaurants`;


const emptyForm = {
  name: "",
  location: "",
  rating: "",
  imageUrl: "",
};

function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // FETCH RESTAURANTS
  // =========================

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load restaurants");
      }

      const data = await response.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Restaurants load nahi ho pa rahe hain.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================
  // ADD / UPDATE
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Restaurant name enter karo.");
      return;
    }

    if (!form.location.trim()) {
      alert("Restaurant location enter karo.");
      return;
    }

    const rating = Number(form.rating);

    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      alert("Rating 0 se 5 ke beech honi chahiye.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      rating: rating,
      imageUrl: form.imageUrl.trim(),
    };

    try {
      setSaving(true);
      setError("");

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save restaurant");
      }

      const savedRestaurant = await response.json();

      if (editingId) {
        setRestaurants((previous) =>
          previous.map((restaurant) =>
            restaurant.id === editingId
              ? savedRestaurant
              : restaurant
          )
        );
      } else {
        setRestaurants((previous) => [
          ...previous,
          savedRestaurant,
        ]);
      }

      setForm(emptyForm);
      setEditingId(null);

      alert(
        editingId
          ? "Restaurant updated successfully!"
          : "Restaurant added successfully!"
      );
    } catch (err) {
      console.error(err);
      setError("Restaurant save nahi ho pa raha hai.");
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // EDIT
  // =========================

  const handleEdit = (restaurant) => {
    setEditingId(restaurant.id);

    setForm({
      name: restaurant.name || "",
      location: restaurant.location || "",
      rating:
        restaurant.rating !== undefined &&
        restaurant.rating !== null
          ? String(restaurant.rating)
          : "",
      imageUrl: restaurant.imageUrl || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // CANCEL EDIT
  // =========================

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Kya aap is restaurant ko delete karna chahte ho?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete restaurant");
      }

      setRestaurants((previous) =>
        previous.filter((restaurant) => restaurant.id !== id)
      );

      alert("Restaurant deleted successfully!");
    } catch (err) {
      console.error(err);
      alert(
        "Restaurant delete nahi ho pa raha hai. Agar is restaurant ke menu items hain to pehle unhe check karo."
      );
    }
  };

  // =========================
  // FILTER
  // =========================

  const filteredRestaurants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return restaurants;
    }

    return restaurants.filter((restaurant) => {
      return (
        (restaurant.name || "")
          .toLowerCase()
          .includes(keyword) ||
        (restaurant.location || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [restaurants, search]);

  // =========================
  // STATS
  // =========================

  const averageRating =
    restaurants.length > 0
      ? (
          restaurants.reduce(
            (sum, restaurant) =>
              sum + Number(restaurant.rating || 0),
            0
          ) / restaurants.length
        ).toFixed(1)
      : "0.0";

  const restaurantsWithImages = restaurants.filter(
    (restaurant) =>
      restaurant.imageUrl &&
      restaurant.imageUrl.trim() !== ""
  ).length;

  // =========================
  // IMAGE FALLBACK
  // =========================

  const getImage = (restaurant) => {
    if (restaurant.imageUrl) {
      return restaurant.imageUrl;
    }

    const name = (
      restaurant.name || "restaurant"
    ).toLowerCase();

    if (name.includes("pizza")) {
      return "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80";
    }

    if (name.includes("burger")) {
      return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80";
    }

    if (
      name.includes("biryani") ||
      name.includes("rice")
    ) {
      return "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=80";
    }

    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =========================
          HEADER
      ========================= */}

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              Quick<span className="text-orange-500">Bite</span>
              <span className="ml-2 text-xs font-medium text-slate-500">
                ADMIN
              </span>
            </h1>

            <p className="mt-0.5 text-xs text-slate-500">
              Restaurant Management
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">

            <button
              onClick={() => {
                window.location.href = "/admin";
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 sm:px-4 sm:text-sm"
            >
              Dashboard
            </button>

            <button
              onClick={() => {
                window.location.href = "/admin/orders";
              }}
              className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 sm:block"
            >
              Orders
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("quickbite-admin");
                window.location.href = "/admin-login";
              }}
              className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 sm:px-4 sm:text-sm"
            >
              Logout
            </button>

          </div>
        </div>
      </header>

      {/* =========================
          MAIN
      ========================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* PAGE TITLE */}

        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-orange-500">
            MANAGEMENT PANEL
          </p>

          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Restaurants
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
            Add, update and manage all restaurants available
            on QuickBite.
          </p>
        </div>

        {/* =========================
            STATS
        ========================= */}

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-medium text-slate-500">
              Total Restaurants
            </p>

            <p className="mt-2 text-2xl font-black">
              {restaurants.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-medium text-slate-500">
              Average Rating
            </p>

            <p className="mt-2 text-2xl font-black text-yellow-400">
              ⭐ {averageRating}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-medium text-slate-500">
              With Images
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-400">
              {restaurantsWithImages}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-medium text-slate-500">
              Search Results
            </p>

            <p className="mt-2 text-2xl font-black text-orange-400">
              {filteredRestaurants.length}
            </p>
          </div>

        </div>

        {/* =========================
            FORM
        ========================= */}

        <section className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">

          <div className="border-b border-white/10 px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-4">

              <div>
                <h3 className="text-lg font-bold">
                  {editingId
                    ? "Edit Restaurant"
                    : "Add Restaurant"}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Restaurant information enter karo.
                </p>
              </div>

              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
                >
                  Cancel Edit
                </button>
              )}

            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4"
          >

            {/* NAME */}

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-400">
                Restaurant Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Pizza Palace"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-500"
              />
            </div>

            {/* LOCATION */}

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-400">
                Location
              </label>

              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Meerut"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-500"
              />
            </div>

            {/* RATING */}

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-400">
                Rating
              </label>

              <input
                type="number"
                name="rating"
                value={form.rating}
                onChange={handleChange}
                min="0"
                max="5"
                step="0.1"
                placeholder="4.5"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-500"
              />
            </div>

            {/* IMAGE */}

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-400">
                Restaurant Image URL
              </label>

              <input
                type="url"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-500"
              />
            </div>

            {/* IMAGE PREVIEW */}

            {form.imageUrl && (
              <div className="sm:col-span-2 lg:col-span-4">
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900 p-3">

                  <img
                    src={form.imageUrl}
                    alt="Restaurant preview"
                    className="h-20 w-28 rounded-xl object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <div>
                    <p className="text-sm font-semibold">
                      Image Preview
                    </p>

                    <p className="mt-1 max-w-xl truncate text-xs text-slate-500">
                      {form.imageUrl}
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* SUBMIT */}

            <div className="sm:col-span-2 lg:col-span-4">

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Restaurant"
                  : "Add Restaurant"}
              </button>

            </div>

          </form>
        </section>

        {/* =========================
            SEARCH
        ========================= */}

        <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h3 className="text-xl font-bold">
              Restaurant List
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {filteredRestaurants.length} restaurants showing
            </p>
          </div>

          <div className="w-full sm:max-w-sm">

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurant or location..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500"
            />

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* =========================
            LOADING
        ========================= */}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] py-20 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-orange-500" />

            <p className="text-sm text-slate-400">
              Loading restaurants...
            </p>
          </div>
        ) : filteredRestaurants.length === 0 ? (

          /* =========================
             EMPTY
          ========================= */

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-20 text-center">

            <div className="mb-4 text-5xl">
              🍽️
            </div>

            <h3 className="text-xl font-bold">
              No Restaurants Found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {search
                ? "Search ke liye koi restaurant nahi mila."
                : "Abhi koi restaurant available nahi hai."}
            </p>

          </div>

        ) : (

          /* =========================
             RESTAURANT LIST
          ========================= */

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">

            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto lg:block">

              <table className="w-full min-w-[950px]">

                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-left">

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Restaurant
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Location
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Rating
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      ID
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredRestaurants.map((restaurant) => (

                    <tr
                      key={restaurant.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.03]"
                    >

                      {/* RESTAURANT */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <img
                            src={getImage(restaurant)}
                            alt={restaurant.name}
                            className="h-14 w-16 rounded-xl object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
                            }}
                          />

                          <div>
                            <p className="font-semibold">
                              {restaurant.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              QuickBite Restaurant
                            </p>
                          </div>

                        </div>

                      </td>

                      {/* LOCATION */}

                      <td className="px-5 py-4 text-sm text-slate-400">
                        📍 {restaurant.location}
                      </td>

                      {/* RATING */}

                      <td className="px-5 py-4">

                        <span className="inline-flex rounded-lg bg-yellow-500/10 px-2.5 py-1 text-sm font-bold text-yellow-400">
                          ⭐{" "}
                          {Number(
                            restaurant.rating || 0
                          ).toFixed(1)}
                        </span>

                      </td>

                      {/* ID */}

                      <td className="px-5 py-4 text-xs text-slate-500">
                        #{restaurant.id}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              handleEdit(restaurant)
                            }
                            className="rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(restaurant.id)
                            }
                            className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {/* MOBILE / TABLET CARDS */}

            <div className="grid gap-4 p-4 lg:hidden">

              {filteredRestaurants.map((restaurant) => (

                <article
                  key={restaurant.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
                >

                  <div className="flex gap-4 p-4">

                    <img
                      src={getImage(restaurant)}
                      alt={restaurant.name}
                      className="h-24 w-28 shrink-0 rounded-xl object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
                      }}
                    />

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-2">

                        <div>
                          <h4 className="font-bold">
                            {restaurant.name}
                          </h4>

                          <p className="mt-1 text-xs text-slate-500">
                            #{restaurant.id}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-lg bg-yellow-500/10 px-2 py-1 text-xs font-bold text-yellow-400">
                          ⭐{" "}
                          {Number(
                            restaurant.rating || 0
                          ).toFixed(1)}
                        </span>

                      </div>

                      <p className="mt-3 text-sm text-slate-400">
                        📍 {restaurant.location}
                      </p>

                    </div>

                  </div>

                  <div className="grid grid-cols-2 border-t border-white/10">

                    <button
                      onClick={() =>
                        handleEdit(restaurant)
                      }
                      className="py-3 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/10"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(restaurant.id)
                      }
                      className="border-l border-white/10 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                    >
                      Delete
                    </button>

                  </div>

                </article>

              ))}

            </div>

          </section>

        )}

      </main>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="border-t border-white/10 py-8">

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">

          <p className="text-sm font-semibold">
            Quick<span className="text-orange-500">Bite</span>
          </p>

          <p className="mt-2 text-xs text-slate-600">
            Restaurant Management Panel
          </p>

        </div>

      </footer>

    </div>
  );
}

export default AdminRestaurants;