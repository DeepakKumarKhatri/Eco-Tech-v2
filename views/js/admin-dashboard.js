import { checkValidity } from "./authenticator.js";

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
    const dashboardResponse = await fetch("/admin-home-data", {
      credentials: "include",
    });

    if (!dashboardResponse.ok)
      throw new Error("Failed to fetch dashboard data");

    const data = await dashboardResponse.json();
    const { adminInformation } = data;
    await checkValidity(adminInformation);

    document.querySelector(".user-info span").textContent = `Welcome, ${
        adminInformation.fullName.split(" ")[0]
    }`;
    document.getElementById("userAvatar").src =
    adminInformation.imageUrl || "../../assets/images/user_placeholder.png";

    const summaryCards = document.querySelectorAll(
      ".summary-card .summary-value"
    );
    summaryCards[0].textContent = data.totalUsers.toLocaleString();
    summaryCards[1].textContent = `${data.totalRecycled.toLocaleString()} kg`;
    summaryCards[2].textContent = data.pendingPickups;

    const trendChartCtx = document
      .getElementById("trendChart")
      .getContext("2d");
    new Chart(trendChartCtx, {
      type: "line",
      data: {
        labels: data?.recyclingTrends?.map((trend) =>
          new Date(trend?.createdAt)?.toLocaleDateString()
        ),
        datasets: [
          {
            label: "Recycled Weight (kg)",
            data: data.recyclingTrends.map((trend) => trend?.weight),
            borderColor: "#2ecc71",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    const userGrowthChartCtx = document
      .getElementById("userGrowthChart")
      .getContext("2d");
    new Chart(userGrowthChartCtx, {
      type: "bar",
      data: {
        labels: data.userGrowthTrends.map((trend) =>
          new Date(trend.month).toLocaleDateString()
        ),
        datasets: [
          {
            label: "New Users",
            data: data.userGrowthTrends.map((trend) => trend.count),
            backgroundColor: "#3498db",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    const activityList = document.querySelector(".activity-list");
    activityList.innerHTML = data.recentActivity
      .map(
        (activity) => `
            <li>
                <span class="activity-date">${new Date(
                  activity.date
                ).toLocaleDateString()}</span>
                <span class="activity-description">${
                  activity.description
                }</span>
            </li>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const logoutLink = document.getElementById("logoutLink");
  const profileLink = document.getElementById("profileLink");

  profileLink.addEventListener("click", async (e) => {
    e.preventDefault();
    window.location.href =
      "/pages/admin-dashboard/admin-profile-management.html";
  });

  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/signout", {
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
