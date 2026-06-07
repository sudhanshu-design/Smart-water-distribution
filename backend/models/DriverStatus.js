const mongoose = require("mongoose");

const DriverStatusSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  driverName: {
    type: String,
    default: ""
  },
  isActive: {
    type: Boolean,
    default: false
  },
  currentLatitude: {
    type: Number,
    default: 0
  },
  currentLongitude: {
    type: Number,
    default: 0
  },
  routePoints: {
    type: Array, // Array of [lat, lng] pairs representing the simulated movement track
    default: []
  },
  currentStopIndex: {
    type: Number,
    default: 0
  },
  currentPointIndex: {
    type: Number,
    default: 0
  },
  stopOrders: {
    type: [String], // Array of sorted Order IDs corresponding to the dispatch route stops
    default: []
  },
  etaMinutes: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("DriverStatus", DriverStatusSchema);
