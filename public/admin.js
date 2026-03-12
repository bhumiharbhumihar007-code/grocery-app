// Check if user is admin
if (localStorage.getItem("userRole") !== "admin") {
    window.location.href = "login.html";
}

document.getElementById("adminNameDisplay").textContent = localStorage.getItem("userName") || "Admin";

// Load all data
loadAdminData();

async function loadAdminData() {
    try {
        const res = await fetch("/adminData");
        
        if (res.status === 403) {
            // Session expired or not admin
            logout();
            return;
        }
        
        const data = await res.json();
        
        // Calculate stats
        const revenue = data.orders.reduce((sum, o) => sum + (o.total || 0), 0);
        document.getElementById("totalRevenue").textContent = "₹" + revenue.toFixed(2);
        document.getElementById("totalOrders").textContent = data.orders.length;
        document.getElementById("totalCustomers").textContent = data.users.filter(u => u.role === "user").length;
        document.getElementById("totalMedicines").textContent = data.medicines.length;
        
        // Display medicines
        displayMedicines(data.medicines);
        
        // Display orders
        displayOrders(data.orders);
        
        // Display customers
        displayCustomers(data.users);
        
    } catch (err) {
        showToast("Failed to load data", "error");
    }
}

function displayMedicines(medicines) {
    const tbody = document.getElementById("medicinesTable");
    
    if (medicines.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">No medicines added yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = medicines.map(m => `
        <tr>
            <td class="px-4 py-3">${m.name}</td>
            <td class="px-4 py-3">${m.category}</td>
            <td class="px-4 py-3 font-semibold text-emerald-700">₹${m.price}</td>
            <td class="px-4 py-3">
                <span class="${m.stock < 10 ? 'text-red-600 font-semibold' : ''}">${m.stock}</span>
            </td>
            <td class="px-4 py-3">
                <button onclick="deleteMedicine('${m._id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function displayOrders(orders) {
    const tbody = document.getElementById("ordersTable");
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-3 text-center text-gray-500">No orders yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(o => `
        <tr>
            <td class="px-4 py-3 font-mono">#${o._id.slice(-6)}</td>
            <td class="px-4 py-3">
                <div class="font-medium">${o.userName}</div>
                <div class="text-xs text-gray-500">${o.userEmail}</div>
            </td>
            <td class="px-4 py-3">${o.items.length} items</td>
            <td class="px-4 py-3 font-semibold">₹${o.total}</td>
            <td class="px-4 py-3">
                <select onchange="updateStatus('${o._id}', this.value)" 
                    class="border rounded-lg px-2 py-1 text-sm ${getStatusClass(o.status)}">
                    <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">${new Date(o.createdAt).toLocaleDateString()}</td>
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

function displayCustomers(users) {
    const tbody = document.getElementById("customersTable");
    const customers = users.filter(u => u.role === "user");
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-3 text-center text-gray-500">No customers yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = customers.map(u => `
        <tr>
            <td class="px-4 py-3 font-medium">${u.name}</td>
            <td class="px-4 py-3">${u.email}</td>
            <td class="px-4 py-3">${u.phone || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-500">${new Date(u.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
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
        const res = await fetch("/addMedicine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(medicine)
        });
        
        if (res.ok) {
            showToast("Medicine added successfully!", "success");
            e.target.reset();
            loadAdminData();
        } else {
            const data = await res.json();
            showToast(data.error || "Failed to add medicine", "error");
        }
    } catch (err) {
        showToast("Server error", "error");
    }
});

// Delete medicine
async function deleteMedicine(id) {
    if (!confirm("Delete this medicine?")) return;
    
    try {
        const res = await fetch(`/deleteMedicine/${id}`, { method: "DELETE" });
        
        if (res.ok) {
            showToast("Medicine deleted", "success");
            loadAdminData();
        } else {
            showToast("Failed to delete", "error");
        }
    } catch (err) {
        showToast("Server error", "error");
    }
}

// Update order status
async function updateStatus(id, status) {
    try {
        const res = await fetch(`/order/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });
        
        if (res.ok) {
            showToast("Status updated", "success");
        } else {
            showToast("Failed to update", "error");
        }
    } catch (err) {
        showToast("Server error", "error");
    }
}

// Logout
function logout() {
    fetch("/logout", { method: "POST" })
        .finally(() => {
            localStorage.clear();
            window.location.href = "login.html";
        });
}

// Toast function
function showToast(message, type) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.background = type === "success" ? "#059669" : "#dc2626";
    toast.classList.remove("translate-x-full");
    
    setTimeout(() => {
        toast.classList.add("translate-x-full");
    }, 3000);
}
