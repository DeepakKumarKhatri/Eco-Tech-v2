document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
});

// Crousal
document.addEventListener('DOMContentLoaded', function () {
    let currentIndex = 0;
    const slides = document.querySelectorAll('.quote-slide');
    const totalSlides = slides.length;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
            }
        });
    }

    setInterval(function () {
        currentIndex = (currentIndex + 1) % totalSlides;
        showSlide(currentIndex);
    }, 3000); // Change every 3 seconds
});

function loadComponent(file, elementId) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
        })
        .catch(error => console.error('Error loading component:', error));
}

// Load the header and footer
loadComponent('../pages/components/header.html', 'header-placeholder');
loadComponent('../pages/components/footer.html', 'footer-placeholder');

document.addEventListener("DOMContentLoaded", () => {
    const dropdownMenu = document.querySelector(".dropdown-menu");
    const dropdown = document.querySelector(".dropdown");

    dropdown.addEventListener("mouseenter", () => {
        const rect = dropdownMenu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;

        if (rect.right > viewportWidth) {
            dropdownMenu.style.left = "auto";
            dropdownMenu.style.right = "0";
        }

        if (viewportWidth < 600) {
            dropdownMenu.style.left = "0";
            dropdownMenu.style.right = "auto";
        }
    });
});
