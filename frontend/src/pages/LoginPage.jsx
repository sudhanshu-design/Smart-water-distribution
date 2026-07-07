import React, { useState } from "react";
import axios from "axios";
import "./LoginPage.css";

function LoginPage({ setRole, setUser, setView }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setSelectedRole] = useState("Distributor");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    const userVal = username.trim();
    const passVal = password.trim();

    if (!userVal || !passVal) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("https://smart-water-distribution-5.onrender.com/auth/login", {
        username: userVal,
        password: passVal,
        role
      });

      // Store credentials in local storage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setUser(response.data.user);
      setRole(response.data.user.role);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid credentials or Server error.");
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Left Panel - Brand Showcase */}
      <div className="login-left-panel">
        <div className="water-pattern-overlay"></div>
        
        <div className="brand-header">
          <svg className="brand-logo-icon" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
          </svg>
          <span className="brand-name">AquaFlow WDS</span>
        </div>

        <div className="brand-promo-content">
          <h1>Smart Water Distribution System</h1>
          <p>
            An enterprise-grade supply chain solution coordinating distributors, 
            retailers, and warehouse operations. Monitor demand, optimize logistics, 
            and track deliveries in real-time.
          </p>
        </div>

        <div className="brand-footer">
          <span>v2.0.0 Stable</span>
          <div className="brand-footer-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Portal */}
      <div className="login-right-panel">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2>Portal Login</h2>
            <p>Welcome back! Please enter your details below.</p>
          </div>

          {/* Segmented Control for Roles */}
          <div className="role-segmented-control">
            <button 
              type="button" 
              className={`role-tab ${role === "Distributor" ? "active" : ""}`}
              onClick={() => { setSelectedRole("Distributor"); setError(""); }}
              disabled={isLoading}
            >
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.75A1.5 1.5 0 012.25 17.25V5.25A1.5 1.5 0 013.75 3.75h1.5m10.125 15a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.5m-9-3h9.375c.621 0 1.125-.504 1.125-1.125V8.25M12 5.25h5.25A1.5 1.5 0 0118.75 6.75V11.25m-6-6v6m6 0h1.5m-1.5 0h-6.75" />
              </svg>
              Distributor
            </button>
            <button 
              type="button" 
              className={`role-tab ${role === "Retailer" ? "active" : ""}`}
              onClick={() => { setSelectedRole("Retailer"); setError(""); }}
              disabled={isLoading}
            >
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
              </svg>
              Retailer
            </button>
            <button 
              type="button" 
              className={`role-tab ${role === "Admin" ? "active" : ""}`}
              onClick={() => { setSelectedRole("Admin"); setError(""); }}
              disabled={isLoading}
            >
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Admin
            </button>
            <button 
              type="button" 
              className={`role-tab ${role === "Driver" ? "active" : ""}`}
              onClick={() => { setSelectedRole("Driver"); setError(""); }}
              disabled={isLoading}
            >
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.75A1.5 1.5 0 012.25 17.25V5.25A1.5 1.5 0 013.75 3.75h1.5m10.125 15a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.5m-9-3h9.375c.621 0 1.125-.504 1.125-1.125V8.25M12 5.25h5.25A1.5 1.5 0 0118.75 6.75V11.25m-6-6v6m6 0h1.5m-1.5 0h-6.75" />
              </svg>
              Driver
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="login-error-alert">
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px', flexShrink: 0}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Username Input */}
          <div className="login-input-group">
            <input
              type="text"
              className="login-input-field"
              placeholder="Username"
              value={username}
              disabled={isLoading}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
            <svg className="login-input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>

          {/* Password Input */}
          <div className="login-input-group">
            <input
              type="password"
              className="login-input-field"
              placeholder="Password"
              value={password}
              disabled={isLoading}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
            <svg className="login-input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>

          {/* Helper Options */}
          <div className="login-helper-row">
            <label className="remember-me">
              <input type="checkbox" disabled={isLoading} />
              Remember me
            </label>
            <a href="#forgot" className="forgot-password" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
          </div>

          {/* Submit Button */}
          <button 
            type="button" 
            className="btn-login-submit" 
            onClick={login}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="login-spinner"></div>
                Authenticating...
              </>
            ) : (
              <>
                Sign In
                <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>

          {/* Link to Toggle to Signup */}
          <p className="text-center mt-4" style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "24px" }}>
            Don't have an account?
            <a href="#signup" onClick={(e) => { e.preventDefault(); setView("signup"); }} style={{ color: "var(--accent-cyan)", fontWeight: "700", marginLeft: "4px", textDecoration: "none" }}>Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;