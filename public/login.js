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
            // Save user data to localStorage including role
            localStorage.setItem("userName", data.user.name);
            localStorage.setItem("userEmail", data.user.email);
            localStorage.setItem("userRole", data.user.role || "user"); // default role=user

            // Redirect to homepage
            window.location.href = "index.html";
        } else {
            alert(data.error || "Invalid login credentials");
            btn.innerText = originalText;
            btn.disabled = false;
        }

    } catch (err) {
        console.error("Login Error:", err);
        alert("Server connection failed!");
        btn.innerText = originalText;
        btn.disabled = false;
    }
});
