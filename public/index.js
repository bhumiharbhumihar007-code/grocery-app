// Check login
const userName = localStorage.getItem("userName");
if (!userName) window.location.href = "login.html";

document.getElementById("userName").textContent = userName;
document.getElementById("userGreeting").textContent = `Hi, ${userName}`;

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allMedicines = [];

// Load medicines
loadMedicines();

async function loadMedicines() {
    try {
        const medicines = await apiCall(API.medicines);
        allMedicines = medicines;
        displayMedicines(medicines);
    } catch (err) {
        showToast("Failed to load medicines", "error");
    }
}

function displayMedicines(medicines) {
    const grid = document.getElementById("medicinesGrid");
    
    if (medicines.length === 0) {
        grid.innerHTML = '<p class="col-span-full text-center text-gray-500">No medicines found</p>';
        return;
    }
    
    grid.innerHTML = medicines.map(m => `
        <div class="bg-white rounded-lg shadow p-4">
            <img src="${m.image}" class="w-full h-40 object-cover rounded">
            <h3 class="font-bold mt-2">${m.name}</h3>
            <p class="text-sm text-gray-600">${m.genericName || ''}</p>
            <p class="text-xl font-bold text-emerald-700 mt-2">₹${m.price}</p>
            <p class="text-sm text-gray-500">Stock: ${m.stock}</p>
            <button onclick="addToCart('${m._id}', '${m.name}', ${m.price})" 
                class="w-full bg-emerald-700 text-white py-2 rounded-lg mt-3">
                Add to Cart
            </button>
        </div>
    `).join('');
}

// Search
document.getElementById("searchInput").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allMedicines.filter(m => 
        m.name.toLowerCase().includes(term) || 
        (m.genericName && m.genericName.toLowerCase().includes(term))
    );
    displayMedicines(filtered);
});

// Cart functions
function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    updateCart();
    showToast(name + " added to cart");
}

function updateCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const cartCount = document.getElementById("cartCount");
    cartCount.textContent = count;
    cartCount.style.display = count > 0 ? "flex" : "none";
    document.getElementById("cartTotal").textContent = total.toFixed(2);
    
    document.getElementById("cartItems").innerHTML = cart.map(item => `
        <div class="flex justify-between border-b py-2">
            <div>${item.name} x ${item.quantity}</div>
            <div class="font-bold">₹${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');
}

// Cart modal
document.getElementById("cartBtn").addEventListener("click", () => {
    document.getElementById("cartModal").classList.remove("hidden");
    document.getElementById("cartModal").classList.add("flex");
    updateCart();
});

function checkout() {
    window.location.href = "checkout.html";
}

// Logout
async function logout() {
    await apiCall(API.logout, "POST");
    localStorage.clear();
    window.location.href = "login.html";
}

function showToast(message, type) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.background = type === "success" ? "#059669" : "#dc2626";
    toast.classList.remove("translate-x-full");
    setTimeout(() => toast.classList.add("translate-x-full"), 3000);
}

// Initialize cart
updateCart();
