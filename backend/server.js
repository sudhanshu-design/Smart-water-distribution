require("dotenv").config();
const express=require("express");
const mongoose=require("mongoose");
const cors=require("cors");

const orderRoutes=
require("./routes/orderRoutes");
const authRoutes=
require("./routes/authRoutes");

const app=express();

app.use(cors());

app.use(express.json());

mongoose.connect(
process.env.MONGO_URI || "mongodb://127.0.0.1:27017/water_distribution"
)
.then(async ()=>{

console.log(
"Database Connected"
);

try {
  const User = require("./models/User");
  const adminExists = await User.findOne({ username: "admin" });
  if (!adminExists) {
    const admin = new User({
      username: "admin",
      password: "admin123",
      role: "Admin",
      name: "System Administrator",
      contact: "0000000000",
      address: "System HQ"
    });
    await admin.save();
    console.log("Default admin account seeded successfully.");
  }
} catch (err) {
  console.error("Error seeding default admin:", err);
}

});

app.use(
"/orders",
orderRoutes
);

app.use(
"/auth",
authRoutes
);

const PORT = process.env.PORT || 5000;
app.listen(
PORT,
()=>{

console.log(
`Server Started on port ${PORT}`
);

}
);