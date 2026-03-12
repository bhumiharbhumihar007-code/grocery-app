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
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
        createDefaultAdmin();
    })
    .catch(err => console.log("MongoDB Error:", err));

// Create Default Admin
async function createDefaultAdmin() {
    try {
        const adminExists = await User.findOne({ email: "admin@medplus.com" });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("admin123", salt);
            
            const admin = new User({
                name: "Admin",
                email: "admin@medplus.com",
                password: hashedPassword,
                phone: "1234567890",
                address: "Admin Address",
                role: "admin",
                createdAt: new Date()
            });
            
            await admin.save();
            console.log("Admin created: admin@medplus.com / admin123");
        }
    } catch (err) {
        console.log("Error creating admin:", err);
    }
}

// Serve HTML pages
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ==================== AUTH ROUTES ====================

// Register
app.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ error: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
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
        res.status(500).json({ error: "Registration failed" });
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ error: "Invalid Email or Password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
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
                phone: user.phone,
                address: user.address,
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

// ==================== MEDICINE ROUTES ====================

// Get all medicines
app.get("/medicines", async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

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

// Add medicine
app.post("/addMedicine", async (req, res) => {
    try {
        const { name, genericName, manufacturer, price, category, image, description, stock } = req.body;

        const medicine = new Medicine({
            name: name.trim(),
            genericName: genericName || "",
            manufacturer: manufacturer || "",
            price: parseFloat(price),
            category,
            image: image || "/images/default-medicine.jpg",
            description: description || "",
            stock: stock || 0,
            createdAt: new Date()
        });

        await medicine.save();
        res.status(201).json({ message: "Medicine Added" });

    } catch (err) {
        res.status(400).json({ error: "Failed to save medicine" });
    }
});

// Delete medicine
app.delete("/deleteMedicine/:id", async (req, res) => {
    try {
        await Medicine.findByIdAndDelete(req.params.id);
        res.json({ message: "Medicine Deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete medicine" });
    }
});

// ==================== ORDER ROUTES ====================

// Place order
app.post("/order", async (req, res) => {
    try {
        const { userName, userEmail, userPhone, deliveryAddress, items, total } = req.body;

        for (const item of items) {
            await Medicine.findByIdAndUpdate(item.medicineId, {
                $inc: { stock: -item.quantity }
            });
        }

        const newOrder = new Order({
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
        res.status(201).json({ message: "Order Placed" });

    } catch (err) {
        res.status(500).json({ error: "Failed to place order" });
    }
});

// Update order status
app.patch("/order/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status });
        res.json({ message: "Status updated" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update" });
    }
});

// ==================== ADMIN ROUTES ====================

// Get admin data
app.get("/adminData", async (req, res) => {
    try {
        const [users, orders, medicines] = await Promise.all([
            User.find().select("-password"),
            Order.find().sort({ createdAt: -1 }),
            Medicine.find()
        ]);
        res.json({ users, orders, medicines });
    } catch (err) {
        res.status(500).json({ error: "Failed to load data" });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
