const mongoose = require("mongoose");

const PriceConfigSchema = new mongoose.Schema({
  distributorOneLPrice: {
    type: Number,
    default: 90
  },
  distributorFiveHundredMLPrice: {
    type: Number,
    default: 105
  },
  distributorTwoHundredMLPrice: {
    type: Number,
    default: 160
  },
  retailerOneLPrice: {
    type: Number,
    default: 90
  },
  retailerFiveHundredMLPrice: {
    type: Number,
    default: 105
  },
  retailerTwoHundredMLPrice: {
    type: Number,
    default: 160
  },
  oneLImage: {
    type: String,
    default: ""
  },
  fiveHundredMLImage: {
    type: String,
    default: ""
  },
  twoHundredMLImage: {
    type: String,
    default: ""
  }
});

module.exports = mongoose.model("PriceConfig", PriceConfigSchema);
