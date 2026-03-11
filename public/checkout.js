// Checkout Logic

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================
       1. LOAD CART FROM STORAGE
    ========================== */

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const total = parseFloat(localStorage.getItem("cartTotal")) || 0;

    const totalElement = document.getElementById("checkout-total");

    if (totalElement) {
        totalElement.innerText = "₹" + total.toFixed(2);
    }

    // If cart empty
    if (cart.length === 0) {
        alert("Your cart is empty.");
        window.location.href = "index.html";
        return;
    }


    /* ==========================
       2. HANDLE FORM SUBMIT
    ========================== */

    const form = document.getElementById("checkout-form");

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = document.getElementById("custName").value.trim();
        const email = document.getElementById("custEmail").value.trim();
        const phone = document.getElementById("custPhone").value.trim();
        const address = document.getElementById("custAddress").value.trim();

        // Basic validation
        if (!name || !email || !phone || !address) {
            alert("Please fill all fields.");
            return;
        }

        const orderData = {
            userName: name,
            userEmail: email,
            phone: phone,
            address: address,
            items: cart,
            total: total
        };

        const button = form.querySelector("button");
        button.innerText = "Placing Order...";
        button.disabled = true;

        try {

            const response = await fetch("/order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (response.ok) {

                alert("🎉 Order placed successfully!");

                // Clear cart
                localStorage.removeItem("cart");
                localStorage.removeItem("cartTotal");

                // Redirect
                window.location.href = "index.html";

            } else {

                alert("❌ " + (result.error || "Order failed"));

            }

        } catch (err) {

            console.error("Checkout error:", err);
            alert("Server connection failed.");

        } finally {

            button.innerText = "Place Order";
            button.disabled = false;

        }

    });

});
