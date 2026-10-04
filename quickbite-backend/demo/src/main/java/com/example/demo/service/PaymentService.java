package com.example.demo.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Service
public class PaymentService {

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    // =========================================================
    // CREATE RAZORPAY ORDER
    // =========================================================

    public JSONObject createOrder(
            Double amount,
            String receipt
    ) throws Exception {

        if (razorpayKeyId == null
                || razorpayKeyId.isBlank()
                || razorpayKeySecret == null
                || razorpayKeySecret.isBlank()) {

            throw new IllegalStateException(
                    "Razorpay API keys are not configured."
            );
        }

        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException(
                    "Invalid payment amount."
            );
        }

        RazorpayClient razorpayClient =
                new RazorpayClient(
                        razorpayKeyId.trim(),
                        razorpayKeySecret.trim()
                );

        long amountInPaise =
                Math.round(amount * 100);

        JSONObject orderRequest =
                new JSONObject();

        orderRequest.put(
                "amount",
                amountInPaise
        );

        orderRequest.put(
                "currency",
                "INR"
        );

        orderRequest.put(
                "receipt",
                receipt
        );

        System.out.println(
                "Sending order to Razorpay..."
        );

        Order order =
                razorpayClient.orders.create(
                        orderRequest
                );

        System.out.println(
                "Razorpay order received."
        );

        /*
         * Explicit Object casting is important.
         * Razorpay SDK get() is generic and can otherwise
         * cause String -> char[] ClassCastException.
         */

        String orderId =
                String.valueOf(
                        (Object) order.get("id")
                );

        String orderAmount =
                String.valueOf(
                        (Object) order.get("amount")
                );

        String orderCurrency =
                String.valueOf(
                        (Object) order.get("currency")
                );

        String orderReceipt =
                String.valueOf(
                        (Object) order.get("receipt")
                );

        JSONObject response =
                new JSONObject();

        response.put(
                "id",
                (Object) orderId
        );

        response.put(
                "amount",
                (Object) orderAmount
        );

        response.put(
                "currency",
                (Object) orderCurrency
        );

        response.put(
                "receipt",
                (Object) orderReceipt
        );

        response.put(
                "keyId",
                (Object) razorpayKeyId.trim()
        );

        return response;
    }


    // =========================================================
    // VERIFY RAZORPAY PAYMENT SIGNATURE
    // =========================================================

    public boolean verifyPaymentSignature(
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature
    ) throws Exception {

        if (razorpayKeySecret == null
                || razorpayKeySecret.isBlank()) {

            throw new IllegalStateException(
                    "Razorpay API secret is not configured."
            );
        }

        if (razorpayOrderId == null
                || razorpayOrderId.isBlank()) {

            return false;
        }

        if (razorpayPaymentId == null
                || razorpayPaymentId.isBlank()) {

            return false;
        }

        if (razorpaySignature == null
                || razorpaySignature.isBlank()) {

            return false;
        }

        /*
         * Razorpay signature verification:
         *
         * HMAC SHA256
         * message = order_id + "|" + payment_id
         * secret  = Razorpay secret key
         */

        String payload =
                razorpayOrderId.trim()
                        + "|"
                        + razorpayPaymentId.trim();

        String generatedSignature =
                generateHmacSha256(
                        payload,
                        razorpayKeySecret.trim()
                );

        boolean verified =
                generatedSignature.equals(
                        razorpaySignature.trim()
                );

        System.out.println(
                "========================================"
        );

        System.out.println(
                "QUICKBITE RAZORPAY PAYMENT VERIFICATION"
        );

        System.out.println(
                "Order ID: "
                        + razorpayOrderId
        );

        System.out.println(
                "Payment ID: "
                        + razorpayPaymentId
        );

        System.out.println(
                "Signature verified: "
                        + verified
        );

        System.out.println(
                "========================================"
        );

        return verified;
    }


    // =========================================================
    // HMAC SHA256
    // =========================================================

    private String generateHmacSha256(
            String data,
            String secret
    ) throws Exception {

        Mac mac =
                Mac.getInstance("HmacSHA256");

        SecretKeySpec secretKey =
                new SecretKeySpec(
                        secret.getBytes(
                                StandardCharsets.UTF_8
                        ),
                        "HmacSHA256"
                );

        mac.init(secretKey);

        byte[] hash =
                mac.doFinal(
                        data.getBytes(
                                StandardCharsets.UTF_8
                        )
                );

        StringBuilder hexString =
                new StringBuilder();

        for (byte b : hash) {

            String hex =
                    Integer.toHexString(
                            0xff & b
                    );

            if (hex.length() == 1) {
                hexString.append('0');
            }

            hexString.append(hex);
        }

        return hexString.toString();
    }
}