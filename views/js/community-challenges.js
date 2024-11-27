document.addEventListener('DOMContentLoaded', () => {
    const joinButtons = document.querySelectorAll('.join-btn');
    const createChallengeBtn = document.getElementById('createChallengeBtn');
    const challengeModal = document.getElementById('challengeModal');
    const closeBtn = document.querySelector('.close');
    const challengeForm = document.getElementById('challengeForm');

    // Join challenge functionality
    joinButtons.forEach(button => {
        button.addEventListener('click', () => {
            const challengeName = button.parentElement.querySelector('h3').textContent;
            alert(`You've joined the ${challengeName}! Good luck!`);
            button.textContent = 'Joined';
            button.disabled = true;
        });
    });

    // Modal functionality
    createChallengeBtn.onclick = () => {
        challengeModal.style.display = "block";
    }

    closeBtn.onclick = () => {
        challengeModal.style.display = "none";
    }

    window.onclick = (event) => {
        if (event.target == challengeModal) {
            challengeModal.style.display = "none";
        }
    }

    // Form submission
    challengeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Challenge submitted successfully! Our team will review it shortly.');
        challengeModal.style.display = "none";
        challengeForm.reset();
    });

    // Leaderboard animation
    const leaderboardRows = document.querySelectorAll('.leaderboard tbody tr');
    leaderboardRows.forEach((row, index) => {
        row.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s forwards`;
    });
});