package com.example.demo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JWTAuthenticationFilter
        extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JWTAuthenticationFilter(
            JwtUtil jwtUtil
    ) {
        this.jwtUtil = jwtUtil;
    }

    // =====================================================
    // ONLY COMPLETELY PUBLIC APIs SKIP JWT FILTER
    // =====================================================

    @Override
    protected boolean shouldNotFilter(
            HttpServletRequest request
    ) {

        String path =
                request.getRequestURI();

        // Auth APIs are public
        if (path.startsWith(
                "/api/auth/"
        )) {
            return true;
        }

        // Public restaurant APIs
        // IMPORTANT:
        // ADMIN restaurant APIs MUST NOT be skipped.
        if (
                path.equals(
                        "/api/restaurants"
                )
                        || (
                        path.startsWith(
                                "/api/restaurants/"
                        )
                                &&
                        !path.startsWith(
                                "/api/restaurants/admin"
                        )
                )
        ) {
            return true;
        }

        // Public menu APIs
        if (
                path.equals(
                        "/api/menuitems"
                )
                        || path.startsWith(
                        "/api/menuitems/"
                )
                        || path.equals(
                        "/api/menu-items"
                )
                        || path.startsWith(
                        "/api/menu-items/"
                )
        ) {
            return true;
        }

        // Public food APIs
        if (
                path.equals(
                        "/api/foods"
                )
                        || path.startsWith(
                        "/api/foods/"
                )
        ) {
            return true;
        }

        return false;
    }

    // =====================================================
    // JWT PROCESSING
    // =====================================================

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader =
                request.getHeader(
                        "Authorization"
                );

        // =================================================
        // NO TOKEN
        // =================================================

        if (
                authHeader == null
                        ||
                !authHeader.startsWith(
                        "Bearer "
                )
        ) {
            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }

        // =================================================
        // EXTRACT TOKEN
        // =================================================

        String token =
                authHeader
                        .substring(7)
                        .trim();

        if (token.isEmpty()) {
            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }

        // =================================================
        // VALIDATE TOKEN
        // =================================================

        if (
                jwtUtil.validateToken(
                        token
                )
        ) {

            try {

                String email =
                        jwtUtil.extractEmail(
                                token
                        );

                String role =
                        jwtUtil.extractRole(
                                token
                        );

                if (
                        role == null
                                ||
                        role.isBlank()
                ) {
                    role = "CUSTOMER";
                }

                SimpleGrantedAuthority authority =
                        new SimpleGrantedAuthority(
                                "ROLE_" +
                                        role.toUpperCase()
                        );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                Collections.singletonList(
                                        authority
                                )
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(
                                        request
                                )
                );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(
                                authentication
                        );

            } catch (Exception e) {

                SecurityContextHolder
                        .clearContext();
            }
        }

        filterChain.doFilter(
                request,
                response
        );
    }
}