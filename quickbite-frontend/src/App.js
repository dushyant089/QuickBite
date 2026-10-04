import React from "react";

import Home from "./pages/Home";
import Restaurants from "./pages/Restaurants";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import TrackOrder from "./pages/TrackOrder";
import Support from "./pages/Support";
import OrderManagement from "./pages/OrderManagement";

import RestaurantOwner from "./pages/RestaurantOwner";
import RestaurantOwnerLogin from "./pages/RestaurantOwnerLogin";
import RestaurantOwnerRegister from "./pages/RestaurantOwnerRegister";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminCustomers from "./pages/AdminCustomers";
import AdminRestaurants from "./pages/AdminRestaurants";
import AdminMenuItems from "./pages/AdminMenuItems";

function App() {
    const path = window.location.pathname;

    // =========================================
    // ADMIN LOGIN
    // =========================================
    if (path === "/admin-login") {
        return <AdminLogin />;
    }

    // =========================================
    // ADMIN DASHBOARD
    // =========================================
    if (path === "/admin") {
        const admin = localStorage.getItem("quickbite-admin");

        if (!admin) {
            window.location.href = "/admin-login";
            return null;
        }

        return <AdminDashboard />;
    }

    // =========================================
    // ADMIN ORDERS
    // =========================================
    if (path === "/admin/orders") {
        const admin = localStorage.getItem("quickbite-admin");

        if (!admin) {
            window.location.href = "/admin-login";
            return null;
        }

        return <AdminOrders />;
    }

    // =========================================
    // ADMIN CUSTOMERS
    // =========================================
    if (path === "/admin/customers") {
        const admin = localStorage.getItem("quickbite-admin");

        if (!admin) {
            window.location.href = "/admin-login";
            return null;
        }

        return <AdminCustomers />;
    }

    // =========================================
    // ADMIN RESTAURANTS
    // =========================================
    if (path === "/admin/restaurants") {
        const admin = localStorage.getItem("quickbite-admin");

        if (!admin) {
            window.location.href = "/admin-login";
            return null;
        }

        return <AdminRestaurants />;
    }

    // =========================================
    // ADMIN MENU ITEMS
    // =========================================
    if (path === "/admin/menu-items") {
        const admin = localStorage.getItem("quickbite-admin");

        if (!admin) {
            window.location.href = "/admin-login";
            return null;
        }

        return <AdminMenuItems />;
    }

    // =========================================
    // RESTAURANT OWNER LOGIN
    // =========================================
    if (path === "/restaurant-owner-login") {
        return <RestaurantOwnerLogin />;
    }

    // =========================================
    // RESTAURANT OWNER REGISTER
    // =========================================
    if (path === "/restaurant-owner-register") {
        return <RestaurantOwnerRegister />;
    }

    // =========================================
    // RESTAURANT OWNER PANEL
    // =========================================
    if (path === "/restaurant-owner") {
        const owner = localStorage.getItem("quickbite-owner");

        if (!owner) {
            window.location.href = "/restaurant-owner-login";
            return null;
        }

        return <RestaurantOwner />;
    }

    // =========================================
    // ORDER MANAGEMENT
    // =========================================
    if (path === "/order-management") {
        return <OrderManagement />;
    }

    // =========================================
    // AUTH ROUTES
    // =========================================
    if (
        path === "/login" ||
        path === "/signup" ||
        path === "/forgot-password"
    ) {
        return <Auth />;
    }

    // =========================================
    // CUSTOMER PROFILE
    // =========================================
    if (path === "/profile") {
        return <Profile />;
    }

    // =========================================
    // CUSTOMER MENU
    // =========================================
    if (path === "/menu") {
        return <Menu />;
    }

    // =========================================
    // CUSTOMER CART
    // =========================================
    if (path === "/cart") {
        return <Cart />;
    }

    // =========================================
    // CHECKOUT
    // =========================================
    if (path === "/checkout") {
        return <Checkout />;
    }

    // =========================================
    // ORDER SUCCESS
    // =========================================
    if (path === "/order-success") {
        return <OrderSuccess />;
    }

    // =========================================
    // MY ORDERS
    // =========================================
    if (path === "/orders") {
        return <Orders />;
    }

    // =========================================
    // TRACK ORDER
    // =========================================
    if (path === "/track-order") {
        return <TrackOrder />;
    }

    // =========================================
    // RESTAURANTS
    // =========================================
    if (path === "/restaurants") {
        return <Restaurants />;
    }

    // =========================================
    // SUPPORT / HELP CENTER
    // =========================================
    if (path === "/support") {
        return <Support />;
    }

    // =========================================
    // HOME
    // =========================================
    return <Home />;
}

export default App;