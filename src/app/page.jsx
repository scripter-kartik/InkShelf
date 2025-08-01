"use client";

import Navbar from "../components/Navbar";
import Home from "../components/Home";
import Login from "../components/LogIn";
import SignUp from "../components/SignUp";
import { useState } from "react";

export default function Page() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [query, setQuery] = useState("");

  const closeAll = () => {
    setShowLogin(false);
    setShowSignup(false);
  };

  return (
    <div className="relative w-screen h-screen">
      <Navbar
        onLoginClick={() => setShowLogin(true)}
        onSignUpClick={() => setShowSignup(true)}
        query={query}
        setQuery={setQuery}
      />

      <Home />

      {(showLogin || showSignup) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          {showLogin && <Login onClose={closeAll} />}
          {showSignup && <SignUp onClose={closeAll} />}
        </div>
      )}
    </div>
  );
}
