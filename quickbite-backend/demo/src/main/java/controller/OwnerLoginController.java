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
        "http://127.0.0.1:3000", "https://quickbite-frontend-beta.vercel.app"
})
public class OwnerLoginController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public OwnerLoginController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // =========================================================
    // RESTAURANT OWNER LOGIN
    // =========================================================
    @PostMapping("/owner-login")
    public ResponseEntity<?> ownerLogin(
            @RequestBody OwnerLoginRequest request
    ) {

        // =========================
        // VALIDATION
        // =========================

        if (request.getEmail() == null ||
                request.getEmail().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Email is required"
                    ));
        }

        if (request.getPassword() == null ||
                request.getPassword().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Password is required"
                    ));
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        // =========================
        // FIND USER
        // =========================

        User user = userRepository
                .findByEmail(email)
                .orElse(null);

        if (user == null) {

            return ResponseEntity.status(401)
                    .body(Map.of(
                            "success", false,
                            "message", "Invalid email or password"
                    ));
        }

        // =========================
        // CHECK ROLE
        // =========================

        if (!"RESTAURANT_OWNER".equalsIgnoreCase(
                user.getRole()
        )) {

            return ResponseEntity.status(403)
                    .body(Map.of(
                            "success", false,
                            "message",
                            "This account is not a restaurant owner account"
                    ));
        }

        // =========================
        // CHECK PASSWORD
        // =========================

        boolean passwordMatches =
                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );

        if (!passwordMatches) {

            return ResponseEntity.status(401)
                    .body(Map.of(
                            "success", false,
                            "message", "Invalid email or password"
                    ));
        }

        // =====================================================
        // VERIFICATION STATUS
        // =====================================================

        boolean emailVerified =
                user.isEmailVerified();

        boolean mobileVerified =
                user.isMobileVerified();

        // =====================================================
        // EMAIL OR MOBILE NOT VERIFIED
        // =====================================================

        if (!emailVerified || !mobileVerified) {

            Map<String, Object> verificationResponse =
                    new HashMap<>();

            verificationResponse.put(
                    "success",
                    false
            );

            verificationResponse.put(
                    "verificationRequired",
                    true
            );

            verificationResponse.put(
                    "message",
                    "Please complete email and mobile verification before login."
            );

            verificationResponse.put(
                    "email",
                    user.getEmail()
            );

            verificationResponse.put(
                    "phone",
                    user.getPhone()
            );

            verificationResponse.put(
                    "emailVerified",
                    emailVerified
            );

            verificationResponse.put(
                    "mobileVerified",
                    mobileVerified
            );

            verificationResponse.put(
                    "role",
                    user.getRole()
            );

            return ResponseEntity
                    .status(403)
                    .body(verificationResponse);
        }

        // =====================================================
        // BOTH VERIFIED -> GENERATE JWT
        // =====================================================

        String token = jwtUtil.generateToken(
                user.getEmail(),
                "RESTAURANT_OWNER"
        );

        // =====================================================
        // USER DATA
        // =====================================================

        Map<String, Object> userData =
                new HashMap<>();

        userData.put(
                "id",
                user.getId()
        );

        userData.put(
                "name",
                user.getName()
        );

        userData.put(
                "email",
                user.getEmail()
        );

        userData.put(
                "phone",
                user.getPhone()
        );

        userData.put(
                "address",
                user.getAddress()
        );

        userData.put(
                "role",
                user.getRole()
        );

        userData.put(
                "emailVerified",
                user.isEmailVerified()
        );

        userData.put(
                "mobileVerified",
                user.isMobileVerified()
        );

        // =====================================================
        // LOGIN RESPONSE
        // =====================================================

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "success",
                true
        );

        response.put(
                "message",
                "Restaurant owner login successful"
        );

        response.put(
                "token",
                token
        );

        response.put(
                "role",
                "RESTAURANT_OWNER"
        );

        response.put(
                "user",
                userData
        );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // LOGIN REQUEST DTO
    // =========================================================

    public static class OwnerLoginRequest {

        private String email;
        private String password;

        public OwnerLoginRequest() {
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
