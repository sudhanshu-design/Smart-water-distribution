const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "aquaflow_secret_key_123";

// REGISTER ROUTE
router.post("/register", async (req, res) => {
  try {
    const { username, password, role, name, contact, address } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "Username, password and role are required." });
    }

    if (!["Distributor", "Retailer", "Admin", "Driver"].includes(role)) {
      return res.status(400).json({ message: "Invalid role selected." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    // Create new user (password is hashed automatically via pre-save middleware)
    const user = new User({
      username: username.toLowerCase(),
      password,
      role,
      name,
      contact,
      address,
      isApproved: role !== "Driver"
    });

    await user.save();

    // Auto-associate previous anonymous orders with this new user
    try {
      const Order = require("../models/Order");
      const fallbackConditions = [];
      if (contact && contact.trim()) {
        fallbackConditions.push({ contact: contact.trim() });
      }
      if (name && name.trim()) {
        const escapedName = name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        if (role === "Distributor") {
          fallbackConditions.push({ distributorName: { $regex: new RegExp("^" + escapedName + "$", "i") } });
        } else if (role === "Retailer") {
          fallbackConditions.push({ retailerName: { $regex: new RegExp("^" + escapedName + "$", "i") } });
        }
      }
      if (fallbackConditions.length > 0) {
        await Order.updateMany(
          {
            $or: [{ username: "" }, { username: { $exists: false } }],
            $or: fallbackConditions
          },
          {
            $set: { username: username.toLowerCase() }
          }
        );
      }
    } catch (err) {
      console.error("Auto-association of orders failed:", err);
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        contact: user.contact,
        address: user.address
      }
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Special admin bypass for initial dashboard login if not registered
    if (role === "Admin" && username.toLowerCase() === "admin" && password === "admin123") {
      const token = jwt.sign({ id: "admin_static", role: "Admin" }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({
        token,
        user: {
          username: "admin",
          role: "Admin",
          name: "System Administrator"
        }
      });
    }

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Check role matches
    if (user.role !== role) {
      return res.status(400).json({ message: `User is not registered as a ${role}.` });
    }

    // Check if Driver is approved
    if (user.role === "Driver" && !user.isApproved) {
      return res.status(400).json({ message: "Your driver account is pending Admin approval." });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        contact: user.contact,
        address: user.address
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// UPDATE PROFILE ROUTE
router.put("/update-profile/:id", async (req, res) => {
  try {
    const { name, contact, address } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (name !== undefined) user.name = name;
    if (contact !== undefined) user.contact = contact;
    if (address !== undefined) user.address = address;

    await user.save();

    // Auto-associate previous anonymous orders with this user on profile update
    try {
      const Order = require("../models/Order");
      const fallbackConditions = [];
      if (user.contact && user.contact.trim()) {
        fallbackConditions.push({ contact: user.contact.trim() });
      }
      if (user.name && user.name.trim()) {
        const escapedName = user.name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        if (user.role === "Distributor") {
          fallbackConditions.push({ distributorName: { $regex: new RegExp("^" + escapedName + "$", "i") } });
        } else if (user.role === "Retailer") {
          fallbackConditions.push({ retailerName: { $regex: new RegExp("^" + escapedName + "$", "i") } });
        }
      }
      if (fallbackConditions.length > 0) {
        await Order.updateMany(
          {
            $or: [{ username: "" }, { username: { $exists: false } }],
            $or: fallbackConditions
          },
          {
            $set: { username: user.username }
          }
        );
      }
    } catch (err) {
      console.error("Auto-association of orders on update failed:", err);
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        contact: user.contact,
        address: user.address
      }
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET all drivers (for Admin)
router.get("/drivers", async (req, res) => {
  try {
    const drivers = await User.find({ role: "Driver" }).sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT approve driver (for Admin)
router.put("/drivers/approve/:id", async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== "Driver") {
      return res.status(404).json({ message: "Driver not found." });
    }
    driver.isApproved = true;
    await driver.save();
    res.json({ message: "Driver approved successfully.", driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET active/approved drivers (for assignment dropdown)
router.get("/drivers/active", async (req, res) => {
  try {
    const activeDrivers = await User.find({ role: "Driver", isApproved: true }).sort({ name: 1 });
    res.json(activeDrivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
