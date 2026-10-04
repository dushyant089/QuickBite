package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository repository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository repository,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder
    ) {
        this.repository = repository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================
    // REGISTER
    // =========================
    public User register(User user) {

        if (repository.findByEmail(user.getEmail()).isPresent()) {

            throw new RuntimeException(
                    "Email already registered: "
                            + user.getEmail()
            );
        }

        // Public registration should always create
        // a CUSTOMER account.
        user.setRole("CUSTOMER");

        // Encode password before saving.
        user.setPassword(
                passwordEncoder.encode(
                        user.getPassword()
                )
        );

        return repository.save(user);
    }

    // =========================
    // LOGIN
    // =========================
    public String login(
            String email,
            String password
    ) {

        Optional<User> optionalUser =
                repository.findByEmail(
                        email.trim().toLowerCase()
                );

        if (optionalUser.isEmpty()) {

            throw new RuntimeException(
                    "User not found"
            );
        }

        User user = optionalUser.get();

        boolean passwordMatches =
                passwordEncoder.matches(
                        password,
                        user.getPassword()
                );

        if (!passwordMatches) {

            throw new RuntimeException(
                    "Invalid password"
            );
        }

        String role = user.getRole();

        if (role == null || role.isBlank()) {
            role = "CUSTOMER";
        }

        return jwtUtil.generateToken(
                user.getEmail(),
                role
        );
    }

    // =========================
    // GET USER BY ID
    // =========================
    public User getUserById(Long id) {

        return repository
                .findById(id)
                .orElse(null);
    }
}