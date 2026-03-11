const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Models
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");

const app = express();

/* =========================
   Middleware
========================= */

app.use(express.json());
app.use(express.static("public"));
app.use(express.static("public"));

app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "public", "login.html"));
});


/* =========================
   MongoDB Connection
========================= */

mongoose.connect("mongodb+srv://groceryuser:grocery123@cluster0.6xciiec.mongodb.net/groceryDB?retryWrites=true&w=majority")
.then(()=>console.log("MongoDB Connected ✅"))
.catch(err=>console.log("Mongo Error:",err));


/* =========================
   AUTH ROUTES
========================= */

// Register
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

res.json({message:"Registration Successful ✅"});

}catch(err){

res.status(500).json({error:"Registration failed"});

}

});


// Login
app.post("/login", async (req,res)=>{

try{

const {email,password} = req.body;

const user = await User.findOne({email});

if(!user){
return res.status(401).json({error:"Invalid Email or Password"});
}

const match = await bcrypt.compare(password,user.password);

if(!match){
return res.status(401).json({error:"Invalid Email or Password"});
}

res.json({
message:"Login Successful",
userName:user.name,
userEmail:user.email
});

}catch(err){

res.status(500).json({error:"Login failed"});

}

});


/* =========================
   PRODUCT ROUTES
========================= */

// Get Products
app.get("/products", async (req,res)=>{

try{

const products = await Product.find();

res.json(products);

}catch(err){

res.status(500).json({error:"Products load failed"});

}

});


// Add Product
app.post("/addProduct", async (req,res)=>{

try{

const product = new Product(req.body);

await product.save();

res.json({message:"Product Added ✅"});

}catch(err){

res.status(400).json({error:"Product save failed"});

}

});


// Delete Product
app.delete("/deleteProduct/:id", async (req,res)=>{

try{

await Product.findByIdAndDelete(req.params.id);

res.json({message:"Product Deleted 🗑️"});

}catch(err){

res.status(500).json({error:"Delete failed"});

}

});


/* =========================
   ORDER ROUTE
========================= */

app.post("/order", async (req,res)=>{

try{

const {items,total,userName,userEmail,address,phone} = req.body;

const newOrder = new Order({

userName:userName || "Guest",

userEmail,

address,

phone,

items,

total,

date:new Date()

});

await newOrder.save();

res.json({message:"Order Placed Successfully 🚚"});

}catch(err){

res.status(500).json({error:"Order failed"});

}

});


/* =========================
   ADMIN DASHBOARD
========================= */

app.get("/adminData", async (req,res)=>{

try{

const users = await User.find();

const orders = await Order.find();

const products = await Product.find();

res.json({users,orders,products});

}catch(err){

res.status(500).json({error:"Admin data failed"});

}

});


/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log(`🚀 Server running on http://localhost:${PORT}`);
});
