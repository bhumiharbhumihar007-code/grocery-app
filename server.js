const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

/* =========================
   MongoDB Atlas Connection
========================= */
mongoose.connect("mongodb+srv://groceryuser:grocery123@cluster0.6xciiec.mongodb.net/groceryDB?retryWrites=true&w=majority")
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log("Mongo Error: ", err));

/* =========================
   Schemas (Database Design)
======================== */

// 1. User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

// 2. Product Schema (Ye missing tha - Admin panel isi se chalega)
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  image: String,
  description: String
});

// 3. Order Schema
const orderSchema = new mongoose.Schema({
  userName: String,
  items: Array,
  total: Number,
  date: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);

/* =========================
   API Routes
========================= */

// --- Products Fetch (Database se saaman dikhane ke liye) ---
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find(); // Pehle yahan fixed list thi, ab DB se aayegi
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Products load nahi ho sake" });
  }
});

// --- Add Product (Admin Panel se naya saaman dalne ke liye) ---
app.post("/addProduct", async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json({ message: "Product Database mein save ho gaya! ✅" });
  } catch (err) {
    res.status(400).json({ error: "Product save nahi hua" });
  }
});

// --- Save Order ---
app.post("/order", async (req, res) => {
  const { items, total } = req.body;
  const newOrder = new Order({
    userName: "Demo User",
    items,
    total
  });
  await newOrder.save();
  res.json({ message: "Order Saved Successfully" });
});

// --- Admin Data ---
app.get("/adminData", async (req, res) => {
  const users = await User.find();
  const orders = await Order.find();
  const products = await Product.find(); // Products bhi admin ko dikhao
  res.json({ users, orders, products });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
