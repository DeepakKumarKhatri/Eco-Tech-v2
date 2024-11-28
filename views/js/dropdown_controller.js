document.addEventListener("DOMContentLoaded", async () => {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
  });

  const userAvatar = document.getElementById("userAvatar");
  const userDropdown = document.getElementById("userDropdown");
  userAvatar.addEventListener("click", () => {
    userDropdown.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove("show");
    }
  });

  try {
    const dashboardResponse = await fetch("/user-home-data", {
      credentials: "include",
    });

    if (!dashboardResponse.ok)
      throw new Error("Failed to fetch dashboard data");

    const data = await dashboardResponse.json();
    const { systemUser } = data;

    document.querySelector(".user-info span").textContent = `Welcome, ${
      systemUser[0].fullName.split(" ")[0]
    }`;
    document.getElementById("userAvatar").src =
      systemUser[0].imageUrl || "/default-avatar.png";
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const logoutLink = document.getElementById("logoutLink");
  const profileLink = document.getElementById("profileLink");

  profileLink.addEventListener("click", async (e) => {
    e.preventDefault();
    window.location.href = "/pages/user-dashboard/profile-management.html";
  });

  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        window.location.href = "/pages/auth/index.html";
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      alert(error.message);
    }
  });
});
