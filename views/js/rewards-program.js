import LoadComponent from "./utils/helper.js";

document.addEventListener('DOMContentLoaded', () => {
    const redeemButtons = document.querySelectorAll('.redeem-btn');

    redeemButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const rewardName = e.target.parentElement.querySelector('h3').textContent;
            const pointsRequired = e.target.parentElement.querySelector('p').textContent;

            // In a real application, you would check if the user has enough points and process the redemption
            alert(`You are about to redeem ${rewardName} for ${pointsRequired}. This feature will be implemented soon!`);
        });
    });

    // Add hover effect to reward cards
    const rewardCards = document.querySelectorAll('.reward-card');
    rewardCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.05)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
        });
    });
});

LoadComponent('../components/header.html', 'header-placeholder');
LoadComponent('../components/footer.html', 'footer-placeholder');