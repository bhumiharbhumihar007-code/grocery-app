document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector("button");
    const originalText = submitBtn.innerText;
    submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-3 inline" viewBox="0 0 24 24">...</svg>Registering...';
    submitBtn.disabled = true;
    
    const userData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim()
    };
    
    // Basic validation
    if (!userData.name || !userData.email || !userData.password) {
        showToast("Please fill all required fields", "error");
        resetButton(submitBtn, originalText);
        return;
    }
    
    if (userData.password.length < 6) {
        showToast("Password must be at least 6 characters", "error");
        resetButton(submitBtn, originalText);
        return;
    }
    
    if (!validateEmail(userData.email)) {
        showToast("Please enter a valid email address", "error");
        resetButton(submitBtn, originalText);
        return;
    }
    
    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
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
            resetButton(submitBtn, originalText);
        }
    } catch (error) {
        console.error("Registration error:", error);
        showToast("Server connection failed", "error");
        resetButton(submitBtn, originalText);
    }
});

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Reset button function
function resetButton(button, originalText) {
    button.innerHTML = originalText;
    button.disabled = false;
}

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

// Phone number formatting
document.getElementById("phone")?.addEventListener("input", function(e) {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
});
