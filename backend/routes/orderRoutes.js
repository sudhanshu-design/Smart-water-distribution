const express=
require("express");

const router=
express.Router();

const Order=
require("../models/order");

const PriceConfig = require("../models/PriceConfig");
const DriverStatus = require("../models/DriverStatus");

let driverIntervals = {};
const HQ = { latitude: 12.9715987, longitude: 77.5945627 };

function getDistance(p1, p2) {
  const dx = p1.latitude - p2.latitude;
  const dy = p1.longitude - p2.longitude;
  return Math.sqrt(dx * dx + dy * dy);
}

function optimizeTSP(ordersList) {
  const unvisited = [...ordersList];
  const sorted = [];
  let current = HQ;

  while (unvisited.length > 0) {
    let nearestIdx = -1;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = getDistance(current, unvisited[i]);
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

  return sorted;
}

function interpolatePoints(from, to, steps = 10) {
  const points = [];
  for (let i = 1; i <= steps; i++) {
    const lat = from.latitude + (to.latitude - from.latitude) * (i / steps);
    const lng = from.longitude + (to.longitude - from.longitude) * (i / steps);
    points.push([lat, lng]);
  }
  return points;
}

router.post(

"/create",

async(req,res)=>{

try{

const lastOrder=

await Order.findOne()

.sort({

token:-1

});

const token=

lastOrder

?

lastOrder.token+1

:

1;

const order=

new Order({

username:
req.body.username||"",

clientType:
req.body.clientType||"Distributor",

distributorName:
req.body.distributorName||"",

retailerName:
req.body.retailerName||"",

contact:
req.body.contact,

address:
req.body.address,

location:
req.body.location,

deliveryDate:
req.body.deliveryDate,

deliveryTime:
req.body.deliveryTime,

latitude:
Number(req.body.latitude)||0,

longitude:
Number(req.body.longitude)||0,

oneL:
Number(req.body.oneL)||0,

fiveHundredML:
Number(req.body.fiveHundredML)||0,

twoHundredML:
Number(req.body.twoHundredML)||0,

total:
Number(req.body.total)||0,

token

});

await order.save();

res.json({

message:
"Order Added",

token

});

}

catch(error){

console.log(error);

res.status(500)

.json({

message:
error.message

});

}

}

);

router.get(

"/fifo",

async(req,res)=>{

try{

const orders=

await Order.find()

.sort({

token:1

});

res.json(

orders

);

}

catch(error){

res.status(500)

.json({

message:
error.message

});

}

}

);

router.put(

"/process/:id",

async(req,res)=>{

try{

const order=

await Order.findById(

req.params.id

);

order.status=

"Delivered";

order.paymentStatus=

"Paid";

order.receiptNo=

"RC"+

(

1000+

order.token

);

await order.save();

res.json(

order

);

}

catch(error){

res.status(500)

.json({

message:
error.message

});

}

}

);

router.get(
  "/user/:username",
  async (req, res) => {
    try {
      const usernameLower = req.params.username.toLowerCase();
      const User = require("../models/User");
      
      const user = await User.findOne({ username: usernameLower });
      let query = { username: usernameLower };
      
      if (user) {
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
          query = {
            $or: [
              { username: usernameLower },
              {
                $and: [
                  { $or: [{ username: "" }, { username: { $exists: false } }] },
                  { $or: fallbackConditions }
                ]
              }
            ]
          };
        }
      }
      
      const orders = await Order.find(query).sort({ token: -1 });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET analytics dashboard metrics
router.get("/analytics", async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      createdAt: { $gte: sevenDaysAgo }
    });

    // 1. Daily trend (last 7 days filled with zeros if empty)
    const dailyDataMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      dailyDataMap[dateString] = { date: dateString, volume: 0, revenue: 0, count: 0 };
    }

    // 2. Hourly analysis
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));

    // 3. Product mix share
    let totalOneL = 0;
    let totalFiveHundredML = 0;
    let totalTwoHundredML = 0;

    orders.forEach(o => {
      const dateStr = new Date(o.createdAt).toISOString().split("T")[0];
      const vol = (o.oneL || 0) * 12 + (o.fiveHundredML || 0) * 12 + (o.twoHundredML || 0) * 9.6;

      if (dailyDataMap[dateStr]) {
        dailyDataMap[dateStr].volume += vol;
        dailyDataMap[dateStr].revenue += (o.total || 0);
        dailyDataMap[dateStr].count += 1;
      }

      const hour = new Date(o.createdAt).getHours();
      if (hour >= 0 && hour < 24) {
        hourlyData[hour].count += 1;
      }

      totalOneL += (o.oneL || 0);
      totalFiveHundredML += (o.fiveHundredML || 0);
      totalTwoHundredML += (o.twoHundredML || 0);
    });

    const dailyTrend = Object.values(dailyDataMap).sort((a, b) => a.date.localeCompare(b.date));

    // 4. Forecasting (rolling averages)
    const avgOneL = Number((totalOneL / 7).toFixed(1));
    const avgFiveHundredML = Number((totalFiveHundredML / 7).toFixed(1));
    const avgTwoHundredML = Number((totalTwoHundredML / 7).toFixed(1));

    const forecastOneL = Math.ceil(avgOneL * 7);
    const forecastFiveHundredML = Math.ceil(avgFiveHundredML * 7);
    const forecastTwoHundredML = Math.ceil(avgTwoHundredML * 7);
    const forecastVolume = (forecastOneL * 12) + (forecastFiveHundredML * 12) + (forecastTwoHundredML * 9.6);

    let peakHour = 0;
    let peakCount = 0;
    hourlyData.forEach(h => {
      if (h.count > peakCount) {
        peakCount = h.count;
        peakHour = h.hour;
      }
    });

    const peakHourStr = peakCount > 0 
      ? `${peakHour.toString().padStart(2, "0")}:00 - ${(peakHour + 1).toString().padStart(2, "0")}:00` 
      : "No dispatch data";

    let topProduct = "1 Litre Packs";
    const maxVal = Math.max(totalOneL, totalFiveHundredML, totalTwoHundredML);
    if (maxVal === totalFiveHundredML && totalFiveHundredML > 0) {
      topProduct = "500ml Packs";
    } else if (maxVal === totalTwoHundredML && totalTwoHundredML > 0) {
      topProduct = "200ml Packs";
    } else if (maxVal === 0) {
      topProduct = "No Sales Yet";
    }

    res.json({
      dailyTrend,
      hourlyData,
      productMix: {
        oneL: totalOneL,
        fiveHundredML: totalFiveHundredML,
        twoHundredML: totalTwoHundredML
      },
      forecast: {
        avgOneL,
        avgFiveHundredML,
        avgTwoHundredML,
        forecastOneL,
        forecastFiveHundredML,
        forecastTwoHundredML,
        forecastVolume
      },
      metrics: {
        peakHour: peakHourStr,
        peakCount,
        topProduct,
        totalLiters: Number(dailyTrend.reduce((sum, d) => sum + d.volume, 0).toFixed(1))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET current prices
router.get("/prices", async (req, res) => {
  try {
    let config = await PriceConfig.findOne();
    if (!config) {
      config = new PriceConfig();
      await config.save();
    } else {
      let updated = false;
      if (config.distributorOneLPrice === undefined || config.distributorOneLPrice === null) {
        config.distributorOneLPrice = 90;
        updated = true;
      }
      if (config.distributorFiveHundredMLPrice === undefined || config.distributorFiveHundredMLPrice === null) {
        config.distributorFiveHundredMLPrice = 105;
        updated = true;
      }
      if (config.distributorTwoHundredMLPrice === undefined || config.distributorTwoHundredMLPrice === null) {
        config.distributorTwoHundredMLPrice = 160;
        updated = true;
      }
      if (config.retailerOneLPrice === undefined || config.retailerOneLPrice === null) {
        config.retailerOneLPrice = 90;
        updated = true;
      }
      if (config.retailerFiveHundredMLPrice === undefined || config.retailerFiveHundredMLPrice === null) {
        config.retailerFiveHundredMLPrice = 105;
        updated = true;
      }
      if (config.retailerTwoHundredMLPrice === undefined || config.retailerTwoHundredMLPrice === null) {
        config.retailerTwoHundredMLPrice = 160;
        updated = true;
      }
      if (config.oneLImage === undefined || config.oneLImage === null) {
        config.oneLImage = "";
        updated = true;
      }
      if (config.fiveHundredMLImage === undefined || config.fiveHundredMLImage === null) {
        config.fiveHundredMLImage = "";
        updated = true;
      }
      if (config.twoHundredMLImage === undefined || config.twoHundredMLImage === null) {
        config.twoHundredMLImage = "";
        updated = true;
      }
      if (updated) {
        await config.save();
      }
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update prices
router.put("/prices", async (req, res) => {
  try {
    const { 
      distributorOneLPrice, 
      distributorFiveHundredMLPrice, 
      distributorTwoHundredMLPrice,
      retailerOneLPrice,
      retailerFiveHundredMLPrice,
      retailerTwoHundredMLPrice,
      oneLImage,
      fiveHundredMLImage,
      twoHundredMLImage
    } = req.body;
    
    let config = await PriceConfig.findOne();
    if (!config) {
      config = new PriceConfig();
    }
    
    if (config.distributorOneLPrice === undefined || config.distributorOneLPrice === null) config.distributorOneLPrice = 90;
    if (config.distributorFiveHundredMLPrice === undefined || config.distributorFiveHundredMLPrice === null) config.distributorFiveHundredMLPrice = 105;
    if (config.distributorTwoHundredMLPrice === undefined || config.distributorTwoHundredMLPrice === null) config.distributorTwoHundredMLPrice = 160;
    if (config.retailerOneLPrice === undefined || config.retailerOneLPrice === null) config.retailerOneLPrice = 90;
    if (config.retailerFiveHundredMLPrice === undefined || config.retailerFiveHundredMLPrice === null) config.retailerFiveHundredMLPrice = 105;
    if (config.retailerTwoHundredMLPrice === undefined || config.retailerTwoHundredMLPrice === null) config.retailerTwoHundredMLPrice = 160;
    if (config.oneLImage === undefined || config.oneLImage === null) config.oneLImage = "";
    if (config.fiveHundredMLImage === undefined || config.fiveHundredMLImage === null) config.fiveHundredMLImage = "";
    if (config.twoHundredMLImage === undefined || config.twoHundredMLImage === null) config.twoHundredMLImage = "";

    if (distributorOneLPrice !== undefined) config.distributorOneLPrice = Number(distributorOneLPrice);
    if (distributorFiveHundredMLPrice !== undefined) config.distributorFiveHundredMLPrice = Number(distributorFiveHundredMLPrice);
    if (distributorTwoHundredMLPrice !== undefined) config.distributorTwoHundredMLPrice = Number(distributorTwoHundredMLPrice);
    
    if (retailerOneLPrice !== undefined) config.retailerOneLPrice = Number(retailerOneLPrice);
    if (retailerFiveHundredMLPrice !== undefined) config.retailerFiveHundredMLPrice = Number(retailerFiveHundredMLPrice);
    if (retailerTwoHundredMLPrice !== undefined) config.retailerTwoHundredMLPrice = Number(retailerTwoHundredMLPrice);
    
    if (oneLImage !== undefined) config.oneLImage = oneLImage;
    if (fiveHundredMLImage !== undefined) config.fiveHundredMLImage = fiveHundredMLImage;
    if (twoHundredMLImage !== undefined) config.twoHundredMLImage = twoHundredMLImage;

    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /orders/assign - Assign orders to a driver
router.put("/assign", async (req, res) => {
  try {
    const { orderIds, driverId } = req.body;
    if (!driverId) {
      await Order.updateMany(
        { _id: { $in: orderIds } },
        { $set: { assignedDriverId: null, assignedDriverName: "", status: "Pending" } }
      );
      return res.json({ message: "Orders unassigned successfully." });
    }

    const User = require("../models/User");
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== "Driver") {
      return res.status(404).json({ message: "Driver not found." });
    }

    await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { assignedDriverId: driver._id, assignedDriverName: driver.name || driver.username, status: "Driver Assigned" } }
    );

    res.json({ message: `Successfully assigned ${orderIds.length} orders to ${driver.name || driver.username}.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /orders/status/:id - Update order status (Driver Page)
router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    order.status = status;
    if (status === "Delivered") {
      order.paymentStatus = "Paid";
      order.receiptNo = "RC" + (1000 + order.token);
    }
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /driver/start - Start simulation for a driver
router.post("/driver/start", async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!driverId) {
      return res.status(400).json({ message: "Driver ID is required." });
    }

    const User = require("../models/User");
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== "Driver") {
      return res.status(404).json({ message: "Driver profile not found." });
    }

    const pendingOrders = await Order.find({ status: { $in: ["Pending", "Arrived"] }, assignedDriverId: driverId });
    const ordersWithCoords = pendingOrders.filter(
      o => o.latitude && o.longitude && o.latitude !== 0 && o.longitude !== 0
    );

    if (ordersWithCoords.length === 0) {
      return res.status(400).json({ message: "No pending orders with coordinates assigned to this driver." });
    }

    const sortedOrders = optimizeTSP(ordersWithCoords);

    // Build the route coordinates track
    const routePoints = [[HQ.latitude, HQ.longitude]];
    let prev = HQ;
    for (let i = 0; i < sortedOrders.length; i++) {
      const next = sortedOrders[i];
      const interpolated = interpolatePoints(prev, next, 10);
      routePoints.push(...interpolated);
      prev = next;
    }
    // Return to HQ
    const returnInterpolated = interpolatePoints(prev, HQ, 10);
    routePoints.push(...returnInterpolated);

    let statusObj = await DriverStatus.findOne({ driverId });
    if (!statusObj) {
      statusObj = new DriverStatus({ driverId, driverName: driver.name || driver.username });
    }
    statusObj.isActive = true;
    statusObj.driverName = driver.name || driver.username;
    statusObj.currentLatitude = HQ.latitude;
    statusObj.currentLongitude = HQ.longitude;
    statusObj.routePoints = routePoints;
    statusObj.currentPointIndex = 0;
    statusObj.currentStopIndex = 0;
    statusObj.stopOrders = sortedOrders.map(o => o._id.toString());
    statusObj.etaMinutes = routePoints.length - 1;
    statusObj.updatedAt = new Date();
    await statusObj.save();

    if (driverIntervals[driverId]) {
      clearInterval(driverIntervals[driverId]);
    }

    driverIntervals[driverId] = setInterval(async () => {
      try {
        const currentStatus = await DriverStatus.findOne({ driverId });
        if (!currentStatus || !currentStatus.isActive) {
          if (driverIntervals[driverId]) {
            clearInterval(driverIntervals[driverId]);
            delete driverIntervals[driverId];
          }
          return;
        }

        let nextIndex = currentStatus.currentPointIndex + 1;
        if (nextIndex >= currentStatus.routePoints.length) {
          currentStatus.isActive = false;
          currentStatus.currentPointIndex = 0;
          currentStatus.currentStopIndex = 0;
          currentStatus.etaMinutes = 0;
          await currentStatus.save();
          if (driverIntervals[driverId]) {
            clearInterval(driverIntervals[driverId]);
            delete driverIntervals[driverId];
          }
          return;
        }

        const coords = currentStatus.routePoints[nextIndex];
        currentStatus.currentLatitude = coords[0];
        currentStatus.currentLongitude = coords[1];
        currentStatus.currentPointIndex = nextIndex;
        currentStatus.etaMinutes = currentStatus.routePoints.length - 1 - nextIndex;

        // Check if we reached a stop (every 10 steps)
        const stopIdxToCheck = 10 * (currentStatus.currentStopIndex + 1);
        if (nextIndex === stopIdxToCheck) {
          const orderId = currentStatus.stopOrders[currentStatus.currentStopIndex];
          if (orderId) {
            const order = await Order.findById(orderId);
            if (order && order.status === "Pending") {
              order.status = "Arrived";
              await order.save();
            }
          }
          currentStatus.currentStopIndex += 1;
        }

        currentStatus.updatedAt = new Date();
        await currentStatus.save();
      } catch (err) {
        console.error("Simulation tick error:", err);
      }
    }, 3000);

    res.json({
      message: "Simulation started.",
      routePointsCount: routePoints.length,
      stopsCount: sortedOrders.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /driver/stop - Stop simulation for a driver
router.post("/driver/stop", async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!driverId) {
      return res.status(400).json({ message: "Driver ID is required." });
    }

    if (driverIntervals[driverId]) {
      clearInterval(driverIntervals[driverId]);
      delete driverIntervals[driverId];
    }

    let currentStatus = await DriverStatus.findOne({ driverId });
    if (currentStatus) {
      currentStatus.isActive = false;
      currentStatus.currentPointIndex = 0;
      currentStatus.currentStopIndex = 0;
      currentStatus.etaMinutes = 0;
      await currentStatus.save();
    }

    res.json({ message: "Simulation stopped." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /driver/status/:driverId - Get simulation status for a specific driver
router.get("/driver/status/:driverId", async (req, res) => {
  try {
    let currentStatus = await DriverStatus.findOne({ driverId: req.params.driverId });
    if (!currentStatus) {
      currentStatus = new DriverStatus({ driverId: req.params.driverId });
      await currentStatus.save();
    }
    res.json(currentStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /driver/status - Get simulation status (fallback compatible)
router.get("/driver/status", async (req, res) => {
  try {
    const driverId = req.query.driverId;
    if (!driverId) {
      let currentStatus = await DriverStatus.findOne({ isActive: true });
      if (!currentStatus) {
        currentStatus = await DriverStatus.findOne();
      }
      if (!currentStatus) {
        currentStatus = new DriverStatus({ driverId: "default_fallback" });
      }
      return res.json(currentStatus);
    }
    
    let currentStatus = await DriverStatus.findOne({ driverId });
    if (!currentStatus) {
      currentStatus = new DriverStatus({ driverId });
      await currentStatus.save();
    }
    res.json(currentStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
