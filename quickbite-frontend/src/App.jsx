import React from "react";
import "./styles/tailwind.css"; // Tailwind import

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">
        QuickBite Food Delivery
      </h1>
      <p className="text-lg text-gray-700">
        Welcome to QuickBite! 🚀 Your modern food delivery app.
      </p>

      <button className="mt-6 px-6 py-3 bg-green-500 text-white rounded-lg shadow hover:bg-green-600">
        Get Started
      </button>
    </div>
  );
}

export default App;
