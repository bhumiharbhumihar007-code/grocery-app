// Global Variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const productContainer = document.getElementById('product-display'); // Apne HTML ID se match karein

// 1. Database se Products Load karna
async function loadProducts() {
    try {
        const response = await fetch('/products');
        const products = await response.json();

        if (productContainer) {
            productContainer.innerHTML = products.map(product => `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="category">${product.category}</p>
                        <p class="price">$${product.price.toFixed(2)}</p>
                        <button class="btn-add" onclick="addToCart('${product._id}', '${product.name}', ${product.price}, '${product.image}')">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

// 2. Cart mein Item Add karna
function addToCart(id, name, price, image) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }

    updateCartUI();
    saveCart();
    alert(`${name} added to cart!`);
}

// 3. Cart Data Save karna (LocalStorage mein)
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Total calculation
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    localStorage.setItem('cartTotal', total.toFixed(2));
}

// 4. Cart UI Update karna (Nav bar mein count dikhane ke liye)
function updateCartUI() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.innerText = totalItems;
    }
}

// 5. Checkout Page par bhejna
function goToCheckout() {
    if (cart.length === 0) {
        alert("Aapka cart khali hai!");
        return;
    }
    window.location.href = "checkout.html";
}

// Page Load hone par chalne wala code
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartUI();

    // Agar Login hai toh user ka naam dikhao
    const userName = localStorage.getItem('userName');
    const userDisplay = document.getElementById('user-welcome');
    if (userName && userDisplay) {
        userDisplay.innerText = `Welcome, ${userName}`;
    }
});
