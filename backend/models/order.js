const mongoose=
require("mongoose");

const OrderSchema=
new mongoose.Schema({

distributorName:{
type:String,
default:""
},

retailerName:{
type:String,
default:""
},

clientType:{
type:String,
default:"Distributor"
},

contact:{
type:String,
default:""
},

address:{
type:String,
default:""
},

location:{
type:String,
default:""
},

pincode:{
type:String,
default:""
},

latitude:{
type:Number,
default:0
},

longitude:{
type:Number,
default:0
},

deliveryDate:{
type:String,
default:""
},

deliveryTime:{
type:String,
default:""
},

oneL:{
type:Number,
default:0
},

fiveHundredML:{
type:Number,
default:0
},

twoHundredML:{
type:Number,
default:0
},

total:{
type:Number,
default:0
},

token:{
type:Number,
default:0
},

assignedDriverId: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
default: null
},
assignedDriverName: {
type: String,
default: ""
},
status:{
type:String,
default:"Pending"
},

paymentStatus:{
type:String,
default:"Unpaid"
},

receiptNo:{
type:String,
default:""
},

username:{
type:String,
default:""
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports=

mongoose.model(

"Order",

OrderSchema

);