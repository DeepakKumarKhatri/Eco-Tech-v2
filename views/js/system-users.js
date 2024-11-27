document.addEventListener('DOMContentLoaded', async () => {
    const dashboardContent = document.querySelector('.dashboard-content');
    const searchInput = document.createElement('input');
    const paginationContainer = document.createElement('div');
    
    let currentPage = 1;
    let totalPages = 1;

    // Create search and filter section
    function createSearchSection() {
        const searchSection = document.createElement('div');
        searchSection.className = 'users-search-section';
        
        searchInput.type = 'text';
        searchInput.placeholder = 'Search users by name or email';
        searchInput.className = 'search-input';
        
        const searchButton = document.createElement('button');
        searchButton.textContent = 'Search';
        searchButton.className = 'btn-primary';
        
        searchButton.addEventListener('click', () => loadUsers(searchInput.value));
        
        searchSection.appendChild(searchInput);
        searchSection.appendChild(searchButton);
        
        return searchSection;
    }

    // Create users table
    function createUsersTable(users) {
        const table = document.createElement('table');
        table.className = 'users-table';
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Joined Date</th>
                    <th>Points</th>
                    <th>Recycle Items</th>
                    <th>Pickup Requests</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.fullName}</td>
                        <td>${user.email}</td>
                        <td>${user.phone_number || 'N/A'}</td>
                        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>${user.points || 0}</td>
                        <td>${user._count.recycleItem}</td>
                        <td>${user._count.pickupRequest}</td>
                        <td>
                            <button class="btn-details" data-user-id="${user.id}">View Details</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        return table;
    }

    // Create pagination
    function createPagination(currentPage, totalPages) {
        paginationContainer.innerHTML = '';
        paginationContainer.className = 'pagination';
        
        // Previous button
        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = 'Previous';
            prevBtn.addEventListener('click', () => loadUsers(searchInput.value, currentPage - 1));
            paginationContainer.appendChild(prevBtn);
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            pageBtn.addEventListener('click', () => loadUsers(searchInput.value, i));
            paginationContainer.appendChild(pageBtn);
        }
        
        // Next button
        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.textContent = 'Next';
            nextBtn.addEventListener('click', () => loadUsers(searchInput.value, currentPage + 1));
            paginationContainer.appendChild(nextBtn);
        }
    }

    // Fetch users
    async function loadUsers(search = '', page = 1) {
        try {
            const response = await fetch(`/api/admin/all-users?page=${page}&search=${search}`, {
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to fetch users');
            
            const { users, pagination } = await response.json();
            
            // Clear previous content
            dashboardContent.innerHTML = '';
            
            // Create and append search section
            dashboardContent.appendChild(createSearchSection());
            
            // Create and append users table
            const usersTable = createUsersTable(users);
            dashboardContent.appendChild(usersTable);
            
            // Create and append pagination
            currentPage = pagination.currentPage;
            totalPages = pagination.totalPages;
            createPagination(currentPage, totalPages);
            dashboardContent.appendChild(paginationContainer);
            
            // Add event listeners for view details
            document.querySelectorAll('.btn-details').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const userId = e.target.getAttribute('data-user-id');
                    await showUserDetails(userId);
                });
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            dashboardContent.innerHTML = `
                <div class="error-message">
                    Failed to load users. Please try again later.
                </div>
            `;
        }
    }

    // Show user details modal
    async function showUserDetails(userId) {
        try {
            const response = await fetch(`/api/admin/user-details/${userId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to fetch user details');
            
            const userData = await response.json();
            
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h2>User Details</h2>
                    <div class="user-details">
                        <p><strong>Full Name:</strong> ${userData.fullName}</p>
                        <p><strong>Email:</strong> ${userData.email}</p>
                        <p><strong>Phone:</strong> ${userData.phone_number || 'N/A'}</p>
                        <p><strong>Points:</strong> ${userData.points || 0}</p>
                        <p><strong>Joined:</strong> ${new Date(userData.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal functionality
            const closeModal = modal.querySelector('.close-modal');
            closeModal.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        } catch (error) {
            console.error('Error fetching user details:', error);
            alert('Failed to load user details');
        }
    }

    // Initial load of users
    await loadUsers();
});