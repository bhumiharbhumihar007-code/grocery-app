document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector("button");
    const originalText = btn.innerText;
    btn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-3 inline" viewBox="0 0 24 24">...</svg>Registering...';
    btn.disabled = true;
    
    const userData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim()
    };
    
    try {
        const response = await fetch(API.register, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
            credentials: "include"
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast("Registration successful! Please login.", "success");
            document.getElementById("registerForm").reset();
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            showToast(data.error || "Registration failed", "error");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        showToast("Server connection failed", "error");
        btn.innerHTML = originalText;
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
