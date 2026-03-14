const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// CORS - Important for Render
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.RENDER_EXTERNAL_URL 
        : 'http://localhost:3000',
    credentials: true
}));

// Session configuration for Render
app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true on Render (HTTPS)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// ==================== MODELS ====================
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", UserSchema);

const MedicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    genericName: { type: String },
    manufacturer: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, default: "https://via.placeholder.com/200x200?text=Medicine" },
    description: { type: String },
    stock: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
const Medicine = mongoose.model("Medicine", MedicineSchema);

const OrderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    items: [{
        medicineId: String,
        name: String,
        price: Number,
        quantity: Number
    }],
    total: { type: Number, required: true },
    status: { type: String, default: "pending" },
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", OrderSchema);

// ==================== DATABASE CONNECTION ====================
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("✅ MongoDB Connected");
        
        // Create admin if not exists
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
            const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
            if (!adminExists) {
                const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
                await User.create({
                    name: process.env.ADMIN_NAME || "Admin",
                    email: process.env.ADMIN_EMAIL,
                    password: hashedPassword,
                    role: "admin"
                });
                console.log("✅ Admin created");
            }
        }
    })
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err.message);
    });

// ==================== ROUTES ====================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Register
app.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already exists" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            name, email, password: hashedPassword, phone, address, role: "user"
        });
        
        res.json({ message: "Registration successful" });
    } catch (err) {
        res.status(500).json({ error: "Registration failed" });
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        req.session.userId = user._id;
        req.session.userRole = user.role;
        
        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

// Logout
app.post("/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out" });
});

// Get medicines
app.get("/medicines", async (req, res) => {
    try {
        const medicines = await Medicine.find().sort({ name: 1 });
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ error: "Failed to load medicines" });
    }
});

// Add medicine (admin)
app.post("/addMedicine", async (req, res) => {
    try {
        if (req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }
        const medicine = await Medicine.create(req.body);
        res.json({ message: "Medicine added", medicine });
    } catch (err) {
        res.status(500).json({ error: "Failed to add medicine" });
    }
});

// Delete medicine (admin)
app.delete("/deleteMedicine/:id", async (req, res) => {
    try {
        if (req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }
        await Medicine.findByIdAndDelete(req.params.id);
        res.json({ message: "Medicine deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete" });
    }
});

// Place order
app.post("/order", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Please login" });
        }
        
        const order = await Order.create({
            ...req.body,
            userId: req.session.userId,
            status: "pending"
        });
        
        // Update stock
        for (const item of req.body.items) {
            await Medicine.findByIdAndUpdate(item.medicineId, {
                $inc: { stock: -item.quantity }
            });
        }
        
        res.json({ message: "Order placed", orderId: order._id });
    } catch (err) {
        res.status(500).json({ error: "Failed to place order" });
    }
});

// Get user orders
app.get("/orders/:email", async (req, res) => {
    try {
        const orders = await Order.find({ 
            userEmail: req.params.email 
        }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// Update order status (admin)
app.patch("/order/:id/status", async (req, res) => {
    try {
        if (req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }
        await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.json({ message: "Status updated" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update" });
    }
});

// Admin data
app.get("/adminData", async (req, res) => {
    try {
        if (req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }
        const [users, orders, medicines] = await Promise.all([
            User.find().select("-password"),
            Order.find(),
            Medicine.find()
        ]);
        res.json({ users, orders, medicines });
    } catch (err) {
        res.status(500).json({ error: "Failed to load data" });
    }
});

// Health check for Render
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
