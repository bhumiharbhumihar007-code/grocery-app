// Check login
if (!localStorage.getItem("userId")) {
    window.location.href = "login.html";
}

const cart = JSON.parse(localStorage.getItem("cart")) || [];

if (cart.length === 0) {
    window.location.href = "index.html";
}

// Auto-fill user data
document.getElementById("name").value = localStorage.getItem("userName") || "";
document.getElementById("email").value = localStorage.getItem("userEmail") || "";

// Display order items
const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
document.getElementById("orderItems").innerHTML = cart.map(item => `
    <div class="flex justify-between border-b py-2">
        <span>${item.name} x ${item.quantity}</span>
        <span>₹${(item.price * item.quantity).toFixed(2)}</span>
    </div>
`).join('');
document.getElementById("orderTotal").textContent = total.toFixed(2);

// Submit order
document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const order = {
        userName: document.getElementById("name").value,
        userEmail: document.getElementById("email").value,
        userPhone: document.getElementById("phone").value,
        deliveryAddress: document.getElementById("address").value,
        items: cart.map(item => ({
            medicineId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: total
    };
    
    try {
        const data = await apiCall(API.order, "POST", order);
        showToast("Order placed successfully!", "success");
        localStorage.removeItem("cart");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);
    } catch (err) {
        showToast("Order failed", "error");
    }
});

function showToast(message, type) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.background = type === "success" ? "#059669" : "#dc2626";
    toast.classList.remove("translate-x-full");
    setTimeout(() => toast.classList.add("translate-x-full"), 3000);
}
