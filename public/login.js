// Login Form Handler
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("logEmail").value.trim();
  const password = document.getElementById("logPass").value;
  const btn = e.target.querySelector("button");
  const originalText = btn.innerText;
  
  // Client-side validation
  if (!email || !password) {
    showNotification("Please fill in all fields", "error");
    return;
  }
  
  if (!validateEmail(email)) {
    showNotification("Please enter a valid email address", "error");
    return;
  }
  
  btn.innerText = "Authenticating...";
  btn.disabled = true;
  
  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // Store user data securely
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("loginTime", new Date().toISOString());
      
      showNotification("Login successful! Redirecting...", "success");
      
      // Redirect based on role
      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else {
          window.location.href = "index.html";
        }
      }, 1000);
    } else {
      showNotification(data.error || "Login failed", "error");
      resetButton(btn, originalText);
    }
  } catch (err) {
    console.error("Login error:", err);
    showNotification("Server connection failed! Please try again.", "error");
    resetButton(btn, originalText);
  }
});

// Registration Form Handler
document.getElementById("register-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPass").value;
  const confirmPassword = document.getElementById("regConfirmPass")?.value;
  const btn = e.target.querySelector("button");
  const originalText = btn.innerText;
  
  // Validation
  if (!name || !email || !password) {
    showNotification("Please fill in all fields", "error");
    return;
  }
  
  if (name.length < 2) {
    showNotification("Name must be at least 2 characters", "error");
    return;
  }
  
  if (!validateEmail(email)) {
    showNotification("Please enter a valid email address", "error");
    return;
  }
  
  if (password.length < 6) {
    showNotification("Password must be at least 6 characters", "error");
    return;
  }
  
  if (confirmPassword && password !== confirmPassword) {
    showNotification("Passwords do not match", "error");
    return;
  }
  
  btn.innerText = "Creating Account...";
  btn.disabled = true;
  
  try {
    const res = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      showNotification("Registration successful! Please login.", "success");
      
      // Clear form
      e.target.reset();
      
      // Switch to login tab if exists
      const loginTab = document.querySelector('[data-tab="login"]');
      if (loginTab) {
        setTimeout(() => {
          loginTab.click();
        }, 1500);
      }
    } else {
      showNotification(data.error || "Registration failed", "error");
      resetButton(btn, originalText);
    }
  } catch (err) {
    console.error("Registration error:", err);
    showNotification("Server connection failed! Please try again.", "error");
    resetButton(btn, originalText);
  }
});

// Logout Function
function logout() {
  // Clear all stored data
  localStorage.clear();
  sessionStorage.clear();
  
  showNotification("Logged out successfully", "success");
  
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
}

// Check Authentication Status
function checkAuth() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const loginTime = localStorage.getItem("loginTime");
  const currentPage = window.location.pathname.split("/").pop();
  
  // Session timeout (8 hours)
  if (loginTime) {
    const elapsed = new Date() - new Date(loginTime);
    const eightHours = 8 * 60 * 60 * 1000;
    
    if (elapsed > eightHours) {
      logout();
      showNotification("Session expired. Please login again.", "info");
      return false;
    }
  }
  
  // Redirect if not logged in (except login page)
  if (!isLoggedIn && !currentPage.includes("login")) {
    window.location.href = "login.html";
    return false;
  }
  
  // Redirect if logged in and on login page
  if (isLoggedIn && currentPage.includes("login")) {
    const role = localStorage.getItem("userRole");
    if (role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "index.html";
    }
    return false;
  }
  
  return true;
}

// Display User Info in Navbar
function displayUserInfo() {
  const userName = localStorage.getItem("userName");
  const userRole = localStorage.getItem("userRole");
  const userInfoElement = document.getElementById("user-info");
  
  if (userName && userInfoElement) {
    userInfoElement.innerHTML = `
      <div class="user-dropdown">
        <span class="user-name">👤 ${userName}</span>
        <span class="user-role-badge">${userRole || 'user'}</span>
        <div class="dropdown-content">
          <a href="#" onclick="showProfile()">Profile</a>
          <a href="#" onclick="showOrders()">My Orders</a>
          <a href="#" onclick="logout()">Logout</a>
        </div>
      </div>
    `;
  }
}

// Show Profile Modal
function showProfile() {
  const modal = document.getElementById("profile-modal");
  if (!modal) {
    createProfileModal();
  } else {
    updateProfileModal();
    modal.style.display = "block";
  }
}

// Create Profile Modal
function createProfileModal() {
  const modal = document.createElement("div");
  modal.id = "profile-modal";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" onclick="document.getElementById('profile-modal').style.display='none'">&times;</span>
      <h2>User Profile</h2>
      <div class="profile-info">
        <p><strong>Name:</strong> <span id="profile-name"></span></p>
        <p><strong>Email:</strong> <span id="profile-email"></span></p>
        <p><strong>Role:</strong> <span id="profile-role"></span></p>
        <p><strong>Member Since:</strong> <span id="profile-joined"></span></p>
      </div>
      <button onclick="loadUserOrders()" class="btn-primary">View Orders</button>
    </div>
  `;
  document.body.appendChild(modal);
  updateProfileModal();
}

// Update Profile Modal
function updateProfileModal() {
  document.getElementById("profile-name").textContent = localStorage.getItem("userName") || "N/A";
  document.getElementById("profile-email").textContent = localStorage.getItem("userEmail") || "N/A";
  document.getElementById("profile-role").textContent = localStorage.getItem("userRole") || "user";
  
  // Get join date from localStorage or set to current
  const joinDate = localStorage.getItem("joinDate") || new Date().toLocaleDateString();
  document.getElementById("profile-joined").textContent = joinDate;
}

// Show Orders
async function showOrders() {
  const userEmail = localStorage.getItem("userEmail");
  
  if (!userEmail) {
    showNotification("Please login to view orders", "warning");
    return;
  }
  
  try {
    showLoading();
    const res = await fetch(`/orders/${encodeURIComponent(userEmail)}`);
    const data = await res.json();
    hideLoading();
    
    if (res.ok && data.orders) {
      displayOrdersModal(data.orders);
    } else {
      showNotification("No orders found", "info");
    }
  } catch (err) {
    hideLoading();
    console.error("Orders fetch error:", err);
    showNotification("Failed to load orders", "error");
  }
}

// Display Orders Modal
function displayOrdersModal(orders) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "orders-modal";
  
  let ordersHtml = orders.map(order => `
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">Order #${order._id.slice(-6)}</span>
        <span class="order-status ${order.status}">${order.status}</span>
        <span class="order-date">${new Date(order.createdAt).toLocaleDateString()}</span>
      </div>
      <div class="order-details">
        <p><strong>Items:</strong> ${order.items.length}</p>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <p><strong>Address:</strong> ${order.address}</p>
      </div>
      <button onclick="viewOrderDetails('${order._id}')" class="btn-small">View Details</button>
    </div>
  `).join('');
  
  modal.innerHTML = `
    <div class="modal-content large">
      <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
      <h2>My Orders</h2>
      <div class="orders-list">
        ${ordersHtml || "<p>No orders found</p>"}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Helper Functions
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function resetButton(btn, originalText) {
  btn.innerText = originalText;
  btn.disabled = false;
}

function showNotification(message, type = "info") {
  // Remove existing notifications
  const existing = document.querySelector(".notification");
  if (existing) existing.remove();
  
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">&times;</button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function showLoading() {
  const loader = document.createElement("div");
  loader.className = "loader";
  loader.id = "global-loader";
  loader.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(loader);
}

function hideLoading() {
  const loader = document.getElementById("global-loader");
  if (loader) loader.remove();
}

// Add CSS styles dynamically
function addStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      animation: slideIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .notification.success { background: #4caf50; }
    .notification.error { background: #f44336; }
    .notification.warning { background: #ff9800; }
    .notification.info { background: #2196f3; }
    
    .notification button {
      background: transparent;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0 5px;
    }
    
    .user-dropdown {
      position: relative;
      display: inline-block;
      cursor: pointer;
    }
    
    .user-name {
      padding: 8px 15px;
      background: #f8f9fa;
      border-radius: 20px;
      display: inline-block;
    }
    
    .user-role-badge {
      font-size: 12px;
      padding: 2px 8px;
      background: #007bff;
      color: white;
      border-radius: 12px;
      margin-left: 5px;
    }
    
    .dropdown-content {
      display: none;
      position: absolute;
      right: 0;
      background: white;
      min-width: 160px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
      border-radius: 4px;
      z-index: 1;
    }
    
    .dropdown-content a {
      color: #333;
      padding: 12px 16px;
      text-decoration: none;
      display: block;
    }
    
    .dropdown-content a:hover {
      background: #f8f9fa;
    }
    
    .user-dropdown:hover .dropdown-content {
      display: block;
    }
    
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
    }
    
    .modal-content {
      background: white;
      margin: 10% auto;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      position: relative;
    }
    
    .modal-content.large {
      max-width: 800px;
    }
    
    .close {
      position: absolute;
      right: 20px;
      top: 10px;
      font-size: 28px;
      cursor: pointer;
    }
    
    .order-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .order-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .order-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .order-status.pending { background: #fff3cd; color: #856404; }
    .order-status.processing { background: #cce5ff; color: #004085; }
    .order-status.shipped { background: #d4edda; color: #155724; }
    .order-status.delivered { background: #d1e7dd; color: #0f5132; }
    .order-status.cancelled { background: #f8d7da; color: #721c24; }
    
    .loader {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255,255,255,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .btn-primary, .btn-small {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s;
    }
    
    .btn-primary:hover, .btn-small:hover {
      background: #0056b3;
    }
    
    .btn-primary:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  addStyles();
  checkAuth();
  displayUserInfo();
  
  // Add logout button listener
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
});

// Auto-refresh session
setInterval(() => {
  if (localStorage.getItem("isLoggedIn") === "true") {
    // Optionally refresh token or just update login time
    localStorage.setItem("loginTime", new Date().toISOString());
  }
}, 5 * 60 * 1000); // Every 5 minutes
