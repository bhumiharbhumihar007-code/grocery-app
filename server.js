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
.then(()=>console.log("MongoDB Connected ✅"))
.catch(err=>console.log("Mongo Error:",err));


/* =========================
   AUTH ROUTES
========================= */

// REGISTER
app.post("/register", async (req,res)=>{

try{

const {name,email,password} = req.body;

const userExists = await User.findOne({email});

if(userExists){
return res.status(400).json({error:"User already exists"});
}

const hashedPassword = await bcrypt.hash(password,10);

const newUser = new User({
name,
email,
password:hashedPassword
});

await newUser.save();

res.json({message:"Registration successful"});

}catch(err){

res.status(500).json({error:"Registration failed"});

}

});


// LOGIN
app.post("/login", async (req,res)=>{

try{

const {email,password} = req.body;

const user = await User.findOne({email});

if(!user){
return res.status(401).json({error:"Invalid email or password"});
}

const match = await bcrypt.compare(password,user.password);

if(!match){
return res.status(401).json({error:"Invalid email or password"});
}

res.json({

message:"Login successful",

user:{
name:user.name,
email:user.email,
role:user.role
}

});

}catch(err){

res.status(500).json({error:"Login failed"});

}

});


/* =========================
   PRODUCT ROUTES
========================= */

// GET PRODUCTS
app.get("/products", async (req,res)=>{

try{

const products = await Product.find();

res.json(products);

}catch(err){

res.status(500).json({error:"Products load failed"});

}

});


// ADD PRODUCT
app.post("/addProduct", async (req,res)=>{

try{

const product = new Product(req.body);
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
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   HOME ROUTE
========================= */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* =========================
   MONGODB CONNECTION
========================= */
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1); // Stop server if DB fails
});

/* =========================
   AUTH ROUTES
========================= */

// REGISTER
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.json({ success: true, message: "Registration successful" });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ success: false, error: "Registration failed" });
    }
});

// LOGIN
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: "Email and password required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ success: false, error: "Invalid email or password" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ success: false, error: "Invalid email or password" });

        res.json({
            success: true,
            message: "Login successful",
            user: {
                name: user.name,
                email: user.email,
                role: user.role || "user"
            }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, error: "Login failed" });
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
        console.error("Fetch Products Error:", err);
        res.status(500).json({ success: false, error: "Products load failed" });
    }
});

// ADD PRODUCT
app.post("/addProduct", async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.json({ success: true, message: "Product added successfully" });
    } catch (err) {
        console.error("Add Product Error:", err);
        res.status(400).json({ success: false, error: "Product save failed" });
    }
});

// DELETE PRODUCT
app.delete("/deleteProduct/:id", async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Product deleted" });
    } catch (err) {
        console.error("Delete Product Error:", err);
        res.status(500).json({ success: false, error: "Delete failed" });
    }
});

/* =========================
   ORDER ROUTE
========================= */
app.post("/order", async (req, res) => {
    try {
        const { items, total, userName, userEmail, address, phone } = req.body;

        if (!items || !userEmail || !address) {
            return res.status(400).json({ success: false, error: "Missing order information" });
        }

        const newOrder = new Order({
            userName: userName || "Guest",
            userEmail,
            address,
            phone,
            items,
            total,
            createdAt: new Date()
        });

        await newOrder.save();

        res.json({ success: true, message: "Order placed successfully" });
    } catch (err) {
        console.error("Order Error:", err);
        res.status(500).json({ success: false, error: "Order failed" });
    }
});

/* =========================
   ADMIN DASHBOARD DATA
========================= */
app.get("/adminData", async (req, res) => {
    try {
        const users = await User.find();
        const products = await Product.find();
        const orders = await Order.find();

        res.json({ success: true, users, products, orders });
    } catch (err) {
        console.error("Admin Data Error:", err);
        res.status(500).json({ success: false, error: "Admin data failed" });
    }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
