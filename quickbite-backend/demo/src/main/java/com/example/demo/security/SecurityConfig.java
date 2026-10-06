package com.example.demo.security;

import com.example.demo.security.JWTAuthenticationFilter;
import com.example.demo.security.JwtUtil;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final JWTAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtUtil jwtUtil,
            JWTAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtUtil = jwtUtil;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // =========================
    // AUTHENTICATION MANAGER
    // =========================
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration.getAuthenticationManager();
    }

    // =========================
    // SECURITY FILTER CHAIN
    // =========================
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                // =========================
                // CSRF
                // =========================
                .csrf(csrf -> csrf.disable())

                // =========================
                // CORS
                // =========================
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                // =========================
                // SESSION
                // =========================
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // =========================
                // AUTHORIZATION
                // =========================
                .authorizeHttpRequests(auth -> auth

                        // =========================
                        // CORS PREFLIGHT
                        // =========================
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // =========================
                        // AUTH
                        // =========================
                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()

                        // =========================
                        // PUBLIC RESTAURANTS
                        // =========================
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/restaurants",
                                "/api/restaurants/**"
                        ).permitAll()

                        // =========================
                        // PUBLIC MENU
                        // =========================
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/menuitems",
                                "/api/menuitems/**",
                                "/api/menu-items",
                                "/api/menu-items/**"
                        ).permitAll()

                        // =========================
                        // PUBLIC FOODS
                        // =========================
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/foods",
                                "/api/foods/**"
                        ).permitAll()

                        // =========================
                        // ADMIN USERS
                        // =========================
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/users/**"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/*/role"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ADMIN"
                        )

                        // =========================
                        // USER PROFILE
                        // =========================
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users/email"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/email"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/password"
                        ).authenticated()

                        .requestMatchers(
                                "/api/users/**"
                        ).authenticated()

                        // =========================
                        // ADMIN ORDERS
                        // =========================
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/orders/admin",
                                "/api/orders/admin/**"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ADMIN"
                        )

                        // =========================
                        // ADMIN RESTAURANTS
                        // =========================
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/restaurants/admin/all",
                                "/api/restaurants/admin/view/**",
                                "/api/restaurants/admin"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/restaurants/admin/add"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/restaurants/admin/update/**"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/restaurants/admin/delete/**"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "ADMIN"
                        )

                        // =========================
                        // ORDERS
                        // =========================
                        .requestMatchers(
                                "/api/orders/**"
                        ).authenticated()

                        // =========================
                        // PAYMENT
                        // =========================
                        .requestMatchers(
                                "/api/payment/**"
                        ).authenticated()

                        // =========================
                        // OTHER REQUESTS
                        // =========================
                        .anyRequest().permitAll()
                )

                // =========================
                // JWT FILTER
                // =========================
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // =========================
    // CORS CONFIGURATION
    // =========================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:3000",
                        "http://127.0.0.1:3000", "https://quickbite-frontend-beta.vercel.app"
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "Origin",
                        "X-Requested-With"
                )
        );

        configuration.setExposedHeaders(
                List.of("Authorization")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}
