const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

userName:String,
userEmail:String,
phone:String,
address:String,

items:Array,

total:Number,

date:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("Order",orderSchema);
