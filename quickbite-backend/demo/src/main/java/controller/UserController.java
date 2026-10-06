package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000", "https://quickbite-frontend-beta.vercel.app"
})
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =====================================================
    // GET ALL USERS
    // ADMIN ONLY
    // =====================================================

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {

        List<Map<String, Object>> users =
                userRepository.findAll()
                        .stream()
                        .map(this::createUserResponse)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

    // =====================================================
    // GET USER BY EMAIL
    // EXISTING PROFILE API
    // =====================================================

    @GetMapping("/email")
    public ResponseEntity<?> getUserByEmail(
            @RequestParam String email
    ) {

        return userRepository
                .findByEmail(
                        email.trim().toLowerCase()
                )
                .map(user ->
                        ResponseEntity.ok(
                                createUserResponse(user)
                        )
                )
                .orElseGet(() ->
                        ResponseEntity.notFound().build()
                );
    }

    // =====================================================
    // UPDATE PROFILE
    // =====================================================

    @PutMapping("/email")
    public ResponseEntity<?> updateProfile(
            @RequestParam String email,
            @RequestBody UpdateProfileRequest request
    ) {

        User user =
                userRepository
                        .findByEmail(
                                email.trim().toLowerCase()
                        )
                        .orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.getName() == null ||
                request.getName().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Name is required");
        }

        user.setName(
                request.getName().trim()
        );

        user.setPhone(
                request.getPhone() == null
                        ? ""
                        : request.getPhone().trim()
        );

        user.setAddress(
                request.getAddress() == null
                        ? ""
                        : request.getAddress().trim()
        );

        User updatedUser =
                userRepository.save(user);

        return ResponseEntity.ok(
                createUserResponse(updatedUser)
        );
    }

    // =====================================================
    // CHANGE PASSWORD
    // =====================================================

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            @RequestParam String email,
            @RequestBody ChangePasswordRequest request
    ) {

        User user =
                userRepository
                        .findByEmail(
                                email.trim().toLowerCase()
                        )
                        .orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.getCurrentPassword() == null ||
                request.getCurrentPassword().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(
                            "Current password is required"
                    );
        }

        if (request.getNewPassword() == null ||
                request.getNewPassword().length() < 6) {

            return ResponseEntity.badRequest()
                    .body(
                            "New password must be at least 6 characters"
                    );
        }

        boolean matches =
                passwordEncoder.matches(
                        request.getCurrentPassword(),
                        user.getPassword()
                );

        if (!matches) {

            return ResponseEntity.badRequest()
                    .body(
                            "Current password is incorrect"
                    );
        }

        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );

        userRepository.save(user);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Password changed successfully"
                )
        );
    }

    // =====================================================
    // RESET PASSWORD
    // =====================================================

    @PutMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody ResetPasswordRequest request
    ) {

        if (request.getEmail() == null ||
                request.getEmail().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Email is required");
        }

        if (request.getNewPassword() == null ||
                request.getNewPassword().length() < 6) {

            return ResponseEntity.badRequest()
                    .body(
                            "Password must be at least 6 characters"
                    );
        }

        String email =
                request.getEmail()
                        .trim()
                        .toLowerCase();

        User user =
                userRepository
                        .findByEmail(email)
                        .orElse(null);

        if (user == null) {

            return ResponseEntity.badRequest()
                    .body(
                            "No account found with this email"
                    );
        }

        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );

        userRepository.save(user);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Password reset successfully"
                )
        );
    }

    // =====================================================
    // DELETE USER
    // ADMIN ONLY
    // =====================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            Authentication authentication
    ) {

        User user =
                userRepository
                        .findById(id)
                        .orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        String loggedInEmail =
                authentication.getName();

        // Prevent admin from deleting itself
        if (user.getEmail() != null &&
                user.getEmail()
                        .equalsIgnoreCase(loggedInEmail)) {

            return ResponseEntity.badRequest()
                    .body(
                            "You cannot delete your own admin account."
                    );
        }

        // Protect admin accounts
        if ("ADMIN".equalsIgnoreCase(
                user.getRole()
        )) {

            return ResponseEntity.badRequest()
                    .body(
                            "Admin accounts cannot be deleted from User Management."
                    );
        }

        userRepository.delete(user);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "User deleted successfully",
                        "userId",
                        id
                )
        );
    }

    // =====================================================
    // CHANGE USER ROLE
    // ADMIN ONLY
    // =====================================================

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long id,
            @RequestBody RoleUpdateRequest request,
            Authentication authentication
    ) {

        User user =
                userRepository
                        .findById(id)
                        .orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        String loggedInEmail =
                authentication.getName();

        // Protect current admin
        if (user.getEmail() != null &&
                user.getEmail()
                        .equalsIgnoreCase(loggedInEmail)) {

            return ResponseEntity.badRequest()
                    .body(
                            "You cannot change your own admin role."
                    );
        }

        // Protect all existing admin accounts
        if ("ADMIN".equalsIgnoreCase(
                user.getRole()
        )) {

            return ResponseEntity.badRequest()
                    .body(
                            "Admin roles are protected."
                    );
        }

        if (request.getRole() == null ||
                request.getRole().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(
                            "Role is required."
                    );
        }

        String newRole =
                request.getRole()
                        .trim()
                        .toUpperCase();

        // Only these two roles can be assigned
        if (!newRole.equals("CUSTOMER") &&
                !newRole.equals("RESTAURANT_OWNER")) {

            return ResponseEntity.badRequest()
                    .body(
                            "Invalid role. Allowed roles: CUSTOMER, RESTAURANT_OWNER"
                    );
        }

        user.setRole(newRole);

        User updatedUser =
                userRepository.save(user);

        return ResponseEntity.ok(
                createUserResponse(updatedUser)
        );
    }

    // =====================================================
    // RESPONSE WITHOUT PASSWORD
    // =====================================================

    private Map<String, Object> createUserResponse(
            User user
    ) {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "id",
                user.getId()
        );

        response.put(
                "name",
                user.getName() == null
                        ? ""
                        : user.getName()
        );

        response.put(
                "email",
                user.getEmail() == null
                        ? ""
                        : user.getEmail()
        );

        response.put(
                "phone",
                user.getPhone() == null
                        ? ""
                        : user.getPhone()
        );

        response.put(
                "address",
                user.getAddress() == null
                        ? ""
                        : user.getAddress()
        );

        response.put(
                "role",
                user.getRole() == null
                        ? "CUSTOMER"
                        : user.getRole()
        );

        response.put(
                "mobileVerified",
                user.isMobileVerified()
        );

        response.put(
                "emailVerified",
                user.isEmailVerified()
        );

        return response;
    }

    // =====================================================
    // UPDATE PROFILE REQUEST
    // =====================================================

    public static class UpdateProfileRequest {

        private String name;
        private String phone;
        private String address;

        public UpdateProfileRequest() {
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
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
    }

    // =====================================================
    // CHANGE PASSWORD REQUEST
    // =====================================================

    public static class ChangePasswordRequest {

        private String currentPassword;
        private String newPassword;

        public ChangePasswordRequest() {
        }

        public String getCurrentPassword() {
            return currentPassword;
        }

        public void setCurrentPassword(
                String currentPassword
        ) {
            this.currentPassword =
                    currentPassword;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(
                String newPassword
        ) {
            this.newPassword =
                    newPassword;
        }
    }

    // =====================================================
    // RESET PASSWORD REQUEST
    // =====================================================

    public static class ResetPasswordRequest {

        private String email;
        private String newPassword;

        public ResetPasswordRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(
                String newPassword
        ) {
            this.newPassword =
                    newPassword;
        }
    }

    // =====================================================
    // ROLE UPDATE REQUEST
    // =====================================================

    public static class RoleUpdateRequest {

        private String role;

        public RoleUpdateRequest() {
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }
}