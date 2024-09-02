const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const url = process.env.DATABASE_URL;
try {
  mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("database connected successfully");
} catch (e) {
  console.log("database is not connected");
}
