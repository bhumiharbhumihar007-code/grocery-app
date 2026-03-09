// Google Charts load karein
google.charts.load('current', {'packages':['corechart']});

// 1. Admin Verification
function verifyAdmin() {
    const pass = document.getElementById('admin-pass').value; // ID as per new admin.html
    if (pass === "admin123") {
        document.getElementById('admin-lock').style.display = 'none';
        loadAdminData();
    } else {
        alert("Access Denied! Incorrect Password.");
    }
}

// 2. Fetch & Display All Data
async function loadAdminData() {
    try {
        const res = await fetch('/adminData');
        const data = await res.json();

        // Stats Update
        document.getElementById('total-users').innerText = data.users.length;
        document.getElementById('total-products').innerText = data.products.length;
        
        let revenue = data.orders.reduce((acc, curr) => acc + curr.total, 0);
        document.getElementById('total-revenue').innerText = "$" + revenue.toFixed(2);

        // Render Inventory Table
        const pBody = document.getElementById('inventory-table');
        pBody.innerHTML = data.products.map(p => `
            <tr>
                <td><img src="${p.image}" width="45" style="border-radius:5px; object-fit:cover;"></td>
                <td>${p.name}</td>
                <td>$${p.price.toFixed(2)}</td>
                <td><span class="category-tag">${p.category}</span></td>
                <td>
                    <button class="btn-delete" onclick="deleteProduct('${p._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Render Orders Table (Detailed View)
        const oBody = document.getElementById('orders-table');
        oBody.innerHTML = data.orders.map(o => `
            <tr>
                <td><strong>${o.userName}</strong><br><small>${o.phone || 'No Phone'}</small></td>
                <td><div style="font-size: 0.85rem; max-width: 150px;">${o.address || 'No Address'}</div></td>
                <td>${o.items.map(i => i.name).join(", ")}</td>
                <td>$${o.total.toFixed(2)}</td>
                <td><span class="status-pending">${o.status || 'Pending'}</span></td>
            </tr>
        `).join('');

        // Draw Analytics Chart
        if (data.orders.length > 0) {
            drawChart(data.orders);
        }
    } catch (err) {
        console.error("Dashboard error:", err);
    }
}

// 3. Sales Trend Chart
function drawChart(orders) {
    const chartData = [['Date', 'Revenue']];
    
    // Data group karne ki logic (Date-wise)
    const groupedData = {};
    orders.forEach(o => {
        const date = new Date(o.date).toLocaleDateString();
        groupedData[date] = (groupedData[date] || 0) + o.total;
    });

    for (let date in groupedData) {
        chartData.push([date, groupedData[date]]);
    }

    google.charts.setOnLoadCallback(() => {
        const data = google.visualization.arrayToDataTable(chartData);
        const options = {
            title: 'Daily Sales Performance',
            curveType: 'function',
            legend: { position: 'bottom' },
            colors: ['#27ae60'],
            backgroundColor: 'transparent',
            chartArea: { width: '80%', height: '70%' }
        };
        // Ensure you have <div id="salesChart"> in your HTML
        const chartElement = document.getElementById('salesChart');
        if (chartElement) {
            const chart = new google.visualization.LineChart(chartElement);
            chart.draw(data, options);
        }
    });
}

// 4. Add Product Logic
const productForm = document.getElementById('add-product-form');
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pData = {
            name: document.getElementById('pName').value,
            price: parseFloat(document.getElementById('pPrice').value),
            image: document.getElementById('pImage').value,
            category: document.getElementById('pCategory').value,
            description: document.getElementById('pDesc').value
        };

        const res = await fetch('/addProduct', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(pData)
        });

        if (res.ok) {
            alert("Product Successfully Added! 📦");
            productForm.reset();
            loadAdminData();
        }
    });
}

// 5. Delete Product Logic
async function deleteProduct(id) {
    if (confirm("🚨 Are you sure you want to delete this product?")) {
        try {
            const res = await fetch(`/deleteProduct/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadAdminData();
            }
        } catch (err) {
            alert("Delete operation failed.");
        }
    }
}

// 6. Logout Logic
function logout() {
    if (confirm("Do you want to logout from Admin Panel?")) {
        window.location.href = "login.html";
    }
}
