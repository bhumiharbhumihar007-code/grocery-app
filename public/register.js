document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector("button");
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Registering...';
    btn.disabled = true;
    
    const userData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim()
    };
    
    try {
        // ✅ FIXED: Added window.location.origin
        const res = await fetch(window.location.origin + "/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });
        
        const data = await res.json();
        
        if (res.ok) {
            showToast("Registration successful! Please login.", "success");
            document.getElementById("registerForm").reset();
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            showToast(data.error || "Registration failed", "error");
            resetButton(btn, "Register");
        }
    } catch (err) {
        console.error("Registration error:", err);
        showToast("Server connection failed. Please try again.", "error");
        resetButton(btn, "Register");
    }
});
