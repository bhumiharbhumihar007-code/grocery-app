const registerForm = document.getElementById("register-form");

if(registerForm){
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById("submit-btn");
        const originalText = submitBtn.innerText;

        submitBtn.innerText = "Creating Account...";
        submitBtn.disabled = true;

        const userData = {
            name: document.getElementById("regName").value,
            email: document.getElementById("regEmail").value,
            password: document.getElementById("regPass").value
        };

        try {
            const res = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            if(res.ok){
                alert("✅ Account Created Successfully!");
                window.location.href = "login.html";
            } else {
                const errorData = await res.json();
                alert(errorData.error || "Registration Failed");
                resetBtn();
            }

        } catch(err){
            console.error("Register Error:", err);
            alert("Server connection failed");
            resetBtn();
        }

        function resetBtn(){
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}
