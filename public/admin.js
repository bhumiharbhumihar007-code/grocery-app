function login() {
  const pass = document.getElementById("password").value;

  if (pass === "admin123") {
    document.getElementById("login").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadData();
  } else {
    alert("Wrong Password ❌");
  }
}

async function loadData() {
  const res = await fetch("/adminData");
  const data = await res.json();

  document.getElementById("users").innerHTML =
    data.users.map(u => `
      <div>
        Name: ${u.name} <br>
        Email: ${u.email} <br>
        Password: ${u.password}
        <hr>
      </div>
    `).join('');

  document.getElementById("orders").innerHTML =
    data.orders.map(o => `
      <div>
        User: ${o.userName} <br>
        Total: ₹${o.total} <br>
        Date: ${new Date(o.date).toLocaleString()}
        <hr>
      </div>
    `).join('');
}
