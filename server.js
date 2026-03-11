const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const validator = require("validator");
require("dotenv").config();

// Models
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// Body parsing middleware with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// MongoDB Connection with error handling
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/groceryDB", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected ✅: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

connectDB();

// Validation functions
const validateEmail = (email) => {
  return validator.isEmail(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validatePhone = (phone) => {
  return phone && validator.isMobilePhone(phone);
};

// Auth Routes
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password: hashedPassword,
      role: "user",
      createdAt: new Date()
    });
    
    await newUser.save();
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({ 
      message: "Registration Successful ✅",
      user: userResponse
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid Email or Password" });
    }

    // Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid Email or Password" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Return user data (excluding password)
    res.json({
      message: "Login Successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// Product Routes
app.get("/products", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;
    let query = {};

    // Build query based on filters
    if (category && category !== "all") {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    console.error("Products fetch error:", err);
    res.status(500).json({ error: "Failed to load products" });
  }
});

app.post("/addProduct", async (req, res) => {
  try {
    const { name, price, category, image, description, stock } = req.body;

    // Validation
    if (!name || !price || !category) {
      return res.status(400).json({ error: "Name, price, and category are required" });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: "Price must be a positive number" });
    }

    const product = new Product({
      name: name.trim(),
      price: parseFloat(price),
      category,
      image: image || "default-product.jpg",
      description: description || "",
      stock: stock || 0,
      createdAt: new Date()
    });

    await product.save();
    res.status(201).json({ 
      message: "Product Added ✅",
      product 
    });
  } catch (err) {
    console.error("Product save error:", err);
    res.status(400).json({ error: "Failed to save product" });
  }
});

app.put("/updateProduct/:id", async (req, res) => {
  try {
    const updates = req.body;
    
    // Validate price if provided
    if (updates.price && (isNaN(updates.price) || updates.price <= 0)) {
      return res.status(400).json({ error: "Price must be a positive number" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ 
      message: "Product Updated ✅",
      product 
    });
  } catch (err) {
    console.error("Product update error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/deleteProduct/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product Deleted 🗑️" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Order Route
app.post("/order", async (req, res) => {
  try {
    const { items, total, userName, userEmail, address, phone } = req.body;

    // Validation
    if (!items || !items.length) {
      return res.status(400).json({ error: "Order must contain items" });
    }

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({ error: "Valid phone number is required" });
    }

    if (!total || isNaN(total) || total <= 0) {
      return res.status(400).json({ error: "Valid total amount is required" });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.productId || !item.name || !item.quantity || !item.price) {
        return res.status(400).json({ error: "Invalid item data" });
      }
    }

    const newOrder = new Order({
      userName: userName || "Guest",
      userEmail: userEmail || "",
      address: address.trim(),
      phone: phone.trim(),
      items,
      total: parseFloat(total),
      status: "pending",
      createdAt: new Date()
    });

    await newOrder.save();

    // Update product stock (optional)
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json({ 
      message: "Order Placed Successfully 🚚",
      orderId: newOrder._id
    });
  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ error: "Failed to place order" });
  }
});

// Get user orders
app.get("/orders/:email", async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.params.email })
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error("Orders fetch error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Admin Dashboard
app.get("/adminData", async (req, res) => {
  try {
    const [users, orders, products] = await Promise.all([
      User.find().select("-password").sort({ createdAt: -1 }),
      Order.find().sort({ createdAt: -1 }),
      Product.find().sort({ createdAt: -1 })
    ]);

    // Get statistics
    const stats = {
      totalUsers: users.length,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      pendingOrders: orders.filter(o => o.status === "pending").length
    };

    res.json({ 
      success: true,
      stats,
      users, 
      orders, 
      products 
    });
  } catch (err) {
    console.error("Admin data error:", err);
    res.status(500).json({ error: "Failed to load admin data" });
  }
});

// Update order status (admin)
app.patch("/order/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ 
      message: "Order status updated",
      order 
    });
  } catch (err) {
    console.error("Order update error:", err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start Server with error handling
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("Server closed");
      process.exit(0);
    });
  });
});

module.exports = app;
