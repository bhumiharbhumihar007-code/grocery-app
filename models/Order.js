const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    items: [
        {
            id: String,
            name: String,
            price: Number,
            quantity: Number
        }
    ],
    total: { type: Number, required: true },
    status: { 
        type: String, 
        default: "Pending" // "Shipped", "Delivered", "Cancelled"
    },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
