const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config();

const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.get("/",(req,res)=>{
res.sendFile(path.join(__dirname,"public","login.html"));
});

/* MongoDB */

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

/* Create Admin */

async function createAdmin(){

const adminExists = await User.findOne({email:process.env.ADMIN_EMAIL});

if(!adminExists){

const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD,10);

const admin = new User({
name:process.env.ADMIN_NAME,
email:process.env.ADMIN_EMAIL,
password:hashedPassword,
role:"admin"
});

await admin.save();

console.log("Admin Created");

}

}

mongoose.connection.once("open",createAdmin);

/* Register */

app.post("/register",async(req,res)=>{

const {name,email,password}=req.body;

const userExists = await User.findOne({email});

if(userExists){
return res.status(400).json({error:"User exists"});
}

const hashedPassword = await bcrypt.hash(password,10);

const user = new User({name,email,password:hashedPassword});

await user.save();

res.json({message:"Registered"});

});

/* Login */

app.post("/login",async(req,res)=>{

const {email,password}=req.body;

const user = await User.findOne({email});

if(!user){
return res.status(401).json({error:"Invalid login"});
}

const match = await bcrypt.compare(password,user.password);

if(!match){
return res.status(401).json({error:"Invalid login"});
}

res.json({
userName:user.name,
userEmail:user.email,
role:user.role
});

});

/* Products */

app.get("/products",async(req,res)=>{

const products = await Product.find();

res.json(products);

});

app.post("/addProduct",async(req,res)=>{

const product = new Product(req.body);

await product.save();

res.json({message:"Product added"});

});

app.delete("/deleteProduct/:id",async(req,res)=>{

await Product.findByIdAndDelete(req.params.id);

res.json({message:"Deleted"});

});

/* Orders */

app.post("/order",async(req,res)=>{

const order = new Order(req.body);

await order.save();

res.json({message:"Order placed"});

});

/* Admin Data */

app.get("/adminData",async(req,res)=>{

const users = await User.find();
const orders = await Order.find();
const products = await Product.find();

res.json({users,orders,products});

});

app.listen(process.env.PORT,()=>{
console.log("Server running");
});
