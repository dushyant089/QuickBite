package com.example.demo.controller;

import com.example.demo.service.PaymentService;
import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000"
})
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(
            PaymentService paymentService
    ) {
        this.paymentService = paymentService;
    }


    // =========================================================
    // CREATE RAZORPAY ORDER
    // =========================================================

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(
            @RequestBody CreateOrderRequest request
    ) {

        System.out.println(
                "========================================"
        );

        System.out.println(
                "QUICKBITE RAZORPAY CREATE ORDER REQUEST"
        );

        System.out.println(
                "Amount received: "
                        + request.amount
        );

        System.out.println(
                "========================================"
        );

        try {

            if (request.amount == null
                    || request.amount <= 0) {

                System.out.println(
                        "ERROR: Invalid payment amount"
                );

                return ResponseEntity.badRequest()
                        .body(
                                Map.of(
                                        "success",
                                        false,

                                        "message",
                                        "Invalid payment amount."
                                )
                        );
            }

            String receipt =
                    "QB_"
                            + UUID.randomUUID()
                            .toString()
                            .replace("-", "");

            System.out.println(
                    "Receipt: "
                            + receipt
            );

            System.out.println(
                    "Calling Razorpay API..."
            );

            JSONObject order =
                    paymentService.createOrder(
                            request.amount,
                            receipt
                    );

            System.out.println(
                    "Razorpay order created successfully!"
            );

            System.out.println(
                    "Razorpay Order ID: "
                            + order.get("id")
            );

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "success",
                    true
            );

            response.put(
                    "message",
                    "Payment order created successfully."
            );

            response.put(
                    "orderId",
                    order.get("id")
            );

            response.put(
                    "amount",
                    order.get("amount")
            );

            response.put(
                    "currency",
                    order.get("currency")
            );

            response.put(
                    "receipt",
                    order.get("receipt")
            );

            response.put(
                    "keyId",
                    order.get("keyId")
            );

            return ResponseEntity.ok(
                    response
            );

        } catch (IllegalStateException e) {

            System.out.println(
                    "RAZORPAY CONFIGURATION ERROR: "
                            + e.getMessage()
            );

            e.printStackTrace();

            return ResponseEntity.status(503)
                    .body(
                            Map.of(
                                    "success",
                                    false,

                                    "message",
                                    e.getMessage()
                            )
                    );

        } catch (Exception e) {

            System.out.println(
                    "RAZORPAY CREATE ORDER ERROR: "
                            + e.getClass().getName()
            );

            System.out.println(
                    "ERROR MESSAGE: "
                            + e.getMessage()
            );

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "success",
                                    false,

                                    "message",
                                    "Unable to create Razorpay order",

                                    "error",
                                    e.getMessage() != null
                                            ? e.getMessage()
                                            : "Unknown Razorpay error"
                            )
                    );
        }
    }


    // =========================================================
    // VERIFY RAZORPAY PAYMENT
    // =========================================================

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(
            @RequestBody VerifyPaymentRequest request
    ) {

        System.out.println(
                "========================================"
        );

        System.out.println(
                "QUICKBITE RAZORPAY PAYMENT VERIFY"
        );

        System.out.println(
                "Order ID: "
                        + request.razorpayOrderId
        );

        System.out.println(
                "Payment ID: "
                        + request.razorpayPaymentId
        );

        System.out.println(
                "========================================"
        );

        try {

            if (request.razorpayOrderId == null
                    || request.razorpayOrderId.isBlank()) {

                return ResponseEntity.badRequest()
                        .body(
                                Map.of(
                                        "success",
                                        false,

                                        "verified",
                                        false,

                                        "message",
                                        "Razorpay order ID is required."
                                )
                        );
            }

            if (request.razorpayPaymentId == null
                    || request.razorpayPaymentId.isBlank()) {

                return ResponseEntity.badRequest()
                        .body(
                                Map.of(
                                        "success",
                                        false,

                                        "verified",
                                        false,

                                        "message",
                                        "Razorpay payment ID is required."
                                )
                        );
            }

            if (request.razorpaySignature == null
                    || request.razorpaySignature.isBlank()) {

                return ResponseEntity.badRequest()
                        .body(
                                Map.of(
                                        "success",
                                        false,

                                        "verified",
                                        false,

                                        "message",
                                        "Razorpay signature is required."
                                )
                        );
            }


            boolean verified =
                    paymentService.verifyPaymentSignature(
                            request.razorpayOrderId,
                            request.razorpayPaymentId,
                            request.razorpaySignature
                    );


            if (!verified) {

                System.out.println(
                        "PAYMENT VERIFICATION FAILED"
                );

                return ResponseEntity
                        .status(400)
                        .body(
                                Map.of(
                                        "success",
                                        false,

                                        "verified",
                                        false,

                                        "paymentStatus",
                                        "FAILED",

                                        "message",
                                        "Payment verification failed."
                                )
                        );
            }


            System.out.println(
                    "PAYMENT VERIFICATION SUCCESSFUL"
            );


            return ResponseEntity.ok(
                    Map.of(
                            "success",
                            true,

                            "verified",
                            true,

                            "paymentStatus",
                            "PAID",

                            "razorpayOrderId",
                            request.razorpayOrderId,

                            "razorpayPaymentId",
                            request.razorpayPaymentId,

                            "message",
                            "Payment verified successfully."
                    )
            );

        } catch (IllegalStateException e) {

            System.out.println(
                    "RAZORPAY CONFIGURATION ERROR: "
                            + e.getMessage()
            );

            return ResponseEntity
                    .status(503)
                    .body(
                            Map.of(
                                    "success",
                                    false,

                                    "verified",
                                    false,

                                    "message",
                                    e.getMessage()
                            )
                    );

        } catch (Exception e) {

            System.out.println(
                    "RAZORPAY VERIFICATION ERROR: "
                            + e.getMessage()
            );

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "success",
                                    false,

                                    "verified",
                                    false,

                                    "message",
                                    "Payment verification failed.",

                                    "error",
                                    e.getMessage() != null
                                            ? e.getMessage()
                                            : "Unknown verification error"
                            )
                    );
        }
    }


    // =========================================================
    // CREATE ORDER REQUEST
    // =========================================================

    public static class CreateOrderRequest {

        private Double amount;

        public Double getAmount() {
            return amount;
        }

        public void setAmount(
                Double amount
        ) {
            this.amount = amount;
        }
    }


    // =========================================================
    // VERIFY PAYMENT REQUEST
    // =========================================================

    public static class VerifyPaymentRequest {

        private String razorpayOrderId;

        private String razorpayPaymentId;

        private String razorpaySignature;


        public String getRazorpayOrderId() {
            return razorpayOrderId;
        }

        public void setRazorpayOrderId(
                String razorpayOrderId
        ) {
            this.razorpayOrderId =
                    razorpayOrderId;
        }


        public String getRazorpayPaymentId() {
            return razorpayPaymentId;
        }

        public void setRazorpayPaymentId(
                String razorpayPaymentId
        ) {
            this.razorpayPaymentId =
                    razorpayPaymentId;
        }


        public String getRazorpaySignature() {
            return razorpaySignature;
        }

        public void setRazorpaySignature(
                String razorpaySignature
        ) {
            this.razorpaySignature =
                    razorpaySignature;
        }
    }
}