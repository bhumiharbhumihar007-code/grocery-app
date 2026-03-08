const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

/* =========================
   MongoDB Atlas Connection
========================= */

mongoose.connect("mongodb+srv://groceryuser:grocery123@cluster0.6xciiec.mongodb.net/groceryDB?retryWrites=true&w=majority")
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

/* =========================
   Schemas
========================= */

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const orderSchema = new mongoose.Schema({
  userName: String,
  items: Array,
  total: Number,
  date: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", userSchema);
const Order = mongoose.model("Order", orderSchema);

/* =========================
   Dummy Products API
========================= */

app.get("/products", (req, res) => {
  const products = [
    { name: "Rice", price: 50 },
    { name: "Wheat", price: 40 },
    { name: "Sugar", price: 45 },
    { name: "Oil", price: 120 }
  ];
  res.json(products);
});

/* =========================
   Save Order
========================= */

app.post("/order", async (req, res) => {
  const { items, total } = req.body;

  const newOrder = new Order({
    userName: "Demo User",
    items,
    total
  });

  await newOrder.save();
  res.json({ message: "Order Saved" });
});

/* =========================
   Admin Data
========================= */

app.get("/adminData", async (req, res) => {
  const users = await User.find();
  const orders = await Order.find();

  res.json({ users, orders });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running");
});
