// Enhanced Registration Form Handler
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Get form elements
  const submitBtn = document.getElementById("submit-btn");
  const originalText = submitBtn.innerText;
  
  // Get form values and trim them
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPass").value;
  const confirmPassword = document.getElementById("regConfirmPass")?.value;
  const termsCheck = document.getElementById("terms-check")?.checked;
  
  // Client-side validation
  const validationErrors = [];
  
  // Name validation
  if (!name) {
    validationErrors.push("Name is required");
    highlightField("regName");
  } else if (name.length < 2) {
    validationErrors.push("Name must be at least 2 characters");
    highlightField("regName");
  } else if (name.length > 50) {
    validationErrors.push("Name must be less than 50 characters");
    highlightField("regName");
  }
  
  // Email validation
  if (!email) {
    validationErrors.push("Email is required");
    highlightField("regEmail");
  } else if (!validateEmail(email)) {
    validationErrors.push("Please enter a valid email address");
    highlightField("regEmail");
  }
  
  // Password validation
  if (!password) {
    validationErrors.push("Password is required");
    highlightField("regPass");
  } else if (password.length < 6) {
    validationErrors.push("Password must be at least 6 characters");
    highlightField("regPass");
  } else if (password.length > 50) {
    validationErrors.push("Password must be less than 50 characters");
    highlightField("regPass");
  } else if (!validatePasswordStrength(password)) {
    validationErrors.push("Password must contain at least one uppercase letter, one lowercase letter, and one number");
    highlightField("regPass");
  }
  
  // Confirm password validation
  if (confirmPassword !== undefined && password !== confirmPassword) {
    validationErrors.push("Passwords do not match");
    highlightField("regConfirmPass");
  }
  
  // Terms and conditions validation
  if (termsCheck !== undefined && !termsCheck) {
    validationErrors.push("You must agree to the Terms and Conditions");
    highlightField("terms-check");
  }
  
  // Show validation errors if any
  if (validationErrors.length > 0) {
    showNotification(validationErrors.join("<br>"), "error");
    resetButton(submitBtn, originalText);
    return;
  }
  
  // Show loading state
  submitBtn.innerText = "Creating Account...";
  submitBtn.disabled = true;
  
  // Add loading spinner to button
  submitBtn.innerHTML = '<span class="spinner-small"></span> Creating Account...';
  
  try {
    const res = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // Success notification
      showNotification("Account Created Successfully! 🎉", "success");
      
      // Clear form
      document.getElementById("register-form").reset();
      
      // Remove highlights
      removeAllHighlights();
      
      // Store email for pre-filling login form
      sessionStorage.setItem("registeredEmail", email);
      
      // Redirect to login after delay
      setTimeout(() => {
        window.location.href = "login.html?registered=true";
      }, 2000);
      
    } else {
      // Handle specific error cases
      let errorMessage = data.error || "Registration Failed";
      
      if (res.status === 400) {
        if (errorMessage.includes("already exists")) {
          errorMessage = "An account with this email already exists. Please login instead.";
          highlightField("regEmail");
        } else if (errorMessage.includes("password")) {
          highlightField("regPass");
        }
      }
      
      showNotification(errorMessage, "error");
      resetButton(submitBtn, originalText);
    }
  } catch (err) {
    console.error("Registration error:", err);
    
    if (!navigator.onLine) {
      showNotification("You are offline. Please check your internet connection.", "error");
    } else {
      showNotification("Server connection failed. Please try again later.", "error");
    }
    
    resetButton(submitBtn, originalText);
  }
});

// Password strength validation
function validatePasswordStrength(password) {
  // At least one uppercase, one lowercase, one number
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumbers;
}

// Password strength indicator
document.getElementById("regPass")?.addEventListener("input", function(e) {
  const password = e.target.value;
  const strengthIndicator = document.getElementById("password-strength");
  
  if (!strengthIndicator) {
    createPasswordStrengthIndicator();
  }
  
  updatePasswordStrength(password);
});

function createPasswordStrengthIndicator() {
  const passwordField = document.getElementById("regPass");
  const indicator = document.createElement("div");
  indicator.id = "password-strength";
  indicator.className = "password-strength";
  passwordField.parentNode.appendChild(indicator);
}

function updatePasswordStrength(password) {
  const indicator = document.getElementById("password-strength");
  if (!indicator) return;
  
  let strength = 0;
  let feedback = [];
  
  // Length check
  if (password.length >= 6) {
    strength += 1;
  } else {
    feedback.push("at least 6 characters");
  }
  
  // Uppercase check
  if (/[A-Z]/.test(password)) {
    strength += 1;
  } else {
    feedback.push("one uppercase letter");
  }
  
  // Lowercase check
  if (/[a-z]/.test(password)) {
    strength += 1;
  } else {
    feedback.push("one lowercase letter");
  }
  
  // Number check
  if (/\d/.test(password)) {
    strength += 1;
  } else {
    feedback.push("one number");
  }
  
  // Special character check (optional)
  if (/[!@#$%^&*]/.test(password)) {
    strength += 1;
  }
  
  // Update indicator
  let strengthText = "";
  let strengthClass = "";
  
  if (password.length === 0) {
    strengthText = "";
    strengthClass = "";
  } else if (strength <= 2) {
    strengthText = "Weak";
    strengthClass = "weak";
  } else if (strength <= 4) {
    strengthText = "Medium";
    strengthClass = "medium";
  } else {
    strengthText = "Strong";
    strengthClass = "strong";
  }
  
  indicator.innerHTML = `
    <div class="strength-bar ${strengthClass}">
      <div class="strength-fill" style="width: ${(strength / 5) * 100}%"></div>
    </div>
    <span class="strength-text ${strengthClass}">${strengthText}</span>
    ${feedback.length > 0 ? `<small class="strength-feedback">Need: ${feedback.join(", ")}</small>` : ""}
  `;
}

// Real-time email validation
document.getElementById("regEmail")?.addEventListener("blur", function(e) {
  const email = e.target.value.trim();
  const emailField = document.getElementById("regEmail");
  
  if (email && !validateEmail(email)) {
    showFieldError("regEmail", "Please enter a valid email address");
  } else {
    clearFieldError("regEmail");
  }
});

// Real-time password match
document.getElementById("regConfirmPass")?.addEventListener("input", function(e) {
  const password = document.getElementById("regPass").value;
  const confirmPassword = e.target.value;
  const confirmField = document.getElementById("regConfirmPass");
  
  if (confirmPassword && password !== confirmPassword) {
    showFieldError("regConfirmPass", "Passwords do not match");
  } else {
    clearFieldError("regConfirmPass");
  }
});

// Helper Functions
function highlightField(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.add("error-highlight");
    
    // Remove highlight on input
    field.addEventListener("input", function removeHighlight() {
      this.classList.remove("error-highlight");
      this.removeEventListener("input", removeHighlight);
    }, { once: true });
  }
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  // Remove existing error message
  clearFieldError(fieldId);
  
  // Add error class
  field.classList.add("field-error");
  
  // Create error message
  const errorDiv = document.createElement("div");
  errorDiv.className = "field-error-message";
  errorDiv.id = `error-${fieldId}`;
  errorDiv.textContent = message;
  
  field.parentNode.appendChild(errorDiv);
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.remove("field-error", "error-highlight");
  }
  
  const errorMsg = document.getElementById(`error-${fieldId}`);
  if (errorMsg) {
    errorMsg.remove();
  }
}

function removeAllHighlights() {
  document.querySelectorAll(".error-highlight, .field-error").forEach(el => {
    el.classList.remove("error-highlight", "field-error");
  });
  
  document.querySelectorAll("[id^='error-']").forEach(el => {
    el.remove();
  });
}

// Add CSS styles for registration form
function addRegistrationStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .password-strength {
      margin-top: 5px;
      font-size: 12px;
    }
    
    .strength-bar {
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 5px;
    }
    
    .strength-fill {
      height: 100%;
      transition: width 0.3s ease;
    }
    
    .strength-bar.weak .strength-fill { background: #f44336; }
    .strength-bar.medium .strength-fill { background: #ff9800; }
    .strength-bar.strong .strength-fill { background: #4caf50; }
    
    .strength-text {
      font-size: 12px;
      font-weight: 500;
    }
    
    .strength-text.weak { color: #f44336; }
    .strength-text.medium { color: #ff9800; }
    .strength-text.strong { color: #4caf50; }
    
    .strength-feedback {
      display: block;
      color: #666;
      margin-top: 5px;
    }
    
    .error-highlight {
      border: 2px solid #f44336 !important;
      animation: shake 0.3s ease-in-out;
    }
    
    .field-error {
      border: 2px solid #f44336 !important;
    }
    
    .field-error-message {
      color: #f44336;
      font-size: 12px;
      margin-top: 5px;
      animation: slideDown 0.3s ease;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .spinner-small {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 5px;
      vertical-align: middle;
    }
    
    .terms-container {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 15px 0;
    }
    
    .terms-container input[type="checkbox"] {
      width: auto;
      margin-right: 5px;
    }
    
    .terms-container label {
      font-size: 14px;
      color: #666;
    }
    
    .terms-container a {
      color: #007bff;
      text-decoration: none;
    }
    
    .terms-container a:hover {
      text-decoration: underline;
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize registration page
document.addEventListener("DOMContentLoaded", () => {
  addRegistrationStyles();
  
  // Check if we have a pre-filled email from session
  const registeredEmail = sessionStorage.getItem("registeredEmail");
  if (registeredEmail) {
    const emailField = document.getElementById("regEmail");
    if (emailField) {
      emailField.value = registeredEmail;
      sessionStorage.removeItem("registeredEmail");
    }
  }
  
  // Add terms and conditions if not exists
  const form = document.getElementById("register-form");
  if (form && !document.getElementById("terms-check")) {
    const termsDiv = document.createElement("div");
    termsDiv.className = "terms-container";
    termsDiv.innerHTML = `
      <input type="checkbox" id="terms-check" required>
      <label for="terms-check">
        I agree to the <a href="/terms.html" target="_blank">Terms and Conditions</a> and 
        <a href="/privacy.html" target="_blank">Privacy Policy</a>
      </label>
    `;
    
    // Insert before submit button
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
      form.insertBefore(termsDiv, submitBtn.parentNode || submitBtn);
    }
  }
});
