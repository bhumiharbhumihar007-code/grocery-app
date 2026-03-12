// Check if user is logged in
const userName = localStorage.getItem("userName");
if (!userName) {
    window.location.href = "login.html";
}

document.getElementById("userName").textContent = userName;
document.getElementById("userGreeting").textContent = `Hi, ${userName}`;

// Global variables
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allMedicines = [];

// Load medicines
async function loadMedicines() {
    try {
        const res = await fetch("/medicines");
        allMedicines = await res.json();
        displayMedicines(allMedicines);
        document.getElementById("resultsCount").textContent = allMedicines.length;
    } catch (err) {
        showToast("Failed to load medicines", "error");
    }
}

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
    
    grid.innerHTML = medicines.map(m => `
        <div class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
            <img src="${m.image}" alt="${m.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="font-bold text-lg">${m.name}</h3>
                <p class="text-sm text-gray-600">${m.genericName || ''}</p>
                <p class="text-xs text-gray-500 mt-1">${m.manufacturer || ''}</p>
                
                <div class="flex justify-between items-center mt-3">
                    <span class="text-xl font-bold text-emerald-700">₹${m.price}</span>
                    <span class="text-sm ${m.stock > 0 ? 'text-green-600' : 'text-red-600'}">
                        ${m.stock > 0 ? `Stock: ${m.stock}` : 'Out of Stock'}
                    </span>
                </div>
                
                <button onclick="addToCart('${m._id}', '${m.name}', ${m.price})" 
                    class="w-full bg-emerald-700 text-white py-2 rounded-lg mt-4 hover:bg-emerald-800 transition ${m.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${m.stock <= 0 ? 'disabled' : ''}>
                    ${m.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
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
        const term = e.target.value.toLowerCase();
        const category = document.getElementById("categoryFilter").value;
        
        let filtered = allMedicines;
        
        if (term) {
            filtered = filtered.filter(m => 
                m.name.toLowerCase().includes(term) ||
                (m.genericName && m.genericName.toLowerCase().includes(term)) ||
                m.category.toLowerCase().includes(term)
            );
        }
        
        if (category !== "all") {
            filtered = filtered.filter(m => m.category === category);
        }
        
        displayMedicines(filtered);
        document.getElementById("resultsCount").textContent = filtered.length;
    }, 300);
});

document.getElementById("categoryFilter").addEventListener("change", function() {
    document.getElementById("searchInput").dispatchEvent(new Event('input'));
});

// Cart functions
function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    
    updateCart();
    showToast(`${name} added to cart`);
}

function updateCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById("cartCount").textContent = count;
    document.getElementById("cartCount").style.display = count > 0 ? "flex" : "none";
    document.getElementById("cartTotal").textContent = `₹${total.toFixed(2)}`;
    
    // Update cart modal
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
document.getElementById("cartBtn").addEventListener("click", () => {
    document.getElementById("cartModal").classList.remove("hidden");
    document.getElementById("cartModal").classList.add("flex");
});

function closeCart() {
    document.getElementById("cartModal").classList.add("hidden");
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        showToast("Your cart is empty", "error");
        return;
    }
    window.location.href = "checkout.html";
}

// Close modal when clicking outside
document.getElementById("cartModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("cartModal")) {
        closeCart();
    }
});

// Logout
function logout() {
    fetch("/logout", { method: "POST" })
        .finally(() => {
            localStorage.clear();
            window.location.href = "login.html";
        });
}

// Toast notification
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.background = type === "success" ? "#059669" : "#dc2626";
    toast.classList.remove("translate-x-full");
    
    setTimeout(() => {
        toast.classList.add("translate-x-full");
    }, 3000);
}

// Initialize
loadMedicines();
updateCart();
