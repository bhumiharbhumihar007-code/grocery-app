const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    genericName: {
        type: String,
        trim: true,
        default: ""
    },
    manufacturer: {
        type: String,
        trim: true,
        default: ""
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: [
            "Pain Relief", 
            "Antibiotics", 
            "Vitamins", 
            "Cold & Flu", 
            "Allergy", 
            "Diabetes", 
            "Heart Care", 
            "Digestive", 
            "Skin Care", 
            "Eye Care", 
            "Others"
        ]
    },
    image: {
        type: String,
        default: "https://via.placeholder.com/200x200?text=Medicine"
    },
    description: {
        type: String,
        default: ""
    },
    dosage: {
        type: String,
        default: ""
    },
    sideEffects: {
        type: String,
        default: ""
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    expiryDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

// Update the updatedAt field before saving
MedicineSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("Medicine", MedicineSchema);
