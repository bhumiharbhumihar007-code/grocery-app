const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();

const app = express();

const User = require("./models/User");
const Medicine = require("./models/Medicine");
const Order = require("./models/Order");

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// CORS
app.use(cors({
    origin: true,
    credentials: true
}));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || "mysecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production" ? false : false,
        maxAge: 24 * 60 * 60 * 1000
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
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
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
    expiryDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});
const Medicine = mongoose.model("Medicine", MedicineSchema);

const OrderItemSchema = new mongoose.Schema({
    medicineId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
});

const OrderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    delivery: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cod", "card", "upi"], default: "cod" },
    status: { type: String, enum: ["pending", "processing", "shipped", "delivered", "cancelled"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", OrderSchema);

// ==================== DATABASE CONNECTION ====================
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("✅ MongoDB Connected");
        
        // Create admin if not exists
        const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
            await User.create({
                name: process.env.ADMIN_NAME || "Admin",
                email: process.env.ADMIN_EMAIL,
                password: hashedPassword,
                role: "admin",
                createdAt: new Date()
            });
            console.log("✅ Admin created from .env");
        }
    })
    .catch(err => {
        console.log("❌ MongoDB Error:", err);
        process.exit(1);
    });

// ==================== SERVE HTML PAGES ====================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ==================== AUTH ROUTES ====================

// Register
app.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }
        
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already exists" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone: phone || "",
            address: address || "",
            role: "user"
        });
        
        res.json({ message: "Registration successful" });
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
            return res.status(400).json({ error: "Email and password required" });
        }
        
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
        req.session.userEmail = user.email;
        
        user.lastLogin = new Date();
        await user.save();
        
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
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

// Logout
app.post("/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out" });
});

// Check session
app.get("/check-session", (req, res) => {
    res.json({
        loggedIn: !!req.session.userId,
        role: req.session.userRole
    });
});

// ==================== MEDICINE ROUTES ====================

// Get all medicines
app.get("/medicines", async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = { stock: { $gt: 0 } };
        
        if (category && category !== "all") {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { genericName: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } }
            ];
        }
        
        const medicines = await Medicine.find(query).sort({ name: 1 });
        res.json(medicines);
    } catch (err) {
        console.error("Medicines fetch error:", err);
        res.status(500).json({ error: "Failed to load medicines" });
    }
});

// Get single medicine
app.get("/medicine/:id", async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) {
            return res.status(404).json({ error: "Medicine not found" });
        }
        res.json(medicine);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch medicine" });
    }
});

// Add medicine (admin only)
app.post("/addMedicine", async (req, res) => {
    try {
        if (req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }
        
        const { name, genericName, manufacturer, price, category, image, description, stock } = req.body;
        
        if (!name || !price || !category) {
            return res.status(400).json({ error: "Name, price, and category are required" });
        }
        
        const medicine = await Medicine.create({
            name,
            genericName: genericName || "",
            manufacturer: manufacturer || "",
            price: parseFloat(price),
            category,
            image: image || "https://via.placeholder.com/200x200?text=Medicine",
            description: description || "",
            stock: stock || 0
        });
        
        res.json({ message: "Medicine added", medicine });
    } catch (err) {
        console.error("Add medicine error:", err);
        res.status(500).json({ error: "Failed to add medicine" });
    }
});

// Delete medicine (admin only)
app.delete("/deleteMedicine/:id", async (req, res) => {
    try {
        if (req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }
        
        await Medicine.findByIdAndDelete(req.params.id);
        res.json({ message: "Medicine deleted" });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ error: "Failed to delete" });
    }
});

// Update medicine (admin only)
app.put("/updateMedicine/:id", async (req, res) => {
    try {
        if (req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }
        
        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        
        res.json({ message: "Medicine updated", medicine });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: "Failed to update" });
    }
});

// ==================== ORDER ROUTES ====================

// Place order
app.post("/order", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Please login" });
        }
        
        const { userName, userEmail, userPhone, deliveryAddress, items, subtotal, tax, delivery, total, paymentMethod } = req.body;
        
        if (!items || !items.length) {
            return res.status(400).json({ error: "Order must contain items" });
        }
        
        // Update stock
        for (const item of items) {
            await Medicine.findByIdAndUpdate(item.medicineId, {
                $inc: { stock: -item.quantity }
            });
        }
        
        const order = await Order.create({
            userId: req.session.userId,
            userName,
            userEmail,
            userPhone,
            deliveryAddress,
            items,
            subtotal,
            tax,
            delivery,
            total,
            paymentMethod: paymentMethod || "cod",
            status: "pending"
        });
        
        res.json({ message: "Order placed", orderId: order._id });
    } catch (err) {
        console.error("Order error:", err);
        res.status(500).json({ error: "Failed to place order" });
    }
});

// Get user orders
app.get("/orders/:email", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Please login" });
        }
        
        const orders = await Order.find({ 
            userEmail: req.params.email 
        }).sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (err) {
        console.error("Fetch orders error:", err);
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
        console.error("Fetch order error:", err);
        res.status(500).json({ error: "Failed to fetch order" });
    }
});

// Update order status (admin only)
app.patch("/order/:id/status", async (req, res) => {
    try {
        if (req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }
        
        const { status } = req.body;
        const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        res.json({ message: "Status updated", order });
    } catch (err) {
        console.error("Status update error:", err);
        res.status(500).json({ error: "Failed to update status" });
    }
});

// ==================== ADMIN ROUTES ====================

// Get admin data
app.get("/adminData", async (req, res) => {
    try {
        if (req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }
        
        const [users, orders, medicines] = await Promise.all([
            User.find().select("-password"),
            Order.find().sort({ createdAt: -1 }),
            Medicine.find()
        ]);
        
        res.json({ users, orders, medicines });
    } catch (err) {
        console.error("Admin data error:", err);
        res.status(500).json({ error: "Failed to load data" });
    }
});

// Get dashboard stats
app.get("/admin/stats", async (req, res) => {
    try {
        if (req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }
        
        const [totalOrders, totalUsers, totalMedicines, revenue] = await Promise.all([
            Order.countDocuments(),
            User.countDocuments({ role: "user" }),
            Medicine.countDocuments(),
            Order.aggregate([
                { $group: { _id: null, total: { $sum: "$total" } } }
            ])
        ]);
        
        res.json({
            totalOrders,
            totalUsers,
            totalMedicines,
            totalRevenue: revenue[0]?.total || 0
        });
    } catch (err) {
        console.error("Stats error:", err);
        res.status(500).json({ error: "Failed to load stats" });
    }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Visit: http://localhost:${PORT}`);
});
