import { serverUrl } from "./utils/constants.js";

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

    const loginData = { email, password };

    try {
      const response = await fetch(serverUrl + "/auth/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });
      const data = await response.json();
      console.log({data});

      if (data.message === "Successful") {
        if (data.user.role === "USER") {
          window.location.href = "/pages/user-dashboard/index.html";
        } else {
          window.location.href = "/pages/admin-dashboard/index.html";
        }
      } else {
        alert(data.message || "Login failed.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Something went wrong. Please try again.");
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

    const registerData = { fullName, email, password };

    try {
      const response = await fetch(serverUrl + "/auth/register", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });
      const data = await response.json();

      if (data.message === "User Created") {
        alert("Account Created Successfully, Redirecting in 3 seconds...");
        setTimeout(() => {
          window.location.href = "/pages/user-dashboard/index.html";
        }, 3000); // 3 seconds delay
      } else {
        alert(data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Something went wrong. Please try again.");
    }
  });
});
