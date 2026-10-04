package com.example.demo.service;

import com.example.demo.model.Restaurant;
import com.example.demo.repository.RestaurantRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RestaurantService {

    private final RestaurantRepository repository;

    public RestaurantService(
            RestaurantRepository repository
    ) {
        this.repository = repository;
    }

    // =====================================================
    // GET ALL RESTAURANTS
    // =====================================================

    public List<Restaurant> getAllRestaurants() {
        return repository.findAll();
    }

    // =====================================================
    // GET RESTAURANT BY ID
    // =====================================================

    public Optional<Restaurant> getRestaurantById(
            Long id
    ) {
        return repository.findById(id);
    }

    // =====================================================
    // ADD RESTAURANT
    // =====================================================

    public Restaurant addRestaurant(
            Restaurant restaurant
    ) {
        return repository.save(restaurant);
    }

    // =====================================================
    // UPDATE RESTAURANT
    // =====================================================

    public Optional<Restaurant> updateRestaurant(
            Long id,
            Restaurant updatedRestaurant
    ) {

        return repository.findById(id)
                .map(existingRestaurant -> {

                    if (updatedRestaurant.getName() != null &&
                            !updatedRestaurant.getName().isBlank()) {

                        existingRestaurant.setName(
                                updatedRestaurant
                                        .getName()
                                        .trim()
                        );
                    }

                    if (updatedRestaurant.getLocation() != null) {

                        existingRestaurant.setLocation(
                                updatedRestaurant
                                        .getLocation()
                                        .trim()
                        );
                    }

                    // Keep rating between 0 and 5
                    double rating =
                            updatedRestaurant.getRating();

                    if (rating < 0) {
                        rating = 0;
                    }

                    if (rating > 5) {
                        rating = 5;
                    }

                    existingRestaurant.setRating(
                            rating
                    );

                    if (updatedRestaurant.getImageUrl() != null) {

                        existingRestaurant.setImageUrl(
                                updatedRestaurant
                                        .getImageUrl()
                                        .trim()
                        );
                    }

                    return repository.save(
                            existingRestaurant
                    );
                });
    }

    // =====================================================
    // DELETE RESTAURANT
    // =====================================================

    public boolean deleteRestaurant(
            Long id
    ) {

        if (!repository.existsById(id)) {
            return false;
        }

        repository.deleteById(id);

        return true;
    }
}