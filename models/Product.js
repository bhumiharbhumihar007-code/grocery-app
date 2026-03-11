const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ["Fruits", "Vegetables", "Snacks", "Beverages", "Dairy", "Bakery"]
    },
    image: {
        type: String,
        default: "/images/default-product.jpg"
    },
    description: {
        type: String,
        default: ""
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    rating: {
        type: Number,
        default: 4.5,
        min: 0,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

module.exports = mongoose.model("Product", ProductSchema);
