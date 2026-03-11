/* ==========================================
   LOGIN PROTECTION
========================================== */

const user = localStorage.getItem("userEmail");

if(!user){
window.location.href = "login.html";
}


/* ==========================================
   CART DATA
========================================== */

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const productContainer = document.getElementById("product-display");


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts(){

try{

const response = await fetch("/products");

if(!response.ok) throw new Error("Product fetch failed");

const products = await response.json();

if(productContainer){

productContainer.innerHTML =
products.length > 0
? products.map(p => createProductCard(p)).join("")
: `<p class="text-center text-gray-500 col-span-4">No products available</p>`;

}

}catch(err){

console.error(err);

if(productContainer){

productContainer.innerHTML =
`<p class="text-red-500 text-center col-span-4">Server error loading products</p>`;

}

}

}


/* =========================
   PRODUCT CARD
========================= */

function createProductCard(product){

return `

<div class="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden">

<img
src="${product.image}"
alt="${product.name}"
class="w-full h-48 object-cover"
/>

<div class="p-4">

<span class="text-xs bg-teal-700 text-white px-2 py-1 rounded">
${product.category}
</span>

<h3 class="font-bold text-lg mt-2">
${product.name}
</h3>

<p class="text-copper font-bold text-xl">
₹${product.price.toFixed(2)}
</p>

<button
onclick="addToCart('${product._id}','${product.name}',${product.price},'${product.image}')"
class="mt-3 w-full bg-teal-700 text-white py-2 rounded hover:opacity-90">

Add To Cart

</button>

</div>

</div>

`;

}


/* =========================
   ADD TO CART
========================= */

function addToCart(id,name,price,image){

const existing = cart.find(item => item.id === id);

if(existing){

existing.quantity += 1;

}else{

cart.push({
id,
name,
price,
image,
quantity:1
});

}

saveCart();
updateCartUI();

showToast(name + " added to cart");

}


/* =========================
   SAVE CART
========================= */

function saveCart(){

localStorage.setItem("cart", JSON.stringify(cart));

const total = cart.reduce((sum,item)=> sum + item.price * item.quantity,0);

localStorage.setItem("cartTotal", total.toFixed(2));

}


/* =========================
   UPDATE CART BADGE
========================= */

function updateCartUI(){

const badge = document.getElementById("cart-count");

if(!badge) return;

const totalItems = cart.reduce((sum,item)=>sum+item.quantity,0);

badge.innerText = totalItems;

}


/* =========================
   USER DISPLAY
========================= */

function checkUserLogin(){

const userName = localStorage.getItem("userName");

const userDisplay = document.getElementById("user-display");

if(userName && userDisplay){

userDisplay.innerText = "Hi, " + userName;

}

}


/* =========================
   LOGOUT
========================= */

function logout(){

localStorage.removeItem("userName");
localStorage.removeItem("userEmail");
localStorage.removeItem("userRole");
localStorage.removeItem("cart");

alert("Logged out successfully");

window.location.href = "login.html";

}


/* =========================
   CHECKOUT
========================= */

/* ==========================================
   LOGIN PROTECTION
========================================== */

const user = localStorage.getItem("userEmail");

if (!user) {
    window.location.href = "login.html";
}


/* ==========================================
   CART DATA
========================================== */

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const productContainer = document.getElementById("product-display");


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

    try {

        const response = await fetch("/products");

        if (!response.ok) throw new Error("Product fetch failed");

        const products = await response.json();

        // Show only available products
        const availableProducts = products.filter(p => p.isAvailable !== false);

        if (productContainer) {

            productContainer.innerHTML =
                availableProducts.length > 0
                    ? availableProducts.map(p => createProductCard(p)).join("")
                    : `<p class="text-center text-gray-500 col-span-4">No products available</p>`;

        }

    } catch (err) {

        console.error("Product load error:", err);

        if (productContainer) {

            productContainer.innerHTML =
                `<p class="text-red-500 text-center col-span-4">Server error loading products</p>`;

        }

    }

}


/* =========================
   PRODUCT CARD
========================= */

function createProductCard(product) {

    return `

<div class="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden">

<img
src="${product.image || 'https://via.placeholder.com/300'}"
alt="${product.name}"
class="w-full h-48 object-cover"
/>

<div class="p-4">

<span class="text-xs bg-teal-700 text-white px-2 py-1 rounded">
${product.category}
</span>

<h3 class="font-bold text-lg mt-2">
${product.name}
</h3>

<p class="text-copper font-bold text-xl">
₹${product.price.toFixed(2)}
</p>

<button
onclick="addToCart('${product._id}','${product.name}',${product.price},'${product.image}')"
class="mt-3 w-full bg-teal-700 text-white py-2 rounded hover:opacity-90">

Add To Cart

</button>

</div>

</div>

`;
}


/* =========================
   ADD TO CART
========================= */

function addToCart(id, name, price, image) {

    const existing = cart.find(item => item.id === id);

    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({
            id,
            name,
            price,
            image,
            quantity: 1
        });

    }

    saveCart();
    updateCartUI();

    showToast(name + " added to cart");

}


/* =========================
   SAVE CART
========================= */

function saveCart() {

    localStorage.setItem("cart", JSON.stringify(cart));

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    localStorage.setItem("cartTotal", total.toFixed(2));

}


/* =========================
   UPDATE CART BADGE
========================= */

function updateCartUI() {

    const badge = document.getElementById("cart-count");

    if (!badge) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    badge.innerText = totalItems;

}


/* =========================
   USER DISPLAY
========================= */

function checkUserLogin() {

    const userName = localStorage.getItem("userName");

    const userDisplay = document.getElementById("user-display");

    if (userName && userDisplay) {

        userDisplay.innerText = "Hi, " + userName;

    }

}


/* =========================
   LOGOUT
========================= */

function logout() {

    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("cart");

    alert("Logged out successfully");

    window.location.href = "login.html";

}


/* =========================
   CHECKOUT
========================= */

function goToCheckout() {

    if (cart.length === 0) {

        alert("Your cart is empty");
        return;

    }

    window.location.href = "checkout.html";

}


/* =========================
   TOAST MESSAGE
========================= */

function showToast(message) {

    const toast = document.createElement("div");

    toast.innerText = message;

    toast.className =
        "fixed bottom-5 right-5 bg-teal-700 text-white px-6 py-3 rounded-lg shadow-lg";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);

}


/* =========================
   PAGE LOAD
========================= */

document.addEventListener("DOMContentLoaded", () => {

    loadProducts();
    updateCartUI();
    checkUserLogin();

});
