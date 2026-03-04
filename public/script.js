let cart = [];

async function loadProducts() {
  const res = await fetch("/products");
  const products = await res.json();
  const container = document.getElementById("products");

  container.innerHTML = products.map(p => `
    <div>
      <h3>${p.name}</h3>
      <p>₹${p.price}</p>
      <button onclick='addToCart(${JSON.stringify(p)})'>
        Add to Cart
      </button>
    </div>
  `).join('');
}

function addToCart(product) {
  cart.push(product);
  updateTotal();
}

function updateTotal() {
  let total = 0;
  cart.forEach(item => total += item.price);
  document.getElementById("total").innerText = total;
}

async function checkout() {
  let total = 0;
  cart.forEach(item => total += item.price);

  await fetch("/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: cart,
      total: total
    })
  });

  alert("Payment Successful ✅");
  cart = [];
  updateTotal();
}

loadProducts();
