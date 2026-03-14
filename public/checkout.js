// Check if user is logged in
if (!localStorage.getItem("userId")) {
    window.location.href = "login.html";
}

// Load cart from localStorage
const cart = JSON.parse(localStorage.getItem("cart")) || [];

if (cart.length === 0) {
    window.location.href = "index.html";
}

// Auto-fill user data
document.getElementById("fullName").value = localStorage.getItem("userName") || "";
document.getElementById("email").value = localStorage.getItem("userEmail") || "";

// Calculate total
const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

// Display order items
const orderItems = document.getElementById("orderItems");
orderItems.innerHTML = cart.map(item => `
    <div class="flex justify-between items-center border-b pb-2">
        <div>
            <p class="font-semibold">${item.name}</p>
            <p class="text-sm text-gray-600">Qty: ${item.quantity} x ₹${item.price}</p>
        </div>
        <span class="font-bold">₹${(item.price * item.quantity).toFixed(2)}</span>
    </div>
`).join('');

document.getElementById("orderTotal").textContent = total.toFixed(2);

// Handle form submission
document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector("button");
    submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-3 inline" viewBox="0 0 24 24">...</svg>Processing...';
    submitBtn.disabled = true;
    
    const orderData = {
        userId: localStorage.getItem("userId"),
        userName: document.getElementById("fullName").value,
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
        const response = await fetch("/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast("Order placed successfully!", "success");
            localStorage.removeItem("cart");
            
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
        } else {
            showToast(data.error || "Order failed", "error");
            submitBtn.innerHTML = 'Place Order';
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error("Order error:", error);
        showToast("Server connection failed", "error");
        submitBtn.innerHTML = 'Place Order';
        submitBtn.disabled = false;
    }
});

// Toast notification function
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

// Phone number formatting
document.getElementById("phone").addEventListener("input", function(e) {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
});
