package com.example.demo.controller;

import com.example.demo.model.Order;
import com.example.demo.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000", "https://quickbite-frontend-beta.vercel.app"
})
public class AdminOrderController {

    private final OrderRepository orderRepository;

    public AdminOrderController(
            OrderRepository orderRepository
    ) {
        this.orderRepository = orderRepository;
    }

    // =========================================================
    // ADMIN - GET ALL ORDERS
    // GET /api/orders/admin
    // =========================================================
    @GetMapping("/admin")
    public ResponseEntity<List<Order>> getAllOrdersForAdmin() {

        List<Order> orders = orderRepository.findAll();

        return ResponseEntity.ok(orders);
    }
}