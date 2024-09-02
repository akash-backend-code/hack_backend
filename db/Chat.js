const mongoose = require("mongoose");
const ChatSchema = new mongoose.Schema({
  name: {type: String},
  chats: {type: Array, default: []}
});

module.exports = new mongoose.model("chats", ChatSchema);
