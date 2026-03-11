document.addEventListener("DOMContentLoaded", () => {

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const total = localStorage.getItem("cartTotal") || 0;

    const itemsContainer = document.getElementById("checkout-items");
    const totalDisplay = document.getElementById("checkout-total");
    const form = document.getElementById("checkout-form");


    /* ==========================
       SHOW CART ITEMS
    ========================== */

    if (itemsContainer) {

        if (cart.length === 0) {

            itemsContainer.innerHTML =
            `<p class="text-center text-gray-500">Your cart is empty</p>`;

        } else {

            itemsContainer.innerHTML = cart.map(item => `

            <div class="flex justify-between items-center border-b py-3">

                <div>
                    <p class="font-semibold">${item.name}</p>

                    <p class="text-sm text-gray-500">
                    Qty: ${item.quantity}
                    </p>
                </div>

                <p class="text-copper font-semibold">
                ₹${(item.price * item.quantity).toFixed(2)}
                </p>

            </div>

            `).join("");

        }

    }


    if (totalDisplay) {
        totalDisplay.innerText = "₹" + total;
    }


    /* ==========================
       FORM SUBMIT
    ========================== */

    if (form) {

        form.addEventListener("submit", async (e) => {

            e.preventDefault();

            if (cart.length === 0) {
                alert("Cart is empty!");
                return;
            }

            const orderData = {

                userName: document.getElementById("custName").value,
                userEmail: document.getElementById("custEmail").value,
                phone: document.getElementById("custPhone").value,
                address: document.getElementById("custAddress").value,
                items: cart,
                total: parseFloat(total)

            };


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

                    localStorage.removeItem("cart");
                    localStorage.removeItem("cartTotal");

                    window.location.href = "index.html";

                } else {

                    alert(result.error || "Order failed");

                }

            } catch (err) {

                console.error(err);
                alert("Server error. Please try again.");

            }

        });

    }

});
