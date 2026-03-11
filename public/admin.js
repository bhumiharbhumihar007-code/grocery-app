// ==================== ADMIN AUTHENTICATION & PROTECTION ====================
(function checkAdminAccess() {
  document.addEventListener("DOMContentLoaded", async () => {
    const role = localStorage.getItem("userRole");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userName = localStorage.getItem("userName");
    
    // Check if user is admin
    if (!isLoggedIn || role !== "admin") {
      showAdminNotification("❌ Access Denied. Admin privileges required.", "error");
      
      // Log the access attempt
      console.warn(`Unauthorized admin access attempt by: ${localStorage.getItem("userEmail") || "Unknown"}`);
      
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
      return;
    }
    
    // Display admin name
    const adminNameElement = document.getElementById("admin-name");
    if (adminNameElement && userName) {
      adminNameElement.textContent = userName;
    }
    
    // Load initial data
    await loadAdminData();
    
    // Set up auto-refresh (every 30 seconds)
    setupAutoRefresh();
  });
})();

// ==================== AUTO REFRESH ====================
let refreshInterval;

function setupAutoRefresh() {
  // Clear existing interval
  if (refreshInterval) clearInterval(refreshInterval);
  
  // Set new interval
  refreshInterval = setInterval(() => {
    // Only refresh if page is visible
    if (!document.hidden) {
      loadAdminData(true); // silent refresh
    }
  }, 30000); // 30 seconds
}

// ==================== LOAD ADMIN DATA ====================
async function loadAdminData(silent = false) {
  try {
    if (!silent) showAdminLoading();
    
    const res = await fetch("/adminData");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const data = await res.json();
    
    // Update statistics
    updateStatistics(data);
    
    // Update tables
    updateInventoryTable(data.products);
    updateOrdersTable(data.orders);
    updateUsersTable(data.users);
    
    // Update charts if they exist
    updateCharts(data);
    
    if (!silent) hideAdminLoading();
    
    // Show last updated time
    updateLastUpdated();
    
  } catch (err) {
    console.error("Dashboard error:", err);
    if (!silent) {
      showAdminNotification("Failed to load admin data. Please refresh.", "error");
    }
  }
}

// ==================== UPDATE STATISTICS ====================
function updateStatistics(data) {
  // Basic stats
  document.getElementById("total-users").innerText = data.users.length;
  document.getElementById("total-products").innerText = data.products.length;
  document.getElementById("total-orders").innerText = data.orders.length;
  
  // Calculate revenue
  const revenue = data.orders.reduce((sum, o) => sum + (o.total || 0), 0);
  document.getElementById("total-revenue").innerText = "₹" + revenue.toFixed(2);
  
  // Calculate average order value
  const avgOrder = data.orders.length > 0 ? revenue / data.orders.length : 0;
  document.getElementById("avg-order").innerText = "₹" + avgOrder.toFixed(2);
  
  // Pending orders count
  const pendingOrders = data.orders.filter(o => o.status === "pending").length;
  document.getElementById("pending-orders").innerText = pendingOrders;
  
  // Low stock products
  const lowStock = data.products.filter(p => (p.stock || 0) < 10).length;
  document.getElementById("low-stock").innerText = lowStock;
  
  // Today's orders
  const today = new Date().toDateString();
  const todayOrders = data.orders.filter(o => 
    new Date(o.createdAt).toDateString() === today
  ).length;
  document.getElementById("today-orders").innerText = todayOrders;
  
  // Update stat cards with animations
  animateStatCards();
}

// ==================== UPDATE INVENTORY TABLE ====================
function updateInventoryTable(products) {
  const pBody = document.getElementById("inventory-table");
  if (!pBody) return;
  
  if (products.length === 0) {
    pBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center p-6 text-gray-500">
          No products found. Add your first product!
        </td>
      </tr>
    `;
    return;
  }
  
  pBody.innerHTML = products.map((p, index) => `
    <tr class="hover:bg-gray-50 transition-colors fade-in" style="animation-delay: ${index * 0.05}s">
      <td class="p-3">
        <img src="${p.image || '/images/default-product.jpg'}" 
             class="w-12 h-12 rounded-lg object-cover border"
             onerror="this.src='/images/default-product.jpg'">
      </td>
      <td class="p-3 font-medium">
        <div class="font-bold">${p.name}</div>
        <div class="text-xs text-gray-500">ID: ${p._id.slice(-6)}</div>
      </td>
      <td class="p-3 text-teal-700 font-semibold">
        ₹${(p.price || 0).toFixed(2)}
      </td>
      <td class="p-3">
        <span class="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
          ${p.category || 'Uncategorized'}
        </span>
      </td>
      <td class="p-3">
        <span class="px-2 py-1 ${(p.stock || 0) > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} rounded-full text-xs font-medium">
          ${p.stock || 0} in stock
        </span>
      </td>
      <td class="p-3">
        <div class="flex space-x-2">
          <button onclick="editProduct('${p._id}')" 
                  class="text-blue-500 hover:text-blue-700 transition p-1">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteProduct('${p._id}')" 
                  class="text-red-500 hover:text-red-700 transition p-1">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

// ==================== UPDATE ORDERS TABLE ====================
function updateOrdersTable(orders) {
  const oBody = document.getElementById("orders-table");
  if (!oBody) return;
  
  if (orders.length === 0) {
    oBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center p-6 text-gray-500">
          No orders found.
        </td>
      </tr>
    `;
    return;
  }
  
  oBody.innerHTML = orders.map((o, index) => `
    <tr class="hover:bg-gray-50 transition-colors fade-in" style="animation-delay: ${index * 0.05}s">
      <td class="p-3">
        <div class="font-bold">${o.userName || 'Guest'}</div>
        <div class="text-xs text-gray-500">${o.userEmail || 'No email'}</div>
        <div class="text-xs">📞 ${o.phone || 'No phone'}</div>
      </td>
      <td class="p-3 text-sm max-w-xs">
        <div class="text-xs text-gray-500">📍 ${o.address || 'No address'}</div>
        <div class="text-xs text-gray-400 mt-1">
          🕐 ${new Date(o.createdAt).toLocaleString()}
        </div>
      </td>
      <td class="p-3">
        <button onclick="viewOrderDetails('${o._id}')" 
                class="text-blue-500 hover:text-blue-700 text-sm">
          View Items (${o.items?.length || 0})
        </button>
      </td>
      <td class="p-3 font-semibold text-teal-700">
        ₹${(o.total || 0).toFixed(2)}
      </td>
      <td class="p-3">
        <select onchange="updateOrderStatus('${o._id}', this.value)" 
                class="px-2 py-1 rounded text-sm border ${getStatusClass(o.status)}">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>🕒 Pending</option>
          <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>⚙ Processing</option>
          <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>📦 Shipped</option>
          <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>✅ Delivered</option>
          <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
        </select>
      </td>
      <td class="p-3">
        <button onclick="deleteOrder('${o._id}')" 
                class="text-red-500 hover:text-red-700 transition p-1">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

// ==================== UPDATE USERS TABLE ====================
function updateUsersTable(users) {
  const uBody = document.getElementById("users-table");
  if (!uBody) return;
  
  uBody.innerHTML = users.map((u, index) => `
    <tr class="hover:bg-gray-50 transition-colors fade-in" style="animation-delay: ${index * 0.05}s">
      <td class="p-3">
        <div class="font-bold">${u.name}</div>
        <div class="text-xs text-gray-500">${u.email}</div>
      </td>
      <td class="p-3">
        <span class="px-2 py-1 ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} rounded-full text-xs">
          ${u.role || 'user'}
        </span>
      </td>
      <td class="p-3 text-sm text-gray-600">
        ${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
      </td>
      <td class="p-3">
        <button onclick="toggleUserRole('${u._id}', '${u.role}')" 
                class="text-blue-500 hover:text-blue-700 transition p-1">
          <i class="fas fa-user-cog"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

// ==================== PRODUCT MANAGEMENT ====================
const productForm = document.getElementById("add-product-form");
if (productForm) {
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const submitBtn = productForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;
    
    const pData = {
      name: document.getElementById("pName").value.trim(),
      price: parseFloat(document.getElementById("pPrice").value),
      image: document.getElementById("pImage").value.trim() || '/images/default-product.jpg',
      category: document.getElementById("pCategory").value,
      description: document.getElementById("pDesc").value.trim() || '',
      stock: parseInt(document.getElementById("pStock")?.value) || 0
    };
    
    // Validate
    if (!pData.name || !pData.price || !pData.category) {
      showAdminNotification("Please fill all required fields", "error");
      resetProductButton(submitBtn, originalText);
      return;
    }
    
    if (pData.price <= 0) {
      showAdminNotification("Price must be greater than 0", "error");
      resetProductButton(submitBtn, originalText);
      return;
    }
    
    try {
      const res = await fetch("/addProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showAdminNotification("✅ Product Added Successfully", "success");
        productForm.reset();
        await loadAdminData(true);
        
        // Close modal if open
        closeModal('add-product-modal');
      } else {
        showAdminNotification(data.error || "❌ Failed to add product", "error");
      }
    } catch (err) {
      console.error("Add product error:", err);
      showAdminNotification("Server error. Please try again.", "error");
    } finally {
      resetProductButton(submitBtn, originalText);
    }
  });
}

// Edit product
async function editProduct(productId) {
  try {
    const res = await fetch(`/product/${productId}`);
    const product = await res.json();
    
    // Populate and show edit modal
    showEditProductModal(product);
  } catch (err) {
    console.error("Edit product error:", err);
    showAdminNotification("Failed to load product details", "error");
  }
}

// Delete product
async function deleteProduct(id) {
  if (!confirm("⚠️ Are you sure you want to delete this product? This action cannot be undone.")) {
    return;
  }
  
  const btn = event?.target?.closest('button');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
  }
  
  try {
    const res = await fetch(`/deleteProduct/${id}`, { 
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    
    if (res.ok) {
      showAdminNotification("✅ Product deleted successfully", "success");
      await loadAdminData(true);
    } else {
      const data = await res.json();
      showAdminNotification(data.error || "Delete failed", "error");
    }
  } catch (err) {
    console.error("Delete error:", err);
    showAdminNotification("Failed to delete product", "error");
  } finally {
    if (btn) {
      btn.innerHTML = '<i class="fas fa-trash"></i>';
      btn.disabled = false;
    }
  }
}

// ==================== ORDER MANAGEMENT ====================
async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`/order/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    
    if (res.ok) {
      showAdminNotification(`✅ Order status updated to ${status}`, "success");
      await loadAdminData(true);
    } else {
      showAdminNotification("Failed to update order status", "error");
    }
  } catch (err) {
    console.error("Order update error:", err);
    showAdminNotification("Server error", "error");
  }
}

function viewOrderDetails(orderId) {
  // Fetch and show order details in modal
  fetch(`/order/${orderId}`)
    .then(res => res.json())
    .then(order => {
      showOrderDetailsModal(order);
    })
    .catch(err => {
      console.error("Order details error:", err);
      showAdminNotification("Failed to load order details", "error");
    });
}

async function deleteOrder(orderId) {
  if (!confirm("⚠️ Are you sure you want to delete this order?")) return;
  
  try {
    const res = await fetch(`/deleteOrder/${orderId}`, { method: "DELETE" });
    
    if (res.ok) {
      showAdminNotification("✅ Order deleted", "success");
      await loadAdminData(true);
    } else {
      showAdminNotification("Failed to delete order", "error");
    }
  } catch (err) {
    console.error("Delete order error:", err);
    showAdminNotification("Server error", "error");
  }
}

// ==================== USER MANAGEMENT ====================
async function toggleUserRole(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  
  if (!confirm(`Change user role to ${newRole}?`)) return;
  
  try {
    const res = await fetch(`/user/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole })
    });
    
    if (res.ok) {
      showAdminNotification(`✅ User role updated to ${newRole}`, "success");
      await loadAdminData(true);
    } else {
      showAdminNotification("Failed to update user role", "error");
    }
  } catch (err) {
    console.error("Role update error:", err);
    showAdminNotification("Server error", "error");
  }
}

// ==================== CHARTS ====================
let salesChart, ordersChart;

function updateCharts(data) {
  // Sales chart
  const salesCtx = document.getElementById('sales-chart')?.getContext('2d');
  if (salesCtx) {
    const last7Days = getLast7Days();
    const salesData = getSalesByDay(data.orders, last7Days);
    
    if (salesChart) salesChart.destroy();
    
    salesChart = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: last7Days,
        datasets: [{
          label: 'Sales (₹)',
          data: salesData,
          borderColor: '#2c3e50',
          backgroundColor: 'rgba(44, 62, 80, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  // Orders by status chart
  const ordersCtx = document.getElementById('orders-chart')?.getContext('2d');
  if (ordersCtx) {
    const statusCounts = {
      pending: data.orders.filter(o => o.status === 'pending').length,
      processing: data.orders.filter(o => o.status === 'processing').length,
      shipped: data.orders.filter(o => o.status === 'shipped').length,
      delivered: data.orders.filter(o => o.status === 'delivered').length,
      cancelled: data.orders.filter(o => o.status === 'cancelled').length
    };
    
    if (ordersChart) ordersChart.destroy();
    
    ordersChart = new Chart(ordersCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: ['#fbbf24', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444']
        }]
      }
    });
  }
}

// ==================== UTILITY FUNCTIONS ====================
function getStatusClass(status) {
  const classes = {
    'pending': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'processing': 'bg-blue-100 text-blue-700 border-blue-300',
    'shipped': 'bg-purple-100 text-purple-700 border-purple-300',
    'delivered': 'bg-green-100 text-green-700 border-green-300',
    'cancelled': 'bg-red-100 text-red-700 border-red-300'
  };
  return classes[status] || 'bg-gray-100 text-gray-700';
}

function showAdminNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `admin-notification ${type} fade-in`;
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
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
  }, 3000);
}

function showAdminLoading() {
  const loader = document.getElementById("admin-loader");
  if (loader) loader.classList.remove("hidden");
}

function hideAdminLoading() {
  const loader = document.getElementById("admin-loader");
  if (loader) loader.classList.add("hidden");
}

function animateStatCards() {
  document.querySelectorAll('.stat-card').forEach((card, index) => {
    card.style.animation = 'none';
    card.offsetHeight; // Trigger reflow
    card.style.animation = `slideIn 0.5s ease forwards ${index * 0.1}s`;
  });
}

function updateLastUpdated() {
  const element = document.getElementById("last-updated");
  if (element) {
    element.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  }
}

function resetProductButton(btn, originalText) {
  btn.innerHTML = originalText;
  btn.disabled = false;
}

// ==================== LOGOUT ====================
function logout() {
  if (confirm("Logout from Admin Panel?")) {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    showAdminNotification("Logged out successfully", "success");
    
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  }
}

// ==================== MODAL FUNCTIONS ====================
function showEditProductModal(product) {
  // Implementation for edit modal
  const modal = document.getElementById("edit-product-modal");
  if (modal) {
    document.getElementById("edit-product-id").value = product._id;
    document.getElementById("edit-pName").value = product.name;
    document.getElementById("edit-pPrice").value = product.price;
    document.getElementById("edit-pImage").value = product.image;
    document.getElementById("edit-pCategory").value = product.category;
    document.getElementById("edit-pDesc").value = product.description || '';
    document.getElementById("edit-pStock").value = product.stock || 0;
    
    modal.classList.remove("hidden");
  }
}

function showOrderDetailsModal(order) {
  // Implementation for order details modal
  const modal = document.getElementById("order-details-modal");
  if (modal) {
    const itemsHtml = order.items.map(item => `
      <div class="flex justify-between items-center p-2 border-b">
        <div class="flex items-center gap-3">
          <img src="${item.image}" class="w-12 h-12 object-cover rounded">
          <div>
            <div class="font-bold">${item.name}</div>
            <div class="text-sm text-gray-600">Qty: ${item.quantity}</div>
          </div>
        </div>
        <div class="font-bold">₹${(item.price * item.quantity).toFixed(2)}</div>
      </div>
    `).join('');
    
    document.getElementById("order-items").innerHTML = itemsHtml;
    document.getElementById("order-total").textContent = `₹${order.total.toFixed(2)}`;
    document.getElementById("order-customer").textContent = order.userName || 'Guest';
    document.getElementById("order-address").textContent = order.address || 'N/A';
    
    modal.classList.remove("hidden");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("hidden");
}

// ==================== EXPORT DATA ====================
function exportData(type) {
  let data, filename;
  
  switch(type) {
    case 'products':
      data = JSON.parse(localStorage.getItem('products') || '[]');
      filename = 'products_export.json';
      break;
    case 'orders':
      data = JSON.parse(localStorage.getItem('orders') || '[]');
      filename = 'orders_export.json';
      break;
    default:
      return;
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== HELPER FUNCTIONS ====================
function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  return days;
}

function getSalesByDay(orders, days) {
  // Implementation depends on your data structure
  return days.map(() => Math.random() * 1000); // Placeholder
}

// ==================== ADD CSS STYLES ====================
const adminStyles = document.createElement('style');
adminStyles.textContent = `
  .admin-notification {
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
  }
  
  .admin-notification.show {
    transform: translateX(0);
    opacity: 1;
  }
  
  .admin-notification.success { background: #10b981; }
  .admin-notification.error { background: #ef4444; }
  .admin-notification.info { background: #3b82f6; }
  
  .fade-in {
    animation: fadeIn 0.5s ease forwards;
    opacity: 0;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .stat-card {
    transition: all 0.3s ease;
  }
  
  .stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .hidden {
    display: none !important;
  }
`;

document.head.appendChild(adminStyles);
