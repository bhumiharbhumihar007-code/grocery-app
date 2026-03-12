document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector("button");
    const originalText = btn.innerText;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Registering...';
    btn.disabled = true;
    
    // Get form values
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
        resetButton(btn, originalText);
        return;
    }
    
    if (userData.password.length < 6) {
        showToast("Password must be at least 6 characters", "error");
        resetButton(btn, originalText);
        return;
    }
    
    if (!validateEmail(userData.email)) {
        showToast("Please enter a valid email address", "error");
        resetButton(btn, originalText);
        return;
    }
    
    try {
        const res = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });
        
        const data = await res.json();
        
        if (res.ok) {
            showToast("Registration successful! Please login.", "success");
            
            // Clear form
            document.getElementById("registerForm").reset();
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            showToast(data.error || "Registration failed", "error");
            resetButton(btn, originalText);
        }
    } catch (err) {
        console.error("Registration error:", err);
        showToast("Server connection failed", "error");
        resetButton(btn, originalText);
    }
});

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Reset button function
function resetButton(btn, originalText) {
    btn.innerHTML = originalText;
    btn.disabled = false;
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

// Real-time password strength indicator (optional enhancement)
document.getElementById("password")?.addEventListener("input", function(e) {
    const password = e.target.value;
    const strengthIndicator = document.getElementById("password-strength");
    
    if (!strengthIndicator && password.length > 0) {
        const indicator = document.createElement("div");
        indicator.id = "password-strength";
        indicator.className = "text-xs mt-1";
        this.parentNode.appendChild(indicator);
    }
    
    const indicator = document.getElementById("password-strength");
    if (indicator) {
        if (password.length === 0) {
            indicator.remove();
        } else if (password.length < 6) {
            indicator.innerHTML = '<span class="text-red-600">Weak - Too short</span>';
        } else if (password.length < 8) {
            indicator.innerHTML = '<span class="text-yellow-600">Medium - Add more characters</span>';
        } else {
            indicator.innerHTML = '<span class="text-green-600">Strong password</span>';
        }
    }
});

// Phone number formatting
document.getElementById("phone")?.addEventListener("input", function(e) {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
});

// Prevent form resubmission on page refresh
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}
