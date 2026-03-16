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
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    category: {
        type: String,
        required: true,
        trim: true
    },

    stock: {
        type: Number,
        default: 0
    },

    image: {
        type: String,
        required: true
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
