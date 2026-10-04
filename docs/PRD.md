# QuickBite — Product Requirements Document

## 1. Product Overview

QuickBite is a full-stack food delivery web application that allows customers to discover restaurants, browse menus, add food items to a cart, place orders, make online payments, and track their orders.

The platform also provides dedicated capabilities for restaurant owners and administrators to manage restaurants, menus, orders, and users.

## 2. Product Goals

* Provide a smooth online food ordering experience.
* Allow customers to discover restaurants and menu items.
* Support secure authentication using email and mobile OTP.
* Enable online payments through Razorpay.
* Provide real-time-style order status tracking.
* Give restaurant owners tools to manage incoming orders.
* Give administrators centralized platform management.
* Provide a responsive and modern user interface.

## 3. User Roles

### Customer

Customers can:

* Register and log in.
* Verify their account using email/mobile OTP.
* Browse restaurants.
* View restaurant menus.
* Add food items to the cart.
* Increase or decrease item quantities.
* Place orders.
* Make online payments.
* View previous orders.
* Track active orders.
* View order details.
* Manage their profile.

### Restaurant Owner

Restaurant owners can:

* Register and log in.
* Verify authentication using OTP.
* Access the restaurant owner dashboard.
* View incoming orders.
* Monitor order information.
* Manage restaurant-related operations.

### Administrator

Administrators can:

* Log in securely.
* View platform information.
* Manage customers.
* Manage restaurants.
* Manage menu items.
* Monitor orders.
* Access administrative dashboards.

## 4. Core Features

### Authentication

* Email-based authentication.
* Mobile OTP authentication.
* Role-based access.
* JWT-based authorization.
* Customer, restaurant owner, and administrator roles.

### Restaurant Discovery

* Restaurant listing.
* Restaurant information.
* Restaurant selection.
* Menu browsing.

### Menu

* Display menu items.
* Display food information.
* Add items to cart.
* Manage cart quantities.

### Cart

* Add food items.
* Increase/decrease quantities.
* Remove items.
* Calculate subtotal.
* Calculate delivery charges.
* Calculate final order total.

### Checkout

* Customer order information.
* Order summary.
* Online payment integration.
* Razorpay payment processing.
* Payment verification.

### Orders

* Create orders.
* Store order items.
* View order history.
* View order details.
* Display order status.

### Order Tracking

Supported order lifecycle:

CONFIRMED
    ↓
PREPARING
    ↓
OUT_FOR_DELIVERY
    ↓
DELIVERED


Cancelled orders are also supported.

### Restaurant Owner Dashboard

* Owner authentication.
* Dashboard interface.
* Incoming order management.
* Order status monitoring.

### Admin Dashboard

* Customer management.
* Restaurant management.
* Menu item management.
* Order management.
* Administrative overview.

## 5. Non-Functional Requirements

### Security

* Passwords must never be committed to source control.
* API secrets must be stored through environment variables.
* JWT signing secrets must be externalized.
* Payment credentials must remain private.
* Database credentials must remain private.
* Authentication and authorization must be enforced for protected APIs.

### Performance

* Minimize unnecessary API requests.
* Use optimized React components.
* Keep frontend production builds deployable.
* Use appropriate database queries.

### Responsiveness

The application should work across:

* Desktop
* Laptop
* Tablet
* Mobile

## 6. Technology Stack

### Frontend

* React
* JavaScript
* Tailwind CSS
* HTML
* CSS
* React Router

### Backend

* Java
* Spring Boot
* Spring Security
* JWT
* REST APIs
* Maven

### Database

* MySQL
* Hibernate/JPA

### Payment

* Razorpay

### Deployment Target

* GitHub for source control
* Vercel for frontend
* Railway for backend and database

## 7. Success Criteria

The product is considered functional when:

* Users can authenticate successfully.
* Customers can browse restaurants and menus.
* Customers can create carts and orders.
* Razorpay payments can be processed successfully.
* Orders are stored correctly.
* Customers can view and track orders.
* Restaurant owners can access their dashboard.
* Administrators can manage platform data.
* Production builds complete successfully.
* Secrets are not exposed in the Git repository.
