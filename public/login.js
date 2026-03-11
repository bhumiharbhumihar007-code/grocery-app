document.getElementById("login-form").addEventListener("submit", async (e)=>{

e.preventDefault();

const email = document.getElementById("email").value;

const password = document.getElementById("password").value;


const response = await fetch("/login",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body: JSON.stringify({email,password})

});


const data = await response.json();


if(response.ok){

localStorage.setItem("userName",data.userName);
localStorage.setItem("userEmail",data.userEmail);
localStorage.setItem("userRole",data.role);

window.location.href="index.html";

}else{

alert(data.error);

}

});
