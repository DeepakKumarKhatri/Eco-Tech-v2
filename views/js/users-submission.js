document.addEventListener('DOMContentLoaded', async () => {
    const approvalItems = document.getElementById('approvalItems');
    const statusFilter = document.getElementById('statusFilter');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const approvalModal = document.getElementById('approvalModal');
    const modalContent = document.getElementById('modalContent');
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    const closeModal = document.getElementById('closeModal');

    let currentPage = 1;
    let submissions = []; // Store submissions globally

    // Fetch user details
    async function fetchUserDetails() {
        try {
            const response = await fetch('/api/users/user-details', { 
                credentials: 'include' 
            });
            
            if (!response.ok) throw new Error('Failed to fetch user details');
            
            const { user } = await response.json();
            document.querySelector('.user-info span').textContent = `Welcome, ${user.fullName.split(" ")[0]}`;
            document.getElementById('userAvatar').src = user.imageUrl || '../../assets/images/demo_user.png';
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    }

    // Fetch submissions
    async function fetchSubmissions(page = 1, status = 'all', search = '') {
        try {
            const statusParam = status === 'all' ? '' : status.toUpperCase();
            const response = await fetch(`/api/admin/submissions?page=${page}&status=${statusParam}&search=${search}`, { 
                credentials: 'include' 
            });
            
            if (!response.ok) throw new Error('Failed to fetch submissions');
            
            const { submissions: fetchedSubmissions, pagination } = await response.json();
            submissions = fetchedSubmissions; // Store globally
            currentPage = pagination.currentPage;
            totalPages = pagination.totalPages;

            return { submissions: fetchedSubmissions, pagination };
        } catch (error) {
            console.error('Error fetching submissions:', error);
            return { submissions: [], pagination: {} };
        }
    }

    // Load submissions based on filters
    async function loadSubmissions() {
        const status = statusFilter.value;
        const search = '';

        await fetchSubmissions(currentPage, status, search);
        populateApprovalItems(submissions);
    }

    // Event Listeners
    approvalItems.addEventListener('click', async (e) => {
        if (e.target.classList.contains('view-details')) {
            const submissionId = parseInt(e.target.getAttribute('data-id'));
            const selectedSubmission = submissions.find(s => s.id === submissionId);
            
            if (selectedSubmission) {
                showModal(selectedSubmission);
            } else {
                console.error('Submission not found');
            }
        }
    });

    // Update submission status
    async function updateSubmissionStatus(submissionId, status) {
        try {
            const response = await fetch('/api/admin/change-status', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    submissionId, 
                    status: status.toUpperCase() 
                })
            });
            
            if (!response.ok) throw new Error('Failed to update submission status');
            
            const result = await response.json();
            return result.submission;
        } catch (error) {
            console.error('Error updating submission status:', error);
            alert('Failed to update submission status');
            return null;
        }
    }

    // Create submission item element
    function createApprovalItem(submission) {
        const approvalItem = document.createElement('div');
        approvalItem.className = 'approval-item';
        approvalItem.innerHTML = `
            <div class="approval-item-details">
                <h3>${submission.itemType}</h3>
                <p>User: ${submission.user.fullName}</p>
                <p>Date: ${new Date(submission.createdAt).toLocaleDateString()}</p>
                <p>Weight: ${submission.weight} kg</p>
            </div>
            <div class="approval-item-status status-${submission.status.toLowerCase()}">
                ${submission.status.charAt(0).toUpperCase() + submission.status.slice(1).toLowerCase()}
            </div>
            <button class="btn-primary view-details" data-id="${submission.id}">View Details</button>
        `;
        return approvalItem;
    }

    // Populate approval items
    function populateApprovalItems(submissions) {
        approvalItems.innerHTML = '';
        submissions.forEach(submission => {
            const approvalItem = createApprovalItem(submission);
            approvalItems.appendChild(approvalItem);
        });
    }

    // Show modal with submission details
    function showModal(submission) {
        modalContent.innerHTML = `
            <h3>${submission.itemType}</h3>
            <p><strong>User:</strong> ${submission.user.fullName}</p>
            <p><strong>Email:</strong> ${submission.user.email}</p>
            <p><strong>Date:</strong> ${new Date(submission.createdAt).toLocaleDateString()}</p>
            <p><strong>Weight:</strong> ${submission.weight} kg</p>
            <p><strong>Description:</strong> ${submission.description}</p>
            <p><strong>Status:</strong> <span class="status-${submission.status.toLowerCase()}">
                ${submission.status.charAt(0).toUpperCase() + submission.status.slice(1).toLowerCase()}
            </span></p>
            ${submission.imageUrl ? `<img src="${submission.imageUrl}" alt="Submission Image" class="submission-image">` : ''}
        `;
        approvalModal.style.display = 'block';

        // Set up approve/reject buttons
        approveBtn.onclick = async () => {
            const updatedSubmission = await updateSubmissionStatus(submission.id, 'APPROVED');
            if (updatedSubmission) {
                approvalModal.style.display = 'none';
                loadSubmissions();
            }
        };

        rejectBtn.onclick = async () => {
            const updatedSubmission = await updateSubmissionStatus(submission.id, 'REJECTED');
            if (updatedSubmission) {
                approvalModal.style.display = 'none';
                loadSubmissions();
            }
        };
    }

    // Event Listeners
    applyFiltersBtn.addEventListener('click', loadSubmissions);

    approvalItems.addEventListener('click', async (e) => {
        if (e.target.classList.contains('view-details')) {
            const submissionId = parseInt(e.target.getAttribute('data-id'));
            const submission = await fetchSubmissions(); // Fetch all submissions
            const selectedSubmission = submissions.find(s => s.id === submissionId);
            if (selectedSubmission) {
                showModal(selectedSubmission);
            }
        }
    });

    closeModal.addEventListener('click', () => {
        approvalModal.style.display = 'none';
    });

    // Close the modal if clicked outside
    window.addEventListener('click', (e) => {
        if (e.target === approvalModal) {
            approvalModal.style.display = 'none';
        }
    });

    // Logout functionality
    const logoutLink = document.getElementById('logoutLink');
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = '/pages/auth/index.html';
            } else {
                const errorData = await response.json();
                console.error('Logout failed:', errorData.message);
                alert(errorData.message || 'Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    });

    // Profile link
    const profileLink = document.getElementById('profileLink');
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/pages/user-dashboard/profile-management.html';
    });

    // Initial load
    await fetchUserDetails();
    await loadSubmissions();
});