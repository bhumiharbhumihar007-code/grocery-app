/* ==========================================
   Professional Grocery Store - Main Script
   ========================================== */

// 1. Global Variables & Initialization
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const productContainer = document.getElementById('product-display');

// 2. Database se Products Load karna (Real-time Fetch)
async function loadProducts() {
    try {
        const response = await fetch('/products');
        if (!response.ok) throw new Error("Database se data nahi mila");
        
        const products = await response.json();

        if (productContainer) {
            productContainer.innerHTML = products.length > 0 
                ? products.map(product => createProductCard(product)).join('')
                : `<p class='no-data'>Filhal koi product available nahi hai.</p>`;
        }
    } catch (err) {
        console.error("Error loading products:", err);
        if(productContainer) productContainer.innerHTML = "<p>Server connection error!</p>";
    }
}

// Product Card HTML Template
function createProductCard(product) {
    return `
        <div class="product-card">
            <div class="product-tag">${product.category}</div>
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="btn-add" onclick="addToCart('${product._id}', '${product.name}', ${product.price}, '${product.image}')">
                    <i class="fas fa-plus"></i> Add to Cart
                </button>
            </div>
        </div>`;
}

// 3. Cart Management
function addToCart(id, name, price, image) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    showToast(`${name} added to cart!`); // alert ki jagah toast message (optional)
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    localStorage.setItem('cartTotal', total.toFixed(2));
}

function updateCartUI() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.innerText = totalItems;
    }
}

// 4. Authentication UI Update (Login/Logout)
function checkUserLogin() {
    const userName = localStorage.getItem('userName');
    const userDisplay = document.getElementById('user-welcome');
    const loginLink = document.getElementById('login-link');
    const logoutBtn = document.getElementById('logout-btn');

    if (userName && userDisplay) {
        userDisplay.innerText = `Hi, ${userName}`;
        if(loginLink) loginLink.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    alert("Logged out successfully!");
    window.location.reload();
}

// 5. Checkout Logic
function goToCheckout() {
    if (cart.length === 0) {
        alert("Aapka cart khali hai! Pehle kuch saaman add karein.");
        return;
    }
    window.location.href = "checkout.html";
}

// Utility: Simple Alert Replacement
function showToast(msg) {
    console.log("Toast: " + msg); // Yahan aap CSS toast use kar sakte hain
}

// Page Load hone par Execution
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartUI();
    checkUserLogin();
});
