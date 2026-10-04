import React, { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../config";

const MENU_API = `${API_BASE_URL}/menuitems`;
const RESTAURANT_API = `${API_BASE_URL}/restaurants`;

const categories = [
  "Pizza",
  "Burgers",
  "Chicken",
  "Sandwiches",
  "Snacks",
  "Rice & Biryani",
  "Noodles",
  "Momos",
  "Desserts",
  "Drinks",
  "Others",
];

const emptyForm = {
  itemName: "",
  category: "Burgers",
  price: "",
  imageUrl: "",
  restaurantId: "",
};

function AdminMenuItems() {
  const [menuItems, setMenuItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    document.title = "Manage Food | QuickBite";

    const admin = localStorage.getItem("quickbite-admin");

    if (!admin) {
      window.location.href = "/admin-login";
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [menuResponse, restaurantResponse] =
        await Promise.all([
          fetch(MENU_API),
          fetch(RESTAURANT_API),
        ]);

      if (!menuResponse.ok) {
        throw new Error("Unable to load food items");
      }

      if (!restaurantResponse.ok) {
        throw new Error("Unable to load restaurants");
      }

      const menuData = await menuResponse.json();
      const restaurantData = await restaurantResponse.json();

      setMenuItems(menuData);
      setRestaurants(restaurantData);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load food data. Please make sure QuickBite backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return menuItems;
    }

    return menuItems.filter((item) => {
      const itemName =
        item.itemName?.toLowerCase() || "";

      const category =
        item.category?.toLowerCase() || "";

      const restaurant =
        item.restaurant?.name?.toLowerCase() || "";

      const price = String(item.price || "");

      return (
        itemName.includes(searchText) ||
        category.includes(searchText) ||
        restaurant.includes(searchText) ||
        price.includes(searchText)
      );
    });
  }, [menuItems, search]);

  const totalItems = menuItems.length;

  const restaurantCount = new Set(
    menuItems
      .map((item) => item.restaurant?.id)
      .filter(Boolean)
  ).size;

  const averagePrice =
    totalItems > 0
      ? (
          menuItems.reduce(
            (sum, item) =>
              sum + Number(item.price || 0),
            0
          ) / totalItems
        ).toFixed(0)
      : 0;

  const openAddModal = () => {
    setEditingItem(null);

    setForm({
      ...emptyForm,
      restaurantId:
        restaurants.length > 0
          ? String(restaurants[0].id)
          : "",
    });

    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);

    setForm({
      itemName: item.itemName || "",
      category: item.category || "Others",
      price:
        item.price !== undefined
          ? String(item.price)
          : "",
      imageUrl: item.imageUrl || "",
      restaurantId: item.restaurant?.id
        ? String(item.restaurant.id)
        : "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.itemName.trim()) {
      alert("Please enter food name.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    if (!form.restaurantId) {
      alert("Please select a restaurant.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        itemName: form.itemName.trim(),
        category: form.category,
        price: Number(form.price),
        imageUrl: form.imageUrl.trim(),
        restaurant: {
          id: Number(form.restaurantId),
        },
      };

      const url = editingItem
        ? `${MENU_API}/${editingItem.id}`
        : MENU_API;

      const method = editingItem
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          editingItem
            ? "Unable to update food"
            : "Unable to add food"
        );
      }

      await loadData();

      closeModal();

      alert(
        editingItem
          ? "Food item updated successfully!"
          : "Food item added successfully!"
      );
    } catch (err) {
      console.error(err);

      alert(
        editingItem
          ? "Unable to update food item."
          : "Unable to add food item."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.itemName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${MENU_API}/${item.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to delete food");
      }

      setMenuItems((previous) =>
        previous.filter(
          (menuItem) =>
            menuItem.id !== item.id
        )
      );

      alert("Food item deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Unable to delete food item.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <button
              onClick={() =>
                (window.location.href = "/admin")
              }
              className="text-sm font-semibold text-gray-400 transition hover:text-white"
            >
              ← Back to Dashboard
            </button>

            <h1 className="mt-1 text-2xl font-black">
              🍔 Manage Food
            </h1>

            <p className="text-sm text-gray-500">
              Add, edit and manage QuickBite menu items
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="hidden rounded-xl border border-gray-700 px-4 py-2 font-semibold text-gray-300 transition hover:border-gray-500 hover:bg-gray-900 sm:block"
            >
              ↻ Refresh
            </button>

            <button
              onClick={openAddModal}
              className="rounded-xl bg-orange-500 px-5 py-2.5 font-bold text-white shadow-lg shadow-orange-500/10 transition hover:bg-orange-600"
            >
              + Add Food
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm font-semibold text-gray-500">
              Total Food Items
            </p>

            <p className="mt-2 text-3xl font-black">
              {totalItems}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm font-semibold text-gray-500">
              Restaurants With Food
            </p>

            <p className="mt-2 text-3xl font-black">
              {restaurantCount}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm font-semibold text-gray-500">
              Average Food Price
            </p>

            <p className="mt-2 text-3xl font-black">
              ₹{averagePrice}
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center rounded-xl border border-gray-800 bg-gray-950 px-4">
            <span className="text-xl">
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search food, category, restaurant or price..."
              className="w-full bg-transparent px-3 py-3 text-white outline-none placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
          {loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-orange-500"></div>

              <p className="mt-4 font-semibold text-gray-400">
                Loading food items...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl">
                🍽️
              </div>

              <h3 className="mt-4 text-xl font-black">
                No food items found
              </h3>

              <p className="mt-2 text-gray-500">
                Try another search or add a new food item.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="border-b border-gray-800 bg-gray-950">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Food
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Category
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Price
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Restaurant
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Image
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-800">
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="transition hover:bg-gray-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold">
                            {item.itemName}
                          </div>

                          <div className="mt-1 text-xs text-gray-600">
                            ID #{item.id}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
                            {item.category || "Others"}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-bold">
                          ₹{Number(item.price || 0)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold">
                            {item.restaurant?.name ||
                              "QuickBite Restaurant"}
                          </div>

                          <div className="text-xs text-gray-500">
                            {item.restaurant?.location ||
                              "India"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.itemName}
                              className="h-14 w-20 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <span className="text-xs text-gray-600">
                              No image
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                openEditModal(item)
                              }
                              className="rounded-lg border border-gray-700 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-blue-500 hover:text-blue-400"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                deleteItem(item)
                              }
                              className="rounded-lg border border-gray-700 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-red-500 hover:text-red-400"
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

              {/* MOBILE CARDS */}
              <div className="space-y-4 p-4 md:hidden">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-800 bg-gray-950 p-4"
                  >
                    <div className="flex gap-4">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          className="h-20 w-20 rounded-xl object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-900 text-2xl">
                          🍽️
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="font-black">
                          {item.itemName}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-orange-400">
                          ₹{Number(item.price || 0)}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.restaurant?.name ||
                            "QuickBite Restaurant"}
                        </p>

                        <span className="mt-2 inline-block rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-400">
                          {item.category || "Others"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() =>
                          openEditModal(item)
                        }
                        className="flex-1 rounded-lg border border-gray-700 py-2 text-sm font-semibold text-gray-300"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteItem(item)
                        }
                        className="flex-1 rounded-lg border border-gray-700 py-2 text-sm font-semibold text-gray-300 hover:border-red-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gray-800 bg-gray-900 shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-gray-800 p-6">
              <div>
                <h2 className="text-2xl font-black">
                  {editingItem
                    ? "Edit Food Item"
                    : "Add New Food"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add food details for the QuickBite menu
                </p>
              </div>

              <button
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800 text-xl text-gray-400 transition hover:bg-gray-700 hover:text-white"
              >
                ×
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {/* FOOD NAME */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-300">
                  Food Name
                </label>

                <input
                  type="text"
                  name="itemName"
                  value={form.itemName}
                  onChange={handleChange}
                  placeholder="e.g. Paneer Burger"
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                />
              </div>

              {/* CATEGORY + PRICE */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-300">
                    Category
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                  >
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-300">
                    Price
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="1"
                    placeholder="145"
                    className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                  />
                </div>
              </div>

              {/* RESTAURANT */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-300">
                  Restaurant
                </label>

                <select
                  name="restaurantId"
                  value={form.restaurantId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                >
                  <option value="">
                    Select Restaurant
                  </option>

                  {restaurants.map((restaurant) => (
                    <option
                      key={restaurant.id}
                      value={restaurant.id}
                    >
                      {restaurant.name} —{" "}
                      {restaurant.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* IMAGE URL */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-300">
                  Food Image URL
                </label>

                <input
                  type="url"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/food-image.jpg"
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                />

                <p className="mt-2 text-xs text-gray-600">
                  Paste a direct image URL. Leave empty to use
                  QuickBite's default food image.
                </p>
              </div>

              {/* IMAGE PREVIEW */}
              {form.imageUrl && (
                <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950">
                  <p className="border-b border-gray-800 px-4 py-3 text-sm font-bold text-gray-400">
                    Image Preview
                  </p>

                  <div className="p-4">
                    <img
                      src={form.imageUrl}
                      alt="Food preview"
                      className="h-52 w-full rounded-xl object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-gray-700 px-6 py-3 font-bold text-gray-300 transition hover:bg-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white shadow-lg shadow-orange-500/10 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingItem
                    ? "Update Food"
                    : "Add Food"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMenuItems;