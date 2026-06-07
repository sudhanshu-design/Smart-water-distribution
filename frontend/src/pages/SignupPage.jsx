import React, { useState } from "react";
import axios from "axios";
import "./SignupPage.css";

function SignupPage({ setRole, setUser, setView }) {
  const [role, setSelectedRole] = useState("Distributor"); // Distributor or Retailer
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async () => {
    const userStr = username.trim();
    const passStr = password.trim();
    const nameStr = businessName.trim();
    const contactStr = contact.trim();
    const addressStr = address.trim();

    if (!userStr || !passStr || !confirmPassword || !nameStr || !contactStr || !addressStr) {
      setError("Please fill out all fields.");
      return;
    }

    if (passStr !== confirmPassword.trim()) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post("http://localhost:5000/auth/register", {
        username: userStr,
        password: passStr,
        role,
        name: nameStr,
        contact: contactStr,
        address: addressStr
      });

      setSuccess("Account created successfully! Redirecting to login...");
      
      setTimeout(() => {
        setView("login");
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Please check connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page-container">
      {/* Left Panel - Brand Showcase */}
      <div className="signup-left-panel">
        <div className="signup-water-pattern-overlay"></div>
        
        <div className="signup-brand-header">
          <svg className="signup-brand-logo-icon" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
          </svg>
          <span className="signup-brand-name">AquaFlow WDS</span>
        </div>

        <div className="signup-brand-promo-content">
          <h1>Join Our Water Distribution Network</h1>
          <p>
            Create an account to streamline your supply chain. Order bulk water, 
            track deliveries, manage transaction history, and receive FIFO priority 
            routing on one unified system.
          </p>
        </div>

        <div className="signup-brand-footer">
          <span>v2.0.0 Stable</span>
          <div className="signup-brand-footer-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="signup-right-panel">
        <div className="signup-form-wrapper">
          <div className="signup-form-header">
            <h2>Create Account</h2>
            <p>Register as a distributor, retailer, or driver to get started.</p>
          </div>

          {/* Segmented Control for Roles */}
          <div className="signup-role-segmented-control">
            <button 
              type="button" 
              className={`signup-role-tab ${role === "Distributor" ? "active" : ""}`}
              onClick={() => { setSelectedRole("Distributor"); setError(""); }}
              disabled={isLoading}
            >
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.75a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5h1.5m10.125 15a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.5m-9-3h9.375c.621 0 1.125-.504 1.125-1.125V8.25M12 5.25h5.25A1.5 1.5 0 0118.75 6.75V11.25m-6-6v6m6 0h1.5m-1.5 0h-6.75" />
              </svg>
              Distributor
            </button>
            <button 
              type="button" 
              className={`signup-role-tab ${role === "Retailer" ? "active" : ""}`}
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
              className={`signup-role-tab ${role === "Driver" ? "active" : ""}`}
              onClick={() => { setSelectedRole("Driver"); setError(""); }}
              disabled={isLoading}
            >
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.75a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5h1.5m10.125 15a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.5m-9-3h9.375c.621 0 1.125-.504 1.125-1.125V8.25M12 5.25h5.25A1.5 1.5 0 0118.75 6.75V11.25m-6-6v6m6 0h1.5m-1.5 0h-6.75" />
              </svg>
              Driver
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="signup-error-alert">
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px', flexShrink: 0}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="signup-success-alert">
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px', flexShrink: 0}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="signup-input-group">
            <input
              type="text"
              className="signup-input-field"
              placeholder="Username"
              value={username}
              disabled={isLoading}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
            />
            <svg className="signup-input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>

          <div className="signup-grid-2">
            <div className="signup-input-group">
              <input
                type="password"
                className="signup-input-field"
                placeholder="Password"
                value={password}
                disabled={isLoading}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
              />
              <svg className="signup-input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>

            <div className="signup-input-group">
              <input
                type="password"
                className="signup-input-field"
                placeholder="Confirm Password"
                value={confirmPassword}
                disabled={isLoading}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              />
              <svg className="signup-input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          </div>

          <div className="signup-input-group">
            <input
              type="text"
              className="signup-input-field"
              placeholder={role === "Distributor" ? "Company / Distributor Name" : role === "Retailer" ? "Store / Retailer Name" : role === "Driver" ? "Driver Full Name" : "Admin Name"}
              value={businessName}
              disabled={isLoading}
              onChange={(e) => { setBusinessName(e.target.value); setError(""); }}
            />
            <svg className="signup-input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
            </svg>
          </div>

          <div className="signup-input-group">
            <input
              type="text"
              className="signup-input-field"
              placeholder="Contact Number"
              value={contact}
              disabled={isLoading}
              onChange={(e) => { setContact(e.target.value); setError(""); }}
            />
            <svg className="signup-input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.12-4.098-6.92-6.92l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>

          <div className="signup-input-group">
            <input
              type="text"
              className="signup-input-field"
              placeholder={role === "Driver" ? "Home / Base Address" : "Store / Company Address"}
              value={address}
              disabled={isLoading}
              onChange={(e) => { setAddress(e.target.value); setError(""); }}
            />
            <svg className="signup-input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>

          {/* Submit Button */}
          <button 
            type="button" 
            className="btn-signup-submit" 
            onClick={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="signup-spinner"></div>
                Creating Account...
              </>
            ) : (
              <>
                Register Account
                <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>

          {/* Link to Toggle back to Login */}
          <div className="signup-footer-link">
            Already have an account?
            <a href="#login" onClick={(e) => { e.preventDefault(); setView("login"); }}>Sign In</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
