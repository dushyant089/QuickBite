package com.example.demo;

import jakarta.mail.Session;
import jakarta.mail.Transport;
import org.junit.jupiter.api.Test;

import java.util.Properties;

class SmtpAuthTest {

    @Test
    void testSmtpAuthentication() throws Exception {

        String username = System.getenv("QUICKBITE_MAIL_USERNAME");
        String password = System.getenv("QUICKBITE_MAIL_PASSWORD");

        System.out.println("=================================");
        System.out.println("QUICKBITE SMTP AUTH TEST");
        System.out.println("Username: " + username);
        System.out.println("Password exists: " + (password != null));
        System.out.println("Password length: " +
                (password == null ? 0 : password.length()));
        System.out.println("=================================");

        Properties props = new Properties();

        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");

        Session session = Session.getInstance(props);

        session.setDebug(true);

        Transport transport = session.getTransport("smtp");

        System.out.println("Connecting to Gmail SMTP...");

        transport.connect(
                "smtp.gmail.com",
                587,
                username,
                password
        );

        System.out.println("=================================");
        System.out.println("SMTP AUTHENTICATION SUCCESS");
        System.out.println("=================================");

        transport.close();
    }
}