document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("logEmail").value;
  const password = document.getElementById("logPass").value;

  const btn = e.target.querySelector("button");
  const originalText = btn.innerText;
  btn.innerText = "Authenticating...";
  btn.disabled = true;

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("userName", data.userName);
      localStorage.setItem("userEmail", data.userEmail);
      localStorage.setItem("userRole", data.role);
      window.location.href = "index.html";
    } else {
      alert(data.error || "Login failed");
      btn.innerText = originalText;
      btn.disabled = false;
    }
  } catch (err) {
    alert("Server connection failed!");
    btn.innerText = originalText;
    btn.disabled = false;
  }
});
