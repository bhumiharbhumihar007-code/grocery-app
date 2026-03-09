// Checkout Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. LocalStorage se cart aur total uthao
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const total = localStorage.getItem('cartTotal') || 0;
    
    document.getElementById('checkout-total').innerText = "$" + total;

    // 2. Form Submit handle karo
    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const orderData = {
            userName: document.getElementById('custName').value,
            userEmail: document.getElementById('custEmail').value,
            phone: document.getElementById('custPhone').value,
            address: document.getElementById('custAddress').value,
            items: cart,
            total: parseFloat(total)
        };

        try {
            const response = await fetch('/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (response.ok) {
                alert("🎉 Success! " + result.message);
                localStorage.removeItem('cart'); // Cart khali kar do
                window.location.href = "index.html"; // Home par bhej do
            } else {
                alert("Error: " + result.error);
            }
        } catch (err) {
            console.error("Order failed:", err);
            alert("Server connection failed!");
        }
    });
});
