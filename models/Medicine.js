const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    genericName: { type: String },
    manufacturer: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, default: "https://via.placeholder.com/200x200?text=Medicine" },
    description: { type: String },
    stock: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Medicine", MedicineSchema);
