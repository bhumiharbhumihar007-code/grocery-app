const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config();

/* =========================
   MODELS
========================= */
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* =========================
   MONGODB CONNECTION
========================= */
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected ✅"))
    .catch(err => console.log("Mongo Error:", err));

/* =========================
   AUTH ROUTES
========================= */

// REGISTER
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: "user" // default role
        });

        await newUser.save();

        res.json({ message: "Registration successful ✅" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Registration failed" });
    }
});

// LOGIN
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Send role to client for admin access
        res.json({
            message: "Login successful ✅",
            user: {
                name: user.name,
                email: user.email,
                role: user.role || "user"
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
});

/* =========================
   PRODUCT ROUTES
========================= */

// GET PRODUCTS
app.get("/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Products load failed" });
    }
});

// ADD PRODUCT
app.post("/addProduct", async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.json({ message: "Product added successfully ✅" });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Product save failed" });
    }
});

// DELETE PRODUCT
app.delete("/deleteProduct/:id", async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted 🗑️" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Delete failed" });
    }
});

/* =========================
   ORDER ROUTES
========================= */
app.post("/order", async (req, res) => {
    try {
        const { items, total, userName, userEmail, address, phone } = req.body;

        const newOrder = new Order({
            userName: userName || "Guest",
            userEmail,
            address,
            phone,
            items,
            total,
            date: new Date()
        });

        await newOrder.save();

        res.json({ message: "Order placed successfully 🚚" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Order failed" });
    }
});

/* =========================
   ADMIN DASHBOARD DATA
========================= */
app.get("/adminData", async (req, res) => {
    try {
        const users = await User.find();
        const orders = await Order.find();
        const products = await Product.find();

        res.json({ users, orders, products });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Admin data failed" });
    }
});

/* =========================
   CREATE DEFAULT ADMIN
========================= */
async function createAdmin() {
    try {
        const adminExists = await User.findOne({ email: "admin@freshmart.com" });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            const admin = new User({
                name: "Admin",
                email: "admin@freshmart.com",
                password: hashedPassword,
                role: "admin"
            });
            await admin.save();
            console.log("Default Admin Created ✅");
        }
    } catch (err) {
        console.error("Admin creation error:", err);
    }
}
createAdmin();

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
