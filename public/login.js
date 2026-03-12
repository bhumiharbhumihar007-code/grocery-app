document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const btn = e.target.querySelector("button");
    
    btn.innerText = "Logging in...";
    btn.disabled = true;
    
    try {
        const response = await fetch(API.login, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include"
        });
        
        const data = await response.json();
        
        if (response.ok) {
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
        showToast("Server connection failed", "error");
        btn.innerText = "Login";
        btn.disabled = false;
    }
});

function showToast(message, type) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.background = type === "success" ? "#059669" : "#dc2626";
    toast.classList.remove("translate-x-full");
    
    setTimeout(() => {
        toast.classList.add("translate-x-full");
    }, 3000);
}
