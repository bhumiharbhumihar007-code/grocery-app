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
        required: true
    },

    stock: {
        type: Number,
        required: true,
        default: 0
    },

    image: {
        type: String
    },

    brand: {
        type: String
    },

    isAvailable: {
        type: Boolean,
        default: true
    }

},
{ timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
