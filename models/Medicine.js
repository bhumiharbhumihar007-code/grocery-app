const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    genericName: { 
        type: String,
        trim: true 
    },
    manufacturer: { 
        type: String,
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
        enum: ["Pain Relief", "Antibiotics", "Vitamins", "Cold & Flu", "Allergy", "Diabetes", "Heart Care", "Digestive", "Skin Care", "Eye Care", "Others"]
    },
    image: { 
        type: String, 
        default: "https://via.placeholder.com/200x200?text=Medicine" 
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
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model("Medicine", MedicineSchema);
