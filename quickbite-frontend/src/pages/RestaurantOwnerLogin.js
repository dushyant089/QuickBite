import React, { useState } from "react";
import API_BASE_URL from "../config";

const AUTH_URL = `${API_BASE_URL}/auth`;

function RestaurantOwnerLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [phone, setPhone] = useState("");
    const [mobileOtp, setMobileOtp] = useState("");
    const [emailOtp, setEmailOtp] = useState("");

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [verificationMode, setVerificationMode] = useState(false);

    const [mobileVerified, setMobileVerified] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);

    const [mobileOtpSent, setMobileOtpSent] = useState(false);
    const [emailOtpSent, setEmailOtpSent] = useState(false);

    const [developmentMobileOtp, setDevelopmentMobileOtp] =
        useState("");

    // =========================================================
    // CLEAR MESSAGES
    // =========================================================

    const clearMessages = () => {
        setMessage("");
        setError("");
    };

    // =========================================================
    // NORMALIZE PHONE
    // =========================================================

    const normalizePhone = (value) => {
        return String(value || "")
            .replace(/\D/g, "")
            .slice(-10);
    };

    // =========================================================
    // LOGIN
    // =========================================================

    const handleLogin = async (e) => {
        e.preventDefault();

        clearMessages();

        const cleanEmail =
            email.trim().toLowerCase();

        if (!cleanEmail || !password.trim()) {
            setError(
                "Please enter email and password."
            );
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${AUTH_URL}/owner-login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: cleanEmail,
                        password: password,
                    }),
                }
            );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            // =====================================================
            // VERIFICATION REQUIRED
            // =====================================================

            if (
                response.status === 403 &&
                data.verificationRequired
            ) {
                setEmail(cleanEmail);

                setMobileVerified(
                    Boolean(data.mobileVerified)
                );

                setEmailVerified(
                    Boolean(data.emailVerified)
                );

                if (data.phone) {
                    setPhone(
                        normalizePhone(data.phone)
                    );
                } else {
                    setPhone("");
                }

                setMobileOtp("");
                setEmailOtp("");

                setDevelopmentMobileOtp("");

                setVerificationMode(true);

                setMessage(
                    "Please complete mobile and email verification before continuing."
                );

                await startVerification(
                    cleanEmail,
                    data.phone || ""
                );

                return;
            }

            // =====================================================
            // NORMAL LOGIN ERROR
            // =====================================================

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                        "Restaurant owner login failed."
                );
            }

            // =====================================================
            // LOGIN SUCCESS
            // =====================================================

            saveOwnerSession(data);

            setMessage(
                "Login successful. Redirecting..."
            );

            setTimeout(() => {
                window.location.href =
                    "/restaurant-owner";
            }, 500);

        } catch (error) {
            console.error(
                "Restaurant owner login error:",
                error
            );

            setError(
                error.message ||
                    "Unable to login. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // START VERIFICATION
    // =========================================================

    const startVerification = async (
        verificationEmail,
        backendPhone = ""
    ) => {
        clearMessages();

        setLoading(true);

        const cleanEmail =
            verificationEmail
                .trim()
                .toLowerCase();

        const cleanPhone =
            normalizePhone(
                backendPhone || phone
            );

        if (backendPhone) {
            setPhone(cleanPhone);
        }

        let mobileSuccess = false;
        let emailSuccess = false;

        // =====================================================
        // MOBILE OTP
        //
        // Backend requires:
        // email + phone
        // =====================================================

        if (
            cleanEmail &&
            cleanPhone &&
            cleanPhone.length === 10
        ) {
            try {
                const mobileResponse =
                    await fetch(
                        `${AUTH_URL}/send-mobile-otp`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                email: cleanEmail,
                                phone: cleanPhone,
                            }),
                        }
                    );

                const mobileData =
                    await mobileResponse
                        .json()
                        .catch(() => ({}));

                if (
                    mobileResponse.ok &&
                    mobileData.success
                ) {
                    mobileSuccess = true;

                    setMobileOtpSent(true);

                    if (
                        mobileData.developmentOtp
                    ) {
                        setDevelopmentMobileOtp(
                            String(
                                mobileData.developmentOtp
                            )
                        );
                    }
                } else {
                    console.error(
                        "Mobile OTP error:",
                        mobileData.message
                    );
                }

            } catch (mobileError) {
                console.error(
                    "Mobile OTP request error:",
                    mobileError
                );
            }
        }

        // =====================================================
        // EMAIL OTP
        // =====================================================

        if (cleanEmail) {
            try {
                const emailResponse =
                    await fetch(
                        `${AUTH_URL}/send-email-otp`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                email: cleanEmail,
                            }),
                        }
                    );

                const emailData =
                    await emailResponse
                        .json()
                        .catch(() => ({}));

                if (
                    emailResponse.ok &&
                    emailData.success
                ) {
                    emailSuccess = true;

                    setEmailOtpSent(true);
                } else {
                    console.error(
                        "Email OTP error:",
                        emailData.message
                    );
                }

            } catch (emailError) {
                console.error(
                    "Email OTP request error:",
                    emailError
                );
            }
        }

        setLoading(false);

        // =====================================================
        // RESULT MESSAGE
        // =====================================================

        if (
            mobileSuccess &&
            emailSuccess
        ) {
            setMessage(
                "Mobile OTP and Email OTP sent successfully."
            );
        } else if (mobileSuccess) {
            setMessage(
                "Mobile OTP sent successfully. Email OTP could not be sent."
            );
        } else if (emailSuccess) {
            if (
                !cleanPhone ||
                cleanPhone.length !== 10
            ) {
                setMessage(
                    "Email OTP sent successfully. Please enter your 10-digit mobile number and resend the mobile OTP."
                );
            } else {
                setMessage(
                    "Email OTP sent successfully. Mobile OTP could not be sent."
                );
            }
        } else {
            setError(
                "Unable to send verification OTPs. Please try again."
            );
        }
    };

    // =========================================================
    // VERIFY MOBILE OTP
    //
    // Backend requires:
    // email + phone + otp
    // =========================================================

    const handleVerifyMobile = async () => {
        clearMessages();

        const cleanEmail =
            email.trim().toLowerCase();

        const cleanPhone =
            normalizePhone(phone);

        const cleanOtp =
            mobileOtp.trim();

        if (!cleanEmail) {
            setError(
                "Email address is required."
            );
            return;
        }

        if (
            !cleanPhone ||
            cleanPhone.length !== 10
        ) {
            setError(
                "Valid 10-digit mobile number is required."
            );
            return;
        }

        if (!cleanOtp) {
            setError(
                "Please enter the mobile OTP."
            );
            return;
        }

        try {
            setLoading(true);

            const response =
                await fetch(
                    `${AUTH_URL}/verify-mobile-otp`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            email: cleanEmail,
                            phone: cleanPhone,
                            otp: cleanOtp,
                        }),
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                        "Invalid mobile OTP."
                );
            }

            setMobileVerified(true);

            setMobileOtp("");

            setMessage(
                "Mobile number verified successfully."
            );

            // =================================================
            // BOTH VERIFIED
            // =================================================

            if (emailVerified) {
                await completeVerification();
            }

        } catch (error) {
            console.error(
                "Mobile verification error:",
                error
            );

            setError(
                error.message ||
                    "Unable to verify mobile OTP."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // VERIFY EMAIL OTP
    //
    // Backend requires:
    // email + otp
    // =========================================================

    const handleVerifyEmail = async () => {
        clearMessages();

        const cleanEmail =
            email.trim().toLowerCase();

        const cleanOtp =
            emailOtp.trim();

        if (!cleanEmail) {
            setError(
                "Email address is required."
            );
            return;
        }

        if (!cleanOtp) {
            setError(
                "Please enter the email OTP."
            );
            return;
        }

        try {
            setLoading(true);

            const response =
                await fetch(
                    `${AUTH_URL}/verify-email-otp`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            email: cleanEmail,
                            otp: cleanOtp,
                        }),
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                        "Invalid email OTP."
                );
            }

            setEmailVerified(true);

            setEmailOtp("");

            setMessage(
                "Email verified successfully."
            );

            // =================================================
            // BOTH VERIFIED
            // =================================================

            if (mobileVerified) {
                await completeVerification();
            }

        } catch (error) {
            console.error(
                "Email verification error:",
                error
            );

            setError(
                error.message ||
                    "Unable to verify email OTP."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // COMPLETE VERIFICATION
    // =========================================================

    const completeVerification = async () => {
        const cleanEmail =
            email.trim().toLowerCase();

        try {
            setLoading(true);

            const response =
                await fetch(
                    `${AUTH_URL}/complete-verification`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            email: cleanEmail,
                        }),
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                        "Verification could not be completed."
                );
            }

            setMessage(
                "Verification complete. Signing you in..."
            );

            // =====================================================
            // LOGIN AGAIN
            // =====================================================

            const loginResponse =
                await fetch(
                    `${AUTH_URL}/owner-login`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            email: cleanEmail,
                            password: password,
                        }),
                    }
                );

            const loginData =
                await loginResponse
                    .json()
                    .catch(() => ({}));

            if (
                !loginResponse.ok ||
                !loginData.success
            ) {
                throw new Error(
                    loginData.message ||
                        "Verification completed, but login failed."
                );
            }

            saveOwnerSession(loginData);

            setMessage(
                "Verification complete. Redirecting to Owner Dashboard..."
            );

            setTimeout(() => {
                window.location.href =
                    "/restaurant-owner";
            }, 700);

        } catch (error) {
            console.error(
                "Complete verification error:",
                error
            );

            setError(
                error.message ||
                    "Unable to complete verification."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // RESEND MOBILE OTP
    //
    // Backend requires:
    // email + phone
    // =========================================================

    const handleResendMobileOtp = async () => {
        clearMessages();

        const cleanEmail =
            email.trim().toLowerCase();

        const cleanPhone =
            normalizePhone(phone);

        if (!cleanEmail) {
            setError(
                "Email address is required."
            );
            return;
        }

        if (
            !cleanPhone ||
            cleanPhone.length !== 10
        ) {
            setError(
                "Valid 10-digit mobile number is required."
            );
            return;
        }

        try {
            setLoading(true);

            const response =
                await fetch(
                    `${AUTH_URL}/send-mobile-otp`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            email: cleanEmail,
                            phone: cleanPhone,
                        }),
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                        "Unable to resend mobile OTP."
                );
            }

            setMobileOtp("");

            setMobileOtpSent(true);

            if (data.developmentOtp) {
                setDevelopmentMobileOtp(
                    String(
                        data.developmentOtp
                    )
                );
            }

            setMessage(
                "New mobile OTP sent successfully."
            );

        } catch (error) {
            console.error(
                "Resend mobile OTP error:",
                error
            );

            setError(
                error.message ||
                    "Unable to resend mobile OTP."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // RESEND EMAIL OTP
    // =========================================================

    const handleResendEmailOtp = async () => {
        clearMessages();

        const cleanEmail =
            email.trim().toLowerCase();

        if (!cleanEmail) {
            setError(
                "Email address is required."
            );
            return;
        }

        try {
            setLoading(true);

            const response =
                await fetch(
                    `${AUTH_URL}/send-email-otp`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            email: cleanEmail,
                        }),
                    }
                );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                        "Unable to resend email OTP."
                );
            }

            setEmailOtp("");

            setEmailOtpSent(true);

            setMessage(
                "New email OTP sent successfully. Check your inbox."
            );

        } catch (error) {
            console.error(
                "Resend email OTP error:",
                error
            );

            setError(
                error.message ||
                    "Unable to resend email OTP."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // SAVE OWNER SESSION
    // =========================================================

    const saveOwnerSession = (data) => {
        if (data.user) {
            localStorage.setItem(
                "quickbite-owner",
                JSON.stringify(data.user)
            );
        }

        if (data.token) {
            localStorage.setItem(
                "quickbite-owner-token",
                data.token
            );
        }

        if (data.role) {
            localStorage.setItem(
                "quickbite-owner-role",
                data.role
            );
        }
    };

    // =========================================================
    // NAVIGATION
    // =========================================================

    const goToRegister = () => {
        window.location.href =
            "/restaurant-owner-register";
    };

    const goToHome = () => {
        window.location.href = "/";
    };

    // =========================================================
    // VERIFICATION SCREEN
    // =========================================================

    if (verificationMode) {
        return (
            <div style={styles.page}>

                <div style={styles.glowOne}></div>
                <div style={styles.glowTwo}></div>
                <div style={styles.grid}></div>

                <div style={styles.card}>

                    {/* Brand */}
                    <div style={styles.brand}>

                        <div style={styles.logo}>
                            QB
                        </div>

                        <div>
                            <div style={styles.brandName}>
                                QuickBite
                            </div>

                            <div style={styles.brandTagline}>
                                Restaurant Partner
                            </div>
                        </div>

                    </div>

                    {/* Verification Icon */}
                    <div style={styles.icon}>
                        🔐
                    </div>

                    <h1 style={styles.title}>
                        Secure Verification
                    </h1>

                    <p style={styles.subtitle}>
                        Verify your mobile number and
                        email address to access your
                        restaurant dashboard.
                    </p>

                    {/* ================================================= */}
                    {/* EMAIL VERIFICATION */}
                    {/* ================================================= */}

                    <div
                        style={
                            styles.verificationSection
                        }
                    >

                        <div
                            style={
                                styles.verificationHeader
                            }
                        >

                            <div>
                                <div
                                    style={
                                        styles.verifyLabel
                                    }
                                >
                                    EMAIL VERIFICATION
                                </div>

                                <div
                                    style={
                                        styles.verifyValue
                                    }
                                >
                                    {email}
                                </div>
                            </div>

                            <div
                                style={{
                                    ...styles.statusBadge,
                                    background:
                                        emailVerified
                                            ? "rgba(34,197,94,0.12)"
                                            : "rgba(249,115,22,0.10)",
                                    color:
                                        emailVerified
                                            ? "#4ade80"
                                            : "#fb923c",
                                    borderColor:
                                        emailVerified
                                            ? "rgba(34,197,94,0.20)"
                                            : "rgba(249,115,22,0.20)",
                                }}
                            >
                                {emailVerified
                                    ? "✓ Verified"
                                    : "Pending"}
                            </div>

                        </div>

                        {!emailVerified && (
                            <>
                                <div
                                    style={
                                        styles.inputWrapper
                                    }
                                >
                                    <span
                                        style={
                                            styles.inputIcon
                                        }
                                    >
                                        ✉
                                    </span>

                                    <input
                                        type="text"
                                        value={emailOtp}
                                        onChange={(e) =>
                                            setEmailOtp(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter email OTP"
                                        inputMode="numeric"
                                        maxLength={6}
                                        style={styles.input}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        handleVerifyEmail
                                    }
                                    disabled={loading}
                                    style={
                                        styles.verifyButton
                                    }
                                >
                                    {loading
                                        ? "Verifying..."
                                        : "Verify Email OTP"}
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleResendEmailOtp
                                    }
                                    disabled={loading}
                                    style={
                                        styles.resendButton
                                    }
                                >
                                    ↻ Resend Email OTP
                                </button>
                            </>
                        )}

                    </div>

                    {/* ================================================= */}
                    {/* MOBILE VERIFICATION */}
                    {/* ================================================= */}

                    <div
                        style={
                            styles.verificationSection
                        }
                    >

                        <div
                            style={
                                styles.verificationHeader
                            }
                        >

                            <div style={{ flex: 1 }}>

                                <div
                                    style={
                                        styles.verifyLabel
                                    }
                                >
                                    MOBILE VERIFICATION
                                </div>

                                <div
                                    style={
                                        styles.verifyValue
                                    }
                                >
                                    {phone
                                        ? `+91 ${phone}`
                                        : "Mobile number required"}
                                </div>

                            </div>

                            <div
                                style={{
                                    ...styles.statusBadge,
                                    background:
                                        mobileVerified
                                            ? "rgba(34,197,94,0.12)"
                                            : "rgba(249,115,22,0.10)",
                                    color:
                                        mobileVerified
                                            ? "#4ade80"
                                            : "#fb923c",
                                    borderColor:
                                        mobileVerified
                                            ? "rgba(34,197,94,0.20)"
                                            : "rgba(249,115,22,0.20)",
                                }}
                            >
                                {mobileVerified
                                    ? "✓ Verified"
                                    : "Pending"}
                            </div>

                        </div>

                        {!mobileVerified && (
                            <>
                                {/* Manual phone input */}
                                {!phone && (
                                    <div
                                        style={{
                                            ...styles.inputWrapper,
                                            marginBottom:
                                                "12px",
                                        }}
                                    >
                                        <span
                                            style={
                                                styles.inputIcon
                                            }
                                        >
                                            📱
                                        </span>

                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) =>
                                                setPhone(
                                                    normalizePhone(
                                                        e.target.value
                                                    )
                                                )
                                            }
                                            placeholder="10-digit mobile number"
                                            inputMode="numeric"
                                            maxLength={10}
                                            style={
                                                styles.input
                                            }
                                        />
                                    </div>
                                )}

                                {/* Mobile OTP */}
                                <div
                                    style={
                                        styles.inputWrapper
                                    }
                                >
                                    <span
                                        style={
                                            styles.inputIcon
                                        }
                                    >
                                        🔢
                                    </span>

                                    <input
                                        type="text"
                                        value={mobileOtp}
                                        onChange={(e) =>
                                            setMobileOtp(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter mobile OTP"
                                        inputMode="numeric"
                                        maxLength={6}
                                        style={styles.input}
                                    />
                                </div>

                                {/* Development OTP */}
                                {developmentMobileOtp && (
                                    <div
                                        style={
                                            styles.devOtpBox
                                        }
                                    >
                                        <span>
                                            Development OTP
                                        </span>

                                        <strong>
                                            {
                                                developmentMobileOtp
                                            }
                                        </strong>
                                    </div>
                                )}

                                {/* Verify Mobile */}
                                <button
                                    type="button"
                                    onClick={
                                        handleVerifyMobile
                                    }
                                    disabled={loading}
                                    style={
                                        styles.verifyButton
                                    }
                                >
                                    {loading
                                        ? "Verifying..."
                                        : "Verify Mobile OTP"}
                                </button>

                                {/* Resend Mobile */}
                                <button
                                    type="button"
                                    onClick={
                                        handleResendMobileOtp
                                    }
                                    disabled={loading}
                                    style={
                                        styles.resendButton
                                    }
                                >
                                    ↻ Resend Mobile OTP
                                </button>
                            </>
                        )}

                    </div>

                    {/* ================================================= */}
                    {/* MESSAGES */}
                    {/* ================================================= */}

                    {message && (
                        <div
                            style={
                                styles.successMessage
                            }
                        >
                            <span>✓</span>
                            <span>{message}</span>
                        </div>
                    )}

                    {error && (
                        <div
                            style={
                                styles.errorMessage
                            }
                        >
                            <span>ⓘ</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ================================================= */}
                    {/* PROGRESS */}
                    {/* ================================================= */}

                    <div
                        style={
                            styles.progressBox
                        }
                    >

                        <div
                            style={
                                styles.progressTitle
                            }
                        >
                            Verification Progress
                        </div>

                        <div
                            style={
                                styles.progressRow
                            }
                        >

                            <span>
                                {mobileVerified
                                    ? "✓"
                                    : "○"} Mobile
                            </span>

                            <span>
                                {emailVerified
                                    ? "✓"
                                    : "○"} Email
                            </span>

                        </div>

                        {mobileVerified &&
                            emailVerified && (
                                <button
                                    type="button"
                                    onClick={
                                        completeVerification
                                    }
                                    disabled={loading}
                                    style={
                                        styles.completeButton
                                    }
                                >
                                    {loading
                                        ? "Completing..."
                                        : "Continue to Owner Dashboard →"}
                                </button>
                            )}

                    </div>

                    {/* Back */}
                    <button
                        type="button"
                        onClick={() => {
                            setVerificationMode(false);
                            clearMessages();
                        }}
                        style={
                            styles.backButton
                        }
                    >
                        ← Back to Owner Login
                    </button>

                </div>

                <div style={styles.bottomText}>
                    QuickBite Restaurant Partner Portal
                    <span> • </span>
                    Secure Verification
                </div>

            </div>
        );
    }

    // =========================================================
    // LOGIN SCREEN
    // =========================================================

    return (
        <div style={styles.page}>

            {/* Ambient Background */}
            <div style={styles.glowOne}></div>
            <div style={styles.glowTwo}></div>
            <div style={styles.grid}></div>

            {/* Main Card */}
            <div style={styles.card}>

                {/* Brand */}
                <div style={styles.brand}>

                    <div style={styles.logo}>
                        QB
                    </div>

                    <div>
                        <div style={styles.brandName}>
                            QuickBite
                        </div>

                        <div style={styles.brandTagline}>
                            Restaurant Partner
                        </div>
                    </div>

                </div>

                {/* Icon */}
                <div style={styles.icon}>
                    🍽️
                </div>

                {/* Heading */}
                <h1 style={styles.title}>
                    Restaurant Owner
                </h1>

                <p style={styles.subtitle}>
                    Sign in to manage your restaurant,
                    orders and customers.
                </p>

                {/* Login Form */}
                <form onSubmit={handleLogin}>

                    {/* Email */}
                    <div style={styles.field}>

                        <label style={styles.label}>
                            Email Address
                        </label>

                        <div
                            style={
                                styles.inputWrapper
                            }
                        >
                            <span
                                style={
                                    styles.inputIcon
                                }
                            >
                                ✉
                            </span>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(
                                        e.target.value
                                    )
                                }
                                placeholder="owner@example.com"
                                autoComplete="email"
                                style={styles.input}
                            />
                        </div>

                    </div>

                    {/* Password */}
                    <div style={styles.field}>

                        <label style={styles.label}>
                            Password
                        </label>

                        <div
                            style={
                                styles.inputWrapper
                            }
                        >
                            <span
                                style={
                                    styles.inputIcon
                                }
                            >
                                🔒
                            </span>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                style={styles.input}
                            />
                        </div>

                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            style={
                                styles.errorMessage
                            }
                        >
                            <span>ⓘ</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success */}
                    {message && (
                        <div
                            style={
                                styles.successMessage
                            }
                        >
                            <span>✓</span>
                            <span>{message}</span>
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading
                                ? 0.7
                                : 1,
                            cursor: loading
                                ? "not-allowed"
                                : "pointer",
                        }}
                    >
                        {loading ? (
                            <>
                                <span
                                    style={
                                        styles.spinner
                                    }
                                ></span>

                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign In

                                <span
                                    style={
                                        styles.arrow
                                    }
                                >
                                    →
                                </span>
                            </>
                        )}
                    </button>

                </form>

                {/* Divider */}
                <div
                    style={styles.divider}
                >
                    <span
                        style={
                            styles.dividerLine
                        }
                    ></span>

                    <span
                        style={
                            styles.dividerText
                        }
                    >
                        NEW RESTAURANT PARTNER?
                    </span>

                    <span
                        style={
                            styles.dividerLine
                        }
                    ></span>
                </div>

                {/* Register */}
                <button
                    type="button"
                    onClick={goToRegister}
                    style={
                        styles.registerButton
                    }
                >
                    <span
                        style={
                            styles.registerIcon
                        }
                    >
                        +
                    </span>

                    <span>
                        Create New Restaurant Account
                    </span>
                </button>

                {/* Verification Info */}
                <div
                    style={
                        styles.verificationBox
                    }
                >
                    <div
                        style={
                            styles.verificationTitle
                        }
                    >
                        🔐 Secure Verification
                    </div>

                    <div
                        style={
                            styles.verificationText
                        }
                    >
                        New restaurant accounts require
                        <strong>
                            {" "}mobile OTP{" "}
                        </strong>
                        and
                        <strong>
                            {" "}email OTP
                        </strong>
                        {" "}verification.
                    </div>
                </div>

                {/* Back */}
                <button
                    type="button"
                    onClick={goToHome}
                    style={
                        styles.backButton
                    }
                >
                    ← Back to QuickBite
                </button>

            </div>

            {/* Bottom Text */}
            <div style={styles.bottomText}>
                QuickBite Restaurant Partner Portal
                <span> • </span>
                Secure Access
            </div>

        </div>
    );
}

// =========================================================
// STYLES
// =========================================================

const styles = {
    page: {
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 20px 70px",
        position: "relative",
        overflow: "hidden",
        background:
            "radial-gradient(circle at 20% 10%, rgba(249,115,22,0.13), transparent 35%)," +
            "radial-gradient(circle at 85% 80%, rgba(236,72,153,0.10), transparent 35%)," +
            "linear-gradient(135deg, #05060a 0%, #0a0c12 50%, #07080d 100%)",
        boxSizing: "border-box",
        fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    glowOne: {
        position: "absolute",
        width: "420px",
        height: "420px",
        borderRadius: "50%",
        background:
            "radial-gradient(circle, rgba(249,115,22,0.12), transparent 70%)",
        top: "-180px",
        left: "-150px",
        pointerEvents: "none",
    },

    glowTwo: {
        position: "absolute",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background:
            "radial-gradient(circle, rgba(236,72,153,0.10), transparent 70%)",
        bottom: "-260px",
        right: "-180px",
        pointerEvents: "none",
    },

    grid: {
        position: "absolute",
        inset: "0",
        opacity: 0.035,
        backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
        backgroundSize: "55px 55px",
        pointerEvents: "none",
    },

    card: {
        width: "100%",
        maxWidth: "455px",
        padding: "34px",
        borderRadius: "28px",
        position: "relative",
        zIndex: 2,
        background:
            "linear-gradient(145deg, rgba(20,23,32,0.97), rgba(10,12,18,0.97))",
        border:
            "1px solid rgba(255,255,255,0.09)",
        boxShadow:
            "0 30px 100px rgba(0,0,0,0.55)," +
            "inset 0 1px 0 rgba(255,255,255,0.04)",
        boxSizing: "border-box",
        backdropFilter: "blur(20px)",
    },

    brand: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "28px",
    },

    logo: {
        width: "42px",
        height: "42px",
        borderRadius: "13px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
            "linear-gradient(135deg, #f97316, #ef4444)",
        color: "#ffffff",
        fontSize: "15px",
        fontWeight: "900",
        letterSpacing: "-0.5px",
        boxShadow:
            "0 8px 25px rgba(249,115,22,0.25)",
    },

    brandName: {
        color: "#ffffff",
        fontSize: "16px",
        fontWeight: "800",
        letterSpacing: "-0.2px",
    },

    brandTagline: {
        color: "#71717a",
        fontSize: "11px",
        marginTop: "2px",
    },

    icon: {
        width: "72px",
        height: "72px",
        margin: "0 auto 20px",
        borderRadius: "22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "32px",
        background:
            "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(239,68,68,0.12))",
        border:
            "1px solid rgba(249,115,22,0.22)",
        boxShadow:
            "0 15px 40px rgba(249,115,22,0.10)",
    },

    title: {
        margin: "0",
        textAlign: "center",
        color: "#ffffff",
        fontSize: "29px",
        fontWeight: "800",
        letterSpacing: "-0.8px",
    },

    subtitle: {
        maxWidth: "340px",
        margin: "10px auto 30px",
        textAlign: "center",
        color: "#8b92a1",
        fontSize: "14px",
        lineHeight: "1.6",
    },

    field: {
        marginBottom: "20px",
    },

    label: {
        display: "block",
        marginBottom: "8px",
        color: "#d8dbe2",
        fontSize: "13px",
        fontWeight: "650",
    },

    inputWrapper: {
        position: "relative",
        display: "flex",
        alignItems: "center",
    },

    inputIcon: {
        position: "absolute",
        left: "15px",
        zIndex: 2,
        color: "#71717a",
        fontSize: "15px",
        pointerEvents: "none",
    },

    input: {
        width: "100%",
        height: "52px",
        padding: "0 16px 0 43px",
        borderRadius: "14px",
        border:
            "1px solid rgba(255,255,255,0.09)",
        background:
            "rgba(7,9,14,0.9)",
        color: "#ffffff",
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box",
        transition: "all 0.2s ease",
    },

    successMessage: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        marginBottom: "16px",
        padding: "12px 14px",
        borderRadius: "12px",
        background:
            "rgba(34,197,94,0.08)",
        border:
            "1px solid rgba(34,197,94,0.18)",
        color: "#86efac",
        fontSize: "13px",
        lineHeight: "1.4",
    },

    errorMessage: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        marginBottom: "16px",
        padding: "12px 14px",
        borderRadius: "12px",
        background:
            "rgba(239,68,68,0.08)",
        border:
            "1px solid rgba(239,68,68,0.18)",
        color: "#fca5a5",
        fontSize: "13px",
        lineHeight: "1.4",
    },

    button: {
        width: "100%",
        height: "53px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        border: "none",
        borderRadius: "14px",
        background:
            "linear-gradient(135deg, #f97316, #ef4444)",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "750",
        boxShadow:
            "0 12px 30px rgba(249,115,22,0.20)",
        transition: "all 0.2s ease",
    },

    arrow: {
        fontSize: "19px",
        lineHeight: 1,
    },

    spinner: {
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        border:
            "2px solid rgba(255,255,255,0.35)",
        borderTopColor: "#ffffff",
        display: "inline-block",
    },

    divider: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        margin: "28px 0 18px",
    },

    dividerLine: {
        flex: 1,
        height: "1px",
        background:
            "rgba(255,255,255,0.07)",
    },

    dividerText: {
        color: "#626775",
        fontSize: "9px",
        fontWeight: "700",
        letterSpacing: "1px",
        whiteSpace: "nowrap",
    },

    registerButton: {
        width: "100%",
        height: "50px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "9px",
        borderRadius: "14px",
        border:
            "1px solid rgba(249,115,22,0.25)",
        background:
            "rgba(249,115,22,0.06)",
        color: "#fb923c",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },

    registerIcon: {
        width: "21px",
        height: "21px",
        borderRadius: "7px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background:
            "rgba(249,115,22,0.14)",
        fontSize: "17px",
        fontWeight: "500",
    },

    verificationBox: {
        marginTop: "18px",
        padding: "14px 15px",
        borderRadius: "13px",
        background:
            "rgba(255,255,255,0.025)",
        border:
            "1px solid rgba(255,255,255,0.06)",
    },

    verificationTitle: {
        color: "#d4d4d8",
        fontSize: "12px",
        fontWeight: "700",
        marginBottom: "5px",
    },

    verificationText: {
        color: "#71717a",
        fontSize: "11px",
        lineHeight: "1.55",
    },

    verificationSection: {
        marginBottom: "18px",
        padding: "16px",
        borderRadius: "16px",
        background:
            "rgba(255,255,255,0.025)",
        border:
            "1px solid rgba(255,255,255,0.07)",
    },

    verificationHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "14px",
    },

    verifyLabel: {
        color: "#71717a",
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "1px",
        marginBottom: "4px",
    },

    verifyValue: {
        color: "#d4d4d8",
        fontSize: "12px",
        wordBreak: "break-word",
    },

    statusBadge: {
        padding: "5px 9px",
        borderRadius: "20px",
        border: "1px solid",
        fontSize: "9px",
        fontWeight: "800",
        whiteSpace: "nowrap",
    },

    verifyButton: {
        width: "100%",
        height: "45px",
        marginTop: "12px",
        border: "none",
        borderRadius: "12px",
        background:
            "linear-gradient(135deg, #f97316, #ef4444)",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: "750",
        cursor: "pointer",
    },

    resendButton: {
        width: "100%",
        marginTop: "9px",
        padding: "8px",
        border: "none",
        background: "transparent",
        color: "#fb923c",
        fontSize: "11px",
        fontWeight: "700",
        cursor: "pointer",
    },

    devOtpBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        marginTop: "10px",
        padding: "9px 11px",
        borderRadius: "10px",
        background:
            "rgba(234,179,8,0.07)",
        border:
            "1px solid rgba(234,179,8,0.16)",
        color: "#facc15",
        fontSize: "10px",
    },

    progressBox: {
        marginTop: "5px",
        padding: "14px",
        borderRadius: "14px",
        background:
            "rgba(255,255,255,0.025)",
        border:
            "1px solid rgba(255,255,255,0.06)",
    },

    progressTitle: {
        color: "#a1a1aa",
        fontSize: "11px",
        fontWeight: "700",
        marginBottom: "10px",
    },

    progressRow: {
        display: "flex",
        justifyContent: "space-between",
        color: "#d4d4d8",
        fontSize: "11px",
    },

    completeButton: {
        width: "100%",
        height: "46px",
        marginTop: "14px",
        border: "none",
        borderRadius: "12px",
        background:
            "linear-gradient(135deg, #22c55e, #16a34a)",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: "750",
        cursor: "pointer",
        boxShadow:
            "0 10px 25px rgba(34,197,94,0.16)",
    },

    backButton: {
        width: "100%",
        marginTop: "20px",
        padding: "8px",
        border: "none",
        background: "transparent",
        color: "#71717a",
        fontSize: "12px",
        cursor: "pointer",
        transition: "color 0.2s ease",
    },

    bottomText: {
        position: "absolute",
        bottom: "22px",
        left: "20px",
        right: "20px",
        zIndex: 2,
        textAlign: "center",
        color: "#41444d",
        fontSize: "10px",
        letterSpacing: "0.3px",
    },
};

export default RestaurantOwnerLogin;
