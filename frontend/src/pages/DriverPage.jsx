import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import "./DriverPage.css";

const HQ_COORDS = [12.9715987, 77.5945627];

const createCustomMarker = (color) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const vehicleIcon = L.divIcon({
  className: "vehicle-div-icon",
  html: `<div style="background-color: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 14px;">🚚</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const hqIcon = L.divIcon({
  className: "hq-div-icon",
  html: `<div style="background-color: #0f172a; color: white; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 14px;">🏢</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

function DriverPage({ setRole, user }) {
  const driverId = user?.id || user?._id;
  const [orders, setOrders] = useState([]);
  const [driverStatus, setDriverStatus] = useState(null);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapMarkersRef = useRef([]);
  const mapPolylineRef = useRef(null);

  // Poll orders & driver simulation status
  useEffect(() => {
    if (!driverId) return;

    const fetchData = async () => {
      try {
        // Fetch all orders
        const ordersRes = await axios.get("http://localhost:5000/orders/fifo");
        // Filter by assigned driver
        const assigned = ordersRes.data.filter(
          o => o.assignedDriverId === driverId
        );
        setOrders(assigned);

        // Fetch driver simulation status
        const statusRes = await axios.get(`http://localhost:5000/orders/driver/status/${driverId}`);
        setDriverStatus(statusRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Unable to sync server data. Please try again.");
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 3000);

    return () => clearInterval(intervalId);
  }, [driverId]);

  // Leaflet map effect
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView(HQ_COORDS, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    mapMarkersRef.current.forEach(m => map.removeLayer(m));
    mapMarkersRef.current = [];

    // Clear old polyline
    if (mapPolylineRef.current) {
      map.removeLayer(mapPolylineRef.current);
      mapPolylineRef.current = null;
    }

    // Add HQ marker
    const hqMarker = L.marker(HQ_COORDS, { icon: hqIcon })
      .bindPopup("🏢 <strong>Warehouse HQ (Start/End)</strong>")
      .addTo(map);
    mapMarkersRef.current.push(hqMarker);

    // Plot assigned orders
    orders.forEach((order, idx) => {
      if (order.latitude && order.longitude && order.latitude !== 0 && order.longitude !== 0) {
        const clientName = order.clientType === "Retailer" ? order.retailerName : order.distributorName;
        
        let markerColor = "#64748b"; // grey fallback
        if (order.status === "Delivered") {
          markerColor = "#15803d"; // green
        } else if (order.status === "Arrived") {
          markerColor = "#b45309"; // amber
        } else {
          markerColor = order.clientType === "Retailer" ? "#06b6d4" : "#1e3a8a"; // cyan or navy
        }

        const marker = L.marker([order.latitude, order.longitude], {
          icon: createCustomMarker(markerColor)
        })
          .bindPopup(`
            <div style="font-family: var(--font-sans); font-size: 13px;">
              <strong>Stop ${idx + 1}: ${clientName}</strong><br/>
              Token: <strong>#${order.token}</strong><br/>
              Status: <strong>${order.status}</strong><br/>
              Address: ${order.location || order.address}<br/>
              Items: 1L: ${order.oneL} | 500m: ${order.fiveHundredML} | 200m: ${order.twoHundredML}
            </div>
          `)
          .addTo(map);
        mapMarkersRef.current.push(marker);
      }
    });

    // Draw active simulation route and vehicle
    if (driverStatus && driverStatus.isActive) {
      if (driverStatus.routePoints && driverStatus.routePoints.length > 0) {
        const polyline = L.polyline(driverStatus.routePoints, { color: "#3b82f6", weight: 4, opacity: 0.8 }).addTo(map);
        mapPolylineRef.current = polyline;
      }

      if (driverStatus.currentLatitude && driverStatus.currentLongitude) {
        const vehicleMarker = L.marker([driverStatus.currentLatitude, driverStatus.currentLongitude], {
          icon: vehicleIcon
        })
          .bindPopup("🚚 <strong>Your Vehicle Position (Simulated)</strong>")
          .addTo(map);
        mapMarkersRef.current.push(vehicleMarker);
      }
    }

    // Zoom/Fit map bounds to fit HQ and all active stops
    const allCoords = [HQ_COORDS];
    orders.forEach(o => {
      if (o.latitude && o.longitude && o.latitude !== 0 && o.longitude !== 0) {
        allCoords.push([o.latitude, o.longitude]);
      }
    });
    if (driverStatus && driverStatus.isActive && driverStatus.currentLatitude && driverStatus.currentLongitude) {
      allCoords.push([driverStatus.currentLatitude, driverStatus.currentLongitude]);
    }

    if (allCoords.length > 1) {
      map.fitBounds(allCoords, { padding: [50, 50] });
    }
  }, [orders, driverStatus]);

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleStartSimulation = async () => {
    setIsUpdating(true);
    setError("");
    try {
      // First, set all assigned orders to "Out for Delivery" status so customer sees progress
      const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "Driver Assigned");
      for (const order of pendingOrders) {
        await axios.put(`http://localhost:5000/orders/status/${order._id}`, { status: "Out for Delivery" });
      }

      // Start simulation
      await axios.post("http://localhost:5000/orders/driver/start", { driverId });
      
      // Refresh status
      const statusRes = await axios.get(`http://localhost:5000/orders/driver/status/${driverId}`);
      setDriverStatus(statusRes.data);

      const ordersRes = await axios.get("http://localhost:5000/orders/fifo");
      setOrders(ordersRes.data.filter(o => o.assignedDriverId === driverId));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to start simulation run.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStopSimulation = async () => {
    setIsUpdating(true);
    setError("");
    try {
      await axios.post("http://localhost:5000/orders/driver/stop", { driverId });
      
      const statusRes = await axios.get(`http://localhost:5000/orders/driver/status/${driverId}`);
      setDriverStatus(statusRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to stop simulation.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setIsUpdating(true);
    setError("");
    try {
      await axios.put(`http://localhost:5000/orders/status/${orderId}`, { status: newStatus });
      
      // Refresh orders
      const ordersRes = await axios.get("http://localhost:5000/orders/fifo");
      setOrders(ordersRes.data.filter(o => o.assignedDriverId === driverId));
    } catch (err) {
      console.error(err);
      setError("Failed to update stop status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    setRole("");
  };

  // If driver is not approved
  if (user && user.isApproved === false) {
    return (
      <div className="driver-portal-container" style={{ justifyContent: "center", alignItems: "center", padding: "40px" }}>
        <div className="driver-controls-card" style={{ maxWidth: "450px", textAlign: "center" }}>
          <div style={{ fontSize: "50px", marginBottom: "16px" }}>⏳</div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-dark)", marginBottom: "8px" }}>Approval Pending</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
            Hello, <strong>{user.name || user.username}</strong>. Your driver registration has been submitted successfully but requires Admin activation.
          </p>
          <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
            Role: <strong>Delivery Driver</strong><br/>
            Username: <strong>{user.username}</strong>
          </div>
          <button type="button" className="btn-driver-logout" onClick={handleLogout} style={{ width: "100%" }}>
            Go Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Count active delivery metrics
  const pendingCount = orders.filter(o => o.status !== "Delivered").length;
  const deliveredCount = orders.filter(o => o.status === "Delivered").length;
  const totalLiters = orders.reduce((sum, o) => sum + (o.oneL * 12 + o.fiveHundredML * 12 + o.twoHundredML * 9.6), 0);

  return (
    <div className="driver-portal-container">
      {/* Header */}
      <header className="driver-portal-header">
        <div className="driver-portal-brand">
          <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
          </svg>
          <h1>AquaFlow Driver Portal</h1>
        </div>

        <div className="driver-user-info">
          <span className="driver-badge">👤 {user?.name || user?.username} (Driver)</span>
          <button type="button" className="btn-driver-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="driver-portal-main">
        {/* Left Side: Map Tracking */}
        <section className="driver-map-panel">
          <div className="driver-map-card">
            <h2 className="driver-card-title">🗺 Live Navigation Map</h2>
            
            <div className="driver-map-wrapper">
              <div ref={mapContainerRef} className="driver-map-container"></div>
            </div>

            {/* Trip Metrics */}
            <div className="driver-trip-summary-bar">
              <div className="trip-metric-item">
                <span className="trip-metric-label">Stops Remaining</span>
                <span className="trip-metric-value">{pendingCount}</span>
              </div>
              <div className="trip-metric-item">
                <span className="trip-metric-label">Delivered Stops</span>
                <span className="trip-metric-value">{deliveredCount}</span>
              </div>
              <div className="trip-metric-item">
                <span className="trip-metric-label">Total Volume</span>
                <span className="trip-metric-value">{totalLiters.toFixed(1)} L</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Controls and Stops list */}
        <section className="driver-controls-panel">
          <div className="driver-controls-card">
            <h2 className="driver-card-title">🎮 Delivery Control Panel</h2>

            {error && (
              <div className="login-error-alert" style={{ margin: 0 }}>
                <span>{error}</span>
              </div>
            )}

            <div className="driver-action-container">
              {orders.length > 0 && !driverStatus?.isActive && (
                <button
                  type="button"
                  className="btn-start-run"
                  onClick={handleStartSimulation}
                  disabled={isUpdating || pendingCount === 0}
                >
                  ▶ Start Route Dispatch
                </button>
              )}

              {driverStatus?.isActive && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ backgroundColor: "rgba(59, 130, 246, 0.06)", border: "1px solid rgba(59, 130, 246, 0.15)", borderRadius: "8px", padding: "12px", fontSize: "13px" }}>
                    <strong>🚚 Transit Tracker:</strong> Route simulation active.<br />
                    ETA: <strong>{driverStatus.etaMinutes} minutes</strong>
                  </div>
                  <button
                    type="button"
                    className="btn-stop-run"
                    onClick={handleStopSimulation}
                    disabled={isUpdating}
                  >
                    ⏹ Pause / Reset Route
                  </button>
                </div>
              )}

              {orders.length === 0 && (
                <div className="driver-empty-queue">
                  <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <h3>No Assigned Orders</h3>
                  <p style={{ fontSize: "13px", margin: 0 }}>You don't have any deliveries assigned currently. Contact the dispatcher admin.</p>
                </div>
              )}
            </div>
          </div>

          {orders.length > 0 && (
            <div className="driver-controls-card">
              <h2 className="driver-card-title">📋 Scheduled Stop Sequence</h2>
              
              <div className="stops-list-container">
                {orders.map((order, idx) => {
                  const clientName = order.clientType === "Retailer" ? order.retailerName : order.distributorName;
                  const isCurrent = driverStatus?.isActive && driverStatus.stopOrders[driverStatus.currentStopIndex] === order._id;
                  
                  // Check status class
                  let statusClass = "pending";
                  let statusBadgeText = order.status;
                  if (order.status === "Delivered") {
                    statusClass = "completed";
                    statusBadgeText = "Delivered";
                  } else if (order.status === "Arrived") {
                    statusClass = "arrived";
                    statusBadgeText = "Arrived";
                  } else if (order.status === "Out for Delivery") {
                    statusClass = "active";
                    statusBadgeText = "In Transit";
                  } else if (order.status === "Driver Assigned") {
                    statusClass = "pending";
                    statusBadgeText = "Assigned";
                  }

                  return (
                    <div key={order._id} className={`stop-card-item ${isCurrent ? "active" : ""} ${order.status === "Delivered" ? "completed" : ""}`}>
                      <div className="stop-card-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span className="stop-card-number">{idx + 1}</span>
                          <span className="stop-card-title">{clientName}</span>
                        </div>
                        <span className={`stop-card-badge stop-badge-${statusClass}`}>
                          {statusBadgeText}
                        </span>
                      </div>

                      <div className="stop-card-details">
                        <span>📞 {order.contact}</span>
                        <span>📍 {order.location || order.address}</span>
                        
                        <div className="stop-card-items-mix">
                          <span>1L: {order.oneL}</span>
                          <span>500ml: {order.fiveHundredML}</span>
                          <span>200ml: {order.twoHundredML}</span>
                        </div>
                      </div>

                      {/* Action buttons for manual milestone advance */}
                      {order.status !== "Delivered" && (
                        <div className="stop-card-actions">
                          {order.status !== "Arrived" ? (
                            <button
                              type="button"
                              className="btn-milestone-arrived"
                              onClick={() => handleUpdateStatus(order._id, "Arrived")}
                              disabled={isUpdating}
                            >
                              Arrived at Stop
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-milestone-deliver"
                              onClick={() => handleUpdateStatus(order._id, "Delivered")}
                              disabled={isUpdating}
                            >
                              Confirm Delivery
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default DriverPage;
