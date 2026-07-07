import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ProfileModal.css";

function ProfileModal({ user, onClose, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState("profile"); // profile or orders
  
  // Profile settings state
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Order history state
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setContact(user.contact || "");
      setAddress(user.address || "");
    }
  }, [user]);

  // Fetch orders when tab is toggled to orders (with 5-second polling sync)
  useEffect(() => {
    let interval;
    if (activeTab === "orders" && user?.username) {
      fetchUserOrders();
      interval = setInterval(() => {
        const pollUserOrders = async () => {
          try {
            const response = await axios.get(`https://smart-water-distribution-5.onrender.com/orders/user/${user.username}`);
            setOrders(response.data);
          } catch (err) {
            console.error("Error polling orders:", err);
          }
        };
        pollUserOrders();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const fetchUserOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await axios.get(`https://smart-water-distribution-5.onrender.com/orders/user/${user.username}`);
      setOrders(response.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async () => {
    const nameVal = name.trim();
    const contactVal = contact.trim();
    const addressVal = address.trim();

    if (!nameVal || !contactVal || !addressVal) {
      setError("Please fill in all profile details.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.put(`https://smart-water-distribution-5.onrender.com/auth/update-profile/${user.id}`, {
        name: nameVal,
        contact: contactVal,
        address: addressVal
      });

      setSuccess("Profile updated successfully!");
      onUpdateUser(response.data.user);

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update profile. Check server connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="profile-modal-header">
          <h2>Account Details</h2>
          <button type="button" className="btn-close-pm" onClick={onClose}>
            <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="profile-modal-tabs">
          <button 
            type="button" 
            className={`profile-modal-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            My Profile
          </button>
          <button 
            type="button" 
            className={`profile-modal-tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            My Orders
          </button>
        </div>

        {/* Tab Body */}
        <div className="profile-modal-body">
          
          {/* Settings Tab */}
          {activeTab === "profile" && (
            <div className="pm-form-grid">
              {success && (
                <div className="pm-alert-success">
                  <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{success}</span>
                </div>
              )}
              {error && (
                <div className="pm-alert-error">
                  <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Username</label>
                <input type="text" value={user?.username || ""} disabled style={{ background: "#f8fafc", cursor: "not-allowed", borderStyle: "dashed" }} />
              </div>

              <div className="input-group">
                <label className="input-label">Role</label>
                <input type="text" value={user?.role || ""} disabled style={{ background: "#f8fafc", cursor: "not-allowed", borderStyle: "dashed" }} />
              </div>

              <div className="input-group">
                <label className="input-label">{user?.role === "Distributor" ? "Company / Distributor Name" : "Store / Retailer Name"}</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Contact Phone</label>
                <input 
                  type="text" 
                  value={contact} 
                  onChange={(e) => setContact(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Office / Store Address</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleUpdateProfile}
                disabled={isSaving}
                style={{ marginTop: "12px", padding: "12px" }}
              >
                {isSaving ? "Saving Settings..." : "Save Settings"}
              </button>
            </div>
          )}

          {/* Order History Tab */}
          {activeTab === "orders" && (
            <div>
              {isLoadingOrders ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px" }}>
                  <div className="signup-spinner" style={{ width: "24px", height: "24px", borderTopColor: "var(--primary)" }}></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="pm-empty-orders">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>You haven't placed any orders yet.</span>
                </div>
              ) : (
                <div className="pm-orders-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Token</th>
                        <th>Date</th>
                        <th>Ordered Packages</th>
                        <th>Bill Total</th>
                        <th>Live Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td style={{ fontWeight: "700", color: "var(--accent-cyan)" }}>#{order.token}</td>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div style={{ fontSize: "12px" }}>
                              1L: <strong>{order.oneL || 0}</strong> • 
                              500m: <strong>{order.fiveHundredML || 0}</strong> • 
                              200m: <strong>{order.twoHundredML || 0}</strong>
                            </div>
                          </td>
                          <td style={{ fontWeight: "700", color: "var(--success)" }}>₹{order.total}</td>
                          <td>
                            <span className={`badge ${order.status === "Delivered" ? "badge-delivered" : "badge-pending"}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
