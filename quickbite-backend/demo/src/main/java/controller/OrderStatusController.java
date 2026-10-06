package com.example.demo.controller;

import com.example.demo.model.Order;
import com.example.demo.repository.OrderRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000", "https://quickbite-frontend-beta.vercel.app"
})
public class OrderStatusController {

    private final OrderRepository orderRepository;

    public OrderStatusController(
            OrderRepository orderRepository
    ) {
        this.orderRepository = orderRepository;
    }

    // =========================================================
    // UPDATE ORDER STATUS
    // PUT /api/orders/{id}/status
    // =========================================================

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request,
            Authentication authentication
    ) {

        try {

            // -------------------------------------------------
            // AUTH CHECK
            // -------------------------------------------------

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

            // -------------------------------------------------
            // ROLE CHECK
            // -------------------------------------------------

            boolean isAdmin =
                    authentication.getAuthorities()
                            .stream()
                            .anyMatch(authority ->
                                    authority.getAuthority()
                                            .equalsIgnoreCase(
                                                    "ROLE_ADMIN"
                                            )
                            );

            boolean isOwner =
                    authentication.getAuthorities()
                            .stream()
                            .anyMatch(authority ->
                                    authority.getAuthority()
                                            .equalsIgnoreCase(
                                                    "ROLE_RESTAURANT_OWNER"
                                            )
                            );

            // -------------------------------------------------
            // FIND ORDER
            // -------------------------------------------------

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

            // -------------------------------------------------
            // REQUEST VALIDATION
            // -------------------------------------------------

            if (request == null ||
                    request.getStatus() == null ||
                    request.getStatus().isBlank()) {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message", "Order status is required."
                        ));
            }

            String newStatus =
                    request.getStatus()
                            .trim()
                            .toUpperCase();

            // -------------------------------------------------
            // ALLOWED STATUS
            // -------------------------------------------------

            boolean validStatus =
                    newStatus.equals("CONFIRMED") ||
                    newStatus.equals("PREPARING") ||
                    newStatus.equals("OUT_FOR_DELIVERY") ||
                    newStatus.equals("DELIVERED") ||
                    newStatus.equals("CANCELLED");

            if (!validStatus) {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message",
                                "Invalid order status."
                        ));
            }

            // -------------------------------------------------
            // CUSTOMER PERMISSION
            // -------------------------------------------------

            if (!isAdmin && !isOwner) {

                String loggedInEmail =
                        authentication.getName()
                                .trim()
                                .toLowerCase();

                boolean isCustomerOrder =
                        order.getCustomerEmail() != null &&
                        order.getCustomerEmail()
                                .trim()
                                .equalsIgnoreCase(
                                        loggedInEmail
                                );

                /*
                 * Customers are allowed to cancel
                 * their own orders only.
                 */
                if (!isCustomerOrder ||
                        !newStatus.equals("CANCELLED")) {

                    return ResponseEntity.status(
                            HttpStatus.FORBIDDEN
                    ).body(Map.of(
                            "success", false,
                            "message",
                            "You are not authorized to update this order."
                    ));
                }

                /*
                 * Customers can cancel only before
                 * delivery progress has advanced.
                 */
                String currentStatus =
                        order.getStatus() == null
                                ? ""
                                : order.getStatus()
                                        .trim()
                                        .toUpperCase();

                if (!currentStatus.equals("CONFIRMED") &&
                        !currentStatus.equals("PREPARING")) {

                    return ResponseEntity.status(
                            HttpStatus.BAD_REQUEST
                    ).body(Map.of(
                            "success", false,
                            "message",
                            "This order can no longer be cancelled."
                    ));
                }
            }

            // -------------------------------------------------
            // UPDATE
            // -------------------------------------------------

            order.setStatus(newStatus);

            Order updatedOrder =
                    orderRepository.save(order);

            // -------------------------------------------------
            // RESPONSE
            // -------------------------------------------------

            return ResponseEntity.ok(updatedOrder);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.status(
                    HttpStatus.INTERNAL_SERVER_ERROR
            ).body(Map.of(
                    "success", false,
                    "message",
                    "Unable to update order status.",
                    "error",
                    e.getMessage() == null
                            ? "Unknown server error"
                            : e.getMessage()
            ));
        }
    }

    // =========================================================
    // STATUS REQUEST DTO
    // =========================================================

    public static class StatusRequest {

        private String status;

        public StatusRequest() {
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}