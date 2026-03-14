// Check if user is admin
if (localStorage.getItem("userRole") !== "admin") {
    window.location.href = "login.html";
}

// Display admin name
document.getElementById("adminNameDisplay").textContent = localStorage.getItem("userName") || "Admin";

// Load all data
loadAdminData();

async function loadAdminData() {
    try {
        const response = await fetch("/adminData");
        
        if (response.status === 403) {
            logout();
            return;
        }
        
        const data = await response.json();
        
        // Calculate stats
        const revenue = data.orders.reduce((sum, order) => sum + (order.total || 0), 0);
        document.getElementById("totalRevenue").textContent = "₹" + revenue.toFixed(2);
        document.getElementById("totalOrders").textContent = data.orders.length;
        document.getElementById("totalCustomers").textContent = data.users.filter(u => u.role === "user").length;
        document.getElementById("totalMedicines").textContent = data.medicines.length;
        
        // Display medicines
        displayMedicines(data.medicines);
        
        // Display orders
        displayOrders(data.orders);
        
    } catch (error) {
        showToast("Failed to load data", "error");
    }
}

function displayMedicines(medicines) {
    const tbody = document.getElementById("medicinesTable");
    
    if (medicines.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">No medicines added yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = medicines.map(medicine => `
        <tr>
            <td class="px-4 py-3">${medicine.name}</td>
            <td class="px-4 py-3">${medicine.category}</td>
            <td class="px-4 py-3 font-semibold text-emerald-700">₹${medicine.price}</td>
            <td class="px-4 py-3">
                <span class="${medicine.stock < 10 ? 'text-red-600 font-semibold' : ''}">${medicine.stock}</span>
            </td>
            <td class="px-4 py-3">
                <button onclick="deleteMedicine('${medicine._id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function displayOrders(orders) {
    const tbody = document.getElementById("ordersTable");
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">No orders yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td class="px-4 py-3 font-mono">#${order._id.slice(-6)}</td>
            <td class="px-4 py-3">
                <div class="font-medium">${order.userName}</div>
                <div class="text-xs text-gray-500">${order.userEmail}</div>
            </td>
            <td class="px-4 py-3">${order.items.length} items</td>
            <td class="px-4 py-3 font-semibold">₹${order.total}</td>
            <td class="px-4 py-3">
                <select onchange="updateStatus('${order._id}', this.value)" 
                    class="border rounded-lg px-2 py-1 text-sm ${getStatusClass(order.status)}">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    const classes = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'processing': 'bg-blue-100 text-blue-800',
        'shipped': 'bg-purple-100 text-purple-800',
        'delivered': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || '';
}

// Add medicine form
document.getElementById("medicineForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const medicine = {
        name: document.getElementById("medName").value,
        genericName: document.getElementById("medGeneric").value,
        manufacturer: document.getElementById("medManufacturer").value,
        price: parseFloat(document.getElementById("medPrice").value),
        category: document.getElementById("medCategory").value,
        stock: parseInt(document.getElementById("medStock").value) || 0,
        image: document.getElementById("medImage").value,
        description: document.getElementById("medDesc").value
    };
    
    try {
        const response = await fetch("/addMedicine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(medicine)
        });
        
        if (response.ok) {
            showToast("Medicine added successfully!", "success");
            e.target.reset();
            loadAdminData();
        } else {
            const data = await response.json();
            showToast(data.error || "Failed to add medicine", "error");
        }
    } catch (error) {
        showToast("Server error", "error");
    }
});

// Delete medicine
async function deleteMedicine(id) {
    if (!confirm("Delete this medicine?")) return;
    
    try {
        const response = await fetch(`/deleteMedicine/${id}`, { method: "DELETE" });
        
        if (response.ok) {
            showToast("Medicine deleted", "success");
            loadAdminData();
        } else {
            showToast("Failed to delete", "error");
        }
    } catch (error) {
        showToast("Server error", "error");
    }
}

// Update order status
async function updateStatus(id, status) {
    try {
        const response = await fetch(`/order/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showToast("Status updated", "success");
        } else {
            showToast("Failed to update", "error");
        }
    } catch (error) {
        showToast("Server error", "error");
    }
}

// Logout
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

// Toast function
function showToast(message, type) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    
    toast.textContent = message;
    toast.style.background = type === "success" ? "#059669" : "#dc2626";
    toast.classList.remove("translate-x-full");
    
    setTimeout(() => {
        toast.classList.add("translate-x-full");
    }, 3000);
}
