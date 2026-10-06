package com.example.demo.controller;

import com.example.demo.model.MenuItem;
import com.example.demo.service.MenuItemService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/menuitems", "/api/menu-items"})
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000", "https://quickbite-frontend-beta.vercel.app"
})
public class MenuItemController {

    private final MenuItemService service;

    public MenuItemController(MenuItemService service) {
        this.service = service;
    }

    // GET: All menu items
    @GetMapping
    public ResponseEntity<List<MenuItem>> getAllMenuItems() {
        return ResponseEntity.ok(service.getAllMenuItems());
    }

    // GET: Menu items by restaurant
    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<MenuItem>> getMenuItemsByRestaurant(
            @PathVariable Long restaurantId
    ) {
        return ResponseEntity.ok(
                service.getMenuItemsByRestaurant(restaurantId)
        );
    }

    // GET: Menu item by ID
    @GetMapping("/{id}")
    public ResponseEntity<MenuItem> getMenuItemById(
            @PathVariable Long id
    ) {
        return service.getMenuItemById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // POST: Add menu item
    @PostMapping
    public ResponseEntity<MenuItem> addMenuItem(
            @RequestBody MenuItem menuItem
    ) {
        MenuItem savedMenuItem = service.addMenuItem(menuItem);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedMenuItem);
    }

    // PUT: Update menu item
    @PutMapping("/{id}")
    public ResponseEntity<MenuItem> updateMenuItem(
            @PathVariable Long id,
            @RequestBody MenuItem menuItem
    ) {
        return service.updateMenuItem(id, menuItem)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // DELETE: Delete menu item
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenuItem(
            @PathVariable Long id
    ) {
        boolean deleted = service.deleteMenuItem(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }
}