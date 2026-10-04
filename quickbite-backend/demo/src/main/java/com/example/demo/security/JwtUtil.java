package com.example.demo.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private final Key key;

    public JwtUtil() {

        String secret = System.getenv("JWT_SECRET");

        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException(
                    "JWT_SECRET environment variable is not configured."
            );
        }

        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least 32 characters long."
            );
        }

        this.key = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );
    }

    // =========================
    // GENERATE TOKEN
    // =========================
    public String generateToken(
            String email,
            String role
    ) {

        return Jwts.builder()
                .setSubject(email)

                .claim(
                        "role",
                        role == null
                                ? "CUSTOMER"
                                : role
                )

                .setIssuedAt(new Date())

                .setExpiration(
                        new Date(
                                System.currentTimeMillis()
                                        + 1000L * 60 * 60
                        )
                )

                .signWith(
                        key,
                        SignatureAlgorithm.HS256
                )

                .compact();
    }

    // =========================
    // VALIDATE TOKEN
    // =========================
    public boolean validateToken(
            String token
    ) {

        try {

            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);

            return true;

        } catch (
                JwtException |
                IllegalArgumentException e
        ) {

            return false;
        }
    }

    // =========================
    // EXTRACT EMAIL
    // =========================
    public String extractEmail(
            String token
    ) {

        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // =========================
    // EXTRACT ROLE
    // =========================
    public String extractRole(
            String token
    ) {

        Object role =
                Jwts.parserBuilder()
                        .setSigningKey(key)
                        .build()
                        .parseClaimsJws(token)
                        .getBody()
                        .get("role");

        if (role == null) {
            return "CUSTOMER";
        }

        return role.toString();
    }
}