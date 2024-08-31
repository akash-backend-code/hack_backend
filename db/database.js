const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const url = process.env.DATABASE_URL
mongoose.connect(url)
