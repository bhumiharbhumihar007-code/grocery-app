const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();

// Models
const User = require("./models/User");
const Medicine = require("./models/Medicine");
const Order = require("./models/Order");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === "production" 
        ? process.env.RENDER_EXTERNAL_URL 
        : "http://localhost:3000",
    credentials: true
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
        createAdminFromEnv();
    })
    .catch(err => {
        console.log("❌ MongoDB Error:", err);
    });

// Create Admin from .env file
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
        } else {
            console.log("✅ Admin already exists");
        }
    } catch (err) {
        console.log("❌ Error creating admin:", err);
    }
}

// ==================== SERVE HTML PAGES ====================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ==================== AUTH ROUTES ====================
app.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone || "",
            address: address || "",
            role: "user",
            createdAt: new Date()
        });

        await newUser.save();
        
        res.status(201).json({ message: "Registration Successful" });

    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        user.lastLogin = new Date();
        await user.save();

        req.session.userId = user._id;
        req.session.userRole = user.role;
        req.session.userEmail = user.email;

        res.json({
            message: "Login Successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role
            }
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
    });
});

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
        res.status(500).json({ error: "Failed to load medicines" });
    }
});

app.post("/addMedicine", async (req, res) => {
    try {
        if (!req.session.userId || req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized. Admin access required." });
        }

        const { name, genericName, manufacturer, price, category, image, description, stock } = req.body;

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
        res.status(201).json({ message: "Medicine Added Successfully" });

    } catch (err) {
        res.status(400).json({ error: "Failed to save medicine" });
    }
});

app.delete("/deleteMedicine/:id", async (req, res) => {
    try {
        if (!req.session.userId || req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized. Admin access required." });
        }

        await Medicine.findByIdAndDelete(req.params.id);
        res.json({ message: "Medicine Deleted Successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete medicine" });
    }
});

// ==================== ORDER ROUTES ====================
app.post("/order", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Please login to place order" });
        }

        const { userName, userEmail, userPhone, deliveryAddress, items, total } = req.body;

        if (!items || !items.length) {
            return res.status(400).json({ error: "Order must contain items" });
        }

        for (const item of items) {
            await Medicine.findByIdAndUpdate(item.medicineId, {
                $inc: { stock: -item.quantity }
            });
        }

        const newOrder = new Order({
            userId: req.session.userId,
            userName,
            userEmail,
            userPhone,
            deliveryAddress,
            items,
            total: parseFloat(total),
            status: "pending",
            createdAt: new Date()
        });

        await newOrder.save();
        res.status(201).json({ message: "Order Placed Successfully" });

    } catch (err) {
        res.status(500).json({ error: "Failed to place order" });
    }
});

app.patch("/order/:id/status", async (req, res) => {
    try {
        if (!req.session.userId || req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { status } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status });
        res.json({ message: "Status updated" });

    } catch (err) {
        res.status(500).json({ error: "Failed to update" });
    }
});

// ==================== ADMIN ROUTES ====================
app.get("/adminData", async (req, res) => {
    try {
        if (!req.session.userId || req.session.userRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const [users, orders, medicines] = await Promise.all([
            User.find().select("-password").sort({ createdAt: -1 }),
            Order.find().sort({ createdAt: -1 }),
            Medicine.find().sort({ name: 1 })
        ]);

        res.json({ users, orders, medicines });
    } catch (err) {
        res.status(500).json({ error: "Failed to load data" });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
