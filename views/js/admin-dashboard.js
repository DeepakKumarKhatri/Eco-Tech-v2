document.addEventListener('DOMContentLoaded', async () => {
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Profile Dropdown
    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');
    userAvatar.addEventListener('click', () => {
        userDropdown.classList.toggle('show');
    });

    // Close Dropdown on Click Outside
    document.addEventListener('click', (e) => {
        if (!userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('show');
        }
    });

    try {
        // Fetch user details and dashboard data concurrently
        const [userResponse, dashboardResponse] = await Promise.all([
            fetch('/api/users/user-details', { credentials: 'include' }),
            fetch('/api/admin/dashboard', { credentials: 'include' })
        ]);

        if (!userResponse.ok) throw new Error("Failed to fetch user details");
        if (!dashboardResponse.ok) throw new Error("Failed to fetch dashboard data");

        const { user } = await userResponse.json();
        const data = await dashboardResponse.json();

        // Update user info
        document.querySelector('.user-info span').textContent = `Welcome, ${user.fullName.split(" ")[0]}`;
        document.getElementById('userAvatar').src = user.imageUrl || '/default-avatar.png';

        // Update summary cards dynamically
        const summaryCards = document.querySelectorAll('.summary-card .summary-value');
        summaryCards[0].textContent = data.totalUsers.toLocaleString();
        summaryCards[1].textContent = `${data.totalRecycled.toLocaleString()} kg`;
        summaryCards[2].textContent = data.pendingPickups;

        // Monthly Recycling Trends Chart
        const trendChartCtx = document.getElementById('trendChart').getContext('2d');
        new Chart(trendChartCtx, {
            type: 'line',
            data: {
                labels: data.recyclingTrends.map(trend => new Date(trend.createdAt).toLocaleDateString()),
                datasets: [{
                    label: 'Recycled Weight (kg)',
                    data: data.recyclingTrends.map(trend => trend._sum.weight),
                    borderColor: '#2ecc71',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // User Growth Chart
        const userGrowthChartCtx = document.getElementById('userGrowthChart').getContext('2d');
        new Chart(userGrowthChartCtx, {
            type: 'bar',
            data: {
                labels: data.userGrowthTrends.map(trend => new Date(trend.createdAt).toLocaleDateString()),
                datasets: [{
                    label: 'New Users',
                    data: data.userGrowthTrends.map(trend => trend._count.id),
                    backgroundColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Update recent activity
        const activityList = document.querySelector('.activity-list');
        activityList.innerHTML = data.recentActivity.map(activity => `
            <li>
                <span class="activity-date">${new Date(activity.date).toLocaleDateString()}</span>
                <span class="activity-description">${activity.description}</span>
            </li>
        `).join('');

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Optionally show an error message to the user
        // document.querySelector('.dashboard-content').innerHTML = `
        //     <div class="error-message">
        //         <p>Unable to load dashboard data. Please try again later.</p>
        //     </div>
        // `;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const logoutLink = document.getElementById('logoutLink');
    const profileLink = document.getElementById("profileLink");
    
    profileLink.addEventListener('click', async (e) => {
        e.preventDefault();
        window.location.href = '/pages/admin-dashboard/admin-profile-management.html';
    });

    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent default link behavior
        
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include', // Important for sending cookies
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Redirect to login page or home page
                window.location.href = '/pages/auth/index.html';
            } else {
                // Handle logout failure
                const errorData = await response.json();
                console.error('Logout failed:', errorData.message);
                
                // Optional: Show error message to user
                alert(errorData.message || 'Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    });
});