const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  entryFee: {
    type: Number,
    required: true,
  },
  winPrize: {
    type: Number,
    required: true,
  },
  perKill: {
    type: Number,
  },
  time: {
    type: String,
    required: true,
  },
  team: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
  entries: {
    type: Number,
    default: 0,
  },
  userOne: {
    type: Array,
    default: null,
  },
  userTwo: {
    type: Array,
    default: null,
  },
  roomDetails: {
    type: Array,
    default: null,
  },
});

const Match = new mongoose.model("matchs", MatchSchema);
module.exports = Match;
