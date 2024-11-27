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
            fetch('/api/dashboard', { credentials: 'include' })
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
        summaryCards[0].textContent = `${data.totalRecycled} kg`;
        summaryCards[1].textContent = data.rewardPoints;
        summaryCards[2].textContent = `${data.co2Saved.toFixed(2)} kg`;
        summaryCards[3].textContent = new Date(data.nextPickup).toLocaleDateString() || 'No pickup scheduled';

        // Recycling History Chart
        const recyclingCtx = document.getElementById('recyclingChart').getContext('2d');
        new Chart(recyclingCtx, {
            type: 'line',
            data: {
                labels: data.recyclingHistory.map(item => new Date(item.createdAt).toLocaleDateString()),
                datasets: [{
                    label: 'Recycled (kg)',
                    data: data.recyclingHistory.map(item => item._sum.weight),
                    borderColor: '#2ecc71',
                    tension: 0.1
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

        // Recycling Breakdown Chart
        const breakdownCtx = document.getElementById('breakdownChart').getContext('2d');
        const colors = ['#3498db', '#e74c3c', '#f1c40f', '#95a5a6', '#2ecc71'];
        new Chart(breakdownCtx, {
            type: 'doughnut',
            data: {
                labels: data.recyclingBreakdown.map(item => item.itemType),
                datasets: [{
                    data: data.recyclingBreakdown.map(item => item._sum.weight),
                    backgroundColor: colors.slice(0, data.recyclingBreakdown.length)
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Update recent activity
        const activityList = document.querySelector('.activity-list');
        activityList.innerHTML = data.recentActivity.map(item => `
            <li>
                <span class="activity-date">${new Date(item.createdAt).toLocaleDateString()}</span>
                <span class="activity-description">Recycled ${item.weight}kg of ${item.itemType}</span>
            </li>
        `).join('');

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Optional: Show user-friendly error message
        // document.querySelector('.dashboard-content').innerHTML = `
        //     <div class="error-message">
        //         <p>Unable to load dashboard. Please try again later.</p>
        //     </div>
        // `;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const logoutLink = document.getElementById('logoutLink');
    const profileLink = document.getElementById("profileLink");
    
    profileLink.addEventListener('click', async (e) => {
        e.preventDefault();
        window.location.href = '/pages/user-dashboard/profile-management.html';
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