const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true }, // URL of the image
    description: String,
    stock: { type: Number, default: 10 }
});

module.exports = mongoose.model('Product', productSchema);
