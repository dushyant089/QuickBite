package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000"
})
public class AdminLoginController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AdminLoginController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // =========================================================
    // ADMIN LOGIN
    // POST /api/auth/admin-login
    // =========================================================
    @PostMapping("/admin-login")
    public ResponseEntity<?> adminLogin(
            @RequestBody LoginRequest request
    ) {

        // -----------------------------------------------------
        // VALIDATION
        // -----------------------------------------------------
        if (request.getEmail() == null ||
                request.getEmail().isBlank()) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Email is required"
                    )
            );
        }

        if (request.getPassword() == null ||
                request.getPassword().isBlank()) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Password is required"
                    )
            );
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        // -----------------------------------------------------
        // FIND USER
        // -----------------------------------------------------
        User user = userRepository
                .findByEmail(email)
                .orElse(null);

        if (user == null) {

            return ResponseEntity.status(401).body(
                    Map.of(
                            "success", false,
                            "message", "Invalid admin email or password"
                    )
            );
        }

        // -----------------------------------------------------
        // PASSWORD CHECK
        // -----------------------------------------------------
        boolean passwordMatches =
                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );

        if (!passwordMatches) {

            return ResponseEntity.status(401).body(
                    Map.of(
                            "success", false,
                            "message", "Invalid admin email or password"
                    )
            );
        }

        // -----------------------------------------------------
        // ROLE CHECK
        // -----------------------------------------------------
        if (user.getRole() == null ||
                !"ADMIN".equalsIgnoreCase(user.getRole())) {

            return ResponseEntity.status(403).body(
                    Map.of(
                            "success", false,
                            "message", "This account does not have ADMIN access"
                    )
            );
        }

        // -----------------------------------------------------
        // VERIFICATION CHECK
        // -----------------------------------------------------
        if (!user.isMobileVerified() ||
                !user.isEmailVerified()) {

            Map<String, Object> response =
                    new HashMap<>();

            response.put("success", false);
            response.put(
                    "message",
                    "Admin account verification is required"
            );
            response.put(
                    "verificationRequired",
                    true
            );
            response.put(
                    "user",
                    createUserResponse(user)
            );

            return ResponseEntity
                    .status(403)
                    .body(response);
        }

        // -----------------------------------------------------
        // CREATE JWT
        // -----------------------------------------------------
        String token = jwtUtil.generateToken(
                user.getEmail(),
                "ADMIN"
        );

        // -----------------------------------------------------
        // RESPONSE
        // -----------------------------------------------------
        Map<String, Object> response =
                new HashMap<>();

        response.put("success", true);
        response.put(
                "message",
                "Admin login successful"
        );
        response.put("token", token);
        response.put(
                "user",
                createUserResponse(user)
        );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // USER RESPONSE
    // =========================================================
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
                user.getName()
        );

        response.put(
                "email",
                user.getEmail()
        );

        response.put(
                "phone",
                user.getPhone()
        );

        response.put(
                "address",
                user.getAddress()
        );

        response.put(
                "role",
                user.getRole()
        );

        return response;
    }

    // =========================================================
    // LOGIN REQUEST
    // =========================================================
    public static class LoginRequest {

        private String email;
        private String password;

        public LoginRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}