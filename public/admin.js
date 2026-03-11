// Load Google Charts
google.charts.load('current', { packages: ['corechart'] });

/* ==========================
   1. ADMIN PROTECTION
========================== */

document.addEventListener("DOMContentLoaded", () => {

const role = localStorage.getItem("userRole");

if(role !== "admin"){

alert("❌ Access Denied");

window.location.href = "login.html";

return;

}

loadAdminData();

});


/* ==========================
   2. LOAD ADMIN DATA
========================== */

async function loadAdminData(){

try{

const res = await fetch("/adminData");

const data = await res.json();


/* ---------- STATS ---------- */

document.getElementById("total-users").innerText = data.users.length;

document.getElementById("total-products").innerText = data.products.length;

const revenue = data.orders.reduce((sum,o)=> sum + o.total ,0);

document.getElementById("total-revenue").innerText = "$" + revenue.toFixed(2);


/* ---------- PRODUCT TABLE ---------- */

const pBody = document.getElementById("inventory-table");

if(pBody){

pBody.innerHTML = data.products.map(p=>`

<tr class="hover:bg-gray-50">

<td class="p-3">
<img src="${p.image}" class="w-12 h-12 rounded object-cover">
</td>

<td class="p-3 font-medium">${p.name}</td>

<td class="p-3 text-teal-700 font-semibold">
$${p.price.toFixed(2)}
</td>

<td class="p-3">
<span class="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">
${p.category}
</span>
</td>

<td class="p-3">
<button onclick="deleteProduct('${p._id}')"
class="text-red-500 hover:text-red-700">
<i class="fas fa-trash"></i>
</button>
</td>

</tr>

`).join("");

}


/* ---------- ORDER TABLE ---------- */

const oBody = document.getElementById("orders-table");

if(oBody){

oBody.innerHTML = data.orders.map(o=>`

<tr class="hover:bg-gray-50">

<td class="p-3">
<strong>${o.userName}</strong><br>
<small>${o.phone || "No Phone"}</small>
</td>

<td class="p-3 text-sm max-w-xs">
${o.address || "No Address"}
</td>

<td class="p-3 text-sm">
${o.items.map(i=>i.name).join(", ")}
</td>

<td class="p-3 font-semibold text-teal-700">
$${o.total.toFixed(2)}
</td>

<td class="p-3">
<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
${o.status || "Pending"}
</span>
</td>

</tr>

`).join("");

}


/* ---------- DRAW SALES CHART ---------- */

if(data.orders.length > 0){

drawChart(data.orders);

}

}catch(err){

console.error("Dashboard error:",err);

alert("Failed to load admin data");

}

}


/* ==========================
   3. SALES CHART
========================== */

function drawChart(orders){

const chartData = [["Date","Revenue"]];

const grouped = {};

orders.forEach(order=>{

const date = new Date(order.createdAt || Date.now()).toLocaleDateString();

grouped[date] = (grouped[date] || 0) + order.total;

});

for(let date in grouped){

chartData.push([date, grouped[date]]);

}

google.charts.setOnLoadCallback(()=>{

const data = google.visualization.arrayToDataTable(chartData);

const options = {

title:"Daily Sales Performance",

curveType:"function",

legend:{ position:"bottom" },

colors:["#004D4D"],

backgroundColor:"transparent",

chartArea:{
width:"80%",
height:"70%"
}

};

const chartElement = document.getElementById("salesChart");

if(chartElement){

const chart = new google.visualization.LineChart(chartElement);

chart.draw(data,options);

}

});

}


/* ==========================
   4. ADD PRODUCT
========================== */

const productForm = document.getElementById("add-product-form");

if(productForm){

productForm.addEventListener("submit", async (e)=>{

e.preventDefault();

const pData = {

name: document.getElementById("pName").value,

price: parseFloat(document.getElementById("pPrice").value),

image: document.getElementById("pImage").value,

category: document.getElementById("pCategory").value,

description: document.getElementById("pDesc").value

};

try{

const res = await fetch("/addProduct",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body: JSON.stringify(pData)

});

if(res.ok){

alert("✅ Product Added Successfully");

productForm.reset();

loadAdminData();

}else{

alert("❌ Failed to add product");

}

}catch(err){

console.error(err);

}

});

}


/* ==========================
   5. DELETE PRODUCT
========================== */

async function deleteProduct(id){

if(!confirm("⚠ Are you sure you want to delete this product?")) return;

try{

const res = await fetch(`/deleteProduct/${id}`,{
method:"DELETE"
});

if(res.ok){

loadAdminData();

}else{

alert("Delete failed");

}

}catch(err){

console.error(err);

}

}


/* ==========================
   6. LOGOUT
========================== */

function logout(){

if(confirm("Logout from Admin Panel?")){

localStorage.removeItem("userName");
localStorage.removeItem("userEmail");
localStorage.removeItem("userRole");

window.location.href="login.html";

}

}
