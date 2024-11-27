import LoadComponent from "./utils/helper.js";

document.addEventListener('DOMContentLoaded', () => {
    const feedbackForm = document.getElementById('feedbackForm');

    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Collect form data
        const formData = new FormData(feedbackForm);
        const feedbackData = Object.fromEntries(formData);

        // Validate form data
        if (!validateForm(feedbackData)) {
            return;
        }

        // Simulate form submission (replace with actual API call in production)
        console.log('Feedback submitted:', feedbackData);
        alert('Thank you for your feedback! We appreciate your input.');

        // Reset form
        feedbackForm.reset();
    });

    function validateForm(data) {
        if (!data.name || !data.email || !data.subject || !data.message || !data.rating) {
            alert('Please fill in all required fields.');
            return false;
        }

        if (!isValidEmail(data.email)) {
            alert('Please enter a valid email address.');
            return false;
        }

        return true;
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Add animation to rating stars
    const ratingLabels = document.querySelectorAll('.rating label');
    ratingLabels.forEach((label) => {
        label.addEventListener('mouseover', () => {
            label.style.transform = 'scale(1.2)';
        });
        label.addEventListener('mouseout', () => {
            label.style.transform = 'scale(1)';
        });
    });
});

LoadComponent('../components/header.html', 'header-placeholder');
LoadComponent('../components/footer.html', 'footer-placeholder');