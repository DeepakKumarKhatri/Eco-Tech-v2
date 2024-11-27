document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const showRegister = document.getElementById("showRegister");
  const showLogin = document.getElementById("showLogin");
  const authTitle = document.getElementById("authTitle");
  const authDescription = document.getElementById("authDescription");
  const loginText = document.getElementById("loginText");
  const registerText = document.getElementById("registerText");

  showRegister.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    authTitle.textContent = "Register";
    authDescription.textContent = "Create your account to start recycling!";
    loginText.classList.add("hidden");
    registerText.classList.remove("hidden");
  });

  showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    authTitle.textContent = "Login";
    authDescription.textContent = "Welcome back! Please login to your account.";
    registerText.classList.add("hidden");
    loginText.classList.remove("hidden");
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch("/signin", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const content = await response.json();
      if (content.message === "Login successful") {
        if (content.user.role === "USER") {
          window.location.href = "/pages/user-dashboard/index.html";
        } else {
          window.location.href = "/pages/admin-dashboard/index.html";
        }
      } else {
        alert(content.message);
      }
    } catch (error) {
      alert(error.message);
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const registerConfirmPassword = document.getElementById(
      "registerConfirmPassword"
    ).value;

    if (password !== registerConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("/signup", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, email, password }),
      });
      const content = await response.json();

      if (content.message === "User registered successfully") {
        window.location.href = "/pages/user-dashboard/index.html";
      } else {
        alert(content.message);
      }
    } catch (error) {
      alert(error.message);
    }
  });
});
