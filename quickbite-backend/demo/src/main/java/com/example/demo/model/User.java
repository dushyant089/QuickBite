package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phone;

    private String address;

    @Column(nullable = false)
    private String role = "CUSTOMER";

    // =========================
    // OTP VERIFICATION
    // =========================

    @Column(nullable = false)
    private boolean mobileVerified = false;

    @Column(nullable = false)
    private boolean emailVerified = false;

    @Column(length = 6)
    private String mobileOtp;

    private LocalDateTime mobileOtpExpiry;

    @Column(length = 6)
    private String emailOtp;

    private LocalDateTime emailOtpExpiry;

    // =========================
    // CONSTRUCTOR
    // =========================

    public User() {
    }

    // =========================
    // GETTERS & SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isMobileVerified() {
        return mobileVerified;
    }

    public void setMobileVerified(boolean mobileVerified) {
        this.mobileVerified = mobileVerified;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getMobileOtp() {
        return mobileOtp;
    }

    public void setMobileOtp(String mobileOtp) {
        this.mobileOtp = mobileOtp;
    }

    public LocalDateTime getMobileOtpExpiry() {
        return mobileOtpExpiry;
    }

    public void setMobileOtpExpiry(LocalDateTime mobileOtpExpiry) {
        this.mobileOtpExpiry = mobileOtpExpiry;
    }

    public String getEmailOtp() {
        return emailOtp;
    }

    public void setEmailOtp(String emailOtp) {
        this.emailOtp = emailOtp;
    }

    public LocalDateTime getEmailOtpExpiry() {
        return emailOtpExpiry;
    }

    public void setEmailOtpExpiry(LocalDateTime emailOtpExpiry) {
        this.emailOtpExpiry = emailOtpExpiry;
    }
}