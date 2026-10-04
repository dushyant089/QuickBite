package com.example.demo.controller;

import com.example.demo.model.Restaurant;
import com.example.demo.service.RestaurantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurants")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000"
})
public class RestaurantController {

    private final RestaurantService service;

    public RestaurantController(RestaurantService service) {
        this.service = service;
    }

    // =========================================================
    // PUBLIC RESTAURANT APIs
    // =========================================================

    @GetMapping
    public ResponseEntity<List<Restaurant>> getAllRestaurants() {
        return ResponseEntity.ok(service.getAllRestaurants());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(
            @PathVariable Long id
    ) {
        return service.getRestaurantById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    @PostMapping
    public ResponseEntity<Restaurant> addRestaurant(
            @RequestBody Restaurant restaurant
    ) {
        Restaurant savedRestaurant =
                service.addRestaurant(restaurant);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedRestaurant);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Restaurant> updateRestaurant(
            @PathVariable Long id,
            @RequestBody Restaurant restaurant
    ) {
        return service.updateRestaurant(id, restaurant)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRestaurant(
            @PathVariable Long id
    ) {
        boolean deleted =
                service.deleteRestaurant(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }

    // =========================================================
    // ADMIN RESTAURANT APIs
    // =========================================================

    // GET
    // http://localhost:8080/api/restaurants/admin/all
    @GetMapping("/admin/all")
    public ResponseEntity<List<Restaurant>> getAllRestaurantsForAdmin() {
        return ResponseEntity.ok(
                service.getAllRestaurants()
        );
    }

    // GET
    // http://localhost:8080/api/restaurants/admin/view/{id}
    @GetMapping("/admin/view/{id}")
    public ResponseEntity<Restaurant> getRestaurantForAdmin(
            @PathVariable Long id
    ) {
        return service.getRestaurantById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // POST
    // http://localhost:8080/api/restaurants/admin/add
    @PostMapping("/admin/add")
    public ResponseEntity<?> addRestaurantByAdmin(
            @RequestBody Restaurant restaurant
    ) {

        if (restaurant == null) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Restaurant data is required."
                    )
            );
        }

        if (
                restaurant.getName() == null ||
                restaurant.getName().isBlank()
        ) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Restaurant name is required."
                    )
            );
        }

        if (
                restaurant.getLocation() == null ||
                restaurant.getLocation().isBlank()
        ) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Restaurant location is required."
                    )
            );
        }

        double rating = restaurant.getRating();

        if (rating < 0) {
            restaurant.setRating(0);
        }

        if (rating > 5) {
            restaurant.setRating(5);
        }

        Restaurant savedRestaurant =
                service.addRestaurant(restaurant);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedRestaurant);
    }

    // PUT
    // http://localhost:8080/api/restaurants/admin/update/{id}
    @PutMapping("/admin/update/{id}")
    public ResponseEntity<Restaurant> updateRestaurantByAdmin(
            @PathVariable Long id,
            @RequestBody Restaurant restaurant
    ) {
        return service.updateRestaurant(id, restaurant)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // DELETE
    // http://localhost:8080/api/restaurants/admin/delete/{id}
    @DeleteMapping("/admin/delete/{id}")
    public ResponseEntity<?> deleteRestaurantByAdmin(
            @PathVariable Long id
    ) {

        boolean deleted =
                service.deleteRestaurant(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "Restaurant deleted successfully.",
                        "restaurantId", id
                )
        );
    }
}