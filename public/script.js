// LOGIN PROTECTION
if(!localStorage.getItem("userName")){
    window.location.href = "/login.html";
}

let cart = JSON.parse(localStorage.getItem("cart")) || [];
const productContainer = document.getElementById("product-display");

// LOAD PRODUCTS
async function loadProducts(){
  try{
    const res = await fetch("/products");
    if(!res.ok) throw new Error("Failed to fetch products");
    const products = await res.json();
    productContainer.innerHTML = products.length>0 
      ? products.map(p=>createProductCard(p)).join("")
      : `<p class="text-center text-gray-500 col-span-4">No products available.</p>`;
  } catch(err){
    console.error(err);
    productContainer.innerHTML = `<p class="text-red-500 text-center col-span-4">Server error loading products</p>`;
  }
}

// PRODUCT CARD
function createProductCard(p){
  return `
  <div class="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden group">
    <div class="relative">
      <img src="${p.image}" alt="${p.name}" class="w-full h-48 object-cover group-hover:scale-105 transition"/>
      <span class="absolute top-3 left-3 bg-tealMain text-white text-xs px-2 py-1 rounded">${p.category}</span>
    </div>
    <div class="p-4">
      <h3 class="font-bold text-lg text-charcoal">${p.name}</h3>
      <p class="text-copper font-bold text-xl mt-1">₹${p.price.toFixed(2)}</p>
      <button onclick="addToCart('${p._id}','${p.name}',${p.price},'${p.image}')"
      class="mt-4 w-full bg-tealMain text-white py-2 rounded-lg hover:opacity-90 transition">Add To Cart</button>
    </div>
  </div>`;
}

// ADD TO CART
function addToCart(id,name,price,image){
  const existing = cart.find(i=>i.id===id);
  if(existing) existing.quantity+=1;
  else cart.push({id,name,price,image,quantity:1});
  saveCart(); updateCartUI(); showToast(name + " added to cart");
}

// SAVE CART
function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  const total = cart.reduce((sum,i)=>sum+i.price*i.quantity,0);
  localStorage.setItem("cartTotal", total.toFixed(2));
}

// UPDATE CART UI
function updateCartUI(){
  const badge = document.getElementById("cart-count");
  if(!badge) return;
  const totalItems = cart.reduce((sum,i)=>sum+i.quantity,0);
  badge.innerText = totalItems;
}

// CHECK USER LOGIN
function checkUserLogin(){
  const userName = localStorage.getItem("userName");
  const userDisplay = document.getElementById("user-display");
  if(userName && userDisplay){
    userDisplay.innerText = "Hi, "+userName;
    userDisplay.classList.remove("hidden");
  }
}

// LOGOUT
function logout(){
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  alert("Logged out successfully");
  window.location.reload();
}

// SIMPLE TOAST
function showToast(msg){
  const toast = document.createElement("div");
  toast.innerText = msg;
  toast.className="fixed bottom-6 right-6 bg-tealMain text-white px-6 py-3 rounded-lg shadow-lg";
  document.body.appendChild(toast);
  setTimeout(()=>toast.remove(),2500);
}

// PAGE LOAD
document.addEventListener("DOMContentLoaded", ()=>{
  loadProducts();
  updateCartUI();
  checkUserLogin();
});
