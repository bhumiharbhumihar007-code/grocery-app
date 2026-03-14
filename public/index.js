// Check if user is logged in
const userName = localStorage.getItem("userName");
if (!userName) {
    window.location.href = "login.html";
}

// Display user name
document.getElementById("userName").textContent = userName;
document.getElementById("userGreeting").textContent = `Hi, ${userName}`;

// Global variables
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allMedicines = [];

// Load medicines from server
async function loadMedicines() {
    try {
        const response = await fetch("/medicines");
        const medicines = await response.json();
        allMedicines = medicines;
        displayMedicines(medicines);
        document.getElementById("resultsCount").textContent = medicines.length;
    } catch (error) {
        showToast("Failed to load medicines", "error");
    }
}

// Display medicines in grid
function displayMedicines(medicines) {
    const grid = document.getElementById("medicinesGrid");
    
    if (medicines.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No medicines found</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = medicines.map(medicine => `
        <div class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
            <img src="${medicine.image || 'https://via.placeholder.com/200x200?text=Medicine'}" 
                 alt="${medicine.name}" 
                 class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="font-bold text-lg">${medicine.name}</h3>
                <p class="text-sm text-gray-600">${medicine.genericName || ''}</p>
                <p class="text-xs text-gray-500 mt-1">${medicine.manufacturer || ''}</p>
                
                <div class="flex justify-between items-center mt-3">
                    <span class="text-xl font-bold text-emerald-700">₹${medicine.price}</span>
                    <span class="text-sm ${medicine.stock > 0 ? 'text-green-600' : 'text-red-600'}">
                        ${medicine.stock > 0 ? `Stock: ${medicine.stock}` : 'Out of Stock'}
                    </span>
                </div>
                
                <button onclick="addToCart('${medicine._id}', '${medicine.name}', ${medicine.price})" 
                    class="w-full bg-emerald-700 text-white py-2 rounded-lg mt-4 hover:bg-emerald-800 transition ${medicine.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${medicine.stock <= 0 ? 'disabled' : ''}>
                    ${medicine.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
            </div>
        </div>
    `).join('');
}

// Search functionality
let searchTimeout;
document.getElementById("searchInput").addEventListener("input", function(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const searchTerm = e.target.value.toLowerCase();
        const category = document.getElementById("categoryFilter").value;
        
        let filtered = allMedicines;
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(m => 
                m.name.toLowerCase().includes(searchTerm) ||
                (m.genericName && m.genericName.toLowerCase().includes(searchTerm)) ||
                m.category.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filter by category
        if (category !== "all") {
            filtered = filtered.filter(m => m.category === category);
        }
        
        displayMedicines(filtered);
        document.getElementById("resultsCount").textContent = filtered.length;
    }, 300);
});

// Category filter
document.getElementById("categoryFilter").addEventListener("change", function() {
    document.getElementById("searchInput").dispatchEvent(new Event('input'));
});

// Cart functions
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    
    updateCart();
    showToast(`${name} added to cart`);
}

function updateCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Update cart badge
    const cartCount = document.getElementById("cartCount");
    cartCount.textContent = itemCount;
    cartCount.style.display = itemCount > 0 ? "flex" : "none";
    
    // Update cart total
    document.getElementById("cartTotal").textContent = totalAmount.toFixed(2);
    
    // Update cart items display
    const cartItems = document.getElementById("cartItems");
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-center text-gray-500 py-4">Your cart is empty</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="flex justify-between items-center border-b pb-2">
                <div>
                    <p class="font-semibold">${item.name}</p>
                    <p class="text-sm text-gray-600">Qty: ${item.quantity} x ₹${item.price}</p>
                </div>
                <span class="font-bold">₹${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
    }
}

// Cart modal
document.getElementById("cartBtn").addEventListener("click", function() {
    document.getElementById("cartModal").classList.remove("hidden");
    document.getElementById("cartModal").classList.add("flex");
    updateCart();
});

document.getElementById("closeCartBtn").addEventListener("click", function() {
    document.getElementById("cartModal").classList.add("hidden");
});

// Close modal when clicking outside
document.getElementById("cartModal").addEventListener("click", function(e) {
    if (e.target === document.getElementById("cartModal")) {
        document.getElementById("cartModal").classList.add("hidden");
    }
});

// Checkout button
document.getElementById("checkoutBtn").addEventListener("click", function() {
    if (cart.length === 0) {
        showToast("Your cart is empty", "error");
        return;
    }
    window.location.href = "checkout.html";
});

// Logout function
async function logout() {
    try {
        await fetch("/logout", { method: "POST" });
        localStorage.clear();
        window.location.href = "login.html";
    } catch (error) {
        showToast("Logout failed", "error");
    }
}

document.getElementById("logoutBtn").addEventListener("click", logout);

// Toast notification function
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.backgroundColor = type === "success" ? "#059669" : "#dc2626";
    toast.classList.remove("translate-x-full");
    
    setTimeout(() => {
        toast.classList.add("translate-x-full");
    }, 3000);
}

// Initialize page
loadMedicines();
updateCart();
