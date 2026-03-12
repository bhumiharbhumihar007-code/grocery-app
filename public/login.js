document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const btn = e.target.querySelector("button");
    
    btn.innerText = "Logging in...";
    btn.disabled = true;
    
    try {
        // ✅ FIXED: Added window.location.origin
        const res = await fetch(window.location.origin + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem("userId", data.user.id);
            localStorage.setItem("userName", data.user.name);
            localStorage.setItem("userEmail", data.user.email);
            localStorage.setItem("userRole", data.user.role);
            localStorage.setItem("isLoggedIn", "true");
            
            showToast("Login successful!", "success");
            
            setTimeout(() => {
                if (data.user.role === "admin") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "index.html";
                }
            }, 1000);
        } else {
            showToast(data.error || "Login failed", "error");
            btn.innerText = "Login";
            btn.disabled = false;
        }
    } catch (err) {
        console.error("Login error:", err);
        showToast("Server connection failed. Please try again.", "error");
        btn.innerText = "Login";
        btn.disabled = false;
    }
});
