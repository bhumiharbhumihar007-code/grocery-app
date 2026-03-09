// script.js
async function fetchProducts() {
    try {
        const res = await fetch('/api/products'); // Your backend route
        const products = await res.json();
        
        const container = document.getElementById('product-container');
        container.innerHTML = ''; // Clear loading text

        products.forEach(product => {
            const card = `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>$${product.price}</p>
                    <button onclick="addToCart('${product._id}')">Add to Cart</button>
                </div>
            `;
            container.innerHTML += card;
        });
    } catch (err) {
        console.error("Could not load products", err);
    }
}

// Call this when page loads
window.onload = fetchProducts;
