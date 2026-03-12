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
        required: true 
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
        required: true 
    },
    userEmail: { 
        type: String, 
        required: true 
    },
    userPhone: { 
        type: String, 
        required: true 
    },
    deliveryAddress: { 
        type: String, 
        required: true 
    },
    items: [OrderItemSchema],
    total: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending"
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date 
    }
});

module.exports = mongoose.model("Order", OrderSchema);
