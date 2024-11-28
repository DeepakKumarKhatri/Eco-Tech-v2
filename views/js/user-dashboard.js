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

    const summaryCards = document.querySelectorAll(
      ".summary-card .summary-value"
    );
    summaryCards[0].textContent = `${data.totalRecycled} kg`;
    summaryCards[1].textContent = data.rewardPoints;
    summaryCards[2].textContent = `${data.co2Saved.toFixed(2)} kg`;
    summaryCards[3].textContent =
      new Date(data.nextPickup).toLocaleDateString() || "No pickup scheduled";

    const recyclingCtx = document
      .getElementById("recyclingChart")
      .getContext("2d");
    new Chart(recyclingCtx, {
      type: "line",
      data: {
        labels: data.recyclingHistory.map((item) =>
          new Date(item.date).toLocaleDateString()
        ),
        datasets: [
          {
            label: "Recycled (kg)",
            data: data.recyclingHistory.map((item) => item.totalWeight),
            borderColor: "#2ecc71",
            tension: 0.1,
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

    const breakdownCtx = document
      .getElementById("breakdownChart")
      .getContext("2d");
    const colors = ["#3498db", "#e74c3c", "#f1c40f", "#95a5a6", "#2ecc71"];
    new Chart(breakdownCtx, {
      type: "doughnut",
      data: {
        labels: data.recyclingBreakdown.map((item) => item.itemType),
        datasets: [
          {
            data: data.recyclingBreakdown.map((item) => item.totalWeight),
            backgroundColor: colors.slice(0, data.recyclingBreakdown.length),
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });

    const activityList = document.querySelector(".activity-list");
    activityList.innerHTML = data.recentActivity
      .map(
        (item) => `
            <li>
                <span class="activity-date">${new Date(
                  item.createdAt
                ).toLocaleDateString()}</span>
                <span class="activity-description">Recycled ${
                  item.weight
                }kg of ${item.itemType}</span>
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
