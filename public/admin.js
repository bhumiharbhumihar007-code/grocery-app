// admin.js

// 1. Password Check
function checkLogin() {
    const pass = document.getElementById('adminPass').value;
    if (pass === "admin123") { // Aap apna password yahan set karein
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadAdminData();
    } else {
        alert("Wrong Password!");
    }
}

// 2. Fetch Data from Server
async function loadAdminData() {
    try {
        const response = await fetch('/adminData');
        const data = await response.json();

        // Update Stats
        document.getElementById('userCount').innerText = data.users.length;
        document.getElementById('orderCount').innerText = data.orders.length;
        
        let revenue = data.orders.reduce((sum, order) => sum + order.total, 0);
        document.getElementById('totalRevenue').innerText = "$" + revenue.toFixed(2);

        // Render Orders Table
        const orderTable = document.getElementById('orderTableBody');
        orderTable.innerHTML = data.orders.map(order => `
            <tr>
                <td><b>${order.userName}</b></td>
                <td>${order.items.map(i => i.name).join(", ")}</td>
                <td>$${order.total}</td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
            </tr>
        `).join('');

        // Render User List
        const userDiv = document.getElementById('userList');
        userDiv.innerHTML = data.users.map(u => `
            <p>📧 ${u.email} | 👤 ${u.name}</p>
        `).join('');

    } catch (err) {
        console.error("Error loading data:", err);
    }
}

// 3. Add New Product Logic
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
        name: document.getElementById('pName').value,
        price: document.getElementById('pPrice').value,
        image: document.getElementById('pImg').value,
        category: document.getElementById('pCat').value
    };

    const res = await fetch('/addProduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
    });

    if (res.ok) {
        alert("Product Added Successfully!");
        document.getElementById('productForm').reset();
        loadAdminData(); // Refresh UI
    }
});
