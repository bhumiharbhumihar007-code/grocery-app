// Check admin access
if (localStorage.getItem("userRole") !== "admin") {
    window.location.href = "login.html";
}

document.getElementById("adminNameDisplay").textContent = localStorage.getItem("userName") || "Admin";

// Load dashboard data
loadAdminData();

async function loadAdminData() {
    try {
        const data = await apiCall(API.adminData);
        
        const revenue = data.orders.reduce((sum, o) => sum + (o.total || 0), 0);
        document.getElementById("totalRevenue").textContent = "₹" + revenue.toFixed(2);
        document.getElementById("totalOrders").textContent = data.orders.length;
        document.getElementById("totalCustomers").textContent = data.users.filter(u => u.role === "user").length;
        document.getElementById("totalMedicines").textContent = data.medicines.length;
        
        // Display medicines
        document.getElementById("medicinesTable").innerHTML = data.medicines.map(m => `
            <tr class="border-b">
                <td class="p-2">${m.name}</td>
                <td class="p-2">${m.category}</td>
                <td class="p-2">₹${m.price}</td>
                <td class="p-2">${m.stock}</td>
                <td class="p-2">
                    <button onclick="deleteMedicine('${m._id}')" class="text-red-600">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Display orders
        document.getElementById("ordersTable").innerHTML = data.orders.map(o => `
            <tr class="border-b">
                <td class="p-2">#${o._id.slice(-6)}</td>
                <td class="p-2">${o.userName}</td>
                <td class="p-2">${o.items.length} items</td>
                <td class="p-2">₹${o.total}</td>
                <td class="p-2">
                    <select onchange="updateStatus('${o._id}', this.value)" class="border rounded p-1">
                        <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                </td>
            </tr>
        `).join('');
        
        // Display customers
        document.getElementById("customersTable").innerHTML = data.users.filter(u => u.role === "user").map(u => `
            <tr class="border-b">
                <td class="p-2">${u.name}</td>
                <td class="p-2">${u.email}</td>
                <td class="p-2">${u.phone || 'N/A'}</td>
                <td class="p-2">${new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
        `).join('');
        
    } catch (err) {
        showToast("Failed to load data", "error");
    }
}

// Add medicine
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
        const data = await apiCall(API.addMedicine, "POST", medicine);
        showToast("Medicine added!", "success");
        e.target.reset();
        loadAdminData();
    } catch (err) {
        showToast("Failed to add", "error");
    }
});

// Delete medicine
async function deleteMedicine(id) {
    if (!confirm("Delete this medicine?")) return;
    try {
        await apiCall(API.deleteMedicine(id), "DELETE");
        showToast("Medicine deleted", "success");
        loadAdminData();
    } catch (err) {
        showToast("Failed to delete", "error");
    }
}

// Update order status
async function updateStatus(id, status) {
    try {
        await apiCall(API.updateOrderStatus(id), "PATCH", { status });
        showToast("Status updated", "success");
    } catch (err) {
        showToast("Failed to update", "error");
    }
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
