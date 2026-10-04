import React, { useState } from "react";
import API_BASE_URL_CONFIG from "../config";

const API_BASE_URL = `${API_BASE_URL_CONFIG}/auth`;

function AdminLogin() {
  // =========================
  // LOGIN STATE
  // =========================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // =========================
  // FORGOT PASSWORD STATE
  // =========================
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [mode, setMode] = useState("login");
  const [forgotStep, setForgotStep] = useState("email");

  // =========================
  // COMMON STATE
  // =========================
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // CLEAR MESSAGES
  // =========================
  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // =========================
  // ADMIN LOGIN
  // =========================
  const handleLogin = async (e) => {
    e.preventDefault();

    clearMessages();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/admin-login`,
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

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      // =========================
      // VERIFICATION REQUIRED
      // =========================
      if (
        response.status === 403 &&
        data.verificationRequired
      ) {
        localStorage.setItem(
          "quickbite-admin-verification",
          JSON.stringify({
            email: cleanEmail,
            phone: data.phone || "",
            role: "ADMIN",
            emailVerified: data.emailVerified || false,
            mobileVerified: data.mobileVerified || false,
          })
        );

        setSuccess(
          "Admin verification is required. Please verify your account."
        );

        setTimeout(() => {
          window.location.href = "/admin-verification";
        }, 800);

        return;
      }

      // =========================
      // LOGIN ERROR
      // =========================
      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Invalid admin email or password."
        );
        return;
      }

      // =========================
      // TOKEN CHECK
      // =========================
      if (!data.token) {
        setError(
          "Login successful, but authentication token was not received."
        );
        return;
      }

      // =========================
      // SAVE ADMIN SESSION
      // =========================
      localStorage.setItem(
        "quickbite-admin",
        JSON.stringify({
          ...(data.user || {}),
          email:
            data.user?.email ||
            cleanEmail,
          role: "ADMIN",
          loggedIn: true,
        })
      );

      localStorage.setItem(
        "quickbite-admin-token",
        data.token
      );

      localStorage.setItem(
        "quickbite-admin-role",
        "ADMIN"
      );

      setSuccess(
        "Admin login successful. Redirecting..."
      );

      setTimeout(() => {
        window.location.href = "/admin";
      }, 500);

    } catch (err) {
      console.error(
        "Admin login error:",
        err
      );

      setError(
        "Unable to connect to QuickBite server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FORGOT PASSWORD - SEND OTP
  // =========================
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    clearMessages();

    const cleanEmail =
      forgotEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/forgot-password`,
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

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || data.success === false) {
        setError(
          data.message ||
            "Unable to send password reset OTP."
        );
        return;
      }

      setSuccess(
        data.message ||
          "Password reset OTP has been sent to your email."
      );

      setForgotStep("otp");

    } catch (err) {
      console.error(
        "Forgot password error:",
        err
      );

      setError(
        "Unable to connect to QuickBite server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // VERIFY OTP
  // =========================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    clearMessages();

    const cleanEmail =
      forgotEmail.trim().toLowerCase();

    const cleanOtp = otp.trim();

    if (!cleanEmail) {
      setError("Email address is missing.");
      return;
    }

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            otp: cleanOtp,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || data.success === false) {
        setError(
          data.message ||
            "Invalid or expired OTP."
        );
        return;
      }

      setSuccess(
        data.message ||
          "OTP verified successfully."
      );

      setForgotStep("password");

    } catch (err) {
      console.error(
        "OTP verification error:",
        err
      );

      setError(
        "Unable to connect to QuickBite server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // RESEND OTP
  // =========================
  const handleResendOtp = async () => {
    clearMessages();

    const cleanEmail =
      forgotEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Email address is missing.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/resend-otp`,
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

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || data.success === false) {
        setError(
          data.message ||
            "Unable to resend OTP."
        );
        return;
      }

      setSuccess(
        data.message ||
          "A new OTP has been sent to your email."
      );

    } catch (err) {
      console.error(
        "Resend OTP error:",
        err
      );

      setError(
        "Unable to connect to QuickBite server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // RESET PASSWORD
  // =========================
  const handleResetPassword = async (e) => {
    e.preventDefault();

    clearMessages();

    const cleanEmail =
      forgotEmail.trim().toLowerCase();

    if (!newPassword.trim()) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            otp: otp.trim(),
            newPassword: newPassword,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || data.success === false) {
        setError(
          data.message ||
            "Unable to reset password."
        );
        return;
      }

      setSuccess(
        data.message ||
          "Password reset successfully. Please login with your new password."
      );

      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");

      setTimeout(() => {
        setMode("login");
        setForgotStep("email");
        setEmail(cleanEmail);
        setForgotEmail("");
        clearMessages();
      }, 1500);

    } catch (err) {
      console.error(
        "Reset password error:",
        err
      );

      setError(
        "Unable to connect to QuickBite server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // OPEN FORGOT PASSWORD
  // =========================
  const openForgotPassword = () => {
    clearMessages();

    setForgotEmail(email);

    setOtp("");
    setNewPassword("");
    setConfirmPassword("");

    setForgotStep("email");
    setMode("forgot");
  };

  // =========================
  // BACK TO LOGIN
  // =========================
  const backToLogin = () => {
    clearMessages();

    setMode("login");
    setForgotStep("email");

    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* =========================
            LOGO
        ========================= */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/30 mb-4">
            <span className="text-3xl">
              🍔
            </span>
          </div>

          <h1 className="text-3xl font-bold">
            Quick
            <span className="text-orange-500">
              Bite
            </span>
          </h1>

          <p className="text-gray-400 mt-2">
            Admin Panel
          </p>

        </div>

        {/* =========================
            LOGIN CARD
        ========================= */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-7 shadow-2xl">

          {/* =========================
              LOGIN MODE
          ========================= */}
          {mode === "login" && (
            <>
              <h2 className="text-2xl font-bold mb-2">
                Admin Login
              </h2>

              <p className="text-gray-400 text-sm mb-6">
                Sign in to manage your QuickBite platform.
              </p>

              {/* ERROR */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {/* SUCCESS */}
              {success && (
                <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 px-4 py-3 text-sm">
                  {success}
                </div>
              )}

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >

                {/* EMAIL */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Admin Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter admin email"
                    autoComplete="email"
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter admin password"
                    autoComplete="current-password"
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                {/* FORGOT PASSWORD */}
                <div className="text-right -mt-2">
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-sm text-orange-400 hover:text-orange-300 transition"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* LOGIN */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full font-semibold py-3 rounded-xl transition shadow-lg ${
                    loading
                      ? "bg-orange-700 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                  }`}
                >
                  {loading
                    ? "Signing in..."
                    : "Login to Admin Panel"}
                </button>

              </form>

              {/* SECURE ADMIN INFO */}
              <div className="mt-6 p-4 rounded-xl bg-gray-950 border border-gray-800">

                <p className="text-xs text-gray-500">
                  🔐 Secure Admin Login
                </p>

                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Admin accounts are managed securely by the
                  QuickBite platform. Public admin registration
                  is disabled.
                </p>

              </div>
            </>
          )}

          {/* =========================
              FORGOT PASSWORD
          ========================= */}
          {mode === "forgot" && (
            <>
              {/* =========================
                  STEP 1 - EMAIL
              ========================= */}
              {forgotStep === "email" && (
                <>
                  <h2 className="text-2xl font-bold mb-2">
                    Forgot Password
                  </h2>

                  <p className="text-gray-400 text-sm mb-6">
                    Enter your admin email and we'll send you
                    a password reset OTP.
                  </p>

                  {error && (
                    <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-3 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 px-4 py-3 text-sm">
                      {success}
                    </div>
                  )}

                  <form
                    onSubmit={handleForgotPassword}
                    className="space-y-5"
                  >

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Admin Email
                      </label>

                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(
                            e.target.value
                          );
                          setError("");
                        }}
                        placeholder="Enter admin email"
                        autoComplete="email"
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full font-semibold py-3 rounded-xl transition ${
                        loading
                          ? "bg-orange-700 cursor-not-allowed"
                          : "bg-orange-500 hover:bg-orange-600"
                      }`}
                    >
                      {loading
                        ? "Sending OTP..."
                        : "Send Reset OTP"}
                    </button>

                  </form>

                  <button
                    type="button"
                    onClick={backToLogin}
                    className="w-full mt-4 text-sm text-gray-400 hover:text-orange-400 transition"
                  >
                    ← Back to Admin Login
                  </button>
                </>
              )}

              {/* =========================
                  STEP 2 - OTP
              ========================= */}
              {forgotStep === "otp" && (
                <>
                  <h2 className="text-2xl font-bold mb-2">
                    Verify OTP
                  </h2>

                  <p className="text-gray-400 text-sm mb-6">
                    Enter the 6-digit OTP sent to:
                  </p>

                  <p className="text-orange-400 text-sm mb-6 break-all">
                    {forgotEmail}
                  </p>

                  {error && (
                    <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-3 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 px-4 py-3 text-sm">
                      {success}
                    </div>
                  )}

                  <form
                    onSubmit={handleVerifyOtp}
                    className="space-y-5"
                  >

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        6-Digit OTP
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="6"
                        value={otp}
                        onChange={(e) => {
                          const value =
                            e.target.value.replace(
                              /\D/g,
                              ""
                            );

                          setOtp(value);
                          setError("");
                        }}
                        placeholder="Enter OTP"
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white text-center tracking-[0.5em] text-lg outline-none focus:border-orange-500 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full font-semibold py-3 rounded-xl transition ${
                        loading
                          ? "bg-orange-700 cursor-not-allowed"
                          : "bg-orange-500 hover:bg-orange-600"
                      }`}
                    >
                      {loading
                        ? "Verifying..."
                        : "Verify OTP"}
                    </button>

                  </form>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="w-full mt-4 text-sm text-orange-400 hover:text-orange-300 transition disabled:opacity-50"
                  >
                    Resend OTP
                  </button>

                  <button
                    type="button"
                    onClick={backToLogin}
                    className="w-full mt-3 text-sm text-gray-400 hover:text-orange-400 transition"
                  >
                    ← Back to Admin Login
                  </button>
                </>
              )}

              {/* =========================
                  STEP 3 - NEW PASSWORD
              ========================= */}
              {forgotStep === "password" && (
                <>
                  <h2 className="text-2xl font-bold mb-2">
                    Create New Password
                  </h2>

                  <p className="text-gray-400 text-sm mb-6">
                    OTP verified. Create a new password for
                    your QuickBite admin account.
                  </p>

                  {error && (
                    <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-3 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 px-4 py-3 text-sm">
                      {success}
                    </div>
                  )}

                  <form
                    onSubmit={handleResetPassword}
                    className="space-y-5"
                  >

                    {/* NEW PASSWORD */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        New Password
                      </label>

                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(
                            e.target.value
                          );
                          setError("");
                        }}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition"
                      />
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Confirm New Password
                      </label>

                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(
                            e.target.value
                          );
                          setError("");
                        }}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition"
                      />
                    </div>

                    <p className="text-xs text-gray-500">
                      Password must contain at least 6 characters.
                    </p>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full font-semibold py-3 rounded-xl transition ${
                        loading
                          ? "bg-orange-700 cursor-not-allowed"
                          : "bg-orange-500 hover:bg-orange-600"
                      }`}
                    >
                      {loading
                        ? "Resetting Password..."
                        : "Reset Password"}
                    </button>

                  </form>

                  <button
                    type="button"
                    onClick={backToLogin}
                    className="w-full mt-4 text-sm text-gray-400 hover:text-orange-400 transition"
                  >
                    ← Back to Admin Login
                  </button>
                </>
              )}
            </>
          )}

        </div>

        {/* =========================
            BACK TO QUICKBITE
        ========================= */}
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className="block mx-auto mt-6 text-sm text-gray-400 hover:text-orange-400 transition"
        >
          ← Back to QuickBite
        </button>

      </div>
    </div>
  );
}

export default AdminLogin;