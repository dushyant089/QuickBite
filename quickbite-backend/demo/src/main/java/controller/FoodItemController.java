package com.example.demo.controller;

import com.example.demo.model.FoodItem;
import com.example.demo.repository.FoodItemRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
public class FoodItemController {

    private final FoodItemRepository foodItemRepository;

    public FoodItemController(FoodItemRepository foodItemRepository) {
        this.foodItemRepository = foodItemRepository;
    }

    // ✅ Add new food item
    @PostMapping
    public ResponseEntity<FoodItem> addFood(@RequestBody FoodItem foodItem) {
        return ResponseEntity.ok(foodItemRepository.save(foodItem));
    }

    // ✅ Get all food items
    @GetMapping
    public ResponseEntity<List<FoodItem>> getAllFoods() {
        return ResponseEntity.ok(foodItemRepository.findAll());
    }

    // ✅ Get food item by ID
    @GetMapping("/{id}")
    public ResponseEntity<FoodItem> getFoodById(@PathVariable Long id) {
        return ResponseEntity.ok(foodItemRepository.findById(id).orElseThrow());
    }
}
