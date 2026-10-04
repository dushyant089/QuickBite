import React, { useEffect, useMemo, useState } from "react";

const Profile = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "CUSTOMER",
  });

  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // LOAD USER
  // =========================================================

  useEffect(() => {
    try {
      const savedUser =
        localStorage.getItem("quickbite-user");

      const savedOrders =
        localStorage.getItem("quickbite-orders");

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);

        const normalizedUser = {
          name: parsedUser?.name || "",
          email: parsedUser?.email || "",
          phone:
            parsedUser?.phone ||
            parsedUser?.mobile ||
            "",
          address:
            parsedUser?.address || "",
          role:
            parsedUser?.role ||
            "CUSTOMER",
        };

        setUser(normalizedUser);

        setForm({
          name: normalizedUser.name,
          phone: normalizedUser.phone,
          address: normalizedUser.address,
        });
      }

      if (savedOrders) {
        const parsedOrders =
          JSON.parse(savedOrders);

        if (Array.isArray(parsedOrders)) {
          setOrders(parsedOrders);
        }
      }
    } catch (err) {
      console.error(
        "Profile load error:",
        err
      );

      setError(
        "Unable to load profile information."
      );
    }
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const clearAlerts = () => {
    setMessage("");
    setError("");
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const goTo = (path) => {
    window.location.href = path;
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const saveProfile = () => {
    clearAlerts();

    const updatedUser = {
      ...user,
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };

    if (!updatedUser.name) {
      setError("Name cannot be empty.");
      return;
    }

    try {
      localStorage.setItem(
        "quickbite-user",
        JSON.stringify({
          ...updatedUser,
          loggedIn: true,
        })
      );

      setUser(updatedUser);

      setEditing(false);

      setMessage(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Profile save error:",
        err
      );

      setError(
        "Unable to save profile."
      );
    }
  };

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const cancelEdit = () => {
    setForm({
      name: user.name,
      phone: user.phone,
      address: user.address,
    });

    clearAlerts();

    setEditing(false);
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem(
      "quickbite-user"
    );

    localStorage.removeItem(
      "quickbite-user-token"
    );

    localStorage.removeItem(
      "quickbite-token"
    );

    localStorage.removeItem(
      "quickbite-user-role"
    );

    localStorage.removeItem(
      "quickbite-user-logged-in"
    );

    localStorage.removeItem("token");

    window.location.href = "/login";
  };

  // =========================================================
  // PROFILE INITIALS
  // =========================================================

  const initials = useMemo(() => {
    const name =
      user.name?.trim() ||
      "QuickBite User";

    const parts = name
      .split(" ")
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }, [user.name]);

  // =========================================================
  // ORDER STATS
  // =========================================================

  const totalOrders =
    orders.length;

  const deliveredOrders =
    orders.filter(
      (order) =>
        String(
          order?.status || ""
        ).toUpperCase() ===
        "DELIVERED"
    ).length;

  const activeOrders =
    orders.filter((order) => {
      const status = String(
        order?.status || ""
      ).toUpperCase();

      return (
        status &&
        status !== "DELIVERED" &&
        status !== "CANCELLED"
      );
    }).length;

  // =========================================================
  // PREMIUM DARK CSS
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
      background: #08090b;

      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      color: #f8fafc;
    }

    button,
    input,
    textarea {
      font: inherit;
    }

    /* =======================================================
       PAGE
       ======================================================= */

    .profile-page {
      min-height: 100vh;

      position: relative;

      overflow: hidden;

      background:
        radial-gradient(
          circle at 85% 3%,
          rgba(249,115,22,0.15),
          transparent 23%
        ),

        radial-gradient(
          circle at 6% 88%,
          rgba(239,68,68,0.08),
          transparent 25%
        ),

        linear-gradient(
          145deg,
          #07080a 0%,
          #0b0d10 48%,
          #111214 100%
        );
    }

    /* =======================================================
       BACKGROUND GRID
       ======================================================= */

    .profile-grid {
      position: absolute;
      inset: 0;

      opacity: 0.08;

      background-image:
        linear-gradient(
          rgba(255,255,255,0.06) 1px,
          transparent 1px
        ),

        linear-gradient(
          90deg,
          rgba(255,255,255,0.06) 1px,
          transparent 1px
        );

      background-size: 58px 58px;

      mask-image:
        linear-gradient(
          to bottom,
          black,
          transparent 90%
        );

      pointer-events: none;
    }

    .profile-glow-one {
      position: absolute;

      width: 440px;
      height: 440px;

      top: -210px;
      right: -150px;

      border-radius: 50%;

      background:
        radial-gradient(
          circle,
          rgba(249,115,22,0.18),
          transparent 67%
        );

      pointer-events: none;
    }

    .profile-glow-two {
      position: absolute;

      width: 350px;
      height: 350px;

      bottom: -170px;
      left: -150px;

      border-radius: 50%;

      background:
        radial-gradient(
          circle,
          rgba(244,63,94,0.10),
          transparent 67%
        );

      pointer-events: none;
    }

    /* =======================================================
       SHELL
       ======================================================= */

    .profile-shell {
      position: relative;

      z-index: 2;

      width:
        min(1240px, 100%);

      margin: 0 auto;

      padding:
        32px 24px 55px;
    }

    /* =======================================================
       TOP BAR
       ======================================================= */

    .profile-topbar {
      display: flex;

      align-items: center;

      justify-content: space-between;

      gap: 20px;

      margin-bottom: 25px;
    }

    .profile-brand {
      display: flex;

      align-items: center;

      gap: 12px;
    }

    .profile-brand-icon {
      width: 49px;
      height: 49px;

      border-radius: 16px;

      display: flex;

      align-items: center;
      justify-content: center;

      background:
        linear-gradient(
          135deg,
          #fb923c,
          #ef4444
        );

      color: #fff;

      font-size: 22px;

      box-shadow:
        0 16px 34px rgba(249,115,22,0.22);
    }

    .profile-brand-text {
      font-size: 25px;

      font-weight: 950;

      letter-spacing:
        -0.9px;

      color: #fff;
    }

    .profile-back-btn {
      height: 44px;

      padding:
        0 15px;

      border:
        1px solid #27272a;

      border-radius: 13px;

      background:
        rgba(255,255,255,0.045);

      color: #d4d4d8;

      cursor: pointer;

      font-size: 12px;

      font-weight: 900;

      transition:
        border-color 0.2s ease,
        background 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease;
    }

    .profile-back-btn:hover {
      border-color: #fb923c;

      color: #fff7ed;

      background:
        rgba(249,115,22,0.09);

      transform:
        translateY(-1px);
    }

    /* =======================================================
       LAYOUT
       ======================================================= */

    .profile-layout {
      display: grid;

      grid-template-columns:
        0.82fr 1.48fr;

      gap: 21px;

      align-items: start;
    }

    /* =======================================================
       COMMON CARDS
       ======================================================= */

    .profile-card {
      border:
        1px solid rgba(255,255,255,0.07);

      border-radius: 29px;

      background:
        linear-gradient(
          145deg,
          rgba(255,255,255,0.065),
          rgba(255,255,255,0.028)
        );

      box-shadow:
        0 30px 90px rgba(0,0,0,0.35),

        inset 0 1px 0
          rgba(255,255,255,0.055);

      backdrop-filter:
        blur(24px);
    }

    /* =======================================================
       LEFT SUMMARY
       ======================================================= */

    .profile-summary {
      padding: 31px;
    }

    .profile-avatar-wrap {
      display: flex;

      justify-content: center;

      margin-bottom: 20px;
    }

    .profile-avatar {
      width: 120px;
      height: 120px;

      border-radius: 34px;

      display: flex;

      align-items: center;
      justify-content: center;

      color: #fff;

      font-size: 38px;

      font-weight: 950;

      background:
        linear-gradient(
          145deg,
          #fb923c,
          #f97316 48%,
          #ef4444
        );

      border:
        1px solid rgba(255,255,255,0.15);

      box-shadow:
        0 28px 50px rgba(239,68,68,0.23),

        inset 0 1px 0
          rgba(255,255,255,0.28);
    }

    .profile-name {
      color: #fff;

      text-align: center;

      font-size: 28px;

      line-height: 1.15;

      font-weight: 950;

      letter-spacing:
        -1px;
    }

    .profile-role {
      display: block;

      width: fit-content;

      margin:
        10px auto 0;

      padding:
        7px 11px;

      border-radius: 999px;

      border:
        1px solid
          rgba(251,146,60,0.25);

      background:
        rgba(249,115,22,0.09);

      color: #fdba74;

      font-size: 10px;

      font-weight: 950;

      letter-spacing:
        0.8px;

      text-transform:
        uppercase;
    }

    /* =======================================================
       CONTACT
       ======================================================= */

    .profile-contact-list {
      margin-top: 25px;

      display: grid;

      gap: 10px;
    }

    .profile-contact {
      display: flex;

      align-items: flex-start;

      gap: 11px;

      padding: 14px;

      border-radius: 17px;

      border:
        1px solid #27272a;

      background:
        rgba(0,0,0,0.18);
    }

    .profile-contact-icon {
      flex-shrink: 0;

      width: 38px;
      height: 38px;

      border-radius: 11px;

      display: flex;

      align-items: center;
      justify-content: center;

      background:
        rgba(249,115,22,0.10);

      border:
        1px solid
          rgba(249,115,22,0.16);

      color: #fb923c;
    }

    .profile-contact-label {
      font-size: 10px;

      font-weight: 950;

      color: #71717a;

      text-transform:
        uppercase;

      letter-spacing:
        0.7px;
    }

    .profile-contact-value {
      margin-top: 4px;

      font-size: 13px;

      font-weight: 800;

      color: #e4e4e7;

      word-break:
        break-word;
    }

    .profile-logout {
      width: 100%;

      height: 51px;

      margin-top: 20px;

      border-radius: 15px;

      border:
        1px solid
          rgba(244,63,94,0.22);

      background:
        rgba(244,63,94,0.07);

      color: #fda4af;

      cursor: pointer;

      font-size: 13px;

      font-weight: 900;

      transition: 0.2s ease;
    }

    .profile-logout:hover {
      background:
        rgba(244,63,94,0.13);

      border-color:
        rgba(244,63,94,0.40);
    }

    /* =======================================================
       RIGHT MAIN
       ======================================================= */

    .profile-main {
      padding: 31px;
    }

    .profile-heading {
      display: flex;

      align-items: flex-start;

      justify-content: space-between;

      gap: 18px;
    }

    .profile-eyebrow {
      color: #fb923c;

      font-size: 11px;

      font-weight: 950;

      letter-spacing:
        1.4px;

      text-transform:
        uppercase;

      margin-bottom: 8px;
    }

    .profile-title {
      margin: 0;

      color: #fff;

      font-size: 37px;

      line-height: 1.05;

      letter-spacing:
        -1.7px;

      font-weight: 950;
    }

    .profile-subtitle {
      max-width: 620px;

      margin:
        11px 0 0;

      color: #a1a1aa;

      font-size: 14px;

      line-height: 1.75;
    }

    .profile-edit-btn {
      min-width: 115px;

      height: 46px;

      border:
        1px solid
          rgba(251,146,60,0.25);

      border-radius: 14px;

      background:
        rgba(249,115,22,0.09);

      color: #fdba74;

      cursor: pointer;

      font-size: 12px;

      font-weight: 950;

      transition: 0.2s ease;
    }

    .profile-edit-btn:hover {
      background:
        rgba(249,115,22,0.15);

      border-color:
        rgba(251,146,60,0.45);

      color: #fff7ed;
    }

    /* =======================================================
       ALERT
       ======================================================= */

    .profile-alert {
      margin-top: 17px;

      padding:
        14px 15px;

      border-radius: 15px;

      font-size: 13px;

      line-height: 1.55;

      font-weight: 800;
    }

    .profile-success {
      color: #86efac;

      background:
        rgba(34,197,94,0.08);

      border:
        1px solid rgba(34,197,94,0.19);
    }

    .profile-error {
      color: #fda4af;

      background:
        rgba(244,63,94,0.08);

      border:
        1px solid rgba(244,63,94,0.20);
    }

    /* =======================================================
       STATS
       ======================================================= */

    .profile-stat-grid {
      margin-top: 24px;

      display: grid;

      grid-template-columns:
        repeat(3, minmax(0,1fr));

      gap: 11px;
    }

    .profile-stat {
      position: relative;

      overflow: hidden;

      padding: 17px;

      border-radius: 18px;

      border:
        1px solid #27272a;

      background:
        linear-gradient(
          145deg,
          rgba(255,255,255,0.055),
          rgba(255,255,255,0.025)
        );
    }

    .profile-stat::after {
      content: "";

      position: absolute;

      width: 90px;
      height: 90px;

      right: -45px;
      top: -45px;

      border-radius: 50%;

      background:
        radial-gradient(
          circle,
          rgba(249,115,22,0.13),
          transparent 68%
        );
    }

    .profile-stat-icon {
      position: relative;
      z-index: 2;

      font-size: 21px;
    }

    .profile-stat-number {
      position: relative;
      z-index: 2;

      margin-top: 8px;

      color: #fff;

      font-size: 26px;

      font-weight: 950;
    }

    .profile-stat-label {
      position: relative;
      z-index: 2;

      margin-top: 3px;

      color: #71717a;

      font-size: 11px;

      font-weight: 800;
    }

    /* =======================================================
       SECTION
       ======================================================= */

    .profile-section {
      margin-top: 22px;

      padding: 22px;

      border-radius: 22px;

      border:
        1px solid #27272a;

      background:
        rgba(0,0,0,0.16);
    }

    .profile-section-title {
      color: #f4f4f5;

      font-size: 16px;

      font-weight: 950;
    }

    .profile-section-copy {
      margin-top: 4px;

      color: #71717a;

      font-size: 12px;
    }

    /* =======================================================
       INFO GRID
       ======================================================= */

    .profile-info-grid {
      margin-top: 18px;

      display: grid;

      grid-template-columns:
        repeat(2, minmax(0,1fr));

      gap: 12px;
    }

    .profile-info-box {
      padding: 16px;

      border-radius: 16px;

      border:
        1px solid #27272a;

      background:
        rgba(255,255,255,0.025);
    }

    .profile-info-label {
      color: #71717a;

      font-size: 10px;

      font-weight: 950;

      text-transform:
        uppercase;

      letter-spacing:
        0.7px;
    }

    .profile-info-value {
      margin-top: 6px;

      color: #e4e4e7;

      font-size: 14px;

      font-weight: 850;

      line-height: 1.55;

      word-break:
        break-word;
    }

    /* =======================================================
       EDIT FORM
       ======================================================= */

    .profile-form {
      margin-top: 20px;

      display: grid;

      gap: 15px;
    }

    .profile-field {
      display: grid;

      gap: 7px;
    }

    .profile-field label {
      color: #d4d4d8;

      font-size: 12px;

      font-weight: 950;
    }

    .profile-input,
    .profile-textarea {
      width: 100%;

      border:
        1px solid #27272a;

      border-radius: 15px;

      background:
        rgba(0,0,0,0.20);

      color: #f4f4f5;

      outline: none;

      font-size: 14px;

      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background 0.2s ease;
    }

    .profile-input {
      height: 53px;

      padding:
        0 14px;
    }

    .profile-textarea {
      min-height: 110px;

      resize: vertical;

      padding:
        13px 14px;

      line-height:
        1.55;
    }

    .profile-input::placeholder,
    .profile-textarea::placeholder {
      color: #52525b;
    }

    .profile-input:focus,
    .profile-textarea:focus {
      border-color:
        #fb923c;

      background:
        rgba(249,115,22,0.035);

      box-shadow:
        0 0 0 4px
          rgba(251,146,60,0.08);
    }

    .profile-form-actions {
      display: flex;

      gap: 10px;

      margin-top: 4px;
    }

    .profile-save {
      flex: 1;

      height: 52px;

      border: none;

      border-radius: 15px;

      background:
        linear-gradient(
          135deg,
          #fb923c,
          #f97316 52%,
          #ef4444
        );

      color: #fff;

      cursor: pointer;

      font-size: 14px;

      font-weight: 950;

      box-shadow:
        0 15px 30px rgba(239,68,68,0.18);
    }

    .profile-cancel {
      min-width: 120px;

      height: 52px;

      border:
        1px solid #27272a;

      border-radius: 15px;

      background:
        rgba(255,255,255,0.04);

      color: #d4d4d8;

      cursor: pointer;

      font-size: 13px;

      font-weight: 900;
    }

    .profile-cancel:hover {
      background:
        rgba(255,255,255,0.07);
    }

    /* =======================================================
       QUICK ACTIONS
       ======================================================= */

    .profile-actions-grid {
      margin-top: 22px;

      display: grid;

      grid-template-columns:
        repeat(2, minmax(0,1fr));

      gap: 12px;
    }

    .profile-action {
      min-height: 99px;

      padding: 17px;

      border:
        1px solid #27272a;

      border-radius: 18px;

      background:
        rgba(255,255,255,0.025);

      cursor: pointer;

      text-align: left;

      transition:
        transform 0.2s ease,
        border-color 0.2s ease,
        background 0.2s ease,
        box-shadow 0.2s ease;
    }

    .profile-action:hover {
      transform:
        translateY(-2px);

      border-color:
        rgba(251,146,60,0.32);

      background:
        rgba(249,115,22,0.045);

      box-shadow:
        0 14px 30px
          rgba(0,0,0,0.24);
    }

    .profile-action-icon {
      font-size: 23px;
    }

    .profile-action-title {
      margin-top: 8px;

      color: #f4f4f5;

      font-size: 14px;

      font-weight: 950;
    }

    .profile-action-copy {
      margin-top: 4px;

      color: #71717a;

      font-size: 11px;

      line-height: 1.5;
    }

    /* =======================================================
       RESPONSIVE
       ======================================================= */

    @media (max-width: 1000px) {
      .profile-layout {
        grid-template-columns: 1fr;
      }

      .profile-summary {
        display: grid;

        grid-template-columns:
          auto 1fr;

        gap: 20px;

        align-items: center;
      }

      .profile-avatar-wrap {
        margin: 0;
      }

      .profile-contact-list {
        grid-column:
          1 / -1;
      }

      .profile-logout {
        grid-column:
          1 / -1;
      }

      .profile-name {
        text-align: left;
      }

      .profile-role {
        margin-left: 0;
        margin-right: auto;
      }
    }

    @media (max-width: 700px) {
      .profile-shell {
        padding:
          23px 12px 40px;
      }

      .profile-topbar {
        margin-bottom: 18px;
      }

      .profile-brand-text {
        font-size: 22px;
      }

      .profile-brand-icon {
        width: 44px;
        height: 44px;
        border-radius: 14px;
      }

      .profile-back-btn {
        height: 41px;
        padding: 0 11px;
        font-size: 11px;
      }

      .profile-card {
        border-radius: 24px;
      }

      .profile-summary,
      .profile-main {
        padding: 22px 17px;
      }

      .profile-summary {
        display: block;
      }

      .profile-avatar-wrap {
        margin-bottom: 17px;
      }

      .profile-name {
        text-align: center;
        font-size: 25px;
      }

      .profile-role {
        margin:
          9px auto 0;
      }

      .profile-title {
        font-size: 30px;
      }

      .profile-subtitle {
        font-size: 13px;
      }

      .profile-heading {
        display: block;
      }

      .profile-edit-btn {
        width: 100%;
        margin-top: 16px;
      }

      .profile-stat-grid {
        grid-template-columns: 1fr;
      }

      .profile-info-grid {
        grid-template-columns: 1fr;
      }

      .profile-actions-grid {
        grid-template-columns: 1fr;
      }

      .profile-form-actions {
        flex-direction: column;
      }

      .profile-cancel {
        width: 100%;
      }
    }

    @media (max-width: 420px) {
      .profile-shell {
        padding-left: 8px;
        padding-right: 8px;
      }

      .profile-title {
        font-size: 27px;
      }

      .profile-summary,
      .profile-main {
        padding:
          20px 15px;
      }

      .profile-avatar {
        width: 102px;
        height: 102px;
        border-radius: 29px;
        font-size: 32px;
      }

      .profile-contact-value {
        font-size: 12px;
      }

      .profile-stat-number {
        font-size: 23px;
      }
    }
  `;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <style>{css}</style>

      <div className="profile-page">

        <div className="profile-grid" />
        <div className="profile-glow-one" />
        <div className="profile-glow-two" />

        <div className="profile-shell">

          {/* =================================================
              TOP BAR
          ================================================== */}

          <div className="profile-topbar">

            <div className="profile-brand">

              <div className="profile-brand-icon">
                🍔
              </div>

              <div className="profile-brand-text">
                QuickBite
              </div>

            </div>

            <button
              type="button"
              className="profile-back-btn"
              onClick={() =>
                goTo("/")
              }
            >
              ← Back to Home
            </button>

          </div>

          {/* =================================================
              MAIN LAYOUT
          ================================================== */}

          <div className="profile-layout">

            {/* =================================================
                PROFILE SUMMARY
            ================================================== */}

            <div className="profile-card profile-summary">

              <div className="profile-avatar-wrap">

                <div className="profile-avatar">
                  {initials}
                </div>

              </div>

              <div>

                <div className="profile-name">
                  {user.name ||
                    "QuickBite User"}
                </div>

                <div className="profile-role">
                  {String(
                    user.role ||
                      "CUSTOMER"
                  ).replace(
                    "_",
                    " "
                  )}
                </div>

              </div>

              <div className="profile-contact-list">

                {/* EMAIL */}

                <div className="profile-contact">

                  <div className="profile-contact-icon">
                    ✉
                  </div>

                  <div>

                    <div className="profile-contact-label">
                      Email
                    </div>

                    <div className="profile-contact-value">
                      {user.email ||
                        "Not available"}
                    </div>

                  </div>

                </div>

                {/* MOBILE */}

                <div className="profile-contact">

                  <div className="profile-contact-icon">
                    📱
                  </div>

                  <div>

                    <div className="profile-contact-label">
                      Mobile
                    </div>

                    <div className="profile-contact-value">
                      {user.phone ||
                        "Not available"}
                    </div>

                  </div>

                </div>

                {/* ADDRESS */}

                <div className="profile-contact">

                  <div className="profile-contact-icon">
                    🏠
                  </div>

                  <div>

                    <div className="profile-contact-label">
                      Address
                    </div>

                    <div className="profile-contact-value">
                      {user.address ||
                        "No address saved"}
                    </div>

                  </div>

                </div>

              </div>

              <button
                type="button"
                className="profile-logout"
                onClick={logout}
              >
                Sign out of QuickBite
              </button>

            </div>

            {/* =================================================
                MAIN PROFILE
            ================================================== */}

            <div className="profile-card profile-main">

              <div className="profile-heading">

                <div>

                  <div className="profile-eyebrow">
                    MY ACCOUNT
                  </div>

                  <h1 className="profile-title">
                    Your QuickBite profile
                  </h1>

                  <p className="profile-subtitle">
                    Manage your personal details,
                    delivery address and account
                    preferences from one premium
                    dashboard.
                  </p>

                </div>

                {!editing ? (
                  <button
                    type="button"
                    className="profile-edit-btn"
                    onClick={() => {
                      clearAlerts();
                      setEditing(true);
                    }}
                  >
                    ✏ Edit profile
                  </button>
                ) : null}

              </div>

              {/* ALERTS */}

              {error ? (
                <div className="profile-alert profile-error">
                  ⚠️ {error}
                </div>
              ) : null}

              {message ? (
                <div className="profile-alert profile-success">
                  ✓ {message}
                </div>
              ) : null}

              {/* =================================================
                  STATS
              ================================================== */}

              <div className="profile-stat-grid">

                <div className="profile-stat">

                  <div className="profile-stat-icon">
                    📦
                  </div>

                  <div className="profile-stat-number">
                    {totalOrders}
                  </div>

                  <div className="profile-stat-label">
                    Total orders
                  </div>

                </div>

                <div className="profile-stat">

                  <div className="profile-stat-icon">
                    ✅
                  </div>

                  <div className="profile-stat-number">
                    {deliveredOrders}
                  </div>

                  <div className="profile-stat-label">
                    Delivered
                  </div>

                </div>

                <div className="profile-stat">

                  <div className="profile-stat-icon">
                    🚴
                  </div>

                  <div className="profile-stat-number">
                    {activeOrders}
                  </div>

                  <div className="profile-stat-label">
                    Active orders
                  </div>

                </div>

              </div>

              {/* =================================================
                  DETAILS / EDIT
              ================================================== */}

              {!editing ? (
                <div className="profile-section">

                  <div className="profile-section-title">
                    Personal information
                  </div>

                  <div className="profile-section-copy">
                    Your current QuickBite account details.
                  </div>

                  <div className="profile-info-grid">

                    <div className="profile-info-box">

                      <div className="profile-info-label">
                        Full name
                      </div>

                      <div className="profile-info-value">
                        {user.name ||
                          "Not available"}
                      </div>

                    </div>

                    <div className="profile-info-box">

                      <div className="profile-info-label">
                        Email
                      </div>

                      <div className="profile-info-value">
                        {user.email ||
                          "Not available"}
                      </div>

                    </div>

                    <div className="profile-info-box">

                      <div className="profile-info-label">
                        Mobile
                      </div>

                      <div className="profile-info-value">
                        {user.phone ||
                          "Not available"}
                      </div>

                    </div>

                    <div className="profile-info-box">

                      <div className="profile-info-label">
                        Delivery address
                      </div>

                      <div className="profile-info-value">
                        {user.address ||
                          "No address saved"}
                      </div>

                    </div>

                  </div>

                </div>
              ) : (
                <div className="profile-section">

                  <div className="profile-section-title">
                    Edit personal information
                  </div>

                  <div className="profile-section-copy">
                    Update the details displayed on your QuickBite account.
                  </div>

                  <div className="profile-form">

                    <div className="profile-field">

                      <label>
                        Full name
                      </label>

                      <input
                        className="profile-input"
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          updateForm(
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Enter your full name"
                      />

                    </div>

                    <div className="profile-field">

                      <label>
                        Mobile number
                      </label>

                      <input
                        className="profile-input"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) =>
                          updateForm(
                            "phone",
                            e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10)
                          )
                        }
                        placeholder="10-digit mobile number"
                      />

                    </div>

                    <div className="profile-field">

                      <label>
                        Delivery address
                      </label>

                      <textarea
                        className="profile-textarea"
                        value={form.address}
                        onChange={(e) =>
                          updateForm(
                            "address",
                            e.target.value
                          )
                        }
                        placeholder="Enter your delivery address"
                      />

                    </div>

                    <div className="profile-form-actions">

                      <button
                        type="button"
                        className="profile-save"
                        onClick={saveProfile}
                      >
                        Save changes
                      </button>

                      <button
                        type="button"
                        className="profile-cancel"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>

                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  QUICK ACTIONS
              ================================================== */}

              <div className="profile-actions-grid">

                <button
                  type="button"
                  className="profile-action"
                  onClick={() =>
                    goTo("/orders")
                  }
                >

                  <div className="profile-action-icon">
                    📦
                  </div>

                  <div className="profile-action-title">
                    My orders
                  </div>

                  <div className="profile-action-copy">
                    View your previous and active orders.
                  </div>

                </button>

                <button
                  type="button"
                  className="profile-action"
                  onClick={() =>
                    goTo("/")
                  }
                >

                  <div className="profile-action-icon">
                    🍽️
                  </div>

                  <div className="profile-action-title">
                    Order food
                  </div>

                  <div className="profile-action-copy">
                    Explore restaurants and discover something delicious.
                  </div>

                </button>

                <button
                  type="button"
                  className="profile-action"
                  onClick={() =>
                    goTo("/track-order")
                  }
                >

                  <div className="profile-action-icon">
                    📍
                  </div>

                  <div className="profile-action-title">
                    Track order
                  </div>

                  <div className="profile-action-copy">
                    Follow your latest delivery in real time.
                  </div>

                </button>

                <button
                  type="button"
                  className="profile-action"
                  onClick={() =>
                    goTo("/support")
                  }
                >

                  <div className="profile-action-icon">
                    💬
                  </div>

                  <div className="profile-action-title">
                    Help & support
                  </div>

                  <div className="profile-action-copy">
                    Get help with your QuickBite experience.
                  </div>

                </button>

              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );
};

export default Profile;