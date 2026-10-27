import React from "react";
import Navbar from "../components/Navbar.jsx";

/** Shared layout that wraps all authenticated pages */
const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
