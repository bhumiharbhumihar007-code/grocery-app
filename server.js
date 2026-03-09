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
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

// 2. Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  image: String,
  description: String
});

// 3. Order Schema (Updated with Address & Phone)
const orderSchema = new mongoose.Schema({
  userName: String,
  userEmail: String,
  address: String,
  phone: String,
  items: Array,
  total: Number,
  status: { type: String, default: "Pending" },
  date: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);

/* =========================
   API Routes
========================= */

// --- 1. Registration Route ---
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: "User already exists" });

    const newUser = new User({ name, email, password });
    await newUser.save();
    res.json({ message: "Registration Successful! ✅" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// --- 2. Login Route ---
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) {
    res.json({ message: "Login Successful", userName: user.name, userEmail: user.email });
  } else {
    res.status(401).json({ error: "Invalid Email or Password" });
  }
});

// --- 3. Products Fetch ---
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Products load nahi ho sake" });
  }
});

// --- 4. Add Product (Admin) ---
app.post("/addProduct", async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json({ message: "Product Saved Successfully! ✅" });
  } catch (err) {
    res.status(400).json({ error: "Product save nahi hua" });
  }
});

// --- 5. Delete Product (Admin) ---
app.delete("/deleteProduct/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product Deleted 🗑️" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// --- 6. Save Order (Updated with dynamic user data) ---
app.post("/order", async (req, res) => {
  try {
    const { items, total, userName, userEmail, address, phone } = req.body;
    const newOrder = new Order({
      userName: userName || "Guest",
      userEmail,
      address,
      phone,
      items,
      total
    });
    await newOrder.save();
    res.json({ message: "Order Placed Successfully! 🚚" });
  } catch (err) {
    res.status(500).json({ error: "Order process nahi ho saka" });
  }
});

// --- 7. Admin Dashboard Data ---
app.get("/adminData", async (req, res) => {
  try {
    const users = await User.find();
    const orders = await Order.find();
    const products = await Product.find();
    res.json({ users, orders, products });
  } catch (err) {
    res.status(500).json({ error: "Admin data fetch fail" });
  }
});

/* =========================
   Start Server
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
