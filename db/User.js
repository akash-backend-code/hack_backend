const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  balance: {
    type: Number,
    default: 0,
  },
  chats: { type: Array, default: [] },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
});

module.exports = new mongoose.model("users", UserSchema);
