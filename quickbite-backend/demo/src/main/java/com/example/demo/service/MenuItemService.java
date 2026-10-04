package com.example.demo.service;

import com.example.demo.model.MenuItem;
import com.example.demo.repository.MenuItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MenuItemService {

    private final MenuItemRepository repository;

    public MenuItemService(MenuItemRepository repository) {
        this.repository = repository;
    }

    public List<MenuItem> getAllMenuItems() {
        return repository.findAll();
    }

    public List<MenuItem> getMenuItemsByRestaurant(Long restaurantId) {
        return repository.findByRestaurantId(restaurantId);
    }

    public Optional<MenuItem> getMenuItemById(Long id) {
        return repository.findById(id);
    }

    public MenuItem addMenuItem(MenuItem menuItem) {
        return repository.save(menuItem);
    }

    public Optional<MenuItem> updateMenuItem(
            Long id,
            MenuItem updatedMenuItem
    ) {
        return repository.findById(id).map(existingMenuItem -> {

            existingMenuItem.setItemName(
                    updatedMenuItem.getItemName()
            );

            existingMenuItem.setPrice(
                    updatedMenuItem.getPrice()
            );

            existingMenuItem.setCategory(
                    updatedMenuItem.getCategory()
            );

            existingMenuItem.setImageUrl(
                    updatedMenuItem.getImageUrl()
            );

            existingMenuItem.setRestaurant(
                    updatedMenuItem.getRestaurant()
            );

            return repository.save(existingMenuItem);
        });
    }

    public boolean deleteMenuItem(Long id) {
        if (!repository.existsById(id)) {
            return false;
        }

        repository.deleteById(id);
        return true;
    }
}