const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    category: {
        type: String,
        default: "General",
        trim: true
    },

    stock: {
        type: Number,
        default: 10
    },

    image: {
        type: String,
        default: "https://via.placeholder.com/300"
    },

    brand: {
        type: String,
        default: "FreshMart"
    },

    isAvailable: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("Product", productSchema);
