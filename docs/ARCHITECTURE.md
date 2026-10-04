# QuickBite — System Architecture

## 1. Architecture Overview

QuickBite follows a client-server architecture.


                    ┌──────────────────────┐
                    │      Customer        │
                    │  Restaurant Owner    │
                    │       Admin          │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │   Tailwind CSS       │
                    └──────────┬───────────┘
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │ Spring Boot Backend  │
                    │   REST Controllers   │
                    │ Spring Security/JWT  │
                    └───────┬───────┬──────┘
                            │       │
                   ┌────────┘       └──────────┐
                   ▼                           ▼
          ┌─────────────────┐         ┌─────────────────┐
          │     MySQL       │         │    Razorpay     │
          │    Database     │         │ Payment Gateway │
          └─────────────────┘         └─────────────────┘


## 2. Frontend Architecture

The frontend is built with React.

Main responsibilities:

* Rendering the user interface.
* Client-side routing.
* Managing authentication state.
* Managing cart state.
* Calling backend REST APIs.
* Displaying restaurants and menus.
* Displaying order information.
* Handling checkout and payment UI.
* Displaying order tracking.
* Providing role-specific dashboards.

### Main Frontend Areas

quickbite-frontend/
└── src/
    ├── components/
    ├── pages/
    ├── config.js
    └── ...

`config.js` provides the API base URL through:

REACT_APP_API_URL

This allows the frontend to work with both local and production backend URLs.

## 3. Backend Architecture

The backend is implemented using Spring Boot.

Main responsibilities:

* REST API handling.
* Authentication.
* Authorization.
* User management.
* Restaurant management.
* Menu management.
* Order processing.
* Payment integration.
* Database operations.

The backend follows a layered approach:

Controller
    ↓
Service
    ↓
Repository
    ↓
Database

## 4. Security Architecture

QuickBite uses JWT-based authentication.

General flow:

User Login
    ↓
Authentication / OTP Verification
    ↓
Backend Generates JWT
    ↓
Frontend Stores Authentication State
    ↓
JWT Sent With Protected API Requests
    ↓
JWT Filter Validates Token
    ↓
Role-Based Authorization

Supported roles:

CUSTOMER
RESTAURANT_OWNER
ADMIN

The JWT signing secret is loaded from the `JWT_SECRET` environment variable and is not stored directly in source code.

## 5. Database Architecture

QuickBite uses MySQL with JPA/Hibernate.

Important database areas include:

* Users
* Restaurants
* Menu Items
* Orders
* Order Items
* Password Reset Tokens

Hibernate/JPA handles object-relational mapping between Java entities and database tables.

## 6. Payment Architecture

Razorpay is used for online payments.

General flow:

Customer
   ↓
Checkout
   ↓
Frontend requests payment order
   ↓
Spring Boot Payment API
   ↓
Razorpay
   ↓
Payment Order
   ↓
Razorpay Checkout
   ↓
Payment Completed
   ↓
Payment Verification API
   ↓
Order Confirmation

Razorpay credentials are supplied through environment variables.

## 7. Order Architecture

The order process follows:

Cart
 ↓
Checkout
 ↓
Create Order
 ↓
Payment
 ↓
Payment Verification
 ↓
Order Confirmation
 ↓
Restaurant Processing
 ↓
Delivery
 ↓
Delivered

Order statuses include:

CONFIRMED
PREPARING
OUT_FOR_DELIVERY
DELIVERED
CANCELLED


## 8. API Configuration

Local frontend:

http://localhost:3000

Local backend:

http://localhost:8080


Local API base:


http://localhost:8080/api


Production frontend should use:

REACT_APP_API_URL=<production-backend-url>/api

## 9. Deployment Architecture

Target production architecture:


                    Internet
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       ┌───────────┐       ┌────────────┐
       │  Vercel   │       │  Railway   │
       │  React    │──────▶│ Spring Boot│
       │ Frontend  │ REST  │  Backend   │
       └───────────┘       └─────┬──────┘
                                 │
                                 ▼
                           ┌────────────┐
                           │   MySQL    │
                           │  Database  │
                           └────────────┘

                                 │
                                 ▼
                           ┌────────────┐
                           │  Razorpay  │
                           └────────────┘

## 10. Environment Configuration

Sensitive configuration must be provided through environment variables.

Examples:

DB_USERNAME
DB_PASSWORD
JWT_SECRET
QUICKBITE_MAIL_USERNAME
QUICKBITE_MAIL_PASSWORD
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
QUICKBITE_ADMIN_EMAIL
QUICKBITE_ADMIN_PASSWORD

Actual values must never be committed to GitHub.
