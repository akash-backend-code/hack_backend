const mongoose = require("mongoose");

const BuySchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  sellerID: {
    type: String,
    required: true,
  },
  pName: {
    type: String,
    required: true,
  },
  quantity: {
    type: String,
    required: true,
  },
  pType: {
    type: String,
    required: true,
  },
});

const Buy = new mongoose.model("Buys", BuySchema);
module.exports = Buy;
