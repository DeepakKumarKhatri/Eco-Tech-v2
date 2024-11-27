document.addEventListener('DOMContentLoaded', () => {
    const pickupRequestForm = document.getElementById('pickupRequestForm');
    const pickupRequestCards = document.getElementById('pickupRequestCards');

    // Set minimum date for pickup to tomorrow
    const pickupDateInput = document.getElementById('pickup-date');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    pickupDateInput.min = tomorrow.toISOString().split('T')[0];

    // Fetch and display pickup requests
    fetchPickupRequests();

    pickupRequestForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect form data
        const formData = new FormData(pickupRequestForm);
        const pickupData = Object.fromEntries(formData);

        // Validate form data
        if (!validateForm(pickupData)) {
            return;
        }

        try {
            const response = await fetch('/api/pickup-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pickupData),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to submit pickup request');
            }

            const result = await response.json();
            alert('Thank you for your pickup request! We will contact you shortly to confirm the details.');

            // Reset form and refresh pickup requests
            pickupRequestForm.reset();
            fetchPickupRequests();
        } catch (error) {
            console.error('Error submitting pickup request:', error);
            alert('An error occurred while submitting your pickup request. Please try again.');
        }
    });

    async function fetchPickupRequests() {
        try {
            const response = await fetch('/api/pickup-requests', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch pickup requests');
            }

            const { requests } = await response.json();
            displayPickupRequests(requests);
        } catch (error) {
            console.error('Error fetching pickup requests:', error);
            alert('An error occurred while fetching your pickup requests. Please try again.');
        }
    }

    function displayPickupRequests(requests) {
        pickupRequestCards.innerHTML = requests.map(request => `
            <div class="pickup-request-card">
                <h3>Pickup Request #${request.id}</h3>
                <p><strong>Address:</strong> ${request.pickupAddress}</p>
                <p><strong>Date:</strong> ${new Date(request.pickupDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${request.pickupTime}</p>
                <p><strong>Items:</strong> ${request.itemsForPickup}</p>
                <p><strong>Special Instructions:</strong> ${request.specialInstructions || 'None'}</p>
                <span class="status ${request.status.toLowerCase()}">${request.status}</span>
                ${request.status === 'PENDING' ? `
                    <button class="cancel-btn" data-id="${request.id}">Cancel Request</button>
                ` : ''}
            </div>
        `).join('');

        // Add event listeners for cancel buttons
        const cancelButtons = document.querySelectorAll('.cancel-btn');
        cancelButtons.forEach(button => {
            button.addEventListener('click', cancelPickupRequest);
        });
    }

    async function cancelPickupRequest(e) {
        const requestId = e.target.dataset.id;
        const confirmCancel = confirm('Are you sure you want to cancel this pickup request?');

        if (confirmCancel) {
            try {
                const response = await fetch(`/api/pickup-requests/${requestId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to cancel pickup request');
                }

                alert('Pickup request cancelled successfully.');
                fetchPickupRequests();
            } catch (error) {
                console.error('Error cancelling pickup request:', error);
                alert('An error occurred while cancelling your pickup request. Please try again.');
            }
        }
    }

    function validateForm(data) {
        if (!data.pickupAddress || !data.pickupDate || !data.pickupTime || !data.itemsForPickup) {
            alert('Please fill in all required fields.');
            return false;
        }

        return true;
    }
});

