import React, { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OrderPage from "./pages/OrderPage";
import AdminPage from "./pages/AdminPage";
import RetailerPage from "./pages/RetailerPage";
import DriverPage from "./pages/DriverPage";
import "./App.css";

function App() {
  const [role, setRole] = useState("");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login"); // "login" or "signup"

  // Check for active session on load
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setRole(parsedUser.role);
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (!newRole) {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  return (
    <div>
      {!role ? (
        view === "login" ? (
          <LoginPage setRole={handleRoleChange} setUser={setUser} setView={setView} />
        ) : (
          <SignupPage setRole={handleRoleChange} setUser={setUser} setView={setView} />
        )
      ) : role === "Distributor" ? (
        <OrderPage setRole={handleRoleChange} user={user} onUpdateUser={handleUpdateUser} />
      ) : role === "Retailer" ? (
        <RetailerPage setRole={handleRoleChange} user={user} onUpdateUser={handleUpdateUser} />
      ) : role === "Admin" ? (
        <AdminPage setRole={handleRoleChange} user={user} />
      ) : role === "Driver" ? (
        <DriverPage setRole={handleRoleChange} user={user} />
      ) : (
        <LoginPage setRole={handleRoleChange} setUser={setUser} setView={setView} />
      )}
    </div>
  );
}

export default App;