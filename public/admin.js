// admin.js
google.charts.load('current', {'packages':['corechart']});

function checkLogin() {
    if(document.getElementById('adminPass').value === "admin123") {
        document.getElementById('login-overlay').style.display = 'none';
        loadAdminData();
    } else { alert("Access Denied!"); }
}

async function loadAdminData() {
    const res = await fetch('/adminData');
    const data = await res.json();

    // Stats Logic
    document.getElementById('userCount').innerText = data.users.length;
    document.getElementById('orderCount').innerText = data.orders.length;
    let revenue = data.orders.reduce((acc, curr) => acc + curr.total, 0);
    document.getElementById('totalRev').innerText = "$" + revenue.toFixed(2);

    // Render Inventory
    const pBody = document.getElementById('pTableBody');
    pBody.innerHTML = data.products.map(p => `
        <tr>
            <td><img src="${p.image}" width="40" style="border-radius:5px;"></td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>$${p.price}</td>
            <td><button class="btn-delete" onclick="deleteProduct('${p._id}')">Delete</button></td>
        </tr>
    `).join('');

    // Render Orders
    const oBody = document.getElementById('oTableBody');
    oBody.innerHTML = data.orders.map(o => `
        <tr>
            <td>${o.userName}</td>
            <td>${o.items.map(i => i.name).join(", ")}</td>
            <td>$${o.total}</td>
            <td>${new Date(o.date).toLocaleDateString()}</td>
        </tr>
    `).join('');

    // Draw Graph
    drawChart(data.orders);
}

function drawChart(orders) {
    const chartData = [['Date', 'Sales']];
    orders.forEach(o => chartData.push([new Date(o.date).toLocaleDateString(), o.total]));
    
    google.charts.setOnLoadCallback(() => {
        const data = google.visualization.arrayToDataTable(chartData);
        const options = { title: 'Revenue Trend', curveType: 'function', legend: { position: 'bottom' }, colors: ['#27ae60'] };
        const chart = new google.visualization.LineChart(document.getElementById('myChart'));
        chart.draw(data, options);
    });
}

// Add Product
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pData = {
        name: document.getElementById('pName').value,
        price: document.getElementById('pPrice').value,
        image: document.getElementById('pImg').value,
        category: document.getElementById('pCat').value
    };
    await fetch('/addProduct', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(pData)
    });
    alert("Saved!");
    loadAdminData();
});

// Delete Product (Iske liye backend mein route hona zaroori hai)
async function deleteProduct(id) {
    if(confirm("Are you sure?")) {
        await fetch(`/deleteProduct/${id}`, { method: 'DELETE' });
        loadAdminData();
    }
}
