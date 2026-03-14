const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
    medicineId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

const OrderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    userEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    userPhone: {
        type: String,
        required: true,
        trim: true
    },
    deliveryAddress: {
        type: String,
        required: true,
        trim: true
    },
    items: [OrderItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    delivery: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ["cod", "card", "upi"],
        default: "cod"
    },
    status: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending"
    },
    additionalNotes: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    }
});

// Update timestamps
OrderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.status === 'delivered' && !this.deliveredAt) {
        this.deliveredAt = Date.now();
    }
    next();
});

module.exports = mongoose.model("Order", OrderSchema);
