document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const submitBtn = e.target.querySelector("button");
    
    // Show loading state
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Logging in...";
    submitBtn.disabled = true;
    
    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store user data
            localStorage.setItem("userId", data.user.id);
            localStorage.setItem("userName", data.user.name);
            localStorage.setItem("userEmail", data.user.email);
            localStorage.setItem("userRole", data.user.role);
            localStorage.setItem("isLoggedIn", "true");
            
            showToast("Login successful!", "success");
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === "admin") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "index.html";
                }
            }, 1000);
        } else {
            showToast(data.error || "Login failed", "error");
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error("Login error:", error);
        showToast("Server connection failed", "error");
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
});

// Toast notification function
function showToast(message, type) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    
    toast.textContent = message;
    toast.style.background = type === "success" ? "#059669" : "#dc2626";
    toast.classList.remove("translate-x-full");
    
    setTimeout(() => {
        toast.classList.add("translate-x-full");
    }, 3000);
}
