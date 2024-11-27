document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchResults = document.getElementById('searchResults');

    async function performSearch() {
        const searchTerm = searchInput.value;
        const category = categoryFilter.value;
        const dateRange = dateFilter.value;

        try {
            const response = await fetch(`/api/search?searchTerm=${searchTerm}&category=${category}&dateRange=${dateRange}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch search results');
            }

            const results = await response.json();
            displayResults(results);
        } catch (error) {
            console.error('Error performing search:', error);
            alert('An error occurred while searching. Please try again.');
        }
    }

    function displayResults(results) {
        searchResults.innerHTML = '';
        if (results.length === 0) {
            searchResults.innerHTML = '<p>No results found.</p>';
            return;
        }

        results.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <div class="result-item-details">
                    <h3>${item.itemType}</h3>
                    <p>Description: ${item.description}</p>
                    <p>Weight: ${item.weight} kg</p>
                    <p>Date: ${new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="result-item-status">${item.status}</div>
            `;
            searchResults.appendChild(resultItem);
        });
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    categoryFilter.addEventListener('change', performSearch);
    dateFilter.addEventListener('change', performSearch);

    // Initial search to populate results
    performSearch();
});