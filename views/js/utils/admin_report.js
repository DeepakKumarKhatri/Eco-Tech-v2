document.addEventListener("DOMContentLoaded", async () => {
  const reportContainer = document.querySelector(".dashboard-content");
  const chartContainer = document.createElement("div");
  chartContainer.className = "reporting-charts";

  // Fetch and render reporting data
  async function fetchReportingData() {
    try {
      // Fetch multiple reports
      const [overviewResponse, performanceResponse, environmentalResponse] =
        await Promise.all([
          fetch("/api/admin/overview", { credentials: "include" }),
          fetch("/api/admin/user-performance", { credentials: "include" }),
          fetch("/api/admin/environmental-impact", { credentials: "include" }),
        ]);

      const overviewData = await overviewResponse.json();
      const performanceData = await performanceResponse.json();
      const environmentalData = await environmentalResponse.json();

      renderReports(overviewData, performanceData, environmentalData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      reportContainer.innerHTML = `
          <div class="error-message">
            Failed to load reports. Please try again later.
          </div>
        `;
    }
  }

  // Render comprehensive reports
  function renderReports(overview, performance, environmental) {
    reportContainer.innerHTML = ""; // Clear previous content

    // Overview Section
    const overviewSection = document.createElement("section");
    overviewSection.className = "reporting-section";
    overviewSection.innerHTML = `
        <h2>Recycling Overview</h2>
        <div class="overview-stats">
          <div class="stat-card">
            <h3>Total Recycle Items</h3>
            <p>${overview.totalRecycleItems}</p>
          </div>
          <div class="stat-card">
            <h3>Approved Items</h3>
            <p>${overview.approvedRecycleItems}</p>
          </div>
          <div class="stat-card">
            <h3>Total Weight Recycled</h3>
            <p>${overview.totalWeight.toFixed(2)} kg</p>
          </div>
        </div>
      `;
    reportContainer.appendChild(overviewSection);

    // Charts Container
    chartContainer.innerHTML = `
        <div class="chart-row">
          <div class="chart-column">
            <h3>Recycling Items by Type</h3>
            <canvas id="itemTypeChart"></canvas>
          </div>
          <div class="chart-column">
            <h3>Monthly Recycling Trends</h3>
            <canvas id="monthlyTrendsChart"></canvas>
          </div>
        </div>
        <div class="chart-row">
          <div class="chart-column">
            <h3>Environmental Impact</h3>
            <canvas id="environmentalImpactChart"></canvas>
          </div>
          <div class="chart-column">
            <h3>User Performance</h3>
            <table class="user-performance-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Total Items</th>
                  <th>Total Weight</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                ${performance.userPerformance
                  .map(
                    (user) => `
                  <tr>
                    <td>${user.fullName}</td>
                    <td>${user.totalItems}</td>
                    <td>${user.totalWeight.toFixed(2)} kg</td>
                    <td>${user.points}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    reportContainer.appendChild(chartContainer);

    // Render Charts
    createItemTypeChart(overview.recycleItemsByType);
    createMonthlyTrendsChart(overview.monthlyRecyclingTrends);
    createEnvironmentalImpactChart(environmental);
  }

  // Chart Creation Functions
  function createItemTypeChart(recycleItemsByType) {
    const ctx = document.getElementById("itemTypeChart").getContext("2d");
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: recycleItemsByType.map((item) => item.itemType),
        datasets: [
          {
            data: recycleItemsByType.map((item) => item._count.id),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        title: { display: true, text: "Recycling Items Distribution" },
      },
    });
  }

  function createMonthlyTrendsChart(monthlyTrends) {
    const ctx = document.getElementById("monthlyTrendsChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: monthlyTrends.map((trend) => trend.month),
        datasets: [
          {
            label: "Number of Items",
            data: monthlyTrends.map((trend) => trend.itemCount),
            borderColor: "#36A2EB",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
          },
          {
            label: "Total Weight (kg)",
            data: monthlyTrends.map((trend) => trend.totalWeight),
            borderColor: "#4BC0C0",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
          },
        ],
      },
      options: {
        responsive: true,
        title: { display: true, text: "Monthly Recycling Trends" },
        scales: {
          yAxes: [{ ticks: { beginAtZero: true } }],
        },
      },
    });
  }

  function createEnvironmentalImpactChart(environmentalData) {
    const ctx = document
      .getElementById("environmentalImpactChart")
      .getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["CO2 Savings", "Energy Savings", "Water Savings"],
        datasets: [
          {
            data: [
              environmentalData.environmentalImpact.CO2Savings,
              environmentalData.environmentalImpact.energySavings,
              environmentalData.environmentalImpact.waterSavings,
            ],
            backgroundColor: ["#FF6384", "#36A2EB", "#4BC0C0"],
          },
        ],
      },
      options: {
        responsive: true,
        title: { display: true, text: "Environmental Impact" },
        scales: {
          yAxes: [{ ticks: { beginAtZero: true } }],
        },
      },
    });
  }

  // Initial data fetch
  await fetchReportingData();
});