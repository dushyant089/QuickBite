import React, { useEffect, useRef, useState } from "react";
import API_BASE_URL from "../config";

const API_URL = `${API_BASE_URL}/auth`;

const Auth = () => {
  const pathname = window.location.pathname;

  const mode = pathname.includes("forgot-password")
    ? "forgot"
    : pathname.includes("signup") || pathname.includes("register")
    ? "signup"
    : "login";

  // =========================================================
  // INPUT REFS
  // =========================================================

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const phoneRef = useRef(null);

  const mobileOtpRef = useRef(null);
  const emailOtpRef = useRef(null);

  const resetOtpRef = useRef(null);
  const newPasswordRef = useRef(null);

  // =========================================================
  // STATE
  // =========================================================

  const [step, setStep] = useState("form");

  const [verificationData, setVerificationData] = useState({
    emailVerified: false,
    mobileVerified: false,
  });

  // OTP screen par email/phone inputs unmount ho jate hain.
  // Isliye verification ke liye contact permanently state mein rakhenge.
  const [verificationContact, setVerificationContact] = useState({
    email: "",
    phone: "",
  });

  // Development/testing only
  const [developmentMobileOtp, setDevelopmentMobileOtp] =
    useState("");

  const [developmentEmailOtp, setDevelopmentEmailOtp] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // HELPERS
  // =========================================================

  const getValue = (ref) =>
    String(ref.current?.value || "").trim();

  const setValue = (ref, value) => {
    if (ref.current) {
      ref.current.value = value ?? "";
    }
  };

  const clearAlerts = () => {
    setMessage("");
    setError("");
  };

  const goTo = (path) => {
    window.location.href = path;
  };

  const normalizePhone = (value) =>
    String(value || "")
      .replace(/\D/g, "")
      .slice(0, 10);

  const getVerificationEmail = () =>
    String(verificationContact.email || "")
      .trim()
      .toLowerCase();

  const getVerificationPhone = () =>
    normalizePhone(verificationContact.phone);

  const readResponse = async (response) => {
    const raw = await response.text();

    let data = {};

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = {
          message: raw,
        };
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      raw,
    };
  };

  // =========================================================
  // SESSION
  // =========================================================

  const saveUserSession = (data) => {
    const token =
      data?.token ||
      data?.jwt ||
      data?.accessToken ||
      data?.data?.token ||
      data?.user?.token ||
      "";

    const user =
      data?.user ||
      data?.data?.user ||
      data?.profile ||
      null;

    if (token) {
      localStorage.setItem(
        "quickbite-user-token",
        token
      );

      localStorage.setItem(
        "quickbite-token",
        token
      );

      localStorage.setItem(
        "token",
        token
      );
    }

    if (user) {
      localStorage.setItem(
        "quickbite-user",
        JSON.stringify({
          ...user,
          loggedIn: true,
        })
      );

      if (user.role) {
        localStorage.setItem(
          "quickbite-user-role",
          String(user.role).toUpperCase()
        );
      }
    } else {
      const fallbackUser = {
        email:
          data?.email ||
          getVerificationEmail() ||
          getValue(emailRef),

        role:
          data?.role ||
          "CUSTOMER",

        loggedIn: true,
      };

      localStorage.setItem(
        "quickbite-user",
        JSON.stringify(fallbackUser)
      );

      localStorage.setItem(
        "quickbite-user-role",
        String(
          fallbackUser.role
        ).toUpperCase()
      );
    }

    localStorage.setItem(
      "quickbite-user-logged-in",
      "true"
    );
  };

  // =========================================================
  // AUTO OTP FOCUS
  // =========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === "otp") {
        if (!verificationData.mobileVerified) {
          mobileOtpRef.current?.focus();
        } else if (!verificationData.emailVerified) {
          emailOtpRef.current?.focus();
        }
      }

      if (step === "forgotOtp") {
        resetOtpRef.current?.focus();
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [
    step,
    verificationData.mobileVerified,
    verificationData.emailVerified,
  ]);

  // =========================================================
  // START VERIFICATION
  // =========================================================

  const startVerification = async (
    email,
    phone,
    existingVerification = {
      emailVerified: false,
      mobileVerified: false,
    }
  ) => {
    setLoading(true);
    clearAlerts();

    try {
      const cleanEmail = String(email || "")
        .trim()
        .toLowerCase();

      const cleanPhone = normalizePhone(phone);

      if (!cleanEmail) {
        throw new Error(
          "Email is required."
        );
      }

      if (cleanPhone.length !== 10) {
        throw new Error(
          "Please enter a valid 10-digit mobile number."
        );
      }

      // IMPORTANT:
      // OTP screen par input refs unmount ho jayenge.
      // Isliye email + phone ko state mein save kar rahe hain.
      setVerificationContact({
        email: cleanEmail,
        phone: cleanPhone,
      });

      // -------------------------------------------------------
      // MOBILE OTP
      // -------------------------------------------------------

      const mobileResponse = await fetch(
        `${API_URL}/send-mobile-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: cleanEmail,
            phone: cleanPhone,
          }),
        }
      );

      const mobileResult =
        await readResponse(mobileResponse);

      if (!mobileResult.ok) {
        throw new Error(
          mobileResult.data?.message ||
            mobileResult.data?.error ||
            mobileResult.raw ||
            `Unable to send mobile OTP. HTTP ${mobileResult.status}`
        );
      }

      // -------------------------------------------------------
      // EMAIL OTP
      // -------------------------------------------------------

      const emailResponse = await fetch(
        `${API_URL}/send-email-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const emailResult =
        await readResponse(emailResponse);

      if (!emailResult.ok) {
        throw new Error(
          emailResult.data?.message ||
            emailResult.data?.error ||
            emailResult.raw ||
            `Unable to send email OTP. HTTP ${emailResult.status}`
        );
      }

      // -------------------------------------------------------
      // RESTORE VALUES
      // -------------------------------------------------------

      setValue(
        emailRef,
        cleanEmail
      );

      setValue(
        phoneRef,
        cleanPhone
      );

      setVerificationData({
        emailVerified:
          existingVerification?.emailVerified ||
          false,

        mobileVerified:
          existingVerification?.mobileVerified ||
          false,
      });

      // -------------------------------------------------------
      // DEVELOPMENT MOBILE OTP
      // -------------------------------------------------------

      setDevelopmentMobileOtp(
        mobileResult.data?.developmentOtp ||
          mobileResult.data?.otp ||
          ""
      );

      // -------------------------------------------------------
      // DEVELOPMENT EMAIL OTP
      // -------------------------------------------------------

      setDevelopmentEmailOtp(
        emailResult.data?.developmentOtp ||
          emailResult.data?.otp ||
          ""
      );

      setStep("otp");

      setMessage(
        "Verification codes sent successfully."
      );
    } catch (err) {
      console.error(
        "Verification start error:",
        err
      );

      setError(
        err?.message ||
          "Unable to start verification."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    clearAlerts();

    const email =
      getValue(emailRef).toLowerCase();

    const password =
      String(
        passwordRef.current?.value || ""
      );

    if (!email || !password) {
      setError(
        "Please enter email and password."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const result =
        await readResponse(response);

      const data = result.data;

      // -------------------------------------------------------
      // ROLE CHECK
      // -------------------------------------------------------

      const returnedRole =
        String(
          data?.role ||
            data?.user?.role ||
            data?.data?.role ||
            data?.data?.user?.role ||
            ""
        ).toUpperCase();

      // IMPORTANT:
      // Admin aur Restaurant Owner ko customer OTP flow
      // mein nahi bhejna hai.
      const isCustomer =
        !returnedRole ||
        returnedRole === "CUSTOMER";

      const verificationRequired =
        data?.verificationRequired ||
        data?.requiresVerification ||
        data?.emailVerified === false ||
        data?.mobileVerified === false;

      // -------------------------------------------------------
      // CUSTOMER VERIFICATION ONLY
      // -------------------------------------------------------

      if (
        isCustomer &&
        verificationRequired
      ) {
        const returnedEmail =
          data?.email ||
          data?.user?.email ||
          email;

        const returnedPhone =
          data?.phone ||
          data?.mobile ||
          data?.user?.phone ||
          "";

        const emailVerified =
          data?.emailVerified ??
          data?.user?.emailVerified ??
          false;

        const mobileVerified =
          data?.mobileVerified ??
          data?.user?.mobileVerified ??
          false;

        const cleanReturnedEmail =
          String(returnedEmail || "")
            .trim()
            .toLowerCase();

        const cleanReturnedPhone =
          normalizePhone(returnedPhone);

        setValue(
          emailRef,
          cleanReturnedEmail
        );

        setValue(
          phoneRef,
          cleanReturnedPhone
        );

        setVerificationContact({
          email: cleanReturnedEmail,
          phone: cleanReturnedPhone,
        });

        setVerificationData({
          emailVerified,
          mobileVerified,
        });

        if (cleanReturnedPhone) {
          setMessage(
            "Your customer account needs verification."
          );

          await startVerification(
            cleanReturnedEmail,
            cleanReturnedPhone,
            {
              emailVerified,
              mobileVerified,
            }
          );
        } else {
          setStep("verification");

          setError(
            "The server did not return the registered mobile number."
          );
        }

        return;
      }

      // -------------------------------------------------------
      // ADMIN / OWNER / NORMAL LOGIN
      // -------------------------------------------------------

      if (!result.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            result.raw ||
            `Login failed. HTTP ${result.status}`
        );
      }

      saveUserSession(data);

      setMessage(
        data?.message ||
          "Login successful."
      );

      setTimeout(() => {
        window.location.href = "/";
      }, 600);
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        err?.message ||
          "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SIGNUP
  // =========================================================

  const handleSignup = async (e) => {
    e.preventDefault();

    clearAlerts();

    const name =
      getValue(nameRef);

    const email =
      getValue(emailRef).toLowerCase();

    const password =
      String(
        passwordRef.current?.value || ""
      );

    const phone =
      normalizePhone(
        phoneRef.current?.value
      );

    if (
      !name ||
      !email ||
      !password ||
      !phone
    ) {
      setError(
        "Please fill all required fields."
      );

      return;
    }

    if (phone.length !== 10) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );

      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/signup`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            password,
            phone,
          }),
        }
      );

      const result =
        await readResponse(response);

      const data = result.data;

      if (!result.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            result.raw ||
            `Signup failed. HTTP ${result.status}`
        );
      }

      setValue(
        emailRef,
        email
      );

      setValue(
        phoneRef,
        phone
      );

      setVerificationContact({
        email,
        phone,
      });

      await startVerification(
        data?.email ||
          data?.user?.email ||
          email,

        data?.phone ||
          data?.mobile ||
          data?.user?.phone ||
          phone,

        {
          emailVerified:
            data?.emailVerified ??
            data?.user?.emailVerified ??
            false,

          mobileVerified:
            data?.mobileVerified ??
            data?.user?.mobileVerified ??
            false,
        }
      );
    } catch (err) {
      console.error(
        "Signup error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // VERIFY MOBILE OTP
  // =========================================================

  const verifyMobileOtp = async () => {
    clearAlerts();

    const email =
      getVerificationEmail();

    const otp =
      getValue(mobileOtpRef);

    if (!email) {
      setError(
        "Email is required for verification."
      );

      return;
    }

    if (!otp) {
      setError(
        "Please enter mobile OTP."
      );

      mobileOtpRef.current?.focus();

      return;
    }

    if (otp.length !== 6) {
      setError(
        "Mobile OTP must be 6 digits."
      );

      mobileOtpRef.current?.focus();

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/verify-mobile-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            otp,
          }),
        }
      );

      const result =
        await readResponse(response);

      if (!result.ok) {
        throw new Error(
          result.data?.message ||
            result.data?.error ||
            result.raw ||
            `Mobile OTP verification failed. HTTP ${result.status}`
        );
      }

      setVerificationData((prev) => ({
        ...prev,
        mobileVerified: true,
      }));

      setMessage(
        "Mobile number verified successfully."
      );

      setTimeout(() => {
        emailOtpRef.current?.focus();
      }, 250);
    } catch (err) {
      console.error(
        "Mobile verification error:",
        err
      );

      setError(
        err?.message ||
          "Unable to verify mobile OTP."
      );

      setTimeout(() => {
        mobileOtpRef.current?.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // VERIFY EMAIL OTP
  // =========================================================

  const verifyEmailOtp = async () => {
    clearAlerts();

    const email =
      getVerificationEmail();

    const otp =
      getValue(emailOtpRef);

    if (!email) {
      setError(
        "Email is required for verification."
      );

      return;
    }

    if (!otp) {
      setError(
        "Please enter email OTP."
      );

      emailOtpRef.current?.focus();

      return;
    }

    if (otp.length !== 6) {
      setError(
        "Email OTP must be 6 digits."
      );

      emailOtpRef.current?.focus();

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/verify-email-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            otp,
          }),
        }
      );

      const result =
        await readResponse(response);

      if (!result.ok) {
        throw new Error(
          result.data?.message ||
            result.data?.error ||
            result.raw ||
            `Email OTP verification failed. HTTP ${result.status}`
        );
      }

      setVerificationData((prev) => ({
        ...prev,
        emailVerified: true,
      }));

      setMessage(
        "Email verified successfully."
      );
    } catch (err) {
      console.error(
        "Email verification error:",
        err
      );

      setError(
        err?.message ||
          "Unable to verify email OTP."
      );

      setTimeout(() => {
        emailOtpRef.current?.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // COMPLETE VERIFICATION
  // =========================================================

  const completeVerification = async () => {
    clearAlerts();

    const email =
      getVerificationEmail();

    if (!email) {
      setError(
        "Email is required for verification."
      );

      return;
    }

    if (
      !verificationData.emailVerified ||
      !verificationData.mobileVerified
    ) {
      setError(
        "Please verify both email and mobile number first."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/complete-verification`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const result =
        await readResponse(response);

      if (!result.ok) {
        throw new Error(
          result.data?.message ||
            result.data?.error ||
            result.raw ||
            `Verification completion failed. HTTP ${result.status}`
        );
      }

      saveUserSession(
        result.data
      );

      setMessage(
        "Account verified successfully."
      );

      setTimeout(() => {
        window.location.href = "/";
      }, 700);
    } catch (err) {
      console.error(
        "Complete verification error:",
        err
      );

      setError(
        err?.message ||
          "Unable to complete verification."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESEND MOBILE OTP
  // =========================================================

  const resendMobileOtp = async () => {
    clearAlerts();

    const email =
      getVerificationEmail();

    const phone =
      getVerificationPhone();

    if (
      !email ||
      phone.length !== 10
    ) {
      setError(
        "Valid email and mobile number are required."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/send-mobile-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            phone,
          }),
        }
      );

      const result =
        await readResponse(response);

      if (!result.ok) {
        throw new Error(
          result.data?.message ||
            result.data?.error ||
            result.raw ||
            "Unable to resend mobile OTP."
        );
      }

      setDevelopmentMobileOtp(
        result.data?.developmentOtp ||
          result.data?.otp ||
          ""
      );

      setMessage(
        "Mobile OTP resent successfully."
      );

      setTimeout(() => {
        mobileOtpRef.current?.focus();
      }, 150);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to resend mobile OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESEND EMAIL OTP
  // =========================================================

  const resendEmailOtp = async () => {
    clearAlerts();

    const email =
      getVerificationEmail();

    if (!email) {
      setError(
        "Email is required."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/send-email-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const result =
        await readResponse(response);

      if (!result.ok) {
        throw new Error(
          result.data?.message ||
            result.data?.error ||
            result.raw ||
            "Unable to resend email OTP."
        );
      }

      // Development/testing:
      // backend response se email OTP screen par show.
      setDevelopmentEmailOtp(
        result.data?.developmentOtp ||
          result.data?.otp ||
          ""
      );

      setMessage(
        "Email OTP resent successfully."
      );

      setTimeout(() => {
        emailOtpRef.current?.focus();
      }, 150);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to resend email OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  const sendForgotPasswordOtp = async (e) => {
    e.preventDefault();

    clearAlerts();

    const email =
      getValue(emailRef).toLowerCase();

    if (!email) {
      setError(
        "Please enter your email."
      );

      emailRef.current?.focus();

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const result =
        await readResponse(response);

      if (!result.ok) {
        throw new Error(
          result.data?.message ||
            result.data?.error ||
            result.raw ||
            "Unable to send reset OTP."
        );
      }

      setStep("forgotOtp");

      setMessage(
        result.data?.message ||
          "Password reset OTP sent."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to send password reset OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // VERIFY RESET OTP
  // =========================================================

  const verifyResetOtp = async () => {
    clearAlerts();

    const email =
      getValue(emailRef).toLowerCase();

    const otp =
      getValue(resetOtpRef);

    if (!otp) {
      setError(
        "Please enter reset OTP."
      );

      resetOtpRef.current?.focus();

      return;
    }

    if (otp.length !== 6) {
      setError(
        "OTP must be 6 digits."
      );

      resetOtpRef.current?.focus();

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/verify-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            otp,
          }),
        }
      );

      const result =
        await readResponse(response);

      if (!result.ok) {
        throw new Error(
          result.data?.message ||
            result.data?.error ||
            result.raw ||
            "Invalid reset OTP."
        );
      }

      setStep("reset");

      setMessage(
        "OTP verified. Create your new password."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to verify reset OTP."
      );

      setTimeout(() => {
        resetOtpRef.current?.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESEND RESET OTP
  // =========================================================

  const resendResetOtp = async () => {
    clearAlerts();

    const email =
      getValue(emailRef).toLowerCase();

    if (!email) {
      setError(
        "Email is required."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/resend-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const result =
        await readResponse(response);

      if (!result.ok) {
        throw new Error(
          result.data?.message ||
            result.data?.error ||
            result.raw ||
            "Unable to resend reset OTP."
        );
      }

      setMessage(
        "Reset OTP resent successfully."
      );

      setTimeout(() => {
        resetOtpRef.current?.focus();
      }, 150);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to resend reset OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  const resetPassword = async () => {
    clearAlerts();

    const email =
      getValue(emailRef).toLowerCase();

    const otp =
      getValue(resetOtpRef);

    const newPassword =
      String(
        newPasswordRef.current?.value || ""
      );

    if (
      !email ||
      !otp ||
      !newPassword
    ) {
      setError(
        "Please complete all reset fields."
      );

      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must be at least 6 characters."
      );

      newPasswordRef.current?.focus();

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            otp,
            newPassword,
          }),
        }
      );

      const result =
        await readResponse(response);

      if (!result.ok) {
        throw new Error(
          result.data?.message ||
            result.data?.error ||
            result.raw ||
            "Unable to reset password."
        );
      }

      setMessage(
        "Password reset successfully. Redirecting..."
      );

      setTimeout(() => {
        goTo("/login");
      }, 900);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // PREMIUM CSS
  // =========================================================

  const css = `
    * {
      box-sizing: border-box;
    }

    html,
    body,
    #root {
      margin: 0;
      min-height: 100%;
    }

    body {
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      background: #09090b;
    }

    button,
    input {
      font: inherit;
    }

    .qb-shell {
      min-height: 100vh;
      display: flex;
      overflow: hidden;
      position: relative;

      background:
        radial-gradient(
          circle at 88% 4%,
          rgba(249,115,22,0.13),
          transparent 23%
        ),

        radial-gradient(
          circle at 12% 95%,
          rgba(244,63,94,0.08),
          transparent 25%
        ),

        #f8fafc;
    }

    .qb-hero {
      width: 48%;
      min-height: 100vh;
      position: relative;
      overflow: hidden;
      color: #fff;

      background:
        radial-gradient(
          circle at 72% 18%,
          rgba(251,146,60,0.20),
          transparent 20%
        ),

        radial-gradient(
          circle at 18% 82%,
          rgba(244,63,94,0.14),
          transparent 23%
        ),

        linear-gradient(
          145deg,
          #09090b 0%,
          #171717 53%,
          #431407 100%
        );
    }

    .qb-hero-grid {
      position: absolute;
      inset: 0;
      opacity: 0.13;

      background-image:
        linear-gradient(
          rgba(255,255,255,0.07) 1px,
          transparent 1px
        ),

        linear-gradient(
          90deg,
          rgba(255,255,255,0.07) 1px,
          transparent 1px
        );

      background-size: 56px 56px;

      mask-image:
        linear-gradient(
          to bottom,
          black 20%,
          transparent 92%
        );
    }

    .qb-orb {
      position: absolute;
      width: 540px;
      height: 540px;
      right: -180px;
      top: 80px;
      border-radius: 50%;

      border:
        1px solid rgba(255,255,255,0.07);

      box-shadow:
        inset 0 0 100px rgba(249,115,22,0.06),
        0 0 140px rgba(249,115,22,0.08);
    }

    .qb-orb::before {
      content: "";
      position: absolute;
      inset: 76px;
      border-radius: 50%;

      border:
        1px solid rgba(255,255,255,0.06);
    }

    .qb-hero-inner {
      position: relative;
      z-index: 3;
      min-height: 100vh;
      padding: 48px 52px;

      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .qb-brand {
      display: flex;
      align-items: center;
      gap: 13px;
    }

    .qb-brand-icon {
      width: 52px;
      height: 52px;
      border-radius: 17px;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 26px;

      background:
        linear-gradient(
          135deg,
          #fb923c,
          #ef4444
        );

      box-shadow:
        0 18px 38px rgba(249,115,22,0.28);
    }

    .qb-brand-text {
      font-size: 29px;
      font-weight: 950;
      letter-spacing: -1px;
    }

    .qb-small-pill {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      padding: 10px 15px;
      border-radius: 999px;

      color: #fed7aa;
      font-size: 12px;
      font-weight: 950;
      letter-spacing: 1.05px;
      text-transform: uppercase;

      border:
        1px solid rgba(255,255,255,0.11);

      background:
        rgba(255,255,255,0.055);

      backdrop-filter: blur(15px);
    }

    .qb-live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fb923c;

      box-shadow:
        0 0 14px rgba(251,146,60,0.8);
    }

    .qb-main-title {
      margin: 25px 0 19px;
      max-width: 700px;

      font-size:
        clamp(50px, 5.8vw, 78px);

      line-height: 0.97;
      letter-spacing: -4.2px;
      font-weight: 950;
    }

    .qb-main-title span {
      background:
        linear-gradient(
          135deg,
          #fb923c,
          #fb7185
        );

      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .qb-main-copy {
      max-width: 540px;
      margin: 0;
      color: #a1a1aa;
      line-height: 1.8;
      font-size: 18px;
    }

    .qb-feature-row {
      margin-top: 36px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      max-width: 640px;
    }

    .qb-feature {
      padding: 16px 17px;
      border:
        1px solid rgba(255,255,255,0.08);

      border-radius: 18px;
      background:
        rgba(255,255,255,0.045);

      backdrop-filter: blur(14px);
      min-width: 145px;
    }

    .qb-feature-icon {
      margin-bottom: 8px;
      font-size: 21px;
    }

    .qb-feature-title {
      color: #e4e4e7;
      font-size: 14px;
      font-weight: 900;
    }

    .qb-food-card {
      position: absolute;
      z-index: 4;
      right: 8%;
      bottom: 15%;
      width: 198px;
      padding: 16px;
      border-radius: 26px;

      border:
        1px solid rgba(255,255,255,0.13);

      background:
        linear-gradient(
          145deg,
          rgba(255,255,255,0.10),
          rgba(255,255,255,0.035)
        );

      box-shadow:
        0 25px 70px rgba(0,0,0,0.34);

      backdrop-filter: blur(25px);
      transform: rotate(5deg);
    }

    .qb-food-image {
      height: 130px;
      border-radius: 20px;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 76px;

      background:
        radial-gradient(
          circle at 50% 38%,
          rgba(251,146,60,0.37),
          transparent 46%
        ),

        linear-gradient(
          145deg,
          #27272a,
          #18181b
        );
    }

    .qb-food-label {
      margin-top: 12px;
    }

    .qb-food-name {
      color: #fafafa;
      font-size: 14px;
      font-weight: 950;
    }

    .qb-food-meta {
      margin-top: 4px;
      color: #a1a1aa;
      font-size: 12px;
    }

    .qb-hero-footer {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      color: #71717a;
      font-size: 13px;
    }

    .qb-panel {
      width: 52%;
      min-height: 100vh;
      padding: 28px;

      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qb-card {
      position: relative;
      width: 100%;
      max-width: 600px;
      padding: 46px;
      border-radius: 36px;

      background:
        rgba(255,255,255,0.92);

      border:
        1px solid rgba(255,255,255,0.96);

      box-shadow:
        0 38px 110px rgba(15,23,42,0.13);

      backdrop-filter: blur(26px);
    }

    .qb-card::before {
      content: "";
      position: absolute;
      width: 190px;
      height: 190px;
      right: -70px;
      top: -70px;
      border-radius: 50%;

      background:
        radial-gradient(
          circle,
          rgba(249,115,22,0.17),
          transparent 67%
        );

      pointer-events: none;
    }

    .qb-mobile-brand {
      display: none;
    }

    .qb-eyebrow {
      margin-bottom: 11px;
      color: #ea580c;
      font-size: 12px;
      font-weight: 950;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .qb-title {
      margin: 0;
      max-width: 540px;
      color: #09090b;
      font-size: 45px;
      line-height: 1.05;
      letter-spacing: -2.2px;
      font-weight: 950;
    }

    .qb-subtitle {
      margin: 14px 0 0;
      max-width: 535px;
      color: #52525b;
      font-size: 16px;
      line-height: 1.8;
    }

    .qb-label {
      display: block;
      margin: 21px 0 9px;
      color: #27272a;
      font-size: 13px;
      font-weight: 950;
    }

    .qb-input {
      width: 100%;
      height: 61px;
      padding: 0 19px;
      border-radius: 17px;

      border:
        1px solid #e4e4e7;

      background:
        linear-gradient(
          180deg,
          #fafafa,
          #f8fafc
        );

      color: #18181b;
      font-size: 16px;
      outline: none;

      transition:
        border-color 0.2s ease,
        background 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;
    }

    .qb-input:hover {
      border-color: #d4d4d8;
    }

    .qb-input:focus {
      border-color: #fb923c;
      background: #ffffff;

      box-shadow:
        0 0 0 4px rgba(251,146,60,0.10),
        0 12px 28px rgba(15,23,42,0.06);
    }

    .qb-input::placeholder {
      color: #a1a1aa;
      font-size: 15px;
    }

    .qb-input-otp {
      text-align: center;
      letter-spacing: 8px;
      font-size: 22px;
      font-weight: 950;
    }

    .qb-primary {
      width: 100%;
      height: 61px;
      margin-top: 24px;
      border: none;
      border-radius: 18px;
      color: white;
      cursor: pointer;
      font-size: 16px;
      font-weight: 950;

      background:
        linear-gradient(
          135deg,
          #fb923c,
          #f97316 48%,
          #ef4444
        );

      box-shadow:
        0 18px 35px rgba(239,68,68,0.20);

      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        opacity 0.2s ease;
    }

    .qb-primary:hover:not(:disabled) {
      transform: translateY(-2px);

      box-shadow:
        0 23px 42px rgba(239,68,68,0.27);
    }

    .qb-primary:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .qb-secondary {
      width: 100%;
      height: 54px;
      margin-top: 11px;

      border:
        1px solid #fed7aa;

      border-radius: 16px;
      color: #c2410c;
      background: #fff7ed;
      font-size: 14px;
      font-weight: 900;
      cursor: pointer;
    }

    .qb-link {
      padding: 0;
      border: none;
      background: transparent;
      color: #ea580c;
      cursor: pointer;
      font-size: 14px;
      font-weight: 950;
    }

    .qb-center {
      margin-top: 23px;
      text-align: center;
      color: #71717a;
      font-size: 14px;
    }

    .qb-alert {
      margin-top: 18px;
      padding: 15px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.6;
      font-weight: 800;
    }

    .qb-error {
      color: #be123c;
      background: #fff1f2;
      border:
        1px solid #fecdd3;
    }

    .qb-success {
      color: #166534;
      background: #f0fdf4;
      border:
        1px solid #bbf7d0;
    }

    .qb-status-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0,1fr));
      gap: 10px;
      margin-top: 20px;
    }

    .qb-status {
      padding: 15px;
      border-radius: 17px;
      background: #fafafa;
      border:
        1px solid #e4e4e7;
    }

    .qb-status.verified {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .qb-status-label {
      color: #71717a;
      font-size: 11px;
      font-weight: 950;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .qb-status-value {
      margin-top: 6px;
      color: #b45309;
      font-size: 14px;
      font-weight: 950;
    }

    .qb-status.verified .qb-status-value {
      color: #15803d;
    }

    .qb-development {
      margin-top: 15px;
      padding: 17px;
      border-radius: 18px;

      border:
        1px solid #fed7aa;

      background:
        linear-gradient(
          135deg,
          #fff7ed,
          #fffbeb
        );
    }

    .qb-development-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
    }

    .qb-development-label {
      color: #c2410c;
      font-size: 11px;
      font-weight: 950;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .qb-development-note {
      margin-top: 5px;
      color: #92400e;
      font-size: 12px;
    }

    .qb-development-code {
      color: #9a3412;
      font-size: 27px;
      font-weight: 950;
      letter-spacing: 5px;
    }

    .qb-otp-box {
      margin-top: 14px;
      padding: 19px;
      border-radius: 21px;

      border:
        1px solid #e4e4e7;

      background:
        rgba(255,255,255,0.87);

      box-shadow:
        0 10px 28px rgba(15,23,42,0.05);
    }

    .qb-complete {
      margin-top: 14px;
      padding: 20px;
      border-radius: 20px;
      text-align: center;
      background: #f0fdf4;

      border:
        1px solid #bbf7d0;
    }

    @media (max-width: 1100px) {
      .qb-hero-inner {
        padding: 40px;
      }

      .qb-card {
        padding: 36px;
      }

      .qb-food-card {
        right: 6%;
        bottom: 20%;
        transform:
          scale(0.92)
          rotate(5deg);
      }

      .qb-main-title {
        font-size: 56px;
      }

      .qb-title {
        font-size: 40px;
      }
    }

    @media (max-width: 900px) {
      .qb-shell {
        display: block;
      }

      .qb-hero {
        display: none;
      }

      .qb-panel {
        width: 100%;
        min-height: 100vh;
        padding: 14px;
        align-items: flex-start;
      }

      .qb-card {
        max-width: 680px;
        margin: 0 auto;
        padding: 29px 21px;
        border-radius: 28px;
      }

      .qb-mobile-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 29px;
      }

      .qb-mobile-logo {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        font-size: 21px;

        background:
          linear-gradient(
            135deg,
            #fb923c,
            #ef4444
          );

        box-shadow:
          0 12px 25px rgba(249,115,22,0.21);
      }

      .qb-mobile-name {
        color: #09090b;
        font-size: 25px;
        font-weight: 950;
      }

      .qb-title {
        font-size: 34px;
      }

      .qb-subtitle {
        font-size: 15px;
      }
    }

    @media (max-width: 520px) {
      .qb-panel {
        padding: 9px;
      }

      .qb-card {
        padding: 24px 16px;
        border-radius: 24px;

        box-shadow:
          0 20px 55px rgba(15,23,42,0.11);
      }

      .qb-mobile-brand {
        margin-bottom: 25px;
      }

      .qb-mobile-name {
        font-size: 23px;
      }

      .qb-title {
        font-size: 31px;
        letter-spacing: -1.1px;
      }

      .qb-subtitle {
        font-size: 14px;
        line-height: 1.7;
      }

      .qb-eyebrow {
        font-size: 11px;
      }

      .qb-label {
        font-size: 13px;
        margin-top: 19px;
      }

      .qb-input {
        height: 57px;
        border-radius: 15px;
        font-size: 16px;
      }

      .qb-input::placeholder {
        font-size: 14px;
      }

      .qb-primary {
        height: 57px;
        border-radius: 15px;
        font-size: 15px;
      }

      .qb-secondary {
        height: 52px;
        font-size: 14px;
      }

      .qb-center {
        font-size: 13px;
      }

      .qb-alert {
        font-size: 13px;
      }

      .qb-status-grid {
        grid-template-columns: 1fr;
      }

      .qb-development-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .qb-development-code {
        font-size: 24px;
      }

      .qb-input-otp {
        letter-spacing: 6px;
        font-size: 21px;
      }
    }
  `;

  // =========================================================
  // ALERTS
  // =========================================================

  const Alerts = () => (
    <>
      {error ? (
        <div className="qb-alert qb-error">
          ⚠️ {error}
        </div>
      ) : null}

      {message ? (
        <div className="qb-alert qb-success">
          ✓ {message}
        </div>
      ) : null}
    </>
  );

  // =========================================================
  // HEADER
  // =========================================================

  const Header = ({
    eyebrow,
    title,
    subtitle,
  }) => (
    <div>
      <div className="qb-eyebrow">
        {eyebrow}
      </div>

      <h1 className="qb-title">
        {title}
      </h1>

      <p className="qb-subtitle">
        {subtitle}
      </p>
    </div>
  );

  // =========================================================
  // LOGIN SCREEN
  // =========================================================

  const LoginScreen = () => (
    <>
      <Header
        eyebrow="WELCOME TO QUICKBITE"
        title="Good food is just a tap away."
        subtitle="Sign in to discover your favourite restaurants, reorder what you love, and track every delivery in real time."
      />

      <Alerts />

      <form onSubmit={handleLogin}>
        <label className="qb-label">
          Email address
        </label>

        <input
          ref={emailRef}
          className="qb-input"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          spellCheck="false"
        />

        <label className="qb-label">
          Password
        </label>

        <input
          ref={passwordRef}
          className="qb-input"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <div
          style={{
            marginTop: 11,
            textAlign: "right",
          }}
        >
          <button
            type="button"
            className="qb-link"
            onClick={() =>
              goTo("/forgot-password")
            }
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="qb-primary"
          disabled={loading}
        >
          {loading
            ? "Opening your account..."
            : "Continue to QuickBite  →"}
        </button>
      </form>

      <div className="qb-center">
        Don't have an account?{" "}
        <button
          type="button"
          className="qb-link"
          onClick={() =>
            goTo("/signup")
          }
        >
          Create account
        </button>
      </div>
    </>
  );

  // =========================================================
  // SIGNUP SCREEN
  // =========================================================

  const SignupScreen = () => (
    <>
      <Header
        eyebrow="JOIN QUICKBITE"
        title="Your next favourite meal starts here."
        subtitle="Create your account and enjoy personalised food discovery, easy ordering, and real-time delivery tracking."
      />

      <Alerts />

      <form onSubmit={handleSignup}>
        <label className="qb-label">
          Full name
        </label>

        <input
          ref={nameRef}
          className="qb-input"
          type="text"
          placeholder="Enter your full name"
          autoComplete="name"
          spellCheck="false"
        />

        <label className="qb-label">
          Email address
        </label>

        <input
          ref={emailRef}
          className="qb-input"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          spellCheck="false"
        />

        <label className="qb-label">
          Mobile number
        </label>

        <input
          ref={phoneRef}
          className="qb-input"
          type="tel"
          inputMode="numeric"
          placeholder="10-digit mobile number"
          maxLength={10}
          autoComplete="tel"
          onInput={(e) => {
            e.currentTarget.value =
              normalizePhone(
                e.currentTarget.value
              );
          }}
        />

        <label className="qb-label">
          Password
        </label>

        <input
          ref={passwordRef}
          className="qb-input"
          type="password"
          placeholder="Minimum 6 characters"
          autoComplete="new-password"
        />

        <button
          type="submit"
          className="qb-primary"
          disabled={loading}
        >
          {loading
            ? "Creating your account..."
            : "Create my account  →"}
        </button>
      </form>

      <div className="qb-center">
        Already have an account?{" "}
        <button
          type="button"
          className="qb-link"
          onClick={() =>
            goTo("/login")
          }
        >
          Sign in
        </button>
      </div>
    </>
  );

  // =========================================================
  // OTP SCREEN
  // =========================================================

  const OtpScreen = () => (
    <>
      <Header
        eyebrow="SECURITY CHECK"
        title="Let's secure your account."
        subtitle="Complete both verification steps to unlock your QuickBite customer account."
      />

      <Alerts />

      {/* =====================================================
          DEVELOPMENT MOBILE OTP
      ====================================================== */}

      {developmentMobileOtp ? (
        <div className="qb-development">
          <div className="qb-development-row">
            <div>
              <div className="qb-development-label">
                Development mobile OTP
              </div>

              <div className="qb-development-note">
                SMS provider is not connected yet
              </div>
            </div>

            <div className="qb-development-code">
              {developmentMobileOtp}
            </div>
          </div>
        </div>
      ) : null}

      {/* =====================================================
          DEVELOPMENT EMAIL OTP
      ====================================================== */}

      {developmentEmailOtp ? (
        <div className="qb-development">
          <div className="qb-development-row">
            <div>
              <div className="qb-development-label">
                Development email OTP
              </div>

              <div className="qb-development-note">
                This OTP is also being sent to your Gmail.
              </div>
            </div>

            <div className="qb-development-code">
              {developmentEmailOtp}
            </div>
          </div>
        </div>
      ) : null}

      {/* =====================================================
          VERIFICATION STATUS
      ====================================================== */}

      <div className="qb-status-grid">
        <div
          className={
            verificationData.mobileVerified
              ? "qb-status verified"
              : "qb-status"
          }
        >
          <div className="qb-status-label">
            Mobile verification
          </div>

          <div className="qb-status-value">
            {verificationData.mobileVerified
              ? "✓ Verified"
              : "Pending"}
          </div>
        </div>

        <div
          className={
            verificationData.emailVerified
              ? "qb-status verified"
              : "qb-status"
          }
        >
          <div className="qb-status-label">
            Email verification
          </div>

          <div className="qb-status-value">
            {verificationData.emailVerified
              ? "✓ Verified"
              : "Pending"}
          </div>
        </div>
      </div>

      {/* =====================================================
          MOBILE OTP
      ====================================================== */}

      {!verificationData.mobileVerified ? (
        <div className="qb-otp-box">
          <label className="qb-label">
            📱 Mobile OTP
          </label>

          <input
            ref={mobileOtpRef}
            className="qb-input qb-input-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            onInput={(e) => {
              e.currentTarget.value =
                e.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, 6);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();

                verifyMobileOtp();
              }
            }}
          />

          <button
            type="button"
            className="qb-primary"
            onClick={verifyMobileOtp}
            disabled={loading}
          >
            {loading
              ? "Verifying..."
              : "Verify mobile OTP"}
          </button>

          <button
            type="button"
            className="qb-secondary"
            onClick={resendMobileOtp}
            disabled={loading}
          >
            Resend mobile OTP
          </button>
        </div>
      ) : null}

      {/* =====================================================
          EMAIL OTP
      ====================================================== */}

      {!verificationData.emailVerified ? (
        <div className="qb-otp-box">
          <label className="qb-label">
            ✉️ Email OTP
          </label>

          <div
            style={{
              marginBottom: 10,
              color: "#71717a",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            Check your Gmail for the OTP.
            For development, the OTP is also
            shown above.
          </div>

          <input
            ref={emailOtpRef}
            className="qb-input qb-input-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            onInput={(e) => {
              e.currentTarget.value =
                e.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, 6);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();

                verifyEmailOtp();
              }
            }}
          />

          <button
            type="button"
            className="qb-primary"
            onClick={verifyEmailOtp}
            disabled={loading}
          >
            {loading
              ? "Verifying..."
              : "Verify email OTP"}
          </button>

          <button
            type="button"
            className="qb-secondary"
            onClick={resendEmailOtp}
            disabled={loading}
          >
            Resend email OTP
          </button>
        </div>
      ) : null}

      {/* =====================================================
          COMPLETE VERIFICATION
      ====================================================== */}

      {verificationData.mobileVerified &&
      verificationData.emailVerified ? (
        <div className="qb-complete">
          <div
            style={{
              fontSize: 36,
            }}
          >
            ✨
          </div>

          <div
            style={{
              marginTop: 7,
              color: "#166534",
              fontSize: 17,
              fontWeight: 950,
            }}
          >
            Your account is fully verified
          </div>

          <div
            style={{
              marginTop: 6,
              color: "#4d7c0f",
              fontSize: 13,
            }}
          >
            Everything is ready to go.
          </div>

          <button
            type="button"
            className="qb-primary"
            onClick={completeVerification}
            disabled={loading}
          >
            {loading
              ? "Finishing..."
              : "Continue to QuickBite  →"}
          </button>
        </div>
      ) : null}

      <div className="qb-center">
        <button
          type="button"
          className="qb-link"
          onClick={() =>
            goTo("/login")
          }
        >
          ← Back to login
        </button>
      </div>
    </>
  );

  // =========================================================
  // PHONE MISSING SCREEN
  // =========================================================

  const VerificationMissingPhone = () => (
    <>
      <Header
        eyebrow="VERIFICATION"
        title="One more step."
        subtitle="Your account needs verification before you can continue."
      />

      <Alerts />

      <div
        className="qb-otp-box"
        style={{
          marginTop: 20,
          background: "#fff7ed",
          borderColor: "#fed7aa",
        }}
      >
        <div
          style={{
            color: "#9a3412",
            fontSize: 16,
            fontWeight: 950,
          }}
        >
          Mobile number unavailable
        </div>

        <div
          style={{
            marginTop: 8,
            color: "#9a3412",
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          The server did not return the
          registered mobile number for
          this account.
        </div>
      </div>

      <button
        type="button"
        className="qb-primary"
        onClick={() =>
          goTo("/login")
        }
      >
        Back to login
      </button>
    </>
  );

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  const ForgotScreen = () => (
    <>
      <Header
        eyebrow="ACCOUNT RECOVERY"
        title="Let's get you back in."
        subtitle="Enter your email and we'll send you a secure reset OTP."
      />

      <Alerts />

      <form
        onSubmit={
          sendForgotPasswordOtp
        }
      >
        <label className="qb-label">
          Email address
        </label>

        <input
          ref={emailRef}
          className="qb-input"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          spellCheck="false"
        />

        <button
          type="submit"
          className="qb-primary"
          disabled={loading}
        >
          {loading
            ? "Sending..."
            : "Send reset OTP  →"}
        </button>
      </form>

      <div className="qb-center">
        <button
          type="button"
          className="qb-link"
          onClick={() =>
            goTo("/login")
          }
        >
          ← Back to login
        </button>
      </div>
    </>
  );

  // =========================================================
  // FORGOT OTP
  // =========================================================

  const ForgotOtpScreen = () => (
    <>
      <Header
        eyebrow="ACCOUNT RECOVERY"
        title="Enter your secure code."
        subtitle="Check your email and enter the 6-digit verification code."
      />

      <Alerts />

      <div
        className="qb-otp-box"
        style={{
          marginTop: 18,
        }}
      >
        <div
          style={{
            color: "#71717a",
            fontSize: 12,
          }}
        >
          Reset code sent for
        </div>

        <div
          style={{
            marginTop: 6,
            color: "#18181b",
            fontSize: 14,
            fontWeight: 950,
            wordBreak: "break-word",
          }}
        >
          {getValue(emailRef)}
        </div>
      </div>

      <label className="qb-label">
        Reset OTP
      </label>

      <input
        ref={resetOtpRef}
        className="qb-input qb-input-otp"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        onInput={(e) => {
          e.currentTarget.value =
            e.currentTarget.value
              .replace(/\D/g, "")
              .slice(0, 6);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();

            verifyResetOtp();
          }
        }}
      />

      <button
        type="button"
        className="qb-primary"
        onClick={verifyResetOtp}
        disabled={loading}
      >
        {loading
          ? "Verifying..."
          : "Verify OTP  →"}
      </button>

      <button
        type="button"
        className="qb-secondary"
        onClick={resendResetOtp}
        disabled={loading}
      >
        Resend OTP
      </button>

      <div className="qb-center">
        <button
          type="button"
          className="qb-link"
          onClick={() =>
            goTo("/login")
          }
        >
          ← Back to login
        </button>
      </div>
    </>
  );

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  const ResetPasswordScreen = () => (
    <>
      <Header
        eyebrow="SECURE RESET"
        title="Choose a new password."
        subtitle="Create a strong new password for your QuickBite account."
      />

      <Alerts />

      <label className="qb-label">
        New password
      </label>

      <input
        ref={newPasswordRef}
        className="qb-input"
        type="password"
        placeholder="Minimum 6 characters"
        autoComplete="new-password"
      />

      <button
        type="button"
        className="qb-primary"
        onClick={resetPassword}
        disabled={loading}
      >
        {loading
          ? "Updating..."
          : "Reset password  →"}
      </button>

      <div className="qb-center">
        <button
          type="button"
          className="qb-link"
          onClick={() =>
            goTo("/login")
          }
        >
          ← Back to login
        </button>
      </div>
    </>
  );

  // =========================================================
  // CONTENT ROUTER
  // =========================================================

  const renderContent = () => {
    if (step === "otp") {
      return <OtpScreen />;
    }

    if (step === "verification") {
      return (
        <VerificationMissingPhone />
      );
    }

    if (step === "forgotOtp") {
      return <ForgotOtpScreen />;
    }

    if (step === "reset") {
      return <ResetPasswordScreen />;
    }

    if (mode === "signup") {
      return <SignupScreen />;
    }

    if (mode === "forgot") {
      return <ForgotScreen />;
    }

    return <LoginScreen />;
  };

  // =========================================================
  // FINAL UI
  // =========================================================

  return (
    <>
      <style>{css}</style>

      <div className="qb-shell">

        {/* ===================================================
            LEFT PREMIUM HERO
        ==================================================== */}

        <section className="qb-hero">

          <div className="qb-hero-grid" />

          <div className="qb-orb" />

          <div className="qb-hero-inner">

            <div>

              {/* BRAND */}

              <div className="qb-brand">

                <div className="qb-brand-icon">
                  🍔
                </div>

                <div className="qb-brand-text">
                  QuickBite
                </div>

              </div>

              {/* HERO CONTENT */}

              <div
                style={{
                  marginTop: 78,
                }}
              >

                <div className="qb-small-pill">
                  <span className="qb-live-dot" />

                  Your premium food destination
                </div>

                <h2 className="qb-main-title">

                  Crave it.

                  <br />

                  <span>
                    We'll bring it.
                  </span>

                </h2>

                <p className="qb-main-copy">
                  Discover amazing restaurants,
                  order your favourite meals and
                  follow every step of your delivery
                  with QuickBite.
                </p>

                {/* FEATURES */}

                <div className="qb-feature-row">

                  <div className="qb-feature">

                    <div className="qb-feature-icon">
                      ⚡
                    </div>

                    <div className="qb-feature-title">
                      Fast delivery
                    </div>

                  </div>

                  <div className="qb-feature">

                    <div className="qb-feature-icon">
                      🔐
                    </div>

                    <div className="qb-feature-title">
                      Secure account
                    </div>

                  </div>

                  <div className="qb-feature">

                    <div className="qb-feature-icon">
                      📍
                    </div>

                    <div className="qb-feature-title">
                      Live tracking
                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* FLOATING FOOD CARD */}

            <div className="qb-food-card">

              <div className="qb-food-image">
                🍕
              </div>

              <div className="qb-food-label">

                <div className="qb-food-name">
                  Fresh & delicious
                </div>

                <div className="qb-food-meta">
                  Delivered to your door
                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="qb-hero-footer">

              <span>
                © {new Date().getFullYear()} QuickBite
              </span>

              <span>
                Delicious starts here.
              </span>

            </div>

          </div>

        </section>

        {/* ===================================================
            RIGHT AUTH PANEL
        ==================================================== */}

        <section className="qb-panel">

          <div className="qb-card">

            {/* MOBILE BRAND */}

            <div className="qb-mobile-brand">

              <div className="qb-mobile-logo">
                🍔
              </div>

              <div className="qb-mobile-name">
                QuickBite
              </div>

            </div>

            {renderContent()}

          </div>

        </section>

      </div>
    </>
  );
};

export default Auth;
