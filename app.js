const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
require("dotenv").config();
require("./db/database");
const User = require("./db/User");
const Withdraw = require("./db/Withdraw");
const myEmail = process.env.email;
const mypass = process.env.password;
const port = process.env.PORT || 8000;
const Product = require("./db/Product");
const os = require("os");
const Razorpay = require("razorpay");
const Buy = require("./db/Buy");
const http = require("http");
const socketIo = require("socket.io");
const Chat = require("./db/Chat.js");
const instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});
const frontend = process.env.FRONTEND2;
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: frontend,
    methods: ["GET", "POST"],
    credentials: true, // Use if needed for authentication
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// const appip = os.networkInterfaces().en0[2].address;
// const appaddress = "http://[" + appip + "]:" + port + "/";
// console.log("your online address: " + appaddress);

// Payment Gateway Routes
//place an order of an amount
app.post("/order", async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: Number(amount) * 100, // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11",
  };
  const order = await instance.orders.create(options);

  res.json({
    success: true,
    order,
  });
});

//verify the payment
app.post("/payment/:data", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const { data } = req.params;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.key_secret)
    .update(body.toString())
    .digest("hex");
  console.log("sig recieved", razorpay_signature);
  console.log("sig generated", expectedSignature);

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    //database comes here
    const arr = data.split(".");
    const id = arr[0];
    const amount = Number(arr[1]);
    const user = await User.findOne({ _id: id });
    user.balance = Number(user.balance) + amount;
    await user.save();

    res.redirect(`${process.env.FRONTEND}dashboard`);
  } else {
    res.json({
      success: false,
    });
  }
});
// withdraw function
app.post("/withdraw", async (req, res) => {
  const { id, amount, upi } = req.body;
  try {
    const user = await User.findOne({ _id: id });
    if (!user) {
      res.json({ msg: "user not found" });
      return false;
    }
    if (user.balance < amount) {
      res.json({ msg: "not enough balance" });
      return false;
    }
    user.balance -= amount;
    const withdraw = new Withdraw({
      userid: id,
      amount,
      upi,
    });
    await user.save();
    await withdraw.save();
    console.log("withdraw success");
    res.json({ msg: "success" });
  } catch (e) {
    console.log(e);
    res.json({ msg: "something went wrong" });
  }
});

//get the key
app.get("/kzyvx", (req, res) => {
  res.json({ key: process.env.key_id });
});

app.get("/", async (req, res) => {
  res.send("hello bro");
  console.log('someone connected to the "/" route');
});

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a verification token
    const verificationToken = crypto.randomBytes(20).toString("hex");

    // Save user to the database
    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
    });

    await user.save();
    // Send verification email
    const transporter = nodemailer.createTransport({
      // Configure email sending details (SMTP, API key, etc.)
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: myEmail,
        pass: mypass, // Or use the app password if generated
      },
    });

    const mailOptions = {
      from: myEmail,
      to: email,
      subject: "Email Verification",
      html: `Use This Token to verify your email.<br><h1>${verificationToken}</h1>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "error sending email" });
      }
      console.log("Verification email sent:", info.response);
      res.status(200).json({
        message: "User registered. Check your email for verification.",
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

app.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;

    // Find the user with the verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(404).json({ msg: "Invalid verification token." });
    }

    // Update user's verification status
    user.isVerified = true;
    user.verificationToken = undefined;

    await user.save();

    res.status(200).json({ name: user.name, _id: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "user is not Verified" });
    }

    // Check the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Handle successful login (generate and send a JWT token, set a session, etc.)
    res.status(200).json({ name: user.name, _id: user._id });
    console.log(user.name, user.email);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//fetch all products
app.get("/products", async (req, res) => {
  const data = await Product.find();
  res.json(data);
});
app.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  const data = await Product.find({ userID: id });
  res.json(data);
});

app.get("/specificproduct/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Product.findOne({ _id: id });
    res.json(data);
  } catch (e) {
    console.log(e);
    res.json({ msg: "error" });
  }
});

app.get("/searchproduct/:key", async (req, res) => {
  console.log(req.params.key);
  try {
    let data = await Product.find({
      $or: [
        { pName: { $regex: req.params.key } },
        { pType: { $regex: req.params.key } },
        { pAddress: { $regex: req.params.key } },
      ],
    });
    res.json(data);
  } catch (e) {
    res.json({ msg: "error" });
  }
});

app.get("/deleteproduct/:id", async (req, res) => {
  const { id } = req.params;
  const data = await Product.deleteOne({ _id: id });
  res.json(data);
});

app.get("/user/:_id", async (req, res) => {
  const { _id } = req.params;
  try {
    const data = await User.find({ _id });
    res.json(data);
  } catch (e) {
    res.json({ msg: "User not found" });
  }
});

app.get("/productuser/:key", async (req, res) => {
  const arr = req.params.key.split(".");
  try {
    if (arr[0] === "u") {
      let data = await Buy.findOne({ _id: arr[1] });
      let user = await User.findOne({ _id: data.userID });
      res.json(user);
      return;
    } else if (arr[0] === "s") {
      let data = await Buy.findOne({ _id: arr[1] });
      let user = await User.findOne({ _id: data.sellerID });
      res.json(user);
      return;
    }
    res.json({ msg: "error" });
  } catch (e) {
    console.log(e);
    res.json({ msg: "error" });
  }
});

app.post("/addproduct", async (req, res) => {
  const { pName, pPrice, pType, pAvailable, username, userid, pAddress } =
    req.body;
  try {
    const data = new Product({
      userName: username,
      userID: userid,
      pName,
      pPrice,
      pType,
      pAvailable,
      pAddress,
    });
    await data.save();
    res.json({ msg: "success" });
  } catch (e) {
    console.log("an error happened ", e);
    res.json({ msg: "error" });
  }
});

app.post("/buy", async (req, res) => {
  const { userID, quantity, productID } = req.body;
  try {
    const user = await User.findOne({ _id: userID });
    const product = await Product.findOne({ _id: productID });
    if (Number(quantity) * product.pPrice > user.balance) {
      res.json({ msg: "error" });
      return;
    }
    if (Number(quantity) > product.pAvailable) {
      res.json({ msg: "error" });
      return;
    }
    product.pAvailable -= Number(quantity);
    user.balance -= Number(quantity) * product.pPrice;
    const buy = new Buy({
      userID: user._id,
      sellerID: product.userID,
      balance: Number(quantity) * product.pPrice,
      pName: product.pName,
      quantity: quantity,
      pType: product.pType,
    });
    await buy.save();
    await product.save();
    await user.save();
    addChat(buy._id);

    console.log("success");

    res.json({ msg: "success" });
  } catch (e) {
    console.log(e);
    res.json({ msg: "error" });
  }
});

const addChat = async (buyid) => {
  let cht = new Chat({ name: buyid });
  await cht.save();
  console.log("chat added", buyid);
};

app.get("/purchases/:key", async (req, res) => {
  const arr = req.params.key.split(".");
  try {
    if (arr[0] === "u") {
      let data = await Buy.find({ userID: arr[1] });
      res.json(data);
      return;
    } else if (arr[0] === "s") {
      let data = await Buy.find({ sellerID: arr[1] });
      res.json(data);
      return;
    }
    res.json({ msg: "error" });
  } catch (e) {
    console.log(e);
    res.json({ msg: "error" });
  }
});

app.get("/upurchase/:key", async (req, res) => {
  let arr = req.params.key.split(".");
  try {
    if (arr[0] === "confirm") {
      let buy = await Buy.findOne({ _id: arr[1] });
      let user = await User.findOne({ _id: buy.sellerID });
      user.balance += Number(buy.balance);
      await user.save();
      buy = await Buy.deleteOne({ _id: arr[1] });
      res.json({ msg: "success" });
      return;
    } else if (arr[0] === "cancel") {
      let buy = await Buy.findOne({ _id: arr[1] });
      let user = await User.findOne({ _id: buy.userID });
      user.balance += Number(buy.balance);
      await user.save();
      buy = await Buy.deleteOne({ _id: arr[1] });
      res.json({ msg: "success" });
      return;
    }
    res.json({ msg: "error" });
  } catch (e) {
    console.log(e);
    res.json({ msg: "error" });
  }
});

app.post("/deleteChat", async (req, res) => {
  const { name, index } = req.body;
  const user = await User.findOne({ name });
  if (!user) {
    console.log(name, index);
    res.json({ msg: "user not found" });
    return false;
  }
  let cht = user.chats;
  user.chats = cht.filter((_, i) => Number(i) !== Number(index));
  await user.save();
  res.send(user.chats);
});

app.get("/data/:id", async (req, res) => {
  const { id } = req.params;
  const user = await User.findOne({ _id: id });
  res.json(user);
});

app.get("/clearChat", async (req, res) => {
  const chat = await Chat.findOne({ name: "global chat" });
  chat.chats = [];
  await chat.save();
  res.json({ msg: "success" });
});

const getUsers = async (room) => {
  try {
    // Fetch all sockets connected to the specified room
    const socketsInRoom = await io.in(room).fetchSockets();
    // Map the sockets to an array of user data (e.g., socket IDs)
    const usersInRoom = socketsInRoom.map((s) => ({
      name: s.name,
      // Add more properties as needed (e.g., username, etc.)
    }));
    // Send the list of users in the room back to the client
    io.to(room).emit("connected_users", usersInRoom);
  } catch (error) {
    console.error(`Failed to fetch sockets in room ${room}:`, error);
  }
};

const sendChat = async (msg, name, room, chats) => {
  let newChat = [...chats, [name, msg]];
  io.to(room).emit("chat", newChat);
  let chatData = await Chat.findOne({ name: room });
  chatData.chats = newChat;
  await chatData.save();
};

const deleteChat = async (index, room, chats) => {
  let newChat = chats.filter((_, i) => i !== index);
  io.to(room).emit("chat", newChat);
  let chatData = await Chat.findOne({ name: room });
  chatData.chats = newChat;
  await chatData.save();
};

io.on("connection", (socket) => {
  socket.on("join_room", async ({ room, name }) => {
    socket.join(room);
    socket.name = name;
    socket.room = room;
    console.log("a user connected:", name, "  and joined room:", room);
    getUsers(room);
    let chats = await Chat.findOne({ name: room });
    if (chats) {
      socket.emit("chat", chats.chats);
    }
  });

  socket.on("send_message", ({ msg, name, room, chats }) => {
    sendChat(msg, name, room, chats);
  });

  socket.on("delete_message", ({ i, room, chats }) => {
    deleteChat(i, room, chats);
  });

  socket.on("leave", async (room) => {
    await socket.leave(room);
    socket.disconnect();
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.name);
    getUsers(socket.room);
  });
});

server.listen(port, () => console.log(`server is running on PORT: ${port}`));
