import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ProfileModal from "./ProfileModal";
import L from "leaflet";

const customerIcon = L.divIcon({
  className: "customer-div-icon",
  html: `<div style="background-color: #ef4444; color: white; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 12px;">📍</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

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

function OrderPage({ setRole, user, onUpdateUser }) {
  const [data, setData] = useState({
    houseNo: "",
    streetNo: "",
    building: "",
    area: "",
    landmark: "",
    district: "",
    latitude: "",
    longitude: "",
    location: "",
    deliveryDate: "",
    deliveryTime: ""
  });

  const [quantities, setQuantities] = useState({
    "1L": 1,
    "500ml": 1,
    "200ml": 1
  });

  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [prices, setPrices] = useState({
    distributorOneLPrice: 90,
    distributorFiveHundredMLPrice: 105,
    distributorTwoHundredMLPrice: 160,
    oneLImage: "",
    fiveHundredMLImage: "",
    twoHundredMLImage: ""
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [driverStatus, setDriverStatus] = useState(null);
  const customerMapRef = useRef(null);
  const customerMapInstanceRef = useRef(null);
  const customerMapMarkersRef = useRef([]);
  const customerMapPolylineRef = useRef(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get("https://smart-water-distribution-5.onrender.com/orders/prices");
        if (response.data) {
          setPrices(prev => ({
            ...prev,
            distributorOneLPrice: response.data.distributorOneLPrice ?? prev.distributorOneLPrice,
            distributorFiveHundredMLPrice: response.data.distributorFiveHundredMLPrice ?? prev.distributorFiveHundredMLPrice,
            distributorTwoHundredMLPrice: response.data.distributorTwoHundredMLPrice ?? prev.distributorTwoHundredMLPrice,
            oneLImage: response.data.oneLImage ?? prev.oneLImage,
            fiveHundredMLImage: response.data.fiveHundredMLImage ?? prev.fiveHundredMLImage,
            twoHundredMLImage: response.data.twoHundredMLImage ?? prev.twoHundredMLImage
          }));
        }
      } catch (err) {
        console.error("Error fetching prices:", err);
      }
    };
    fetchPrices();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchUserOrders = async () => {
      try {
        const response = await axios.get(`https://smart-water-distribution-5.onrender.com/orders/user/${user.username}`);
        setUserOrders(response.data);
      } catch (err) {
        console.error("Error fetching user orders:", err);
      }
    };

    fetchUserOrders();
    const ordersInterval = setInterval(fetchUserOrders, 4000);

    return () => {
      clearInterval(ordersInterval);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const activeOrder = userOrders.find(o => o.status !== "Delivered");
    if (!activeOrder || !activeOrder.assignedDriverId) {
      setDriverStatus(null);
      return;
    }

    const fetchDriverStatus = async () => {
      try {
        const response = await axios.get(`https://smart-water-distribution-5.onrender.com/orders/driver/status?driverId=${activeOrder.assignedDriverId}`);
        setDriverStatus(response.data);
      } catch (err) {
        console.error("Error fetching driver status:", err);
      }
    };

    fetchDriverStatus();
    const driverInterval = setInterval(fetchDriverStatus, 3000);

    return () => {
      clearInterval(driverInterval);
    };
  }, [user, userOrders]);

  const pendingOrder = userOrders.find(o => o.status !== "Delivered");
  const isBeingTracked = pendingOrder && pendingOrder.latitude && pendingOrder.longitude && 
                         driverStatus && driverStatus.isActive && driverStatus.stopOrders.includes(pendingOrder._id);

  useEffect(() => {
    if (!isBeingTracked) {
      if (customerMapInstanceRef.current) {
        customerMapInstanceRef.current.remove();
        customerMapInstanceRef.current = null;
      }
      return;
    }

    if (!customerMapRef.current) return;

    const HQ_COORDS = [12.9715987, 77.5945627];
    const customerCoords = [pendingOrder.latitude, pendingOrder.longitude];
    const driverCoords = [driverStatus.currentLatitude, driverStatus.currentLongitude];

    if (!customerMapInstanceRef.current) {
      customerMapInstanceRef.current = L.map(customerMapRef.current).setView(driverCoords, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(customerMapInstanceRef.current);
    }

    const map = customerMapInstanceRef.current;

    // Clear old markers
    customerMapMarkersRef.current.forEach(m => map.removeLayer(m));
    customerMapMarkersRef.current = [];

    // Clear old polyline
    if (customerMapPolylineRef.current) {
      map.removeLayer(customerMapPolylineRef.current);
      customerMapPolylineRef.current = null;
    }

    // Add HQ marker
    const hqMarker = L.marker(HQ_COORDS, { icon: hqIcon })
      .bindPopup("🏢 <strong>Warehouse HQ</strong>")
      .addTo(map);
    customerMapMarkersRef.current.push(hqMarker);

    // Add Customer marker
    const custMarker = L.marker(customerCoords, { icon: customerIcon })
      .bindPopup("📍 <strong>Your Delivery Location</strong>")
      .addTo(map);
    customerMapMarkersRef.current.push(custMarker);

    // Add Vehicle marker
    const vehMarker = L.marker(driverCoords, { icon: vehicleIcon })
      .bindPopup(`🚚 <strong>Delivery Truck</strong><br/>ETA: ${driverStatus.etaMinutes} mins`)
      .addTo(map);
    customerMapMarkersRef.current.push(vehMarker);

    // Draw polyline
    if (driverStatus.routePoints && driverStatus.routePoints.length > 0) {
      const polyline = L.polyline(driverStatus.routePoints, { color: "#3b82f6", weight: 4, opacity: 0.7 }).addTo(map);
      customerMapPolylineRef.current = polyline;
    }

    // Adjust bounds
    const bounds = L.latLngBounds([HQ_COORDS, customerCoords, driverCoords]);
    map.fitBounds(bounds, { padding: [40, 40] });

  }, [isBeingTracked, pendingOrder, driverStatus]);

  const getStepStatus = (stepIndex, order) => {
    if (!order) return { completed: false, active: false };
    const statusLevels = {
      "Pending": 0,
      "Driver Assigned": 1,
      "Out for Delivery": 2,
      "Arrived": 3,
      "Delivered": 4
    };
    const currentLevel = statusLevels[order.status] ?? 0;
    return {
      completed: currentLevel >= stepIndex,
      active: currentLevel === stepIndex
    };
  };

  const getTimelineProgressWidth = (order) => {
    if (!order) return 0;
    if (order.status === "Pending") return 0;
    if (order.status === "Driver Assigned") return 25;
    if (order.status === "Out for Delivery") return 50;
    if (order.status === "Arrived") return 75;
    if (order.status === "Delivered") return 100;
    return 0;
  };

  const bottleData = {
    "1L": { price: prices.distributorOneLPrice, pieces: 12, name: "1 Litre Packs", desc: "12 bottles per box" },
    "500ml": { price: prices.distributorFiveHundredMLPrice, pieces: 24, name: "500ml Packs", desc: "24 bottles per box" },
    "200ml": { price: prices.distributorTwoHundredMLPrice, pieces: 48, name: "200ml Packs", desc: "48 bottles per box" }
  };

  const handleCatalogAdd = (bottleType) => {
    const qty = quantities[bottleType];
    if (qty <= 0) return;

    const existing = cart.find(item => item.bottleType === bottleType);
    if (existing) {
      setCart(
        cart.map(item =>
          item.bottleType === bottleType
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          bottleType,
          quantity: qty,
          price: bottleData[bottleType].price
        }
      ]);
    }

    setQuantities(prev => ({ ...prev, [bottleType]: 1 }));
  };

  const increaseQty = (type) => {
    setCart(
      cart.map(item =>
        item.bottleType === type ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQty = (type) => {
    setCart(
      cart.map(item =>
        item.bottleType === type
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const updateQty = (type, val) => {
    setCart(
      cart.map(item =>
        item.bottleType === type
          ? { ...item, quantity: Math.max(1, Number(val) || 1) }
          : item
      )
    );
  };

  const removeItem = (type) => {
    setCart(cart.filter(item => item.bottleType !== type));
  };

  const grandTotal = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("GPS Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
      },
      () => {
        alert("GPS Permission Denied. Please enable location permissions.");
      }
    );
  };

  const submitOrder = async () => {
    if (!user || !user.name || !user.contact || !user.address) {
      alert("Please complete your profile details first by clicking your avatar in the top right.");
      setShowProfileModal(true);
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty. Please add water bottle packages first.");
      return;
    }

    if (!data.deliveryDate || !data.deliveryTime) {
      alert("Please specify the delivery date and time.");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullLocation = data.location || 
        [data.houseNo, data.streetNo, data.building, data.area, data.landmark, data.district]
          .filter(Boolean)
          .join(", ");

      await axios.post("https://smart-water-distribution-5.onrender.com/orders/create", {
        clientType: "Distributor",
        username: user.username,
        distributorName: user.name,
        contact: user.contact,
        address: user.address,
        latitude: data.latitude,
        longitude: data.longitude,
        location: fullLocation || "Shared Coordinates Only",
        deliveryDate: data.deliveryDate,
        deliveryTime: data.deliveryTime,
        oneL: cart.find(x => x.bottleType === "1L")?.quantity || 0,
        fiveHundredML: cart.find(x => x.bottleType === "500ml")?.quantity || 0,
        twoHundredML: cart.find(x => x.bottleType === "200ml")?.quantity || 0,
        total: grandTotal
      });

      alert("Success! Your order has been placed in the FIFO queue.");
      setCart([]);
      setData(prev => ({
        ...prev,
        deliveryDate: "",
        deliveryTime: "",
        latitude: "",
        longitude: "",
        houseNo: "",
        streetNo: "",
        building: "",
        area: "",
        landmark: "",
        district: ""
      }));
    } catch (error) {
      console.error(error);
      alert("Failed to submit order. Please check the backend connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "DS";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="app-container">
      {/* Floating Navigation Bar */}
      <nav className="navbar">
        <div className="logo-section">
          <svg className="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
          </svg>
          <span className="logo-text">AquaFlow WDS</span>
        </div>
        <div className="user-profile-badge">
          <span className="badge badge-role">Distributor Portal</span>
          <div 
            className="avatar-initials" 
            title={user?.name || user?.username}
            style={{ cursor: "pointer" }}
            onClick={() => setShowProfileModal(true)}
          >
            {getInitials(user?.name || user?.username)}
          </div>
          <button 
            type="button" 
            className="logout-icon-btn" 
            onClick={() => setRole("")} 
            title="Log Out"
          >
            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Dynamic Order Tracker Widget with Timeline */}
      {userOrders.length > 0 && (() => {
        const order = userOrders[0];
        const isDispatched = driverStatus && driverStatus.isActive && driverStatus.stopOrders.includes(order._id);
        const orderIndexInRoute = isDispatched ? driverStatus.stopOrders.indexOf(order._id) : -1;
        
        const step0 = getStepStatus(0, order);
        const step1 = getStepStatus(1, order);
        const step2 = getStepStatus(2, order);
        const step3 = getStepStatus(3, order);
        const step4 = getStepStatus(4, order);
        
        const progressWidth = getTimelineProgressWidth(order);

        return (
          <div className="admin-card" style={{ marginBottom: "24px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1.5px solid #f1f5f9", paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-dark)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📦</span> Latest Order Lifecycle Progress
              </h3>
              <span className={`badge ${order.status === "Delivered" ? "badge-delivered" : "badge-pending"}`} style={{ padding: "6px 12px", fontSize: "12px", fontWeight: "700" }}>
                Order #{order.token} • {order.status}
              </span>
            </div>

            {/* Stepper Progress bar */}
            <div className="timeline-container">
              <div className="timeline-line">
                <div className="timeline-line-progress" style={{ width: `${progressWidth}%` }}></div>
              </div>

              <div className={`timeline-step ${step0.completed ? "completed" : ""} ${step0.active ? "active" : ""}`}>
                <div className="timeline-icon">📝</div>
                <div className="timeline-label">Order Placed</div>
                <div className="timeline-desc">Added to queue</div>
              </div>

              <div className={`timeline-step ${step1.completed ? "completed" : ""} ${step1.active ? "active" : ""}`}>
                <div className="timeline-icon">👤</div>
                <div className="timeline-label">Driver Assigned</div>
                <div className="timeline-desc">{order.assignedDriverName ? `Driver: ${order.assignedDriverName}` : "Awaiting assignment"}</div>
              </div>

              <div className={`timeline-step ${step2.completed ? "completed" : ""} ${step2.active ? "active" : ""}`}>
                <div className="timeline-icon">🚚</div>
                <div className="timeline-label">Out for Delivery</div>
                <div className="timeline-desc">Real-time transit</div>
              </div>

              <div className={`timeline-step ${step3.completed ? "completed" : ""} ${step3.active ? "active" : ""}`}>
                <div className="timeline-icon">📍</div>
                <div className="timeline-label">Arrived</div>
                <div className="timeline-desc">At stop location</div>
              </div>

              <div className={`timeline-step ${step4.completed ? "completed" : ""} ${step4.active ? "active" : ""}`}>
                <div className="timeline-icon">✓</div>
                <div className="timeline-label">Delivered</div>
                <div className="timeline-desc">Receipt issued</div>
              </div>
            </div>

            {/* Subsections based on current stage */}
            {isBeingTracked && (
              <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", borderTop: "1.5px solid #f1f5f9", paddingTop: "20px" }}>
                <div ref={customerMapRef} className="leaflet-container" style={{ height: "350px" }}></div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px", background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "700" }}>Estimated Arrival</span>
                    <strong style={{ fontSize: "28px", color: "var(--primary)" }}>{driverStatus.etaMinutes} mins</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "700" }}>Simulated Driver Stop</span>
                    <strong style={{ fontSize: "15px", color: "var(--text-dark)", display: "block", marginTop: "4px" }}>
                      Stop #{orderIndexInRoute + 1} on route sequence
                    </strong>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {driverStatus.currentStopIndex === orderIndexInRoute 
                        ? "🚚 Driver is headed directly to you now!" 
                        : `Currently delivering stop #${driverStatus.currentStopIndex + 1}`}
                    </span>
                  </div>
                  <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "12px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "700" }}>Shipping Target</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>{order.location || order.address}</span>
                  </div>
                </div>
              </div>
            )}

            {order.status === "Delivered" && (
              <div style={{ marginTop: "24px", background: "rgba(22, 163, 74, 0.05)", border: "1px solid rgba(22, 163, 74, 0.15)", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1.5px solid #f1f5f9", paddingTop: "20px" }}>
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: "800", color: "var(--success)", margin: "0 0 4px 0" }}>✓ Order Successfully Delivered</h4>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                    Receipt No: {order.receiptNo || `RC${1000 + order.token}`} • Total: ₹{order.total.toLocaleString("en-IN")}
                  </p>
                </div>
                <button 
                  type="button" 
                  className="btn-success" 
                  style={{ width: "auto", padding: "10px 20px" }}
                  onClick={() => setSelectedOrder(order)}
                >
                  📄 View Invoice Receipt
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Main Grid View */}
      <div className="grid-2">
        
        {/* Left Column: Delivery Details & Target */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Card: Delivery Target & GPS Linkage */}
          <div className="card-section">
            <h3 className="form-title">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Delivery Target & Location Details
            </h3>

            {/* GPS Linker */}
            <div style={{ marginBottom: "20px" }}>
              {data.latitude && data.longitude ? (
                <div style={{ background: "rgba(21, 128, 61, 0.08)", border: "1.5px solid var(--success)", borderRadius: "var(--radius-md)", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>GPS Link Status</span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--success)" }}>Coordinates Linked ({Number(data.latitude).toFixed(4)}, {Number(data.longitude).toFixed(4)})</span>
                  </div>
                  <button type="button" className="btn-secondary" style={{ width: "auto", padding: "6px 12px", fontSize: "12px" }} onClick={getCurrentLocation}>
                    Recalibrate
                  </button>
                </div>
              ) : (
                <button type="button" className="btn-accent" onClick={getCurrentLocation}>
                  <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.5a.5.5 0 00-.08-.272L6.145 7.6a.5.5 0 01.3-.772l3.415-.486a.5.5 0 00.356-.233L11.5 3.05a.5.5 0 01.9 0l1.284 3.039a.5.5 0 00.356.233l3.415.486a.5.5 0 01.3.772l-2.775 3.628a.5.5 0 00-.08.272 13.916 13.916 0 002.753 9.571l.054.09" />
                  </svg>
                  Link GPS Coordinates
                </button>
              )}
            </div>

            {/* Address fields */}
            <div className="grid-3">
              <div className="input-group">
                <label className="input-label">House No.</label>
                <input
                  type="text"
                  placeholder="E.g. 42"
                  value={data.houseNo}
                  onChange={(e) => setData({ ...data, houseNo: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Street / Lane</label>
                <input
                  type="text"
                  placeholder="E.g. Industrial Ave"
                  value={data.streetNo}
                  onChange={(e) => setData({ ...data, streetNo: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Building / Gate</label>
                <input
                  type="text"
                  placeholder="E.g. Warehouse 3"
                  value={data.building}
                  onChange={(e) => setData({ ...data, building: e.target.value })}
                />
              </div>
            </div>
            <div className="grid-3">
              <div className="input-group">
                <label className="input-label">Area / Locality</label>
                <input
                  type="text"
                  placeholder="E.g. Sector 4"
                  value={data.area}
                  onChange={(e) => setData({ ...data, area: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Landmark</label>
                <input
                  type="text"
                  placeholder="E.g. Near Power Grid"
                  value={data.landmark}
                  onChange={(e) => setData({ ...data, landmark: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="input-label">District</label>
                <input
                  type="text"
                  placeholder="E.g. North Delhi"
                  value={data.district}
                  onChange={(e) => setData({ ...data, district: e.target.value })}
                />
              </div>
            </div>

            {/* Timing targets */}
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Delivery Date</label>
                <input
                  type="date"
                  value={data.deliveryDate}
                  onChange={(e) => setData({ ...data, deliveryDate: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Preferred Time Slot</label>
                <input
                  type="time"
                  value={data.deliveryTime}
                  onChange={(e) => setData({ ...data, deliveryTime: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Catalog & Order Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Card: Interactive Catalog Grid */}
          <div className="card-section">
            <h3 className="catalog-title">
              <svg style={{ width: "22px", height: "22px", color: "var(--accent-cyan)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Select Bottled Packages
            </h3>

            <div className="product-grid">
              
              {/* Product Card: 1L */}
              <div className="product-card">
                <img 
                  src={prices.oneLImage || "/images/one_litre_pack.png"} 
                  alt="1L Pack" 
                  style={{ width: "100px", height: "100px", objectFit: "contain", marginBottom: "8px", borderRadius: "8px" }} 
                />
                <div className="product-info">
                  <h4>1 Litre Packs</h4>
                  <p>12 bottles per box</p>
                </div>
                <div className="product-price-tag">₹{prices.distributorOneLPrice}<span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "normal" }}>/box</span></div>
                <div className="product-input-qty-row">
                  <input
                    type="number"
                    min="1"
                    className="product-qty-field"
                    value={quantities["1L"]}
                    onChange={(e) => setQuantities({ ...quantities, "1L": Math.max(1, parseInt(e.target.value) || 1) })}
                  />
                </div>
                <button type="button" className="btn-primary btn-add-catalog" onClick={() => handleCatalogAdd("1L")}>
                  Add Boxes
                </button>
              </div>

              {/* Product Card: 500ml */}
              <div className="product-card">
                <img 
                  src={prices.fiveHundredMLImage || "/images/five_hundred_ml_pack.png"} 
                  alt="500ml Pack" 
                  style={{ width: "100px", height: "100px", objectFit: "contain", marginBottom: "8px", borderRadius: "8px" }} 
                />
                <div className="product-info">
                  <h4>500ml Packs</h4>
                  <p>24 bottles per box</p>
                </div>
                <div className="product-price-tag">₹{prices.distributorFiveHundredMLPrice}<span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "normal" }}>/box</span></div>
                <div className="product-input-qty-row">
                  <input
                    type="number"
                    min="1"
                    className="product-qty-field"
                    value={quantities["500ml"]}
                    onChange={(e) => setQuantities({ ...quantities, "500ml": Math.max(1, parseInt(e.target.value) || 1) })}
                  />
                </div>
                <button type="button" className="btn-primary btn-add-catalog" onClick={() => handleCatalogAdd("500ml")}>
                  Add Boxes
                </button>
              </div>

              {/* Product Card: 200ml */}
              <div className="product-card">
                <img 
                  src={prices.twoHundredMLImage || "/images/two_hundred_ml_pack.png"} 
                  alt="200ml Pack" 
                  style={{ width: "100px", height: "100px", objectFit: "contain", marginBottom: "8px", borderRadius: "8px" }} 
                />
                <div className="product-info">
                  <h4>200ml Packs</h4>
                  <p>48 bottles per box</p>
                </div>
                <div className="product-price-tag">₹{prices.distributorTwoHundredMLPrice}<span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "normal" }}>/box</span></div>
                <div className="product-input-qty-row">
                  <input
                    type="number"
                    min="1"
                    className="product-qty-field"
                    value={quantities["200ml"]}
                    onChange={(e) => setQuantities({ ...quantities, "200ml": Math.max(1, parseInt(e.target.value) || 1) })}
                  />
                </div>
                <button type="button" className="btn-primary btn-add-catalog" onClick={() => handleCatalogAdd("200ml")}>
                  Add Boxes
                </button>
              </div>

            </div>
          </div>

          {/* Card: Cart and Submit */}
          <div className="card-section" style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <div className="cart-header-row">
              <h3>Order Summary</h3>
              <span className="badge badge-role">
                {cart.length} Product(s)
              </span>
            </div>

            <div style={{ flexGrow: 1, minHeight: "150px", maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
              {cart.length === 0 ? (
                <div className="cart-empty-state">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Select packages from the catalog above to add to your order.</span>
                </div>
              ) : (
                <div className="cart-item-container">
                  {cart.map((item, index) => (
                    <div className="cart-item" key={index}>
                      <div className="cart-item-details">
                        <h4>{bottleData[item.bottleType].name}</h4>
                        <p>₹{item.price} • {bottleData[item.bottleType].desc}</p>
                      </div>
                      <div className="qty-controls">
                        <button type="button" className="qty-btn" onClick={() => decreaseQty(item.bottleType)}>-</button>
                        <input
                          type="number"
                          className="qty-input"
                          value={item.quantity}
                          onChange={(e) => updateQty(item.bottleType, e.target.value)}
                        />
                        <button type="button" className="qty-btn" onClick={() => increaseQty(item.bottleType)}>+</button>
                        <button type="button" className="btn-remove" onClick={() => removeItem(item.bottleType)}>Remove</button>
                      </div>
                      <div className="cart-item-total">
                        ₹{item.quantity * item.price}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="cart-total-section">
              <div className="cart-total-row">
                <span className="cart-total-label">Grand Total:</span>
                <span className="cart-total-price">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-accent" 
              disabled={cart.length === 0 || isSubmitting} 
              onClick={submitOrder}
              style={{ padding: "14px", fontSize: "15px" }}
            >
              {isSubmitting ? (
                <>
                  <div className="signup-spinner" style={{ width: "16px", height: "16px" }}></div>
                  Placing Order Queue...
                </>
              ) : (
                "Place Distributor Order (FIFO)"
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
          onUpdateUser={onUpdateUser} 
        />
      )}

      {/* Tax Invoice Modal Overlay */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", padding: "24px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "18px", color: "var(--text-dark)", letterSpacing: "-0.5px" }}>Tax Invoice Receipt</h3>
            
            <div className="receipt" style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #cbd5e1", margin: "10px 0 20px 0" }}>
              <div className="receipt-title" style={{ fontSize: "18px", fontWeight: "900", textAlign: "center", color: "var(--primary)" }}>AquaFlow WDS</div>
              <div style={{ textAlign: "center", fontSize: "11px", color: "#64748b", marginBottom: "12px" }}>
                Water Distribution Network Ltd.<br />
                Receipt No: {selectedOrder.receiptNo || `RC${1000 + selectedOrder.token}`}<br />
                Date Issued: {new Date(selectedOrder.createdAt).toLocaleDateString()}
              </div>
              <div style={{ borderBottom: "1.5px dashed #cbd5e1", margin: "12px 0" }}></div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}><span style={{ color: "#64748b" }}>Client Type:</span><span style={{ fontWeight: "600" }}>{selectedOrder.clientType || "Distributor"}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}><span style={{ color: "#64748b" }}>Client Name:</span><span style={{ fontWeight: "700" }}>{(selectedOrder.clientType === "Retailer" ? selectedOrder.retailerName : selectedOrder.distributorName) || "-"}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}><span style={{ color: "#64748b" }}>Contact No:</span><span style={{ fontWeight: "600" }}>{selectedOrder.contact || "-"}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}><span style={{ color: "#64748b" }}>Address:</span><span style={{ maxWidth: "200px", textAlign: "right", fontWeight: "600" }}>{selectedOrder.location || selectedOrder.address || "-"}</span></div>
              
              <div style={{ borderBottom: "1.5px dashed #cbd5e1", margin: "12px 0" }}></div>
              <div style={{ fontSize: "12px", fontWeight: "800", marginBottom: "8px", letterSpacing: "0.5px" }}>ORDERED BOTTLES</div>
              {selectedOrder.oneL > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" }}>
                  <span>1L Package ({selectedOrder.oneL} boxes)</span>
                  <span style={{ fontWeight: "600" }}>
                    ₹{(selectedOrder.oneL * (selectedOrder.clientType === "Retailer" ? prices.retailerOneLPrice : prices.distributorOneLPrice)).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {selectedOrder.fiveHundredML > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" }}>
                  <span>500ml Package ({selectedOrder.fiveHundredML} boxes)</span>
                  <span style={{ fontWeight: "600" }}>
                    ₹{(selectedOrder.fiveHundredML * (selectedOrder.clientType === "Retailer" ? prices.retailerFiveHundredMLPrice : prices.distributorFiveHundredMLPrice)).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {selectedOrder.twoHundredML > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" }}>
                  <span>200ml Package ({selectedOrder.twoHundredML} boxes)</span>
                  <span style={{ fontWeight: "600" }}>
                    ₹{(selectedOrder.twoHundredML * (selectedOrder.clientType === "Retailer" ? prices.retailerTwoHundredMLPrice : prices.distributorTwoHundredMLPrice)).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              
              <div style={{ borderBottom: "1.5px dashed #cbd5e1", margin: "12px 0" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "900", fontSize: "14px", color: "var(--success)" }}><span>GRAND TOTAL (PAID)</span><span>₹{(selectedOrder.total).toLocaleString("en-IN")}</span></div>
              <div style={{ borderBottom: "1.5px dashed #cbd5e1", margin: "12px 0" }}></div>
              <div style={{ textAlign: "center", fontSize: "10px", color: "var(--success)", fontWeight: "700", marginTop: "6px" }}>
                ✓ PAYMENT COMPLETED VIA WALLET/FIFO TRANSACTION
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="button" className="btn-primary" style={{ width: "auto" }} onClick={() => window.print()}>
                Print Invoice
              </button>
              <button type="button" className="btn-secondary" style={{ width: "auto" }} onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderPage;