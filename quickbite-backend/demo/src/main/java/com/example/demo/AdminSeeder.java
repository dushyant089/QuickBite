package com.example.demo;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminSeeder {

    @Value("${quickbite.admin.email:}")
    private String adminEmail;

    @Value("${quickbite.admin.password:}")
    private String adminPassword;

    @Value("${quickbite.admin.name:QuickBite Admin}")
    private String adminName;

    @Value("${quickbite.admin.phone:}")
    private String adminPhone;

    @Bean
    CommandLineRunner seedAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {

            // Admin credentials are required through environment variables.
            if (adminEmail == null || adminEmail.isBlank()
                    || adminPassword == null || adminPassword.isBlank()) {

                System.out.println(
                        "QuickBite ADMIN seeder skipped: "
                                + "admin email/password environment variables are not configured."
                );

                return;
            }

            String email = adminEmail.trim().toLowerCase();

            User existingUser =
                    userRepository.findByEmail(email).orElse(null);

            if (existingUser != null) {

                if ("ADMIN".equalsIgnoreCase(existingUser.getRole())) {

                    System.out.println(
                            "QuickBite ADMIN already exists: " + email
                    );

                    return;
                }

                System.out.println(
                        "ADMIN seeder skipped: an account already exists with email "
                                + email
                                + " but its role is "
                                + existingUser.getRole()
                );

                return;
            }

            User admin = new User();

            admin.setName(
                    adminName == null || adminName.isBlank()
                            ? "QuickBite Admin"
                            : adminName.trim()
            );

            admin.setEmail(email);

            admin.setPassword(
                    passwordEncoder.encode(adminPassword)
            );

            admin.setPhone(
                    adminPhone == null
                            ? ""
                            : adminPhone.trim()
            );

            admin.setAddress("");

            admin.setRole("ADMIN");

            // Admin is created only by the secure backend seeder,
            // so both verification flags can be enabled immediately.
            admin.setMobileVerified(true);
            admin.setEmailVerified(true);

            admin.setMobileOtp(null);
            admin.setMobileOtpExpiry(null);
            admin.setEmailOtp(null);
            admin.setEmailOtpExpiry(null);

            userRepository.save(admin);

            System.out.println(
                    "========================================"
            );
            System.out.println(
                    "QuickBite ADMIN account created successfully."
            );
            System.out.println(
                    "ADMIN EMAIL: " + email
            );
            System.out.println(
                    "ADMIN ROLE: ADMIN"
            );
            System.out.println(
                    "========================================"
            );
        };
    }
}