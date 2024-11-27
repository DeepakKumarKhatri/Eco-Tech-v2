import LoadComponent from "./utils/helper.js";

document.addEventListener('DOMContentLoaded', () => {
    const calculatorForm = document.getElementById('calculatorForm');
    const results = document.getElementById('results');

    calculatorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateImpact();
    });

    function calculateImpact() {
        const smartphones = parseInt(document.getElementById('smartphones').value) || 0;
        const laptops = parseInt(document.getElementById('laptops').value) || 0;
        const desktops = parseInt(document.getElementById('desktops').value) || 0;
        const tablets = parseInt(document.getElementById('tablets').value) || 0;
        const printers = parseInt(document.getElementById('printers').value) || 0;

        // These values are approximate and should be replaced with more accurate data
        const impact = {
            co2: smartphones * 30 + laptops * 100 + desktops * 150 + tablets * 50 + printers * 80,
            water: smartphones * 100 + laptops * 1000 + desktops * 1500 + tablets * 500 + printers * 800,
            energy: smartphones * 5 + laptops * 30 + desktops * 50 + tablets * 15 + printers * 25,
            materials: smartphones * 0.1 + laptops * 2 + desktops * 5 + tablets * 0.5 + printers * 3
        };

        document.getElementById('co2Saved').textContent = `${impact.co2.toFixed(2)} kg`;
        document.getElementById('waterSaved').textContent = `${impact.water.toFixed(2)} liters`;
        document.getElementById('energySaved').textContent = `${impact.energy.toFixed(2)} kWh`;
        document.getElementById('materialsSaved').textContent = `${impact.materials.toFixed(2)} kg`;

        const impactEquivalents = document.getElementById('impactEquivalents');
        impactEquivalents.innerHTML = `
            <li>Driving a car for ${(impact.co2 / 4).toFixed(2)} km</li>
            <li>Taking ${(impact.water / 200).toFixed(2)} showers</li>
            <li>Powering a home for ${(impact.energy / 30).toFixed(2)} days</li>
            <li>The weight of ${(impact.materials / 0.5).toFixed(2)} smartphones</li>
        `;

        results.classList.remove('hidden');
    }
});

LoadComponent('../components/header.html', 'header-placeholder');
LoadComponent('../components/footer.html', 'footer-placeholder');