import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Chart from "chart.js/auto";
import L from "leaflet";

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

function AdminPage({ setRole, user }) {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Tabbed Queue state
  const [activeQueueTab, setActiveQueueTab] = useState("Distributor"); // "Distributor" or "Retailer"

  // Detailed Order popup state
  const [detailedOrder, setDetailedOrder] = useState(null);

  // Live Price state (separate configuration for Distributor and Retailer)
  const [prices, setPrices] = useState({
    distributorOneLPrice: 90,
    distributorFiveHundredMLPrice: 105,
    distributorTwoHundredMLPrice: 160,
    retailerOneLPrice: 90,
    retailerFiveHundredMLPrice: 105,
    retailerTwoHundredMLPrice: 160,
    oneLImage: "",
    fiveHundredMLImage: "",
    twoHundredMLImage: ""
  });

  const [editDistOneL, setEditDistOneL] = useState(90);
  const [editDistFiveHundredML, setEditDistFiveHundredML] = useState(105);
  const [editDistTwoHundredML, setEditDistTwoHundredML] = useState(160);

  const [editRetOneL, setEditRetOneL] = useState(90);
  const [editRetFiveHundredML, setEditRetFiveHundredML] = useState(105);
  const [editRetTwoHundredML, setEditRetTwoHundredML] = useState(160);

  const [isSavingPrices, setIsSavingPrices] = useState(false);
  const [priceSuccess, setPriceSuccess] = useState("");
  const [priceError, setPriceError] = useState("");

  const [adminTab, setAdminTab] = useState("queue"); // "queue" or "analytics"
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  const [activeDrivers, setActiveDrivers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driversError, setDriversError] = useState("");

  const fetchActiveDrivers = async () => {
    try {
      const response = await axios.get("https://smart-water-distribution-5.onrender.com/auth/drivers/active");
      setActiveDrivers(response.data);
    } catch (err) {
      console.error("Error fetching active drivers:", err);
    }
  };

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    setDriversError("");
    try {
      const response = await axios.get("https://smart-water-distribution-5.onrender.com/auth/drivers");
      setDrivers(response.data);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setDriversError("Failed to fetch drivers list.");
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleApproveDriver = async (driverId) => {
    try {
      await axios.put(`https://smart-water-distribution-5.onrender.com/auth/drivers/approve/${driverId}`);
      fetchDrivers();
      fetchActiveDrivers();
    } catch (err) {
      console.error("Error approving driver:", err);
      alert("Failed to approve driver.");
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    setAnalyticsError("");
    try {
      const response = await axios.get("https://smart-water-distribution-5.onrender.com/orders/analytics");
      setAnalyticsData(response.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setAnalyticsError("Failed to fetch analytics data.");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (adminTab === "analytics") {
      fetchAnalytics();
    } else if (adminTab === "drivers") {
      fetchDrivers();
    } else if (adminTab === "queue") {
      fetchActiveDrivers();
    }
  }, [adminTab]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("https://smart-water-distribution-5.onrender.com/orders/fifo");
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchPrices = async () => {
    try {
      const response = await axios.get("https://smart-water-distribution-5.onrender.com/orders/prices");
      if (response.data) {
        setPrices(prev => ({
          ...prev,
          distributorOneLPrice: response.data.distributorOneLPrice ?? prev.distributorOneLPrice,
          distributorFiveHundredMLPrice: response.data.distributorFiveHundredMLPrice ?? prev.distributorFiveHundredMLPrice,
          distributorTwoHundredMLPrice: response.data.distributorTwoHundredMLPrice ?? prev.distributorTwoHundredMLPrice,
          retailerOneLPrice: response.data.retailerOneLPrice ?? prev.retailerOneLPrice,
          retailerFiveHundredMLPrice: response.data.retailerFiveHundredMLPrice ?? prev.retailerFiveHundredMLPrice,
          retailerTwoHundredMLPrice: response.data.retailerTwoHundredMLPrice ?? prev.retailerTwoHundredMLPrice,
          oneLImage: response.data.oneLImage ?? prev.oneLImage,
          fiveHundredMLImage: response.data.fiveHundredMLImage ?? prev.fiveHundredMLImage,
          twoHundredMLImage: response.data.twoHundredMLImage ?? prev.twoHundredMLImage
        }));
        setEditDistOneL(response.data.distributorOneLPrice ?? 90);
        setEditDistFiveHundredML(response.data.distributorFiveHundredMLPrice ?? 105);
        setEditDistTwoHundredML(response.data.distributorTwoHundredMLPrice ?? 160);
        setEditRetOneL(response.data.retailerOneLPrice ?? 90);
        setEditRetFiveHundredML(response.data.retailerFiveHundredMLPrice ?? 105);
        setEditRetTwoHundredML(response.data.retailerTwoHundredMLPrice ?? 160);
      }
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapMarkersRef = useRef([]);
  const mapPolylineRef = useRef(null);
  const [driverStatus, setDriverStatus] = useState(null);
  const [optimizedStops, setOptimizedStops] = useState([]);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(false);

  // Poll driver status
  useEffect(() => {
    let intervalId = null;
    const fetchDriverStatus = async () => {
      try {
        const response = await axios.get("https://smart-water-distribution-5.onrender.com/orders/driver/status");
        setDriverStatus(response.data);
      } catch (err) {
        console.error("Error fetching driver status:", err);
      }
    };

    fetchDriverStatus();
    intervalId = setInterval(fetchDriverStatus, 3000);
    return () => clearInterval(intervalId);
  }, [adminTab]);

  // Leaflet map renderer effect
  useEffect(() => {
    if (adminTab !== "routing") {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    if (!mapContainerRef.current) return;

    const HQ_COORDS = [12.9715987, 77.5945627];

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
      .bindPopup("🏢 <strong>AquaFlow Warehouse HQ</strong>")
      .addTo(map);
    mapMarkersRef.current.push(hqMarker);

    // Filter pending orders with coordinates
    const pendingOrdersWithCoords = orders.filter(
      o => o.status === "Pending" && o.latitude && o.longitude && o.latitude !== 0 && o.longitude !== 0
    );

    // Add markers for pending orders
    pendingOrdersWithCoords.forEach((order) => {
      const clientName = order.clientType === "Retailer" ? order.retailerName : order.distributorName;
      const markerColor = order.clientType === "Retailer" ? "#06b6d4" : "#1e3a8a";
      const marker = L.marker([order.latitude, order.longitude], {
        icon: createCustomMarker(markerColor)
      })
        .bindPopup(`
          <div>
            <strong>#${order.token} - ${clientName}</strong><br/>
            ${order.clientType}<br/>
            ${order.location || order.address}<br/>
            1L: ${order.oneL} | 500m: ${order.fiveHundredML} | 200m: ${order.twoHundredML}
          </div>
        `)
        .addTo(map);
      mapMarkersRef.current.push(marker);
    });

    // Draw active driver route polyline if simulator is active
    if (driverStatus && driverStatus.isActive && driverStatus.routePoints && driverStatus.routePoints.length > 0) {
      const polyline = L.polyline(driverStatus.routePoints, { color: "#3b82f6", weight: 4, opacity: 0.8 }).addTo(map);
      mapPolylineRef.current = polyline;

      const driverMarker = L.marker([driverStatus.currentLatitude, driverStatus.currentLongitude], {
        icon: vehicleIcon
      })
        .bindPopup(`🚚 <strong>Driver Location</strong><br/>ETA: ${driverStatus.etaMinutes} mins`)
        .addTo(map);
      mapMarkersRef.current.push(driverMarker);
    } 
    // Draw optimized route polyline if available and simulator not active
    else if (showOptimizedRoute && optimizedStops.length > 0) {
      const points = [HQ_COORDS];
      optimizedStops.forEach(o => points.push([o.latitude, o.longitude]));
      points.push(HQ_COORDS);

      const polyline = L.polyline(points, { color: "#10b981", weight: 4, opacity: 0.8, dashArray: "5, 10" }).addTo(map);
      mapPolylineRef.current = polyline;
    }
  }, [adminTab, orders, driverStatus, showOptimizedRoute, optimizedStops]);

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setIsSavingPrices(true);
      setPriceSuccess("");
      setPriceError("");
      try {
        const response = await axios.put("https://smart-water-distribution-5.onrender.com/orders/prices", {
          [field]: base64String
        });
        setPrices(prev => ({
          ...prev,
          [field]: response.data[field]
        }));
        setPriceSuccess("Product image updated successfully!");
        setTimeout(() => setPriceSuccess(""), 3000);
      } catch (err) {
        console.error("Error saving image:", err);
        setPriceError("Failed to update product image.");
      } finally {
        setIsSavingPrices(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = async (field) => {
    setIsSavingPrices(true);
    setPriceSuccess("");
    setPriceError("");
    try {
      const response = await axios.put("https://smart-water-distribution-5.onrender.com/orders/prices", {
        [field]: ""
      });
      setPrices(prev => ({
        ...prev,
        [field]: response.data[field]
      }));
      setPriceSuccess("Image cleared successfully.");
      setTimeout(() => setPriceSuccess(""), 3000);
    } catch (err) {
      console.error("Error clearing image:", err);
      setPriceError("Failed to clear image.");
    } finally {
      setIsSavingPrices(false);
    }
  };

  const runClientTSP = () => {
    const HQ_COORDS = { latitude: 12.9715987, longitude: 77.5945627 };
    const pendingOrdersWithCoords = orders.filter(
      o => o.status === "Pending" && o.latitude && o.longitude && o.latitude !== 0 && o.longitude !== 0
    );

    if (pendingOrdersWithCoords.length === 0) {
      alert("No pending orders with coordinates to optimize.");
      return;
    }

    const unvisited = [...pendingOrdersWithCoords];
    const sorted = [];
    let current = HQ_COORDS;

    while (unvisited.length > 0) {
      let nearestIdx = -1;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const o = unvisited[i];
        const dx = current.latitude - o.latitude;
        const dy = current.longitude - o.longitude;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      if (nearestIdx !== -1) {
        const nextStop = unvisited.splice(nearestIdx, 1)[0];
        sorted.push(nextStop);
        current = nextStop;
      }
    }

    setOptimizedStops(sorted);
    setShowOptimizedRoute(true);
  };

  const handleStartSimulation = async () => {
    try {
      const response = await axios.post("https://smart-water-distribution-5.onrender.com/orders/driver/start");
      alert(response.data.message || "Simulation started.");
      setShowOptimizedRoute(false);
    } catch (err) {
      console.error("Error starting simulation:", err);
      alert(err.response?.data?.message || "Failed to start simulation.");
    }
  };

  const handleStopSimulation = async () => {
    try {
      const response = await axios.post("https://smart-water-distribution-5.onrender.com/orders/driver/stop");
      alert(response.data.message || "Simulation stopped.");
      setOptimizedStops([]);
      setShowOptimizedRoute(false);
    } catch (err) {
      console.error("Error stopping simulation:", err);
      alert("Failed to stop simulation.");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchPrices();
    fetchActiveDrivers();
    const interval = setInterval(() => {
      fetchOrders();
      fetchActiveDrivers();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const deliverOrder = async (id) => {
    try {
      await axios.put(`https://smart-water-distribution-5.onrender.com/orders/process/${id}`);
      fetchOrders();
    } catch (error) {
      console.error("Error processing delivery:", error);
    }
  };

  const handleSaveDistributorPrices = async (e) => {
    e.preventDefault();
    setIsSavingPrices(true);
    setPriceSuccess("");
    setPriceError("");
    try {
      const response = await axios.put("https://smart-water-distribution-5.onrender.com/orders/prices", {
        distributorOneLPrice: Number(editDistOneL),
        distributorFiveHundredMLPrice: Number(editDistFiveHundredML),
        distributorTwoHundredMLPrice: Number(editDistTwoHundredML)
      });
      if (response.data) {
        setPrices(prev => ({
          ...prev,
          distributorOneLPrice: response.data.distributorOneLPrice ?? prev.distributorOneLPrice,
          distributorFiveHundredMLPrice: response.data.distributorFiveHundredMLPrice ?? prev.distributorFiveHundredMLPrice,
          distributorTwoHundredMLPrice: response.data.distributorTwoHundredMLPrice ?? prev.distributorTwoHundredMLPrice,
          retailerOneLPrice: response.data.retailerOneLPrice ?? prev.retailerOneLPrice,
          retailerFiveHundredMLPrice: response.data.retailerFiveHundredMLPrice ?? prev.retailerFiveHundredMLPrice,
          retailerTwoHundredMLPrice: response.data.retailerTwoHundredMLPrice ?? prev.retailerTwoHundredMLPrice
        }));
      }
      setPriceSuccess("Distributor prices updated successfully!");
      setTimeout(() => setPriceSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving distributor prices:", error);
      setPriceError("Failed to update distributor prices.");
    } finally {
      setIsSavingPrices(false);
    }
  };

  const handleSaveRetailerPrices = async (e) => {
    e.preventDefault();
    setIsSavingPrices(true);
    setPriceSuccess("");
    setPriceError("");
    try {
      const response = await axios.put("https://smart-water-distribution-5.onrender.com/orders/prices", {
        retailerOneLPrice: Number(editRetOneL),
        retailerFiveHundredMLPrice: Number(editRetFiveHundredML),
        retailerTwoHundredMLPrice: Number(editRetTwoHundredML)
      });
      if (response.data) {
        setPrices(prev => ({
          ...prev,
          distributorOneLPrice: response.data.distributorOneLPrice ?? prev.distributorOneLPrice,
          distributorFiveHundredMLPrice: response.data.distributorFiveHundredMLPrice ?? prev.distributorFiveHundredMLPrice,
          distributorTwoHundredMLPrice: response.data.distributorTwoHundredMLPrice ?? prev.distributorTwoHundredMLPrice,
          retailerOneLPrice: response.data.retailerOneLPrice ?? prev.retailerOneLPrice,
          retailerFiveHundredMLPrice: response.data.retailerFiveHundredMLPrice ?? prev.retailerFiveHundredMLPrice,
          retailerTwoHundredMLPrice: response.data.retailerTwoHundredMLPrice ?? prev.retailerTwoHundredMLPrice
        }));
      }
      setPriceSuccess("Retailer prices updated successfully!");
      setTimeout(() => setPriceSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving retailer prices:", error);
      setPriceError("Failed to update retailer prices.");
    } finally {
      setIsSavingPrices(false);
    }
  };

  const handleExportCSV = () => {
    const targetOrders = orders.filter(o => o.clientType === activeQueueTab);
    if (targetOrders.length === 0) {
      alert(`No orders to export in the ${activeQueueTab} queue.`);
      return;
    }

    const csvRows = [];
    csvRows.push([
      "Token",
      "Client Name",
      "Client Type",
      "Contact",
      "Drop-Off Address",
      "1L Boxes",
      "500ml Boxes",
      "200ml Boxes",
      "Grand Total (INR)",
      "Scheduled Date",
      "Scheduled Time",
      "GPS Coordinates",
      "Delivery Status"
    ].join(","));

    targetOrders.forEach(o => {
      const clientName = activeQueueTab === "Retailer" ? o.retailerName : o.distributorName;
      const gps = o.latitude && o.longitude ? `${o.latitude};${o.longitude}` : "N/A";
      csvRows.push([
        `#${o.token}`,
        `"${(clientName || "Unknown").replace(/"/g, '""')}"`,
        o.clientType,
        o.contact || "N/A",
        `"${(o.location || o.address || "N/A").replace(/"/g, '""')}"`,
        o.oneL || 0,
        o.fiveHundredML || 0,
        o.twoHundredML || 0,
        o.total || 0,
        o.deliveryDate || "N/A",
        o.deliveryTime || "N/A",
        `"${gps}"`,
        o.status
      ].join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aquaflow_${activeQueueTab.toLowerCase()}_dispatch_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics Calculations (tab-specific)
  const totalOrders = orders.filter(o => o.clientType === activeQueueTab).length;
  const pendingOrders = orders.filter(o => o.clientType === activeQueueTab && o.status === "Pending").length;
  const completedOrders = orders.filter(o => o.clientType === activeQueueTab && o.status === "Delivered").length;
  const totalRevenue = orders.filter(o => o.clientType === activeQueueTab).reduce((sum, o) => sum + (o.total || 0), 0);
  
  const totalLiters = orders.filter(o => o.clientType === activeQueueTab).reduce((sum, o) => {
    const box1L = o.oneL || 0;
    const box500ml = o.fiveHundredML || 0;
    const box200ml = o.twoHundredML || 0;
    return sum + (box1L * 12) + (box500ml * 12) + (box200ml * 9.6);
  }, 0);

  // Search & Filter Logic
  const filteredOrders = orders.filter(order => {
    if (order.clientType !== activeQueueTab) return false;

    const clientName = (order.clientType === "Retailer" ? order.retailerName : order.distributorName) || "";
    const matchesSearch = clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (order.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          `#${order.token}`.includes(searchQuery);
    
    if (filterStatus === "All") return matchesSearch;
    return order.status === filterStatus && matchesSearch;
  });

  const pendingPercent = totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0;
  const completedPercent = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
  const litersGoalPercent = Math.min(100, (totalLiters / 5000) * 100); // 5000L daily target

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
          <span className="badge badge-role" style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>Admin Panel</span>
          <div className="avatar-initials" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)" }}>
            AD
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

      {/* Tab Switcher */}
      <div className="admin-nav-tabs">
        <button 
          type="button"
          className={`admin-nav-tab ${adminTab === "queue" ? "active" : ""}`}
          onClick={() => setAdminTab("queue")}
        >
          Dispatch Queue Manager
        </button>
        <button 
          type="button"
          className={`admin-nav-tab ${adminTab === "routing" ? "active" : ""}`}
          onClick={() => setAdminTab("routing")}
        >
          Dispatch Routing Map
        </button>
        <button 
          type="button"
          className={`admin-nav-tab ${adminTab === "analytics" ? "active" : ""}`}
          onClick={() => setAdminTab("analytics")}
        >
          Analytics & Forecasting
        </button>
        <button 
          type="button"
          className={`admin-nav-tab ${adminTab === "drivers" ? "active" : ""}`}
          onClick={() => setAdminTab("drivers")}
        >
          🚚 Drivers & Approvals
        </button>
      </div>

      {/* Grid Layout containing dynamic KPI indicators and main workflow */}
      {adminTab === "queue" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* KPI Metrics Dashboard Grid */}
        <div className="metrics-grid">
          {/* Metric 1 */}
          <div className="metric-card">
            <div className="metric-title">{activeQueueTab} Orders</div>
            <div className="metric-value">
              {totalOrders} <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Active Queue</span>
            </div>
            <div className="metric-progress-bg">
              <div className="metric-progress-bar" style={{ width: "100%" }}></div>
            </div>
          </div>
          
          {/* Metric 2 */}
          <div className="metric-card warning">
            <div className="metric-title">Pending Dispatch</div>
            <div className="metric-value">
              {pendingOrders} <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Pending</span>
            </div>
            <div className="metric-progress-bg">
              <div className="metric-progress-bar" style={{ width: `${pendingPercent}%` }}></div>
            </div>
          </div>
          
          {/* Metric 3 */}
          <div className="metric-card success">
            <div className="metric-title">Completed Orders</div>
            <div className="metric-value">
              {completedOrders} <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Dispatched</span>
            </div>
            <div className="metric-progress-bg">
              <div className="metric-progress-bar" style={{ width: `${completedPercent}%` }}></div>
            </div>
          </div>
          
          {/* Metric 4 */}
          <div className="metric-card cyan">
            <div className="metric-title">{activeQueueTab} Revenue</div>
            <div className="metric-value">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
            <div className="metric-progress-bg">
              <div className="metric-progress-bar" style={{ width: "100%" }}></div>
            </div>
          </div>

          {/* Metric 5 */}
          <div className="metric-card">
            <div className="metric-title">Volume (Goal: 5k Ltr)</div>
            <div className="metric-value">
              {totalLiters.toLocaleString("en-IN", { maximumFractionDigits: 1 })} <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Litres</span>
            </div>
            <div className="metric-progress-bg">
              <div className="metric-progress-bar" style={{ width: `${litersGoalPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* 2-Column Split: Left is split-queue list; Right is price control settings */}
        <div className="admin-main-grid">
          
          {/* Left Column: Queue Manager Card */}
          <div className="admin-card" style={{ margin: 0 }}>
            <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "20px", color: "var(--text-dark)", letterSpacing: "-0.5px" }}>
              Water Distribution Queue
            </h2>

            {/* Split Queue Selection Tabs */}
            <div style={{ display: "flex", gap: "6px", borderBottom: "1.5px solid #e2e8f0", marginBottom: "24px" }}>
              <button 
                type="button" 
                className={`filter-btn ${activeQueueTab === "Distributor" ? "active" : ""}`}
                style={{
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: "700",
                  background: "none",
                  border: "none",
                  borderBottom: activeQueueTab === "Distributor" ? "3.5px solid var(--primary)" : "3.5px solid transparent",
                  color: activeQueueTab === "Distributor" ? "var(--primary)" : "var(--text-muted)",
                  borderRadius: 0,
                  cursor: "pointer",
                  margin: 0
                }}
                onClick={() => setActiveQueueTab("Distributor")}
              >
                Distributors
              </button>
              <button 
                type="button" 
                className={`filter-btn ${activeQueueTab === "Retailer" ? "active" : ""}`}
                style={{
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: "700",
                  background: "none",
                  border: "none",
                  borderBottom: activeQueueTab === "Retailer" ? "3.5px solid var(--accent-cyan)" : "3.5px solid transparent",
                  color: activeQueueTab === "Retailer" ? "var(--accent-cyan)" : "var(--text-muted)",
                  borderRadius: 0,
                  cursor: "pointer",
                  margin: 0
                }}
                onClick={() => setActiveQueueTab("Retailer")}
              >
                Retailers
              </button>
            </div>

            {/* Controls Bar */}
            <div className="controls-bar" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
              <div className="search-input-wrapper" style={{ flexGrow: 1, maxWidth: "400px" }}>
                <input
                  type="text"
                  placeholder={`Search ${activeQueueTab.toLowerCase()} details...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: "14px", padding: "10px 16px 10px 42px", margin: 0, position: "relative" }}
                />
                <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#94a3b8" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button className={`filter-btn ${filterStatus === "All" ? "active" : ""}`} onClick={() => setFilterStatus("All")} style={{ padding: "8px 14px", fontSize: "13px" }}>
                  All
                </button>
                <button className={`filter-btn ${filterStatus === "Pending" ? "active" : ""}`} onClick={() => setFilterStatus("Pending")} style={{ padding: "8px 14px", fontSize: "13px" }}>
                  Pending
                </button>
                <button className={`filter-btn ${filterStatus === "Delivered" ? "active" : ""}`} onClick={() => setFilterStatus("Delivered")} style={{ padding: "8px 14px", fontSize: "13px" }}>
                  Delivered
                </button>
                
                <button 
                  type="button" 
                  className="btn-accent" 
                  style={{ width: "auto", padding: "8px 14px", fontSize: "13px", display: "inline-flex", gap: "6px", alignItems: "center", whiteSpace: "nowrap" }}
                  onClick={handleExportCSV}
                >
                  <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            {/* Table View */}
            <div className="admin-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>Token</th>
                    <th>{activeQueueTab} Details</th>
                    <th>Contact</th>
                    <th>Drop-Off Address</th>
                    <th>GPS Link</th>
                    <th>Packs (1L / 500m / 200m)</th>
                    <th>Invoice Total</th>
                    <th>Delivery Schedule</th>
                    <th>Status</th>
                    <th>Assign Driver</th>
                    <th style={{ textAlign: "center", width: "140px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="text-center" style={{ color: "var(--text-muted)", padding: "48px" }}>
                        No matching orders in the {activeQueueTab.toLowerCase()} queue.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const clientName = activeQueueTab === "Retailer" ? order.retailerName : order.distributorName;
                      
                      return (
                        <tr 
                          key={order._id} 
                          onClick={() => setDetailedOrder(order)} 
                          style={{ cursor: "pointer" }}
                          title="Click to view detailed order information"
                        >
                          <td style={{ fontWeight: "800", color: activeQueueTab === "Retailer" ? "var(--accent-cyan)" : "var(--primary)", fontSize: "15px" }}>
                            #{order.token}
                          </td>
                          <td>
                            <div style={{ fontWeight: "700", color: "var(--text-dark)" }}>{clientName || "Unknown Customer"}</div>
                            <span className="badge" style={{ 
                              fontSize: "9px", 
                              padding: "2px 8px",
                              marginTop: "6px",
                              background: activeQueueTab === "Retailer" ? "rgba(6, 182, 212, 0.08)" : "rgba(30, 58, 138, 0.08)",
                              color: activeQueueTab === "Retailer" ? "var(--accent-cyan)" : "var(--primary)",
                              border: activeQueueTab === "Retailer" ? "1px solid rgba(6, 182, 212, 0.15)" : "1px solid rgba(30, 58, 138, 0.15)"
                            }}>
                              {order.clientType || "Distributor"}
                            </span>
                          </td>
                          <td style={{ fontWeight: "500" }}>{order.contact || "-"}</td>
                          <td style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={order.location || order.address}>
                            {order.location || order.address || "-"}
                          </td>
                          <td>
                            {order.latitude && order.longitude ? (
                              <button 
                                type="button" 
                                className="btn-secondary" 
                                style={{ padding: "6px 12px", fontSize: "11px", width: "auto", display: "inline-flex", gap: "4px" }} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://www.google.com/maps?q=${order.latitude},${order.longitude}`, "_blank");
                                }}
                              >
                                🗺️ Map Link
                              </button>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>No GPS Data</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: "13px", fontWeight: "500" }}>
                              1L: <strong style={{ color: "var(--primary)" }}>{order.oneL || 0}</strong> • 
                              500m: <strong style={{ color: "var(--accent-cyan)" }}>{order.fiveHundredML || 0}</strong> • 
                              200m: <strong style={{ color: "var(--text-dark)" }}>{order.twoHundredML || 0}</strong>
                            </div>
                          </td>
                          <td style={{ fontWeight: "800", color: "var(--success)", fontSize: "15px" }}>
                            ₹{(order.total || 0).toLocaleString("en-IN")}
                          </td>
                          <td>
                            <div style={{ fontWeight: "600" }}>{order.deliveryDate || "-"}</div>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{order.deliveryTime || "-"}</span>
                          </td>
                          <td>
                            <span className={`badge ${order.status === "Delivered" ? "badge-delivered" : "badge-pending"}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            {order.assignedDriverName ? (
                              <span className="badge badge-delivered" style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                👤 {order.assignedDriverName}
                              </span>
                            ) : (
                              <span className="badge" style={{ fontSize: "11px", background: "#f1f5f9", color: "var(--text-muted)", border: "1px solid #cbd5e1" }}>
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              {order.status === "Pending" ? (
                                <button 
                                  type="button" 
                                  className="btn-success" 
                                  style={{ padding: "6px 10px", fontSize: "12px", width: "auto", display: "inline-flex", gap: "4px" }} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deliverOrder(order._id);
                                  }}
                                >
                                  <svg style={{ width: "14px", height: "14px" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  Deliver
                                </button>
                              ) : (
                                <button 
                                  type="button" 
                                  className="btn-secondary" 
                                  style={{ padding: "6px 10px", fontSize: "12px", width: "auto", display: "inline-flex", gap: "4px", border: "1.5px solid var(--success)", color: "var(--success)" }} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                  }}
                                >
                                  <svg style={{ width: "14px", height: "14px" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Invoice
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Pricing Control Card */}
          <div className="admin-card" style={{ margin: 0, padding: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--text-dark)" }}>
              <svg style={{ width: "20px", height: "20px", color: "var(--primary)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pricing Control Panel
            </h3>
            
            {priceSuccess && (
              <div className="pm-alert-success" style={{ padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" }}>
                <span>{priceSuccess}</span>
              </div>
            )}
            {priceError && (
              <div className="pm-alert-error" style={{ padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" }}>
                <span>{priceError}</span>
              </div>
            )}
            
            {/* DISTRIBUTORS PRICING FORM */}
            <form onSubmit={handleSaveDistributorPrices} style={{ display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1.5px solid #e2e8f0", paddingBottom: "20px", marginBottom: "20px" }}>
              <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: "var(--primary)", display: "block", marginBottom: "4px" }}>
                Distributors Price Set
              </span>
              
              <div className="input-group" style={{ marginBottom: "8px" }}>
                <label className="input-label" style={{ fontSize: "11px", color: "var(--text-muted)" }}>1 Litre Pack (₹ / box)</label>
                <input 
                  type="number" 
                  value={editDistOneL} 
                  onChange={(e) => setEditDistOneL(e.target.value)} 
                  required 
                  min="0"
                  disabled={isSavingPrices}
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                />
              </div>
              
              <div className="input-group" style={{ marginBottom: "8px" }}>
                <label className="input-label" style={{ fontSize: "11px", color: "var(--text-muted)" }}>500ml Pack (₹ / box)</label>
                <input 
                  type="number" 
                  value={editDistFiveHundredML} 
                  onChange={(e) => setEditDistFiveHundredML(e.target.value)} 
                  required 
                  min="0"
                  disabled={isSavingPrices}
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                />
              </div>
              
              <div className="input-group" style={{ marginBottom: "12px" }}>
                <label className="input-label" style={{ fontSize: "11px", color: "var(--text-muted)" }}>200ml Pack (₹ / box)</label>
                <input 
                  type="number" 
                  value={editDistTwoHundredML} 
                  onChange={(e) => setEditDistTwoHundredML(e.target.value)} 
                  required 
                  min="0"
                  disabled={isSavingPrices}
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSavingPrices}
                style={{ padding: "10px", fontSize: "13px", fontWeight: "700" }}
              >
                {isSavingPrices ? "Saving..." : "Update Distributor Prices"}
              </button>
            </form>

            {/* RETAILERS PRICING FORM */}
            <form onSubmit={handleSaveRetailerPrices} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: "var(--accent-cyan)", display: "block", marginBottom: "4px" }}>
                Retailers Price Set
              </span>
              
              <div className="input-group" style={{ marginBottom: "8px" }}>
                <label className="input-label" style={{ fontSize: "11px", color: "var(--text-muted)" }}>1 Litre Pack (₹ / box)</label>
                <input 
                  type="number" 
                  value={editRetOneL} 
                  onChange={(e) => setEditRetOneL(e.target.value)} 
                  required 
                  min="0"
                  disabled={isSavingPrices}
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                />
              </div>
              
              <div className="input-group" style={{ marginBottom: "8px" }}>
                <label className="input-label" style={{ fontSize: "11px", color: "var(--text-muted)" }}>500ml Pack (₹ / box)</label>
                <input 
                  type="number" 
                  value={editRetFiveHundredML} 
                  onChange={(e) => setEditRetFiveHundredML(e.target.value)} 
                  required 
                  min="0"
                  disabled={isSavingPrices}
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                />
              </div>
              
              <div className="input-group" style={{ marginBottom: "12px" }}>
                <label className="input-label" style={{ fontSize: "11px", color: "var(--text-muted)" }}>200ml Pack (₹ / box)</label>
                <input 
                  type="number" 
                  value={editRetTwoHundredML} 
                  onChange={(e) => setEditRetTwoHundredML(e.target.value)} 
                  required 
                  min="0"
                  disabled={isSavingPrices}
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                />
              </div>

              <button 
                type="submit" 
                className="btn-accent" 
                disabled={isSavingPrices}
                style={{ padding: "10px", fontSize: "13px", fontWeight: "700" }}
              >
                {isSavingPrices ? "Saving..." : "Update Retailer Prices"}
              </button>
            </form>

            {/* PRODUCT CATALOG IMAGES CONFIG */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderTop: "1.5px solid #e2e8f0", paddingTop: "20px", marginTop: "20px" }}>
              <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: "var(--primary)", display: "block", marginBottom: "4px" }}>
                Catalog Images Config
              </span>
              
              {/* 1L Image */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <img 
                  src={prices.oneLImage || "/images/one_litre_pack.png"} 
                  alt="1L Preview" 
                  style={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: "6px", background: "white", border: "1px solid #cbd5e1" }}
                />
                <div style={{ flexGrow: 1 }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "4px" }}>1 Litre Pack Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "oneLImage")}
                    style={{ fontSize: "11px", border: "none", padding: 0 }}
                  />
                </div>
                {prices.oneLImage && (
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ width: "auto", padding: "4px 8px", fontSize: "11px", color: "red", borderColor: "red" }}
                    onClick={() => handleClearImage("oneLImage")}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* 500ml Image */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <img 
                  src={prices.fiveHundredMLImage || "/images/five_hundred_ml_pack.png"} 
                  alt="500ml Preview" 
                  style={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: "6px", background: "white", border: "1px solid #cbd5e1" }}
                />
                <div style={{ flexGrow: 1 }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "4px" }}>500ml Pack Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "fiveHundredMLImage")}
                    style={{ fontSize: "11px", border: "none", padding: 0 }}
                  />
                </div>
                {prices.fiveHundredMLImage && (
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ width: "auto", padding: "4px 8px", fontSize: "11px", color: "red", borderColor: "red" }}
                    onClick={() => handleClearImage("fiveHundredMLImage")}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* 200ml Image */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <img 
                  src={prices.twoHundredMLImage || "/images/two_hundred_ml_pack.png"} 
                  alt="200ml Preview" 
                  style={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: "6px", background: "white", border: "1px solid #cbd5e1" }}
                />
                <div style={{ flexGrow: 1 }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "4px" }}>200ml Pack Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "twoHundredMLImage")}
                    style={{ fontSize: "11px", border: "none", padding: 0 }}
                  />
                </div>
                {prices.twoHundredMLImage && (
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ width: "auto", padding: "4px 8px", fontSize: "11px", color: "red", borderColor: "red" }}
                    onClick={() => handleClearImage("twoHundredMLImage")}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
      ) : adminTab === "routing" ? (
        <div className="admin-card" style={{ margin: 0 }}>
          <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "12px", color: "var(--text-dark)", letterSpacing: "-0.5px" }}>
            Dispatch Route Optimization & Simulation
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>
            Analyze active pending orders, calculate the shortest route sequence from Warehouse HQ using nearest-neighbor optimization, and run simulated deliveries.
          </p>

          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <button 
              type="button" 
              className="btn-primary" 
              style={{ width: "auto", padding: "10px 20px" }}
              onClick={runClientTSP}
              disabled={driverStatus?.isActive}
            >
              Optimize Delivery Sequence (TSP)
            </button>
            
            {!driverStatus?.isActive ? (
              <button 
                type="button" 
                className="btn-accent" 
                style={{ width: "auto", padding: "10px 20px" }}
                onClick={handleStartSimulation}
                disabled={orders.filter(o => o.status === "Pending" && o.latitude && o.longitude && o.latitude !== 0 && o.longitude !== 0).length === 0}
              >
                ▶ Start Delivery Run Simulation
              </button>
            ) : (
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ width: "auto", padding: "10px 20px", borderColor: "red", color: "red" }}
                onClick={handleStopSimulation}
              >
                ⏹ Stop & Reset Simulation
              </button>
            )}
          </div>

          <div className="routing-dashboard-container">
            {/* Map Container */}
            <div style={{ position: "relative" }}>
              <div ref={mapContainerRef} className="leaflet-container"></div>
            </div>

            {/* Stops Panel */}
            <div className="stops-panel">
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-dark)", borderBottom: "1.5px solid #f1f5f9", paddingBottom: "10px", margin: 0 }}>
                {driverStatus?.isActive ? "Active Delivery Run" : "Planned Stop Sequence"}
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "400px" }}>
                <div className="stop-item active">
                  <div className="stop-badge">HQ</div>
                  <div>
                    <div style={{ fontWeight: "700" }}>Warehouse HQ</div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Start/End Point</span>
                  </div>
                </div>

                {/* Show simulation sequence if active, else client sequence if run, else general pending sequence */}
                {driverStatus?.isActive ? (
                  driverStatus.stopOrders.map((orderId, idx) => {
                    const order = orders.find(o => o._id === orderId);
                    if (!order) return null;
                    const clientName = order.clientType === "Retailer" ? order.retailerName : order.distributorName;
                    const isPassed = idx < driverStatus.currentStopIndex;
                    const isCurrent = idx === driverStatus.currentStopIndex;
                    
                    return (
                      <div key={orderId} className={`stop-item ${isCurrent ? "active" : ""} ${isPassed ? "delivered" : ""}`}>
                        <div className="stop-badge">{idx + 1}</div>
                        <div>
                          <div style={{ fontWeight: "700" }}>{clientName} (#{order.token})</div>
                          <span style={{ fontSize: "11px" }}>
                            {isPassed ? "Delivered ✓" : isCurrent ? "Heading Here..." : "Pending"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : optimizedStops.length > 0 ? (
                  optimizedStops.map((order, idx) => {
                    const clientName = order.clientType === "Retailer" ? order.retailerName : order.distributorName;
                    return (
                      <div key={order._id} className="stop-item">
                        <div className="stop-badge">{idx + 1}</div>
                        <div>
                          <div style={{ fontWeight: "700" }}>{clientName} (#{order.token})</div>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{order.clientType}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  orders.filter(o => o.status === "Pending" && o.latitude && o.longitude && o.latitude !== 0 && o.longitude !== 0).map((order, idx) => {
                    const clientName = order.clientType === "Retailer" ? order.retailerName : order.distributorName;
                    return (
                      <div key={order._id} className="stop-item">
                        <div className="stop-badge">-</div>
                        <div>
                          <div style={{ fontWeight: "700" }}>{clientName} (#{order.token})</div>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Pending Optimization</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {driverStatus?.isActive && (
                <div style={{ marginTop: "auto", background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.15)", borderRadius: "8px", padding: "12px", fontSize: "13px" }}>
                  <strong>🚚 Live Tracking ETA:</strong><br />
                  Approximately <strong style={{ color: "var(--primary)" }}>{driverStatus.etaMinutes} minutes</strong> remaining in the delivery run.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : adminTab === "analytics" ? (
        <>
          {loadingAnalytics ? (
            <div className="analytics-loading">
              <div className="analytics-spinner"></div>
              <span>Analyzing order trends & generating forecasts...</span>
            </div>
          ) : analyticsError ? (
            <div className="pm-alert-error" style={{ padding: "20px", borderRadius: "8px", margin: "20px 0" }}>
              <span>{analyticsError}</span>
              <button 
                type="button" 
                className="btn-accent" 
                onClick={fetchAnalytics} 
                style={{ width: "auto", padding: "8px 16px", marginTop: "12px" }}
              >
                Retry Loading
              </button>
            </div>
          ) : analyticsData ? (
            <AnalyticsDashboard data={analyticsData} onRefresh={fetchAnalytics} />
          ) : null}
        </>
      ) : adminTab === "drivers" ? (
        <div className="admin-card" style={{ margin: 0, padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-dark)", letterSpacing: "-0.5px", margin: 0 }}>
              🚚 Delivery Driver Profiles & Approvals
            </h2>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ width: "auto", padding: "8px 16px", fontSize: "13px" }}
              onClick={fetchDrivers}
            >
              🔄 Refresh List
            </button>
          </div>
          
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
            Review new driver registrations, activate profiles, and view their current approval statuses. Drivers can only access their delivery dashboard after approval.
          </p>

          {driversError && (
            <div className="login-error-alert" style={{ marginBottom: "20px" }}>
              <span>{driversError}</span>
            </div>
          )}

          {loadingDrivers ? (
            <div className="analytics-loading" style={{ padding: "40px" }}>
              <div className="analytics-spinner"></div>
              <span>Loading driver accounts...</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {/* Section 1: Pending Approvals */}
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--warning)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  ⚠️ Pending Approvals ({drivers.filter(d => !d.isApproved).length})
                </h3>
                
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Driver Full Name</th>
                        <th>Contact Number</th>
                        <th>Base Address</th>
                        <th>Registered Date</th>
                        <th style={{ textAlign: "center", width: "160px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drivers.filter(d => !d.isApproved).length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center" style={{ color: "var(--text-muted)", padding: "32px" }}>
                            No pending driver registrations.
                          </td>
                        </tr>
                      ) : (
                        drivers.filter(d => !d.isApproved).map((driver) => (
                          <tr key={driver._id}>
                            <td style={{ fontWeight: "700" }}>{driver.username}</td>
                            <td style={{ fontWeight: "700", color: "var(--text-dark)" }}>{driver.name || "N/A"}</td>
                            <td>{driver.contact || "N/A"}</td>
                            <td>{driver.address || "N/A"}</td>
                            <td>{new Date(driver.createdAt).toLocaleDateString()}</td>
                            <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="btn-accent"
                                style={{ padding: "6px 12px", fontSize: "12px", width: "auto" }}
                                onClick={() => handleApproveDriver(driver._id)}
                              >
                                Approve Profile
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Active Drivers */}
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--success)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  ✓ Approved & Active Drivers ({drivers.filter(d => d.isApproved).length})
                </h3>
                
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Driver Full Name</th>
                        <th>Contact Number</th>
                        <th>Base Address</th>
                        <th>Approval Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drivers.filter(d => d.isApproved).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center" style={{ color: "var(--text-muted)", padding: "32px" }}>
                            No approved drivers found.
                          </td>
                        </tr>
                      ) : (
                        drivers.filter(d => d.isApproved).map((driver) => (
                          <tr key={driver._id}>
                            <td style={{ fontWeight: "700" }}>{driver.username}</td>
                            <td style={{ fontWeight: "700", color: "var(--text-dark)" }}>{driver.name || "N/A"}</td>
                            <td>{driver.contact || "N/A"}</td>
                            <td>{driver.address || "N/A"}</td>
                            <td>
                              <span className="badge badge-delivered" style={{ fontSize: "10px", padding: "4px 10px" }}>
                                Activated & Approved
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Detailed Order view popup modal */}
      {detailedOrder && (
        <div className="modal-overlay" onClick={() => setDetailedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1.5px solid #e2e8f0", paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-dark)", margin: 0 }}>
                Detailed View: Order #{detailedOrder.token}
              </h3>
              <button 
                type="button" 
                style={{ width: "auto", background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
                onClick={() => setDetailedOrder(null)}
              >
                ✖
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Customer Information */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: "var(--primary)", marginBottom: "8px", letterSpacing: "0.5px" }}>
                  Customer Information
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>Client Type</span>
                    <strong style={{ fontSize: "13px", color: "var(--text-dark)" }}>{detailedOrder.clientType}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>Name</span>
                    <strong style={{ fontSize: "13px", color: "var(--text-dark)" }}>
                      {(detailedOrder.clientType === "Retailer" ? detailedOrder.retailerName : detailedOrder.distributorName) || "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>Username</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-dark)" }}>{detailedOrder.username || "Anonymous"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>Contact Phone</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-dark)" }}>{detailedOrder.contact || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: "var(--primary)", marginBottom: "8px", letterSpacing: "0.5px" }}>
                  Delivery Logistics
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>Scheduled Date</span>
                      <strong style={{ fontSize: "13px", color: "var(--text-dark)" }}>{detailedOrder.deliveryDate || "N/A"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>Time Target Slot</span>
                      <strong style={{ fontSize: "13px", color: "var(--text-dark)" }}>{detailedOrder.deliveryTime || "N/A"}</strong>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600", marginTop: "4px" }}>Delivery Address</span>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-dark)" }}>{detailedOrder.location || detailedOrder.address || "N/A"}</span>
                  </div>
                  {detailedOrder.latitude && detailedOrder.longitude && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
                      <div>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "600" }}>GPS Linked Coordinates</span>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--success)" }}>{detailedOrder.latitude}, {detailedOrder.longitude}</span>
                      </div>
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        style={{ width: "auto", padding: "6px 12px", fontSize: "11px", fontWeight: "700" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps?q=${detailedOrder.latitude},${detailedOrder.longitude}`, "_blank");
                        }}
                      >
                        🗺️ Open Google Maps
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Summary Table */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: "var(--primary)", marginBottom: "8px", letterSpacing: "0.5px" }}>
                  Items Breakdown
                </h4>
                <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "none" }}>
                        <th style={{ background: "none", borderBottom: "1.5px solid #cbd5e1", padding: "6px 0", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>Package Description</th>
                        <th style={{ background: "none", borderBottom: "1.5px solid #cbd5e1", padding: "6px 0", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textAlign: "center" }}>Boxes</th>
                        <th style={{ background: "none", borderBottom: "1.5px solid #cbd5e1", padding: "6px 0", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textAlign: "right" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedOrder.oneL > 0 && (
                        <tr>
                          <td style={{ padding: "8px 0", fontSize: "13px", borderBottom: "1px solid #f1f5f9" }}>1 Litre Packs (12 / box)</td>
                          <td style={{ padding: "8px 0", fontSize: "13px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>{detailedOrder.oneL}</td>
                          <td style={{ padding: "8px 0", fontSize: "13px", textAlign: "right", borderBottom: "1px solid #f1f5f9", fontWeight: "700" }}>
                            ₹{(detailedOrder.oneL * (detailedOrder.clientType === "Retailer" ? prices.retailerOneLPrice : prices.distributorOneLPrice)).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      )}
                      {detailedOrder.fiveHundredML > 0 && (
                        <tr>
                          <td style={{ padding: "8px 0", fontSize: "13px", borderBottom: "1px solid #f1f5f9" }}>500ml Packs (24 / box)</td>
                          <td style={{ padding: "8px 0", fontSize: "13px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>{detailedOrder.fiveHundredML}</td>
                          <td style={{ padding: "8px 0", fontSize: "13px", textAlign: "right", borderBottom: "1px solid #f1f5f9", fontWeight: "700" }}>
                            ₹{(detailedOrder.fiveHundredML * (detailedOrder.clientType === "Retailer" ? prices.retailerFiveHundredMLPrice : prices.distributorFiveHundredMLPrice)).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      )}
                      {detailedOrder.twoHundredML > 0 && (
                        <tr>
                          <td style={{ padding: "8px 0", fontSize: "13px", borderBottom: "1px solid #f1f5f9" }}>200ml Packs (48 / box)</td>
                          <td style={{ padding: "8px 0", fontSize: "13px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>{detailedOrder.twoHundredML}</td>
                          <td style={{ padding: "8px 0", fontSize: "13px", textAlign: "right", borderBottom: "1px solid #f1f5f9", fontWeight: "700" }}>
                            ₹{(detailedOrder.twoHundredML * (detailedOrder.clientType === "Retailer" ? prices.retailerTwoHundredMLPrice : prices.distributorTwoHundredMLPrice)).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      )}
                      <tr style={{ fontWeight: "900" }}>
                        <td style={{ padding: "10px 0 0 0", fontSize: "13px", color: "var(--text-dark)" }}>Grand Bill Total</td>
                        <td style={{ padding: "10px 0 0 0" }}></td>
                        <td style={{ padding: "10px 0 0 0", fontSize: "16px", textAlign: "right", color: "var(--success)" }}>
                          ₹{(detailedOrder.total || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status and Placed Time */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
                <span>Ordered: {new Date(detailedOrder.createdAt).toLocaleString()}</span>
                <span className={`badge ${detailedOrder.status === "Delivered" ? "badge-delivered" : "badge-pending"}`}>
                  {detailedOrder.status}
                </span>
              </div>

              {/* Driver Assignment Section */}
              {detailedOrder.status !== "Delivered" && (
                <div style={{ marginTop: "20px", borderTop: "1.5px solid #f1f5f9", paddingTop: "16px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "var(--primary)", textTransform: "uppercase", marginBottom: "8px" }}>
                    🚚 Assign Delivery Driver
                  </label>
                  <select
                    value={detailedOrder.assignedDriverId || ""}
                    onChange={async (e) => {
                      const selectedDriverId = e.target.value;
                      try {
                        await axios.put("https://smart-water-distribution-5.onrender.com/orders/assign", {
                          orderIds: [detailedOrder._id],
                          driverId: selectedDriverId || null
                        });
                        
                        // Update active order's driver in state to reflect in modal immediately
                        const updatedDriver = activeDrivers.find(d => d._id === selectedDriverId);
                        setDetailedOrder({
                          ...detailedOrder,
                          assignedDriverId: selectedDriverId || null,
                          assignedDriverName: updatedDriver ? (updatedDriver.name || updatedDriver.username) : ""
                        });
                        
                        fetchOrders();
                      } catch (err) {
                        console.error("Error assigning driver:", err);
                        alert("Failed to assign driver.");
                      }
                    }}
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "13px", width: "100%", outline: "none", fontWeight: "600", cursor: "pointer", background: "white" }}
                  >
                    <option value="">Unassigned (HQ Pickup / Self Delivery)</option>
                    {activeDrivers.map(d => (
                      <option key={d._id} value={d._id}>{d.name || d.username}</option>
                    ))}
                  </select>
                </div>
              )}

            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
              {detailedOrder.status === "Pending" ? (
                <button 
                  type="button" 
                  className="btn-success" 
                  style={{ width: "auto", padding: "10px 20px", fontWeight: "700" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deliverOrder(detailedOrder._id);
                    setDetailedOrder(null);
                  }}
                >
                  ✓ Mark Delivered
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn-accent" 
                  style={{ width: "auto", padding: "10px 20px", fontWeight: "700" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrder(detailedOrder);
                    setDetailedOrder(null);
                  }}
                >
                  📄 View Invoice Receipt
                </button>
              )}
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ width: "auto", padding: "10px 20px" }}
                onClick={() => setDetailedOrder(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal Overlay */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "18px", color: "var(--text-dark)", letterSpacing: "-0.5px" }}>Tax Invoice Receipt</h3>
            
            <div className="receipt">
              <div className="receipt-title">AquaFlow WDS</div>
              <div style={{ textAlign: "center", fontSize: "11px", color: "#64748b", marginBottom: "12px" }}>
                Water Distribution Network Ltd.<br />
                Receipt No: {selectedOrder.receiptNo || `RC${1000 + selectedOrder.token}`}<br />
                Date Issued: {new Date(selectedOrder.createdAt).toLocaleDateString()}
              </div>
              <div className="receipt-divider"></div>
              
              <div className="receipt-row"><span style={{ color: "#64748b" }}>Client Type:</span><span>{selectedOrder.clientType || "Distributor"}</span></div>
              <div className="receipt-row"><span style={{ color: "#64748b" }}>Client Name:</span><span style={{ fontWeight: "700" }}>{(selectedOrder.clientType === "Retailer" ? selectedOrder.retailerName : selectedOrder.distributorName) || "-"}</span></div>
              <div className="receipt-row"><span style={{ color: "#64748b" }}>Contact No:</span><span>{selectedOrder.contact || "-"}</span></div>
              <div className="receipt-row"><span style={{ color: "#64748b" }}>Delivery Address:</span><span style={{ maxWidth: "240px", textAlign: "right" }}>{selectedOrder.location || selectedOrder.address || "-"}</span></div>
              
              <div className="receipt-divider"></div>
              <div style={{ fontSize: "12px", fontWeight: "800", marginBottom: "8px", letterSpacing: "0.5px" }}>ORDERED BOTTLES</div>
              {selectedOrder.oneL > 0 && (
                <div className="receipt-row">
                  <span>1L Package ({selectedOrder.oneL} boxes)</span>
                  <span>
                    Price: ₹{(selectedOrder.oneL * (selectedOrder.clientType === "Retailer" ? prices.retailerOneLPrice : prices.distributorOneLPrice)).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {selectedOrder.fiveHundredML > 0 && (
                <div className="receipt-row">
                  <span>500ml Package ({selectedOrder.fiveHundredML} boxes)</span>
                  <span>
                    Price: ₹{(selectedOrder.fiveHundredML * (selectedOrder.clientType === "Retailer" ? prices.retailerFiveHundredMLPrice : prices.distributorFiveHundredMLPrice)).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {selectedOrder.twoHundredML > 0 && (
                <div className="receipt-row">
                  <span>200ml Package ({selectedOrder.twoHundredML} boxes)</span>
                  <span>
                    Price: ₹{(selectedOrder.twoHundredML * (selectedOrder.clientType === "Retailer" ? prices.retailerTwoHundredMLPrice : prices.distributorTwoHundredMLPrice)).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              
              <div className="receipt-divider"></div>
              <div className="receipt-row bold"><span>GRAND TOTAL (PAID)</span><span>₹{(selectedOrder.total).toLocaleString("en-IN")}</span></div>
              <div className="receipt-divider"></div>
              <div style={{ textAlign: "center", fontSize: "10px", color: "var(--success)", fontWeight: "700", marginTop: "6px" }}>
                ✓ PAYMENT COMPLETED VIA WALLET/FIFO TRANSACTION
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" className="btn-primary" onClick={() => window.print()}>
                Print Invoice
              </button>
              <button type="button" className="btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsDashboard({ data, onRefresh }) {
  const lineChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const barChartRef = useRef(null);

  const lineChartInstance = useRef(null);
  const doughnutChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    if (!data) return;

    if (lineChartInstance.current) lineChartInstance.current.destroy();
    if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
    if (barChartInstance.current) barChartInstance.current.destroy();

    // 1. Line Chart: Volume & Revenue Trend
    if (lineChartRef.current) {
      const labels = data.dailyTrend.map(d => {
        const dateObj = new Date(d.date);
        return dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      });
      const volumeData = data.dailyTrend.map(d => d.volume);
      const revenueData = data.dailyTrend.map(d => d.revenue);

      const ctx = lineChartRef.current.getContext("2d");
      lineChartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Volume (Ltr)",
              data: volumeData,
              borderColor: "#0284c7",
              backgroundColor: "rgba(2, 132, 199, 0.1)",
              borderWidth: 3,
              tension: 0.3,
              fill: true,
              yAxisID: "yVolume",
            },
            {
              label: "Revenue (₹)",
              data: revenueData,
              borderColor: "#16a34a",
              backgroundColor: "rgba(22, 163, 74, 0.05)",
              borderWidth: 2,
              tension: 0.3,
              fill: false,
              borderDash: [5, 5],
              yAxisID: "yRevenue",
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top", labels: { font: { weight: "600", family: "Inter" } } }
          },
          scales: {
            yVolume: {
              type: "linear",
              position: "left",
              title: { display: true, text: "Volume (Litres)", font: { weight: "600", family: "Inter" } },
              grid: { drawOnChartArea: true }
            },
            yRevenue: {
              type: "linear",
              position: "right",
              title: { display: true, text: "Revenue (₹)", font: { weight: "600", family: "Inter" } },
              grid: { drawOnChartArea: false }
            }
          }
        }
      });
    }

    // 2. Doughnut Chart: Product Mix Share
    if (doughnutChartRef.current) {
      const ctx = doughnutChartRef.current.getContext("2d");
      doughnutChartInstance.current = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["1 Litre", "500ml", "200ml"],
          datasets: [{
            data: [
              data.productMix.oneL,
              data.productMix.fiveHundredML,
              data.productMix.twoHundredML
            ],
            backgroundColor: ["#1e3a8a", "#06b6d4", "#f59e0b"],
            borderWidth: 2,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { font: { weight: "600", family: "Inter" } } }
          }
        }
      });
    }

    // 3. Bar Chart: Peak Hours
    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext("2d");
      const labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);
      const counts = data.hourlyData.map(h => h.count);

      barChartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Orders Placed",
            data: counts,
            backgroundColor: "rgba(6, 182, 212, 0.85)",
            hoverBackgroundColor: "#06b6d4",
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 },
              title: { display: true, text: "Orders Count", font: { weight: "600", family: "Inter" } }
            },
            x: {
              title: { display: true, text: "Hour of Day", font: { weight: "600", family: "Inter" } }
            }
          }
        }
      });
    }

    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy();
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, [data]);

  const recommendedPrepText = () => {
    const f = data.forecast;
    if (f.forecastOneL === 0 && f.forecastFiveHundredML === 0 && f.forecastTwoHundredML === 0) {
      return "No current order patterns detected. Maintain baseline buffer stock levels.";
    }
    return `Based on the rolling 7-day average, we recommend preparing/bottling at least ${f.forecastOneL} boxes of 1L, ${f.forecastFiveHundredML} boxes of 500ml, and ${f.forecastTwoHundredML} boxes of 200ml to fulfill expected demand for the upcoming week.`;
  };

  return (
    <div className="analytics-section">
      {/* Analytics KPI row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">7-Day Total Literage</div>
          <div className="metric-value">
            {data.metrics.totalLiters.toLocaleString("en-IN")} <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Litres</span>
          </div>
          <div className="metric-progress-bg">
            <div className="metric-progress-bar" style={{ width: "100%" }}></div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-title">Top Selling Size</div>
          <div className="metric-value" style={{ fontSize: "24px", paddingTop: "8px" }}>
            {data.metrics.topProduct}
          </div>
          <div className="metric-progress-bg">
            <div className="metric-progress-bar" style={{ width: "100%" }}></div>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-title">Peak Order Window</div>
          <div className="metric-value" style={{ fontSize: "20px", paddingTop: "12px" }}>
            {data.metrics.peakHour}
          </div>
          <div className="metric-progress-bg">
            <div className="metric-progress-bar" style={{ width: "100%" }}></div>
          </div>
        </div>

        <div className="metric-card cyan">
          <div className="metric-title">Next Week Forecast</div>
          <div className="metric-value">
            {data.forecast.forecastVolume.toLocaleString("en-IN")} <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Ltr</span>
          </div>
          <div className="metric-progress-bg">
            <div className="metric-progress-bar" style={{ width: "100%" }}></div>
          </div>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="analytics-charts-grid">
        <div className="chart-card">
          <h4 className="chart-card-title">
            📊 Volume & Revenue Trends (Last 7 Days)
          </h4>
          <div className="chart-wrapper">
            <canvas ref={lineChartRef}></canvas>
          </div>
        </div>

        <div className="chart-card">
          <h4 className="chart-card-title">
            🍩 Product Share Mix (Boxes Ordered)
          </h4>
          <div className="chart-wrapper">
            <canvas ref={doughnutChartRef}></canvas>
          </div>
        </div>

        <div className="chart-card" style={{ gridColumn: "span 2" }}>
          <h4 className="chart-card-title">
            ⏰ Order Window Peak Dispatch Times (24h)
          </h4>
          <div className="chart-wrapper" style={{ height: "300px" }}>
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Forecasting and Stock Preparation Table */}
      <div className="admin-card" style={{ margin: 0, padding: "28px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px", color: "var(--text-dark)" }}>
          🔮 7-Day Rolling Demand Forecast & Stock Preparation Guide
        </h3>

        <div className="info-alert-blue" style={{ marginBottom: "24px" }}>
          <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong>Automated Inventory Recommendation:</strong><br />
            {recommendedPrepText()}
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Water Package Size</th>
                <th>Avg. Daily Boxes Sold (7 Days)</th>
                <th>Suggested Stock Prep (Next 7 Days)</th>
                <th>Fulfillment Priority</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: "700" }}>1 Litre Packs (12 / box)</td>
                <td>{data.forecast.avgOneL} boxes</td>
                <td style={{ fontWeight: "800", color: "var(--primary)" }}>{data.forecast.forecastOneL} boxes</td>
                <td>
                  <span className={`badge ${data.forecast.forecastOneL > 10 ? "badge-pending" : "badge-delivered"}`} style={{ fontSize: "10px" }}>
                    {data.forecast.forecastOneL > 10 ? "High Priority" : "Standard"}
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: "700" }}>500ml Packs (24 / box)</td>
                <td>{data.forecast.avgFiveHundredML} boxes</td>
                <td style={{ fontWeight: "800", color: "var(--accent-cyan)" }}>{data.forecast.forecastFiveHundredML} boxes</td>
                <td>
                  <span className={`badge ${data.forecast.forecastFiveHundredML > 10 ? "badge-pending" : "badge-delivered"}`} style={{ fontSize: "10px" }}>
                    {data.forecast.forecastFiveHundredML > 10 ? "High Priority" : "Standard"}
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: "700" }}>200ml Packs (48 / box)</td>
                <td>{data.forecast.avgTwoHundredML} boxes</td>
                <td style={{ fontWeight: "800", color: "var(--text-dark)" }}>{data.forecast.forecastTwoHundredML} boxes</td>
                <td>
                  <span className={`badge ${data.forecast.forecastTwoHundredML > 10 ? "badge-pending" : "badge-delivered"}`} style={{ fontSize: "10px" }}>
                    {data.forecast.forecastTwoHundredML > 10 ? "High Priority" : "Standard"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;