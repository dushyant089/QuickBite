package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("QuickBite - Email Verification OTP");

        message.setText(
                "Hello,\n\n"
                        + "Your QuickBite verification OTP is:\n\n"
                        + otp + "\n\n"
                        + "This OTP is valid for 5 minutes.\n\n"
                        + "Please do not share this OTP with anyone.\n\n"
                        + "If you did not request this verification, please ignore this email.\n\n"
                        + "Regards,\n"
                        + "QuickBite Team"
        );

        mailSender.send(message);
    }

    public void sendPasswordResetOtp(String toEmail, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("QuickBite - Password Reset OTP");

        message.setText(
                "Hello,\n\n"
                        + "Your QuickBite password reset OTP is:\n\n"
                        + otp + "\n\n"
                        + "This OTP is valid for 5 minutes.\n\n"
                        + "If you did not request a password reset, please ignore this email.\n\n"
                        + "Regards,\n"
                        + "QuickBite Team"
        );

        mailSender.send(message);
    }
}