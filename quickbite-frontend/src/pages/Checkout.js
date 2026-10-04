import React, { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import API_BASE_URL from "../config";

const API_URL = `${API_BASE_URL}/orders`;

const PAYMENT_API = `${API_BASE_URL}/payment/create-order`;

const PAYMENT_VERIFY_API = `${API_BASE_URL}/payment/verify`;

const DELIVERY_FEE = 40;
const TAX_RATE = 0.05;

const FOOD_VIDEO =
  "https://cdn.coverr.co/videos/coverr-a-chef-preparing-food-1578/1080p.mp4";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=90";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80";

function Checkout() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    paymentMethod: "Cash on Delivery",
  });

  const [errors, setErrors] = useState({});
  const [placingOrder, setPlacingOrder] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    loadCheckoutData();

    const handleStorage = () => {
      loadCheckoutData();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const loadCheckoutData = () => {
    try {
      const savedCart =
        localStorage.getItem("quickbite-cart");

      const savedUser =
        localStorage.getItem("quickbite-user");

      const parsedCart = savedCart
        ? JSON.parse(savedCart)
        : [];

      const parsedUser = savedUser
        ? JSON.parse(savedUser)
        : null;

      const safeCart = Array.isArray(parsedCart)
        ? parsedCart
        : [];

      const normalizedCart = safeCart
        .map((item, index) => {
          const menuItemId =
            item.menuItemId ??
            item.menuItem?.id ??
            item.id ??
            null;

          const restaurantId =
            item.restaurantId ??
            item.restaurant?.id ??
            null;

          const restaurantName =
            item.restaurantName ??
            item.restaurant?.name ??
            "QuickBite Restaurant";

          const itemName =
            item.itemName ??
            item.name ??
            item.menuItem?.itemName ??
            "Food Item";

          const imageUrl =
            item.imageUrl ??
            item.image ??
            item.menuItem?.imageUrl ??
            "";

          return {
            ...item,

            menuItemId:
              menuItemId !== null &&
              menuItemId !== undefined &&
              !Number.isNaN(Number(menuItemId))
                ? Number(menuItemId)
                : null,

            restaurantId:
              restaurantId !== null &&
              restaurantId !== undefined &&
              !Number.isNaN(Number(restaurantId))
                ? Number(restaurantId)
                : null,

            restaurantName,
            itemName,
            imageUrl,

            quantity: Math.max(
              1,
              Number(item.quantity || 1)
            ),

            price: Math.max(
              0,
              Number(item.price || 0)
            ),

            _checkoutKey:
              menuItemId !== null &&
              menuItemId !== undefined
                ? `menu-${menuItemId}-${
                    restaurantId || "restaurant"
                  }`
                : `cart-${index}`,
          };
        })
        .filter(
          (item) =>
            item.menuItemId !== null &&
            item.menuItemId > 0
        );

      setCart(normalizedCart);
      setUser(parsedUser);

      if (parsedUser) {
        setForm((previous) => ({
          ...previous,

          name:
            previous.name ||
            parsedUser.name ||
            parsedUser.fullName ||
            "",

          phone:
            previous.phone ||
            parsedUser.phone ||
            "",

          address:
            previous.address ||
            parsedUser.address ||
            "",

          city:
            previous.city ||
            parsedUser.city ||
            "",

          pincode:
            previous.pincode ||
            parsedUser.pincode ||
            "",
        }));
      }
    } catch (error) {
      console.error(
        "Checkout data loading error:",
        error
      );

      setCart([]);
    } finally {
      setPageLoading(false);
    }
  };

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );
  }, [cart]);

  const taxes = useMemo(() => {
    return subtotal * TAX_RATE;
  }, [subtotal]);

  const deliveryFee =
    cart.length > 0 ? DELIVERY_FEE : 0;

  const total =
    subtotal +
    deliveryFee +
    taxes;

  const totalItems = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0),
      0
    );
  }, [cart]);

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name =
        "Please enter your name.";
    } else if (
      form.name.trim().length < 2
    ) {
      newErrors.name =
        "Name should contain at least 2 characters.";
    }

    if (
      !/^[6-9]\d{9}$/.test(
        form.phone.trim()
      )
    ) {
      newErrors.phone =
        "Enter a valid 10-digit Indian mobile number.";
    }

    if (!form.address.trim()) {
      newErrors.address =
        "Please enter your complete delivery address.";
    } else if (
      form.address.trim().length < 8
    ) {
      newErrors.address =
        "Please enter a more complete address.";
    }

    if (!form.city.trim()) {
      newErrors.city =
        "Please enter your city.";
    }

    if (
      !/^\d{6}$/.test(
        form.pincode.trim()
      )
    ) {
      newErrors.pincode =
        "Enter a valid 6-digit pincode.";
    }

    if (!form.paymentMethod) {
      newErrors.paymentMethod =
        "Please select a payment method.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  const goTo = (path) => {
    window.location.href = path;
  };

  /*
   * =========================================================
   * JWT AUTHORIZATION HEADER
   * =========================================================
   */

  const getAuthHeaders = () => {
    const token = localStorage.getItem(
      "quickbite-user-token"
    );

    return {
      "Content-Type": "application/json",
      Authorization: token
        ? `Bearer ${token}`
        : "",
    };
  };

  /*
   * =========================================================
   * CREATE QUICKBITE ORDER
   * =========================================================
   */

  const createQuickBiteOrder = async (
    paymentMethod,
    paymentData = {}
  ) => {
    const paymentStatus =
      paymentData.paymentStatus ||
      (
        paymentMethod === "Cash on Delivery"
          ? "PENDING"
          : "PAID"
      );

    const orderRequest = {
      customerEmail:
        String(user.email)
          .trim()
          .toLowerCase(),

      customerName:
        form.name.trim(),

      phone:
        form.phone.trim(),

      address:
        form.address.trim(),

      city:
        form.city.trim(),

      pincode:
        form.pincode.trim(),

      paymentMethod,

      paymentStatus,

      razorpayOrderId:
        paymentData.razorpayOrderId ||
        "",

      razorpayPaymentId:
        paymentData.razorpayPaymentId ||
        "",

      totalPrice:
        Number(total.toFixed(2)),

      items: cart.map((item) => ({
        menuItemId:
          Number(item.menuItemId),

        quantity:
          Number(item.quantity),
      })),
    };

    console.log(
      "========================================"
    );

    console.log(
      "QUICKBITE ORDER REQUEST"
    );

    console.log(
      "Payment Method:",
      paymentMethod
    );

    console.log(
      "Payment Status:",
      paymentStatus
    );

    console.log(
      "Razorpay Order ID:",
      paymentData.razorpayOrderId ||
        "N/A"
    );

    console.log(
      "Razorpay Payment ID:",
      paymentData.razorpayPaymentId ||
        "N/A"
    );

    console.log(
      "========================================"
    );

    console.log(
      "QuickBite Order Request:",
      orderRequest
    );

    const response = await fetch(
      API_URL,
      {
        method: "POST",

        headers: getAuthHeaders(),

        body: JSON.stringify(
          orderRequest
        ),
      }
    );

    const responseText =
      await response.text();

    let responseData = null;

    try {
      responseData = responseText
        ? JSON.parse(responseText)
        : null;
    } catch {
      responseData = responseText;
    }

    if (!response.ok) {
      console.error(
        "Backend order error:",
        {
          status: response.status,
          response: responseData,
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem(
          "quickbite-user-token"
        );

        alert(
          "Your login session has expired. Please login again."
        );

        goTo("/login");

        return;
      }

      const backendMessage =
        responseData &&
        typeof responseData ===
          "object" &&
        responseData.message
          ? responseData.message
          : "";

      throw new Error(
        backendMessage ||
          `Order failed with status ${response.status}`
      );
    }

    const savedOrder =
      responseData &&
      typeof responseData ===
        "object"
        ? responseData
        : {};

    const backendOrderId =
      savedOrder.id ??
      savedOrder.orderId ??
      `QB-${Date.now()}`;

    const backendStatus =
      savedOrder.status ||
      "CONFIRMED";

    const orderForFrontend = {
      ...savedOrder,

      id: backendOrderId,

      status: backendStatus,

      paymentStatus:
        savedOrder.paymentStatus ||
        paymentStatus,

      razorpayOrderId:
        savedOrder.razorpayOrderId ||
        paymentData.razorpayOrderId ||
        null,

      razorpayPaymentId:
        savedOrder.razorpayPaymentId ||
        paymentData.razorpayPaymentId ||
        null,

      subtotal,

      deliveryFee,

      taxes,

      customerEmail:
        user.email,

      customerName:
        form.name.trim(),

      phone:
        form.phone.trim(),

      address:
        form.address.trim(),

      city:
        form.city.trim(),

      pincode:
        form.pincode.trim(),

      paymentMethod,

      totalPrice:
        total,

      totalItems,

      paymentDetails:
        paymentData,

      orderItems:
        cart.map((item) => ({
          id:
            item.menuItemId,

          menuItem: {
            id:
              item.menuItemId,

            itemName:
              item.itemName,

            price:
              Number(
                item.price || 0
              ),

            category:
              item.category || "",

            imageUrl:
              item.imageUrl || "",

            restaurant: {
              id:
                item.restaurantId,

              name:
                item.restaurantName ||
                "QuickBite Restaurant",
            },
          },

          quantity:
            Number(item.quantity),

          price:
            Number(
              item.price || 0
            ),
        })),

      createdAt:
        savedOrder.createdAt ||
        new Date().toISOString(),
    };

    console.log(
      "QuickBite order saved successfully:",
      orderForFrontend
    );

    localStorage.setItem(
      "quickbite-last-order",
      JSON.stringify(
        orderForFrontend
      )
    );

    localStorage.setItem(
      "quickbite-tracking-order",
      JSON.stringify(
        orderForFrontend
      )
    );

    let existingOrders = [];

    try {
      const savedOrders =
        localStorage.getItem(
          "quickbite-orders"
        );

      const parsedOrders =
        savedOrders
          ? JSON.parse(savedOrders)
          : [];

      existingOrders =
        Array.isArray(
          parsedOrders
        )
          ? parsedOrders
          : [];
    } catch {
      existingOrders = [];
    }

    const withoutDuplicate =
      existingOrders.filter(
        (order) =>
          String(order?.id) !==
          String(
            orderForFrontend.id
          )
      );

    localStorage.setItem(
      "quickbite-orders",
      JSON.stringify([
        orderForFrontend,
        ...withoutDuplicate,
      ])
    );

    localStorage.removeItem(
      "quickbite-cart"
    );

    window.location.href =
      "/order-success";
  };

  /*
   * =========================================================
   * VERIFY RAZORPAY PAYMENT
   * =========================================================
   */

  const verifyRazorpayPayment =
    async (paymentResponse) => {

      console.log(
        "========================================"
      );

      console.log(
        "QUICKBITE PAYMENT VERIFICATION START"
      );

      console.log(
        "Razorpay Order ID:",
        paymentResponse?.razorpay_order_id
      );

      console.log(
        "Razorpay Payment ID:",
        paymentResponse?.razorpay_payment_id
      );

      console.log(
        "Signature available:",
        Boolean(
          paymentResponse?.razorpay_signature
        )
      );

      console.log(
        "========================================"
      );

      if (
        !paymentResponse?.razorpay_order_id ||
        !paymentResponse?.razorpay_payment_id ||
        !paymentResponse?.razorpay_signature
      ) {
        throw new Error(
          "Payment verification data is incomplete."
        );
      }

      const response =
        await fetch(
          PAYMENT_VERIFY_API,
          {
            method: "POST",

            headers: getAuthHeaders(),

            body: JSON.stringify({
              razorpayOrderId:
                paymentResponse.razorpay_order_id,

              razorpayPaymentId:
                paymentResponse.razorpay_payment_id,

              razorpaySignature:
                paymentResponse.razorpay_signature,
            }),
          }
        );

      const responseText =
        await response.text();

      let responseData = null;

      try {
        responseData =
          responseText
            ? JSON.parse(
                responseText
              )
            : null;
      } catch {
        responseData = null;
      }

      console.log(
        "Payment verification response:",
        {
          status:
            response.status,

          ok:
            response.ok,

          data:
            responseData,
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem(
          "quickbite-user-token"
        );

        throw new Error(
          "Your login session has expired. Please login again."
        );
      }

      if (!response.ok) {
        const message =
          responseData?.message ||
          "Payment verification failed.";

        throw new Error(
          message
        );
      }

      if (
        !responseData?.success ||
        !responseData?.verified
      ) {
        throw new Error(
          responseData?.message ||
            "Payment could not be verified."
        );
      }

      console.log(
        "========================================"
      );

      console.log(
        "RAZORPAY PAYMENT VERIFIED SUCCESSFULLY"
      );

      console.log(
        "Payment Status:",
        responseData.paymentStatus ||
          "PAID"
      );

      console.log(
        "========================================"
      );

      return responseData;
    };

  /*
   * =========================================================
   * RAZORPAY ONLINE PAYMENT
   * =========================================================
   */

  const startRazorpayPayment =
    async () => {

      try {

        console.log(
          "========================================"
        );

        console.log(
          "QUICKBITE RAZORPAY PAYMENT START"
        );

        console.log(
          "Payment method:",
          form.paymentMethod
        );

        console.log(
          "Payment amount:",
          Number(
            total.toFixed(2)
          )
        );

        console.log(
          "========================================"
        );

        if (
          typeof window.Razorpay ===
          "undefined"
        ) {
          throw new Error(
            "Razorpay Checkout SDK is not loaded. Please refresh the page and try again."
          );
        }

        const response =
          await fetch(
            PAYMENT_API,
            {
              method: "POST",

              headers: getAuthHeaders(),

              body: JSON.stringify({
                amount:
                  Number(
                    total.toFixed(2)
                  ),
              }),
            }
          );

        const responseText =
          await response.text();

        let responseData = null;

        try {
          responseData =
            responseText
              ? JSON.parse(
                  responseText
                )
              : null;
        } catch {
          responseData = null;
        }

        console.log(
          "Razorpay backend response:",
          {
            status:
              response.status,

            ok:
              response.ok,

            data:
              responseData,
          }
        );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem(
            "quickbite-user-token"
          );

          alert(
            "Your login session has expired. Please login again."
          );

          goTo("/login");

          return;
        }

        if (!response.ok) {
          const backendMessage =
            responseData?.message ||
            "Unable to create Razorpay payment order.";

          throw new Error(
            backendMessage
          );
        }

        if (
          !responseData?.orderId ||
          !responseData?.keyId
        ) {
          console.error(
            "Invalid Razorpay backend response:",
            responseData
          );

          throw new Error(
            "Invalid Razorpay order response from backend."
          );
        }

        console.log(
          "Razorpay Order ID:",
          responseData.orderId
        );

        console.log(
          "Razorpay Currency:",
          responseData.currency
        );

        console.log(
          "Razorpay Amount:",
          responseData.amount
        );

        const options = {

          key:
            responseData.keyId,

          amount:
            Number(
              responseData.amount
            ),

          currency:
            responseData.currency ||
            "INR",

          name:
            "QuickBite",

          description:
            "QuickBite Food Order",

          order_id:
            responseData.orderId,

          prefill: {

            name:
              form.name.trim(),

            email:
              user.email,

            contact:
              form.phone.trim(),
          },

          notes: {

            customerEmail:
              user.email,

            city:
              form.city.trim(),

            pincode:
              form.pincode.trim(),
          },

          theme: {
            color: "#f97316",
          },

          handler:
            async function (
              paymentResponse
            ) {

              try {

                console.log(
                  "========================================"
                );

                console.log(
                  "RAZORPAY PAYMENT SUCCESS"
                );

                console.log(
                  "Payment ID:",
                  paymentResponse?.razorpay_payment_id
                );

                console.log(
                  "Order ID:",
                  paymentResponse?.razorpay_order_id
                );

                console.log(
                  "Signature received:",
                  Boolean(
                    paymentResponse?.razorpay_signature
                  )
                );

                console.log(
                  "========================================"
                );

                setPlacingOrder(true);

                const verification =
                  await verifyRazorpayPayment(
                    paymentResponse
                  );

                await createQuickBiteOrder(
                  form.paymentMethod,
                  {
                    razorpayOrderId:
                      paymentResponse
                        .razorpay_order_id,

                    razorpayPaymentId:
                      paymentResponse
                        .razorpay_payment_id,

                    razorpaySignature:
                      paymentResponse
                        .razorpay_signature,

                    paymentStatus:
                      verification.paymentStatus ||
                      "PAID",

                    paymentVerified:
                      true,
                  }
                );

              } catch (error) {

                console.error(
                  "========================================"
                );

                console.error(
                  "PAYMENT VERIFICATION / ORDER ERROR"
                );

                console.error(
                  error
                );

                console.error(
                  "========================================"
                );

                alert(
                  error?.message ||
                    "Payment verification failed. Your order was not created. Please contact QuickBite support if your payment was deducted."
                );

                setPlacingOrder(
                  false
                );
              }
            },

          modal: {

            ondismiss:
              function () {

                console.log(
                  "Razorpay payment popup closed."
                );

                setPlacingOrder(
                  false
                );
              },
          },
        };

        console.log(
          "Opening Razorpay Checkout..."
        );

        const razorpay =
          new window.Razorpay(
            options
          );

        razorpay.on(
          "payment.failed",
          function (
            response
          ) {

            console.error(
              "========================================"
            );

            console.error(
              "RAZORPAY PAYMENT FAILED"
            );

            console.error(
              "Full response:",
              response
            );

            console.error(
              "Error description:",
              response?.error?.description
            );

            console.error(
              "Payment ID:",
              response?.error?.metadata
                ?.payment_id
            );

            console.error(
              "Order ID:",
              response?.error?.metadata
                ?.order_id
            );

            console.error(
              "========================================"
            );

            alert(
              response?.error
                ?.description ||
                "Payment failed. Please try again."
            );

            setPlacingOrder(
              false
            );
          }
        );

        razorpay.open();

      } catch (error) {

        console.error(
          "========================================"
        );

        console.error(
          "RAZORPAY PAYMENT ERROR"
        );

        console.error(
          "Error:",
          error
        );

        console.error(
          "Message:",
          error?.message
        );

        console.error(
          "========================================"
        );

        alert(
          error?.message ||
            "Unable to start payment. Please try again."
        );

        setPlacingOrder(
          false
        );
      }
    };

  /*
   * =========================================================
   * PLACE ORDER
   * =========================================================
   */

  const placeOrder = async () => {

    if (placingOrder) {
      return;
    }

    if (cart.length === 0) {

      alert(
        "Your cart is empty. Please add food first."
      );

      goTo(
        "/restaurants"
      );

      return;
    }

    if (
      !user ||
      !user.email
    ) {

      alert(
        "Please login before placing an order."
      );

      goTo(
        "/login"
      );

      return;
    }

    if (!validateForm()) {

      window.scrollTo({
        top: 100,
        behavior: "smooth",
      });

      return;
    }

    const invalidItems =
      cart.filter(
        (item) =>
          !item.menuItemId ||
          Number(
            item.menuItemId
          ) <= 0 ||
          Number(
            item.quantity
          ) <= 0
      );

    if (
      invalidItems.length > 0
    ) {

      console.error(
        "Invalid cart items:",
        invalidItems
      );

      alert(
        "One or more food items in your cart are invalid. Please go back to the menu and add them again."
      );

      return;
    }

    setPlacingOrder(true);

    try {

      if (
        form.paymentMethod ===
        "Cash on Delivery"
      ) {

        await createQuickBiteOrder(
          "Cash on Delivery",
          {
            paymentStatus:
              "PENDING",

            paymentVerified:
              false,
          }
        );

        return;
      }

      await startRazorpayPayment();

    } catch (error) {

      console.error(
        "Place order error:",
        error
      );

      alert(
        error?.message ||
          "Unable to place your order right now. Please try again."
      );

      setPlacingOrder(
        false
      );
    }
  };

  /*
   * =========================================================
   * BACKGROUND COMPONENT
   * =========================================================
   */

  const Background = () => (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            `url(${HERO_FALLBACK})`,
        }}
      />

      {!videoFailed && (
        <video
          autoPlay
          muted
          loop
          playsInline
          onError={() =>
            setVideoFailed(true)
          }
          className="pointer-events-none fixed inset-0 z-[1] h-full w-full object-cover"
        >
          <source
            src={FOOD_VIDEO}
            type="video/mp4"
          />
        </video>
      )}

      <div
        className="pointer-events-none fixed inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.62) 48%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      <div
        className="pointer-events-none fixed right-[-150px] top-[-100px] z-[3] h-[500px] w-[500px] rounded-full"
        style={{
          background:
            "rgba(255,77,109,0.20)",
          filter:
            "blur(80px)",
        }}
      />
    </>
  );

  /*
   * =========================================================
   * PAGE LOADING
   * =========================================================
   */

  if (pageLoading) {

    return (
      <div className="relative min-h-screen overflow-x-hidden bg-gray-950 text-white">

        <Background />

        <div className="relative z-10">

          <Navbar />

          <div className="flex min-h-[75vh] items-center justify-center px-4">

            <div className="rounded-3xl border border-white/10 bg-black/40 px-10 py-10 text-center shadow-2xl backdrop-blur-xl">

              <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500" />

              <h2 className="text-xl font-black">
                Preparing your checkout
              </h2>

              <p className="mt-2 text-gray-300">
                Loading your delicious order...
              </p>

            </div>

          </div>

        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * EMPTY CART
   * =========================================================
   */

  if (cart.length === 0) {

    return (
      <div className="relative min-h-screen overflow-x-hidden bg-gray-950 text-white">

        <Background />

        <div className="relative z-10">

          <Navbar />

          <main className="mx-auto max-w-4xl px-4 py-20">

            <div className="rounded-[2rem] border border-white/10 bg-black/40 p-10 text-center shadow-2xl backdrop-blur-xl md:p-16">

              <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-orange-500/10 text-5xl">
                🛒
              </div>

              <p className="mb-3 text-sm font-black uppercase tracking-widest text-orange-400">
                QuickBite Checkout
              </p>

              <h1 className="text-3xl font-black md:text-4xl">
                Your Cart is Empty
              </h1>

              <p className="mx-auto mb-8 mt-3 max-w-md text-gray-300">
                Add some delicious food before
                continuing to checkout.
              </p>

              <button
                onClick={() =>
                  goTo(
                    "/restaurants"
                  )
                }
                className="rounded-2xl bg-orange-500 px-8 py-4 font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
              >
                🍽️ Browse Restaurants
              </button>

            </div>

          </main>

        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * LOGIN REQUIRED
   * =========================================================
   */

  if (
    !user ||
    !user.email
  ) {

    return (
      <div className="relative min-h-screen overflow-x-hidden bg-gray-950 text-white">

        <Background />

        <div className="relative z-10">

          <Navbar />

          <main className="mx-auto max-w-4xl px-4 py-20">

            <div className="rounded-[2rem] border border-white/10 bg-black/40 p-10 text-center shadow-2xl backdrop-blur-xl md:p-16">

              <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-blue-500/10 text-5xl">
                🔐
              </div>

              <p className="mb-3 text-sm font-black uppercase tracking-widest text-orange-400">
                Secure Checkout
              </p>

              <h1 className="text-3xl font-black md:text-4xl">
                Login Required
              </h1>

              <p className="mb-8 mt-3 text-gray-300">
                Please login to continue with your
                order.
              </p>

              <button
                onClick={() =>
                  goTo(
                    "/login"
                  )
                }
                className="rounded-2xl bg-orange-500 px-8 py-4 font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
              >
                Login to Continue
              </button>

            </div>

          </main>

        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * MAIN CHECKOUT UI
   * =========================================================
   */

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gray-950 text-white">

      <Background />

      <div className="relative z-10">

        <Navbar />

        {/* =====================================
            HERO
        ====================================== */}

        <section className="relative overflow-hidden border-b border-white/10 bg-black/30 backdrop-blur-md">

          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-red-900/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">

            <button
              onClick={() =>
                goTo(
                  "/cart"
                )
              }
              className="mb-6 text-sm font-bold text-orange-300 transition hover:text-white"
            >
              ← Back to Cart
            </button>

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

              <div>

                <p className="mb-3 text-xs font-black tracking-[0.2em] text-orange-400 md:text-sm">
                  QUICKBITE CHECKOUT
                </p>

                <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                  Complete Your Order
                </h1>

                <p className="mt-3 max-w-xl text-gray-300">
                  Enter your delivery details,
                  choose your payment method and
                  place your order securely.
                </p>

              </div>

              <div className="rounded-2xl border border-white/20 bg-black/30 px-5 py-4 shadow-xl backdrop-blur-xl">

                <p className="text-xs font-bold text-orange-300">
                  ORDER TOTAL
                </p>

                <p className="mt-1 text-2xl font-black">
                  ₹{total.toFixed(0)}
                </p>

              </div>

            </div>

          </div>

        </section>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">

          <div className="grid items-start gap-7 lg:grid-cols-3">

            {/* =================================
                LEFT
            ================================== */}

            <div className="space-y-6 lg:col-span-2">

              {/* DELIVERY DETAILS */}

              <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl md:p-8">

                <div className="mb-8 flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl">
                    📍
                  </div>

                  <div>

                    <h2 className="text-xl font-black md:text-2xl">
                      Delivery Details
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      Where should we deliver your
                      food?
                    </p>

                  </div>

                </div>

                <div className="grid gap-5 md:grid-cols-2">

                  {/* NAME */}

                  <div>

                    <label className="mb-2 block text-sm font-bold text-gray-200">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={
                        form.name
                      }
                      onChange={(e) =>
                        updateForm(
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="Enter your full name"
                      className={`w-full rounded-2xl border bg-black/40 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-500 ${
                        errors.name
                          ? "border-red-500"
                          : "border-white/10 focus:border-orange-500"
                      }`}
                    />

                    {errors.name && (
                      <p className="mt-2 text-xs text-red-400">
                        {errors.name}
                      </p>
                    )}

                  </div>

                  {/* PHONE */}

                  <div>

                    <label className="mb-2 block text-sm font-bold text-gray-200">
                      Mobile Number
                    </label>

                    <input
                      type="tel"
                      maxLength="10"
                      value={
                        form.phone
                      }
                      onChange={(e) =>
                        updateForm(
                          "phone",
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      placeholder="10-digit mobile number"
                      className={`w-full rounded-2xl border bg-black/40 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-500 ${
                        errors.phone
                          ? "border-red-500"
                          : "border-white/10 focus:border-orange-500"
                      }`}
                    />

                    {errors.phone && (
                      <p className="mt-2 text-xs text-red-400">
                        {errors.phone}
                      </p>
                    )}

                  </div>

                  {/* ADDRESS */}

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-bold text-gray-200">
                      Complete Address
                    </label>

                    <textarea
                      rows="4"
                      value={
                        form.address
                      }
                      onChange={(e) =>
                        updateForm(
                          "address",
                          e.target.value
                        )
                      }
                      placeholder="House/Flat No., Street, Area, Landmark..."
                      className={`w-full resize-none rounded-2xl border bg-black/40 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-500 ${
                        errors.address
                          ? "border-red-500"
                          : "border-white/10 focus:border-orange-500"
                      }`}
                    />

                    {errors.address && (
                      <p className="mt-2 text-xs text-red-400">
                        {errors.address}
                      </p>
                    )}

                  </div>

                  {/* CITY */}

                  <div>

                    <label className="mb-2 block text-sm font-bold text-gray-200">
                      City
                    </label>

                    <input
                      type="text"
                      value={
                        form.city
                      }
                      onChange={(e) =>
                        updateForm(
                          "city",
                          e.target.value
                        )
                      }
                      placeholder="Enter city"
                      className={`w-full rounded-2xl border bg-black/40 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-500 ${
                        errors.city
                          ? "border-red-500"
                          : "border-white/10 focus:border-orange-500"
                      }`}
                    />

                    {errors.city && (
                      <p className="mt-2 text-xs text-red-400">
                        {errors.city}
                      </p>
                    )}

                  </div>

                  {/* PINCODE */}

                  <div>

                    <label className="mb-2 block text-sm font-bold text-gray-200">
                      Pincode
                    </label>

                    <input
                      type="text"
                      maxLength="6"
                      value={
                        form.pincode
                      }
                      onChange={(e) =>
                        updateForm(
                          "pincode",
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      placeholder="6-digit pincode"
                      className={`w-full rounded-2xl border bg-black/40 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-500 ${
                        errors.pincode
                          ? "border-red-500"
                          : "border-white/10 focus:border-orange-500"
                      }`}
                    />

                    {errors.pincode && (
                      <p className="mt-2 text-xs text-red-400">
                        {errors.pincode}
                      </p>
                    )}

                  </div>

                </div>

              </section>

              {/* PAYMENT */}

              <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl md:p-8">

                <div className="mb-8 flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-2xl">
                    💳
                  </div>

                  <div>

                    <h2 className="text-xl font-black md:text-2xl">
                      Payment Method
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      Choose how you want to pay.
                    </p>

                  </div>

                </div>

                <div className="grid gap-4 md:grid-cols-3">

                  {[
                    {
                      name:
                        "Cash on Delivery",
                      icon:
                        "💵",
                      text:
                        "Pay when delivered",
                    },

                    {
                      name:
                        "UPI",
                      icon:
                        "📱",
                      text:
                        "Pay securely with Razorpay",
                    },

                    {
                      name:
                        "Card",
                      icon:
                        "💳",
                      text:
                        "Credit / Debit Card",
                    },
                  ].map(
                    (method) => {

                      const selected =
                        form.paymentMethod ===
                        method.name;

                      return (
                        <button
                          key={
                            method.name
                          }
                          type="button"
                          onClick={() =>
                            updateForm(
                              "paymentMethod",
                              method.name
                            )
                          }
                          className={`rounded-2xl border-2 bg-black/30 p-5 text-left backdrop-blur-md transition ${
                            selected
                              ? "border-orange-500 bg-orange-500/10"
                              : "border-white/10 hover:border-orange-500/50"
                          }`}
                        >

                          <div className="flex items-center justify-between">

                            <span className="text-2xl">
                              {
                                method.icon
                              }
                            </span>

                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                selected
                                  ? "border-orange-500"
                                  : "border-gray-600"
                              }`}
                            >
                              {selected && (
                                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                              )}
                            </span>

                          </div>

                          <p className="mt-4 font-black text-white">
                            {
                              method.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {
                              method.text
                            }
                          </p>

                        </button>
                      );
                    }
                  )}

                </div>

                <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">

                  <p className="text-sm text-green-300">

                    <strong>
                      Razorpay Test Mode:
                    </strong>{" "}

                    UPI and Card payments will open
                    the Razorpay test checkout. No
                    real money will be charged.

                  </p>

                </div>

              </section>

              {/* SECURE CHECKOUT */}

              <section className="rounded-3xl border border-white/10 bg-black/35 p-6 backdrop-blur-xl">

                <div className="flex gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-xl">
                    🔒
                  </div>

                  <div>

                    <h3 className="font-black">
                      Secure Checkout
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-gray-400">
                      Online payments are handled by
                      Razorpay. QuickBite does not
                      receive or store your card
                      details.
                    </p>

                  </div>

                </div>

              </section>

            </div>

            {/* =================================
                RIGHT
            ================================== */}

            <aside className="lg:sticky lg:top-5">

              <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/45 shadow-2xl backdrop-blur-xl">

                {/* SUMMARY HEADER */}

                <div className="border-b border-white/10 p-6">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-xs font-black uppercase tracking-widest text-orange-400">
                        QuickBite
                      </p>

                      <h2 className="mt-1 text-xl font-black">
                        Order Summary
                      </h2>

                      <p className="mt-1 text-sm text-gray-400">

                        {totalItems} item
                        {totalItems !== 1
                          ? "s"
                          : ""}

                      </p>

                    </div>

                    <button
                      onClick={() =>
                        goTo(
                          "/cart"
                        )
                      }
                      className="text-sm font-bold text-orange-400 transition hover:text-orange-300"
                    >
                      Edit
                    </button>

                  </div>

                </div>

                {/* ITEMS */}

                <div className="max-h-[390px] space-y-5 overflow-y-auto p-6">

                  {cart.map(
                    (item) => (

                      <div
                        key={
                          item._checkoutKey
                        }
                        className="flex gap-3"
                      >

                        <img
                          src={
                            item.imageUrl ||
                            DEFAULT_IMAGE
                          }
                          alt={
                            item.itemName
                          }
                          className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 bg-gray-800 object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              DEFAULT_IMAGE;
                          }}
                        />

                        <div className="min-w-0 flex-1">

                          <div className="flex justify-between gap-3">

                            <h3 className="truncate text-sm font-bold text-white">
                              {
                                item.itemName
                              }
                            </h3>

                            <span className="whitespace-nowrap text-sm font-black text-white">

                              ₹
                              {(
                                Number(
                                  item.price ||
                                    0
                                ) *
                                Number(
                                  item.quantity ||
                                    0
                                )
                              ).toFixed(0)}

                            </span>

                          </div>

                          <p className="mt-1 text-xs text-gray-400">

                            ₹
                            {Number(
                              item.price ||
                                0
                            ).toFixed(0)}{" "}

                            ×{" "}
                            {
                              item.quantity
                            }

                          </p>

                          {item.restaurantName && (

                            <p className="mt-1 truncate text-xs text-orange-400">
                              {
                                item.restaurantName
                              }
                            </p>

                          )}

                        </div>

                      </div>

                    )
                  )}

                </div>

                {/* BILL */}

                <div className="border-t border-white/10 p-6">

                  <div className="space-y-3 text-sm">

                    <div className="flex justify-between">

                      <span className="text-gray-400">
                        Subtotal
                      </span>

                      <span className="font-semibold">
                        ₹
                        {subtotal.toFixed(0)}
                      </span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-gray-400">
                        Delivery Fee
                      </span>

                      <span className="font-semibold">
                        ₹
                        {deliveryFee.toFixed(
                          0
                        )}
                      </span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-gray-400">
                        Taxes
                      </span>

                      <span className="font-semibold">
                        ₹
                        {taxes.toFixed(0)}
                      </span>

                    </div>

                  </div>

                  <div className="mt-5 border-t border-white/10 pt-5">

                    <div className="flex items-center justify-between">

                      <span className="text-lg font-black">
                        Total
                      </span>

                      <span className="text-2xl font-black text-orange-400">
                        ₹
                        {total.toFixed(
                          0
                        )}
                      </span>

                    </div>

                  </div>

                  <button
                    onClick={
                      placeOrder
                    }
                    disabled={
                      placingOrder
                    }
                    className={`mt-6 w-full rounded-2xl py-4 text-base font-black text-white transition ${
                      placingOrder
                        ? "cursor-not-allowed bg-gray-700"
                        : "bg-orange-500 shadow-lg shadow-orange-500/20 hover:bg-orange-600"
                    }`}
                  >

                    {placingOrder
                      ? "⏳ Processing..."
                      : form.paymentMethod ===
                        "Cash on Delivery"
                      ? `🚀 Place Order • ₹${total.toFixed(
                          0
                        )}`
                      : `💳 Pay ₹${total.toFixed(
                          0
                        )}`}

                  </button>

                  <p className="mt-4 text-center text-xs leading-5 text-gray-500">
                    By placing your order, you confirm
                    that your delivery details are
                    correct.
                  </p>

                </div>

              </section>

              {/* TRUST */}

              <div className="mt-4 grid grid-cols-3 gap-2">

                <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center backdrop-blur-xl">

                  <div>
                    🔒
                  </div>

                  <p className="mt-1 text-[10px] text-gray-400">
                    Secure
                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center backdrop-blur-xl">

                  <div>
                    ⚡
                  </div>

                  <p className="mt-1 text-[10px] text-gray-400">
                    Fast
                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center backdrop-blur-xl">

                  <div>
                    ❤️
                  </div>

                  <p className="mt-1 text-[10px] text-gray-400">
                    Trusted
                  </p>

                </div>

              </div>

            </aside>

          </div>

        </main>

        {/* =====================================
            FOOTER
        ====================================== */}

        <footer className="mt-10 border-t border-white/10 bg-black/70 px-6 py-10 backdrop-blur-xl">

          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">

            <div>

              <h2 className="mb-3 text-2xl font-black text-white">
                QuickBite
              </h2>

              <p className="text-sm leading-6 text-gray-400">
                Fast food delivery made simple,
                delicious and convenient.
              </p>

            </div>

            <div>

              <h3 className="mb-3 font-bold text-white">
                Quick Links
              </h3>

              <div className="space-y-2 text-sm">

                <button
                  onClick={() =>
                    goTo("/")
                  }
                  className="block transition hover:text-orange-400"
                >
                  Home
                </button>

                <button
                  onClick={() =>
                    goTo(
                      "/restaurants"
                    )
                  }
                  className="block transition hover:text-orange-400"
                >
                  Restaurants
                </button>

                <button
                  onClick={() =>
                    goTo("/menu")
                  }
                  className="block transition hover:text-orange-400"
                >
                  Menu
                </button>

              </div>

            </div>

            <div>

              <h3 className="mb-3 font-bold text-white">
                Orders
              </h3>

              <div className="space-y-2 text-sm">

                <button
                  onClick={() =>
                    goTo("/orders")
                  }
                  className="block transition hover:text-orange-400"
                >
                  My Orders
                </button>

                <button
                  onClick={() =>
                    goTo(
                      "/track-order"
                    )
                  }
                  className="block transition hover:text-orange-400"
                >
                  Track Order
                </button>

                <button
                  onClick={() =>
                    goTo("/cart")
                  }
                  className="block transition hover:text-orange-400"
                >
                  Cart
                </button>

              </div>

            </div>

            <div>

              <h3 className="mb-3 font-bold text-white">
                Support
              </h3>

              <p className="text-sm text-gray-400">
                Need help with your order?
              </p>

              <button
                onClick={() =>
                  goTo(
                    "/support"
                  )
                }
                className="mt-2 text-sm text-orange-400 transition hover:text-orange-300"
              >
                Visit Support Center →
              </button>

            </div>

          </div>

          <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-6 text-center text-sm text-gray-500">

            © 2026 QuickBite. All rights reserved.

          </div>

        </footer>

      </div>

    </div>
  );
}

export default Checkout;