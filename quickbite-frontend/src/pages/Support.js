import React, { useState } from "react";
import Navbar from "./components/Navbar";

const FOOD_VIDEO =
"https://cdn.coverr.co/videos/coverr-a-chef-preparing-food-1578/1080p.mp4";

const HERO_FALLBACK =
"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=90";

function PageBackground({ children }) {
return (
<div
className="relative min-h-screen text-gray-900 overflow-hidden"
style={{
backgroundImage: `url("${HERO_FALLBACK}")`,
backgroundSize: "cover",
backgroundPosition: "center",
backgroundAttachment: "fixed",
}}
>
<video
className="fixed inset-0 w-full h-full object-cover -z-20"
autoPlay
muted
loop
playsInline
onError={(event) => {
event.currentTarget.style.display = "none";
}}
>
<source src={FOOD_VIDEO} type="video/mp4" />
</video>

  <div
    className="fixed inset-0 -z-10"
    style={{
      background:
        "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.58) 48%, rgba(0,0,0,0.25) 100%)",
    }}
  />

  <div
    className="fixed pointer-events-none"
    style={{
      width: "500px",
      height: "500px",
      borderRadius: "50%",
      right: "-150px",
      top: "-100px",
      background: "rgba(255,77,109,0.20)",
      filter: "blur(80px)",
      zIndex: -5,
    }}
  />

  <div
    className="fixed pointer-events-none"
    style={{
      width: "420px",
      height: "420px",
      borderRadius: "50%",
      left: "-180px",
      bottom: "-180px",
      background: "rgba(249,115,22,0.14)",
      filter: "blur(90px)",
      zIndex: -5,
    }}
  />

  <div className="relative z-10">{children}</div>
</div>

);
}

function Support() {
const [openFaq, setOpenFaq] = useState(null);

const [form, setForm] = useState({
name: "",
email: "",
orderId: "",
category: "Order Issue",
message: "",
});

const [submitted, setSubmitted] = useState(false);

const faqs = [
{
question: "How can I track my order?",
answer:
"Go to My Orders and select your order. You can also use the Track Order option to view the latest order status.",
},
{
question: "How can I cancel my order?",
answer:
"Order cancellation depends on the current order status. If cancellation is available, contact QuickBite support with your Order ID.",
},
{
question: "What payment methods are available?",
answer:
"QuickBite currently supports the payment methods shown during checkout, including Cash on Delivery when available.",
},
{
question: "What should I do if my order is late?",
answer:
"Open Track Order to check the latest status. If the order remains delayed, contact support with your Order ID.",
},
{
question: "I received the wrong item. What should I do?",
answer:
"Contact QuickBite support and provide your Order ID along with a short description of the issue.",
},
{
question: "Can I reorder an old order?",
answer:
"Yes. Open My Orders, select a previous order, and use the Reorder option when the required menu items are available.",
},
];

const supportCategories = [
{
icon: "📦",
title: "Order Issues",
description:
"Problems with your order, missing items or wrong items.",
},
{
icon: "🚚",
title: "Delivery Help",
description:
"Questions about delivery status, delays or addresses.",
},
{
icon: "💳",
title: "Payment Help",
description:
"Get help with checkout and payment-related issues.",
},
{
icon: "👤",
title: "Account Help",
description:
"Need help with your profile, login or account details?",
},
];

const goTo = (path) => {
window.location.href = path;
};

const handleChange = (field, value) => {
setForm((previous) => ({
...previous,
[field]: value,
}));

setSubmitted(false);

};

const handleSubmit = (event) => {
event.preventDefault();

if (
  !form.name.trim() ||
  !form.email.trim() ||
  !form.message.trim()
) {
  alert("Please fill in all required fields.");
  return;
}

const ticket = {
  id: `QB-${Date.now()}`,
  ...form,
  createdAt: new Date().toISOString(),
  status: "OPEN",
};

const existingTickets =
  JSON.parse(
    localStorage.getItem("quickbite-support-tickets")
  ) || [];

localStorage.setItem(
  "quickbite-support-tickets",
  JSON.stringify([
    ticket,
    ...existingTickets,
  ])
);

setSubmitted(true);

setForm({
  name: "",
  email: "",
  orderId: "",
  category: "Order Issue",
  message: "",
});

};

return (
<PageBackground>
<Navbar />

  {/* =========================================
      HERO
  ========================================== */}
  <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 md:pt-12">
    <div className="rounded-[2rem] overflow-hidden border border-white/30 bg-gradient-to-br from-orange-500/95 via-orange-500/90 to-red-500/90 text-white shadow-2xl backdrop-blur-xl">
      <div className="px-5 sm:px-8 md:px-12 py-12 md:py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-bold mb-5">
            🛟 QuickBite Support
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            How can we help you?
          </h1>

          <p className="text-orange-50 text-base md:text-lg mt-5 max-w-2xl leading-7">
            Find answers, solve order problems and get help from
            the QuickBite support team.
          </p>

          <div className="flex flex-wrap gap-3 mt-7">
            <button
              onClick={() => goTo("/orders")}
              className="bg-white text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-xl font-black transition shadow-lg"
            >
              📦 My Orders
            </button>

            <button
              onClick={() => goTo("/track-order")}
              className="bg-white/10 hover:bg-white/20 border border-white/25 px-6 py-3 rounded-xl font-black transition backdrop-blur-sm"
            >
              🚚 Track Order
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-12">

    {/* =========================================
        SUPPORT CATEGORIES
    ========================================== */}
    <section className="mb-12">
      <div className="mb-6 text-white">
        <p className="text-orange-300 text-sm font-black uppercase tracking-wider">
          Quick Help
        </p>

        <h2 className="text-3xl font-black mt-1">
          What do you need help with?
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {supportCategories.map((category) => (
          <button
            key={category.title}
            onClick={() => {
              setForm((previous) => ({
                ...previous,
                category:
                  category.title === "Order Issues"
                    ? "Order Issue"
                    : category.title === "Delivery Help"
                    ? "Delivery Issue"
                    : category.title === "Payment Help"
                    ? "Payment Issue"
                    : "Account Issue",
              }));

              document
                .getElementById("support-form")
                ?.scrollIntoView({
                  behavior: "smooth",
                });
            }}
            className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl p-6 text-left shadow-xl hover:shadow-2xl hover:-translate-y-1 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl mb-5">
              {category.icon}
            </div>

            <h3 className="font-black text-lg text-gray-900">
              {category.title}
            </h3>

            <p className="text-sm text-gray-600 mt-2 leading-6">
              {category.description}
            </p>

            <span className="inline-block text-orange-500 text-sm font-bold mt-4">
              Get help →
            </span>
          </button>
        ))}
      </div>
    </section>

    {/* =========================================
        FAQ + CONTACT
    ========================================== */}
    <section className="grid lg:grid-cols-2 gap-8 mb-12">

      {/* FAQ */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl p-6 md:p-8">
        <div className="mb-6">
          <p className="text-orange-500 text-sm font-black uppercase tracking-wider">
            FAQs
          </p>

          <h2 className="text-2xl md:text-3xl font-black mt-1 text-gray-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;

            return (
              <div
                key={faq.question}
                className="border border-gray-200 rounded-2xl overflow-hidden bg-white/70"
              >
                <button
                  onClick={() =>
                    setOpenFaq(
                      isOpen ? null : index
                    )
                  }
                  className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-orange-50 transition"
                >
                  <span className="font-bold text-gray-900">
                    {faq.question}
                  </span>

                  <span className="text-orange-500 text-xl font-black flex-shrink-0">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-gray-600 leading-6">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTACT CARD */}
      <div className="bg-gray-950/90 backdrop-blur-xl text-white rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
        <p className="text-orange-400 text-sm font-black uppercase tracking-wider">
          Need More Help?
        </p>

        <h2 className="text-2xl md:text-3xl font-black mt-2">
          Contact QuickBite Support
        </h2>

        <p className="text-gray-400 mt-3 leading-6">
          Can't find the answer? Send us your issue and
          we'll keep your support request saved on this device.
        </p>

        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
              📧
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Email Support
              </p>

              <p className="font-bold">
                support@quickbite.com
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
              🕐
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Support Hours
              </p>

              <p className="font-bold">
                9:00 AM – 10:00 PM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
              ⚡
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Response
              </p>

              <p className="font-bold">
                Quick assistance
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            document
              .getElementById("support-form")
              ?.scrollIntoView({
                behavior: "smooth",
              })
          }
          className="w-full mt-8 bg-orange-500 hover:bg-orange-600 py-3.5 rounded-xl font-black transition"
        >
          📝 Create Support Request
        </button>
      </div>
    </section>

    {/* =========================================
        SUPPORT FORM
    ========================================== */}
    <section
      id="support-form"
      className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden mb-12"
    >
      <div className="bg-gradient-to-r from-orange-50/95 to-red-50/95 p-6 md:p-8 border-b border-orange-100">
        <p className="text-orange-500 text-sm font-black uppercase tracking-wider">
          Support Request
        </p>

        <h2 className="text-2xl md:text-3xl font-black mt-1 text-gray-900">
          Tell us what happened
        </h2>

        <p className="text-gray-500 text-sm mt-2">
          Fill in the details below so your issue can be
          identified easily.
        </p>
      </div>

      <div className="p-6 md:p-8">
        {submitted && (
          <div className="mb-6 rounded-2xl bg-green-50 border border-green-200 p-5">
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                ✅
              </div>

              <div>
                <p className="font-black text-green-800">
                  Support request created successfully!
                </p>

                <p className="text-sm text-green-700 mt-1">
                  Your request has been saved. Please keep
                  your Order ID available if you need further
                  assistance.
                </p>
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-2 gap-5"
        >
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Your Name *
            </label>

            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                handleChange(
                  "name",
                  event.target.value
                )
              }
              placeholder="Enter your name"
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Email *
            </label>

            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                handleChange(
                  "email",
                  event.target.value
                )
              }
              placeholder="you@example.com"
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Order ID
            </label>

            <input
              type="text"
              value={form.orderId}
              onChange={(event) =>
                handleChange(
                  "orderId",
                  event.target.value
                )
              }
              placeholder="Example: 1024"
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Issue Category *
            </label>

            <select
              value={form.category}
              onChange={(event) =>
                handleChange(
                  "category",
                  event.target.value
                )
              }
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="Order Issue">
                Order Issue
              </option>

              <option value="Delivery Issue">
                Delivery Issue
              </option>

              <option value="Payment Issue">
                Payment Issue
              </option>

              <option value="Account Issue">
                Account Issue
              </option>

              <option value="Restaurant Issue">
                Restaurant Issue
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Describe Your Issue *
            </label>

            <textarea
              rows="6"
              value={form.message}
              onChange={(event) =>
                handleChange(
                  "message",
                  event.target.value
                )
              }
              placeholder="Tell us what went wrong..."
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-3 outline-none resize-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-black transition shadow-lg"
            >
              📨 Submit Request
            </button>

            <button
              type="button"
              onClick={() => goTo("/orders")}
              className="border border-gray-200 hover:bg-gray-50 px-7 py-3.5 rounded-xl font-bold transition"
            >
              View My Orders
            </button>
          </div>
        </form>
      </div>
    </section>

    {/* =========================================
        QUICK NAVIGATION
    ========================================== */}
    <section className="bg-gradient-to-r from-gray-950/95 to-gray-800/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 text-white border border-white/10 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-orange-400 text-sm font-bold">
            QUICKBITE
          </p>

          <h2 className="text-2xl font-black mt-1">
            Need to check something else?
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => goTo("/")}
            className="bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl font-bold transition"
          >
            Home
          </button>

          <button
            onClick={() => goTo("/restaurants")}
            className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold transition"
          >
            Restaurants
          </button>

          <button
            onClick={() => goTo("/cart")}
            className="bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl font-bold transition"
          >
            Cart
          </button>
        </div>
      </div>
    </section>
  </main>

  {/* =========================================
      FOOTER
  ========================================== */}
  <footer className="bg-gray-950/95 backdrop-blur-xl text-gray-400 px-6 py-10 mt-12 border-t border-white/10">
    <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
      <div>
        <h2 className="text-2xl font-black text-white mb-3">
          QuickBite
        </h2>

        <p className="text-sm leading-6">
          Fast food delivery made simple, delicious and
          convenient.
        </p>
      </div>

      <div>
        <h3 className="text-white font-bold mb-3">
          Quick Links
        </h3>

        <div className="space-y-2 text-sm">
          <button
            onClick={() => goTo("/")}
            className="block hover:text-white"
          >
            Home
          </button>

          <button
            onClick={() => goTo("/restaurants")}
            className="block hover:text-white"
          >
            Restaurants
          </button>

          <button
            onClick={() => goTo("/menu")}
            className="block hover:text-white"
          >
            Menu
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-white font-bold mb-3">
          Orders
        </h3>

        <div className="space-y-2 text-sm">
          <button
            onClick={() => goTo("/orders")}
            className="block hover:text-white"
          >
            My Orders
          </button>

          <button
            onClick={() => goTo("/track-order")}
            className="block hover:text-white"
          >
            Track Order
          </button>

          <button
            onClick={() => goTo("/cart")}
            className="block hover:text-white"
          >
            Cart
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-white font-bold mb-3">
          Support
        </h3>

        <p className="text-sm">
          Need help with your order?
        </p>

        <p className="text-sm mt-2">
          support@quickbite.com
        </p>
      </div>
    </div>

    <div className="max-w-6xl mx-auto border-t border-gray-800 mt-8 pt-6 text-sm text-center">
      © 2026 QuickBite. All rights reserved.
    </div>
  </footer>
</PageBackground>

);
}

export default Support;