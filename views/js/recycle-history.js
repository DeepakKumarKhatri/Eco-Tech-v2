document.addEventListener('DOMContentLoaded', () => {
    const applyFiltersBtn = document.getElementById('applyFilters');
    const historyList = document.getElementById('historyList');
    const totalItems = document.getElementById('totalItems');
    const totalWeight = document.getElementById('totalWeight');
    const co2Saved = document.getElementById('co2Saved');
    const dateRangeSelect = document.getElementById('dateRange');
    const itemTypeSelect = document.getElementById('itemType');

    async function fetchRecycleHistory(dateRange, itemType) { 
        try {
            const response = await fetch(`/recycle-history-metrics?dateRange=${dateRange}&itemType=${itemType}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch recycle history');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching recycle history:', error);
            alert('An error occurred while fetching your recycle history. Please try again.');
        }
    }

    function updateHistoryList(items) {
        historyList.innerHTML = '';
        items.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-item-details">
                    <h3>${item.itemType}</h3>
                    <p>Date: ${new Date(item.createdAt).toLocaleDateString()}</p>
                    <p>Description: ${item.description}</p>
                    <p>Weight: ${item.weight} kg</p>
                    <p>Condition: ${item.item_condition}</p>
                </div>
                ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.itemType}" class="history-item-image">` : ''}
            `;
            historyList.appendChild(historyItem);
        });
    }

    function updateSummary(summary) {
        totalItems.textContent = summary.totalItems;
        totalWeight.textContent = `${summary.totalWeight.toFixed(1)} kg`;
        co2Saved.textContent = `${summary.co2Saved.toFixed(1)} kg`;
    }

    async function applyFilters() {
        const dateRange = dateRangeSelect.value;
        const itemType = itemTypeSelect.value;

        const data = await fetchRecycleHistory(dateRange, itemType);
        if (data) {
            updateHistoryList(data.items);
            updateSummary(data.summary);
        }
    }

    applyFiltersBtn.addEventListener('click', applyFilters);

    // Initial load
    applyFilters();

    // Add event listeners for real-time filtering
    dateRangeSelect.addEventListener('change', applyFilters);
    itemTypeSelect.addEventListener('change', applyFilters);

    // Add chart visualization
    function createChart(summary) {
        const ctx = document.getElementById('recycleChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Total Items', 'Total Weight (kg)', 'CO2 Saved (kg)'],
                datasets: [{
                    label: 'Recycling Summary',
                    data: [summary.totalItems, summary.totalWeight, summary.co2Saved],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Update the applyFilters function to create the chart
    async function applyFilters() {
        const dateRange = dateRangeSelect.value;
        const itemType = itemTypeSelect.value;

        const data = await fetchRecycleHistory(dateRange, itemType);
        if (data) {
            updateHistoryList(data.items);
            updateSummary(data.summary);
            createChart(data.summary);
        }
    }
});