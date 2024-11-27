import LoadComponent from "./utils/helper.js";

let map;
let markers = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 40.7128, lng: -74.0060 }, // Default to New York City
        zoom: 10
    });
}

window.initMap = initMap;

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const locationInput = document.getElementById('locationInput');

    searchButton.addEventListener('click', () => {
        const location = locationInput.value;
        if (location) {
            searchRecyclingCenters(location);
        } else {
            alert('Please enter a location');
        }
    });
});

function searchRecyclingCenters(location) {
    // In a real application, you would make an API call to get recycling centers near the given location
    // For this example, we'll use dummy data
    const dummyCenters = [
        { name: 'EcoTech Recycling Center', address: '123 Green St, Anytown, USA', lat: 40.7128, lng: -74.0060, distance: '0.5 miles' },
        { name: 'City Electronics Recycling', address: '456 Tech Ave, Anytown, USA', lat: 40.7200, lng: -74.0100, distance: '1.2 miles' },
        { name: 'GreenElectronics Depot', address: '789 Eco Blvd, Anytown, USA', lat: 40.7150, lng: -74.0200, distance: '1.8 miles' },
    ];

    displayRecyclingCenters(dummyCenters);
}

function displayRecyclingCenters(centers) {
    const centersList = document.getElementById('centersList');
    centersList.innerHTML = '';

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    centers.forEach(center => {
        // Add marker to map
        const marker = new google.maps.Marker({
            position: { lat: center.lat, lng: center.lng },
            map: map,
            title: center.name
        });
        markers.push(marker);

        // Add center to list
        const centerCard = document.createElement('div');
        centerCard.className = 'center-card';
        centerCard.innerHTML = `
            <div class="center-info">
                <h3>${center.name}</h3>
                <p>${center.address}</p>
            </div>
            <div class="center-distance">${center.distance}</div>
        `;
        centersList.appendChild(centerCard);
    });

    // Adjust map to fit all markers
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => bounds.extend(marker.getPosition()));
    map.fitBounds(bounds);
}

LoadComponent('../components/header.html', 'header-placeholder');
LoadComponent('../components/footer.html', 'footer-placeholder');