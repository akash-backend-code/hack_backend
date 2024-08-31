const mongoose = require("mongoose");
const withdrawSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  upi: {
    type: String,
    required: true,
  },
});

module.exports = new mongoose.model("withdraws", withdrawSchema);
