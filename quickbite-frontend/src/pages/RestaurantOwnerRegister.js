import React, { useState } from "react";
import API_BASE_URL from "../config";

const API = `${API_BASE_URL}/auth`;

function RestaurantOwnerRegister() {
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [mobileOtp, setMobileOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  const [developmentOtp, setDevelopmentOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  // =========================================================
  // SAFE JSON RESPONSE
  // =========================================================

  const readResponse = async (response) => {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        message: text,
      };
    }
  };

  // =========================================================
  // GET DEVELOPMENT OTP
  // =========================================================

  const getDevelopmentOtp = (data) => {
    const possibleOtp =
      data?.developmentOtp ??
      data?.otp ??
      data?.mobileOtp ??
      data?.data?.developmentOtp ??
      data?.data?.otp ??
      data?.data?.mobileOtp ??
      "";

    return possibleOtp ? String(possibleOtp) : "";
  };

  // =========================================================
  // SEND MOBILE OTP
  // =========================================================

  const sendMobileOtp = async () => {
    clearMessages();

    if (!phone.trim()) {
      setError("Please enter mobile number.");
      return false;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/send-mobile-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phone.trim(),
          }),
        }
      );

      const data = await readResponse(response);

      console.log("Mobile OTP API Response:", data);

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            `Unable to send mobile OTP (${response.status})`
        );
      }

      const otp = getDevelopmentOtp(data);

      if (!otp) {
        console.error(
          "Backend response did not contain developmentOtp:",
          data
        );

        setDevelopmentOtp("");
        setMobileOtp("");

        setError(
          "OTP generated but development OTP was not received by frontend."
        );

        setStep(2);

        return false;
      }

      // IMPORTANT:
      // Backend OTP is displayed and automatically entered.
      setDevelopmentOtp(otp);
      setMobileOtp(otp);

      setStep(2);

      setMessage(
        "Mobile OTP generated successfully. OTP is shown below."
      );

      return true;
    } catch (err) {
      console.error("Send Mobile OTP Error:", err);

      setError(
        err.message ||
          "Unable to send mobile OTP."
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // OWNER REGISTER
  // =========================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!name.trim()) {
      setError("Please enter owner name.");
      return;
    }

    if (!restaurantName.trim()) {
      setError("Please enter restaurant name.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter mobile number.");
      return;
    }

    const cleanPhone = phone
      .trim()
      .replace(/\s/g, "")
      .replace(/-/g, "");

    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Please enter a valid 10 digit mobile number.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/owner-register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            restaurantName: restaurantName.trim(),
            email: email.trim().toLowerCase(),
            phone: cleanPhone,
            password: password,
            address: "",
          }),
        }
      );

      const data = await readResponse(response);

      console.log("Owner Register Response:", data);

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            `Registration failed (${response.status})`
        );
      }

      setMessage(
        "Account created successfully. Generating mobile OTP..."
      );

      // Make sure the normalized phone is used for OTP.
      setPhone(cleanPhone);

      // Stop current loading before sendMobileOtp.
      setLoading(false);

      // Small delay allows React state to update.
      await new Promise((resolve) =>
        setTimeout(resolve, 200)
      );

      await sendMobileOtp();
    } catch (err) {
      console.error("Owner Registration Error:", err);

      setError(
        err.message ||
          "Registration failed."
      );

      setLoading(false);
    }
  };

  // =========================================================
  // VERIFY MOBILE OTP
  // =========================================================

  const verifyMobileOtp = async () => {
    clearMessages();

    if (!mobileOtp.trim()) {
      setError("Please enter mobile OTP.");
      return;
    }

    if (!/^\d{6}$/.test(mobileOtp.trim())) {
      setError("OTP must contain exactly 6 digits.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/verify-mobile-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phone.trim(),
            otp: mobileOtp.trim(),
          }),
        }
      );

      const data = await readResponse(response);

      console.log("Verify Mobile OTP Response:", data);

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            "Invalid mobile OTP."
        );
      }

      setDevelopmentOtp("");
      setMobileOtp("");

      setMessage(
        "Mobile number verified successfully. Sending email OTP..."
      );

      // Send email OTP
      await sendEmailOtp();
    } catch (err) {
      console.error(
        "Verify Mobile OTP Error:",
        err
      );

      setError(
        err.message ||
          "Mobile verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SEND EMAIL OTP
  // =========================================================

  const sendEmailOtp = async () => {
    try {
      const response = await fetch(
        `${API}/send-email-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const data = await readResponse(response);

      console.log("Email OTP Response:", data);

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            "Unable to send email OTP."
        );
      }

      setStep(3);

      setMessage(
        "Email OTP sent successfully. Please check your Gmail inbox."
      );

      return true;
    } catch (err) {
      console.error(
        "Send Email OTP Error:",
        err
      );

      setError(
        err.message ||
          "Unable to send email OTP."
      );

      return false;
    }
  };

  // =========================================================
  // VERIFY EMAIL OTP
  // =========================================================

  const verifyEmailOtp = async () => {
    clearMessages();

    if (!emailOtp.trim()) {
      setError("Please enter email OTP.");
      return;
    }

    if (!/^\d{6}$/.test(emailOtp.trim())) {
      setError("OTP must contain exactly 6 digits.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/verify-email-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: emailOtp.trim(),
          }),
        }
      );

      const data = await readResponse(response);

      console.log(
        "Verify Email OTP Response:",
        data
      );

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            "Invalid email OTP."
        );
      }

      // =====================================================
      // COMPLETE VERIFICATION
      // =====================================================

      const completeResponse = await fetch(
        `${API}/complete-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const completeData =
        await readResponse(completeResponse);

      console.log(
        "Complete Verification Response:",
        completeData
      );

      if (
        !completeResponse.ok ||
        completeData.success === false
      ) {
        throw new Error(
          completeData.message ||
            "Unable to complete verification."
        );
      }

      setStep(4);

      setMessage(
        "Registration completed successfully!"
      );

      setTimeout(() => {
        window.location.href =
          "/restaurant-owner-login";
      }, 2500);
    } catch (err) {
      console.error(
        "Verify Email OTP Error:",
        err
      );

      setError(
        err.message ||
          "Email verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESEND MOBILE OTP
  // =========================================================

  const resendMobileOtp = async () => {
    setMobileOtp("");
    setDevelopmentOtp("");

    await sendMobileOtp();
  };

  // =========================================================
  // RESEND EMAIL OTP
  // =========================================================

  const resendEmailOtp = async () => {
    clearMessages();
    setLoading(true);

    try {
      const response = await fetch(
        `${API}/send-email-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            "Unable to resend email OTP."
        );
      }

      setMessage(
        "New email OTP sent successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to resend email OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // STYLES
  // =========================================================

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top left, #3b1d5a, #17152d 40%, #080914 80%)",
      color: "#fff",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "30px 16px",
      fontFamily:
        "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    },

    card: {
      width: "100%",
      maxWidth: "620px",
      background: "rgba(15,16,32,0.96)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "28px",
      padding: "34px",
      boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      boxSizing: "border-box",
    },

    logo: {
      textAlign: "center",
      fontSize: "32px",
      fontWeight: "900",
      marginBottom: "5px",
    },

    title: {
      fontSize: "24px",
      fontWeight: "800",
      marginBottom: "8px",
    },

    subtitle: {
      textAlign: "center",
      color: "#9ca3af",
      fontSize: "14px",
      marginBottom: "28px",
    },

    text: {
      color: "#9ca3af",
      fontSize: "14px",
      lineHeight: "1.6",
      marginBottom: "22px",
    },

    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "14px",
    },

    field: {
      marginBottom: "16px",
    },

    label: {
      display: "block",
      color: "#d1d5db",
      fontSize: "13px",
      fontWeight: "700",
      marginBottom: "7px",
    },

    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "14px",
      borderRadius: "12px",
      border:
        "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      outline: "none",
      fontSize: "14px",
    },

    button: {
      width: "100%",
      border: "none",
      borderRadius: "13px",
      padding: "14px",
      marginTop: "8px",
      background:
        "linear-gradient(135deg,#ff7043,#ff3d68)",
      color: "#fff",
      fontSize: "15px",
      fontWeight: "800",
      cursor: "pointer",
    },

    secondary: {
      width: "100%",
      border:
        "1px solid rgba(255,255,255,0.12)",
      borderRadius: "13px",
      padding: "12px",
      marginTop: "12px",
      background: "rgba(255,255,255,0.05)",
      color: "#fff",
      fontWeight: "700",
      cursor: "pointer",
    },

    alert: {
      padding: "13px",
      borderRadius: "12px",
      marginBottom: "18px",
      fontSize: "13px",
      lineHeight: "1.5",
    },

    success: {
      background: "rgba(34,197,94,0.12)",
      border:
        "1px solid rgba(34,197,94,0.25)",
      color: "#86efac",
    },

    error: {
      background: "rgba(239,68,68,0.12)",
      border:
        "1px solid rgba(239,68,68,0.25)",
      color: "#fca5a5",
    },

    otpBox: {
      margin: "20px 0",
      padding: "22px",
      borderRadius: "16px",
      background:
        "linear-gradient(135deg, rgba(255,112,67,0.16), rgba(255,61,104,0.1))",
      border:
        "2px solid rgba(255,112,67,0.35)",
      textAlign: "center",
    },

    otpLabel: {
      fontSize: "12px",
      fontWeight: "800",
      color: "#ffab91",
      marginBottom: "10px",
      letterSpacing: "1px",
    },

    otp: {
      fontSize: "36px",
      fontWeight: "900",
      letterSpacing: "9px",
      color: "#fff",
    },

    footer: {
      textAlign: "center",
      marginTop: "22px",
      color: "#9ca3af",
      fontSize: "13px",
    },

    link: {
      color: "#ff8a65",
      fontWeight: "800",
      cursor: "pointer",
    },

    successIcon: {
      width: "75px",
      height: "75px",
      borderRadius: "50%",
      background: "rgba(34,197,94,0.15)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      margin: "0 auto 20px",
      fontSize: "38px",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* LOGO */}
        <div style={styles.logo}>
          Quick
          <span style={{ color: "#ff7043" }}>
            Bite
          </span>
        </div>

        <div style={styles.subtitle}>
          Restaurant Partner Registration
        </div>

        {/* MESSAGE */}
        {message && (
          <div
            style={{
              ...styles.alert,
              ...styles.success,
            }}
          >
            {message}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div
            style={{
              ...styles.alert,
              ...styles.error,
            }}
          >
            {error}
          </div>
        )}

        {/* ===================================================
            STEP 1
        =================================================== */}

        {step === 1 && (
          <>
            <div style={styles.title}>
              Create Restaurant Account
            </div>

            <div style={styles.text}>
              Register your restaurant and verify
              your mobile number and email address.
            </div>

            <form onSubmit={handleRegister}>

              <div style={styles.grid}>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Owner Name
                  </label>

                  <input
                    style={styles.input}
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Owner name"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Restaurant Name
                  </label>

                  <input
                    style={styles.input}
                    value={restaurantName}
                    onChange={(e) =>
                      setRestaurantName(
                        e.target.value
                      )
                    }
                    placeholder="Restaurant name"
                  />
                </div>

              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Mobile Number
                </label>

                <input
                  style={styles.input}
                  type="tel"
                  inputMode="numeric"
                  maxLength="10"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  placeholder="10 digit mobile number"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Email Address
                </label>

                <input
                  style={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="your@email.com"
                />
              </div>

              <div style={styles.grid}>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Password
                  </label>

                  <input
                    style={styles.input}
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Confirm Password
                  </label>

                  <input
                    style={styles.input}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm password"
                  />
                </div>

              </div>

              <button
                style={{
                  ...styles.button,
                  opacity: loading ? 0.7 : 1,
                }}
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account & Send OTP"}
              </button>

            </form>
          </>
        )}

        {/* ===================================================
            STEP 2 - MOBILE OTP
        =================================================== */}

        {step === 2 && (
          <>
            <div style={styles.title}>
              📱 Verify Mobile Number
            </div>

            <div style={styles.text}>
              Mobile OTP has been generated for:
              <br />

              <strong
                style={{ color: "#fff" }}
              >
                {phone}
              </strong>
            </div>

            {/* DEVELOPMENT OTP */}
            {developmentOtp && (
              <div style={styles.otpBox}>

                <div style={styles.otpLabel}>
                  DEVELOPMENT OTP
                </div>

                <div style={styles.otp}>
                  {developmentOtp}
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "12px",
                    color: "#d1d5db",
                    lineHeight: "1.5",
                  }}
                >
                  SMS provider is not connected yet.
                  <br />
                  This OTP is for local development.
                </div>

              </div>
            )}

            {!developmentOtp && (
              <div
                style={{
                  ...styles.alert,
                  ...styles.error,
                }}
              >
                Development OTP was not received.
                <br />
                Please click "Resend Mobile OTP".
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>
                Enter Mobile OTP
              </label>

              <input
                style={{
                  ...styles.input,
                  textAlign: "center",
                  fontSize: "22px",
                  letterSpacing: "8px",
                }}
                type="tel"
                inputMode="numeric"
                maxLength="6"
                value={mobileOtp}
                onChange={(e) =>
                  setMobileOtp(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="000000"
              />
            </div>

            <button
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
              }}
              onClick={verifyMobileOtp}
              disabled={loading}
            >
              {loading
                ? "Verifying..."
                : "Verify Mobile OTP"}
            </button>

            <button
              style={styles.secondary}
              onClick={resendMobileOtp}
              disabled={loading}
            >
              Resend Mobile OTP
            </button>
          </>
        )}

        {/* ===================================================
            STEP 3 - EMAIL OTP
        =================================================== */}

        {step === 3 && (
          <>
            <div style={styles.title}>
              📧 Verify Email
            </div>

            <div style={styles.text}>
              OTP sent to:
              <br />

              <strong
                style={{ color: "#fff" }}
              >
                {email}
              </strong>

              <br />
              <br />

              Gmail inbox check karo aur
              6-digit OTP enter karo.
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Email OTP
              </label>

              <input
                style={{
                  ...styles.input,
                  textAlign: "center",
                  fontSize: "22px",
                  letterSpacing: "8px",
                }}
                type="tel"
                inputMode="numeric"
                maxLength="6"
                value={emailOtp}
                onChange={(e) =>
                  setEmailOtp(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="000000"
              />
            </div>

            <button
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
              }}
              onClick={verifyEmailOtp}
              disabled={loading}
            >
              {loading
                ? "Verifying..."
                : "Verify Email & Complete"}
            </button>

            <button
              style={styles.secondary}
              onClick={resendEmailOtp}
              disabled={loading}
            >
              Resend Email OTP
            </button>
          </>
        )}

        {/* ===================================================
            STEP 4
        =================================================== */}

        {step === 4 && (
          <div style={{ textAlign: "center" }}>

            <div style={styles.successIcon}>
              ✓
            </div>

            <div style={styles.title}>
              Registration Complete!
            </div>

            <div style={styles.text}>
              Your restaurant owner account has
              been successfully verified.
              <br />
              Redirecting to Owner Login...
            </div>

            <button
              style={styles.button}
              onClick={() => {
                window.location.href =
                  "/restaurant-owner-login";
              }}
            >
              Go to Owner Login
            </button>

          </div>
        )}

        {/* FOOTER */}
        {step !== 4 && (
          <div style={styles.footer}>
            Already have an account?{" "}

            <span
              style={styles.link}
              onClick={() => {
                window.location.href =
                  "/restaurant-owner-login";
              }}
            >
              Login
            </span>
          </div>
        )}

      </div>
    </div>
  );
}

export default RestaurantOwnerRegister;