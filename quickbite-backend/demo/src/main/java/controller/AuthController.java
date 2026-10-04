package com.example.demo.controller;

import com.example.demo.model.PasswordResetToken;
import com.example.demo.model.User;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.EmailService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000"
})
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;

    private final SecureRandom secureRandom = new SecureRandom();

    public AuthController(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.jwtUtil = jwtUtil;
    }

    // =========================================================
    // SIGNUP
    // =========================================================

    @PostMapping("/signup")
    public ResponseEntity<?> signup(
            @RequestBody SignupRequest request
    ) {

        if (request == null) {
            return badRequest("Request data is required.");
        }

        if (request.getName() == null ||
                request.getName().isBlank()) {
            return badRequest("Name is required.");
        }

        if (request.getEmail() == null ||
                request.getEmail().isBlank()) {
            return badRequest("Email is required.");
        }

        if (request.getPassword() == null ||
                request.getPassword().length() < 6) {
            return badRequest(
                    "Password must be at least 6 characters."
            );
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        String phone = request.getPhone() == null
                ? ""
                : request.getPhone().replaceAll("\\D", "");

        if (!phone.isBlank() && phone.length() != 10) {
            return badRequest(
                    "Please enter a valid 10-digit mobile number."
            );
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(409)
                    .body(Map.of(
                            "success", false,
                            "message", "Email already registered."
                    ));
        }

        User user = new User();

        user.setName(request.getName().trim());
        user.setEmail(email);

        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        user.setPhone(phone);

        user.setAddress(
                request.getAddress() == null
                        ? ""
                        : request.getAddress().trim()
        );

        // Public signup creates CUSTOMER.
        user.setRole("CUSTOMER");

        // New account requires verification.
        user.setEmailVerified(false);
        user.setMobileVerified(false);

        user.setEmailOtp(null);
        user.setEmailOtpExpiry(null);

        user.setMobileOtp(null);
        user.setMobileOtpExpiry(null);

        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(
                createUserResponse(savedUser)
        );
    }

    // =========================================================
    // LOGIN
    // =========================================================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request
    ) {

        if (request == null) {
            return badRequest("Login data is required.");
        }

        if (request.getEmail() == null ||
                request.getEmail().isBlank()) {
            return badRequest("Email is required.");
        }

        if (request.getPassword() == null ||
                request.getPassword().isBlank()) {
            return badRequest("Password is required.");
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        User user = userRepository
                .findByEmail(email)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(401)
                    .body(Map.of(
                            "success", false,
                            "message",
                            "Invalid email or password."
                    ));
        }

        boolean passwordMatches =
                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );

        if (!passwordMatches) {
            return ResponseEntity.status(401)
                    .body(Map.of(
                            "success", false,
                            "message",
                            "Invalid email or password."
                    ));
        }

        boolean emailVerified = user.isEmailVerified();
        boolean mobileVerified = user.isMobileVerified();

        if (!emailVerified || !mobileVerified) {

            Map<String, Object> response =
                    new HashMap<>();

            response.put("success", false);
            response.put("verificationRequired", true);

            response.put(
                    "message",
                    "Please verify your email and mobile number."
            );

            response.put("email", user.getEmail());
            response.put("phone", user.getPhone());

            response.put("emailVerified", emailVerified);
            response.put("mobileVerified", mobileVerified);

            response.put("user", createUserResponse(user));

            return ResponseEntity.ok(response);
        }

        return ResponseEntity.ok(
                createLoginResponse(user)
        );
    }

    // =========================================================
    // SEND MOBILE OTP
    // DEVELOPMENT MODE
    // =========================================================

    @PostMapping("/send-mobile-otp")
    public ResponseEntity<?> sendMobileOtp(
            @RequestBody MobileOtpRequest request
    ) {

        try {

            if (request == null) {
                return badRequest("Request data is required.");
            }

            if (request.getEmail() == null ||
                    request.getEmail().isBlank()) {
                return badRequest("Email is required.");
            }

            if (request.getPhone() == null ||
                    request.getPhone().isBlank()) {
                return badRequest("Mobile number is required.");
            }

            String email = request.getEmail()
                    .trim()
                    .toLowerCase();

            String cleanPhone = request.getPhone()
                    .replaceAll("\\D", "");

            if (cleanPhone.length() != 10) {
                return badRequest(
                        "Please enter a valid 10-digit mobile number."
                );
            }

            User user = userRepository
                    .findByEmail(email)
                    .orElse(null);

            if (user == null) {
                return ResponseEntity.status(404)
                        .body(Map.of(
                                "success", false,
                                "message",
                                "User account not found."
                        ));
            }

            String savedPhone = user.getPhone() == null
                    ? ""
                    : user.getPhone().replaceAll("\\D", "");

            if (savedPhone.isBlank()) {
                user.setPhone(cleanPhone);
            } else if (!savedPhone.equals(cleanPhone)) {

                return badRequest(
                        "Mobile number does not match this account."
                );
            }

            String otp = generateOtp();

            user.setMobileOtp(otp);

            user.setMobileOtpExpiry(
                    LocalDateTime.now().plusMinutes(5)
            );

            user.setMobileVerified(false);

            userRepository.save(user);

            System.out.println();
            System.out.println(
                    "=============================================="
            );
            System.out.println("QUICKBITE MOBILE OTP");
            System.out.println("Email: " + email);
            System.out.println("Mobile: " + cleanPhone);
            System.out.println("Development OTP: " + otp);
            System.out.println("Expires: 5 minutes");
            System.out.println(
                    "=============================================="
            );
            System.out.println();

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message",
                            "Mobile OTP generated successfully.",
                            "developmentOtp",
                            otp,
                            "expiresInMinutes",
                            5
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.status(500)
                    .body(Map.of(
                            "success", false,
                            "message",
                            "Unable to send mobile OTP.",
                            "error",
                            e.getMessage() == null
                                    ? "Unknown server error"
                                    : e.getMessage()
                    ));
        }
    }

    // =========================================================
    // VERIFY MOBILE OTP
    // =========================================================

    @PostMapping("/verify-mobile-otp")
    public ResponseEntity<?> verifyMobileOtp(
            @RequestBody VerifyMobileOtpRequest request
    ) {

        if (request == null ||
                request.getEmail() == null ||
                request.getEmail().isBlank()) {
            return badRequest("Email is required.");
        }

        if (request.getOtp() == null ||
                request.getOtp().isBlank()) {
            return badRequest("Mobile OTP is required.");
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        String otp = request.getOtp().trim();

        if (!otp.matches("\\d{6}")) {
            return badRequest("OTP must be 6 digits.");
        }

        User user = userRepository
                .findByEmail(email)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(404)
                    .body(Map.of(
                            "success", false,
                            "message",
                            "User account not found."
                    ));
        }

        if (user.getMobileOtp() == null ||
                !user.getMobileOtp().equals(otp)) {
            return badRequest("Invalid mobile OTP.");
        }

        if (user.getMobileOtpExpiry() == null ||
                user.getMobileOtpExpiry()
                        .isBefore(LocalDateTime.now())) {
            return badRequest(
                    "Mobile OTP has expired. Please request a new OTP."
            );
        }

        user.setMobileVerified(true);
        user.setMobileOtp(null);
        user.setMobileOtpExpiry(null);

        userRepository.save(user);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message",
                        "Mobile number verified successfully.",
                        "mobileVerified",
                        true
                )
        );
    }

    // =========================================================
    // SEND EMAIL OTP - RESEND
    // =========================================================

    @PostMapping("/send-email-otp")
    public ResponseEntity<?> sendEmailOtp(
            @RequestBody EmailOtpRequest request
    ) {

        try {

            if (request == null ||
                    request.getEmail() == null ||
                    request.getEmail().isBlank()) {
                return badRequest("Email is required.");
            }

            String email = request.getEmail()
                    .trim()
                    .toLowerCase();

            User user = userRepository
                    .findByEmail(email)
                    .orElse(null);

            if (user == null) {
                return ResponseEntity.status(404)
                        .body(Map.of(
                                "success", false,
                                "message",
                                "User account not found."
                        ));
            }

            String otp = generateOtp();

            user.setEmailOtp(otp);

            user.setEmailOtpExpiry(
                    LocalDateTime.now().plusMinutes(5)
            );

            user.setEmailVerified(false);

            userRepository.save(user);

            System.out.println();
            System.out.println(
                    "=============================================="
            );
            System.out.println("QUICKBITE EMAIL OTP");
            System.out.println(
                    "Sending verification email to: " + email
            );
            System.out.println(
                    "=============================================="
            );

            // Resend email service
            emailService.sendOtpEmail(email, otp);

            System.out.println(
                    "Email OTP sent successfully."
            );

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message",
                            "Email OTP sent successfully.",
                            "expiresInMinutes",
                            5
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.status(500)
                    .body(Map.of(
                            "success", false,
                            "message",
                            "Unable to send email OTP.",
                            "error",
                            e.getMessage() == null
                                    ? "Unknown server error"
                                    : e.getMessage()
                    ));
        }
    }

    // =========================================================
    // VERIFY EMAIL OTP
    // =========================================================

    @PostMapping("/verify-email-otp")
    public ResponseEntity<?> verifyEmailOtp(
            @RequestBody VerifyEmailOtpRequest request
    ) {

        if (request == null ||
                request.getEmail() == null ||
                request.getEmail().isBlank()) {
            return badRequest("Email is required.");
        }

        if (request.getOtp() == null ||
                request.getOtp().isBlank()) {
            return badRequest("Email OTP is required.");
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        String otp = request.getOtp().trim();

        if (!otp.matches("\\d{6}")) {
            return badRequest("OTP must be 6 digits.");
        }

        User user = userRepository
                .findByEmail(email)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(404)
                    .body(Map.of(
                            "success", false,
                            "message",
                            "User account not found."
                    ));
        }

        if (user.getEmailOtp() == null ||
                !user.getEmailOtp().equals(otp)) {
            return badRequest("Invalid email OTP.");
        }

        if (user.getEmailOtpExpiry() == null ||
                user.getEmailOtpExpiry()
                        .isBefore(LocalDateTime.now())) {
            return badRequest(
                    "Email OTP has expired. Please request a new OTP."
            );
        }

        user.setEmailVerified(true);
        user.setEmailOtp(null);
        user.setEmailOtpExpiry(null);

        userRepository.save(user);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message",
                        "Email verified successfully.",
                        "emailVerified",
                        true
                )
        );
    }

    // =========================================================
    // COMPLETE VERIFICATION
    // =========================================================

    @PostMapping("/complete-verification")
    public ResponseEntity<?> completeVerification(
            @RequestBody CompleteVerificationRequest request
    ) {

        if (request == null ||
                request.getEmail() == null ||
                request.getEmail().isBlank()) {
            return badRequest("Email is required.");
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        User user = userRepository
                .findByEmail(email)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(404)
                    .body(Map.of(
                            "success", false,
                            "message",
                            "User account not found."
                    ));
        }

        if (!user.isEmailVerified() ||
                !user.isMobileVerified()) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message",
                            "Please verify both email and mobile number first.",
                            "emailVerified",
                            user.isEmailVerified(),
                            "mobileVerified",
                            user.isMobileVerified()
                    ));
        }

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message",
                        "Account verification completed successfully.",
                        "emailVerified", true,
                        "mobileVerified", true,
                        "user",
                        createUserResponse(user)
                )
        );
    }

    // =========================================================
    // FORGOT PASSWORD - RESEND
    // =========================================================

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @RequestBody ForgotPasswordRequest request
    ) {

        if (request == null ||
                request.getEmail() == null ||
                request.getEmail().isBlank()) {
            return badRequest("Email is required.");
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        User user = userRepository
                .findByEmail(email)
                .orElse(null);

        // Do not expose whether account exists.
        if (user == null) {
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message",
                            "If an account exists, an OTP has been sent to the email address."
                    )
            );
        }

        tokenRepository.deleteByEmail(email);

        String otp = generateOtp();

        PasswordResetToken resetToken =
                new PasswordResetToken();

        resetToken.setToken(otp);
        resetToken.setEmail(email);

        resetToken.setExpiryTime(
                LocalDateTime.now().plusMinutes(10)
        );

        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        try {

            emailService.sendPasswordResetOtp(
                    email,
                    otp
            );

        } catch (Exception e) {

            e.printStackTrace();

            tokenRepository.deleteByEmail(email);

            return ResponseEntity.status(500)
                    .body(Map.of(
                            "success", false,
                            "message",
                            "Unable to send password reset OTP.",
                            "error",
                            e.getMessage() == null
                                    ? "Unknown server error"
                                    : e.getMessage()
                    ));
        }

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message",
                        "OTP has been sent to your email.",
                        "expiresInMinutes",
                        10
                )
        );
    }

    // =========================================================
    // VERIFY PASSWORD RESET OTP
    // =========================================================

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(
            @RequestBody VerifyOtpRequest request
    ) {

        if (request == null ||
                request.getEmail() == null ||
                request.getEmail().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Email is required.");
        }

        if (request.getOtp() == null ||
                request.getOtp().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("OTP is required.");
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        String otp = request.getOtp().trim();

        if (!otp.matches("\\d{6}")) {
            return ResponseEntity.badRequest()
                    .body("OTP must be 6 digits.");
        }

        PasswordResetToken resetToken =
                tokenRepository.findByToken(otp)
                        .orElse(null);

        if (resetToken == null ||
                !resetToken.getEmail().equals(email)) {
            return ResponseEntity.badRequest()
                    .body("Invalid OTP.");
        }

        if (resetToken.isUsed()) {
            return ResponseEntity.badRequest()
                    .body("This OTP has already been used.");
        }

        if (resetToken.getExpiryTime() == null ||
                resetToken.getExpiryTime()
                        .isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest()
                    .body(
                            "OTP has expired. Please request a new OTP."
                    );
        }

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message",
                        "OTP verified successfully.",
                        "verified",
                        true
                )
        );
    }

    // =========================================================
    // RESEND PASSWORD RESET OTP
    // =========================================================

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(
            @RequestBody ForgotPasswordRequest request
    ) {

        if (request == null ||
                request.getEmail() == null ||
                request.getEmail().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Email is required.");
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        User user = userRepository
                .findByEmail(email)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message",
                            "If an account exists, a new OTP has been sent."
                    )
            );
        }

        tokenRepository.deleteByEmail(email);

        String otp = generateOtp();

        PasswordResetToken resetToken =
                new PasswordResetToken();

        resetToken.setToken(otp);
        resetToken.setEmail(email);

        resetToken.setExpiryTime(
                LocalDateTime.now().plusMinutes(10)
        );

        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        try {

            emailService.sendPasswordResetOtp(
                    email,
                    otp
            );

        } catch (Exception e) {

            e.printStackTrace();

            tokenRepository.deleteByEmail(email);

            return ResponseEntity.status(500)
                    .body(
                            "Unable to send OTP email."
                    );
        }

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message",
                        "A new OTP has been sent to your email.",
                        "expiresInMinutes",
                        10
                )
        );
    }

    // =========================================================
    // RESET PASSWORD
    // =========================================================

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody ResetPasswordRequest request
    ) {

        if (request == null) {
            return ResponseEntity.badRequest()
                    .body("Request data is required.");
        }

        if (request.getEmail() == null ||
                request.getEmail().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Email is required.");
        }

        if (request.getOtp() == null ||
                request.getOtp().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("OTP is required.");
        }

        if (request.getNewPassword() == null ||
                request.getNewPassword().length() < 6) {
            return ResponseEntity.badRequest()
                    .body(
                            "Password must be at least 6 characters."
                    );
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        String otp = request.getOtp().trim();

        PasswordResetToken resetToken =
                tokenRepository.findByToken(otp)
                        .orElse(null);

        if (resetToken == null ||
                !resetToken.getEmail().equals(email)) {
            return ResponseEntity.badRequest()
                    .body("Invalid OTP.");
        }

        if (resetToken.isUsed()) {
            return ResponseEntity.badRequest()
                    .body("This OTP has already been used.");
        }

        if (resetToken.getExpiryTime() == null ||
                resetToken.getExpiryTime()
                        .isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest()
                    .body(
                            "OTP has expired. Please request a new OTP."
                    );
        }

        User user = userRepository
                .findByEmail(email)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest()
                    .body("User account not found.");
        }

        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );

        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message",
                        "Password reset successfully."
                )
        );
    }

    // =========================================================
    // GENERATE OTP
    // =========================================================

    private String generateOtp() {

        int otp =
                100000 +
                        secureRandom.nextInt(900000);

        return String.valueOf(otp);
    }

    // =========================================================
    // USER RESPONSE
    // =========================================================

    private Map<String, Object> createUserResponse(
            User user
    ) {

        Map<String, Object> response =
                new HashMap<>();

        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("address", user.getAddress());
        response.put("role", user.getRole());

        response.put(
                "emailVerified",
                user.isEmailVerified()
        );

        response.put(
                "mobileVerified",
                user.isMobileVerified()
        );

        return response;
    }

    // =========================================================
    // LOGIN RESPONSE
    // =========================================================

    private Map<String, Object> createLoginResponse(
            User user
    ) {

        Map<String, Object> response =
                new HashMap<>();

        response.put("success", true);
        response.put(
                "message",
                "Login successful."
        );

        response.put(
                "user",
                createUserResponse(user)
        );

        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("role", user.getRole());

        response.put(
                "emailVerified",
                user.isEmailVerified()
        );

        response.put(
                "mobileVerified",
                user.isMobileVerified()
        );

        String role =
                user.getRole() == null ||
                        user.getRole().isBlank()
                        ? "CUSTOMER"
                        : user.getRole();

        String token =
                jwtUtil.generateToken(
                        user.getEmail(),
                        role
                );

        response.put("token", token);

        return response;
    }

    // =========================================================
    // BAD REQUEST HELPER
    // =========================================================

    private ResponseEntity<?> badRequest(
            String message
    ) {

        return ResponseEntity.badRequest()
                .body(Map.of(
                        "success", false,
                        "message", message
                ));
    }

    // =========================================================
    // DTO - SIGNUP
    // =========================================================

    public static class SignupRequest {

        private String name;
        private String email;
        private String phone;
        private String address;
        private String password;

        public SignupRequest() {
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
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

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    // =========================================================
    // DTO - LOGIN
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

    // =========================================================
    // DTO - MOBILE OTP
    // =========================================================

    public static class MobileOtpRequest {

        private String email;
        private String phone;

        public MobileOtpRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }
    }

    // =========================================================
    // DTO - EMAIL OTP
    // =========================================================

    public static class EmailOtpRequest {

        private String email;

        public EmailOtpRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    // =========================================================
    // DTO - VERIFY MOBILE OTP
    // =========================================================

    public static class VerifyMobileOtpRequest {

        private String email;
        private String otp;

        public VerifyMobileOtpRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getOtp() {
            return otp;
        }

        public void setOtp(String otp) {
            this.otp = otp;
        }
    }

    // =========================================================
    // DTO - VERIFY EMAIL OTP
    // =========================================================

    public static class VerifyEmailOtpRequest {

        private String email;
        private String otp;

        public VerifyEmailOtpRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getOtp() {
            return otp;
        }

        public void setOtp(String otp) {
            this.otp = otp;
        }
    }

    // =========================================================
    // DTO - COMPLETE VERIFICATION
    // =========================================================

    public static class CompleteVerificationRequest {

        private String email;

        public CompleteVerificationRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    // =========================================================
    // DTO - FORGOT PASSWORD
    // =========================================================

    public static class ForgotPasswordRequest {

        private String email;

        public ForgotPasswordRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    // =========================================================
    // DTO - VERIFY RESET OTP
    // =========================================================

    public static class VerifyOtpRequest {

        private String email;
        private String otp;

        public VerifyOtpRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getOtp() {
            return otp;
        }

        public void setOtp(String otp) {
            this.otp = otp;
        }
    }

    // =========================================================
    // DTO - RESET PASSWORD
    // =========================================================

    public static class ResetPasswordRequest {

        private String email;
        private String otp;
        private String newPassword;

        public ResetPasswordRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getOtp() {
            return otp;
        }

        public void setOtp(String otp) {
            this.otp = otp;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }
}