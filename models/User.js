const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, // Ek email se ek hi account ban sakega
        lowercase: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        default: "user" // Aap ise "admin" bhi set kar sakte hain future mein
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model("User", userSchema);
