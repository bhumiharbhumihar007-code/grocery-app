document.addEventListener("DOMContentLoaded", () => {
  // ==================== INITIALIZATION ====================
  initializeCheckout();
  
  // ==================== AUTO-FILL USER DATA ====================
  autofillUserData();
  
  // ==================== SETUP EVENT LISTENERS ====================
  setupEventListeners();
});

// ==================== MAIN INITIALIZATION ====================
function initializeCheckout() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const total = parseFloat(localStorage.getItem("cartTotal")) || 0;
  
  // Check if cart is empty
  if (cart.length === 0) {
    showEmptyCartMessage();
    return;
  }
  
  // Display cart items
  displayCartItems(cart, total);
  
  // Update order summary
  updateOrderSummary(cart, total);
  
  // Check if user is logged in
  checkUserLoginStatus();
}

// ==================== DISPLAY CART ITEMS ====================
function displayCartItems(cart, total) {
  const itemsContainer = document.getElementById("checkout-items");
  const totalDisplay = document.getElementById("checkout-total");
  
  if (!itemsContainer || !totalDisplay) return;
  
  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="empty-cart-message text-center py-8">
        <img src="/images/empty-cart.svg" alt="Empty cart" class="w-32 mx-auto mb-4">
        <p class="text-gray-500">Your cart is empty</p>
        <a href="/index.html" class="inline-block mt-4 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">
          Continue Shopping
        </a>
      </div>
    `;
    totalDisplay.innerText = "₹0.00";
    return;
  }
  
  itemsContainer.innerHTML = cart.map((item, index) => `
    <div class="checkout-item flex justify-between items-center border-b border-gray-200 py-4 animate-slideIn" 
         style="animation-delay: ${index * 0.1}s">
      <div class="flex items-center gap-4">
        <img src="${item.image || '/images/default-product.jpg'}" 
             alt="${item.name}" 
             class="w-16 h-16 object-cover rounded-lg border"
             onerror="this.src='/images/default-product.jpg'">
        <div>
          <p class="font-semibold text-gray-800">${item.name}</p>
          <div class="flex items-center gap-3 mt-1">
            <span class="text-sm text-gray-600">Qty: ${item.quantity}</span>
            <span class="text-sm bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
              ₹${item.price.toFixed(2)} each
            </span>
          </div>
        </div>
      </div>
      <div class="text-right">
        <p class="font-bold text-teal-600">₹${(item.price * item.quantity).toFixed(2)}</p>
        <button onclick="removeFromCheckout('${item.id}')" 
                class="text-xs text-red-500 hover:text-red-700 mt-1">
          Remove
        </button>
      </div>
    </div>
  `).join("");
  
  totalDisplay.innerText = "₹" + total.toFixed(2);
}

// ==================== UPDATE ORDER SUMMARY ====================
function updateOrderSummary(cart, subtotal) {
  const summaryContainer = document.getElementById("order-summary");
  if (!summaryContainer) return;
  
  const tax = subtotal * 0.05; // 5% tax
  const delivery = subtotal > 500 ? 0 : 40;
  const total = subtotal + tax + delivery;
  
  summaryContainer.innerHTML = `
    <div class="bg-gray-50 rounded-lg p-6">
      <h3 class="text-xl font-bold mb-4">Order Summary</h3>
      
      <div class="space-y-3 mb-4">
        <div class="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span class="font-medium">₹${subtotal.toFixed(2)}</span>
        </div>
        
        <div class="flex justify-between text-gray-600">
          <span>Tax (5%)</span>
          <span class="font-medium">₹${tax.toFixed(2)}</span>
        </div>
        
        <div class="flex justify-between text-gray-600">
          <span>Delivery</span>
          <span class="font-medium">${delivery === 0 ? 'Free' : '₹' + delivery.toFixed(2)}</span>
        </div>
        
        ${delivery > 0 ? `
          <div class="bg-blue-50 p-3 rounded-lg">
            <p class="text-sm text-blue-700">
              🚚 Add ₹${(500 - subtotal).toFixed(2)} more for free delivery
            </p>
          </div>
        ` : ''}
        
        <div class="border-t pt-3">
          <div class="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span class="text-teal-600">₹${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Update hidden total field if exists
  const totalField = document.getElementById("order-total");
  if (totalField) {
    totalField.value = total.toFixed(2);
  }
}

// ==================== AUTO-FILL USER DATA ====================
function autofillUserData() {
  const userName = localStorage.getItem("userName");
  const userEmail = localStorage.getItem("userEmail");
  
  const nameField = document.getElementById("custName");
  const emailField = document.getElementById("custEmail");
  
  if (nameField && userName) {
    nameField.value = userName;
  }
  
  if (emailField && userEmail) {
    emailField.value = userEmail;
  }
  
  // Focus on first empty field
  focusFirstEmptyField();
}

// ==================== CHECK USER LOGIN ====================
function checkUserLoginStatus() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const loginMessage = document.getElementById("login-message");
  
  if (!isLoggedIn && loginMessage) {
    loginMessage.innerHTML = `
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              You're checking out as a guest. 
              <a href="/login.html" class="font-medium underline hover:text-yellow-600">
                Sign in
              </a> 
              to track your orders.
            </p>
          </div>
        </div>
      </div>
    `;
  }
}

// ==================== SETUP EVENT LISTENERS ====================
function setupEventListeners() {
  const form = document.getElementById("checkout-form");
  if (!form) return;
  
  // Remove existing listener to prevent duplicates
  form.removeEventListener("submit", handleCheckoutSubmit);
  form.addEventListener("submit", handleCheckoutSubmit);
  
  // Add input validation listeners
  addValidationListeners();
}

// ==================== HANDLE CHECKOUT SUBMIT ====================
async function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const subtotal = parseFloat(localStorage.getItem("cartTotal")) || 0;
  
  // Validate cart
  if (cart.length === 0) {
    showNotification("Your cart is empty!", "error");
    return;
  }
  
  // Get form data
  const formData = {
    name: document.getElementById("custName").value.trim(),
    email: document.getElementById("custEmail").value.trim(),
    phone: document.getElementById("custPhone").value.trim(),
    address: document.getElementById("custAddress").value.trim(),
    notes: document.getElementById("orderNotes")?.value.trim() || ""
  };
  
  // Validate form data
  const validationErrors = validateCheckoutForm(formData);
  
  if (validationErrors.length > 0) {
    showNotification(validationErrors.join("<br>"), "error");
    validationErrors.forEach(error => {
      if (error.field) highlightField(error.field);
    });
    return;
  }
  
  // Calculate total with tax and delivery
  const tax = subtotal * 0.05;
  const delivery = subtotal > 500 ? 0 : 40;
  const total = subtotal + tax + delivery;
  
  // Prepare order data
  const orderData = {
    userName: formData.name,
    userEmail: formData.email,
    phone: formData.phone,
    address: formData.address,
    notes: formData.notes,
    items: cart.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image
    })),
    subtotal: subtotal,
    tax: tax,
    delivery: delivery,
    total: total,
    paymentMethod: document.getElementById("payment-method")?.value || "cod",
    orderDate: new Date().toISOString()
  };
  
  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;
  
  try {
    const response = await fetch("/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Success! 🎉
      showSuccessModal(orderData, result.orderId);
      
      // Clear cart
      localStorage.removeItem("cart");
      localStorage.removeItem("cartTotal");
      localStorage.removeItem("cartCount");
      
      // Store order ID for tracking
      localStorage.setItem("lastOrderId", result.orderId);
      
    } else {
      // Handle specific error cases
      let errorMessage = result.error || "Order failed";
      
      if (response.status === 400) {
        if (errorMessage.includes("stock")) {
          errorMessage = "Some items are out of stock. Please update your cart.";
        }
      } else if (response.status === 401) {
        errorMessage = "Please login to place order";
        setTimeout(() => {
          window.location.href = "/login.html";
        }, 2000);
      }
      
      showNotification(errorMessage, "error");
      resetSubmitButton(submitBtn, originalText);
    }
  } catch (err) {
    console.error("Checkout error:", err);
    
    if (!navigator.onLine) {
      showNotification("You are offline. Please check your internet connection.", "error");
    } else {
      showNotification("Server error. Please try again.", "error");
    }
    
    resetSubmitButton(submitBtn, originalText);
  }
}

// ==================== VALIDATION ====================
function validateCheckoutForm(data) {
  const errors = [];
  
  // Name validation
  if (!data.name) {
    errors.push({ message: "Name is required", field: "custName" });
  } else if (data.name.length < 2) {
    errors.push({ message: "Name must be at least 2 characters", field: "custName" });
  }
  
  // Email validation
  if (!data.email) {
    errors.push({ message: "Email is required", field: "custEmail" });
  } else if (!validateEmail(data.email)) {
    errors.push({ message: "Please enter a valid email address", field: "custEmail" });
  }
  
  // Phone validation
  if (!data.phone) {
    errors.push({ message: "Phone number is required", field: "custPhone" });
  } else if (!validatePhone(data.phone)) {
    errors.push({ message: "Please enter a valid 10-digit phone number", field: "custPhone" });
  }
  
  // Address validation
  if (!data.address) {
    errors.push({ message: "Delivery address is required", field: "custAddress" });
  } else if (data.address.length < 10) {
    errors.push({ message: "Please enter a complete address", field: "custAddress" });
  }
  
  return errors;
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  const re = /^[0-9]{10}$/;
  return re.test(phone.replace(/[^0-9]/g, ''));
}

// ==================== ADD VALIDATION LISTENERS ====================
function addValidationListeners() {
  const fields = ['custName', 'custEmail', 'custPhone', 'custAddress'];
  
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.addEventListener('blur', function() {
      validateField(this);
    });
    
    field.addEventListener('input', function() {
      this.classList.remove('error-highlight');
      const errorMsg = document.getElementById(`error-${fieldId}`);
      if (errorMsg) errorMsg.remove();
    });
  });
  
  // Phone formatting
  const phoneField = document.getElementById('custPhone');
  if (phoneField) {
    phoneField.addEventListener('input', function(e) {
      let value = e.target.value.replace(/[^0-9]/g, '');
      if (value.length > 10) value = value.slice(0, 10);
      e.target.value = value;
    });
  }
}

function validateField(field) {
  const fieldId = field.id;
  const value = field.value.trim();
  let isValid = true;
  let errorMessage = '';
  
  switch(fieldId) {
    case 'custName':
      isValid = value.length >= 2;
      errorMessage = 'Name must be at least 2 characters';
      break;
    case 'custEmail':
      isValid = validateEmail(value);
      errorMessage = 'Please enter a valid email';
      break;
    case 'custPhone':
      isValid = validatePhone(value);
      errorMessage = 'Please enter a valid 10-digit phone number';
      break;
    case 'custAddress':
      isValid = value.length >= 10;
      errorMessage = 'Please enter a complete address';
      break;
  }
  
  if (!isValid && value.length > 0) {
    showFieldError(fieldId, errorMessage);
  }
}

// ==================== UI HELPER FUNCTIONS ====================
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  field.classList.add('error-highlight');
  
  const existingError = document.getElementById(`error-${fieldId}`);
  if (existingError) existingError.remove();
  
  const errorDiv = document.createElement('div');
  errorDiv.id = `error-${fieldId}`;
  errorDiv.className = 'text-red-500 text-sm mt-1';
  errorDiv.textContent = message;
  
  field.parentNode.appendChild(errorDiv);
}

function highlightField(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.add('error-highlight');
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function showEmptyCartMessage() {
  const container = document.querySelector('.checkout-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="text-center py-12">
      <img src="/images/empty-cart.svg" alt="Empty cart" class="w-48 mx-auto mb-6">
      <h2 class="text-2xl font-bold text-gray-700 mb-3">Your cart is empty</h2>
      <p class="text-gray-500 mb-6">Add some items to your cart before checkout</p>
      <a href="/index.html" class="inline-block bg-teal-600 text-white px-8 py-3 rounded-lg hover:bg-teal-700 transition">
        Continue Shopping
      </a>
    </div>
  `;
}

// ==================== SUCCESS MODAL ====================
function showSuccessModal(orderData, orderId) {
  // Remove existing modal
  const existingModal = document.getElementById('success-modal');
  if (existingModal) existingModal.remove();
  
  const modal = document.createElement('div');
  modal.id = 'success-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-8 max-w-md mx-4 transform animate-slideUp">
      <div class="text-center">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Order Successful! 🎉</h2>
        <p class="text-gray-600 mb-4">Thank you for your order</p>
        
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <p class="text-sm text-gray-600">Order ID</p>
          <p class="font-mono font-bold">#${orderId?.slice(-8) || 'N/A'}</p>
        </div>
        
        <div class="text-left mb-6">
          <p class="font-semibold mb-2">Order Summary:</p>
          <p class="text-sm text-gray-600">Items: ${orderData.items.length}</p>
          <p class="text-sm text-gray-600">Total: ₹${orderData.total.toFixed(2)}</p>
          <p class="text-sm text-gray-600">Delivery to: ${orderData.address.substring(0, 30)}...</p>
        </div>
        
        <div class="space-y-3">
          <a href="/orders.html" 
             class="block w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition">
            Track Your Order
          </a>
          <a href="/index.html" 
             class="block w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition">
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Auto redirect after 5 seconds
  setTimeout(() => {
    window.location.href = '/orders.html';
  }, 5000);
}

// ==================== REMOVE FROM CHECKOUT ====================
function removeFromCheckout(productId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart = cart.filter(item => item.id !== productId);
  
  localStorage.setItem("cart", JSON.stringify(cart));
  
  // Recalculate total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  localStorage.setItem("cartTotal", total.toFixed(2));
  localStorage.setItem("cartCount", cart.reduce((sum, item) => sum + item.quantity, 0));
  
  // Refresh page
  showNotification("Item removed from cart", "info");
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// ==================== NOTIFICATION ====================
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `checkout-notification ${type}`;
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
      <span>${message}</span>
    </div>
    <button onclick="this.parentElement.remove()" class="ml-4 text-lg">&times;</button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// ==================== UTILITY FUNCTIONS ====================
function focusFirstEmptyField() {
  const fields = ['custName', 'custEmail', 'custPhone', 'custAddress'];
  
  for (const fieldId of fields) {
    const field = document.getElementById(fieldId);
    if (field && !field.value.trim()) {
      field.focus();
      break;
    }
  }
}

function resetSubmitButton(btn, originalText) {
  btn.innerHTML = originalText;
  btn.disabled = false;
}

// ==================== ADD CSS STYLES ====================
const checkoutStyles = document.createElement('style');
checkoutStyles.textContent = `
  .checkout-item {
    animation: slideIn 0.3s ease forwards;
    opacity: 0;
    transform: translateX(-20px);
  }
  
  @keyframes slideIn {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .error-highlight {
    border: 2px solid #ef4444 !important;
    animation: shake 0.3s ease-in-out;
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  .checkout-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 9999;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    max-width: 400px;
  }
  
  .checkout-notification.show {
    transform: translateX(0);
    opacity: 1;
  }
  
  .checkout-notification.success { background: #10b981; }
  .checkout-notification.error { background: #ef4444; }
  .checkout-notification.warning { background: #f59e0b; }
  .checkout-notification.info { background: #3b82f6; }
  
  .animate-slideUp {
    animation: slideUp 0.5s ease forwards;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .payment-methods {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin: 15px 0;
  }
  
  .payment-method {
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .payment-method:hover {
    border-color: #2c3e50;
  }
  
  .payment-method.selected {
    border-color: #2c3e50;
    background: #f8f9fa;
  }
`;

document.head.appendChild(checkoutStyles);

// ==================== EXPOSE FUNCTIONS GLOBALLY ====================
window.removeFromCheckout = removeFromCheckout;
