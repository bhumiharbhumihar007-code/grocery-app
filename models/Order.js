const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    userName:{
        type:String,
        required:true,
        trim:true
    },

    userEmail:{
        type:String,
        required:true,
        lowercase:true,
        match:[/^\S+@\S+\.\S+$/, "Invalid email"]
    },

    address:{
        type:String,
        required:true
    },

    phone:{
        type:String,
        required:true
    },

    items:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
                required:true
            },
            name:String,
            price:{
                type:Number,
                required:true
            },
            quantity:{
                type:Number,
                required:true,
                min:1
            }
        }
    ],

    total:{
        type:Number,
        required:true,
        min:0
    },

    status:{
        type:String,
        enum:["Pending","Processing","Shipped","Delivered","Cancelled"],
        default:"Pending"
    },

    paymentMethod:{
        type:String,
        default:"Cash on Delivery"
    },

    isPaid:{
        type:Boolean,
        default:false
    },

    paidAt:Date

},{timestamps:true});

module.exports = mongoose.model("Order",orderSchema);
