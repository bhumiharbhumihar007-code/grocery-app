const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();

// Models
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/groceryDB", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error("MongoDB Connection Error:", err.message);
        process.exit(1);
    }
};
connectDB();

// ==================== ROUTES ====================

// Serve HTML pages
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/index.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/checkout.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "checkout.html"));
});

app.get("/register.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

// ==================== AUTH ROUTES ====================

// Register
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ 
            name: name.trim(), 
            email: email.toLowerCase().trim(), 
            password: hashedPassword,
            role: "user",
            createdAt: new Date()
        });
        
        await newUser.save();
        
        res.status(201).json({ 
            message: "Registration Successful",
            user: { name: newUser.name, email: newUser.email, role: newUser.role }
        });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Registration failed" });
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ error: "Invalid Email or Password" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Invalid Email or Password" });
        }

        user.lastLogin = new Date();
        await user.save();

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
        res.status(500).json({ error: "Login failed" });
    }
});

// ==================== PRODUCT ROUTES ====================

// Get all products
app.get("/products", async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

        if (category && category !== "all") {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error("Products fetch error:", err);
        res.status(500).json({ error: "Failed to load products" });
    }
});

// Get single product
app.get("/product/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch product" });
    }
});

// Add product (admin only - you might want to add admin auth)
app.post("/addProduct", async (req, res) => {
    try {
        const { name, price, category, image, description, stock } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ error: "Name, price, and category are required" });
        }

        const product = new Product({
            name: name.trim(),
            price: parseFloat(price),
            category,
            image: image || "/images/default-product.jpg",
            description: description || "",
            stock: stock || 0,
            createdAt: new Date()
        });

        await product.save();
        res.status(201).json({ 
            message: "Product Added",
            product 
        });
    } catch (err) {
        console.error("Product save error:", err);
        res.status(400).json({ error: "Failed to save product" });
    }
});

// Update product
app.put("/updateProduct/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json({ message: "Product Updated", product });
    } catch (err) {
        res.status(500).json({ error: "Failed to update product" });
    }
});

// Delete product
app.delete("/deleteProduct/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json({ message: "Product Deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete product" });
    }
});

// ==================== ORDER ROUTES ====================

// Place order
app.post("/order", async (req, res) => {
    try {
        const { userName, userEmail, address, phone, items, total } = req.body;

        if (!items || !items.length || !address || !phone || !total) {
            return res.status(400).json({ error: "Missing required fields" });
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

        // Update product stock
        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        res.status(201).json({ 
            message: "Order Placed Successfully",
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
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// Get single order
app.get("/order/:id", async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch order" });
    }
});

// Update order status
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

        res.json({ message: "Order status updated", order });
    } catch (err) {
        res.status(500).json({ error: "Failed to update order" });
    }
});

// Delete order
app.delete("/deleteOrder/:id", async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json({ message: "Order deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete order" });
    }
});

// ==================== ADMIN ROUTES ====================

// Get admin data (users, orders, products)
app.get("/adminData", async (req, res) => {
    try {
        const [users, orders, products] = await Promise.all([
            User.find().select("-password").sort({ createdAt: -1 }),
            Order.find().sort({ createdAt: -1 }),
            Product.find().sort({ createdAt: -1 })
        ]);

        res.json({ users, orders, products });
    } catch (err) {
        console.error("Admin data error:", err);
        res.status(500).json({ error: "Failed to load admin data" });
    }
});

// Update user role
app.patch("/user/:id/role", async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select("-password");
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.json({ message: "User role updated", user });
    } catch (err) {
        res.status(500).json({ error: "Failed to update user role" });
    }
});

// Health check
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

// Error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from /public`);
});
