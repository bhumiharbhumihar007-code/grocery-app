const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
require("dotenv").config();

// Models
const User = require("./models/User");
const Medicine = require("./models/Medicine");
const Order = require("./models/Order");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
        createAdminFromEnv();
    })
    .catch(err => {
        console.log("❌ MongoDB Error:", err);
        process.exit(1);
    });

// Create Admin from .env file (only if doesn't exist)
async function createAdminFromEnv() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminExists = await User.findOne({ email: adminEmail });
        
        if (!adminExists) {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
            
            const admin = new User({
                name: process.env.ADMIN_NAME || "Admin",
                email: adminEmail,
                password: hashedPassword,
                phone: "0000000000",
                address: "Admin Address",
                role: "admin",
                createdAt: new Date()
            });
            
            await admin.save();
            console.log("✅ Admin created from .env file");
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: [secured in .env]`);
        } else {
            console.log("✅ Admin already exists");
        }
    } catch (err) {
        console.log("❌ Error creating admin:", err);
    }
}

// ==================== AUTH ROUTES ====================

// Register (for users only)
app.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check if email already exists
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user (role is always "user" for registration)
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone || "",
            address: address || "",
            role: "user", // Force role to "user" for security
            createdAt: new Date()
        });

        await newUser.save();
        
        // Remove password from response
        const userResponse = newUser.toObject();
        delete userResponse.password;
        
        res.status(201).json({ 
            message: "Registration Successful",
            user: userResponse
        });

    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Registration failed" });
    }
});

// Login (works for both admin and users)
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Set session
        req.session.userId = user._id;
        req.session.userRole = user.role;
        req.session.userEmail = user.email;

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            message: "Login Successful",
            user: userResponse
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

// Logout
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
    });
});

// Check session
app.get("/check-session", (req, res) => {
    if (req.session.userId) {
        res.json({ 
            loggedIn: true, 
            userId: req.session.userId,
            role: req.session.userRole 
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// ==================== MEDICINE ROUTES ====================

// Get all medicines (public)
app.get("/medicines", async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = { stock: { $gt: 0 } }; // Only show medicines in stock

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

// Add medicine (admin only - with session check)
app.post("/addMedicine", async (req, res) => {
    try {
        // Check if user is admin
        if (!req.session.userId || req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized. Admin access required." });
        }

        const { name, genericName, manufacturer, price, category, image, description, stock } = req.body;

        // Validation
        if (!name || !price || !category) {
            return res.status(400).json({ error: "Name, price, and category are required" });
        }

        const medicine = new Medicine({
            name: name.trim(),
            genericName: genericName || "",
            manufacturer: manufacturer || "",
            price: parseFloat(price),
            category,
            image: image || "https://via.placeholder.com/200x200?text=Medicine",
            description: description || "",
            stock: stock || 0,
            createdAt: new Date()
        });

        await medicine.save();
        res.status(201).json({ message: "Medicine Added Successfully", medicine });

    } catch (err) {
        console.error("Medicine save error:", err);
        res.status(400).json({ error: "Failed to save medicine" });
    }
});

// Delete medicine (admin only)
app.delete("/deleteMedicine/:id", async (req, res) => {
    try {
        // Check if user is admin
        if (!req.session.userId || req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized. Admin access required." });
        }

        const medicine = await Medicine.findByIdAndDelete(req.params.id);
        if (!medicine) {
            return res.status(404).json({ error: "Medicine not found" });
        }
        res.json({ message: "Medicine Deleted Successfully" });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ error: "Failed to delete medicine" });
    }
});

// ==================== ORDER ROUTES ====================

// Place order (user must be logged in)
app.post("/order", async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({ error: "Please login to place order" });
        }

        const { userName, userEmail, userPhone, deliveryAddress, items, total } = req.body;

        // Validation
        if (!items || !items.length) {
            return res.status(400).json({ error: "Order must contain items" });
        }
        if (!deliveryAddress) {
            return res.status(400).json({ error: "Delivery address is required" });
        }

        // Update stock for each item
        for (const item of items) {
            await Medicine.findByIdAndUpdate(item.medicineId, {
                $inc: { stock: -item.quantity }
            });
        }

        // Create order
        const newOrder = new Order({
            userName,
            userEmail,
            userPhone,
            deliveryAddress,
            items,
            total: parseFloat(total),
            status: "pending",
            createdAt: new Date(),
            userId: req.session.userId
        });

        await newOrder.save();
        res.status(201).json({ message: "Order Placed Successfully", orderId: newOrder._id });

    } catch (err) {
        console.error("Order error:", err);
        res.status(500).json({ error: "Failed to place order" });
    }
});

// Get user orders
app.get("/my-orders", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Not logged in" });
        }

        const orders = await Order.find({ userId: req.session.userId })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// Update order status (admin only)
app.patch("/order/:id/status", async (req, res) => {
    try {
        // Check if user is admin
        if (!req.session.userId || req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized. Admin access required." });
        }

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

        res.json({ message: "Status updated", order });
    } catch (err) {
        console.error("Status update error:", err);
        res.status(500).json({ error: "Failed to update status" });
    }
});

// ==================== ADMIN ROUTES ====================

// Get admin dashboard data (admin only)
app.get("/adminData", async (req, res) => {
    try {
        // Check if user is admin
        if (!req.session.userId || req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized. Admin access required." });
        }

        const [users, orders, medicines] = await Promise.all([
            User.find().select("-password").sort({ createdAt: -1 }),
            Order.find().sort({ createdAt: -1 }),
            Medicine.find().sort({ name: 1 })
        ]);

        res.json({ users, orders, medicines });
    } catch (err) {
        console.error("Admin data error:", err);
        res.status(500).json({ error: "Failed to load data" });
    }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
