document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("login-form");

form.addEventListener("submit", async (e) => {

e.preventDefault();

const email = document.getElementById("logEmail").value;
const password = document.getElementById("logPass").value;

try{

const res = await fetch("/login",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body: JSON.stringify({ email, password })

});

const data = await res.json();

if(res.ok){

localStorage.setItem("userName", data.user.name);
localStorage.setItem("userEmail", data.user.email);
localStorage.setItem("userRole", data.user.role);


/* Redirect based on role */

if(data.user.role === "admin"){

window.location.href = "admin.html";

}else{

window.location.href = "index.html";

}

}else{

alert(data.error || "Login failed");

}

}catch(err){

console.error("Login error:", err);

alert("Server error. Please try again.");

}

});

});
