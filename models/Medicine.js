const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    genericName: { 
        type: String 
    },
    manufacturer: { 
        type: String 
    },
    price: { 
        type: Number, 
        required: true 
    },
    category: { 
        type: String, 
        required: true 
    },
    image: { 
        type: String, 
        default: "/images/default-medicine.jpg" 
    },
    description: { 
        type: String 
    },
    stock: { 
        type: Number, 
        default: 0 
    },
    expiryDate: { 
        type: Date 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model("Medicine", MedicineSchema);
