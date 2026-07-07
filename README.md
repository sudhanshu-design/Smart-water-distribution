# 💧 AquaFlow WDS — Smart Water Distribution System

AquaFlow WDS is an enterprise-grade water supply chain management and logistics optimization platform. Designed as a complete end-to-end solution, it coordinates distributors, retailers, warehouse administrators, and delivery boy fleets in real-time. 

The system leverages modern web technologies to solve real-world distribution problems, including nearest-neighbor route optimization (Traveling Salesperson Problem), live GPS vehicle tracking, predictive analytics for demand forecasting, dynamic product catalog management, and profile approval gates.

---

## 🚀 Key Modules & Features

### 🏢 1. Administrator Dashboard
- **Dynamic Price Configuration**: Configure separate prices for distributors and retailers on all packaging sizes (1L, 500ml, 200ml).
- **Dynamic Product Image Customization**: Upload custom images for products directly from the admin UI to dynamically update product cards in distributor and retailer order catalogs.
- **Fleets & Approvals Manager**: Gated driver registration approval screen where Admins review, activate, or suspend delivery driver accounts.
- **Dispatch Queue**: Review orders, manage inventory prep, and assign specific pending orders to active, approved delivery drivers.
- **Route Optimization Simulator**: Resolves shortest-path routing (nearest-neighbor TSP) from the Warehouse HQ through all pending coordinates, displaying animated real-time vehicle dispatching.

### 🚚 2. Delivery Driver Portal
- **Independent Registration & Login**: Drivers register their own accounts. Access to the dashboard is blocked until the Admin approves their profile.
- **Stops & Load Out Checklist**: Displays a sequential checklist of assigned orders, contact numbers, shipping addresses, and carton load-out specifications (quantity of 1L / 500ml / 200ml).
- **Interactive Routing Map**: Integrated Leaflet map showing Warehouse HQ, scheduled delivery stops, the optimized route polyline, and their simulated vehicle position.
- **Milestone Actions**: Drivers trigger route starts and manually mark stops as **Arrived** or **Delivered** to advance order states in real-time.

### 📦 3. Distributor & Retailer Order Portals
- **Interactive Product Catalog**: View box price listings and custom product images configured by the Admin. Add cartons to a checkout cart to place new orders.
- **5-Step Stepper Timeline**: Real-time delivery progress updates displaying exact order milestones:
  1. **Order Placed**: Added to the dispatch queue.
  2. **Driver Assigned**: Displays the assigned driver's name and contact number.
  3. **Out for Delivery**: Driver has loaded cargo and started the delivery run.
  4. **Arrived**: Driver has arrived at the store location.
  5. **Delivered**: Digital receipt issued and order marked as paid.
- **Live Vehicle Tracking Map**: Displays an active Leaflet navigation map showing the driver's current simulated coordinates moving towards their location.

### 📊 4. Analytics & Demand Forecasting
- **Visual Analytics Charts**: Real-time sales metrics, product mix shares, and peak dispatch hour indicators generated via Chart.js.
- **7-Day Demand Forecasting**: Employs a rolling average forecast model to predict next week's inventory requirements per package size, helping administrators prepare inventory and avoid stockout bottlenecks.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Leaflet (interactive mapping), Chart.js (analytics rendering), Axios (API client), HTML5, CSS3 (vanilla variable-driven clean design system).
- **Backend**: Node.js, Express.js (RESTful endpoints), MongoDB + Mongoose (object data modeling).
- **Tooling**: Nodemon (development automatic server reloading), JWT (JSON Web Tokens authentication), bcrypt.js (secure password hashing).

---

## 📁 Repository Directory Structure

```
water distribution system/
├── README.md                  # Main project overview & documentation (This File)
├── backend/
│   ├── models/                # Mongoose Database Schemas (User, Order, PriceConfig, DriverStatus)
│   ├── routes/                # API Endpoints (authRoutes, orderRoutes)
│   ├── server.js              # Server bootstrapper and DB connection config
│   └── package.json           # Backend dependency configuration
└── frontend/
    ├── public/                # Static assets (images, logos, HTML index template)
    ├── src/
    │   ├── pages/             # Portal views (LoginPage, SignupPage, AdminPage, DriverPage, OrderPage, RetailerPage)
    │   ├── App.js             # Route/view manager
    │   ├── index.js           # Frontend entry point
    │   ├── App.css            # Component-level styles
    │   └── index.css          # Theme CSS variables and design tokens
    └── package.json           # React frontend configuration
```

---

## 🚀 Setup & Installation

### Prerequisite Setup
Ensure you have [Node.js](https://nodejs.org/) (v16+) and [MongoDB](https://www.mongodb.com/) running locally on your system.

### 🔌 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` root directory and add the environment variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/aquaflow
   JWT_SECRET=aquaflow_secret_key_123
   ```
4. Start the server (runs on `https://smart-water-distribution-5.onrender.com` with nodemon auto-restart enabled):
   ```bash
   npm start
   ```

### 💻 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the React development web server (runs on `http://localhost:3000`):
   ```bash
   npm start
   ```

---

## 🔐 Seeding & Testing Credentials

The system automatically seeds a default system administrator profile in the database on initial boot for test evaluations:

- **Role**: Admin
- **Username**: `admin`
- **Password**: `admin123`

To test the multi-driver delivery simulation workflow:
1. Register a new driver via the signup page.
2. Log in with the static Admin credentials, go to **Drivers & Approvals**, and activate the driver's profile.
3. Log in as a Retailer or Distributor, configure your profile coordinates, and place an order.
4. Go back to the Admin Dashboard and assign the pending order to the driver.
5. Log in as the Driver to start the route dispatch and advance stops through transit milestones!
