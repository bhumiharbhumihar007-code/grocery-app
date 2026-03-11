// Enhanced Frontend JavaScript for Grocery Store

// ==================== AUTHENTICATION & PROTECTION ====================
(function checkAuthentication() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userName = localStorage.getItem("userName");
  const currentPath = window.location.pathname;
  
  // Protected pages (add more as needed)
  const protectedPages = ["/index.html", "/cart.html", "/checkout.html", "/orders.html"];
  const isProtectedPage = protectedPages.some(page => currentPath.endsWith(page));
  
  if (isProtectedPage && !isLoggedIn) {
    // Store the attempted URL for redirect after login
    sessionStorage.setItem("redirectAfterLogin", currentPath);
    window.location.href = "/login.html";
    return;
  }
  
  // Redirect to home if already logged in and on login page
  if (currentPath.includes("login.html") && isLoggedIn) {
    const role = localStorage.getItem("userRole");
    if (role === "admin") {
      window.location.href = "/admin-dashboard.html";
    } else {
      window.location.href = "/index.html";
    }
  }
})();

// ==================== CART MANAGEMENT ====================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Cart state management
const cartState = {
  get items() { return cart; },
  get total() { return cart.reduce((sum, i) => sum + (i.price * i.quantity), 0); },
  get itemCount() { return cart.reduce((sum, i) => sum + i.quantity, 0); },
  
  add(item) {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      cart.push({ ...item, quantity: item.quantity || 1 });
    }
    this.save();
    this.updateUI();
    return this.items;
  },
  
  update(id, quantity) {
    const item = cart.find(i => i.id === id);
    if (item) {
      if (quantity <= 0) {
        this.remove(id);
      } else {
        item.quantity = quantity;
        this.save();
        this.updateUI();
      }
    }
    return this.items;
  },
  
  remove(id) {
    cart = cart.filter(i => i.id !== id);
    this.save();
    this.updateUI();
    return this.items;
  },
  
  clear() {
    cart = [];
    this.save();
    this.updateUI();
  },
  
  save() {
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("cartTotal", this.total.toFixed(2));
    localStorage.setItem("cartCount", this.itemCount);
    
    // Dispatch custom event for cart updates
    window.dispatchEvent(new CustomEvent('cartUpdated', { 
      detail: { items: cart, total: this.total, count: this.itemCount }
    }));
  },
  
  updateUI() {
    // Update cart badge
    const badges = document.querySelectorAll(".cart-count");
    badges.forEach(badge => {
      badge.innerText = this.itemCount;
      badge.style.display = this.itemCount > 0 ? "flex" : "none";
    });
    
    // Update cart page if on cart.html
    if (window.location.pathname.includes("cart.html")) {
      renderCartPage();
    }
    
    // Update mini cart if exists
    updateMiniCart();
  }
};

// ==================== PRODUCT DISPLAY ====================
const productContainer = document.getElementById("product-display");
let allProducts = [];

// Load products with filters
async function loadProducts(filters = {}) {
  if (!productContainer) return;
  
  try {
    showLoading(productContainer);
    
    // Build query string from filters
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/products${queryParams ? '?' + queryParams : ''}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch products");
    
    const data = await res.json();
    allProducts = data.products || data;
    
    renderProducts(allProducts);
    
  } catch (err) {
    console.error("Error loading products:", err);
    showError(productContainer, "Failed to load products. Please try again.");
  } finally {
    hideLoading();
  }
}

// Render products with optional filtering
function renderProducts(products) {
  if (!productContainer) return;
  
  if (products.length === 0) {
    productContainer.innerHTML = `
      <div class="no-products-message">
        <img src="/images/no-products.svg" alt="No products" class="w-48 mx-auto">
        <p class="text-gray-500 text-center">No products available in this category.</p>
      </div>`;
    return;
  }
  
  productContainer.innerHTML = products.map(product => createProductCard(product)).join("");
  
  // Add animation class
  setTimeout(() => {
    document.querySelectorAll('.product-card').forEach(card => {
      card.classList.add('animate-in');
    });
  }, 100);
}

// Enhanced product card
function createProductCard(product) {
  const inCart = cart.find(i => i.id === product._id);
  
  return `
  <div class="product-card bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group opacity-0 transform translate-y-4">
    <div class="relative overflow-hidden">
      <img src="${product.image || '/images/default-product.jpg'}" 
           alt="${product.name}" 
           class="w-full h-48 object-cover group-hover:scale-110 transition duration-500"
           onerror="this.src='/images/default-product.jpg'">
      
      <span class="absolute top-3 left-3 bg-gradient-to-r from-teal-600 to-green-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
        ${product.category}
      </span>
      
      ${product.stock <= 0 ? `
        <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <span class="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">Out of Stock</span>
        </div>
      ` : ''}
      
      ${product.discount ? `
        <span class="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          -${product.discount}%
        </span>
      ` : ''}
    </div>
    
    <div class="p-5">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold text-lg text-gray-800 line-clamp-2">${product.name}</h3>
        <div class="flex items-center">
          <span class="text-yellow-400">★</span>
          <span class="text-sm text-gray-600 ml-1">${product.rating || '4.5'}</span>
        </div>
      </div>
      
      <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description || 'Fresh & quality product'}</p>
      
      <div class="flex items-center justify-between mb-4">
        <div>
          <span class="text-2xl font-bold text-teal-600">₹${(product.price || 0).toFixed(2)}</span>
          ${product.originalPrice ? `
            <span class="text-sm text-gray-400 line-through ml-2">₹${product.originalPrice}</span>
          ` : ''}
        </div>
        <span class="text-sm text-gray-500">${product.stock > 0 ? `${product.stock} left` : 'Out of stock'}</span>
      </div>
      
      ${inCart ? `
        <div class="flex items-center gap-2">
          <button onclick="updateCartItem('${product._id}', -1)" 
                  class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
            −
          </button>
          <span class="w-12 text-center font-bold">${inCart.quantity}</span>
          <button onclick="updateCartItem('${product._id}', 1)" 
                  class="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition"
                  ${product.stock <= inCart.quantity ? 'disabled' : ''}>
            +
          </button>
        </div>
      ` : `
        <button onclick="addToCart('${product._id}','${product.name}',${product.price},'${product.image}')"
                class="add-to-cart-btn w-full bg-gradient-to-r from-teal-600 to-green-600 text-white py-3 rounded-lg 
                       hover:from-teal-700 hover:to-green-700 transition transform hover:scale-105 active:scale-95"
                ${product.stock <= 0 ? 'disabled' : ''}>
          <span class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            Add to Cart
          </span>
        </button>
      `}
    </div>
  </div>`;
}

// ==================== CART FUNCTIONS ====================
function addToCart(id, name, price, image) {
  const product = {
    id,
    name,
    price: parseFloat(price),
    image: image || '/images/default-product.jpg'
  };
  
  cartState.add(product);
  showToast(`✨ ${name} added to cart!`, 'success');
  
  // Animate the add to cart button
  const btn = event?.target?.closest('button');
  if (btn) {
    btn.classList.add('added-to-cart');
    setTimeout(() => btn.classList.remove('added-to-cart'), 500);
  }
}

function updateCartItem(id, change) {
  const item = cart.find(i => i.id === id);
  if (item) {
    const newQuantity = item.quantity + change;
    cartState.update(id, newQuantity);
    
    if (newQuantity <= 0) {
      showToast('Item removed from cart', 'info');
    }
  }
}

function removeFromCart(id) {
  cartState.remove(id);
  showToast('Item removed from cart', 'info');
}

// ==================== CART PAGE RENDERING ====================
function renderCartPage() {
  const cartContainer = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");
  
  if (!cartContainer) return;
  
  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <div class="empty-cart text-center py-12">
        <img src="/images/empty-cart.svg" alt="Empty cart" class="w-48 mx-auto mb-6">
        <h3 class="text-2xl font-bold text-gray-700 mb-3">Your cart is empty</h3>
        <p class="text-gray-500 mb-6">Looks like you haven't added anything yet</p>
        <a href="/index.html" class="inline-block bg-teal-600 text-white px-8 py-3 rounded-lg hover:bg-teal-700 transition">
          Continue Shopping
        </a>
      </div>
    `;
    if (cartSummary) cartSummary.innerHTML = '';
    return;
  }
  
  // Render cart items
  cartContainer.innerHTML = cart.map((item, index) => `
    <div class="cart-item bg-white rounded-lg shadow p-4 mb-4 flex items-center gap-4 animate-slideIn" style="animation-delay: ${index * 0.1}s">
      <img src="${item.image || '/images/default-product.jpg'}" alt="${item.name}" 
           class="w-20 h-20 object-cover rounded-lg" 
           onerror="this.src='/images/default-product.jpg'">
      
      <div class="flex-grow">
        <h4 class="font-bold text-gray-800">${item.name}</h4>
        <p class="text-teal-600 font-bold">₹${(item.price * item.quantity).toFixed(2)}</p>
      </div>
      
      <div class="flex items-center gap-3">
        <button onclick="updateCartItem('${item.id}', -1)" 
                class="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 transition flex items-center justify-center">
          −
        </button>
        <span class="w-8 text-center font-bold">${item.quantity}</span>
        <button onclick="updateCartItem('${item.id}', 1)" 
                class="w-8 h-8 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition flex items-center justify-center">
          +
        </button>
      </div>
      
      <button onclick="removeFromCart('${item.id}')" 
              class="text-red-500 hover:text-red-700 transition ml-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  `).join('');
  
  // Update summary
  if (cartSummary) {
    const subtotal = cartState.total;
    const tax = subtotal * 0.05; // 5% tax
    const delivery = subtotal > 500 ? 0 : 40;
    const total = subtotal + tax + delivery;
    
    cartSummary.innerHTML = `
      <div class="bg-gray-50 rounded-lg p-6">
        <h3 class="text-xl font-bold mb-4">Order Summary</h3>
        
        <div class="space-y-3 mb-4">
          <div class="flex justify-between">
            <span class="text-gray-600">Subtotal</span>
            <span class="font-bold">₹${subtotal.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Tax (5%)</span>
            <span class="font-bold">₹${tax.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Delivery</span>
            <span class="font-bold">${delivery === 0 ? 'Free' : '₹' + delivery.toFixed(2)}</span>
          </div>
          <div class="border-t pt-3">
            <div class="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span class="text-teal-600">₹${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        ${delivery > 0 ? `
          <p class="text-sm text-green-600 mb-4">
            🚚 Add ₹${(500 - subtotal).toFixed(2)} more for free delivery
          </p>
        ` : ''}
        
        <button onclick="proceedToCheckout()" 
                class="w-full bg-gradient-to-r from-teal-600 to-green-600 text-white py-3 rounded-lg 
                       hover:from-teal-700 hover:to-green-700 transition transform hover:scale-105">
          Proceed to Checkout
        </button>
        
        <a href="/index.html" class="block text-center text-teal-600 mt-4 hover:underline">
          Continue Shopping
        </a>
      </div>
    `;
  }
}

// ==================== USER FUNCTIONS ====================
function checkUserLogin() {
  const userName = localStorage.getItem("userName");
  const userEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("userRole");
  
  // Update user display
  const userDisplay = document.getElementById("user-display");
  if (userDisplay && userName) {
    userDisplay.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-gray-700">Hi,</span>
        <span class="font-bold text-teal-600">${userName}</span>
        ${userRole === 'admin' ? '<span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Admin</span>' : ''}
      </div>
    `;
    userDisplay.classList.remove("hidden");
  }
  
  // Update auth buttons
  const authButtons = document.getElementById("auth-buttons");
  if (authButtons) {
    if (userName) {
      authButtons.innerHTML = `
        <button onclick="logout()" class="text-gray-600 hover:text-red-600 transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </button>
      `;
    } else {
      authButtons.innerHTML = `
        <a href="/login.html" class="text-teal-600 hover:text-teal-700">Login</a>
        <a href="/register.html" class="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">Sign Up</a>
      `;
    }
  }
}

// Enhanced logout
function logout() {
  // Clear all user data
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
  localStorage.removeItem("loginTime");
  
  // Clear cart if desired
  if (confirm("Would you like to clear your cart as well?")) {
    cartState.clear();
  }
  
  showToast("Logged out successfully! 👋", "success");
  
  setTimeout(() => {
    window.location.href = "/login.html";
  }, 1500);
}

// ==================== CHECKOUT ====================
async function proceedToCheckout() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  
  if (!isLoggedIn) {
    showToast("Please login to continue", "warning");
    sessionStorage.setItem("redirectAfterLogin", "/checkout.html");
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1500);
    return;
  }
  
  if (cart.length === 0) {
    showToast("Your cart is empty", "error");
    return;
  }
  
  // Redirect to checkout page
  window.location.href = "/checkout.html";
}

// ==================== UTILITY FUNCTIONS ====================
function showToast(message, type = "info") {
  // Remove existing toast
  const existingToast = document.querySelector(".toast");
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add("show"), 10);
  
  // Remove after delay
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showLoading(container) {
  container.innerHTML = `
    <div class="loading-spinner col-span-4 text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      <p class="text-gray-600 mt-4">Loading products...</p>
    </div>
  `;
}

function hideLoading() {
  // Loading is removed when content is rendered
}

function showError(container, message) {
  container.innerHTML = `
    <div class="error-message col-span-4 text-center py-12">
      <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p class="text-red-500 text-lg">${message}</p>
      <button onclick="loadProducts()" class="mt-4 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">
        Try Again
      </button>
    </div>
  `;
}

function updateMiniCart() {
  const miniCart = document.getElementById("mini-cart");
  if (!miniCart) return;
  
  if (cart.length === 0) {
    miniCart.innerHTML = '<p class="text-gray-500 p-4">Cart is empty</p>';
    return;
  }
  
  miniCart.innerHTML = `
    <div class="p-4">
      ${cart.slice(0, 3).map(item => `
        <div class="flex items-center gap-3 mb-3 pb-3 border-b">
          <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded">
          <div class="flex-grow">
            <p class="font-bold text-sm">${item.name}</p>
            <p class="text-teal-600 text-sm">₹${(item.price * item.quantity).toFixed(2)}</p>
          </div>
          <span class="bg-gray-200 px-2 rounded text-sm">${item.quantity}</span>
        </div>
      `).join('')}
      
      ${cart.length > 3 ? `<p class="text-sm text-gray-500 mb-3">+${cart.length - 3} more items</p>` : ''}
      
      <div class="flex justify-between font-bold mb-3">
        <span>Total:</span>
        <span class="text-teal-600">₹${cartState.total.toFixed(2)}</span>
      </div>
      
      <a href="/cart.html" class="block w-full bg-teal-600 text-white text-center py-2 rounded-lg hover:bg-teal-700">
        View Cart
      </a>
    </div>
  `;
}

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", () => {
  // Load products if on product page
  if (document.getElementById("product-display")) {
    loadProducts();
  }
  
  // Render cart if on cart page
  if (document.getElementById("cart-items")) {
    renderCartPage();
  }
  
  // Update cart UI
  cartState.updateUI();
  
  // Check user login
  checkUserLogin();
  
  // Add search functionality if exists
  const searchInput = document.getElementById("search-products");
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = allProducts.filter(p => 
          p.name.toLowerCase().includes(searchTerm) || 
          p.category.toLowerCase().includes(searchTerm)
        );
        renderProducts(filtered);
      }, 300);
    });
  }
  
  // Add category filter
  const categoryFilter = document.getElementById("category-filter");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", (e) => {
      const category = e.target.value;
      if (category === "all") {
        renderProducts(allProducts);
      } else {
        const filtered = allProducts.filter(p => p.category === category);
        renderProducts(filtered);
      }
    });
  }
});

// Listen for cart updates
window.addEventListener('cartUpdated', (e) => {
  console.log('Cart updated:', e.detail);
});

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
  .toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 9999;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .toast.show {
    transform: translateY(0);
    opacity: 1;
  }
  
  .toast-success { background: #10b981; }
  .toast-error { background: #ef4444; }
  .toast-warning { background: #f59e0b; }
  .toast-info { background: #3b82f6; }
  
  .product-card {
    transition: all 0.3s ease;
  }
  
  .product-card.animate-in {
    opacity: 1;
    transform: translateY(0);
  }
  
  .cart-item {
    transition: all 0.3s ease;
  }
  
  .cart-item.animate-slideIn {
    animation: slideIn 0.3s ease forwards;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .add-to-cart-btn.added-to-cart {
    animation: pulse 0.5s ease;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

document.head.appendChild(style);
