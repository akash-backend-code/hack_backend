const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  userID: {
    type: String,
    required: true,
  },
  pPrice: {
    type: Number,
    required: true,
  },
  pAvailable: {
    type: Number,
    required: true,
  },

  pType: {
    type: String,
    required: true,
  },
  pName: {
    type: String,
    required: true,
  },
  pAddress: {
    type: String,
    required: true,
  },
});

const Product = new mongoose.model("Products", ProductSchema);
module.exports = Product;
