const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    // Link to the User model if they are logged in
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: false // Optional if you allow guest checkout
    },
    userName: { type: String, required: true, trim: true },
    userEmail: { 
        type: String, 
        required: true, 
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'] 
    },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    
    // Improved Items Array
    items: [
        {
            product: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'Product', // Links to your Product.js model
                required: true 
            },
            name: String,   // Snapshot of name at time of purchase
            price: Number,  // Snapshot of price at time of purchase
            quantity: { type: Number, required: true, min: 1 }
        }
    ],
    
    total: { type: Number, required: true, min: 0 },
    
    status: { 
        type: String, 
        required: true,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"], 
        default: "Pending" 
    },
    
    // Tracking payment (Essential for Pharmacy/E-commerce)
    paymentMethod: { type: String, default: "Cash on Delivery" },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date }
    
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

module.exports = mongoose.model("Order", orderSchema);
