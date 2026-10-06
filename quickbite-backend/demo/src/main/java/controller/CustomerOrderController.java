package com.example.demo.controller;

import com.example.demo.model.MenuItem;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.repository.OrderRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000", "https://quickbite-frontend-beta.vercel.app"
})
public class CustomerOrderController {

    private final OrderRepository orderRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public CustomerOrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // =========================================================
    // CREATE ORDER
    // POST /api/orders
    // =========================================================

    @PostMapping
    @Transactional
    public ResponseEntity<?> createOrder(
            @RequestBody OrderRequest request,
            Authentication authentication
    ) {

        try {

            // -------------------------------------------------
            // AUTH CHECK
            // -------------------------------------------------

            if (authentication == null ||
                    authentication.getName() == null ||
                    authentication.getName().isBlank()) {

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "success", false,
                                "message", "Authentication is required."
                        ));
            }

            String loggedInEmail =
                    authentication.getName().trim().toLowerCase();

            // -------------------------------------------------
            // BASIC VALIDATION
            // -------------------------------------------------

            if (request == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message", "Order request is empty."
                        ));
            }

            if (request.customerName == null ||
                    request.customerName.isBlank()) {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message", "Customer name is required."
                        ));
            }

            if (request.phone == null ||
                    request.phone.isBlank()) {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message", "Phone number is required."
                        ));
            }

            if (request.address == null ||
                    request.address.isBlank()) {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message", "Delivery address is required."
                        ));
            }

            if (request.city == null ||
                    request.city.isBlank()) {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message", "City is required."
                        ));
            }

            if (request.pincode == null ||
                    request.pincode.isBlank()) {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message", "Pincode is required."
                        ));
            }

            if (request.paymentMethod == null ||
                    request.paymentMethod.isBlank()) {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message", "Payment method is required."
                        ));
            }

            if (request.totalPrice < 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message", "Invalid order total."
                        ));
            }

            if (request.items == null ||
                    request.items.isEmpty()) {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message", "Your order must contain at least one item."
                        ));
            }

            // -------------------------------------------------
            // CREATE ORDER
            // -------------------------------------------------

            Order order = new Order();

            /*
             * IMPORTANT:
             * Email is taken from the authenticated JWT user,
             * not blindly from the frontend request.
             */
            order.setCustomerEmail(loggedInEmail);

            order.setCustomerName(
                    request.customerName.trim()
            );

            order.setPhone(
                    request.phone.trim()
            );

            order.setAddress(
                    request.address.trim()
            );

            order.setCity(
                    request.city.trim()
            );

            order.setPincode(
                    request.pincode.trim()
            );

            order.setPaymentMethod(
                    request.paymentMethod.trim()
            );

            order.setTotalPrice(
                    request.totalPrice
            );

            // -------------------------------------------------
            // PAYMENT STATUS
            // -------------------------------------------------

            if (request.paymentMethod
                    .trim()
                    .equalsIgnoreCase("Cash on Delivery")) {

                order.setPaymentStatus("PENDING");

            } else {

                /*
                 * Online payment stays pending until Razorpay
                 * verification updates it.
                 */
                order.setPaymentStatus("PENDING");
            }

            // -------------------------------------------------
            // INITIAL ORDER STATUS
            // -------------------------------------------------

            order.setStatus("CONFIRMED");

            // -------------------------------------------------
            // ADD ORDER ITEMS
            // -------------------------------------------------

            List<OrderItem> orderItems =
                    new ArrayList<>();

            for (OrderItemRequest itemRequest :
                    request.items) {

                if (itemRequest == null ||
                        itemRequest.menuItemId == null) {

                    return ResponseEntity.badRequest()
                            .body(Map.of(
                                    "success", false,
                                    "message", "Invalid menu item in order."
                            ));
                }

                if (itemRequest.quantity <= 0) {

                    return ResponseEntity.badRequest()
                            .body(Map.of(
                                    "success", false,
                                    "message", "Item quantity must be greater than zero."
                            ));
                }

                // -------------------------------------------------
                // FIND MENU ITEM
                // -------------------------------------------------

                MenuItem menuItem =
                        entityManager.find(
                                MenuItem.class,
                                itemRequest.menuItemId
                        );

                if (menuItem == null) {

                    return ResponseEntity.badRequest()
                            .body(Map.of(
                                    "success", false,
                                    "message",
                                    "Menu item not found: "
                                            + itemRequest.menuItemId
                            ));
                }

                // -------------------------------------------------
                // USE CURRENT DATABASE PRICE
                // -------------------------------------------------

                double unitPrice =
                        menuItem.getPrice();

                OrderItem orderItem =
                        new OrderItem(
                                menuItem,
                                itemRequest.quantity,
                                unitPrice
                        );

                /*
                 * addOrderItem() automatically sets:
                 * orderItem.foodOrder = order
                 */
                order.addOrderItem(orderItem);

                orderItems.add(orderItem);
            }

            // -------------------------------------------------
            // SAVE ORDER
            // -------------------------------------------------

            Order savedOrder =
                    orderRepository.save(order);

            // -------------------------------------------------
            // RESPONSE
            // -------------------------------------------------

            return ResponseEntity.status(
                    HttpStatus.CREATED
            ).body(savedOrder);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.status(
                    HttpStatus.INTERNAL_SERVER_ERROR
            ).body(Map.of(
                    "success", false,
                    "message",
                    "Unable to create order.",
                    "error",
                    e.getMessage() == null
                            ? "Unknown server error"
                            : e.getMessage()
            ));
        }
    }

    // =========================================================
    // GET CURRENT CUSTOMER ORDERS
    // GET /api/orders
    // =========================================================

    @GetMapping
    public ResponseEntity<?> getMyOrders(
            Authentication authentication
    ) {

        try {

            if (authentication == null ||
                    authentication.getName() == null ||
                    authentication.getName().isBlank()) {

                return ResponseEntity.status(
                        HttpStatus.UNAUTHORIZED
                ).body(Map.of(
                        "success", false,
                        "message", "Authentication is required."
                ));
            }

            String email =
                    authentication.getName()
                            .trim()
                            .toLowerCase();

            List<Order> orders =
                    orderRepository.findAll()
                            .stream()
                            .filter(Objects::nonNull)
                            .filter(order ->
                                    order.getCustomerEmail() != null &&
                                    order.getCustomerEmail()
                                            .trim()
                                            .equalsIgnoreCase(email)
                            )
                            .collect(Collectors.toList());

            return ResponseEntity.ok(orders);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.status(
                    HttpStatus.INTERNAL_SERVER_ERROR
            ).body(Map.of(
                    "success", false,
                    "message", "Unable to load customer orders.",
                    "error", e.getMessage() == null
                            ? "Unknown server error"
                            : e.getMessage()
            ));
        }
    }

    // =========================================================
    // GET CURRENT CUSTOMER ORDERS
    // GET /api/orders/my
    // =========================================================

    @GetMapping("/my")
    public ResponseEntity<?> getMyOrdersAlias(
            Authentication authentication
    ) {
        return getMyOrders(authentication);
    }

    // =========================================================
    // GET ORDER BY ID
    // GET /api/orders/{id}
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(
            @PathVariable Long id,
            Authentication authentication
    ) {

        try {

            if (authentication == null ||
                    authentication.getName() == null ||
                    authentication.getName().isBlank()) {

                return ResponseEntity.status(
                        HttpStatus.UNAUTHORIZED
                ).body(Map.of(
                        "success", false,
                        "message", "Authentication is required."
                ));
            }

            Order order =
                    orderRepository.findById(id)
                            .orElse(null);

            if (order == null) {

                return ResponseEntity.status(
                        HttpStatus.NOT_FOUND
                ).body(Map.of(
                        "success", false,
                        "message", "Order not found."
                ));
            }

            String loggedInEmail =
                    authentication.getName()
                            .trim()
                            .toLowerCase();

            boolean isAdmin =
                    authentication.getAuthorities()
                            .stream()
                            .anyMatch(authority ->
                                    authority.getAuthority()
                                            .equalsIgnoreCase("ROLE_ADMIN")
                            );

            boolean isOwner =
                    order.getCustomerEmail() != null &&
                    order.getCustomerEmail()
                            .trim()
                            .equalsIgnoreCase(loggedInEmail);

            if (!isAdmin && !isOwner) {

                return ResponseEntity.status(
                        HttpStatus.FORBIDDEN
                ).body(Map.of(
                        "success", false,
                        "message",
                        "You are not authorized to view this order."
                ));
            }

            return ResponseEntity.ok(order);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.status(
                    HttpStatus.INTERNAL_SERVER_ERROR
            ).body(Map.of(
                    "success", false,
                    "message", "Unable to load order.",
                    "error", e.getMessage() == null
                            ? "Unknown server error"
                            : e.getMessage()
            ));
        }
    }

    // =========================================================
    // GET ORDERS BY EMAIL
    // GET /api/orders/user/{email}
    // =========================================================

    @GetMapping("/user/{email}")
    public ResponseEntity<?> getOrdersByUserEmail(
            @PathVariable String email,
            Authentication authentication
    ) {

        return getOrdersByEmail(
                email,
                authentication
        );
    }

    // =========================================================
    // GET ORDERS BY EMAIL
    // GET /api/orders/customer/{email}
    // =========================================================

    @GetMapping("/customer/{email}")
    public ResponseEntity<?> getOrdersByCustomerEmail(
            @PathVariable String email,
            Authentication authentication
    ) {

        return getOrdersByEmail(
                email,
                authentication
        );
    }

    // =========================================================
    // COMMON EMAIL FILTER
    // =========================================================

    private ResponseEntity<?> getOrdersByEmail(
            String email,
            Authentication authentication
    ) {

        try {

            if (authentication == null ||
                    authentication.getName() == null ||
                    authentication.getName().isBlank()) {

                return ResponseEntity.status(
                        HttpStatus.UNAUTHORIZED
                ).body(Map.of(
                        "success", false,
                        "message", "Authentication is required."
                ));
            }

            String loggedInEmail =
                    authentication.getName()
                            .trim()
                            .toLowerCase();

            String requestedEmail =
                    email == null
                            ? ""
                            : email.trim().toLowerCase();

            boolean isAdmin =
                    authentication.getAuthorities()
                            .stream()
                            .anyMatch(authority ->
                                    authority.getAuthority()
                                            .equalsIgnoreCase("ROLE_ADMIN")
                            );

            /*
             * Customer can only request his/her own orders.
             * Admin can request another customer's orders.
             */
            if (!isAdmin &&
                    !loggedInEmail.equals(requestedEmail)) {

                return ResponseEntity.status(
                        HttpStatus.FORBIDDEN
                ).body(Map.of(
                        "success", false,
                        "message",
                        "You are not authorized to view these orders."
                ));
            }

            List<Order> orders =
                    orderRepository.findAll()
                            .stream()
                            .filter(Objects::nonNull)
                            .filter(order ->
                                    order.getCustomerEmail() != null &&
                                    order.getCustomerEmail()
                                            .trim()
                                            .equalsIgnoreCase(requestedEmail)
                            )
                            .collect(Collectors.toList());

            return ResponseEntity.ok(orders);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.status(
                    HttpStatus.INTERNAL_SERVER_ERROR
            ).body(Map.of(
                    "success", false,
                    "message", "Unable to load orders.",
                    "error", e.getMessage() == null
                            ? "Unknown server error"
                            : e.getMessage()
            ));
        }
    }

    // =========================================================
    // REQUEST DTO
    // =========================================================

    public static class OrderRequest {

        private String customerEmail;
        private String customerName;
        private String phone;
        private String address;
        private String city;
        private String pincode;
        private String paymentMethod;
        private double totalPrice;
        private List<OrderItemRequest> items;

        public OrderRequest() {
        }

        public String getCustomerEmail() {
            return customerEmail;
        }

        public void setCustomerEmail(String customerEmail) {
            this.customerEmail = customerEmail;
        }

        public String getCustomerName() {
            return customerName;
        }

        public void setCustomerName(String customerName) {
            this.customerName = customerName;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getPincode() {
            return pincode;
        }

        public void setPincode(String pincode) {
            this.pincode = pincode;
        }

        public String getPaymentMethod() {
            return paymentMethod;
        }

        public void setPaymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
        }

        public double getTotalPrice() {
            return totalPrice;
        }

        public void setTotalPrice(double totalPrice) {
            this.totalPrice = totalPrice;
        }

        public List<OrderItemRequest> getItems() {
            return items;
        }

        public void setItems(List<OrderItemRequest> items) {
            this.items = items;
        }
    }

    // =========================================================
    // ORDER ITEM REQUEST DTO
    // =========================================================

    public static class OrderItemRequest {

        private Long menuItemId;
        private int quantity;

        public OrderItemRequest() {
        }

        public Long getMenuItemId() {
            return menuItemId;
        }

        public void setMenuItemId(Long menuItemId) {
            this.menuItemId = menuItemId;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
    }
}